const form = document.getElementById('termoForm');
const nomeInput = document.getElementById('nomeCompleto');
const semestreInput = document.getElementById('semestre');
const mensagem = document.getElementById('mensagem');
const submitBtn = document.getElementById('submitBtn');

function limparMensagem() {
  mensagem.textContent = '';
  mensagem.className = 'mensagem';
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

nomeInput.addEventListener('input', () => {
  nomeInput.value = nomeInput.value.toLocaleUpperCase('pt-BR');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  limparMensagem();

  const nomeCompleto = nomeInput.value.trim().toLocaleUpperCase('pt-BR');
  const semestre = semestreInput.value;

  if (!nomeCompleto) {
    mostrarMensagem('Informe o nome completo.', 'error');
    return;
  }

  if (!semestre) {
    mostrarMensagem('Selecione o semestre.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Gerando PDF...';

  try {
    const response = await fetch('/gerar-termo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nomeCompleto, semestre })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.erro || 'Erro ao gerar o termo.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TERMO - ${nomeCompleto}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    mostrarMensagem('PDF gerado com sucesso.', 'success');
    form.reset();
  } catch (error) {
    mostrarMensagem(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Gerar termo';
  }
});
