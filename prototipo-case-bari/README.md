# Protótipo – Central de Documentos (Case Bari)

Protótipo simplificado do motor de OCR/IA do Middle Office do Banco Bari.
Stack: **React + Vite + TypeScript**. Tudo roda no navegador (sem backend) —
o OCR (Tesseract.js) e a análise de qualidade são locais, alinhado à RNF de LGPD.

## Como rodar

Requisito: Node.js 18+ (https://nodejs.org).

```powershell
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (http://localhost:5173).

## Funcionalidades implementadas (passos 1 a 7)

- **F01** Tela principal no estilo do Figma (tema escuro/azul, header Bari, chips).
- **F02** Checklist dinâmico por categoria (Identificação, Renda, Imóvel) com status por item.
- **F03** Upload por item (botão Enviar) **+ drag-and-drop em lote** — arraste vários arquivos e a IA classifica e distribui (RF02/RF03).
- **F04** Validação de formato (PDF/JPG/PNG) e tamanho (≤ 10 MB).
- **F05** Validação de qualidade da imagem: nitidez (variância do Laplaciano), resolução mínima (menor lado ≥ 800px), brilho e pixels estourados (flash/reflexo). PDF é renderizado com pdf.js e analisado igual.
- **F06** OCR (Tesseract.js, `por`) com **score de confiança**: ≥ 80% validado; < 80% vai para **Revisão Middle** (RF05).
- **F07** Classificação automática por palavras-chave (CNH, RG, CPF, certidão, residência, holerite, extrato, IR/recibo, IPTU, matrícula) + renomeação no padrão `TIPO_CPF_NOME_AAAAMMDD.pdf`.
- **F08** Extração de dados: CPF (com validação de dígitos), nomes, datas e valores (R$).
- **F09** Regras de negócio: residência ≤ 90 dias; 3 meses fechados de renda; recibo de entrega do IR; idade de emissão do RG; CNH; IPTU (metragem/inscrição); ônus da matrícula (alienação fiduciária/hipoteca → Portabilidade/IQ; HIS → recusa).
- **F10** Cruzamento de titularidade: documento de terceiro é bloqueado (RF07).
- **F11** Resumo do envio e barras de progresso dinâmicos.
- **F12** Painel de pendências com **mensagem pronta para copiar e enviar ao cliente**.
- **F13** Enviar documentos (bloqueado com pendências ❌) e Salvar rascunho.

## Ajustes em relação ao Figma (conforme escopo do case)

- Textos voltados ao **Consultor** (o cliente não acessa a plataforma).
- Comprovante de residência movido para **Identificação**.
- Extrato bancário incluído em **Renda** (3 meses fechados).
- "Proposta ou contrato" removido (fora dos 7 documentos do case).
- CPF opcional (só é exigido se o RG não contiver).

## Fora do escopo

Integração Salesforce, backend, autenticação, cartórios/Plexus (RF09), detecção de fraude, KYC e demais documentos do relatório de políticas.