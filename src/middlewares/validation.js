const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para verificar erros de validação
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validações para autenticação
 */
const authValidation = {
  register: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email deve ter um formato válido')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Senha é obrigatória')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
    
    handleValidationErrors
  ],

  login: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email deve ter um formato válido')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Senha é obrigatória'),
    
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Senha atual é obrigatória'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('Nova senha é obrigatória')
      .isLength({ min: 6 })
      .withMessage('Nova senha deve ter pelo menos 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
    
    handleValidationErrors
  ],

  requestPasswordReset: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email é obrigatório')
      .isEmail()
      .withMessage('Email deve ter um formato válido')
      .normalizeEmail(),
    
    handleValidationErrors
  ]
};

/**
 * Validações para categorias
 */
const categoryValidation = {
  create: [
    body('nome')
      .trim()
      .notEmpty()
      .withMessage('Nome da categoria é obrigatório')
      .isLength({ min: 1, max: 100 })
      .withMessage('Nome deve ter entre 1 e 100 caracteres'),
    
    body('tipo')
      .notEmpty()
      .withMessage('Tipo da categoria é obrigatório')
      .isIn(['receita', 'despesa'])
      .withMessage('Tipo deve ser "receita" ou "despesa"'),
    
    body('cor')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Cor deve estar no formato hexadecimal'),
    
    body('icone')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Ícone não pode ter mais de 50 caracteres'),
    
    body('descricao')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Descrição não pode ter mais de 500 caracteres'),
    
    handleValidationErrors
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('ID da categoria inválido'),
    
    body('nome')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Nome da categoria não pode estar vazio')
      .isLength({ min: 1, max: 100 })
      .withMessage('Nome deve ter entre 1 e 100 caracteres'),
    
    body('tipo')
      .optional()
      .isIn(['receita', 'despesa'])
      .withMessage('Tipo deve ser "receita" ou "despesa"'),
    
    body('cor')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Cor deve estar no formato hexadecimal'),
    
    body('icone')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Ícone não pode ter mais de 50 caracteres'),
    
    body('descricao')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Descrição não pode ter mais de 500 caracteres'),
    
    handleValidationErrors
  ]
};

/**
 * Validações para transações
 */
const transactionValidation = {
  create: [
    body('tipo')
      .notEmpty()
      .withMessage('Tipo da transação é obrigatório')
      .isIn(['receita', 'despesa'])
      .withMessage('Tipo deve ser "receita" ou "despesa"'),
    
    body('valor')
      .notEmpty()
      .withMessage('Valor é obrigatório')
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser um número positivo'),
    
    body('descricao')
      .trim()
      .notEmpty()
      .withMessage('Descrição é obrigatória')
      .isLength({ min: 1, max: 500 })
      .withMessage('Descrição deve ter entre 1 e 500 caracteres'),
    
    body('data')
      .notEmpty()
      .withMessage('Data é obrigatória')
      .isISO8601()
      .withMessage('Data deve estar no formato ISO 8601'),
    
    body('categoriaId')
      .optional()
      .isMongoId()
      .withMessage('ID da categoria inválido'),
    
    body('cartaoId')
      .optional()
      .isMongoId()
      .withMessage('ID do cartão inválido'),
    
    body('recorrente')
      .optional()
      .isBoolean()
      .withMessage('Recorrente deve ser verdadeiro ou falso'),
    
    body('observacoes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Observações não podem ter mais de 1000 caracteres'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags devem ser um array'),
    
    body('tags.*')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Cada tag não pode ter mais de 50 caracteres'),
    
    handleValidationErrors
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('ID da transação inválido'),
    
    body('tipo')
      .optional()
      .isIn(['receita', 'despesa'])
      .withMessage('Tipo deve ser "receita" ou "despesa"'),
    
    body('valor')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser um número positivo'),
    
    body('descricao')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Descrição não pode estar vazia')
      .isLength({ min: 1, max: 500 })
      .withMessage('Descrição deve ter entre 1 e 500 caracteres'),
    
    body('data')
      .optional()
      .isISO8601()
      .withMessage('Data deve estar no formato ISO 8601'),
    
    body('categoriaId')
      .optional()
      .isMongoId()
      .withMessage('ID da categoria inválido'),
    
    body('cartaoId')
      .optional()
      .isMongoId()
      .withMessage('ID do cartão inválido'),
    
    body('recorrente')
      .optional()
      .isBoolean()
      .withMessage('Recorrente deve ser verdadeiro ou falso'),
    
    body('observacoes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Observações não podem ter mais de 1000 caracteres'),
    
    body('status')
      .optional()
      .isIn(['pendente', 'confirmada', 'cancelada'])
      .withMessage('Status deve ser "pendente", "confirmada" ou "cancelada"'),
    
    handleValidationErrors
  ],

  bulkCreate: [
    body('transactions')
      .isArray({ min: 1 })
      .withMessage('Deve fornecer pelo menos uma transação'),
    
    body('transactions.*.tipo')
      .isIn(['receita', 'despesa'])
      .withMessage('Tipo deve ser "receita" ou "despesa"'),
    
    body('transactions.*.valor')
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser um número positivo'),
    
    body('transactions.*.descricao')
      .trim()
      .notEmpty()
      .withMessage('Descrição é obrigatória')
      .isLength({ min: 1, max: 500 })
      .withMessage('Descrição deve ter entre 1 e 500 caracteres'),
    
    body('transactions.*.data')
      .isISO8601()
      .withMessage('Data deve estar no formato ISO 8601'),
    
    handleValidationErrors
  ]
};

/**
 * Validações para parâmetros de ID
 */
const idValidation = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('ID inválido'),
    
    handleValidationErrors
  ]
};

/**
 * Validações para query parameters
 */
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número inteiro positivo'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser um número entre 1 e 100'),
    
    query('sortBy')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Campo de ordenação não pode estar vazio'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Ordem deve ser "asc" ou "desc"'),
    
    handleValidationErrors
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Data inicial deve estar no formato ISO 8601'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Data final deve estar no formato ISO 8601'),
    
    handleValidationErrors
  ]
};

/**
 * Validações para usuário
 */
const userValidation = {
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Nome não pode estar vazio')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Email deve ter um formato válido')
      .normalizeEmail(),
    
    handleValidationErrors
  ],

  updateSettings: [
    body('configuracoes.tema')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Tema deve ser "light", "dark" ou "system"'),
    
    body('configuracoes.moeda')
      .optional()
      .trim()
      .isLength({ min: 3, max: 3 })
      .withMessage('Moeda deve ter 3 caracteres'),
    
    body('configuracoes.idioma')
      .optional()
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Idioma deve ter entre 2 e 10 caracteres'),
    
    body('configuracoes.notificacoes')
      .optional()
      .isBoolean()
      .withMessage('Notificações deve ser verdadeiro ou falso'),
    
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  authValidation,
  categoryValidation,
  transactionValidation,
  idValidation,
  queryValidation,
  userValidation
};

