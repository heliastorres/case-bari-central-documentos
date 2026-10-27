import { useRef } from "react";
import type { Arquivo, ChecklistItem, Categoria, DocStatus } from "../types";
import { SCORE_MIN } from "../lib/regras";
import type { Condicao, SituacaoCpf } from "../lib/condicionais";

const CATEGORIA_LABEL: Record<Categoria, string> = {
  Identificacao: "Identificação",
  Renda: "Renda",
  Imovel: "Imóvel",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  pendente: "Pendente",
  processando: "Processando…",
  validado: "Validado",
  revisao: "Revisão Middle",
  recusado: "Recusado",
};

const CONDICAO_LABEL: Record<SituacaoCpf, string> = {
  aguardando: "Condicional",
  dispensado: "Dispensado",
  obrigatorio: "Obrigatório",
};

interface Props {
  item: ChecklistItem;
  arquivos: Arquivo[];
  /** Situação de itens condicionais (hoje só o CPF). */
  condicao?: Condicao;
  onUpload: (item: ChecklistItem, file: File) => void;
  onVer: (a: Arquivo) => void;
}

export function ItemCard({ item, arquivos, condicao, onUpload, onVer }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const feitos = arquivos.length;
  const atual = arquivos[arquivos.length - 1];
  const dispensado = condicao?.situacao === "dispensado";
  const pct = atual?.status === "validado" || dispensado ? 100 : 0;
  const opcional = condicao ? condicao.situacao !== "obrigatorio" : !item.obrigatorio;

  return (
    <div className={`item-card ${opcional ? "opcional" : ""}`}>
      <div className="item-head">
        <div>
          <strong>{item.titulo}</strong>
          <p className="muted">{item.descricao}</p>
          {condicao && (
            <span className={`cond cond-${condicao.situacao}`}>
              {CONDICAO_LABEL[condicao.situacao]} —{" "}
              {condicao.situacao === "obrigatorio" && atual?.status === "validado"
                ? "o RG não tem CPF; cartão CPF recebido."
                : condicao.motivo}
            </span>
          )}
        </div>
        <div className="item-actions">
          {arquivos.map((a) => (
            <button key={a.id} className="btn ghost small" onClick={() => onVer(a)} title={`Score: ${a.score}%`}>
              Ver
            </button>
          ))}
          <button className="btn small" onClick={() => input.current?.click()}>
            {feitos === 0 ? "Enviar" : "Enviar outro"}
          </button>
          <input
            ref={input}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(item, f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      <div className="item-foot">
        <span className="cat-label">{CATEGORIA_LABEL[item.categoria]}</span>
        {feitos > 0 && (
          <span className={`status status-${arquivos[arquivos.length - 1].status}`}>
            {STATUS_LABEL[arquivos[arquivos.length - 1].status]}
            {arquivos[arquivos.length - 1].status !== "processando" && ` · score ${arquivos[arquivos.length - 1].score}%`}
          </span>
        )}
        <span className="pct">{pct}%</span>
      </div>
      <div className="bar slim">
        <div className={`bar-fill ${pct < SCORE_MIN && pct > 0 ? "warn" : ""}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}