# CORA ERP - Documentacao Tecnica

## Sistema de Gestao Financeira - Instituicao S4

**Versao:** 0.1.0
**Data:** Marco 2026
**Cliente:** CORA Sociedade de Credito, Financiamento e Investimento S.A.

---

## 1. Visao Geral

O CORA ERP e um sistema web completo de gestao financeira desenvolvido para uma instituicao financeira S4 (SCFI), replicando os 14 modulos do ERP Matera (Proposta OP-01568) com APIs REST completas de leitura e escrita.

### 1.1 Numeros do Projeto

| Metrica | Valor |
|---------|-------|
| Total de arquivos de codigo | 155+ |
| Linhas de codigo | 18.000+ |
| Entidades no banco de dados | 55+ |
| Linhas no schema Prisma | 1.368 |
| Modulos implementados | 14 de 14 |
| Endpoints REST estimados | 200+ |

### 1.2 Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js + TypeScript (NestJS 10) |
| Frontend | React + TypeScript (Next.js 14, App Router) |
| Banco de Dados | PostgreSQL 16 |
| ORM | Prisma 6 |
| Cache | Redis 7 |
| Monorepo | Turborepo |
| Testes | Jest + Supertest |
| CI/CD | GitHub Actions |
| Containerizacao | Docker Compose |
| CSS | Tailwind CSS 3 |

---

## 2. Arquitetura

### 2.1 Estrutura do Monorepo

```
cora-erp/
├── apps/
│   ├── api/                    # NestJS REST API (backend)
│   │   ├── prisma/             # Schema + migrations + seed
│   │   └── src/
│   │       ├── common/         # Guards, interceptors, decorators, DTOs, pipes
│   │       └── modules/        # Modulos do ERP (14 implementados)
│   └── web/                    # Next.js (frontend)
│       └── src/
│           ├── app/            # Pages (App Router)
│           ├── components/     # Layout components
│           ├── contexts/       # Auth context
│           └── lib/            # API client
├── packages/
│   └── shared/                 # Tipos, validadores, constantes compartilhados
├── docker-compose.yml          # PostgreSQL + Redis
├── turbo.json                  # Turborepo config
└── .github/workflows/ci.yml   # CI pipeline
```

### 2.2 Padrao Arquitetural (por modulo)

Cada modulo NestJS segue o padrao:

```
<modulo>/
├── <modulo>.module.ts          # Registro NestJS
├── <recurso>.controller.ts     # Endpoints REST
├── <recurso>.service.ts        # Logica de negocio
├── dto/                        # Data Transfer Objects (class-validator)
```

### 2.3 Padroes de API

- **Base URL:** `/api/v1/{modulo}/{recurso}`
- **Workflows:** `POST /api/v1/{modulo}/{recurso}/:id/approve`
- **Documentacao:** Swagger/OpenAPI em `/api/docs`
- **Resposta padrao:** `{ data, meta: { total, page, limit, totalPages, requestId } }`

### 2.4 Seguranca (5 camadas)

1. **JWT Authentication** - Access token (15min) + Refresh token (7 dias)
2. **RBAC (Role-Based Access Control)** - `@Roles('ADMIN')` decorator
3. **Tenant Isolation** - Filtro por `companyId` em todas as queries
4. **Maker/Checker (4 Eyes)** - Criador nao pode aprovar
5. **Authority Limits** - Alcadas por valor/centro de custo

### 2.5 Infraestrutura Base

| Componente | Arquivo | Descricao |
|-----------|---------|-----------|
| Exception Filter | `http-exception.filter.ts` | Tratamento global de erros com formato padrao |
| Correlation ID | `correlation-id.interceptor.ts` | Rastreabilidade de requests |
| Logging | `logging.interceptor.ts` | Log de todas as requisicoes |
| Transform | `transform.interceptor.ts` | Envelope padrao de resposta |
| Audit Trail | `audit.interceptor.ts` | Log de todas as operacoes de escrita |
| RBAC Guard | `roles.guard.ts` | Verificacao de roles por endpoint |
| Tenant Guard | `tenant.guard.ts` | Isolamento multi-tenant |
| Prisma Module | `prisma.module.ts/service.ts` | Conexao e transacoes |
| Pagination | `pagination.dto.ts` | Padrao de paginacao reutilizavel |
| UUID Pipe | `parse-uuid.pipe.ts` | Validacao de UUID em parametros |

---

