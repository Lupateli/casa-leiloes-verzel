import { useState, type FormEvent } from 'react'
import { cadastrarUsuario, loginUsuario } from '../../services/api'
import './LoginModal.css'

interface LoginModalProps {
  onClose: () => void
  onLoginSuccess: (
    usuario: {
      id: number
      username: string
      tipo: string
    },
    token: string,
  ) => void
}

function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [modoCadastro, setModoCadastro] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')
    setSucesso('')

    if (modoCadastro && password !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)

    try {
      if (modoCadastro) {
        await cadastrarUsuario(username, password)

        setSucesso('Cadastro realizado! Agora você pode entrar.')
        setModoCadastro(false)
        setPassword('')
        setConfirmarSenha('')
      } else {
        const dados = await loginUsuario(username, password)
        onLoginSuccess(dados.usuario, dados.token)
        onClose()
      }
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível concluir a operação.',
      )
    } finally {
      setCarregando(false)
    }
  }

  function alternarModo() {
    setModoCadastro(!modoCadastro)
    setErro('')
    setSucesso('')
    setPassword('')
    setConfirmarSenha('')
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
          aria-label="Fechar janela"
        >
          ×
        </button>

        <h2 id="login-title">
          {modoCadastro ? 'Criar conta' : 'Entrar na plataforma'}
        </h2>

        <p>
          {modoCadastro
            ? 'Cadastre-se para participar dos leilões.'
            : 'Acesse sua conta para participar dos leilões.'}
        </p>

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
            autoComplete={modoCadastro ? 'new-password' : 'current-password'}
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            minLength={modoCadastro ? 8 : undefined}
            required
          />

          {modoCadastro && (
            <>
              <label htmlFor="confirmar-senha">Confirmar senha</label>
              <input
                id="confirmar-senha"
                name="confirmar-senha"
                type="password"
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(evento) => setConfirmarSenha(evento.target.value)}
                minLength={8}
                required
              />
            </>
          )}

          {erro && (
            <p className="login-erro" role="alert">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="login-sucesso" role="status">
              {sucesso}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={carregando}
          >
            {carregando
              ? 'Aguarde...'
              : modoCadastro
                ? 'Cadastrar'
                : 'Entrar'}
          </button>
        </form>

        <p className="login-alternar">
          {modoCadastro ? 'Já possui uma conta?' : 'Ainda não tem uma conta?'}{' '}
          <button
            type="button"
            onClick={alternarModo}
            disabled={carregando}
          >
            {modoCadastro ? 'Entrar' : 'Cadastre-se'}
          </button>
        </p>
      </section>
    </div>
  )
}

export default LoginModal