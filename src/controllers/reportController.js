const reportService = require('../services/reportService');
const { asyncHandler } = require('../middlewares/errorHandler');

class ReportController {
  /**
   * Gera relatório financeiro completo
   */
  generateFinancialReport = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      groupBy: req.query.groupBy || 'categoria',
      includeCharts: req.query.includeCharts !== 'false'
    };
    
    const report = await reportService.generateFinancialReport(userId, options);
    
    res.json({
      success: true,
      data: report
    });
  });

  /**
   * Gera relatório de categorias
   */
  generateCategoryReport = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      tipo: req.query.tipo
    };
    
    const report = await reportService.generateCategoryReport(userId, options);
    
    res.json({
      success: true,
      data: report
    });
  });

  /**
   * Gera relatório de fluxo de caixa
   */
  generateCashFlowReport = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const ano = parseInt(req.query.ano) || new Date().getFullYear();
    
    const report = await reportService.generateCashFlowReport(userId, ano);
    
    res.json({
      success: true,
      data: report
    });
  });

  /**
   * Busca top categorias por período
   */
  getTopCategories = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Datas de início e fim são obrigatórias'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const topCategories = await reportService.getTopCategories(userId, start, end);
    
    res.json({
      success: true,
      data: topCategories
    });
  });

  /**
   * Busca evolução mensal
   */
  getMonthlyEvolution = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Datas de início e fim são obrigatórias'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const evolution = await reportService.getMonthlyEvolution(userId, start, end);
    
    res.json({
      success: true,
      data: evolution
    });
  });

  /**
   * Exporta relatório em formato específico
   */
  exportReport = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { tipo, formato = 'json' } = req.query;
    
    let report;
    
    switch (tipo) {
      case 'financeiro':
        report = await reportService.generateFinancialReport(userId, req.query);
        break;
      case 'categorias':
        report = await reportService.generateCategoryReport(userId, req.query);
        break;
      case 'fluxo-caixa':
        const ano = parseInt(req.query.ano) || new Date().getFullYear();
        report = await reportService.generateCashFlowReport(userId, ano);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de relatório inválido'
        });
    }
    
    // Por enquanto, apenas JSON é suportado
    if (formato === 'json') {
      res.json({
        success: true,
        data: report
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Formato de exportação não suportado'
      });
    }
  });

  /**
   * Busca relatórios disponíveis
   */
  getAvailableReports = asyncHandler(async (req, res) => {
    const reports = [
      {
        id: 'financeiro',
        nome: 'Relatório Financeiro',
        descricao: 'Relatório completo com resumo financeiro, categorias e análises',
        parametros: ['startDate', 'endDate', 'groupBy', 'includeCharts']
      },
      {
        id: 'categorias',
        nome: 'Relatório de Categorias',
        descricao: 'Análise detalhada dos gastos por categoria',
        parametros: ['startDate', 'endDate', 'tipo']
      },
      {
        id: 'fluxo-caixa',
        nome: 'Relatório de Fluxo de Caixa',
        descricao: 'Fluxo de caixa mensal com análises e tendências',
        parametros: ['ano']
      }
    ];
    
    res.json({
      success: true,
      data: reports
    });
  });
}

module.exports = new ReportController();

