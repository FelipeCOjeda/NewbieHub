// heuristic.js — fallback local (sem IA) usado quando o Ollama está
// desabilitado ou falha. É a mesma heurística por palavra-chave que o
// MVP original rodava no navegador.
function explainRepo({ data, readme = '' }) {
  const text = [data.name, data.description, (data.topics || []).join(' '), String(readme).slice(0, 5000)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let result;
  if (/wallet|carteira|seed|bitcoin wallet/.test(text)) {
    result = {
      summary: 'Este projeto parece ser um software ligado a carteira de ativos digitais.',
      purpose: 'Ajudar a usar ou gerenciar uma carteira.',
      audience: 'Pode servir a usuários finais, mas exige cuidado extra por envolver dados sensíveis.',
      difficulty: 'Intermediário',
      next: 'Leia primeiro as instruções oficiais e nunca cole sua seed em sites.',
    };
  } else if (/library|sdk|framework|api client|package|module/.test(text)) {
    result = {
      summary: 'Este projeto parece ser uma peça usada por programadores para construir outros programas.',
      purpose: 'Fornecer funções que outros softwares podem reutilizar.',
      audience: 'Se você só queria instalar um aplicativo, provavelmente este não é o arquivo que procura.',
      difficulty: 'Avançado',
      next: 'Procure a aplicação que usa esta biblioteca ou leia a documentação para desenvolvedores.',
    };
  } else if (/cli|command.line|terminal|shell/.test(text)) {
    result = {
      summary: 'Este projeto parece ser uma ferramenta usada por comandos de texto no computador.',
      purpose: 'Executar tarefas através do terminal.',
      audience: 'É mais indicado para quem aceita aprender alguns comandos.',
      difficulty: 'Intermediário a avançado',
      next: 'Comece pela seção de instalação da documentação oficial.',
    };
  } else {
    result = {
      summary: `Este é o projeto "${data.name}". ${data.description || 'Ele publica código e documentação abertos no GitHub.'}`,
      purpose: 'Executar a função descrita pelos próprios desenvolvedores do projeto.',
      audience: 'Pode ser útil se a descrição acima corresponde ao que você está procurando.',
      difficulty: 'Depende da forma de instalação',
      next: 'Confira se existe uma versão pronta para o seu sistema e leia as instruções oficiais.',
    };
  }
  return {
    ...result,
    uncertain: true,
    uncertainReason: 'Gerado por heurística local (sem IA), pode estar impreciso — leia o README original.',
  };
}

module.exports = { explainRepo };
