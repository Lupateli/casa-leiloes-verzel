import { Link, NavLink } from 'react-router-dom'
import './Header.css'

interface HeaderProps {
  onLoginClick: () => void
  usuario: {
    username: string
    tipo: string
  } | null
  onLogout: () => void
}

function Header({ onLoginClick, usuario, onLogout }: HeaderProps) {
  const participanteLogado = usuario?.tipo === 'PARTICIPANTE'
  const leiloeiroLogado = usuario?.tipo === 'LEILOEIRO'

  return (
    <header className="header">
      <Link
        to="/"
        className="header-logo"
        aria-label="Casa de Leilões - Início"
      >
        <span className="header-logo-simbolo">C</span>

        <span className="header-logo-texto">
          <strong>Casa de Leilões</strong>
          <small>NEGÓCIOS E OPORTUNIDADES</small>
        </span>
      </Link>

      <nav className="header-nav" aria-label="Navegação principal">
        <NavLink to="/" end>
          Início
        </NavLink>

        <a href="/#leiloes">Leilões</a>
      </nav>

      <div className="header-acoes">
        {usuario ? (
          <>
            {leiloeiroLogado && (
              <NavLink to="/criar-lote" className="header-carteira">
                Cadastrar lote
              </NavLink>
            )}

            {participanteLogado && (
              <NavLink to="/carteira" className="header-carteira">
                Minha carteira
              </NavLink>
            )}

            <div className="header-usuario">
              <span className="header-avatar">
                {usuario.username.charAt(0).toUpperCase()}
              </span>

              <div className="header-usuario-info">
                <strong>{usuario.username}</strong>

                <span>
                  {participanteLogado ? 'Participante' : 'Leiloeiro'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="header-sair"
              onClick={onLogout}
            >
              Sair
            </button>
          </>
        ) : (
          <button
            type="button"
            className="login-button"
            onClick={onLoginClick}
          >
            Entrar na conta
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
