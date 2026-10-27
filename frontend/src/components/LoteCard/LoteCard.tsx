import { useState, type FormEvent } from 'react'
import type { Lote } from '../../types/Lote'
import { darLance, buscarHistoricoLances } from '../../services/api'
import './LoteCard.css'

interface LoteCardProps {
  lote: Lote
  token: string | null
  tipoUsuario: string | null
}

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function LoteCard({ lote, token, tipoUsuario }: LoteCardProps) {
  const [valor, setValor] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [historico, setHistorico] = useState<any[]>([])
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [erroHistorico, setErroHistorico] = useState('')

  async function handleHistorico() {
    setMostrarHistorico(!mostrarHistorico)

    if (mostrarHistorico) return

    setCarregandoHistorico(true)
    setErroHistorico('')

    try {
      const dados = await buscarHistoricoLances(lote.id)
      setHistorico(dados)
    } catch {
      setErroHistorico('Não foi possível carregar o histórico.')
    } finally {
      setCarregandoHistorico(false)
    }
  }

  async function handleLance(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensagem('')
    setErro('')
    setCarregando(true)

    try {
      const resultado = await darLance(
        lote.id,
        Number(valor),
        token!,
      )

      setMensagem(
        `Lance de ${formatarMoeda(resultado.valor)} registrado com sucesso!`,
      )
      setValor('')
    } catch (erro) {
      setErro(
        erro instanceof Error ? erro.message : 'Não foi possível registrar o lance.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <article className="lote-card">
      <div className="lote-imagem">
        {lote.imagem_url ? (
          <img src={lote.imagem_url} alt={lote.nome} />
        ) : (
          <div className="imagem-indisponivel">
            <span>Imagem não disponível</span>
          </div>
        )}

        <span className={`status status-${lote.status.toLowerCase()}`}>
          {lote.status}
        </span>
      </div>

      <div className="lote-conteudo">
        <h3>{lote.nome}</h3>

        <p className="lote-descricao">{lote.descricao}</p>

      <div className="lote-preco">
        <span>Lance inicial</span>
        <strong className="lance-inicial">
          {formatarMoeda(lote.lance_inicial)}
        </strong>
      </div>

      <div className="lote-preco maior-lance">
        <span>Maior lance atual</span>
        <strong>{formatarMoeda(lote.maior_lance)}</strong>
      </div>

        <div className="lote-detalhes">
          <div className="detalhe-item">
            <span>Incremento mínimo</span>
            <strong>{formatarMoeda(lote.incremento_minimo)}</strong>
          </div>

          <div className="detalhe-item">
            <span>Encerramento</span>
            <strong>
              {new Date(lote.encerramento).toLocaleString('pt-BR')}
            </strong>
          </div>
        </div>

        {tipoUsuario === 'PARTICIPANTE' && token && (
          <form onSubmit={handleLance} className="form-lance">
            <label htmlFor={`lance-${lote.id}`}>Seu lance (R$)</label>

            <input
              id={`lance-${lote.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              placeholder="Ex.: 150,00"
              required
            />

            <button type="submit" className="lote-botao" disabled={carregando}>
              {carregando ? 'Enviando...' : 'Dar lance'}
            </button>

            {mensagem && <p role="status">{mensagem}</p>}
            {erro && <p role="alert">{erro}</p>}
          </form>
        )}

        {!token && (
          <p>Faça login como participante para dar um lance.</p>
        )}

        {token && tipoUsuario === 'LEILOEIRO' && (
          <p>O leiloeiro não pode dar lances.</p>
        )}
      </div>
    </article>
  )
}

export default LoteCard