# Documentos de teste – Protótipo Case Bari

Documentos **sintéticos** (fictícios) para testar o protótipo na mão. Todos foram passados pelo sistema e deram o resultado indicado abaixo.

**Cliente da proposta (fixo no protótipo):** Maria Silva Souza · CPF 123.456.789-09 · nascida em 14/05/1985 · Casada

## Como testar
1. Suba o protótipo: `npm run dev` na pasta `prototipo-case-bari` e abra http://localhost:5173.
2. No item indicado na coluna **"Enviar em"**, clique em **Enviar** e escolha o arquivo.
   Ou arraste vários arquivos de uma vez para a página: a IA classifica e coloca cada um no item certo.
3. A primeira leitura demora mais (o OCR baixa o modelo de português). As seguintes levam poucos segundos.
4. Clique em **Ver** no item para conferir nitidez, score, dados extraídos e o texto lido.

> Para enviar `formato-invalido.txt` pelo botão, troque o filtro da janela para "Todos os arquivos", ou arraste o arquivo para a página.

## 1-aprovados → ✅ Validado

| Arquivo | Enviar em | Por que passa |
|---|---|---|
| 01-rg-maria.png | RG ou CNH | Nome e CPF da cliente (CPF fica **dispensado**) |
| 01b-rg-sem-cpf-maria.png | RG ou CNH | RG antigo, sem CPF (CPF fica **obrigatório**) |
| 02-cnh-maria.png | RG ou CNH | Validade daqui a 3 anos |
| 03-cpf-maria.png | CPF | CPF válido da cliente |
| 04-certidao-casamento-maria.png | Certidão de estado civil | Cliente é um dos cônjuges |
| 05-comprovante-residencia-maria.png | Comprovante de residência | Emitido há 20 dias (limite: 90) |
| 06-holerite-3-meses.png | Holerite ou contracheque | Os 3 últimos meses fechados |
| 07-extrato-3-meses.png | Extrato bancário | Os 3 últimos meses fechados |
| 08-ir-com-recibo.png | Declaração de IR | Tem "Recibo de entrega" |
| 09-iptu.png | IPTU | Tem inscrição imobiliária e metragem |
| 10-matricula-livre.png | Matrícula do imóvel | Sem ônus |

Para completar o checklist, envie a CNH (ou um dos RGs) e os documentos de 04 a 10. O CPF só é necessário no caso do `01b`.

### CPF condicional
| Enviado em "RG ou CNH" | Item CPF fica | Para completar |
|---|---|---|
| nada ainda | Condicional | — |
| 02-cnh-maria.png | ✅ Dispensado (CPF já consta na CNH) | Nada |
| 01-rg-maria.png | ✅ Dispensado (CPF já consta no RG) | Nada |
| 01b-rg-sem-cpf-maria.png | ⚠️ Obrigatório | Enviar `03-cpf-maria.png` no item CPF |
| 03-cpf-maria.png (cartão CPF) | ❌ Recusado: "O cartão CPF não substitui um documento com foto" | Enviar RG ou CNH |

O botão **Enviar documentos** só libera quando nenhum item obrigatório está faltando e nenhum documento está recusado. Reenviar um arquivo no mesmo item substitui o anterior; por exemplo, `cnh-vencida.png` seguida de `02-cnh-maria.png` libera o item.

## 2-revisao-middle → ⚠️ Revisão Middle

| Arquivo | Enviar em | Alerta esperado |
|---|---|---|
| matricula-alienacao-fiduciaria.png | Matrícula do imóvel | Ônus de alienação fiduciária → Portabilidade ou IQ |
| matricula-penhora.png | Matrícula do imóvel | Indício de penhora → Crédito/Jurídico |

## 3-reprovados → ❌ Recusado / bloqueado

| Arquivo | Enviar em | Motivo esperado |
|---|---|---|
| cnh-vencida.png | RG ou CNH | CNH vencida há 1 ano |
| certidao-de-terceiros.png | Certidão de estado civil | Documento não pertence a nenhum participante (RF07) |
| residencia-vencida-150-dias.png | Comprovante de residência | Comprovante com 5 meses (limite: 90 dias) |
| residencia-de-terceiro.png | Comprovante de residência | Documento em nome de outra pessoa (RF07) |
| holerite-faltando-mes.png | Holerite ou contracheque | Falta o 3º mês fechado |
| extrato-apenas-1-mes.png | Extrato bancário | Só 1 mês (exigido: 3) |
| ir-sem-recibo.png | Declaração de IR | Recibo de entrega ausente |
| iptu-sem-inscricao-e-metragem.png | IPTU | Sem inscrição imobiliária e sem metragem |
| matricula-his.png | Matrícula do imóvel | Imóvel HIS → garantia não aceita |
| qualidade-desfocada.png | Comprovante de residência | Imagem desfocada (OCR também cai para ~26%) |
| qualidade-baixa-resolucao.png | Comprovante de residência | Resolução baixa (700 px; mínimo 800) |
| qualidade-escura.png | Comprovante de residência | Iluminação inadequada (e baixo contraste) |
| qualidade-flash-estourada.png | Comprovante de residência | Iluminação inadequada (fundo estourado/flash) |
| arquivo-acima-de-10mb.png | qualquer item | Bloqueado no upload: acima de 10 MB |
| formato-invalido.txt | qualquer item | Bloqueado no upload: formato não aceito |

## Documento no item errado → ❌ Recusado
Qualquer documento de `1-aprovados` enviado em um item que não é o dele é recusado. Exemplo: `09-iptu.png` em "RG ou CNH" gera a mensagem *"Documento enviado no item errado: parece ser IPTU, mas este item pede RG ou CNH"*.

Exceção: o IPTU é aceito como tipo no item "Comprovante de residência", porque a política permite usá-lo quando é do imóvel onde a pessoa mora. Mesmo assim, o `09-iptu.png` de teste é recusado nesse item porque não tem data de emissão (regra dos 90 dias).

## Regerar os documentos
As datas são calculadas a partir de hoje. Com o passar do tempo, o comprovante "válido" venceria e os "3 últimos meses" mudariam. Para atualizar tudo:

```powershell
powershell -ExecutionPolicy Bypass -File .\gerar-documentos.ps1
```

## Limitações conhecidas
- **Regras de idade do RG** (≤ 25 e > 50 anos) não disparam, porque a cliente fixa tem 41 anos.
- **Score < 80% com documento legível** não acontece com estes arquivos: imagens geradas por computador são lidas com 92–95% de confiança. Fotos reais tortas ou com sombra tendem a cair para a revisão do Middle.
- Os documentos são simplificados: só têm os campos que as regras do protótipo leem.
