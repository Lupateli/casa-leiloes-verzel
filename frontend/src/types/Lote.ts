export interface Lote {
  id: number
  nome: string
  descricao: string
  lance_inicial: string | number
  maior_lance: string | number
  incremento_minimo: string | number
  encerramento: string
  status: string
}

export interface Lote {
  id: number
  nome: string
  descricao: string
  imagem_url: string | null
  lance_inicial: string | number
  incremento_minimo: string | number
  encerramento: string
  status: string
}
