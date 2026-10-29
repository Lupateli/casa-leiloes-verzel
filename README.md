# Casa de Leilões Verzel

Plataforma de leilões desenvolvida com **React, TypeScript, Python, Django REST Framework e PostgreSQL**.

O projeto permite gerenciar lotes, realizar lances, controlar saldos de participantes, encerrar leilões e verificar a integridade do histórico de lances. A aplicação também possui uma interface web para facilitar a utilização das funcionalidades.

## Tecnologias utilizadas

### Frontend
- React
- TypeScript
- Vite

### Backend
- Python
- Django
- Django REST Framework

### Banco de dados e ferramentas
- PostgreSQL
- Git e GitHub
- API Open Library

## Funcionalidades

### Cadastro e autenticação
- Cadastro de participantes.
- Login de usuários.
- Controle de acesso conforme o perfil do usuário.
- Restrição da criação de lotes aos usuários com perfil de leiloeiro.

### Gerenciamento de lotes
- Cadastro de lotes por leiloeiros.
- Definição do lance inicial, incremento mínimo e período do leilão.
- Consulta dos lotes cadastrados.
- Pesquisa de livros utilizando a API Open Library.

### Sistema de lances
- Validação do valor mínimo permitido.
- Verificação do saldo disponível do participante.
- Reserva do valor correspondente ao lance.
- Liberação do valor reservado quando o participante perde a liderança.
- Bloqueio de novos lances pelo participante que já está liderando o leilão.
- Prorrogação automática do encerramento quando um lance é recebido nos dois minutos finais.

### Encerramento dos leilões
- Validação do horário de encerramento.
- Identificação do vencedor.
- Transferência do valor do lance vencedor para o saldo disponível do leiloeiro.
- Atualização do saldo reservado do vencedor.
- Geração de comprovantes de pagamento.
- Tratamento de leilões encerrados sem lances.

### Auditoria do histórico
- Registro do histórico de lances.
- Utilização de hashes para verificar a integridade dos registros.
- Identificação de alterações nos dados dos lances.

### Testes automatizados
O projeto possui testes automatizados para verificar regras de negócio, incluindo validação de lances, controle de saldo, integridade do histórico e encerramento de leilões.

## Regras de negócio

1. Apenas usuários com perfil de leiloeiro podem cadastrar lotes e encerrar seus próprios leilões.
2. O participante precisa possuir saldo disponível suficiente para realizar um lance.
3. O primeiro lance deve respeitar o valor inicial do lote.
4. Os lances seguintes devem respeitar o incremento mínimo configurado.
5. O participante que estiver liderando o leilão não pode realizar outro lance no mesmo lote.
6. Quando um participante perde a liderança, o valor anteriormente reservado é liberado.
7. Os lances só são aceitos durante o período permitido do leilão.
8. Um lance recebido nos dois minutos finais prorroga o encerramento por mais dois minutos.
9. O encerramento transfere o valor do lance vencedor ao leiloeiro e gera um comprovante.
10. O histórico de lances pode ser auditado para detectar alterações nos registros.

## Estrutura do projeto

```text
casa-leiloes-verzel/
├── backend/
│   ├── auctions/
│   │   ├── migrations/
│   │   ├── tests/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── admin.py
│   │   ├── services_lances.py
│   │   └── services_encerramento.py
│   └── config/
│       ├── settings.py
│       └── urls.py
├── frontend/
├── .gitignore
└── README.md
```

A estrutura apresenta os principais diretórios e arquivos. Outros arquivos necessários ao funcionamento da aplicação também fazem parte do projeto.

## Como executar localmente

### Pré-requisitos

- Python compatível com as dependências do projeto.
- Node.js e npm.
- PostgreSQL.
- Git.

### 1. Clonar o repositório

```bash
git clone https://github.com/Lupateli/casa-leiloes-verzel.git
cd casa-leiloes-verzel
```

### 2. Configurar o backend

Entre na pasta do backend:

```bash
cd backend
```

Crie e ative um ambiente virtual.

No Windows, utilizando Git Bash:

