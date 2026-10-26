# Casa de Leilões

API REST para gerenciamento de leilões, desenvolvida em Python com Django e Django REST Framework.

O projeto permite cadastrar lotes, receber lances de participantes, controlar valores reservados, encerrar leilões, gerar comprovantes de pagamento e verificar a integridade do histórico de lances.

## Tecnologias utilizadas

- **Python** — linguagem de programação.
- **Django** — framework para desenvolvimento da aplicação.
- **Django REST Framework** — criação dos endpoints da API REST.
- **PostgreSQL** — banco de dados relacional.
- **Git e GitHub** — controle de versão e hospedagem do código.

## Funcionalidades

### Gerenciamento de lotes
- Cadastro de lotes pelo leiloeiro.
- Definição de lance inicial, incremento mínimo e período do leilão.
- Consulta dos lotes cadastrados.
- Busca de itens utilizando a API Open Library.

### Sistema de lances
- Validação do valor mínimo permitido.
- Verificação do saldo disponível do participante.
- Reserva do valor correspondente ao lance.
- Liberação do valor reservado pelo participante que perde a liderança.
- Bloqueio de novos lances pelo participante que já está liderando o leilão.
- Prorrogação automática do encerramento quando um lance é recebido nos dois minutos finais.

### Encerramento dos leilões
- Validação do horário de encerramento.
- Identificação do vencedor.
- Transferência do valor do lance vencedor para o saldo disponível do leiloeiro.
- Atualização do saldo reservado do vencedor.
- Geração de comprovante de pagamento.
- Tratamento de leilões encerrados sem lances.

### Auditoria
- Registro do histórico de lances.
- Utilização de hashes para verificar a integridade dos registros.
- Identificação de alterações nos dados dos lances.

### Testes automatizados
O projeto possui testes automatizados para verificar regras de negócio, incluindo validação de lances, saldo, integridade do histórico e encerramento de leilões.

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
├── .env
├── .gitignore
└── README.md
```

**Observação:** a estrutura acima apresenta os principais arquivos do projeto. Outros arquivos necessários ao funcionamento do Django também fazem parte do repositório.

## Como executar o projeto

### Pré-requisitos

- Python 3.10 ou compatível com as dependências instaladas.
- PostgreSQL.
- Git.

### 1. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
cd casa-leiloes-verzel
```

Substitua `URL_DO_REPOSITORIO` pelo endereço do repositório.

### 2. Criar o ambiente virtual

No Windows, utilizando Git Bash:

```bash
python -m venv .venv
source .venv/Scripts/activate
```

### 3. Instalar as dependências

Se o projeto possuir um arquivo `requirements.txt`, execute:

```bash
pip install -r requirements.txt
```

### 4. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto, seguindo as configurações esperadas em `backend/config/settings.py`.

Exemplo de variáveis para conexão com PostgreSQL:

```env
DB_NAME=casa_leiloes
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
```

Os nomes das variáveis devem corresponder aos utilizados no arquivo de configurações do projeto. Ajuste o exemplo conforme a implementação existente.

Não publique senhas, chaves ou outras informações confidenciais no repositório.

### 5. Preparar o banco de dados

Crie o banco de dados PostgreSQL e execute, na pasta `backend`:

```bash
python manage.py migrate
```

### 6. Criar um superusuário

```bash
python manage.py createsuperuser
```

O superusuário poderá acessar a área administrativa do Django.

### 7. Iniciar o servidor

Ainda na pasta `backend`, execute:

```bash
python manage.py runserver
```

Por padrão, o servidor estará disponível em:

```text
http://127.0.0.1:8000/
```

A área administrativa poderá ser acessada em `/admin/`.

## Endpoints da API

Os endpoints implementados incluem:

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health/` | Verifica o funcionamento da API. |
| GET | `/api/lotes/` | Consulta os lotes. |
| GET | `/api/livros/buscar/` | Busca livros na Open Library. |
| POST | `/api/lotes/criar/` | Cadastra um lote. |
| POST | `/api/lances/criar/` | Registra um lance. |
| GET | `/api/lotes/<lote_id>/lances/` | Consulta o histórico de lances de um lote. |
| GET | `/api/lotes/<lote_id>/auditoria/` | Verifica a integridade do histórico. |
| POST | `/api/lotes/<lote_id>/encerrar/` | Encerra um leilão. |
| GET | `/api/comprovantes/` | Consulta comprovantes. |

Os endpoints protegidos exigem autenticação e podem aplicar restrições de acesso conforme o perfil do usuário.

Para autenticação pela interface do Django REST Framework, consulte `/api-auth/login/`.

## Executando os testes

Entre na pasta `backend` e execute:

```bash
python manage.py test
```

Os testes automatizados verificam diferentes comportamentos da aplicação, ajudando a identificar falhas nas regras de negócio durante o desenvolvimento.

## Decisões técnicas

### Separação das regras de negócio

As operações relacionadas ao registro de lances e ao encerramento dos leilões ficam em serviços próprios, separados das views responsáveis pelas requisições HTTP.

Essa organização facilita a manutenção do código e permite testar as regras de negócio de forma independente.

### Transações e concorrência

As operações financeiras utilizam transações para reduzir o risco de inconsistências durante o registro de lances e o encerramento dos leilões.

O projeto utiliza bloqueios de registros em operações críticas para ajudar a controlar acessos concorrentes ao mesmo lote.

### Integridade do histórico

Os registros de lances possuem hashes que permitem verificar se os dados registrados foram alterados.

Esse mecanismo ajuda a detectar alterações nos registros, mas não substitui controles completos de segurança, como proteção contra adulteração do banco de dados e armazenamento externo dos registros de auditoria.

## Integração externa

O projeto utiliza a API Open Library para pesquisar livros e obter informações que podem ser utilizadas na criação de lotes.

A consulta externa é uma funcionalidade complementar ao gerenciamento dos leilões.

## Uso de inteligência artificial

O desenvolvimento contou com apoio de ferramentas de inteligência artificial para auxiliar no estudo, na implementação, na análise de erros e na revisão do código.

As decisões de implementação, os testes e a validação do funcionamento da aplicação fazem parte do processo de desenvolvimento do projeto.

## Autor

Desenvolvido como projeto de preparação para processo seletivo técnico.

- **GitHub:** (https://github.com/Lupateli/casa-leiloes-verzel/tree/main/backend/auctions)