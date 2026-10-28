import type { Lote } from '../types/Lote'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '')

export interface Livro {
  titulo: string
  autor: string
  ano: number | null
  open_library_id: string
  imagem_url: string
}

export async function buscarLivros(termo: string): Promise<Livro[]> {
  const parametros = new URLSearchParams({ titulo: termo })

  const resposta = await fetch(
    `${API_URL}/livros/buscar/?${parametros.toString()}`,
  )

  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(
      dados.erro || 'Não foi possível buscar os livros.',
    )
  }

  return dados as Livro[]
}

export interface DadosLogin {
  token: string
  usuario: {
    id: number
    username: string
    tipo: string
  }
}

export async function buscarLotes(): Promise<Lote[]> {
  const resposta = await fetch(`${API_URL}/lotes/`)

  if (!resposta.ok) {
    throw new Error('Não foi possível carregar os lotes.')
  }

  return resposta.json() as Promise<Lote[]>
}

export async function loginUsuario(
  username: string,
  password: string,
): Promise<DadosLogin> {
  const resposta = await fetch(`${API_URL}/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(
      dados.non_field_errors?.[0] || 'Usuário ou senha inválidos.',
    )
  }

  return dados as DadosLogin
}

export async function cadastrarUsuario(
  username: string,
  password: string,
): Promise<void> {
  const resposta = await fetch(`${API_URL}/cadastro/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        dados.username?.[0] ||
        dados.password?.[0] ||
        'Não foi possível realizar o cadastro.',
    )
  }
}

export async function depositarSaldo(
  valor: number,
  token: string,
): Promise<{ mensagem?: string; saldo_disponivel?: string }> {
  const resposta = await fetch(`${API_URL}/carteira/depositar/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ valor }),
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(
      dados.detail || dados.erro || 'Não foi possível realizar o depósito.',
    )
  }

  return dados
}

export async function darLance(
  loteId: number,
  valor: number,
  token: string,
) {
  const resposta = await fetch(`${API_URL}/lances/criar/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      lote: loteId,
      valor,
    }),
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    const mensagemErro =
      typeof dados === 'object'
        ? Object.values(dados).flat().join(' ')
        : 'Não foi possível registrar o lance.'

    throw new Error(mensagemErro)
  }

  return dados
}

export async function buscarHistoricoLances(loteId: number) {
  const resposta = await fetch(`${API_URL}/lotes/${loteId}/lances/`)

  if (!resposta.ok) {
    throw new Error('Não foi possível carregar o histórico de lances.')
  }

  return resposta.json()
}

export interface DadosNovoLote {
  nome: string
  descricao: string
  imagem_url: string
  api_item_id: string
  lance_inicial: number
  incremento_minimo: number
  inicio: string
  encerramento: string
}

export async function criarLote(
  lote: DadosNovoLote,
  token: string,
) {
  const resposta = await fetch(`${API_URL}/lotes/criar/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(lote),
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    const mensagemErro =
      typeof dados === 'object'
        ? Object.entries(dados)
            .map(([campo, mensagens]) => {
              const texto = Array.isArray(mensagens)
                ? mensagens.join(' ')
                : String(mensagens)

              return `${campo}: ${texto}`
            })
            .join(' ')
        : 'Não foi possível cadastrar o lote.'

    throw new Error(mensagemErro)
  }

  return dados
}