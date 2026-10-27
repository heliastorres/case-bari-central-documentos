# Protótipo – Central de OCR e Inteligência de Documentos (Case Bari)

Pré-requisitos funcionais do protótipo, baseados no Figma (frame **"CPF"**, node 20-53) e nas regras da skill `case-bari`.
Objetivo: um protótipo **simples e funcional**, com teste de OCR, validação de nitidez e regras básicas, construído passo a passo.

---

## 1. O que existe no Figma (tela "Envie os documentos do seu empréstimo imobiliário")

| Bloco | Conteúdo |
|-------|----------|
| Header | Logo Bari "Empréstimo imobiliário", chips "Envio dos documentos" e "Precisa de ajuda?" |
| Título | Selo "Etapa 2 de 4 · Documentação", título e subtítulo |
| Orientação de envio | Arquivos legíveis, sem cortes · PDF/JPG/PNG até 10 MB · aviso de pendências · prazo de 3 dias úteis |
| Progresso da análise | 4 etapas: Cadastro (100%), Documentação (50%), Avaliação (0%), Contrato (0%) + "3 de 6 concluídos" |
| Resumo do envio (lateral esq.) | Contagem por categoria (Identificação 1 de 2, Renda 2 de 3, Imóvel 0 de 2), % concluído, lista de enviados com botão "Ver" |
| Identificação | RG ou CNH · CPF · Certidão de estado civil (cada item com botão "Enviar" e barra de % da categoria) |
| Renda | Holerite ou contracheque (últimos 3 meses) · Declaração de IR · Comprovante de residência |
| Imóvel | Escritura ou matrícula · Proposta ou contrato · IPTU (metragem, inscrição e dados do imóvel) |
| Importante (lateral dir.) | Lista pode variar · não usar canais abertos · aprovação depende da análise |
| Rodapé | "Pronto para enviar?" com **Enviar documentos** e **Salvar rascunho** |

### 1.1 Ajustes sugeridos no layout para seguir o escopo do case

| # | No Figma | Regra do case | Sugestão |
|---|----------|---------------|----------|
| A1 | Textos falam com o **cliente** ("seu empréstimo", "nossa equipe entrará em contato") | O cliente **não acessa** a plataforma; quem usa é o Consultor ou o Middle | Mudar os textos para o Consultor (ex.: "Envie os documentos do cliente") |
| A2 | Comprovante de residência fica em **Renda** | É um documento **pessoal** | Mover para **Identificação** |
| A3 | Falta o **extrato bancário** | Renda = 3 meses fechados (**extrato e holerite**) | Incluir o item "Extrato bancário (3 meses)" em Renda |
| A4 | "Declaração de IR – último exercício" | Precisa do **recibo de entrega** | Mudar o texto de apoio para "com recibo de entrega" |
| A5 | "Escritura ou matrícula" | O documento é a **matrícula** | Mudar para "Matrícula do imóvel" |
| A6 | "Proposta ou contrato" em Imóvel | **Fora do escopo** (não está entre os 7 documentos) | Remover ou marcar como opcional/fora do escopo |
| A7 | Item "CPF" separado | A regra é RG + CPF **ou** CNH | O CPF só é obrigatório se o documento enviado for o RG (a CNH já tem o CPF) |

---

## 2. Checklist que o protótipo vai usar

| Categoria | Item | Obrigatório |
|-----------|------|-------------|
| Identificação | RG ou CNH (frente e verso) | Sim |
| Identificação | CPF | Só se for RG sem CPF |
| Identificação | Certidão de estado civil | Sim |
| Identificação | Comprovante de residência (≤ 90 dias) | Sim |
| Renda | Holerite (3 meses fechados) | Sim |
| Renda | Extrato bancário (3 meses fechados) | Sim |
| Renda | Declaração de IR + recibo de entrega | Sim |
| Imóvel | IPTU | Sim |
| Imóvel | Matrícula do imóvel | Sim |

---

## 3. Funções do protótipo

Legenda de prioridade: **P1** = essencial (MVP), **P2** = importante, **P3** = desejável.

