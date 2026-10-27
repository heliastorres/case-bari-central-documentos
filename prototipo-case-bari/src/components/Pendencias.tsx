import type { Arquivo, ChecklistItem } from "../types";

export function Pendencias({ arquivos, faltando, onEnviar, onCopiar }: {
  /** Arquivo mais recente de cada item. */
  arquivos: Arquivo[];
  /** Itens obrigatórios ainda sem arquivo (inclui o CPF quando o RG não tem o número). */
  faltando: ChecklistItem[];
  onEnviar: () => void;
  onCopiar: (msg: string) => void;
}) {
  const pendentes = arquivos.filter((a) => a.status !== "validado");
  const temErro = arquivos.some((a) => a.status === "recusado");
  const processando = arquivos.some((a) => a.status === "processando");
  const emRevisao = arquivos.filter((a) => a.status === "revisao").length;
  const bloqueado = temErro || processando || faltando.length > 0 || arquivos.length === 0;

  const motivoBloqueio = temErro
    ? "Existem documentos recusados — resolva as pendências primeiro."
    : faltando.length > 0
      ? `Faltam itens obrigatórios: ${faltando.map((i) => i.titulo).join(", ")}.`
      : processando
        ? "Aguarde o processamento dos documentos."
        : "";

  const mensagemCliente = () =>
    [
      "Olá! Passando para avisar sobre os documentos do seu empréstimo imobiliário:",
      ...arquivos
        .filter((a) => a.status === "recusado" || a.status === "revisao")
        .map(
          (a) =>
            `• ${a.item.replace(/-/g, " ")} (${a.nomeOriginal}): ${a.alertas
              .map((al) => al.mensagem)
              .join(" | ") || "enviar arquivo mais nítido, foto do original, sem flash e sem cortes."}`
        ),
      ...faltando.map((i) => `• Falta enviar: ${i.titulo} — ${i.descricao}`),
      "Pode reenviar por aqui mesmo. Assim que recebermos, seguimos com a análise. Obrigado!",
    ].join("\n");

  const semPendencias = pendentes.length === 0 && faltando.length === 0;

  return (
    <section className="card pendencias">
      <h3>Pendências para o cliente</h3>
      {semPendencias ? (
        <p className="ok">
          {arquivos.length === 0
            ? "Envie os documentos do cliente para iniciar a triagem."
            : "Nenhuma pendência — tudo validado ✅"}
        </p>
      ) : (
        <ul className="alert-list">
          {pendentes.map((a) => (
            <li key={a.id} className={a.status === "recusado" ? "erro" : "aviso"}>
              <span>{a.status === "recusado" ? "❌" : a.status === "processando" ? "⏳" : "⚠️"}</span>
              <div>
                <p><strong>{a.item.replace(/-/g, " ")}</strong> — {a.nomeOriginal}</p>
                {a.alertas.map((al, i) => (
                  <small key={i}>• {al.mensagem} <em>({al.regra})</em></small>
                ))}
              </div>
            </li>
          ))}
          {faltando.map((i) => (
            <li key={`falta-${i.id}`} className="info">
              <span>⬜</span>
              <div>
                <p><strong>{i.titulo}</strong> — falta enviar</p>
                <small>{i.descricao}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="footer-actions">
        <button
          className="btn primary"
          disabled={bloqueado}
          title={motivoBloqueio}
          onClick={() => {
            onEnviar();
            alert(
              emRevisao > 0
                ? `Proposta enviada ✅ — ${emRevisao} documento(s) seguem para a fila de exceção do Middle.`
                : "Proposta pronta para o Crédito ✅"
            );
          }}
        >
          Enviar documentos
        </button>
        <button className="btn" onClick={() => onCopiar(mensagemCliente())}>Copiar mensagem para o cliente</button>
        <button className="btn ghost" onClick={() => alert("Rascunho salvo (localStorage).")}>Salvar rascunho</button>
      </div>
      {bloqueado && motivoBloqueio && <p className="muted small">{motivoBloqueio}</p>}
    </section>
  );
}