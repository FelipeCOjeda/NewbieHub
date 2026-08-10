// ollama.js — usa o Ollama Cloud para traduzir um repositório do GitHub
// em uma explicação simples, seguindo os princípios do NewbieHub.
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:120b';
const OLLAMA_URL = 'https://ollama.com/api/chat';

function isEnabled() {
  return Boolean(OLLAMA_API_KEY);
}

const SYSTEM_PROMPT = `Você é o motor de análise do NewbieHub, um site que explica repositórios do GitHub para pessoas sem nenhum conhecimento técnico.

Princípios que você deve seguir SEMPRE:
1. Explicar antes de mostrar dado técnico. Nada de jargão sem explicação.
2. Assuma que quem lê nunca usou Git, nunca programou e não sabe o que é GitHub.
3. Nunca confunda popularidade (stars, forks) com segurança ou qualidade.
4. NUNCA invente certeza. Se o README e os metadados não forem suficientes para responder com confiança, diga isso claramente em vez de adivinhar.
5. Nunca peça nem sugira que o usuário informe seed, chave privada, senha ou token.
6. Responda em português brasileiro, direto, sem enrolação.

Você receberá o nome do repositório, descrição, tópicos, linguagem principal e um trecho do README.
Responda APENAS com um objeto JSON válido (sem markdown, sem texto fora do JSON), com exatamente estas chaves:
{
  "summary": "uma frase curta (máx ~25 palavras) dizendo o que o projeto é, para um leigo",
  "purpose": "para que ele serve, em poucas palavras",
  "audience": "quem deveria (ou não) usar isso",
  "difficulty": "Fácil | Intermediário | Avançado | Depende da forma de instalação",
  "next": "o que a pessoa deveria fazer agora, como próximo passo prático",
  "uncertain": true ou false — true se as informações disponíveis não foram suficientes para uma explicação confiável,
  "uncertain_reason": "se uncertain=true, explique em uma frase por que não dá para ter certeza; caso contrário string vazia"
}`;

async function chat(messages, { timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Ollama HTTP ${resp.status}: ${text.slice(0, 300)}`);
    }
    const data = await resp.json();
    return (data.message && data.message.content) || '';
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('Resposta do Ollama não trouxe JSON.');
  return JSON.parse(raw.slice(start, end + 1));
}

const REQUIRED_FIELDS = ['summary', 'purpose', 'audience', 'difficulty', 'next'];

/**
 * Gera a explicação em linguagem simples para um repositório.
 * Retorna null se o Ollama estiver desabilitado ou a chamada falhar —
 * o caller deve cair para a heurística local nesse caso.
 */
async function explainRepo({ owner, repo, data, readme }) {
  if (!isEnabled()) return null;
  const context = [
    `Repositório: ${owner}/${repo}`,
    `Descrição: ${data.description || '(sem descrição)'}`,
    `Tópicos: ${(data.topics || []).join(', ') || '(nenhum)'}`,
    `Linguagem principal: ${data.language || '(não informada)'}`,
    `É fork: ${data.fork ? 'sim' : 'não'}`,
    `Arquivado: ${data.archived ? 'sim' : 'não'}`,
    `Trecho do README:\n${String(readme || '').slice(0, 6000) || '(README não encontrado)'}`,
  ].join('\n\n');

  try {
    const content = await chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: context },
    ]);
    const parsed = extractJson(content);
    for (const field of REQUIRED_FIELDS) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
        throw new Error(`Campo obrigatório ausente na resposta do Ollama: ${field}`);
      }
    }
    return {
      summary: parsed.summary.trim(),
      purpose: parsed.purpose.trim(),
      audience: parsed.audience.trim(),
      difficulty: parsed.difficulty.trim(),
      next: parsed.next.trim(),
      uncertain: Boolean(parsed.uncertain),
      uncertainReason: typeof parsed.uncertain_reason === 'string' ? parsed.uncertain_reason.trim() : '',
    };
  } catch (e) {
    console.warn(`[ollama] falhou, caindo para heurística local: ${e.message}`);
    return null;
  }
}

module.exports = { isEnabled, explainRepo };
