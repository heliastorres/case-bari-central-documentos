import type { ChecklistItem, Cliente } from "../types";

export const CHECKLIST: ChecklistItem[] = [
  {
    id: "rg-cnh",
    categoria: "Identificacao",
    titulo: "RG ou CNH",
    descricao: "Documento original, frente e verso, colorido e nítido. De preferência CNH digital.",
    obrigatorio: true,
  },
  {
    id: "cpf",
    categoria: "Identificacao",
    titulo: "CPF",
    descricao: "Exigido só quando o RG não traz o número do CPF (a CNH sempre traz).",
    obrigatorio: false,
  },
  {
    id: "certidao-estado-civil",
    categoria: "Identificacao",
    titulo: "Certidão de estado civil",
    descricao: "Comprova o estado civil atual (nascimento, casamento ou averbação).",
    obrigatorio: true,
  },
  {
    id: "comprovante-residencia",
    categoria: "Identificacao",
    titulo: "Comprovante de residência",
    descricao: "Emitido nos últimos 90 dias, em nome do titular (água, luz, gás, telefone, cartão ou condomínio).",
    obrigatorio: true,
  },
  {
    id: "holerite",
    categoria: "Renda",
    titulo: "Holerite ou contracheque",
    descricao: "Últimos 3 meses fechados e seguidos.",
    obrigatorio: true,
  },
  {
    id: "extrato",
    categoria: "Renda",
    titulo: "Extrato bancário",
    descricao: "Últimos 3 meses fechados, nato digital, com logo do banco, cliente e conta.",
    obrigatorio: true,
  },
  {
    id: "declaracao-ir",
    categoria: "Renda",
    titulo: "Declaração de Imposto de Renda",
    descricao: "Último exercício entregue, com recibo de entrega.",
    obrigatorio: true,
  },
  {
    id: "iptu",
    categoria: "Imovel",
    titulo: "IPTU",
    descricao: "Deve conter metragem, inscrição imobiliária e dados do imóvel.",
    obrigatorio: true,
  },
  {
    id: "matricula",
    categoria: "Imovel",
    titulo: "Matrícula do imóvel",
    descricao: "Confere proprietário atual e identifica ônus (alienação fiduciária, hipoteca, penhora, HIS).",
    obrigatorio: true,
  },
];

export const CATEGORIAS = ["Identificacao", "Renda", "Imovel"] as const;

export const CLIENTE: Cliente = {
  nome: "Maria Silva Souza",
  cpf: "123.456.789-09",
  nascimento: "14/05/1985",
  estadoCivil: "Casada",
};