import type { Arquivo, ChecklistItem, Cliente } from "../types";
import { CHECKLIST } from "./checklist";

export type SituacaoCpf = "aguardando" | "dispensado" | "obrigatorio";

export interface Condicao {
  situacao: SituacaoCpf;
  motivo: string;
}

/** Arquivo mais recente de cada item: um reenvio substitui o anterior. */
export function arquivoAtual(arquivos: Record<string, Arquivo[]>, itemId: string): Arquivo | undefined {
  const lista = arquivos[itemId] ?? [];
  return lista[lista.length - 1];
}

/**
 * Checklist dinâmico (RF01): o cartão CPF só é exigido quando o documento
 * de identificação não traz o CPF da cliente.
 *  - CNH                    → dispensado (a CNH sempre tem o CPF)
 *  - RG com o CPF da cliente → dispensado
 *  - RG sem CPF             → obrigatório
 *  - nada válido enviado    → aguardando
 */
export function situacaoCpf(arquivos: Record<string, Arquivo[]>, cliente: Cliente): Condicao {
  const doc = arquivoAtual(arquivos, "rg-cnh");
  if (!doc || !doc.dados || doc.status === "processando" || doc.status === "recusado") {
    return { situacao: "aguardando", motivo: "Depende do documento enviado em RG ou CNH." };
  }
  if (doc.dados.tipoDetectado === "CNH") {
    return { situacao: "dispensado", motivo: "CPF já consta na CNH." };
  }
  if (doc.dados.cpfs.includes(cliente.cpf.replace(/\D/g, ""))) {
    return { situacao: "dispensado", motivo: "CPF já consta no RG." };
  }
  return { situacao: "obrigatorio", motivo: "O RG enviado não tem CPF — envie o cartão CPF." };
}

export function itemObrigatorio(item: ChecklistItem, cpf: Condicao): boolean {
  if (item.id === "cpf") return cpf.situacao === "obrigatorio";
  return item.obrigatorio;
}

export function itemDispensado(item: ChecklistItem, cpf: Condicao): boolean {
  return item.id === "cpf" && cpf.situacao === "dispensado";
}

/** Itens obrigatórios que ainda não têm nenhum arquivo enviado. */
export function itensFaltando(arquivos: Record<string, Arquivo[]>, cpf: Condicao): ChecklistItem[] {
  return CHECKLIST.filter((i) => itemObrigatorio(i, cpf) && !arquivoAtual(arquivos, i.id));
}

/** Item concluído = arquivo atual validado ou item dispensado. */
export function itemConcluido(arquivos: Record<string, Arquivo[]>, item: ChecklistItem, cpf: Condicao): boolean {
  return itemDispensado(item, cpf) || arquivoAtual(arquivos, item.id)?.status === "validado";
}