## 3. Modulos Implementados

### 3.1 Controle de Acesso (auth/)

**Status:** Completo
**Rota base:** `/api/v1/auth`

#### Funcionalidades

- Login com JWT (access + refresh tokens)
- Logout com revogacao de tokens
- Refresh token rotation
- Perfil do usuario autenticado com permissoes
- Troca de senha com politica (12 chars, historico 5, lockout 5 tentativas)
- CRUD de usuarios (ADMIN)
- CRUD de roles com permissoes
- Viewer de audit log com filtros

#### Endpoints

| Metodo | Rota | Descricao | Autenticacao |
|--------|------|-----------|--------------|
| POST | `/auth/login` | Autenticar | Publico |
| POST | `/auth/refresh` | Renovar token | Publico |
| POST | `/auth/logout` | Encerrar sessao | JWT |
| GET | `/auth/me` | Perfil + permissoes | JWT |
| POST | `/auth/change-password` | Alterar senha | JWT |
| POST | `/auth/users` | Criar usuario | ADMIN |
| GET | `/auth/users` | Listar usuarios | ADMIN |
| GET | `/auth/users/:id` | Buscar usuario | ADMIN |
| PATCH | `/auth/users/:id` | Atualizar usuario | ADMIN |
| DELETE | `/auth/users/:id` | Desativar usuario | ADMIN |
| POST | `/auth/roles` | Criar role | ADMIN |
| GET | `/auth/roles` | Listar roles | ADMIN |
| GET | `/auth/roles/permissions` | Listar permissoes | ADMIN |
| GET | `/auth/roles/:id` | Buscar role | ADMIN |
| PATCH | `/auth/roles/:id` | Atualizar role | ADMIN |
| DELETE | `/auth/roles/:id` | Desativar role | ADMIN |
| GET | `/auth/audit` | Listar audit logs | ADMIN |

#### Entidades Prisma

- `User` - Usuarios com passwordHash, lockout, historico
- `Role` - Roles por empresa
- `Permission` - Permissoes (resource + action)
- `RolePermission` - Associacao role-permissao
- `UserRole` - Associacao usuario-role (com vigencia)
- `UserAuthorityLimit` - Alcadas por usuario
- `RefreshToken` - Tokens de refresh
- `AuditLog` - Registros de auditoria (JSON before/after)

---

### 3.2 Cadastros Gerais (cadastro/)

**Status:** Completo
**Rota base:** `/api/v1/cadastro`

#### Funcionalidades

- Fornecedores com validacao CPF/CNPJ e workflow maker/checker
- Clientes com validacao CPF/CNPJ
- Centros de custo hierarquicos (arvore)
- Bancos brasileiros com agencias
- Contas bancarias proprias
- Moedas com taxas de cambio
- Feriados (nacional/estadual/municipal/empresa)
- Projetos com datas

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/cadastro/suppliers` | CRUD completo | `POST :id/approve` (maker/checker) |
| `/cadastro/clients` | CRUD completo | Busca por CPF/CNPJ |
| `/cadastro/cost-centers` | CRUD completo | Tree view hierarquico |
| `/cadastro/banks` | CRUD completo | Sub-rota `:bankId/agencies` |
| `/cadastro/bank-accounts` | CRUD completo | Contas bancarias proprias |
| `/cadastro/currencies` | CRUD completo | Sub-rota `:id/exchange-rates` |
| `/cadastro/holidays` | CRUD completo | Filtro por ano/escopo/estado |
| `/cadastro/projects` | CRUD completo | Filtro por data |

#### Entidades Prisma

- `Company`, `Branch` - Multi-tenancy
- `CorporateGroup` - Grupos economicos
- `CostCenter` - Hierarquico (self-relation)
- `Project` - Projetos com periodo
- `Supplier` - Com status maker/checker (PENDING/APPROVED/REJECTED)
- `Client` - Pessoa fisica/juridica/exterior
- `Bank`, `BankAgency`, `OwnBankAccount` - Estrutura bancaria
- `Currency`, `ExchangeRate` - Moedas e cotacoes
- `Indexer`, `IndexerQuotation` - Indexadores (CDI, SELIC, IPCA, etc.)
- `Holiday` - Feriados por escopo
- `Municipality` - Municipios IBGE
- `ProductServiceCode` - Codigos de produto/servico
- `TaxParameter` - Parametros tributarios

#### Validacoes Especiais

- CPF: Algoritmo completo com digitos verificadores
- CNPJ: Algoritmo completo com pesos e digitos
- Maker/Checker: Criador do fornecedor nao pode ser o aprovador
- Centro de custo: Validacao de hierarquia (parentId)

---

### 3.3 Gestao Contabil (contabilidade/)

**Status:** Completo
**Rota base:** `/api/v1/contabilidade`

#### Funcionalidades

- Plano de contas COSIF (ate 9 niveis / 15 digitos)
- Contas contabeis com controle de vigencia
- Periodos contabeis (abertura/fechamento)
- Lancamentos contabeis com validacao debito = credito
- Templates de lancamento (lancamentos padrao)
- Balancete de verificacao
- Balanco patrimonial e DRE

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/contabilidade/charts` | CRUD | Tree view de contas |
| `/contabilidade/accounts` | CRUD | Filtro por chartId/tipo/nivel/COSIF |
| `/contabilidade/periods` | CRUD | `POST :id/close`, `POST :id/reopen` |
| `/contabilidade/entries` | CRUD | `POST :id/approve` (maker/checker) |
| `/contabilidade/standard-entries` | CRUD | `POST :id/execute` (gera lancamento) |
| `/contabilidade/balances` | Consulta | Balancete, Balanco, DRE |

