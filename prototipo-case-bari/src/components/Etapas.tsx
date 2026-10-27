export function Etapas({ concluidos, total }: { concluidos: number; total: number }) {
  const etapas = [
    { nome: "Cadastro", pct: 100 },
    { nome: "Documentação", pct: Math.round((concluidos / total) * 100) },
    { nome: "Avaliação", pct: 0 },
    { nome: "Contrato", pct: 0 },
  ];
  return (
    <section className="card progress-card">
      <h3>Progresso da análise</h3>
      <p className="muted">{concluidos} de {total} concluídos</p>
      <div className="steps">
        {etapas.map((e) => (
          <div key={e.nome} className="step">
            <div className="step-bar">
              <div className="step-fill" style={{ width: `${e.pct}%` }} />
            </div>
            <span>{e.nome}</span>
            <small>{e.pct}%</small>
          </div>
        ))}
      </div>
    </section>
  );
}