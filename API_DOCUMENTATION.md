# NoControle API - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints](#endpoints)
4. [Modelos de Dados](#modelos-de-dados)
5. [Códigos de Resposta](#códigos-de-resposta)
6. [Exemplos de Uso](#exemplos-de-uso)

## 🎯 Visão Geral

A API NoControle é um sistema completo de gestão financeira pessoal que oferece funcionalidades para:

- Controle de receitas e despesas
- Gestão de categorias
- Metas financeiras
- Controle de cartões de crédito
- Lista de desejos (wishlist)
- Dashboard com estatísticas
- Relatórios detalhados

**Base URL:** `http://localhost:3001/api`

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Existem dois tipos de tokens:

- **Access Token**: Válido por 2 horas
- **Refresh Token**: Válido por 7 dias

### Headers de Autenticação

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 📚 Endpoints

### 🔑 Autenticação (`/auth`)

#### POST `/auth/register`
Registra um novo usuário.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "MinhaSenh@123"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "data": {
    "id": "user_id",
    "name": "João Silva",
    "email": "joao@email.com"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_at": 1234567890
}
```

#### POST `/auth/login`
Autentica um usuário.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "MinhaSenh@123"
}
```

#### POST `/auth/refresh`
Renova os tokens de acesso.

**Body:**
```json
{
  "refresh_token": "refresh_token"
}
```

#### GET `/auth/me`
Retorna dados do usuário autenticado.

#### POST `/auth/logout`
Faz logout do usuário.

#### POST `/auth/change-password`
Altera a senha do usuário.

**Body:**
```json
{
  "currentPassword": "senhaAtual",
  "newPassword": "novaSenha123"
}
```

### 📂 Categorias (`/categories`)

#### GET `/categories`
Lista todas as categorias do usuário.

**Query Parameters:**
- `tipo`: `receita` ou `despesa`
- `ativo`: `true` ou `false`

#### POST `/categories`
Cria uma nova categoria.

**Body:**
```json
{
  "nome": "Alimentação",
  "tipo": "despesa",
  "cor": "#EF4444",
  "icone": "utensils",
  "descricao": "Gastos com alimentação"
}
```

#### GET `/categories/:id`
Busca categoria por ID.

#### PUT `/categories/:id`
Atualiza uma categoria.

#### DELETE `/categories/:id`
Deleta uma categoria (soft delete).

#### GET `/categories/stats`
Retorna estatísticas das categorias.

#### POST `/categories/default`
Cria categorias padrão para o usuário.

### 💰 Transações (`/transactions`)

#### GET `/transactions`
Lista transações com paginação e filtros.

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `tipo`: `receita` ou `despesa`
- `categoriaId`: ID da categoria
- `cartaoId`: ID do cartão
- `startDate`: Data inicial (ISO 8601)
- `endDate`: Data final (ISO 8601)
- `search`: Busca na descrição

#### POST `/transactions`
Cria uma nova transação.

**Body:**
```json
{
  "tipo": "despesa",
  "valor": 50.00,
  "descricao": "Almoço no restaurante",
  "data": "2024-01-15T12:00:00Z",
  "categoriaId": "category_id",
  "cartaoId": "card_id",
  "observacoes": "Almoço de negócios"
}
```

#### POST `/transactions/bulk`
Cria múltiplas transações.

**Body:**
```json
{
  "transactions": [
    {
      "tipo": "despesa",
      "valor": 50.00,
      "descricao": "Transação 1",
      "data": "2024-01-15T12:00:00Z"
    }
  ]
}
```

#### GET `/transactions/summary`
Retorna resumo financeiro.

#### GET `/transactions/by-category`
Retorna transações agrupadas por categoria.

#### GET `/transactions/cash-flow`
Retorna fluxo de caixa mensal.

### 🎯 Metas (`/goals`)

#### GET `/goals`
Lista todas as metas do usuário.

#### POST `/goals`
Cria uma nova meta.

**Body:**
```json
{
  "nome": "Viagem para Europa",
  "valorAlvo": 10000.00,
  "prazo": "2024-12-31T23:59:59Z",
  "descricao": "Meta para viagem de férias",
  "categoriaId": "category_id"
}
```

#### PATCH `/goals/:id/progress`
Atualiza progresso da meta.

**Body:**
```json
{
  "valor": 500.00
}
```

#### GET `/goals/near-deadline`
Retorna metas próximas do vencimento.

### 💳 Cartões (`/cards`)

#### GET `/cards`
Lista todos os cartões do usuário.

#### POST `/cards`
Cria um novo cartão.

**Body:**
```json
{
  "nome": "Cartão Principal",
  "bandeira": "Visa",
  "limite": 5000.00,
  "diaVencimento": 15,
  "diaFechamento": 10,
  "cor": "#3B82F6"
}
```

#### PATCH `/cards/:id/balance`
Atualiza saldo do cartão.

**Body:**
```json
{
  "valor": 100.00,
  "operacao": "add"
}
```

#### GET `/cards/low-limit`
Retorna cartões com limite baixo.

### 🛍️ Wishlist (`/wishlist`)

#### GET `/wishlist`
Lista todos os itens da wishlist.

#### POST `/wishlist`
Cria um novo item da wishlist.

**Body:**
```json
{
  "nome": "Smartphone",
  "valor": 2000.00,
  "prioridade": "alta",
  "descricao": "Novo smartphone para trabalho",
  "dataDesejada": "2024-06-30T23:59:59Z"
}
```

#### PATCH `/wishlist/:id/add-savings`
Adiciona valor economizado.

**Body:**
```json
{
  "valor": 200.00
}
```

#### PATCH `/wishlist/:id/mark-purchased`
Marca item como comprado.

### 📊 Dashboard (`/dashboard`)

#### GET `/dashboard`
Retorna dados completos do dashboard.

#### GET `/dashboard/statistics`
Retorna estatísticas gerais.

#### GET `/dashboard/alerts`
Retorna alertas importantes.

#### GET `/dashboard/trends`
Retorna tendências financeiras.

### 📈 Relatórios (`/reports`)

#### GET `/reports/available`
Lista relatórios disponíveis.

#### GET `/reports/financial`
Gera relatório financeiro completo.

**Query Parameters:**
- `startDate`: Data inicial
- `endDate`: Data final
- `includeCharts`: Incluir dados para gráficos

#### GET `/reports/categories`
Gera relatório de categorias.

#### GET `/reports/cash-flow`
Gera relatório de fluxo de caixa.

**Query Parameters:**
- `ano`: Ano do relatório

## 📋 Modelos de Dados

### User (Usuário)
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string",
  "isActive": "boolean",
  "configuracoes": {
    "tema": "light|dark|system",
    "moeda": "string",
    "idioma": "string",
    "notificacoes": "boolean"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Category (Categoria)
```json
{
  "id": "string",
  "user": "string",
  "nome": "string",
  "tipo": "receita|despesa",
  "cor": "string",
  "icone": "string",
  "ativo": "boolean",
  "descricao": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Transaction (Transação)
```json
{
  "id": "string",
  "user": "string",
  "tipo": "receita|despesa",
  "valor": "number",
  "descricao": "string",
  "data": "date",
  "categoria": "Category",
  "cartao": "Card",
  "recorrente": "boolean",
  "observacoes": "string",
  "tags": ["string"],
  "status": "pendente|confirmada|cancelada",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Goal (Meta)
```json
{
  "id": "string",
  "user": "string",
  "nome": "string",
  "valorAlvo": "number",
  "valorAtual": "number",
  "prazo": "date",
  "descricao": "string",
  "ativo": "boolean",
  "categoria": "Category",
  "progresso": "number",
  "atingida": "boolean",
  "diasRestantes": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Card (Cartão)
```json
{
  "id": "string",
  "user": "string",
  "nome": "string",
  "bandeira": "string",
  "limite": "number",
  "saldoAtual": "number",
  "diaVencimento": "number",
  "diaFechamento": "number",
  "ativo": "boolean",
  "cor": "string",
  "limiteDisponivel": "number",
  "percentualUsado": "number",
  "proximoVencimento": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Wishlist (Lista de Desejos)
```json
{
  "id": "string",
  "user": "string",
  "nome": "string",
  "valor": "number",
  "valorEconomizado": "number",
  "prioridade": "baixa|media|alta|urgente",
  "categoria": "Category",
  "descricao": "string",
  "link": "string",
  "dataDesejada": "date",
  "status": "desejando|economizando|comprado|cancelado",
  "progresso": "number",
  "valorRestante": "number",
  "metaAtingida": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 📊 Códigos de Resposta

### Sucesso
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso

### Erro do Cliente
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Acesso negado
- `404 Not Found`: Recurso não encontrado
- `422 Unprocessable Entity`: Erro de validação

### Erro do Servidor
- `500 Internal Server Error`: Erro interno do servidor

### Formato de Resposta de Erro
```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": [
    {
      "field": "campo",
      "message": "mensagem específica"
    }
  ]
}
```

## 🚀 Exemplos de Uso

### Fluxo Completo de Autenticação

1. **Registrar usuário:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "MinhaSenh@123"
  }'
```

2. **Fazer login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "MinhaSenh@123"
  }'
```

3. **Usar token para acessar recursos protegidos:**
```bash
curl -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Criar Transação Completa

```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "despesa",
    "valor": 150.00,
    "descricao": "Compras no supermercado",
    "data": "2024-01-15T10:30:00Z",
    "categoriaId": "CATEGORY_ID",
    "observacoes": "Compras da semana"
  }'
```

### Buscar Relatório Financeiro

```bash
curl -X GET "http://localhost:3001/api/reports/financial?startDate=2024-01-01&endDate=2024-01-31&includeCharts=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nocontrole
JWT_SECRET_KEY=sua_chave_secreta
JWT_ACCESS_TOKEN_EXPIRES=7200
JWT_REFRESH_TOKEN_EXPIRES=604800
FRONTEND_URL=http://localhost:8080
```

### Executar em Desenvolvimento
```bash
npm run dev
```

### Executar Testes
```bash
npm test
```

---

**Versão da API:** 1.0.0  
**Última atualização:** Janeiro 2024