#### Entidades Prisma

- `ChartOfAccounts` - Planos de contas versionados
- `Account` - Contas (codigo COSIF, tipo, natureza, hierarquia)
- `AccountingPeriod` - Periodos (OPEN/CLOSING/CLOSED)
- `JournalEntry` - Lancamentos (DRAFT/PENDING/APPROVED/REJECTED)
- `JournalEntryLine` - Partidas (debito/credito por conta)
- `AccountBalance` - Saldos por conta/periodo
- `StandardEntry` - Templates de lancamento (JSON)

#### Regras de Negocio

- Total de debitos DEVE ser igual ao total de creditos (equacao contabil)
- Somente contas analiticas (allowsPosting=true) aceitam lancamentos
- Periodo deve estar OPEN para aceitar lancamentos
- Fechamento de periodo calcula saldos automaticamente
- Maker/Checker em lancamentos manuais

---

### 3.4 Controle Orcamentario (orcamento/)

**Status:** Completo
**Rota base:** `/api/v1/orcamento`

#### Funcionalidades

- Orcamento por periodo/empresa/filial/centro de custo
- Linhas orcamentarias com categorias
- Remanejamento entre linhas com aprovacao
- Consulta orcado vs realizado

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/orcamento/budgets` | CRUD | Filtro por ano/status |
| `/orcamento/budgets/:id/lines` | CRUD | Linhas do orcamento |
| `/orcamento/budgets/:id/reallocations` | Criar/Listar | Remanejamento |

#### Entidades Prisma

- `Budget` - Orcamento por periodo
- `BudgetLine` - Linhas com valores planejados/realizados
- `BudgetReallocation` - Movimentacoes entre linhas
- `BudgetExecution` - Execucao orcamentaria

---

### 3.5 Caixas e Bancos (caixa-bancos/)

**Status:** Completo
**Rota base:** `/api/v1/caixa-bancos`

#### Funcionalidades

- Contas de caixa (CASH/BANK/INVESTMENT)
- Movimentacoes com atualizacao atomica de saldo
- Transferencias entre contas (debito + credito vinculados)
- Importacao de extrato CNAB 240
- Conciliacao bancaria (automatica + manual)

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/caixa-bancos/accounts` | CRUD | `GET :id/balance`, `GET :id/movements` |
| `/caixa-bancos/movements` | CRUD | `POST /transfer` |
| `/caixa-bancos/statements` | Importar/Listar | `POST :id/auto-reconcile`, `POST :id/reconcile` |

#### Entidades Prisma

- `CashAccount` - Contas de caixa com saldo
- `CashMovement` - Movimentacoes (DEBIT/CREDIT) com categoria
- `BankStatement` - Extratos bancarios importados
- `BankStatementLine` - Linhas do extrato com status de conciliacao

#### Processamento CNAB 240

- Parser de segmento E (detalhe) para extrair: data, valor, tipo, descricao, documento
- Importacao via upload de arquivo ou conteudo raw
- Conciliacao automatica por valor + data + tipo

---

### 3.6 Contas a Pagar (contas-pagar/)

**Status:** Completo
**Rota base:** `/api/v1/contas-pagar`

