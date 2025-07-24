# NoControle Backend

Backend do sistema financeiro NoControle desenvolvido em Node.js com Express, MongoDB e JWT.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação e autorização
- **bcryptjs** - Hash de senhas
- **express-validator** - Validação de dados
- **helmet** - Segurança HTTP
- **cors** - Cross-Origin Resource Sharing
- **express-rate-limit** - Rate limiting
- **compression** - Compressão de respostas
- **morgan** - Logging de requisições

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (banco de dados, etc.)
├── controllers/     # Controladores da aplicação
├── middlewares/     # Middlewares customizados
├── models/          # Modelos do Mongoose
├── repositories/    # Camada de acesso a dados
├── routes/          # Definição das rotas
├── services/        # Lógica de negócio
├── utils/           # Utilitários
└── server.js        # Arquivo principal do servidor
```

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd nocontrole-backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações:
```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development
SECRET_KEY=sua_chave_secreta_aqui

# Configurações do MongoDB
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/
MONGODB_DB_NAME=nocontrole

# Configurações JWT
JWT_SECRET_KEY=sua_chave_jwt_aqui
JWT_ACCESS_TOKEN_EXPIRES=7200
JWT_REFRESH_TOKEN_EXPIRES=604800

# Configurações CORS
FRONTEND_URL=http://localhost:8080

# Configurações de Upload
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads

# Configurações de Log
LOG_LEVEL=INFO
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário autenticado
- `POST /api/auth/change-password` - Alterar senha

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `GET /api/categories/:id` - Buscar categoria por ID
- `PUT /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Deletar categoria
- `POST /api/categories/default` - Criar categorias padrão

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:id` - Buscar transação por ID
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Deletar transação
- `POST /api/transactions/bulk` - Criar múltiplas transações
- `GET /api/transactions/summary` - Resumo financeiro
- `GET /api/transactions/by-category` - Transações por categoria

## 🔒 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:

- **Access Token**: Válido por 2 horas
- **Refresh Token**: Válido por 7 dias

### Headers de Autenticação
```
Authorization: Bearer <access_token>
```

## 📊 Modelos de Dados

### User (Usuário)
```javascript
{
  name: String,
  email: String,
  password: String,
  avatar: String,
  isActive: Boolean,
  role: String,
  configuracoes: {
    tema: String,
    moeda: String,
    idioma: String,
    notificacoes: Boolean
  }
}
```

### Category (Categoria)
```javascript
{
  user: ObjectId,
  nome: String,
  tipo: String, // 'receita' | 'despesa'
  cor: String,
  icone: String,
  ativo: Boolean,
  descricao: String
}
```

### Transaction (Transação)
```javascript
{
  user: ObjectId,
  tipo: String, // 'receita' | 'despesa'
  valor: Number,
  descricao: String,
  data: Date,
  categoria: ObjectId,
  cartao: ObjectId,
  recorrente: Boolean,
  observacoes: String,
  tags: [String],
  status: String // 'pendente' | 'confirmada' | 'cancelada'
}
```

## 🛡️ Segurança

O backend implementa várias camadas de segurança:

- **Helmet**: Headers de segurança HTTP
- **CORS**: Controle de origem cruzada
- **Rate Limiting**: Limitação de requisições
- **Input Sanitization**: Sanitização de entrada
- **XSS Protection**: Proteção contra XSS
- **NoSQL Injection Protection**: Proteção contra injeção NoSQL
- **JWT**: Autenticação segura com tokens

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch
```

## 📝 Logs

O sistema gera logs detalhados para monitoramento:

- Requisições HTTP
- Erros de aplicação
- Tentativas de segurança
- Performance

## 🚀 Deploy

### Usando Docker
```bash
# Build da imagem
docker build -t nocontrole-backend .

# Executar container
docker run -p 3000:3000 --env-file .env nocontrole-backend
```

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://...
JWT_SECRET_KEY=chave_super_secreta
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@nocontrole.com

---

Desenvolvido com ❤️ pela equipe NoControle

