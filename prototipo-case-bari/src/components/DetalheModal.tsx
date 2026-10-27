import type { Arquivo } from "../types";

export function DetalheModal({ arquivo, onClose }: { arquivo: Arquivo | null; onClose: () => void }) {
  if (!arquivo) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{arquivo.nomeOriginal}</h3>
            <p className="muted">Renomeado para: <code>{arquivo.nomePadronizado}</code></p>
          </div>
          <button className="btn ghost" onClick={onClose}>Fechar ✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-col">
            <img src={arquivo.url} alt={arquivo.nomeOriginal} className="preview" />
            {arquivo.quality && (
              <ul className="qual-list">
                <li>Nitidez (Laplaciano): <strong>{arquivo.quality.nitidezScore}/100</strong></li>
                <li>
                  Resolução: <strong>{arquivo.quality.largura}×{arquivo.quality.altura}</strong>
                  {arquivo.quality.resolucaoOk ? " ✅" : " ❌ (menor lado < 800px)"}
                </li>
                <li>Brilho médio: <strong>{arquivo.quality.brilhoMedio}</strong>{arquivo.quality.brilhoOk ? " ✅" : " ❌"}</li>
                <li>Pixels estourados: <strong>{arquivo.quality.estouroPct}%</strong></li>
              </ul>
            )}
            <p>Score de confiança OCR: <strong className={arquivo.score >= 80 ? "ok" : "warn"}>{arquivo.score}%</strong></p>
          </div>

          <div className="modal-col">
            <h4>Alertas e pendências</h4>
            {arquivo.alertas.length === 0 && <p className="ok">Nenhum alerta — documento conforme.</p>}
            <ul className="alert-list">
              {arquivo.alertas.map((a, i) => (
                <li key={i} className={a.nivel}>
                  <span>{a.nivel === "erro" ? "❌" : a.nivel === "aviso" ? "⚠️" : "ℹ️"}</span>
                  <div>
                    <p>{a.mensagem}</p>
                    <small>Regra: {a.regra}</small>
                  </div>
                </li>
              ))}
            </ul>

            {arquivo.dados && (
              <>
                <h4>Dados extraídos (payload Salesforce)</h4>
                <pre className="ocr-text">{JSON.stringify(arquivo.dados, null, 2)}</pre>
              </>
            )}

            <h4>Texto do OCR</h4>
            <pre className="ocr-text">{arquivo.texto.slice(0, 2000) || "(vazio)"}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}