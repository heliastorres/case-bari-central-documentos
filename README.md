# Case Bari – Central de Inteligência de Documentos (OCR)

Protótipo do motor de OCR/IA do Middle Office de crédito imobiliário do Banco Bari (case).
O consultor faz upload do pacote de documentos do cliente; a IA classifica, valida a qualidade
da imagem, lê (OCR), extrai os dados, aplica as regras de negócio e aponta pendências
**antes** de a proposta seguir para o Crédito.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `prototipo-case-bari/` | Aplicação React + Vite + TypeScript (roda 100% no navegador, sem backend) |
| `documentos-teste/` | Documentos sintéticos para testar (aprovados, revisão e reprovados) + gerador em PowerShell |
| `docs/` | Pré-requisitos do protótipo (funções F01–F14) e prints |

## Rodar o protótipo

Requisito: Node.js 18+.

```powershell
cd prototipo-case-bari
npm install
npm run dev
```

Abra http://localhost:5173.

## O que o protótipo faz

1. **Upload** por item do checklist ou arrastando em lote (a IA distribui cada arquivo).
2. **Validação de formato/tamanho**: PDF, JPG e PNG até 10 MB.
3. **Qualidade da imagem**: nitidez (variância do Laplaciano), resolução mínima, brilho e flash/reflexo.
4. **OCR local** (Tesseract.js, português) com **score de confiança**: ≥ 80% valida; abaixo vai para a fila de exceção do Middle.
5. **Classificação e extração**: tipo do documento, CPF (com dígitos verificadores), nomes, datas e valores.
6. **Regras de negócio**: comprovante ≤ 90 dias, 3 meses fechados de renda, recibo do IR, validade da CNH, inscrição e metragem do IPTU, ônus/HIS da matrícula, titularidade (documento de terceiro é bloqueado).
7. **CPF condicional**: só é exigido quando o RG não tem o número (CNH dispensa).
8. **Pendências** com mensagem pronta para o consultor copiar e mandar ao cliente; o envio para o Crédito é bloqueado com recusa ou item obrigatório faltando.

> Protótipo de estudo. Os dados não saem do navegador (OCR local) e não há integração real com o Salesforce.