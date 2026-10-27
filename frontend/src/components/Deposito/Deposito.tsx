import { useState, type FormEvent } from 'react'
import { depositarSaldo } from '../../services/api'
import './Deposito.css'

interface DepositoProps {
  token: string
}

function Deposito({ token }: DepositoProps) {
  const [valor, setValor] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensagem('')
    setErro('')
    setCarregando(true)

    try {
      const resultado = await depositarSaldo(Number(valor), token)
      setMensagem(
        `${resultado.mensagem} Saldo disponível: R$ ${Number(
          resultado.saldo_disponivel,
        ).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      )
      setValor('')
    } catch (erro) {
      setErro(
        erro instanceof Error ? erro.message : 'Não foi possível depositar.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section className="deposito">
      <h2>Adicionar saldo</h2>
      <form onSubmit={handleSubmit}>
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
        />
        <button type="submit" disabled={carregando}>
          {carregando ? 'Processando...' : 'Depositar'}
        </button>
      </form>

      {mensagem && <p role="status">{mensagem}</p>}
      {erro && <p role="alert">{erro}</p>}
    </section>
  )
}

export default Deposito