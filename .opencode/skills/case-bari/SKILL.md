---
name: Case Bari
description: Contexto completo do Case Bari (Central de OCR e Inteligência de Documentos do Middle Office de Crédito Imobiliário do Banco Bari). Use quando o usuário falar do case Bari, pedir para analisar/triar/validar documentos de uma proposta (RG, CPF, CNH, certidão de estado civil, comprovante de residência, IR, extrato, holerite, IPTU, matrícula), montar checklist, gerar pendências, simular o motor de OCR/IA ou produzir artefatos do case (fluxo To-Be, requisitos, user stories).
---

# Case Bari – Central de OCR e Inteligência de Documentos

## 1. Contexto do case

**Problema (5 Porquês):** o Middle Office perde a maior parte do dia abrindo links dispersos (WhatsApp, e-mail, Drive) e digitando manualmente no Salesforce os dados de clientes e cônjuges. O Crédito devolve propostas por documentos vencidos, ilegíveis ou de terceiros. Causa raiz: não existe uma camada integrada de regras de negócio, checklist dinâmico, validação de titularidade e captura automática de dados.

**Solução:** uma plataforma interna (Consultor Comercial + Middle; **o cliente não tem acesso**) onde o Consultor faz upload do "pacote" de documentos brutos. Um motor de OCR/IA classifica, renomeia, extrai dados, mapeia relacionamentos (ex.: cônjuge), valida regras de negócio, avisa o que está irregular **antes** do envio ao Crédito e injeta tudo no Salesforce.

**Fontes (nesta ordem de prioridade):**
1. *Proposta de Solução* – define o **escopo**: só os 7 documentos da seção 2.
2. *Documento To-Be* e *Dinâmica 1* (5 Porquês, RF/RNF, user stories, fluxos As-Is/To-Be) – definem o **fluxo** e os papéis.
3. *Relatório de Políticas & Regras de Crédito Imobiliário do Banco Bari (v8.3)* – fornece as **regras de negócio**, usadas **apenas** no que se aplica aos 7 documentos do escopo.

> Não use regras do relatório sobre outros documentos (Ecsnaine/SERASA/BACEN, ficha cadastral/SCR, KYC, contrato social, DPS, alvará, convenção de condomínio, docs PJ etc.). Se forem relevantes, cite-os só como **fora do escopo do case**.

## 2. Documentos do escopo (checklist)

| # | Categoria | Documento | O que a IA faz |
|---|-----------|-----------|----------------|
| 1 | Pessoal | RG + CPF (frente e verso) **ou** CNH (de preferência digital) | Lê os dados, valida emissão/validade e extrai a filiação para mapear parentesco |
| 2 | Pessoal | Certidão de estado civil | Confirma o estado civil atual de todos os participantes e define papéis (ex.: cônjuge) |
| 3 | Pessoal | Comprovante de residência | Emissão nos **últimos 90 dias**; se mais antigo, alerta de recusa |
| 4 | Renda | Declaração de IR + **recibo de entrega** | Confere o CPF com o titular e se a entrega foi feita no exercício vigente |
| 5 | Renda | Renda dos **últimos 3 meses fechados** (extrato bancário e holerite) | Confere se há 3 meses seguidos e extrai os valores recebidos |
| 6 | Imóvel | IPTU | Lê obrigatoriamente a metragem, a inscrição imobiliária e os dados do imóvel |
| 7 | Imóvel | Matrícula do imóvel | Confere o proprietário atual, identifica ônus e extrai o endereço |

## 3. Regras de validação por documento

Calcule prazos com base na **data atual** (data de envio do pacote). Ao explicar um alerta, cite a regra e a fonte.

