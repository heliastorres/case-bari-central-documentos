export type DocStatus = "pendente" | "processando" | "validado" | "revisao" | "recusado";

export type Categoria = "Identificacao" | "Renda" | "Imovel";

export interface Cliente {
  nome: string;
  cpf: string;
  nascimento: string; // dd/mm/aaaa
  estadoCivil: string;
}

export interface ChecklistItem {
  id: string;
  categoria: Categoria;
  titulo: string;
  descricao: string;
  obrigatorio: boolean;
}

export interface QualityResult {
  nitidezScore: number; // 0-100
  resolucaoOk: boolean;
  largura: number;
  altura: number;
  brilhoOk: boolean;
  brilhoMedio: number;
  estouroPct: number;
}

export interface OcrResult {
  texto: string;
  score: number; // confiança média 0-100
}

export type DocTipo =
  | "CNH"
  | "RG"
  | "CPF"
  | "Certidao"
  | "ComprovanteResidencia"
  | "Holerite"
  | "Extrato"
  | "IR"
  | "ReciboIR"
  | "IPTU"
  | "Matricula"
  | "Desconhecido";

export interface DadosExtraidos {
  cpfs: string[];
  nomes: string[];
  datas: string[]; // dd/mm/aaaa ou aaaa-mm-dd
  valores: number[];
  tipoDetectado: DocTipo;
  temRecibo: boolean;
}

export interface Alerta {
  nivel: "erro" | "aviso" | "info";
  mensagem: string;
  regra: string;
}

export interface Arquivo {
  id: string;
  item: string; // id do ChecklistItem
  nomeOriginal: string;
  nomePadronizado: string;
  url: string;
  tipoMime: string;
  status: DocStatus;
  score: number;
  quality: QualityResult | null;
  texto: string;
  dados: DadosExtraidos | null;
  alertas: Alerta[];
  dataEnvio: string; // ISO
}