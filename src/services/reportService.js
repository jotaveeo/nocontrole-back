const { transactionRepository, categoryRepository } = require('../repositories');

class ReportService {
  /**
   * Gera relatório financeiro completo
   * @param {String} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Object} Relatório completo
   */
  async generateFinancialReport(userId, options = {}) {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'categoria',
        includeCharts = true
      } = options;

      const start = startDate ? new Date(startDate) : this.getDefaultStartDate();
      const end = endDate ? new Date(endDate) : new Date();

      const [
        resumoGeral,
        transacoesPorCategoria,
        fluxoCaixa,
        topCategorias,
        evolucaoMensal
      ] = await Promise.all([
        transactionRepository.getFinancialSummary(userId, start, end),
        transactionRepository.getByCategory(userId, start, end),
        transactionRepository.getMonthlyCashFlow(userId, end.getFullYear()),
        this.getTopCategories(userId, start, end),
        this.getMonthlyEvolution(userId, start, end)
      ]);

      const relatorio = {
        periodo: { inicio: start, fim: end },
        resumoGeral,
        transacoesPorCategoria,
        topCategorias,
        evolucaoMensal,
        analises: this.generateAnalysis(resumoGeral, transacoesPorCategoria, evolucaoMensal)
      };

      if (includeCharts) {
        relatorio.graficos = this.generateChartData(transacoesPorCategoria, evolucaoMensal);
      }

