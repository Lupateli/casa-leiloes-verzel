import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  buscarLotes,
  buscarHistoricoLances,
  darLance,
} from '../../services/api'
import type { Lote } from '../../types/Lote'
import './DetalhesLote.css'

interface Lance {
  id: number
  lote: number
  participante: number
  participante_nome: string
  valor: string | number
  criado_em: string
}

interface DetalhesLoteProps {
  token: string | null
  tipoUsuario: string | null
}

function formatarMoeda(valor: string | number): string {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarData(data: string): string {
  return new Date(data).toLocaleString('pt-BR')
}

function DetalhesLote({
  token,
  tipoUsuario,
}: DetalhesLoteProps) {
  const { id } = useParams<{ id: string }>()

  const [lote, setLote] = useState<Lote | null>(null)
  const [historico, setHistorico] = useState<Lance[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [valorPersonalizado, setValorPersonalizado] = useState('')
  const [lancePendente, setLancePendente] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const carregarDados = useCallback(async () => {
    if (!id) {
      setErro('Lote não informado.')
      setCarregando(false)
      return
    }

    try {
      setErro('')

      const [lotes, lances] = await Promise.all([
        buscarLotes(),
        buscarHistoricoLances(Number(id)),
      ])

      const loteEncontrado = lotes.find(
        (item) => item.id === Number(id),
      )

      if (!loteEncontrado) {
        setLote(null)
        setErro('Não foi possível encontrar este lote.')
        return
      }

      setLote(loteEncontrado)
      setHistorico(lances as Lance[])
    } catch {
      setErro('Não foi possível carregar os dados do lote.')
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => {
    let cancelado = false

    async function carregar() {
        if (!id) return

        try {
        const [lotes, lances] = await Promise.all([
            buscarLotes(),
            buscarHistoricoLances(Number(id)),
        ])

        if (cancelado) return

        const loteEncontrado = lotes.find(
            (item) => item.id === Number(id),
        )

        if (!loteEncontrado) {
            setLote(null)
            setErro('Não foi possível encontrar este lote.')
            return
        }

        setErro('')
        setLote(loteEncontrado)
        setHistorico(lances as Lance[])
        } catch {
        if (!cancelado) {
            setErro('Não foi possível carregar os dados do lote.')
        }
        } finally {
        if (!cancelado) {
            setCarregando(false)
        }
        }
    }

    void carregar()

    return () => {
        cancelado = true
    }
    }, [id])

    function calcularLanceAutomatico(): number {
        if (!lote) return 0

        const lanceInicial = Math.round(Number(lote.lance_inicial) * 100)
        const maiorLance = Math.round(Number(lote.maior_lance) * 100)
        const incremento = Math.round(Number(lote.incremento_minimo) * 100)

        const valorMinimo =
            historico.length === 0
            ? lanceInicial + incremento
            : maiorLance + incremento

        return valorMinimo / 100
    }



  function solicitarConfirmacao(valor: number) {
    setMensagem('')
    setErro('')
    setLancePendente(valor)
  }

  async function confirmarLance() {
    if (!token || !lote || lancePendente === null) {
      setErro('Faça login para participar do leilão.')
      return
    }

    try {
      setEnviando(true)
      setErro('')
      setMensagem('')

      await darLance(lote.id, lancePendente, token)

      setMensagem('Lance registrado com sucesso!')
      setLancePendente(null)
      setValorPersonalizado('')

      await carregarDados()
    } catch (erroLance) {
      setErro(
        erroLance instanceof Error
          ? erroLance.message
          : 'Não foi possível registrar o lance.',
      )
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <main className="detalhes-container">
        <p>Carregando detalhes do lote...</p>
      </main>
    )
  }

  if (erro && !lote) {
    return (
      <main className="detalhes-container">
        <p className="mensagem-erro" role="alert">{erro}</p>
        <Link to="/" className="botao-voltar">
          Voltar aos leilões
        </Link>
      </main>
    )
  }

  if (!lote) return null

  const leilaoAberto = lote.status === 'ABERTO'
  const podeDarLance =
    Boolean(token) &&
    tipoUsuario === 'PARTICIPANTE' &&
    leilaoAberto

  return (
    <main className="detalhes-container">
      <Link to="/" className="link-voltar">
        ← Voltar aos leilões
      </Link>

      <section className="detalhes-card">
        <div className="detalhes-imagem">
          {lote.imagem_url ? (
            <img src={lote.imagem_url} alt={lote.nome} />
          ) : (
            <div className="detalhes-imagem-vazia">
              Imagem não disponível
            </div>
          )}

          <span className={`detalhes-status status-${lote.status.toLowerCase()}`}>
            {lote.status}
          </span>
        </div>

        <div className="detalhes-conteudo">
          <h1>{lote.nome}</h1>
          <p className="detalhes-descricao">{lote.descricao}</p>

          <div className="detalhes-informacoes">
            <div className="informacao-lote">
              <span>Lance inicial</span>
              <strong>{formatarMoeda(lote.lance_inicial)}</strong>
            </div>

            <div className="informacao-lote maior-lance-detalhe">
              <span>Maior lance atual</span>
              <strong>{formatarMoeda(lote.maior_lance)}</strong>
            </div>

            <div className="informacao-lote">
              <span>Incremento mínimo</span>
              <strong>{formatarMoeda(lote.incremento_minimo)}</strong>
            </div>

            <div className="informacao-lote">
              <span>Encerramento</span>
              <strong>{formatarData(lote.encerramento)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="area-lances">
        <h2>Participar do leilão</h2>

        {!token && (
          <p>Faça login para poder registrar um lance.</p>
        )}

        {token && tipoUsuario !== 'PARTICIPANTE' && (
          <p>Apenas participantes podem dar lances.</p>
        )}

        {!leilaoAberto && (
          <p>Este lote não está aberto para lances.</p>
        )}

        {podeDarLance && (
          <div className="opcoes-lance">
            <div className="opcao-lance">
              <h3>Lance automático</h3>
              <p>
                Calcular o menor valor aceito pelas regras atuais
                do leilão.
              </p>

              <strong className="valor-automatico">
                {formatarMoeda(calcularLanceAutomatico())}
              </strong>

              <button
                type="button"
                className="botao-lance"
                onClick={() =>
                  solicitarConfirmacao(calcularLanceAutomatico())
                }
                disabled={enviando || lancePendente !== null}
              >
                Usar lance automático
              </button>
            </div>

            <div className="opcao-lance">
              <h3>Lance personalizado</h3>
              <p>Digite o valor que deseja oferecer.</p>

              <label htmlFor="valor-lance">
                Valor do lance (R$)
              </label>

              <input
                id="valor-lance"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex.: 1500,00"
                value={valorPersonalizado}
                onChange={(evento) =>
                  setValorPersonalizado(evento.target.value)
                }
                disabled={enviando || lancePendente !== null}
              />

              <button
                type="button"
                className="botao-lance"
                onClick={() => {
                  const valor = Number(valorPersonalizado)

                  if (
                    !valorPersonalizado ||
                    !Number.isFinite(valor) ||
                    valor <= 0
                  ) {
                    setErro('Informe um valor válido para o lance.')
                    return
                  }

                  solicitarConfirmacao(valor)
                }}
                disabled={enviando || lancePendente !== null}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        <section className="historico-section">
        <h2>Histórico de lances</h2>

        {historico.length === 0 ? (
          <p className="historico-vazio">
            Ainda não há lances para este lote.
          </p>
        ) : (
          <div className="historico-tabela-container">
            <table className="historico-tabela">
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Valor</th>
                  <th>Data e hora</th>
                </tr>
              </thead>

              <tbody>
                {[...historico].reverse().map((lance) => (
                  <tr key={lance.id}>
                    <td>{lance.participante_nome}</td>
                    <td className="valor-historico">
                      {formatarMoeda(lance.valor)}
                    </td>
                    <td>{formatarData(lance.criado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

        {lancePendente !== null && (
          <div className="confirmacao-lance" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacao">
            <h3 id="titulo-confirmacao">Confirmar lance</h3>

            <p>Você está prestes a registrar um lance de:</p>

            <strong>{formatarMoeda(lancePendente)}</strong>

            <p>Deseja confirmar essa operação?</p>

            <div className="botoes-confirmacao">
              <button
                type="button"
                className="botao-cancelar"
                onClick={() => setLancePendente(null)}
                disabled={enviando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="botao-confirmar"
                onClick={() => void confirmarLance()}
                disabled={enviando}
              >
                {enviando ? 'Registrando...' : 'Confirmar lance'}
              </button>
            </div>
          </div>
        )}

        {erro && (
          <p className="mensagem-erro" role="alert">{erro}</p>
        )}

        {mensagem && (
          <p className="mensagem-sucesso" role="status">{mensagem}</p>
        )}
      </section>
    </main>
  )
}

export default DetalhesLote