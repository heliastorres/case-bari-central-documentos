import type { DadosExtraidos, DocTipo } from "../types";

const PALAVRAS: Array<[DocTipo, string[]]> = [
  ["CNH", ["carteira nacional de habilita", "c n h", "permisso nacional de dirigir", "habilita"]],
  ["RG", ["registro geral", "identidade", "república federativa do brasil", "republica federativa do brasil", "secretaria de seguran"]],
  ["CPF", ["cpf", "cadastro de pessoas físicas", "cadastro de pessoas fisicas", "receita federal"]],
  ["ReciboIR", ["recibo de entrega", "declaração de ajuste anual", "declaracao de ajuste anual", "exercício", "exercicio"]],
  ["IR", ["imposto de renda", "dirpf", "declaração de rendimentos", "declaracao de rendimentos"]],
  ["Certidao", ["certidão de casamento", "certidao de casamento", "certidão de nascimento", "certidao de nascimento", "cartório", "cartorio", "averba"]],
  ["ComprovanteResidencia", ["conta de", "energia elétrica", "energia eletrica", "água e esgoto", "agua e esgoto", "comprovante de resid", "fatura", "comuna", "gás natural", "gas natural"]],
  ["Holerite", ["holerite", "contracheque", "contra-cheque", "folha de pagamento", "salário base", "salario base", "bruto", "líquido", "liquido"]],
  ["Extrato", ["extrato", "saldos", "saldo em", "agência", "agencia", "movimenta", "santander", "itau", "bradesco", "banco do brasil", "nubank"]],
  ["Matricula", ["matrícula", "matricula", "registro de imóveis", "registro de imoveis", "cartório de registro", "cartorio de registro", "ônus", "onus", "averba"]],
  ["IPTU", ["iptu", "inscrição imobiliária", "inscricao imobiliaria", "prefeitura", "metragem", "área do terreno", "area do terreno", "área construída", "area construida"]],
];

export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function classificar(texto: string): DocTipo {
  const t = normalizar(texto);
  // Recibo de entrega tem prioridade sobre a declaração em si (é o que valida o IR)
  const ordem: DocTipo[] = ["CNH", "ReciboIR", "IR", "Matricula", "IPTU", "Certidao", "Holerite", "Extrato", "ComprovanteResidencia", "RG", "CPF"];
  for (const tipo of ordem) {
    const pares = PALAVRAS.find(([tt]) => tt === tipo)!;
    if (pares[1].some((p) => t.includes(normalizar(p)))) return tipo;
  }
  return "Desconhecido";
}

const RE_CPF = /\d{3}[. ]?\d{3}[. ]?\d{3}[- ]?\d{2}/g;
const RE_DATA = /\d{2}[/.-]\d{2}[/.-]\d{4}|\d{4}-\d{2}-\d{2}/g;
const RE_VALOR = /(?:R\$\s*)?\d{1,3}(?:[.]\d{3})*(?:,\d{2})\b/g;
const RE_NOME = /(?:nome(?:\s+completo)?|cliente|titular|contribuinte)\s*[:\-]?\s*([A-ZÀ-Ü][A-Za-zÀ-ü]+(?:\s+[A-ZÀ-Ü][A-Za-zÀ-ü]+){1,6})/gi;

function validarCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (base: string) => {
    let peso = base.length + 1;
    let soma = 0;
    for (const ch of base) {
      soma += Number(ch) * peso--;
    }
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return Number(d[9]) === dv(d.slice(0, 9)) && Number(d[10]) === dv(d.slice(0, 10));
}

export function extrarDados(texto: string): DadosExtraidos {
  const t = normalizar(texto);
  const temRecibo = t.includes("recibo de entrega") || t.includes("confirmação de recebimento") || t.includes("confirmacao de recebimento");
  const datas = texto.match(RE_DATA)?.map((d) => d.replace(/[.-]/g, "/")) ?? [];
  const valores = (texto.match(RE_VALOR) ?? []).map((v) => {
    const n = v.replace(/[R$\s]/g, "");
    return Number(n.replace(/\./g, "").replace(",", "."));
  });
  return {
    tipoDetectado: classificar(texto),
    cpfs: [...new Set(texto.match(RE_CPF)?.map((c) => c.replace(/\D/g, "")) ?? [])].filter(validarCpf),
    nomes: [...new Set(texto.match(RE_NOME)?.map((m) => m.trim()) ?? [])],
    datas,
    valores,
    temRecibo,
  };
}

export function padronizarNome(tipo: DocTipo, cpf: string, nome: string): string {
  const t = tipo === "Desconhecido" ? "DOC" : tipo.toUpperCase();
  const dono = [nome, cpf.replace(/\D/g, "")].filter(Boolean).join("_").replace(/\s+/g, "-");
  const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${t}_${dono}_${hoje}`.replace(/[^A-Za-z0-9_\-]/g, "") + ".pdf";
}