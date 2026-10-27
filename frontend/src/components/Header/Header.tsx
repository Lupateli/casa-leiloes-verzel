import './Header.css'

interface HeaderProps {
  onLoginClick: () => void
}

function Header({ onLoginClick }: HeaderProps) {
  return (
    <header className="header">
      <h1>Casa de Leilões</h1>

      <nav>
        <a href="#inicio">Início</a>
        <a href="#leiloes">Leilões</a>

        <button
          type="button"
          className="login-button"
          onClick={onLoginClick}
        >
          Entrar
        </button>
      </nav>
    </header>
  )
}

export default Header