#### Funcionalidades

- Titulos a pagar (manual, templates, auto de Compras/Contratos)
- Rateio por centro de custo/filial/projeto (soma deve = 100%)
- Workflow de aprovacao 4 etapas com alcadas
- Processamento de pagamento (DDA, CNAB, cheque, TED, PIX)
- Calculo tributario automatico (IR, CSLL, PIS, COFINS, ISS, INSS)
- Marcacao de titulos vencidos

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/contas-pagar/titles` | CRUD | `POST :id/approve`, `POST :id/pay`, `POST /mark-overdue` |

#### Entidades Prisma

- `PayableTitle` - Titulo com supplier, valor, vencimento, status
- `PayableCostAllocation` - Rateio por CC/projeto (%)
- `PayableTax` - Retencoes tributarias calculadas
- `PayableApproval` - Trail de aprovacao (4 etapas, maker/checker)

#### Regras de Negocio

- Soma das alocacoes de custo deve ser exatamente 100%
- Maker/Checker: criador nao pode aprovar
- Titulos >= R$ 100.000 exigem 2 aprovacoes
- Valor liquido = valor original - impostos retidos
- Status: OPEN -> PARTIAL -> PAID / CANCELLED / OVERDUE

---

### 3.7 Contas a Receber (contas-receber/)

**Status:** Completo
**Rota base:** `/api/v1/contas-receber`

#### Funcionalidades

- Titulos a receber (duplicatas, adiantamentos)
- Recebimento de pagamentos
- Geracao de boletos
- Negociacao com clientes

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/contas-receber/titles` | CRUD | `POST :id/receive`, aging report |
| `/contas-receber/boletos` | Gerar/Listar | Geracao de boletos |

#### Entidades Prisma

- `ReceivableTitle` - Titulo com cliente, valor, vencimento
- `ReceivablePayment` - Pagamentos recebidos
- `Boleto` - Boletos gerados com nosso numero

---

### 3.8 Compras e Recebimento (compras/)

**Status:** Completo
**Rota base:** `/api/v1/compras`

#### Funcionalidades

- Solicitacoes de compra com alcadas de aprovacao
- Cotacoes com comparacao
- Pedidos de compra com integracao orcamentaria
- Recebimento com importacao NF-e XML

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/compras/requests` | CRUD | `POST :id/approve` |
| `/compras/quotations` | CRUD | Comparacao de cotacoes |
| `/compras/orders` | CRUD | `POST :id/approve` |
| `/compras/receivings` | CRUD | Importacao NF-e |

#### Entidades Prisma

- `PurchaseRequest` - Solicitacao com alcada
- `Quotation`, `QuotationItem` - Cotacoes
- `PurchaseOrder`, `PurchaseOrderItem` - Pedidos
- `Receiving`, `ReceivingItem` - Recebimento

---

### 3.9 Controle de Contratos (contratos/)

**Status:** Completo
**Rota base:** `/api/v1/contratos`

#### Funcionalidades

- CRUD de contratos (Fixo, Variavel, Parcela Indeterminada, Indeterminado)
- Workflow de aprovacao maker/checker
- Geracao automatica de parcelas
- Aditivos contratuais
- Renovacao/auto-renovacao
- Integracao com Contas a Pagar (geracao de titulos)

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/contratos/contracts` | CRUD | `POST :id/approve`, `POST :id/addendum`, `POST :id/generate-installments` |

#### Entidades Prisma

- `Contract` - Contrato com tipo, valor, vigencia, fornecedor
- `ContractInstallment` - Parcelas com datas e valores
- `ContractAddendum` - Aditivos contratuais

---

### 3.10 Faturamento (faturamento/)

**Status:** Completo
**Rota base:** `/api/v1/faturamento`

#### Funcionalidades

