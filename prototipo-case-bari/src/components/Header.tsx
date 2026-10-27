export function Header() {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-mark">b</span>
        <span className="logo-text">
          <strong>Banco Bari</strong>
          <small>Empréstimo imobiliário</small>
        </span>
      </div>
      <div className="chips">
        <span className="chip active">Envio dos documentos</span>
        <span className="chip">Precisa de ajuda?</span>
      </div>
    </header>
  );
}