# Case Bari – Central de Inteligência de Documentos (OCR)

Protótipo do motor de OCR/IA do Middle Office de crédito imobiliário do Banco Bari (case).
O consultor faz upload do pacote de documentos do cliente; a IA classifica, valida a qualidade
da imagem, lê (OCR), extrai os dados, aplica as regras de negócio e aponta pendências
**antes** de a proposta seguir para o Crédito.

> **Protótipo de estudo.** Tudo roda no navegador (sem backend); os dados dos documentos
> não saem da máquina e não há integração real com o Salesforce.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `prototipo-case-bari/` | Aplicação React + Vite + TypeScript |
| `documentos-teste/` | Documentos sintéticos para testar (aprovados, revisão e reprovados) + gerador em PowerShell |
| `docs/` | Pré-requisitos do protótipo (funções F01–F14) e prints |
| `instalar-dependencias.ps1` | Script de instalação completa (ver abaixo) |

## Início rápido (recomendado)

No Windows, um script só instala tudo, valida e sobe o servidor:

```powershell
powershell -ExecutionPolicy Bypass -File .\instalar-dependencias.ps1
```

Ele faz, nesta ordem:

1. Verifica se o Node.js está instalado; se não, instala via winget (`OpenJS.NodeJS.LTS`).
2. Entra em `prototipo-case-bari/` e roda `npm install`.
3. Valida com o build de produção (`npm run build`).
4. Sobe o servidor de desenvolvimento em http://localhost:5173.

Pode rodar mais de uma vez sem problema (idempotente). Requisito: Windows com winget
(Windows 10/11). Se preferir, siga o [passo a passo manual](#instalação-manual).

## Instalação manual

Requisito: **Node.js 18+** (baixe em <https://nodejs.org> — o `npm` vem junto).

```powershell
cd prototipo-case-bari
npm install        # instala as dependencias na pasta node_modules\
npm run dev        # servidor de desenvolvimento em http://localhost:5173
```

Abra **http://localhost:5173** no navegador.

Outros comandos uteis (dentro de `prototipo-case-bari/`):

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarregamento automático |
| `npm run build` | Gera a versão de produção em `dist/` (valida o TypeScript) |
| `npm run preview` | Serve localmente o conteúdo de `dist/` |

### Problemas conhecidos

- **`npm install` falha com `SELF_SIGNED_CERT_IN_CHAIN`** — a rede/proxy da empresa
  intercepta o TLS e o npm rejeita o certificado. Contorno para rede de teste:
  `npm config set strict-ssl false`, instale, e depois volte para `strict-ssl true`.
  O correto em ambiente corporativo é registrar o certificado CA da empresa no npm.
- **Página em branco com erro de "does not provide an export named ..."** — o servidor
  dev ficou com módulo antigo em cache. Reinicie o `npm run dev` (Ctrl+C e de novo)
  e recarregue o navegador.
- **`node`/`npm` não reconhecidos logo após instalar o Node** — o PATH só atualiza em
  sessões novas. Feche e reabra o terminal.
- **Primeira leitura de OCR demora** — o Tesseract baixa o modelo de português uma
  única vez; as seguintes levam poucos segundos.

## Como usar o protótipo

1. Na tela **"Envie os documentos do cliente"**, clique em **Enviar** no item desejado
   e escolha o arquivo — ou **arraste vários arquivos de uma vez** para qualquer ponto
   da página: a IA classifica e distribui cada um no item certo.
2. Acompanhe o status de cada item: ✅ Validado · ⚠️ Revisão Middle · ❌ Recusado · ⏳ Processando.
   Clique em **Ver** para conferir nitidez, score do OCR, dados extraídos, alertas e o texto lido.
3. As **pendências** aparecem no rodapé, com o motivo e a regra aplicada. O botão
   **Copiar mensagem** gera o texto pronto para o consultor mandar ao cliente.
4. **Enviar documentos** só libera quando nada está recusado, nada está processando e
   nenhum item obrigatório está faltando. ⚠️ Revisão Middle **não bloqueia** o envio
   (o documento segue para a fila de exceção de um analista).

### CPF condicional

O item **CPF** muda de papel conforme o documento de identificação:

| Enviado em "RG ou CNH" | Item CPF fica |
|---|---|
| Nada ainda | Condicional |
| CNH | ✅ Dispensado (o CPF já consta na CNH) |
| RG com CPF | ✅ Dispensado (o CPF já consta no RG) |
| RG **sem** CPF | ⚠️ Obrigatório — envie o cartão CPF |

## Documentos de teste

Em `documentos-teste/`, organizados por resultado esperado:

| Pasta | Qtd. | Resultado |
|---|---|---|
| `1-aprovados/` | 11 | ✅ Validado |
| `2-revisao-middle/` | 2 | ⚠️ Revisão Middle (matrícula com ônus) |
| `3-reprovados/` | 15 | ❌ Recusado / bloqueado no upload |

Detalhes de cada arquivo (em qual item enviar e por que aprova ou reprova) no
[`documentos-teste/README.md`](documentos-teste/README.md).

As datas dos documentos são calculadas a partir de **hoje**. Com o passar do tempo o
comprovante "válido" venceria; para regenerar tudo com datas novas:

```powershell
cd documentos-teste
powershell -ExecutionPolicy Bypass -File .\gerar-documentos.ps1
```

## O que o protótipo faz

1. **Upload** por item do checklist ou arrastando em lote (a IA distribui cada arquivo).
2. **Validação de formato/tamanho**: PDF, JPG e PNG até 10 MB.
3. **Qualidade da imagem**: nitidez (variância do Laplaciano), resolução mínima,
   brilho e flash/reflexo (só para fotos; PDF nato digital é isento).
4. **OCR local** (Tesseract.js, português) com **score de confiança**: ≥ 80% valida
   automaticamente; abaixo vai para a fila de exceção do Middle (RF05).
5. **Classificação e extração**: tipo do documento, CPF (com validação dos dígitos
   verificadores), nomes, datas e valores — e renomeação no padrão do banco.
6. **Regras de negócio**: comprovante ≤ 90 dias; 3 meses fechados de renda; recibo de
   entrega do IR; validade da CNH; inscrição imobiliária e metragem do IPTU; ônus e
   HIS da matrícula; titularidade (documento de terceiro é bloqueado, RF07).
7. **CPF condicional**: só é exigido quando o RG não tem o número (CNH dispensa).
8. **Pendências e bloqueio de envio**: mensagem pronta para o cliente e o botão
   **Enviar documentos** travado enquanto houver recusa ou item obrigatório faltando.

## Stack

- **React + TypeScript + Vite** — interface e build (`esbuild`/Babel por baixo)
- **Tesseract.js** — OCR no navegador (worker + WebAssembly, modelo `por`); os dados
  não saem da máquina (LGPD)
- **pdf.js** — renderiza a 1ª página de PDFs para canvas (usado na análise de qualidade e no OCR)
- **Canvas API** — análise de nitidez/brilho direto nos pixels

## Escopo (fora do protótipo)

Integração com Salesforce, backend, autenticação, integração com cartórios/Plexus (RF09),
detecção de fraude e documentos fora dos 7 do case (KYC, ficha cadastral, documentos PJ etc.).
O passo 8 do plano (tela do analista do Middle com fila de exceção e JSON do Salesforce)
também não está implementado.