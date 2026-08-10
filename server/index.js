require('dotenv').config();
const path = require('path');
const express = require('express');
const { fetchRepoData } = require('./github');
const ollama = require('./ollama');
const heuristic = require('./heuristic');

const PORT = parseInt(process.env.PORT || '8420', 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_PER_HOUR || '30', 10);
const RATE_WINDOW_MS = 60 * 60 * 1000;
const usage = new Map(); // ip -> [timestamps]

function checkRateLimit(ip) {
  const now = Date.now();
  const hits = (usage.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    usage.set(ip, hits);
    return false;
  }
  hits.push(now);
  usage.set(ip, hits);
  return true;
}

function activitySignal(data) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(data.pushed_at)) / 864e5));
  const label = days <= 30 ? 'Atividade recente' : days <= 180 ? 'Alguma atividade' : 'Pouca atividade recente';
  return { days, label };
}

function buildSignals(data, readme) {
  const signals = [];
  const { days } = activitySignal(data);
  if (data.archived) {
    signals.push({ kind: 'warn', title: 'Projeto arquivado', text: 'O próprio GitHub indica que o projeto foi arquivado.' });
  } else {
    signals.push({
      kind: days <= 90 ? 'ok' : 'warn',
      title: days <= 90 ? 'Recebeu mudanças recentemente' : 'Mudanças pouco recentes',
      text: 'Atividade ajuda a entender manutenção, mas não garante qualidade ou segurança.',
    });
  }
  signals.push({
    kind: 'info',
    title: `${data.open_issues_count} issues abertas`,
    text: 'Issue pode ser bug, dúvida, sugestão ou tarefa. O número sozinho não mede qualidade.',
  });
  if (data.fork) {
    signals.push({ kind: 'warn', title: 'Este repositório é um fork', text: 'Ele nasceu como cópia de outro projeto. Vale conhecer o projeto original.' });
  }
  if (!data.license) {
    signals.push({ kind: 'warn', title: 'Licença não identificada', text: 'Não assuma que código público significa uso sem regras.' });
  }
  if (/wallet|seed|private key|chave privada/i.test(`${data.description || ''} ${String(readme).slice(0, 10000)}`)) {
    signals.push({ kind: 'warn', title: 'Pode lidar com segredos', text: 'Nunca informe seed, chave privada ou passphrase a uma ferramenta de análise.' });
  }
  return signals;
}

function explainFileName(name) {
  const n = name.toLowerCase();
  if (/\.exe$|\.msi$/.test(n)) return 'Programa/instalador para Windows';
  if (/\.dmg$|\.pkg$/.test(n)) return 'Programa/instalador para macOS';
  if (/\.apk$/.test(n)) return 'Aplicativo Android';
  if (/\.deb$/.test(n)) return 'Pacote para Debian/Ubuntu';
  if (/sha256|checksum/.test(n)) return 'Arquivo para verificar integridade — não é o programa';
  if (/\.sig$|\.asc$/.test(n)) return 'Assinatura digital — serve para conferir autenticidade';
  if (/source|src/.test(n)) return 'Código-fonte — normalmente não é o arquivo que um leigo quer instalar';
  return 'Arquivo publicado pelos desenvolvedores';
}

const ALLOWED_ORIGIN_PATTERN = /^https:\/\/([\w-]+\.)?(github\.io|newbiehub\.st)$/;

const app = express();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGIN_PATTERN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/analyze', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Muitas análises em pouco tempo. Tente novamente daqui a alguns minutos.' });
  }

  const repoInput = req.body?.repo;
  if (!repoInput || typeof repoInput !== 'string') {
    return res.status(400).json({ error: 'Informe o link ou "dono/repositorio".' });
  }

  try {
    const { owner, repo, data, release, readme } = await fetchRepoData(repoInput);
    const explanation = (await ollama.explainRepo({ owner, repo, data, readme })) || heuristic.explainRepo({ data, readme });
    const { days } = activitySignal(data);

    res.json({
      fullName: data.full_name,
      htmlUrl: data.html_url,
      explanation,
      signals: buildSignals(data, readme),
      activity: { days },
      stars: data.stargazers_count,
      license: data.license?.spdx_id || null,
      defaultBranch: data.default_branch,
      language: data.language || null,
      forks: data.forks_count,
      release: release
        ? {
            name: release.name || release.tag_name,
            publishedAt: release.published_at,
            assets: (release.assets || []).slice(0, 12).map((a) => ({
              name: a.name,
              url: a.browser_download_url,
              explanation: explainFileName(a.name),
            })),
          }
        : null,
      readme,
      usedAi: ollama.isEnabled(),
    });
  } catch (e) {
    const status = e.code === 'NOT_FOUND' ? 404 : e.code === 'RATE_LIMITED' ? 429 : 502;
    res.status(status).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`NewbieHub server rodando em http://localhost:${PORT} (Ollama ${ollama.isEnabled() ? 'ativo' : 'desativado'})`);
});