### F01 – Tela principal fiel ao Figma · P1
- Montar o layout com todos os blocos da seção 1 (tema escuro/azul, cards com efeito "glass").
- Dados do cliente fixos para o teste (nome, CPF, data de nascimento, estado civil), simulando a abertura feita no Salesforce.
- **Pronto quando:** a tela ficar visualmente equivalente ao frame do Figma.

### F02 – Checklist por categoria · P1
- Mostrar os itens da seção 2 agrupados em Identificação, Renda e Imóvel.
- Cada item tem um status: ⬜ Pendente · ⏳ Processando · ✅ Validado · ⚠️ Revisão Middle · ❌ Recusado.
- Cada categoria mostra o contador ("x arquivos") e a barra de % concluída.

### F03 – Upload de arquivos · P1
- Botão **Enviar** em cada item (seleciona o arquivo).
- *(P2)* Área de **drag-and-drop em lote**: o Consultor solta vários arquivos e a IA distribui cada um no item certo (RF02/RF03).
- Pré-visualização do arquivo enviado (botão **Ver**).

### F04 – Validação básica do arquivo · P1
- Aceitar só **PDF, JPG e PNG**.
- Tamanho máximo de **10 MB**.
- Fora da regra → ❌ com o motivo ("Formato não aceito" / "Arquivo acima de 10 MB").

### F05 – Validação de qualidade da imagem (nitidez) · P1
Feita no navegador, antes do OCR:
- **Nitidez:** variância do Laplaciano abaixo do limite → "Imagem desfocada".
- **Resolução mínima:** ex. menor lado < 800 px → "Resolução baixa".
- **Iluminação:** brilho médio muito baixo ou muito alto → "Imagem escura/estourada"; muitos pixels estourados → "Reflexo/flash".
- O resultado aparece como um indicador (ex.: "Nitidez: 72/100").
- Imagem reprovada → ❌ "Envie uma nova foto: nítida, sem flash, documento inteiro".
- PDF: renderizar a 1ª página (pdf.js) e aplicar a mesma análise.

### F06 – OCR com score de confiança · P1
- Ler o texto com **Tesseract.js** (idioma `por`), direto no navegador. Os dados não saem da máquina, o que ajuda na LGPD.
- Usar a confiança média do OCR como **score**:
  - **≥ 80%** → segue para as regras de negócio (aprovação automática);
  - **< 80%** → ⚠️ **Revisão Middle** (fila de exceção).
- Mostrar o texto extraído num painel de detalhes do documento.

### F07 – Classificação automática do documento · P2
- Identificar o tipo do documento por palavras-chave no texto do OCR. Exemplos:
  - "CARTEIRA NACIONAL DE HABILITAÇÃO" → CNH;
  - "REGISTRO GERAL" → RG;
  - "CERTIDÃO DE CASAMENTO" / "NASCIMENTO" → certidão;
  - "RECIBO DE ENTREGA" → recibo do IR;
  - "IPTU" / "INSCRIÇÃO IMOBILIÁRIA" → IPTU;
  - "MATRÍCULA" / "REGISTRO DE IMÓVEIS" → matrícula.
- Se o arquivo foi enviado no item errado → ⚠️ "Este arquivo parece ser um IPTU, não uma Matrícula".
- Renomear o arquivo no padrão sugerido `TIPODOC_CPF_NOME_AAAAMMDD.pdf`.

### F08 – Extração de dados básicos · P2
- Por expressões regulares no texto do OCR: **CPF** (com validação dos dígitos verificadores), **nome**, **datas** (emissão, vencimento, referência) e **valores (R$)**.
- Mostrar os dados extraídos em formato "ficha" (o que seria enviado ao Salesforce).

