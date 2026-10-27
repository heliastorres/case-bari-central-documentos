import type { Arquivo, Categoria, ChecklistItem, DocStatus } from "../types";
import { CHECKLIST, CATEGORIAS } from "../lib/checklist";

const STATUS_ICON: Record<DocStatus, string> = {
  pendente: "⬜",
  processando: "⏳",
  validado: "✅",
  revisao: "⚠️",
  recusado: "❌",
};

export function ResumoEnvio({ arquivos, concluido }: {
  arquivos: Record<string, Arquivo[]>;
  concluido: (item: ChecklistItem) => boolean;
}) {
  const arquivosLista = Object.values(arquivos).flat();
  const validados = arquivosLista.filter((a) => a.status === "validado").length;
  const pct = arquivosLista.length
    ? Math.round((validados / arquivosLista.length) * 100)
    : 0;

  return (
    <section className="card resumo">
      <h3>Resumo do envio</h3>
      <p className="muted">Validados: {validados} de {arquivosLista.length} enviados</p>
      <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
      {CATEGORIAS.map((cat: Categoria) => {
        const itens = CHECKLIST.filter((i) => i.categoria === cat);
        const feitos = itens.filter(concluido).length;
        return (
          <div key={cat} className="resumo-cat">
            <span>{cat === "Identificacao" ? "Identificação" : cat === "Imovel" ? "Imóvel" : "Renda"}</span>
            <small>{feitos} de {itens.length}</small>
          </div>
        );
      })}
      <ul className="resumo-lista">
        {arquivosLista.map((a) => (
          <li key={a.id}>
            {STATUS_ICON[a.status]} {a.item.replace(/-/g, " ")} — <em>{a.nomeOriginal}</em>
          </li>
        ))}
        {arquivosLista.length === 0 && <li className="muted">Nenhum arquivo enviado ainda.</li>}
      </ul>
    </section>
  );
}