- CRUD de faturas com itens e rateio
- Calculo tributario (ISS, IR, PIS, COFINS, CSLL retidos, Gross Up)
- Emissao e cancelamento de NFS-e (stub para integracao municipal)
- Multi-moeda com conversao
- Geracao automatica de titulo a receber
- Integracao contabil

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/faturamento/invoices` | CRUD | `POST :id/emit-nfse`, `POST :id/cancel-nfse`, `POST :id/calculate-taxes` |

#### Entidades Prisma

- `Invoice` - Fatura com cliente, valores, status NFS-e
- `InvoiceItem` - Itens da fatura
- `InvoiceTax` - Impostos calculados

---

### 3.11 Gestao Patrimonial (patrimonio/)

**Status:** Completo
**Rota base:** `/api/v1/patrimonio`

#### Funcionalidades

- Grupos e subgrupos de ativos (classificacao hierarquica)
- Cadastro de bens patrimoniais (manual, auto de Compras/CP)
- Depreciacao linear (fiscal e gerencial)
- Simulacao de depreciacao futura
- Fechamento mensal de depreciacao em lote
- Transferencias entre centros de custo/filiais
- Baixa de ativos
- Integracao contabil

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/patrimonio/groups` | CRUD | Classificacao hierarquica |
| `/patrimonio/assets` | CRUD | `POST :id/transfer`, `POST :id/write-off` |
| `/patrimonio/depreciation` | - | `POST calculate`, `POST close-month`, `POST simulate` |

#### Entidades Prisma

- `AssetGroup` - Grupo/subgrupo com taxa de depreciacao e conta contabil
- `Asset` - Bem patrimonial com valor, data aquisicao, vida util
- `AssetDepreciation` - Depreciacao mensal calculada
- `AssetTransfer` - Transferencias entre CC/filial

---

### 3.12 Liquidacao Financeira (liquidacao/)

**Status:** Completo
**Rota base:** `/api/v1/liquidacao`

#### Funcionalidades

- Centralizacao de liquidacoes de CP, CR e Caixa
- Workflow de aprovacao maker/checker (criador nao pode aprovar)
- Alcadas por valor (> R$ 500.000 exige 2 aprovacoes)
- Dashboard com resumo por tipo/modulo/status
- Efetivacao de liquidacoes aprovadas
- Cancelamento de liquidacoes pendentes

#### Endpoints Principais

| Recurso | CRUD | Extras |
|---------|------|--------|
| `/liquidacao/settlements` | CRUD | `POST :id/approve`, `POST :id/settle`, `POST :id/cancel` |
| `/liquidacao/settlements/dashboard` | GET | Resumo pendentes por tipo/modulo |

#### Entidades Prisma

- `Settlement` - Liquidacao com tipo, modulo origem, valor, status
- `SettlementApproval` - Aprovacoes com etapas e maker/checker

---

### 3.13 Informes Fiscais (informes-fiscais/)

**Status:** Completo
**Rota base:** `/api/v1/informes-fiscais`

#### Funcionalidades

- **EFD-Reinf:** Geracao de eventos R-1000, R-4010, R-4020, R-9000 (XML), transmissao (stub)
- **EFD Contribuicoes PIS/COFINS:** Escrituracao por blocos, calculo de creditos, exportacao SPED
- **ECF IRPJ/CSLL:** Calculo Lucro Real e Presumido (mensal), ajuste anual
- **DES-IF / ISSQN:** Declaracoes municipais (DES-IF 2.0/3.1, NFS-e, NFTS)

#### Endpoints Principais

| Recurso | Metodo | Descricao |
|---------|--------|-----------|
| `/informes-fiscais/efd-reinf/events` | POST | Gerar evento R-1000/R-4010/R-4020/R-9000 |
| `/informes-fiscais/efd-reinf/transmit` | POST | Transmitir lote (stub) |
| `/informes-fiscais/efd-contribuicoes/generate` | POST | Gerar escrituracao PIS/COFINS |
| `/informes-fiscais/efd-contribuicoes/export-sped` | POST | Exportar arquivo SPED |
| `/informes-fiscais/ecf/calculate` | POST | Calcular IRPJ/CSLL |
| `/informes-fiscais/des-if/generate` | POST | Gerar declaracao DES-IF |

---

### 3.14 Informes Legais (informes-legais/)

**Status:** Completo
**Rota base:** `/api/v1/informes-legais`

#### Funcionalidades

- **CADOC 3044:** Eventos diarios de credito (integracao JSON Bacen)
- **CADOC 4111:** Saldos contabeis diarios (XML)
- **SCR - Central de Riscos:** Docs 3040 (dados de credito) e 3050 (clientes >= R$200)
- **PDD:** Provisao para Devedores Duvidosos conforme Res. CMN 4.966/2021 (faixas A-H)
- **Simulacao PDD:** Cenarios de stress com fator multiplicador
- **Doc 6209:** Estatisticas de varejo e canais de atendimento
- **Informe de Rendimentos:** IN 698/2006 e IN 1235/2012 (agrupado por fornecedor)
- **Tarifas e Encargos:** Resolucao 3919 Art. 19

