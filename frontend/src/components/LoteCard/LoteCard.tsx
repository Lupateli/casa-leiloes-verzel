import { useNavigate } from 'react-router-dom'
import type { Lote } from '../../types/Lote'
import './LoteCard.css'

interface LoteCardProps {
  lote: Lote
}

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function LoteCard({ lote }: LoteCardProps) {
  const navegar = useNavigate()

  function abrirDetalhes() {
    navegar(`/lotes/${lote.id}`)
  }

  return (
    <article
      className="lote-card"
      role="link"
      tabIndex={0}
      aria-label={`Ver detalhes do lote ${lote.nome}`}
      onClick={abrirDetalhes}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault()
          abrirDetalhes()
        }
      }}
    >
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
            <span>Incremento mínimo: 
              <strong> {formatarMoeda(lote.incremento_minimo)}</strong>
            </span>
          </div>

          <div className="detalhe-item">
            <span>Encerramento</span>
            <strong>
              {new Date(lote.encerramento).toLocaleString('pt-BR')}
            </strong>
          </div>
        </div>
      </div>
    </article>
  )
}

export default LoteCard