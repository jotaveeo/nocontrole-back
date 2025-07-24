const { 
  transactionRepository, 
  goalRepository, 
  cardRepository, 
  wishlistRepository 
} = require('../repositories');

class DashboardService {
  /**
   * Busca dados completos do dashboard
   * @param {String} userId - ID do usuário
   * @returns {Object} Dados do dashboard
   */
  async getDashboardData(userId) {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

      // Buscar dados em paralelo
      const [
        resumoFinanceiro,
        transacoesRecentes,
        metasAtivas,
        cartoes,
        wishlistItems,
        fluxoCaixa
      ] = await Promise.all([
        transactionRepository.getFinancialSummary(userId, inicioMes, fimMes),
        transactionRepository.findRecent(userId, 5),
        goalRepository.findActiveByUser(userId),
        cardRepository.findActiveByUser(userId),
        wishlistRepository.findActiveByUser(userId),
        transactionRepository.getMonthlyCashFlow(userId, hoje.getFullYear())
      ]);

      // Calcular estatísticas adicionais
      const estatisticas = await this.calculateStatistics(userId);
      const alertas = await this.getAlerts(userId);

      return {
        resumoFinanceiro,
        transacoesRecentes,
        metas: metasAtivas.slice(0, 3), // Primeiras 3 metas
        cartoes: cartoes.slice(0, 3), // Primeiros 3 cartões
        wishlist: wishlistItems.slice(0, 3), // Primeiros 3 itens
        fluxoCaixa,
        estatisticas,
        alertas
      };
    } catch (error) {
      throw new Error(`Erro ao buscar dados do dashboard: ${error.message}`);
    }
  }

  /**
   * Calcula estatísticas gerais
   * @param {String} userId - ID do usuário
   * @returns {Object} Estatísticas
   */
  async calculateStatistics(userId) {
    try {
      const [
        statsTransacoes,
        statsMetas,
        statsCartoes,
        statsWishlist
      ] = await Promise.all([
        transactionRepository.getStatsByUser(userId),
        goalRepository.getStatsByUser(userId),
        cardRepository.getStatsByUser(userId),
        wishlistRepository.getStatsByUser(userId)
      ]);

      return {
        transacoes: statsTransacoes,
        metas: statsMetas,
        cartoes: statsCartoes,
        wishlist: statsWishlist
      };
    } catch (error) {
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  }

  /**
   * Busca alertas importantes
   * @param {String} userId - ID do usuário
   * @returns {Object} Alertas
   */
  async getAlerts(userId) {
    try {
      const [
        metasVencendo,
        cartoesLimiteBaixo,
        wishlistProximaMeta
      ] = await Promise.all([
        goalRepository.findNearDeadline(userId, 7),
        cardRepository.findLowLimit(userId, 80),
        wishlistRepository.findNearGoal(userId, 80)
      ]);

      return {
        metasVencendo,
        cartoesLimiteBaixo,
        wishlistProximaMeta,
        total: metasVencendo.length + cartoesLimiteBaixo.length + wishlistProximaMeta.length
      };
    } catch (error) {
      throw new Error(`Erro ao buscar alertas: ${error.message}`);
    }
  }

  /**
   * Busca resumo mensal
   * @param {String} userId - ID do usuário
   * @param {Number} ano - Ano
   * @param {Number} mes - Mês (1-12)
   * @returns {Object} Resumo mensal
   */
  async getMonthlyResume(userId, ano, mes) {
    try {
      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59);

      const [
        resumoFinanceiro,
        transacoesPorCategoria,
        metasDoMes,
        gastosCartoes
      ] = await Promise.all([
        transactionRepository.getFinancialSummary(userId, inicioMes, fimMes),
        transactionRepository.getByCategory(userId, inicioMes, fimMes),
        goalRepository.findByUser(userId, {
          prazo: { $gte: inicioMes, $lte: fimMes }
        }),
        this.getCardExpensesSummary(userId, ano, mes)
      ]);

      return {
        periodo: { ano, mes },
        resumoFinanceiro,
        transacoesPorCategoria,
        metasDoMes,
        gastosCartoes
      };
    } catch (error) {
      throw new Error(`Erro ao buscar resumo mensal: ${error.message}`);
    }
  }

  /**
   * Busca resumo de gastos por cartão
   * @param {String} userId - ID do usuário
   * @param {Number} ano - Ano
   * @param {Number} mes - Mês
   * @returns {Array} Resumo de gastos por cartão
   */
  async getCardExpensesSummary(userId, ano, mes) {
    try {
      const cartoes = await cardRepository.findActiveByUser(userId);
      
      const resumo = await Promise.all(
        cartoes.map(async (cartao) => {
          const gastos = await cardRepository.getMonthlyExpenses(cartao._id, ano, mes);
          return {
            cartao: {
              id: cartao._id,
              nome: cartao.nome,
              bandeira: cartao.bandeira,
              limite: cartao.limite
            },
            gastos,
            percentualUsado: cartao.limite > 0 ? (gastos / cartao.limite) * 100 : 0
          };
        })
      );

      return resumo.sort((a, b) => b.gastos - a.gastos);
    } catch (error) {
      throw new Error(`Erro ao buscar resumo de gastos por cartão: ${error.message}`);
    }
  }

  /**
   * Busca tendências financeiras
   * @param {String} userId - ID do usuário
   * @param {Number} meses - Número de meses para análise
   * @returns {Object} Tendências
   */
  async getFinancialTrends(userId, meses = 6) {
    try {
      const hoje = new Date();
      const inicioAnalise = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1);

      const fluxoCaixa = await transactionRepository.getMonthlyCashFlow(userId, hoje.getFullYear());
      
      // Calcular tendências
      const tendencias = this.calculateTrends(fluxoCaixa);

      return {
        periodo: { meses, inicio: inicioAnalise },
        fluxoCaixa,
        tendencias
      };
    } catch (error) {
      throw new Error(`Erro ao buscar tendências financeiras: ${error.message}`);
    }
  }

  /**
   * Calcula tendências baseadas no fluxo de caixa
   * @param {Array} fluxoCaixa - Dados do fluxo de caixa
   * @returns {Object} Tendências calculadas
   */
  calculateTrends(fluxoCaixa) {
    if (fluxoCaixa.length < 2) {
      return {
        receitas: 'estavel',
        despesas: 'estavel',
        saldo: 'estavel'
      };
    }

    const calcularTendencia = (valores) => {
      if (valores.length < 2) return 'estavel';
      
      const primeiro = valores[0];
      const ultimo = valores[valores.length - 1];
      const diferenca = ((ultimo - primeiro) / primeiro) * 100;
      
      if (diferenca > 5) return 'crescente';
      if (diferenca < -5) return 'decrescente';
      return 'estavel';
    };

    const receitas = fluxoCaixa.map(item => item.receitas);
    const despesas = fluxoCaixa.map(item => item.despesas);
    const saldos = fluxoCaixa.map(item => item.saldo);

    return {
      receitas: calcularTendencia(receitas),
      despesas: calcularTendencia(despesas),
      saldo: calcularTendencia(saldos)
    };
  }

  /**
   * Busca comparativo com período anterior
   * @param {String} userId - ID do usuário
   * @param {Date} inicioAtual - Início do período atual
   * @param {Date} fimAtual - Fim do período atual
   * @returns {Object} Comparativo
   */
  async getComparison(userId, inicioAtual, fimAtual) {
    try {
      const diasPeriodo = Math.ceil((fimAtual - inicioAtual) / (1000 * 60 * 60 * 24));
      const inicioAnterior = new Date(inicioAtual);
      inicioAnterior.setDate(inicioAnterior.getDate() - diasPeriodo);
      const fimAnterior = new Date(inicioAtual);
      fimAnterior.setDate(fimAnterior.getDate() - 1);

      const [resumoAtual, resumoAnterior] = await Promise.all([
        transactionRepository.getFinancialSummary(userId, inicioAtual, fimAtual),
        transactionRepository.getFinancialSummary(userId, inicioAnterior, fimAnterior)
      ]);

      const calcularVariacao = (atual, anterior) => {
        if (anterior === 0) return atual > 0 ? 100 : 0;
        return ((atual - anterior) / anterior) * 100;
      };

      return {
        atual: resumoAtual,
        anterior: resumoAnterior,
        variacao: {
          receitas: calcularVariacao(resumoAtual.receitas, resumoAnterior.receitas),
          despesas: calcularVariacao(resumoAtual.despesas, resumoAnterior.despesas),
          saldo: calcularVariacao(resumoAtual.saldo, resumoAnterior.saldo)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar comparativo: ${error.message}`);
    }
  }
}

module.exports = new DashboardService();