#### Endpoints Principais

| Recurso | Metodo | Descricao |
|---------|--------|-----------|
| `/informes-legais/cadoc/3044` | POST | Gerar CADOC 3044 |
| `/informes-legais/cadoc/4111` | POST | Gerar CADOC 4111 |
| `/informes-legais/scr/3040` | POST | Gerar SCR Doc 3040 |
| `/informes-legais/scr/3050` | POST | Gerar SCR Doc 3050 |
| `/informes-legais/pdd/calculate` | POST | Calcular PDD (Res. 4.966) |
| `/informes-legais/pdd/simulate` | POST | Simular PDD com stress |
| `/informes-legais/bacen/6209` | POST | Gerar Doc 6209 |
| `/informes-legais/bacen/informe-rendimentos` | POST | Gerar Informe Rendimentos |
| `/informes-legais/bacen/tarifas` | GET | Tarifas Res. 3919 |

#### Faixas PDD (Resolucao 4.966/2021)

| Dias Atraso | Nivel | Taxa |
|------------|-------|------|
| 0-14 | A | 0,5% |
| 15-30 | B | 1% |
| 31-60 | C | 3% |
| 61-90 | D | 10% |
| 91-120 | E | 30% |
| 121-150 | F | 50% |
| 151-180 | G | 70% |
| 181+ | H | 100% |

---

## 5. Banco de Dados

### 5.1 Convencoes

| Aspecto | Padrao |
|---------|--------|
| Primary Keys | UUID v4 |
| Valores monetarios | `NUMERIC(18,4)` |
| Timestamps | `createdAt`, `updatedAt` (automaticos) |
| Auditoria | `createdBy`, `updatedBy` (UUID do usuario) |
| Multi-tenancy | `companyId` em todas as tabelas |
| Soft delete | `active: false` ou `deletedAt` |
| Nomes de tabela | snake_case (via `@@map`) |

### 5.2 Entidades por Modulo

| Modulo | Entidades | Quantidade |
|--------|-----------|------------|
| Core | Company, Branch | 2 |
| Controle de Acesso | User, Role, Permission, RolePermission, UserRole, UserAuthorityLimit, RefreshToken, AuditLog | 8 |
| Cadastros Gerais | CostCenter, Project, Supplier, Client, Bank, BankAgency, OwnBankAccount, Currency, ExchangeRate, Indexer, IndexerQuotation, Holiday, Municipality, ProductServiceCode, TaxParameter, CorporateGroup | 16 |
| Contabilidade | ChartOfAccounts, Account, AccountingPeriod, JournalEntry, JournalEntryLine, AccountBalance, StandardEntry | 7 |
| Orcamento | Budget, BudgetLine, BudgetReallocation, BudgetExecution | 4 |
| Caixas e Bancos | CashAccount, CashMovement, BankStatement, BankStatementLine | 4 |
| Contas a Pagar | PayableTitle, PayableCostAllocation, PayableTax, PayableApproval | 4 |
| Contas a Receber | ReceivableTitle, ReceivablePayment, Boleto, ClientNegotiation | 4 |
| Compras | PurchaseRequest, Quotation, QuotationItem, PurchaseOrder, PurchaseOrderItem, Receiving, ReceivingItem | 7 |
| Contratos | Contract, ContractInstallment, ContractAddendum | 3 |
| Faturamento | Invoice, InvoiceItem, InvoiceTax | 3 |
| Patrimonio | AssetGroup, Asset, AssetDepreciation, AssetTransfer | 4 |
| Liquidacao | Settlement, SettlementApproval | 2 |
| **Total** | | **68** |

### 5.3 Seed Inicial

O seed (`prisma/seed.ts`) cria:
- Empresa CORA SCFI com filial Matriz
- Usuario admin (admin@cora.com.br / Admin@123456)
- Role ADMIN com todas as permissoes
- 30+ permissoes base (CRUD por modulo)
- 10 bancos brasileiros (BB, Santander, CEF, Bradesco, Itau, Nubank, Inter, C6, Cora, BTG)
- 3 moedas (BRL, USD, EUR)
- 6 indexadores (CDI, SELIC, IPCA, IGPM, INPC, TR)

---

## 6. Pacote Compartilhado (@cora-erp/shared)

### 6.1 Validadores