```bash
python -m venv .venv
source .venv/Scripts/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

O comando pressupõe que o arquivo `requirements.txt` esteja dentro da pasta `backend`. Caso esteja em outro local, ajuste o caminho.

### 3. Configurar o PostgreSQL

Crie um banco de dados PostgreSQL para a aplicação.

Configure as variáveis de ambiente exigidas pelo projeto, conforme a implementação de `backend/config/settings.py`.

Por exemplo, caso a aplicação utilize essas variáveis:

```env
DB_NAME=casa_leiloes
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
```

Os nomes acima são ilustrativos e devem corresponder às configurações reais do projeto.

**Não compartilhe nem publique senhas, tokens, chaves secretas ou outras credenciais.**

### 4. Aplicar as migrações

Ainda na pasta do backend, execute:

```bash
python manage.py migrate
```

### 5. Criar um superusuário

Para acessar a área administrativa do Django:

```bash
python manage.py createsuperuser
```

Essa conta é destinada à administração da aplicação. Para testar as funcionalidades comuns, utilize contas com os perfis apropriados.

### 6. Iniciar o backend

```bash
python manage.py runserver
```

Por padrão, a API estará disponível em:

`http://127.0.0.1:8000/`

A área administrativa poderá ser acessada em `/admin/`.

### 7. Iniciar o frontend

Abra outro terminal e entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local para acessar a interface.

**Observação:** as instruções de instalação e as variáveis de ambiente devem ser ajustadas caso a estrutura ou as configurações reais do repositório sejam diferentes.

## Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health/` | Verifica o funcionamento da API. |
| POST | `/api/cadastro/` | Cadastra um participante. |
| POST | `/api/login/` | Autentica um usuário. |
| GET | `/api/lotes/` | Consulta os lotes. |
| GET | `/api/livros/buscar/` | Pesquisa livros na Open Library. |
| POST | `/api/lotes/criar/` | Cadastra um lote. |
| POST | `/api/lances/criar/` | Registra um lance. |
| GET | `/api/lotes/<lote_id>/lances/` | Consulta o histórico de lances de um lote. |
| GET | `/api/lotes/<lote_id>/auditoria/` | Verifica a integridade do histórico. |
| POST | `/api/lotes/<lote_id>/encerrar/` | Encerra um leilão. |
| GET | `/api/comprovantes/` | Consulta comprovantes. |
| POST | `/api/carteira/depositar/` | Realiza um depósito na carteira. |

Os endpoints podem exigir autenticação e aplicar restrições de acesso conforme o perfil do usuário.

A autenticação da API é realizada pelo endpoint `/api/login/`. O acesso à interface navegável do Django REST Framework, quando habilitado, é disponibilizado por `/api-auth/`.

## Executando os testes

Na pasta `backend`, execute:

```bash
python manage.py test
```

Os testes automatizados ajudam a verificar o comportamento da aplicação e a identificar falhas nas regras de negócio durante o desenvolvimento.

## Decisões técnicas

### Separação das regras de negócio

As operações relacionadas ao registro de lances e ao encerramento dos leilões ficam em serviços próprios, separados das views responsáveis pelas requisições HTTP.

Essa organização facilita a manutenção do código e permite testar as regras de negócio de forma independente.

### Transações e concorrência

As operações críticas utilizam transações para reduzir o risco de inconsistências durante o registro de lances e o encerramento dos leilões.

O uso de bloqueios de registros ajuda a controlar acessos concorrentes ao mesmo lote.

### Integridade do histórico

Os registros de lances possuem hashes que permitem verificar se os dados registrados foram alterados.

Esse mecanismo ajuda a detectar alterações, mas não substitui controles adicionais de segurança, como proteção contra adulteração do banco de dados e armazenamento externo dos registros de auditoria.

### Integração externa

A aplicação utiliza a API Open Library para pesquisar livros e obter informações que podem ser utilizadas na criação de lotes.

## Uso de inteligência artificial

O desenvolvimento contou com o apoio de ferramentas de inteligência artificial para auxiliar no estudo, na implementação, na análise de erros e na revisão do código.

As decisões de implementação, os testes e a validação do funcionamento da aplicação fazem parte do processo de desenvolvimento do projeto.

## Autor

Desenvolvido como projeto de preparação para processo seletivo técnico.

- **GitHub:** [Repositório do projeto](https://github.com/Lupateli/casa-leiloes-verzel)

##  Conta para testes de leiloeiro

Para testar todas as funcionalidades da plataforma, utilize as contas disponibilizadas abaixo.

### 🔨 Leiloeiro
Utilize uma conta de leiloeiro para:
- Cadastrar novos lotes.
- Gerenciar os lotes disponíveis na plataforma.
- user:Gabriel
- senha:12345678

**Importante:** o cadastro de novas contas de leiloeiro não está disponível publicamente. Para testar essa funcionalidade, utilize a conta de leiloeiro fornecida para os testes.
