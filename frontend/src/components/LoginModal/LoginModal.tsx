import { useState, type FormEvent } from 'react'
import { loginUsuario } from '../../services/api'
import './LoginModal.css'

interface LoginModalProps {
  onClose: () => void
  onLoginSuccess: (usuario: {
    id: number
    username: string
    tipo: string
  }, token: string) => void
}

function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const dados = await loginUsuario(username, password)
      onLoginSuccess(dados.usuario, dados.token)
      onClose()
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível realizar o login.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onClick={(evento) => evento.stopPropagation()}
      >
        <button
          type="button"
          className="fechar-modal"
          onClick={onClose}
          aria-label="Fechar login"
        >
          ×
        </button>

        <h2 id="login-title">Entrar na plataforma</h2>
        <p>Acesse sua conta para participar dos leilões.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Digite seu usuário"
            autoComplete="username"
            value={username}
            onChange={(evento) => setUsername(evento.target.value)}
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            required
          />

          {erro && <p className="login-erro" role="alert">{erro}</p>}

          <button
            type="submit"
            className="primary-button"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default LoginModal