### 3.1 RG/CPF ou CNH
- Obrigatório para **todos os proponentes** (titulares, cônjuges, conviventes e garantidores).
- Imagem feita a partir do **original**, **frente e verso**, **colorida** e nítida, sem reflexo. **Não aceitar cópia** (nem xerox, nem foto de cópia).
- Validade da emissão do RG:
  - Cliente com **até 25 anos**: emissão há **menos de 15 anos**.
  - Cliente **acima de 25 anos**: documentos mais antigos são aceitos se estiverem legíveis.
  - Cliente com **mais de 50 anos**: emissão de no máximo **25 anos antes da idade atual**. Ex.: cliente com 60 anos precisa de RG emitido aos 35 anos ou depois.
- CNH: deve ser a **mais recente**. Se houver sinal de uma emissão mais nova, peça a atual. Confira se está dentro da validade.
- Dados a extrair (dados mínimos do Salesforce): nome completo, CPF, **nome da mãe**, **nome do pai**, nacionalidade, naturalidade, data de nascimento e documento (tipo, número, data de emissão, órgão emissor).
- A filiação serve para identificar parentesco, inclusive entre comprador e vendedor. Se houver parentesco, peça a documentação completa do vendedor, como a de um proponente.
- **Alerta de assinatura:** se algum proponente **não tiver CNH**:
  - proponente único → assinatura por E-notariado;
  - vários proponentes → todos fazem certificado ICP presencial **ou** todos usam E-notariado (assinatura mista não é aceita).

### 3.2 Certidão de estado civil
- Obrigatória para todos os participantes. Prova o estado civil **atual**:
  - Solteiro (inclusive em união estável) → certidão de nascimento.
  - Casado → certidão de casamento.
  - Divorciado / separado / viúvo → certidão de casamento com averbação de divórcio / separação / óbito.
  - União estável → escritura pública, termo declaratório ou declaração positiva/negativa de união estável.
- União estável **sem documento oficial**:
  - regime de **comunhão parcial** → o Bari pode emitir a declaração positiva;
  - **outro regime** → o cliente precisa apresentar escritura ou termo. Bloqueie até isso acontecer.
- **Mapeamento de papéis:** ao ler a certidão de casamento, identifique o cônjuge, ligue-o ao RG/CNH correspondente e crie o cadastro com o papel "Cônjuge". **Ex-cônjuge** entra como relação de parentesco.
- **Filtro de terceiros (RF07):** cruze os nomes/CPFs da certidão com os participantes da proposta. Certidão de pessoa sem vínculo é **bloqueada** e não vai para o Crédito.
- Divergências também geram alerta: estado civil declarado diferente do que diz a certidão, ou casado sem os documentos do cônjuge.

### 3.3 Comprovante de residência
- Obrigatório para todos os proponentes. Precisa estar legível, em **nome do titular** e com **até 90 dias**. Se tiver mais de 90 dias, gere **alerta de recusa**.
- Tipos aceitos: conta de água, luz, telefone ou gás; fatura de cartão de crédito; boleto de condomínio; IPTU (só se for o imóvel onde a pessoa mora).
- Extraia o endereço residencial completo: CEP, tipo de logradouro, logradouro, número, complemento, bairro, cidade, UF e país.

### 3.4 Declaração de IR + recibo de entrega
- O **recibo de entrega é obrigatório**. Sem ele, gere pendência imediata.
- Confira se o CPF da declaração é o do titular/proponente que compõe renda.
- A declaração precisa ser a do exercício vigente, ou seja, a última entregue. O relatório chama de "exercício anterior", que é o mesmo conceito: a DIRPF entregue no ano atual, referente ao ano-calendário anterior.

### 3.5 Comprovação de renda (3 meses fechados)
- Obrigatória para os proponentes **que compõem renda**.
- Exija **3 meses fechados e seguidos**. Ex.: um envio em 26/10/2026 exige julho, agosto e setembro de 2026. Se faltar um mês, gere pendência. Também gere alerta se o documento tiver sido emitido há mais de 3 meses.
- Extrato bancário: tem de ser **nato digital**, com logo do banco, identificação do cliente e da conta. Inclua todas as contas com movimentação. Extrato digitado, editado ou em foto é alerta.
- Holerite: conferir os 3 últimos e extrair os valores (bruto/líquido) de cada mês.
- A combinação aceita pela política depende da ocupação e do valor da proposta:

