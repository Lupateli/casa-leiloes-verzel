import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarLivros, criarLote } from '../../services/api'
import type { Livro } from '../../services/api'
import './CriarLote.css'

interface CriarLoteProps {
  token: string
}

interface FormularioLote {
  nome: string
  descricao: string
  imagem_url: string
  api_item_id: string
  lance_inicial: string
  incremento_minimo: string
  inicio: string
  encerramento: string
}



const formularioInicial: FormularioLote = {
  nome: '',
  descricao: '',
  imagem_url: '',
  api_item_id: '',
  lance_inicial: '',
  incremento_minimo: '',
  inicio: '',
  encerramento: '',
}

function CriarLote({ token }: CriarLoteProps) {
  const navegar = useNavigate()

  const [formulario, setFormulario] =
    useState<FormularioLote>(formularioInicial)

  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [livros, setLivros] = useState<Livro[]>([])
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null)
  const [buscandoLivros, setBuscandoLivros] = useState(false)

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  function atualizarCampo(campo: keyof FormularioLote, valor: string) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }))
  }

  async function handleBuscarLivros(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')
    setSucesso('')

    if (!termoPesquisa.trim()) {
      setErro('Digite o título de um livro para pesquisar.')
      return
    }

    setBuscandoLivros(true)
    setLivros([])

    try {
      const resultados = await buscarLivros(termoPesquisa.trim())
      setLivros(resultados)

      if (resultados.length === 0) {
        setErro('Nenhum livro encontrado. Tente outro título.')
      }
    } catch (erroBusca) {
      setErro(
        erroBusca instanceof Error
          ? erroBusca.message
          : 'Não foi possível buscar os livros.',
      )
    } finally {
      setBuscandoLivros(false)
    }
  }

  function selecionarLivro(livro: Livro) {
    setLivroSelecionado(livro)

    setFormulario((anterior) => ({
      ...anterior,
      nome: livro.titulo,
      descricao: [
        livro.autor ? `Autor: ${livro.autor}` : '',
        livro.ano ? `Ano de publicação: ${livro.ano}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      imagem_url: livro.imagem_url,
      api_item_id: livro.open_library_id,
    }))

    setErro('')
    setSucesso('')
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')
    setSucesso('')

    if (!formulario.api_item_id) {
      setErro('Pesquise e selecione um livro antes de cadastrar o lote.')
      return
    }

    if (
      !formulario.nome.trim() ||
      !formulario.lance_inicial ||
      !formulario.incremento_minimo ||
      !formulario.inicio ||
      !formulario.encerramento
    ) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    const lanceInicial = Number(formulario.lance_inicial)
    const incrementoMinimo = Number(formulario.incremento_minimo)

    if (
      !Number.isFinite(lanceInicial) ||
      !Number.isFinite(incrementoMinimo) ||
      lanceInicial <= 0 ||
      incrementoMinimo <= 0
    ) {
      setErro('Os valores dos lances devem ser maiores que zero.')
      return
    }

    const inicio = new Date(formulario.inicio)
    const encerramento = new Date(formulario.encerramento)

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(encerramento.getTime()) ||
      encerramento <= inicio
    ) {
      setErro('O encerramento deve ocorrer depois do início do leilão.')
      return
    }

    setCarregando(true)

    try {
      await criarLote(
        {
          nome: formulario.nome.trim(),
          descricao: formulario.descricao.trim(),
          imagem_url: formulario.imagem_url.trim(),
          api_item_id: formulario.api_item_id,
          lance_inicial: lanceInicial,
          incremento_minimo: incrementoMinimo,
          inicio: inicio.toISOString(),
          encerramento: encerramento.toISOString(),
        },
        token,
      )

      setSucesso('Lote cadastrado com sucesso!')
      setFormulario(formularioInicial)
      setLivroSelecionado(null)
      setTermoPesquisa('')
      setLivros([])
    } catch (erroCadastro) {
      setErro(
        erroCadastro instanceof Error
          ? erroCadastro.message
          : 'Não foi possível cadastrar o lote.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="criar-lote-container">
      <header className="criar-lote-cabecalho">
        <span className="criar-lote-etiqueta">ÁREA DO LEILOEIRO</span>
        <h1>Cadastrar novo lote</h1>
        <p>
          Pesquise um livro da Open Library e selecione o item que deseja
          disponibilizar no leilão.
        </p>
      </header>


      {!livroSelecionado && (
        <section className="criar-lote-secao criar-lote-pesquisa">
          <h2>1. Escolha o livro</h2>

          <form onSubmit={handleBuscarLivros}>
            <div className="criar-lote-campo">
              <label htmlFor="pesquisa-livro">Título do livro</label>

              <input
                id="pesquisa-livro"
                type="search"
                value={termoPesquisa}
                onChange={(evento) => setTermoPesquisa(evento.target.value)}
                placeholder="Ex.: Dom Casmurro"
              />
              <button
                type="submit"
                className="criar-lote-enviar"
                disabled={buscandoLivros}
              >
                {buscandoLivros ? 'Pesquisando...' : 'Pesquisar'}
              </button>
            </div>

          </form>

          {livros.length > 0 && (
            <div className="criar-lote-livros">
              {livros.map((livro: Livro) => {
                const selecionado = false
                return (
                  <article
                    className={`criar-lote-livro ${selecionado ? 'selecionado' : ''}`}
                    key={livro.open_library_id}
                  >
                    {livro.imagem_url ? (
                      <img
                        src={livro.imagem_url}
                        alt={`Capa de ${livro.titulo}`}
                      />
                    ) : (
                      <div className="criar-lote-sem-capa">
                        Sem capa
                      </div>
                    )}

                    <div className="criar-lote-livro-info">
                      <h3>{livro.titulo}</h3>

                      <p>{livro.autor || 'Autor não informado'}</p>

                      <small>
                        {livro.ano ?? 'Ano não informado'}
                      </small>

                      <button
                        type="button"
                        className="criar-lote-enviar"
                        onClick={() => selecionarLivro(livro)}
                      >
                        Selecionar livro
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}


      <form className="criar-lote-formulario" onSubmit={handleSubmit}>
        <section className="criar-lote-secao">
          <h2>2. Informações do lote</h2>

          {livroSelecionado && (
            <p className="criar-lote-livro-confirmado">
              Livro selecionado: <strong>{livroSelecionado.titulo}</strong>
            </p>
          )}

          <div className="criar-lote-campo">
            <label htmlFor="nome">Nome do lote *</label>
            <input
              id="nome"
              type="text"
              maxLength={200}
              value={formulario.nome}
              onChange={(evento) => atualizarCampo('nome', evento.target.value)}
              required
            />
          </div>

          <div className="criar-lote-campo">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              rows={4}
              value={formulario.descricao}
              onChange={(evento) =>
                atualizarCampo('descricao', evento.target.value)
              }
              placeholder="Informações sobre o livro..."
            />
          </div>

          <div className="criar-lote-campo">
            <label htmlFor="imagem_url">URL da imagem da capa</label>
            <input
              id="imagem_url"
              type="url"
              value={formulario.imagem_url}
              onChange={(evento) =>
                atualizarCampo('imagem_url', evento.target.value)
              }
            />
          </div>

          <div className="criar-lote-campo">
            <label htmlFor="api_item_id">Identificador na Open Library</label>
            <input
              id="api_item_id"
              type="text"
              value={formulario.api_item_id}
              readOnly
            />
          </div>
        </section>

        <section className="criar-lote-secao">
          <h2>3. Valores do leilão</h2>

          <div className="criar-lote-grade">
            <div className="criar-lote-campo">
              <label htmlFor="lance_inicial">Lance inicial (R$) *</label>
              <input
                id="lance_inicial"
                type="number"
                min="0.01"
                step="0.01"
                value={formulario.lance_inicial}
                onChange={(evento) =>
                  atualizarCampo('lance_inicial', evento.target.value)
                }
                required
              />
            </div>

            <div className="criar-lote-campo">
              <label htmlFor="incremento_minimo">Incremento mínimo (R$) *</label>
              <input
                id="incremento_minimo"
                type="number"
                min="0.01"
                step="0.01"
                value={formulario.incremento_minimo}
                onChange={(evento) =>
                  atualizarCampo('incremento_minimo', evento.target.value)
                }
                required
              />
            </div>
          </div>
        </section>

        <section className="criar-lote-secao">
          <h2>4. Período do leilão</h2>

          <div className="criar-lote-grade">
            <div className="criar-lote-campo">
              <label htmlFor="inicio">Início *</label>
              <input
                id="inicio"
                type="datetime-local"
                value={formulario.inicio}
                onChange={(evento) =>
                  atualizarCampo('inicio', evento.target.value)
                }
                required
              />
            </div>

            <div className="criar-lote-campo">
              <label htmlFor="encerramento">Encerramento *</label>
              <input
                id="encerramento"
                type="datetime-local"
                value={formulario.encerramento}
                onChange={(evento) =>
                  atualizarCampo('encerramento', evento.target.value)
                }
                required
              />
            </div>
          </div>
        </section>

        {erro && (
          <p className="criar-lote-mensagem erro" role="alert">
            {erro}
          </p>
        )}

        {sucesso && (
          <p className="criar-lote-mensagem sucesso" role="status">
            {sucesso}
          </p>
        )}

        <div className="criar-lote-acoes">
          <button
            type="button"
            className="criar-lote-voltar"
            onClick={() => navegar('/')}
            disabled={carregando}
          >
            Voltar
          </button>

          <button
            type="submit"
            className="criar-lote-enviar"
            disabled={carregando || !livroSelecionado}
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar lote'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default CriarLote