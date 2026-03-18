const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'termo_template.docx');
const OUTPUT_DIR = path.join(ROOT, 'output');
const DATA_DIR = path.join(ROOT, 'data');
const REGISTROS_PATH = path.join(DATA_DIR, 'registros.json');

app.use(express.static(PUBLIC_DIR));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function normalizarEspacos(valor) {
  return valor.replace(/\s+/g, ' ').trim();
}

function formatarNomeUppercase(nome) {
  return normalizarEspacos(nome).toLocaleUpperCase('pt-BR');
}

function validarSemestre(semestre) {
  const permitidos = ['7º SEMESTRE', '8º SEMESTRE'];
  return permitidos.includes(semestre);
}

function nomeSeguroArquivo(nome) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

async function garantirEstrutura() {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  await fsp.mkdir(DATA_DIR, { recursive: true });

  try {
    await fsp.access(REGISTROS_PATH);
  } catch {
    await fsp.writeFile(REGISTROS_PATH, '[]', 'utf8');
  }
}

async function salvarRegistro({ nomeCompleto, semestre, nomeArquivo }) {
  const conteudo = await fsp.readFile(REGISTROS_PATH, 'utf8');
  const registros = JSON.parse(conteudo);

  registros.push({
    nomeCompleto,
    semestre,
    nomeArquivo,
    criadoEm: new Date().toISOString()
  });

  await fsp.writeFile(REGISTROS_PATH, JSON.stringify(registros, null, 2), 'utf8');
}

async function gerarDocx({ nomeCompleto, semestre, destinoDocx }) {
  const templateBinario = await fsp.readFile(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(templateBinario);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  doc.render({
    NOME_COMPLETO: nomeCompleto,
    SEMESTRE: semestre
  });

  const buffer = doc.getZip().generate({ type: 'nodebuffer' });
  await fsp.writeFile(destinoDocx, buffer);
}

function converterDocxParaPdf(caminhoDocx, pastaSaida) {
  return new Promise((resolve, reject) => {
    execFile(
      'soffice',
      [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        pastaSaida,
        caminhoDocx
      ],
      { timeout: 60000 },
      (erro, stdout, stderr) => {
        if (erro) {
          return reject(new Error(`Falha ao converter para PDF. ${stderr || stdout || erro.message}`));
        }
        resolve();
      }
    );
  });
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/gerar-termo', async (req, res) => {
  const nomeRecebido = typeof req.body.nomeCompleto === 'string' ? req.body.nomeCompleto : '';
  const semestreRecebido = typeof req.body.semestre === 'string' ? req.body.semestre : '';

  const nomeCompleto = formatarNomeUppercase(nomeRecebido);
  const semestre = normalizarEspacos(semestreRecebido).toLocaleUpperCase('pt-BR');

  if (!nomeCompleto) {
    return res.status(400).json({ erro: 'Informe o nome completo.' });
  }

  if (nomeCompleto.length < 8) {
    return res.status(400).json({ erro: 'Informe um nome completo válido.' });
  }

  if (!validarSemestre(semestre)) {
    return res.status(400).json({ erro: 'Selecione um semestre válido.' });
  }

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'termo-'));

  try {
    const baseNome = nomeSeguroArquivo(nomeCompleto);
    const nomeArquivo = `${baseNome}-${semestre.replace(/\s+/g, '_')}`;
    const caminhoDocx = path.join(tmpDir, `${nomeArquivo}.docx`);
    const caminhoPdf = path.join(OUTPUT_DIR, `${nomeArquivo}.pdf`);

    await gerarDocx({ nomeCompleto, semestre, destinoDocx: caminhoDocx });
    await converterDocxParaPdf(caminhoDocx, OUTPUT_DIR);
    await salvarRegistro({ nomeCompleto, semestre, nomeArquivo: `${nomeArquivo}.pdf` });

    res.download(caminhoPdf, `TERMO - ${nomeCompleto}.pdf`);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível gerar o termo em PDF.' });
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }
});

app.listen(PORT, async () => {
  await garantirEstrutura();
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