| Ocupação | Proposta PF até R$ 499.999,99 | Proposta PF a partir de R$ 500.000,00 (exige também KYC – fora do escopo) |
|----------|-------------------------------|--------------------------------------------------------------------------|
| Assalariado | 3 holerites **ou** extrato 90 dias + IRPF c/ recibo **ou** IRPF c/ recibo | 3 holerites + IRPF c/ recibo **ou** extrato 90 dias + IRPF c/ recibo |
| Servidor, aposentado ou pensionista | último holerite **ou** extrato 90 dias + IRPF **ou** IRPF | último holerite + IRPF **ou** extrato 90 dias + IRPF |
| Demais ocupações | extrato 90 dias + IRPF **ou** IRPF | extrato 90 dias + IRPF |

> O checklist do case pede **IR + 3 meses (extrato e holerite)**, que é mais rígido que a política. Use o checklist do case como padrão e a tabela acima para explicar exceções.

### 3.6 IPTU
- Leitura **obrigatória** de metragem (área do terreno e construída), inscrição imobiliária e dados do imóvel (endereço, proprietário/contribuinte).
- Se faltar metragem ou inscrição, gere pendência.
- Compare o endereço e a inscrição do IPTU com os da matrícula. Divergência gera alerta.
- Extraia o endereço completo da garantia: CEP, tipo de logradouro, logradouro, número, complemento, bairro, cidade e UF.

### 3.7 Matrícula do imóvel
- **Proprietário atual:** compare com os proponentes. Se o proprietário não for proponente nem cônjuge, gere alerta de titularidade.
- **Ônus:**
  - **alienação fiduciária ou hipoteca vigente** → sinalize que a operação vai precisar de **Portabilidade** (mesmo tipo de contrato) ou **IQ – Interveniente Quitante** (produto diferente);
  - **penhora, arresto ou ações** → gere alerta para o Crédito/Jurídico.
- **HIS (Habitação de Interesse Social)** averbada → **a garantia não é aceita**. Gere bloqueio.
- **Aquisição há menos de 1 ano** → sinalize que os **antigos proprietários** também serão analisados.
- **Vaga de garagem** com matrícula própria → precisa entrar na operação. Sem ela, o apartamento não é aceito.
- **Endereço:** extraia e compare com o IPTU. Como alerta complementar, verifique se a UF/município é atendido pelo Bari:
  - Grupo 1 (MG, PR, SC, SP, RS, DF, ES, GO, RJ, MS, MT): município com mais de 50 mil habitantes.
  - Grupo 2 (Norte/Nordeste listados): mais de 100 mil habitantes e canal autorizado.
  - Cidades fronteiriças vedadas, como Corumbá, Ponta Porã e Cáceres.
- Averbações pendentes (construção, mudança de estado civil, óbito etc.) geram alerta informativo.

## 4. Fluxo To-Be (como o sistema funciona)

1. **Abertura (Consultor):** registra no Salesforce os dados básicos (nome, CPF, nascimento, e-mail, telefone, endereço). O sistema mostra o **checklist dinâmico** conforme o perfil da operação (RF01).
2. **Upload (Consultor):** arrasta os arquivos em lote, do jeito que vieram, sem renomear nem organizar pastas. Aceita PDF, PNG e JPG (RF02, RNF05).
3. **Classificação e leitura (IA):** identifica o tipo de cada documento, avalia a legibilidade, **renomeia no padrão do banco** e extrai os dados (RF03).
4. **Score de confiança (RF05):**
   - **≥ 80%** → documento validado automaticamente; segue para o fluxo.
   - **< 80%** → vai para a **fila de exceção do Middle** para revisão manual.
