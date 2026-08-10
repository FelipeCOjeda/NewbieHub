# NewbieHub

**GitHub explicado para quem está começando.**

O NewbieHub transforma um repositório público do GitHub em uma explicação didática para pessoas com pouco ou nenhum conhecimento técnico.

A ideia não é criar um “GitHub mais bonito”. O objetivo é funcionar como uma **camada de tradução entre projetos open source e pessoas comuns**.

## Princípios do projeto

1. **Explicar antes de mostrar.** Dados técnicos só aparecem depois de o usuário entender por que eles importam.
2. **Linguagem humana antes do jargão.** Termos como commit, release, branch, issue e checksum são explicados em contexto.
3. **Assumir zero conhecimento prévio.** O usuário não precisa saber Git, programação ou como o GitHub funciona.
4. **Informação em camadas.** Primeiro vem a explicação simples; detalhes técnicos ficam disponíveis para quem quiser aprofundar.
5. **Nunca confundir popularidade com segurança.** Stars, forks e atividade são sinais, não garantias.
6. **Não inventar certeza.** Quando não houver evidência suficiente para recomendar um arquivo, versão ou conclusão, o NewbieHub deve dizer claramente que não sabe.
7. **Segurança por padrão.** Nunca solicitar seed, chave privada, passphrase, senha, token ou qualquer outro segredo.

## MVP atual

O MVP roda diretamente no navegador e consulta repositórios públicos pela API do GitHub.

Ele tenta responder, em linguagem simples:

- O que é este projeto?
- Para que ele serve?
- Isso é para mim?
- É fácil de usar?
- Em quais sistemas ele funciona?
- O projeto parece estar recebendo manutenção?
- Existe uma versão pronta para baixar?
- Qual arquivo provavelmente é o correto para meu sistema?
- O que significam stars, issues, forks, releases, commits, branches, checksums e assinaturas digitais?

## Rodando localmente

**Modo simples (sem IA):** baixe o arquivo `index.html` e abra no navegador. Sem backend, a explicação usa uma heurística local por palavra-chave — mais rápida de rodar, mas mais rasa e sujeita a erro.

**Com o motor de análise via IA (recomendado):**

```
cd server
npm install
cp .env.example .env   # preencha OLLAMA_API_KEY (ollama.com) e, opcionalmente, GITHUB_TOKEN
npm start
```

Abra `http://localhost:8460` (ou a porta definida em `PORT`). O backend serve o próprio `index.html`, busca os dados do repositório no GitHub e usa o [Ollama Cloud](https://ollama.com) para gerar a explicação em linguagem simples — seguindo os mesmos princípios listados acima (nunca inventar certeza, nunca confundir popularidade com segurança etc.), em vez de casar palavras-chave.

Se `OLLAMA_API_KEY` não for configurada, ou se a chamada à IA falhar por qualquer motivo, o backend cai automaticamente para a heurística local — o site nunca fica fora do ar por causa da IA. O frontend também tem esse mesmo fallback caso o backend esteja fora do ar (ex.: quando `index.html` é aberto direto do disco, sem servidor).

## Motor de análise

A heurística por palavra-chave (`profile()` no `index.html`, espelhada em `server/heuristic.js`) foi o motor original do MVP. Ela ainda existe como rede de segurança, mas o motor principal agora é o Ollama Cloud (`server/ollama.js`): ele recebe descrição, tópicos, linguagem e um trecho do README, e é instruído a seguir os princípios do projeto — inclusive a dizer explicitamente quando não há evidência suficiente para uma explicação confiável (`uncertain: true`), em vez de arriscar um palpite.

## Limitações atuais

A API pública do GitHub possui limites de requisição quando usada sem autenticação (60/hora por IP); configure `GITHUB_TOKEN` no backend para subir esse limite para 5000/hora.

## Segurança

O NewbieHub **não é um selo de segurança** e não deve afirmar que determinado software é “seguro” apenas por métricas públicas.

O objetivo é apresentar evidências, contexto, riscos e pontos de atenção de forma compreensível.

> Nunca informe seed, chave privada, passphrase, senha, token ou qualquer credencial ao NewbieHub.

## Status

🚧 MVP / prova de conceito em desenvolvimento.

## Autor

Projeto criado por [Felipe Ojeda](https://github.com/FelipeCOjeda).
