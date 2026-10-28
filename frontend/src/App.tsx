import { useEffect, useState } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import LoginModal from './components/LoginModal/LoginModal'
import LoteCard from './components/LoteCard/LoteCard'
import Deposito from './components/Deposito/Deposito'
import DetalhesLote from './pages/DetalhesLote/DetalhesLote'
import { buscarLotes } from './services/api'
import type { Lote } from './types/Lote'
import './App.css'
import CriarLote from './pages/CriarLote/CriarLote'

interface UsuarioLogado {
  id: number
  username: string
  tipo: string
}

function App() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null)
  const [token, setToken] = useState<string | null>(null)

useEffect(() => {
  async function carregarLotes() {
    try {
      const dados = await buscarLotes()
      setLotes(dados)
    } catch {
      setErro(
        'Não foi possível carregar os leilões. Tente novamente mais tarde.',
      )
    } finally {
      setCarregando(false)
    }
  }

  carregarLotes()
}, [])

  const participanteLogado =
    usuarioLogado?.tipo === 'PARTICIPANTE' && token !== null

  return (
    <div className="app">
      <Header
        onLoginClick={() => setMostrarLogin(true)}
        usuario={usuarioLogado}
        onLogout={() => {
          setUsuarioLogado(null)
          setToken(null)
        }}
      />

      <Routes>
        <Route
          path="/criar-lote"
          element={
            usuarioLogado?.tipo === 'LEILOEIRO' && token ? (
              <CriarLote token={token} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            <main id="inicio">
              <section className="hero">
                <h2>Encontre seu próximo negócio.</h2>

                <p>
                  Explore os lotes disponíveis e participe dos leilões
                  de forma simples e transparente.
                </p>

                <a href="#leiloes" className="primary-button">
                  Explorar leilões
                </a>
              </section>

              <section id="leiloes" className="auctions">
                <h2>Leilões disponíveis</h2>

                {carregando && <p>Carregando lotes...</p>}
                {erro && <p role="alert">{erro}</p>}

                {!carregando && !erro && lotes.length === 0 && (
                  <p>Nenhum lote cadastrado no momento.</p>
                )}

                {!erro && lotes.length > 0 && (
                  <div className="lotes-grid">
                    {lotes.map((lote) => (
                      <LoteCard key={lote.id} lote={lote} />
                    ))}
                  </div>
                )}
              </section>
            </main>
          }
        />

        <Route
          path="/lotes/:id"
          element={
            <DetalhesLote
              token={token}
              tipoUsuario={usuarioLogado?.tipo ?? null}
            />
          }
        />

        <Route
          path="/carteira"
          element={
            participanteLogado && token ? (
              <Deposito token={token} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      <footer>
        <p>Casa de Leilões Verzel © 2026</p>
      </footer>

      {mostrarLogin && (
        <LoginModal
          onClose={() => setMostrarLogin(false)}
          onLoginSuccess={(usuario, tokenRecebido) => {
            setUsuarioLogado(usuario)
            setToken(tokenRecebido)
            setMostrarLogin(false)
          }}
        />
      )}
    </div>
  )
}

export default App