| Funcao | Descricao |
|--------|-----------|
| `isValidCPF(cpf)` | Valida CPF com digitos verificadores |
| `isValidCNPJ(cnpj)` | Valida CNPJ com pesos e digitos |
| `isValidCPFOrCNPJ(value)` | Detecta tipo e valida |
| `formatCPF(cpf)` | Formata 000.000.000-00 |
| `formatCNPJ(cnpj)` | Formata 00.000.000/0000-00 |

### 6.2 Constantes

| Constante | Descricao |
|-----------|-----------|
| `BRAZILIAN_BANKS` | 42 bancos com COMPE e ISPB |
| `CURRENCIES` | 11 moedas (BRL, USD, EUR, etc.) |
| `TAX_RETENTION_DEFAULTS` | Aliquotas padrao IR/CSLL/PIS/COFINS/ISS/INSS |
| `DARF_CODES` | Codigos DARF para tipos de imposto |

### 6.3 Enums

`PersonType`, `ApprovalStatus`, `BankAccountType`, `HolidayScope`, `TaxType`, `ProductServiceType`, `AuditAction`, `ContractType`, `PaymentMethod`, `TitleStatus`, `JournalEntryType`

### 6.4 Testes

- Testes unitarios para CPF/CNPJ validator (12 test cases)
- Cobertura de CPFs/CNPJs validos e invalidos
- Teste de formatacao

---

## 7. Frontend (apps/web)

### 7.1 Paginas Implementadas

| Pagina | Rota | Descricao |
|--------|------|-----------|
| Home | `/` | Landing page com status do sistema |
| Login | `/login` | Autenticacao com email/senha |
| Dashboard | `/dashboard` | Cards dos 14 modulos |

### 7.2 Componentes

| Componente | Descricao |
|-----------|-----------|
| `Sidebar` | Navegacao lateral colapsavel com 14 modulos e sub-itens |
| `Header` | Barra superior com nome do usuario e logout |
| `AuthProvider` | Context de autenticacao com auto-refresh |
| `ApiClient` | Cliente HTTP com interceptors JWT e retry |

### 7.3 Funcionalidades do API Client

- Interceptor automatico de JWT em todas as requisicoes
- Refresh token transparente (401 -> refresh -> retry)
- Redirect para login quando sessao expira
- Query params builder
- Tipagem generica para respostas

---

## 8. CI/CD

### GitHub Actions (`ci.yml`)

- Trigger: push/PR em main, master, develop
- PostgreSQL 16 como service container
- Steps: install -> prisma generate -> db push -> lint -> test api -> test shared -> build api -> build web

---

## 9. Como Executar

### Pre-requisitos

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose

### Setup

```bash
# 1. Clonar repositorio
git clone <repo-url> && cd cora-erp

# 2. Subir banco e cache
docker-compose up -d

# 3. Instalar dependencias
npm install

# 4. Configurar ambiente
cp apps/api/.env.example apps/api/.env

# 5. Gerar Prisma Client e criar tabelas
cd apps/api && npx prisma generate && npx prisma db push

# 6. Popular dados iniciais
npx ts-node prisma/seed.ts

# 7. Iniciar em desenvolvimento
cd ../.. && npm run dev
```

### URLs

| Servico | URL |
|---------|-----|
| API Backend | http://localhost:3000 |
| Swagger/OpenAPI | http://localhost:3000/api/docs |
| Frontend | http://localhost:3001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Credenciais Iniciais

| Campo | Valor |
|-------|-------|
| Email | admin@cora.com.br |
| Senha | Admin@123456 |

---

## 10. Cronograma de Desenvolvimento

| Fase | Semanas | Modulos | Status |
|------|---------|---------|--------|
| 0 | 1-2 | Infraestrutura | Completo |
| 1 | 3-8 | Controle Acesso + Cadastros | Completo |
| 2 | 9-16 | Contabilidade + Orcamento | Completo |
| 3 | 15-22 | Caixa + CP + CR | Completo |
| 4 | 23-30 | Compras + Contratos + Faturamento | Completo |
| 5 | 31-34 | Patrimonio + Liquidacao | Completo |
| 6 | 35-42 | Informes Fiscais + Legais | Completo |
| 7 | 43-48 | Hardening + Testes + Deploy | Pendente |

**Timeline total estimado: 48 semanas (~12 meses)**
**Progresso atual: Fases 0-6 completas (14/14 modulos implementados)**