      return relatorio;
    } catch (error) {
      throw new Error(`Erro ao gerar relatório financeiro: ${error.message}`);
    }
  }

  /**
   * Gera relatório de categorias
   * @param {String} userId - ID do usuário
   * @param {Object} options - Opções do relatório
   * @returns {Object} Relatório de categorias
   */
  async generateCategoryReport(userId, options = {}) {
    try {
      const {
        startDate,
        endDate,
        tipo = null
      } = options;

      const start = startDate ? new Date(startDate) : this.getDefaultStartDate();
      const end = endDate ? new Date(endDate) : new Date();

      const [
        categorias,
        transacoesPorCategoria,
        estatisticasCategorias
      ] = await Promise.all([
        categoryRepository.findByUser(userId, tipo ? { tipo } : {}),
        transactionRepository.getByCategory(userId, start, end),
        categoryRepository.getStatsByUser(userId)
      ]);

      // Combinar dados de categorias com transações
      const relatorioDetalhado = categorias.map(categoria => {
        const transacoesCategoria = transacoesPorCategoria.filter(
          t => t.categoria._id.toString() === categoria._id.toString()
        );

        const totalTransacoes = transacoesCategoria.reduce((sum, t) => sum + t.total, 0);
        const quantidadeTransacoes = transacoesCategoria.reduce((sum, t) => sum + t.count, 0);

        return {
          categoria,
          totalGasto: totalTransacoes,
          quantidadeTransacoes,
          mediaTransacao: quantidadeTransacoes > 0 ? totalTransacoes / quantidadeTransacoes : 0,
          percentualDoTotal: 0 // Será calculado depois
        };
      });

      // Calcular percentuais
      const totalGeral = relatorioDetalhado.reduce((sum, item) => sum + item.totalGasto, 0);
      relatorioDetalhado.forEach(item => {
        item.percentualDoTotal = totalGeral > 0 ? (item.totalGasto / totalGeral) * 100 : 0;
      });

      return {
        periodo: { inicio: start, fim: end },
        estatisticasCategorias,
        categorias: relatorioDetalhado.sort((a, b) => b.totalGasto - a.totalGasto),
        totalGeral
      };
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de categorias: ${error.message}`);
    }
  }

  /**
   * Gera relatório de fluxo de caixa
   * @param {String} userId - ID do usuário
   * @param {Number} ano - Ano do relatório
   * @returns {Object} Relatório de fluxo de caixa
   */
  async generateCashFlowReport(userId, ano) {
    try {
      const fluxoCaixa = await transactionRepository.getMonthlyCashFlow(userId, ano);
      
      // Preencher meses sem dados
      const fluxoCompleto = [];
      for (let mes = 1; mes <= 12; mes++) {
        const dadosMes = fluxoCaixa.find(f => f.mes === mes) || {
          mes,
          receitas: 0,
          despesas: 0,
          saldo: 0
        };
        fluxoCompleto.push(dadosMes);
      }

      // Calcular acumulados
      let saldoAcumulado = 0;
      const fluxoComAcumulado = fluxoCompleto.map(mes => {
        saldoAcumulado += mes.saldo;
        return {
          ...mes,
          saldoAcumulado
        };
      });

      // Calcular estatísticas
      const totalReceitas = fluxoCompleto.reduce((sum, mes) => sum + mes.receitas, 0);
      const totalDespesas = fluxoCompleto.reduce((sum, mes) => sum + mes.despesas, 0);
      const saldoTotal = totalReceitas - totalDespesas;

      const mediaReceitas = totalReceitas / 12;
      const mediaDespesas = totalDespesas / 12;
      const mediaSaldo = saldoTotal / 12;

      return {
        ano,
        fluxoMensal: fluxoComAcumulado,
        resumoAnual: {
          totalReceitas,
          totalDespesas,
          saldoTotal,
          mediaReceitas,
          mediaDespesas,
          mediaSaldo
        },
        analises: this.analyzeCashFlow(fluxoComAcumulado)
      };
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de fluxo de caixa: ${error.message}`);
    }
  }

  /**
   * Busca top categorias por período
   * @param {String} userId - ID do usuário
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Object} Top categorias
   */
  async getTopCategories(userId, startDate, endDate) {
    try {
      const transacoesPorCategoria = await transactionRepository.getByCategory(userId, startDate, endDate);
      
      const receitas = transacoesPorCategoria
        .filter(t => t.tipo === 'receita')
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const despesas = transacoesPorCategoria
        .filter(t => t.tipo === 'despesa')
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return { receitas, despesas };
    } catch (error) {
      throw new Error(`Erro ao buscar top categorias: ${error.message}`);
    }
  }

  /**
   * Busca evolução mensal
   * @param {String} userId - ID do usuário
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Array} Evolução mensal
   */
  async getMonthlyEvolution(userId, startDate, endDate) {
    try {
      const meses = [];
      const inicio = new Date(startDate);
      const fim = new Date(endDate);

      while (inicio <= fim) {
        const inicioMes = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
        const fimMes = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59);

        const resumoMes = await transactionRepository.getFinancialSummary(userId, inicioMes, fimMes);
        
        meses.push({
          ano: inicio.getFullYear(),
          mes: inicio.getMonth() + 1,
          ...resumoMes
        });

        inicio.setMonth(inicio.getMonth() + 1);
      }

      return meses;
    } catch (error) {
      throw new Error(`Erro ao buscar evolução mensal: ${error.message}`);
    }
  }

  /**
   * Gera análises automáticas
   * @param {Object} resumoGeral - Resumo geral
   * @param {Array} transacoesPorCategoria - Transações por categoria
   * @param {Array} evolucaoMensal - Evolução mensal
   * @returns {Object} Análises
   */
  generateAnalysis(resumoGeral, transacoesPorCategoria, evolucaoMensal) {
    const analises = [];

    // Análise do saldo
    if (resumoGeral.saldo > 0) {
      analises.push({
        tipo: 'positivo',
        titulo: 'Saldo Positivo',
        descricao: `Você teve um saldo positivo de R$ ${resumoGeral.saldo.toFixed(2)} no período.`
      });
    } else if (resumoGeral.saldo < 0) {
      analises.push({
        tipo: 'alerta',
        titulo: 'Saldo Negativo',
        descricao: `Você teve um déficit de R$ ${Math.abs(resumoGeral.saldo).toFixed(2)} no período.`
      });
    }

    // Análise da categoria com maior gasto
    const despesas = transacoesPorCategoria.filter(t => t.tipo === 'despesa');
    if (despesas.length > 0) {
      const maiorGasto = despesas.reduce((max, current) => 
        current.total > max.total ? current : max
      );
      
      analises.push({
        tipo: 'informativo',
        titulo: 'Maior Categoria de Gasto',
        descricao: `Sua maior categoria de gasto foi "${maiorGasto.categoria.nome}" com R$ ${maiorGasto.total.toFixed(2)}.`
      });
    }

    // Análise de tendência (se houver dados mensais)
    if (evolucaoMensal.length >= 2) {
      const primeiro = evolucaoMensal[0];
      const ultimo = evolucaoMensal[evolucaoMensal.length - 1];
      
      if (ultimo.saldo > primeiro.saldo) {
        analises.push({
          tipo: 'positivo',
          titulo: 'Tendência Positiva',
          descricao: 'Seu saldo tem apresentado tendência de crescimento no período.'
        });
      } else if (ultimo.saldo < primeiro.saldo) {
        analises.push({
          tipo: 'alerta',
          titulo: 'Tendência Negativa',
          descricao: 'Seu saldo tem apresentado tendência de queda no período.'
        });
      }
    }

    return analises;
  }

  /**
   * Gera dados para gráficos
   * @param {Array} transacoesPorCategoria - Transações por categoria
   * @param {Array} evolucaoMensal - Evolução mensal
   * @returns {Object} Dados dos gráficos
   */
  generateChartData(transacoesPorCategoria, evolucaoMensal) {
    // Gráfico de pizza - Despesas por categoria
    const despesasPorCategoria = transacoesPorCategoria
      .filter(t => t.tipo === 'despesa')
      .map(t => ({
        label: t.categoria.nome,
        value: t.total,
        color: t.categoria.cor
      }));

    // Gráfico de linha - Evolução mensal
    const evolucaoChart = {
      labels: evolucaoMensal.map(m => `${m.mes}/${m.ano}`),
      datasets: [
        {
          label: 'Receitas',
          data: evolucaoMensal.map(m => m.receitas),
          color: '#10B981'
        },
        {
          label: 'Despesas',
          data: evolucaoMensal.map(m => m.despesas),
          color: '#EF4444'
        },
        {
          label: 'Saldo',
          data: evolucaoMensal.map(m => m.saldo),
          color: '#3B82F6'
        }
      ]
    };

    return {
      despesasPorCategoria,
      evolucaoMensal: evolucaoChart
    };
  }

  /**
   * Analisa fluxo de caixa
   * @param {Array} fluxoMensal - Fluxo mensal
   * @returns {Object} Análises do fluxo
   */
  analyzeCashFlow(fluxoMensal) {
    const analises = [];

    // Meses com saldo negativo
    const mesesNegativos = fluxoMensal.filter(m => m.saldo < 0);
    if (mesesNegativos.length > 0) {
      analises.push({
        tipo: 'alerta',
        titulo: 'Meses com Saldo Negativo',
        descricao: `Você teve ${mesesNegativos.length} mês(es) com saldo negativo.`
      });
    }

    // Melhor e pior mês
    const melhorMes = fluxoMensal.reduce((max, current) => 
      current.saldo > max.saldo ? current : max
    );
    const piorMes = fluxoMensal.reduce((min, current) => 
      current.saldo < min.saldo ? current : min
    );

    analises.push({
      tipo: 'informativo',
      titulo: 'Melhor Mês',
      descricao: `Seu melhor mês foi ${melhorMes.mes} com saldo de R$ ${melhorMes.saldo.toFixed(2)}.`
    });

    analises.push({
      tipo: 'informativo',
      titulo: 'Pior Mês',
      descricao: `Seu pior mês foi ${piorMes.mes} com saldo de R$ ${piorMes.saldo.toFixed(2)}.`
    });

    return analises;
  }

  /**
   * Retorna data inicial padrão (3 meses atrás)
   * @returns {Date} Data inicial padrão
   */
  getDefaultStartDate() {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
  }
}

module.exports = new ReportService();