### F09 – Regras de negócio · P2
| Documento | Regra no protótipo | Resultado se falhar |
|-----------|--------------------|---------------------|
| Comprovante de residência | Data de emissão ≤ 90 dias | ❌ "Comprovante com mais de 90 dias" |
| Holerite / Extrato | 3 meses fechados e seguidos (ex.: em 26/10/2026 → jul, ago e set) | ❌ "Falta o mês X" |
| Extrato | Nato digital (PDF com texto) | ⚠️ "Extrato parece foto/escaneado" |
| Declaração de IR | Ter "recibo de entrega" + CPF igual ao do titular | ❌ "Recibo de entrega ausente" |
| RG | Idade × data de emissão (≤ 25 anos: emissão < 15 anos; > 50 anos: emissão até 25 anos antes da idade atual) | ❌ "RG emitido há muito tempo" |
| CNH | Dentro da validade | ❌ "CNH vencida" |
| IPTU | Ter metragem e inscrição imobiliária | ❌ "IPTU sem metragem/inscrição" |
| Matrícula | Palavras "alienação fiduciária", "hipoteca", "penhora", "HIS" | ⚠️ Ônus encontrado (IQ/Portabilidade) · ❌ HIS = garantia não aceita |

### F10 – Cruzamento de titularidade · P2
- Comparar o nome e o CPF extraídos com os dados do cliente da proposta (tolerando acentos e maiúsculas).
- Certidão ou documento de **outra pessoa** → ❌ "Documento não pertence a nenhum participante da proposta" (RF07).
- *(P3)* Certidão de casamento → identificar o **cônjuge** e sugerir a criação de um participante "Cônjuge".

### F11 – Resumo e progresso dinâmicos · P1
- O card **Resumo do envio** e a barra **Documentação** são atualizados conforme os status.
- "x de y concluídos" é calculado automaticamente.

### F12 – Pendências e mensagem ao cliente · P2
- Lista de pendências com o motivo e a regra aplicada.
- Botão **Copiar mensagem**: texto pronto para o Consultor mandar ao cliente pelo WhatsApp. Ex.: "Olá! Precisamos de um comprovante de residência emitido nos últimos 90 dias…".

### F13 – Enviar documentos / Salvar rascunho · P1
- **Enviar documentos** só fica habilitado sem ❌ em itens obrigatórios. ⚠️ é permitido, porque vai para o Middle.
- Ao enviar, mostrar a confirmação: "Proposta pronta para o Crédito" ou "Documentos em revisão pelo Middle".
- **Salvar rascunho** grava o estado no `localStorage`.

### F14 – Visão Middle e payload Salesforce · P3
- Tela/aba simples com a **fila de exceção** (docs com score < 80%), com as ações Aprovar / Recusar e o registro do operador (auditoria).
- Botão "Ver JSON Salesforce" mostrando o payload simulado (contas, relacionamentos, dados da garantia, anexos renomeados).

---

## 4. Fora do escopo do protótipo
- Integração real com Salesforce, login/autenticação e backend.
- Integração com cartórios/Plexus (RF09) e repositório de links cartorários.
- Detecção de fraude/adulteração e validação em bases externas (Receita, SERASA).
- Documentos fora dos 7 do case (KYC, ficha cadastral, documentos PJ etc.).

---

## 5. Sugestão de stack (simples, sem backend)
- **Vite + React + TypeScript** (ou HTML/JS puro, se preferir).
- **Tesseract.js** para o OCR, **pdf.js** para renderizar PDFs, **Canvas API** para a nitidez (Laplaciano) e o brilho.
- Estado em memória + `localStorage`.

---

## 6. Plano passo a passo
| Passo | Entrega | Funções |
|-------|---------|---------|
| 1 | Projeto criado + tela estática fiel ao Figma | F01, F02 |
| 2 | Upload por item + validação de formato/tamanho + preview | F03, F04 |
| 3 | Validação de nitidez/resolução/iluminação | F05 |
| 4 | OCR + score de confiança + roteamento ≥ 80% / < 80% | F06 |
| 5 | Classificação + extração de CPF/nome/datas | F07, F08 |
| 6 | Regras de negócio + cruzamento de titularidade | F09, F10 |
| 7 | Resumo dinâmico, pendências, enviar/rascunho | F11, F12, F13 |
| 8 | (Opcional) Visão Middle + JSON Salesforce | F14 |
