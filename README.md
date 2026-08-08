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

Baixe o arquivo `index.html` e abra no navegador.

Não há backend no MVP atual.

## Limitações atuais

A análise ainda usa heurísticas no navegador. A evolução planejada é ter um motor de análise que considere em conjunto README, documentação, releases, estrutura do projeto, issues e mudanças relevantes, produzindo uma explicação nova escrita para leigos — e não apenas resumindo o README.

A API pública do GitHub também possui limites de requisição quando usada sem autenticação.

## Segurança

O NewbieHub **não é um selo de segurança** e não deve afirmar que determinado software é “seguro” apenas por métricas públicas.

O objetivo é apresentar evidências, contexto, riscos e pontos de atenção de forma compreensível.

> Nunca informe seed, chave privada, passphrase, senha, token ou qualquer credencial ao NewbieHub.

## Status

🚧 MVP / prova de conceito em desenvolvimento.

## Autor

Projeto criado por [Felipe Ojeda](https://github.com/FelipeCOjeda).
