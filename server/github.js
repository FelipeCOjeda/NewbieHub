// github.js — busca metadados públicos de um repositório no GitHub.
const API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function parseRepo(input) {
  let v = String(input || '').trim().replace(/\/$/, '').replace(/\.git$/, '');
  if (/^[\w.-]+\/[\w.-]+$/.test(v)) {
    const [owner, repo] = v.split('/');
    return { owner, repo };
  }
  let url;
  try {
    url = new URL(v.startsWith('http') ? v : `https://${v}`);
  } catch {
    throw new Error('Link inválido. Cole a URL de um repositório público do GitHub.');
  }
  if (!/github\.com$/i.test(url.hostname)) {
    throw new Error('Cole o link de um repositório público do GitHub.');
  }
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error('Cole o link de um repositório público do GitHub.');
  }
  return { owner: parts[0], repo: parts[1] };
}

async function ghFetch(path, { raw = false } = {}) {
  const headers = {
    Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const resp = await fetch(`${API}${path}`, { headers });
  if (resp.status === 404) return null;
  if (resp.status === 403 || resp.status === 429) {
    const remaining = resp.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      const err = new Error('Limite de requisições do GitHub atingido. Tente novamente em alguns minutos.');
      err.code = 'RATE_LIMITED';
      throw err;
    }
    throw new Error('O GitHub recusou a requisição.');
  }
  if (!resp.ok) throw new Error('Não consegui consultar o GitHub agora.');
  return raw ? resp.text() : resp.json();
}

async function fetchRepoData(input) {
  const { owner, repo } = parseRepo(input);
  const data = await ghFetch(`/repos/${owner}/${repo}`);
  if (!data) {
    const err = new Error('Repositório não encontrado.');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const [release, readme] = await Promise.all([
    ghFetch(`/repos/${owner}/${repo}/releases/latest`),
    ghFetch(`/repos/${owner}/${repo}/readme`, { raw: true }),
  ]);
  return { owner, repo, data, release, readme: readme || '' };
}

module.exports = { parseRepo, fetchRepoData };
