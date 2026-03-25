const form = document.getElementById("termoForm");
const nomeInput = document.getElementById("nomeCompleto");
const semestreInput = document.getElementById("semestre");
const mensagem = document.getElementById("mensagem");
const submitBtn = document.getElementById("submitBtn");

let arquivoGerado = null;

function limparMensagem() {
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function criarUIFeedback() {
  if (document.getElementById("termoOverlay")) return;

  const style = document.createElement("style");
  style.textContent = `
    .termo-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.68);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 9999;
      animation: termoFadeIn 0.25s ease;
    }

    .termo-overlay.show {
      display: flex;
    }

    .termo-modal {
      width: 100%;
      max-width: 520px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
      padding: 28px;
      color: #0f172a;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.7);
    }

    .termo-modal::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(37, 99, 235, 0.08), transparent 35%),
        linear-gradient(315deg, rgba(124, 58, 237, 0.06), transparent 30%);
      pointer-events: none;
    }

    .termo-modal > * {
      position: relative;
      z-index: 1;
    }

    .termo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.08);
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .termo-title {
      margin: 0 0 10px;
      font-size: 1.7rem;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .termo-text {
      margin: 0;
      color: #64748b;
      line-height: 1.65;
      font-size: 0.98rem;
    }

    .termo-loading-wrap {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      margin-top: 20px;
      margin-bottom: 18px;
    }

    .termo-spinner {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: 3px solid rgba(37, 99, 235, 0.18);
      border-top-color: #2563eb;
      animation: termoSpin 0.8s linear infinite;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .termo-progress {
      width: 100%;
      height: 12px;
      background: rgba(37, 99, 235, 0.10);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 18px;
    }

    .termo-progress-bar {
      width: 38%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #2563eb, #7c3aed);
      animation: termoLoadingMove 1.15s ease-in-out infinite;
    }

    .termo-success-icon {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      font-size: 28px;
      font-weight: 900;
      box-shadow: 0 18px 30px rgba(34, 197, 94, 0.22);
      margin-bottom: 16px;
    }

    .termo-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 22px;
    }

    .termo-btn {
      border: none;
      border-radius: 16px;
      padding: 14px 18px;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
    }

    .termo-btn:hover {
      transform: translateY(-1px);
    }

    .termo-btn-primary {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
    }

    .termo-btn-secondary {
      background: #eef2ff;
      color: #1e3a8a;
    }

    .termo-file-box {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .termo-hidden {
      display: none;
    }

    @keyframes termoSpin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes termoLoadingMove {
      0% {
        transform: translateX(-120%);
      }
      100% {
        transform: translateX(320%);
      }
    }

    @keyframes termoFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "termoOverlay";
  overlay.className = "termo-overlay";
  overlay.innerHTML = `
    <div class="termo-modal">
      <div id="termoLoadingState">
        <div class="termo-badge">Processando documento</div>
        <h2 class="termo-title">Gerando seu PDF</h2>
        <p class="termo-text">
          Estamos preparando o arquivo com os dados informados. Isso leva só alguns instantes.
        </p>

        <div class="termo-loading-wrap">
          <div class="termo-spinner" aria-hidden="true"></div>
          <div>
            <strong>Aguarde um momento...</strong>
            <p class="termo-text" style="margin-top: 6px;">
              Validando informações e montando o documento final para download.
            </p>
          </div>
        </div>

        <div class="termo-progress" aria-hidden="true">
          <div class="termo-progress-bar"></div>
        </div>
      </div>

      <div id="termoSuccessState" class="termo-hidden">
        <div class="termo-success-icon">✓</div>
        <div class="termo-badge">Documento pronto</div>
        <h2 class="termo-title">Seu PDF foi gerado com sucesso</h2>
        <p class="termo-text">
          O arquivo está pronto para ser baixado. Clique no botão abaixo para salvar o documento.
        </p>

        <div id="termoFileBox" class="termo-file-box"></div>

        <div class="termo-actions">
          <button id="btnBaixarArquivo" type="button" class="termo-btn termo-btn-primary">
            Baixar arquivo
          </button>
          <button id="btnFecharOverlay" type="button" class="termo-btn termo-btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const btnBaixarArquivo = document.getElementById("btnBaixarArquivo");
  const btnFecharOverlay = document.getElementById("btnFecharOverlay");

  btnBaixarArquivo.addEventListener("click", () => {
    if (!arquivoGerado) return;

    const link = document.createElement("a");
    link.href = arquivoGerado.url;
    link.download = arquivoGerado.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  btnFecharOverlay.addEventListener("click", () => {
    fecharOverlay();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      fecharOverlay();
    }
  });
}

function abrirOverlayLoading() {
  criarUIFeedback();

  const overlay = document.getElementById("termoOverlay");
  const loadingState = document.getElementById("termoLoadingState");
  const successState = document.getElementById("termoSuccessState");

  loadingState.classList.remove("termo-hidden");
  successState.classList.add("termo-hidden");
  overlay.classList.add("show");
}

function mostrarOverlaySucesso(nomeArquivo) {
  const loadingState = document.getElementById("termoLoadingState");
  const successState = document.getElementById("termoSuccessState");
  const fileBox = document.getElementById("termoFileBox");

  fileBox.textContent = `Arquivo pronto: ${nomeArquivo}`;

  loadingState.classList.add("termo-hidden");
  successState.classList.remove("termo-hidden");
}

function fecharOverlay() {
  const overlay = document.getElementById("termoOverlay");
  if (overlay) {
    overlay.classList.remove("show");
  }
}

nomeInput.addEventListener("input", () => {
  nomeInput.value = nomeInput.value.toLocaleUpperCase("pt-BR");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparMensagem();

  const nomeCompleto = nomeInput.value.trim().toLocaleUpperCase("pt-BR");
  const semestre = semestreInput.value;

  if (!nomeCompleto) {
    mostrarMensagem("Informe o nome completo.", "error");
    return;
  }

  if (!semestre) {
    mostrarMensagem("Selecione o semestre.", "error");
    return;
  }

  if (arquivoGerado?.url) {
    URL.revokeObjectURL(arquivoGerado.url);
    arquivoGerado = null;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Gerando PDF...";
  abrirOverlayLoading();

  try {
    const response = await fetch("/gerar-termo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nomeCompleto, semestre }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.erro || "Erro ao gerar o termo.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const nomeArquivo = `${nomeCompleto} - TCE FEPECS.pdf`;

    arquivoGerado = {
      url,
      nomeArquivo,
    };

    mostrarOverlaySucesso(nomeArquivo);
    mostrarMensagem(
      "PDF gerado com sucesso. Agora é só baixar o arquivo.",
      "success",
    );
    form.reset();
  } catch (error) {
    fecharOverlay();
    mostrarMensagem(error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Gerar termo";
  }
});