5. **Regras de negócio:** travas de prazo (RF06), cruzamento de titularidade e filtro de certidões (RF07), regras da seção 3. Cada alerta aparece **na hora** para o Consultor/Middle, com o motivo (US04).
6. **Cadastro automático (RF04):** cria as contas que faltam (cônjuges/intervenientes), faz os relacionamentos e anexa os PDFs renomeados à proposta no Salesforce.
7. **Crédito:** recebe a proposta já saneada. Se abrir uma exigência de documento do cliente, a pendência vai **direto para a fila do Consultor** (RF08/US05). O Middle só atua em exceções e em certidões de praças sem fornecedor.
8. *(Fora do escopo – RF09)* integração com cartórios/Plexus e repositório de links cartorários por município.

**Papéis:**
- **Cliente:** só envia os documentos ao Consultor.
- **Consultor:** faz o upload e trata as pendências.
- **IA/OCR:** classifica, extrai, calcula o score e cruza os dados.
- **Middle:** gestão por exceção.
- **Crédito:** analisa propostas saneadas.

**RNF:** LGPD (dados não podem treinar modelos públicos), HTTPS/TLS e criptografia em repouso, trilha de auditoria (score + operador em intervenção manual), processamento em poucos minutos.

## 5. Como responder ao usar esta skill

### 5.1 Análise de um pacote de documentos
Quando o usuário enviar documentos (ou descrever o conteúdo), simule o motor e entregue nesta ordem:

1. **Classificação:** tabela com `arquivo original | tipo identificado | titular | score de confiança estimado | nome padronizado`.
   - O padrão de nomes do banco não está definido nos documentos. Até haver definição, use `TIPODOC_CPF_NOME-SOBRENOME_AAAAMMDD.pdf` (ex.: `CNH_12345678900_JOAO-SILVA_20261026.pdf`) e avise que é uma sugestão.
2. **Participantes e relacionamentos:** cada pessoa com papel (Titular, Cônjuge, Convivente, Garantidor, Vendedor) e dados extraídos.
3. **Checklist do escopo:** os 7 itens, para cada participante quando for o caso, com status:
   - ✅ Validado
   - ⚠️ Revisão Middle (score < 80% ou divergência)
   - ❌ Pendência/Recusa (com motivo e regra)
   - ⬜ Não enviado
4. **Alertas e pendências:** lista objetiva com a **mensagem pronta para o Consultor pedir ao cliente** o documento correto.
5. **Roteamento:** "Pronto para o Crédito" ou "Bloqueado – resolver pendências", e o que vai para a fila do Middle.
6. **Payload Salesforce** (opcional, se pedido): JSON com contas, relacionamentos, dados da garantia e anexos.

Nunca invente dados que não estejam nos documentos. Se um campo estiver ilegível ou faltando, marque como `null` e gere pendência.

### 5.2 Perguntas e artefatos do case
Para perguntas sobre regras, fluxo, requisitos ou user stories, responda com base nas seções acima e cite a origem (Proposta, To-Be, Dinâmica ou Relatório). Se o usuário pedir artefatos novos (casos de teste, critérios de aceite, protótipo de tela, BPMN, métricas), mantenha o escopo dos 7 documentos e o fluxo To-Be.

### 5.3 Divergências entre os documentos (deixe claras quando forem relevantes)
- Prazo de residência e renda: "90 dias" (Proposta/Relatório) vs. "3 meses" (To-Be). Adotar 90 dias para residência e 3 meses fechados para renda.
- Score exatamente 80%: "≥ 80%" (Dinâmica RF05) vs. "> 80%" (To-Be). Adotar ≥ 80% = aprovado.
- Renda: a política aceita extrato **ou** holerite conforme a ocupação; o checklist do case pede ambos.
- IR: "exercício vigente" (Proposta) vs. "exercício anterior" (Relatório). Interpretar como a última declaração entregue, com recibo.
