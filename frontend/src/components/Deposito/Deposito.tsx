import { useState, type FormEvent } from 'react'
import { depositarSaldo } from '../../services/api'
import './Deposito.css'

interface DepositoProps {
  token: string
}

function Deposito({ token }: DepositoProps) {
  const [valor, setValor] = useState('')
  const [valorPendente, setValorPendente] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [saldo, setSaldo] = useState<number | null>(null)
  const [carregando, setCarregando] = useState(false)

  function solicitarConfirmacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensagem('')
    setErro('')

    const valorNumerico = Number(valor)

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor de depósito válido.')
      return
    }

    setValorPendente(valorNumerico)
  }

  async function confirmarDeposito() {
    if (valorPendente === null) return

    setCarregando(true)
    setErro('')
    setMensagem('')

    try {
      const resultado = await depositarSaldo(valorPendente, token)

      if (resultado.saldo_disponivel !== undefined) {
        setSaldo(Number(resultado.saldo_disponivel))
      }

      setMensagem(resultado.mensagem || 'Depósito realizado com sucesso.')
      setValor('')
      setValorPendente(null)
    } catch (erroDeposito) {
      setErro(
        erroDeposito instanceof Error
          ? erroDeposito.message
          : 'Não foi possível realizar o depósito.',
      )
    } finally {
      setCarregando(false)
    }
  }

  function formatarMoeda(valorNumerico: number) {
    return valorNumerico.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <main className="carteira-container">
      <header className="carteira-cabecalho">
        <span className="carteira-etiqueta">ÁREA DO PARTICIPANTE</span>
        <h1>Minha carteira</h1>
        <p>
          Gerencie seu saldo e prepare-se para participar dos leilões.
        </p>
      </header>

      <section className="carteira-saldo">
        <div>
          <span>Saldo disponível</span>

          <strong>
            {saldo === null ? 'Consulte após um depósito' : formatarMoeda(saldo)}
          </strong>

          <p>
            O saldo retornado pelo sistema será exibido aqui após a operação.
          </p>
        </div>
      </section>

      <section className="deposito">
        <h2>Adicionar saldo</h2>
        <p className="deposito-descricao">
          Informe quanto deseja adicionar à sua carteira.
        </p>

        <form onSubmit={solicitarConfirmacao}>
          <label htmlFor="valor-deposito">Valor do depósito (R$)</label>

          <input
            id="valor-deposito"
            type="number"
            min="0.01"
            step="0.01"
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
            placeholder="Ex.: 100,00"
            required
            disabled={carregando || valorPendente !== null}
          />

          <button
            type="submit"
            disabled={carregando || valorPendente !== null}
          >
            Continuar
          </button>
        </form>

        {valorPendente !== null && (
          <div className="deposito-confirmacao" role="dialog" aria-modal="true">
            <h3>Confirmar depósito</h3>

            <p>Você está prestes a adicionar:</p>

            <strong>{formatarMoeda(valorPendente)}</strong>

            <div className="deposito-acoes">
              <button
                type="button"
                className="deposito-cancelar"
                onClick={() => setValorPendente(null)}
                disabled={carregando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="deposito-confirmar"
                onClick={() => void confirmarDeposito()}
                disabled={carregando}
              >
                {carregando ? 'Processando...' : 'Confirmar depósito'}
              </button>
            </div>
          </div>
        )}

        {mensagem && <p className="deposito-sucesso" role="status">{mensagem}</p>}
        {erro && <p className="deposito-erro" role="alert">{erro}</p>}
      </section>
    </main>
  )
}

export default Deposito