const dashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../middlewares/errorHandler');

class DashboardController {
  /**
   * Busca dados completos do dashboard
   */
  getDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const dashboardData = await dashboardService.getDashboardData(userId);
    
    res.json({
      success: true,
      data: dashboardData
    });
  });

  /**
   * Busca estatísticas gerais
   */
  getStatistics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const statistics = await dashboardService.calculateStatistics(userId);
    
    res.json({
      success: true,
      data: statistics
    });
  });

  /**
   * Busca alertas importantes
   */
  getAlerts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const alerts = await dashboardService.getAlerts(userId);
    
    res.json({
      success: true,
      data: alerts
    });
  });

  /**
   * Busca resumo mensal
   */
  getMonthlyResume = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { ano, mes } = req.query;
    
    const currentYear = parseInt(ano) || new Date().getFullYear();
    const currentMonth = parseInt(mes) || new Date().getMonth() + 1;
    
    const monthlyResume = await dashboardService.getMonthlyResume(userId, currentYear, currentMonth);
    
    res.json({
      success: true,
      data: monthlyResume
    });
  });

  /**
   * Busca tendências financeiras
   */
  getFinancialTrends = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const meses = parseInt(req.query.meses) || 6;
    
    const trends = await dashboardService.getFinancialTrends(userId, meses);
    
    res.json({
      success: true,
      data: trends
    });
  });

  /**
   * Busca comparativo com período anterior
   */
  getComparison = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Datas de início e fim são obrigatórias'
      });
    }
    
    const inicioAtual = new Date(startDate);
    const fimAtual = new Date(endDate);
    
    const comparison = await dashboardService.getComparison(userId, inicioAtual, fimAtual);
    
    res.json({
      success: true,
      data: comparison
    });
  });

  /**
   * Busca resumo de gastos por cartão
   */
  getCardExpensesSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { ano, mes } = req.query;
    
    const currentYear = parseInt(ano) || new Date().getFullYear();
    const currentMonth = parseInt(mes) || new Date().getMonth() + 1;
    
    const summary = await dashboardService.getCardExpensesSummary(userId, currentYear, currentMonth);
    
    res.json({
      success: true,
      data: summary
    });
  });
}

module.exports = new DashboardController();

