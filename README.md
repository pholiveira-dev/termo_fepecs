# Gerador de termo em JS

Projeto simples em **Node.js + Express + JavaScript** para:

- receber **nome completo**
- receber **semestre** (`7º SEMESTRE` ou `8º SEMESTRE`)
- salvar essas informações em `data/registros.json`
- preencher o **modelo DOCX**
- gerar o arquivo final em **PDF**

## Estrutura

```bash
termo-js-completo/
├── data/
│   └── registros.json
├── output/
├── public/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── templates/
│   └── termo_template.docx
├── package.json
├── README.md
└── server.js
```

## Requisitos

- Node.js 18 ou superior
- LibreOffice instalado no sistema

No Linux/Ubuntu, caso o LibreOffice não esteja instalado:

```bash
sudo apt update
sudo apt install libreoffice -y
```

## Instalação

Dentro da pasta do projeto, rode:

```bash
npm install
```

## Execução

```bash
npm start
```

Depois, acesse no navegador:

```bash
http://localhost:3000
```

## Como funciona

O arquivo `templates/termo_template.docx` já está preparado com os placeholders:

- `{NOME_COMPLETO}`
- `{SEMESTRE}`

O backend substitui esses campos e converte o `.docx` final para `.pdf` usando o LibreOffice em modo headless.

## Observação importante

Como o documento precisa permanecer com **3 páginas**, o mais seguro é:

- manter o template exatamente como está
- alterar apenas nome e semestre
- testar nomes muito longos

Se algum nome extremamente grande empurrar linha ou quebrar paginação, você pode:

- reduzir levemente a fonte apenas naquele trecho do template
- abreviar nomes compostos muito extensos, caso a sua regra institucional permita

## Arquivos gerados

- Os PDFs finais ficam em `output/`
- Os registros ficam em `data/registros.json`

## Rota principal

### `POST /gerar-termo`

Body JSON:

```json
{
  "nomeCompleto": "PEDRO HENRIQUE DE OLIVEIRA ALVES",
  "semestre": "8º SEMESTRE"
}
``
