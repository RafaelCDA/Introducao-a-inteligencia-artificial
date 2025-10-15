// ===== MÓDULO DE GRÁFICOS INTERATIVOS =====
const ChartManager = {
    charts: {},
    colors: {
        primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
        sequential: ['#667eea', '#6c7ae0', '#7278d6', '#7876cc', '#7e74c2', '#8472b8'],
        categorical: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#f5576c', '#ffd200']
    },

    // ===== INICIALIZAÇÃO =====
    init: function() {
        console.log('📊 Inicializando módulo de gráficos...');
        this.setupChartStyles();
    },

    // ===== CONFIGURAÇÃO DE ESTILOS =====
    setupChartStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            .chart-container {
                position: relative;
                height: 100%;
                min-height: 300px;
            }
            
            .chart-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 300px;
                color: #6b7280;
            }
            
            .chart-legend {
                margin-top: 1rem;
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                justify-content: center;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.8rem;
            }
            
            .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
            }
            
            .chart-tooltip {
                background: rgba(0, 0, 0, 0.8) !important;
                color: white !important;
                border-radius: 6px !important;
                padding: 8px 12px !important;
                font-size: 12px !important;
            }
        `;
        document.head.appendChild(style);
    },

    // ===== ATUALIZAR GRÁFICOS COM DADOS =====
    updateCharts: function(statistics) {
        if (!statistics) {
            console.warn('📊 Dados de estatísticas não fornecidos');
            return;
        }

        try {
            this.updateGenreChart(statistics.generos);
            this.updateLevelChart(statistics.niveis);
            this.updateTypeChart(statistics.tipos);
            this.updateStatsSummary(statistics);
            
            console.log('📊 Gráficos atualizados com sucesso');
        } catch (error) {
            console.error('❌ Erro ao atualizar gráficos:', error);
            this.showChartError();
        }
    },

    // ===== GRÁFICO DE DISTRIBUIÇÃO POR GÊNERO =====
    updateGenreChart: function(generosData) {
        const container = document.getElementById('chartGeneros');
        if (!container) return;

        // Mostrar loading
        container.innerHTML = '<div class="chart-loading"><i class="fas fa-spinner fa-spin"></i> Carregando gráfico...</div>';

        // Preparar dados
        const labels = Object.keys(generosData || {});
        const values = Object.values(generosData || {});
        
        if (labels.length === 0) {
            this.showNoDataMessage(container, 'gêneros');
            return;
        }

        // Configuração do gráfico de pizza
        const data = [{
            values: values,
            labels: labels,
            type: 'pie',
            hole: 0.4,
            marker: {
                colors: this.colors.primary,
                line: {
                    color: '#ffffff',
                    width: 2
                }
            },
            textinfo: 'label+percent',
            textposition: 'outside',
            hoverinfo: 'label+value+percent',
            hovertemplate: '<b>%{label}</b><br>Quantidade: %{value}<br>Percentual: %{percent}<extra></extra>',
            pull: labels.map((_, index) => index === 0 ? 0.1 : 0), // Destaque para o primeiro item
            rotation: 45
        }];

        const layout = {
            title: {
                text: 'Distribuição por Gênero',
                font: {
                    size: 16,
                    color: '#1f2937',
                    family: 'Segoe UI, sans-serif'
                },
                x: 0.5,
                xanchor: 'center'
            },
            showlegend: true,
            legend: {
                orientation: 'h',
                y: -0.1,
                x: 0.5,
                xanchor: 'center',
                font: {
                    size: 11,
                    color: '#6b7280'
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: {
                t: 50,
                b: 80,
                l: 50,
                r: 50
            },
            height: 350,
            annotations: [{
                text: `Total: ${values.reduce((a, b) => a + b, 0)}`,
                showarrow: false,
                x: 0.5,
                y: 0.5,
                font: {
                    size: 14,
                    color: '#6b7280'
                }
            }]
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            modeBarButtonsToAdd: [],
            toImageButtonOptions: {
                format: 'png',
                filename: 'distribuicao_generos',
                height: 500,
                width: 700,
                scale: 2
            }
        };

        // Renderizar gráfico
        setTimeout(() => {
            try {
                Plotly.newPlot('chartGeneros', data, layout, config).then(() => {
                    this.charts.genre = 'chartGeneros';
                    this.addChartInteractions('chartGeneros');
                });
            } catch (error) {
                console.error('Erro ao renderizar gráfico de gêneros:', error);
                this.showChartError(container);
            }
        }, 100);
    },

    // ===== GRÁFICO DE DISTRIBUIÇÃO POR NÍVEL =====
    updateLevelChart: function(niveisData) {
        const container = document.getElementById('chartNiveis');
        if (!container) return;

        container.innerHTML = '<div class="chart-loading"><i class="fas fa-spinner fa-spin"></i> Carregando gráfico...</div>';

        const labels = Object.keys(niveisData || {});
        const values = Object.values(niveisData || {});

        if (labels.length === 0) {
            this.showNoDataMessage(container, 'níveis');
            return;
        }

        // Mapear labels para nomes mais amigáveis
        const friendlyLabels = labels.map(label => {
            const map = {
                'iniciante': 'Iniciante',
                'intermediario': 'Intermediário',
                'avancado': 'Avançado'
            };
            return map[label] || label;
        });

        // Gráfico de barras horizontais
        const data = [{
            x: values,
            y: friendlyLabels,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: this.colors.sequential,
                line: {
                    color: '#ffffff',
                    width: 1
                }
            },
            text: values.map(v => v.toString()),
            textposition: 'auto',
            hoverinfo: 'x+y',
            hovertemplate: '<b>%{y}</b><br>Quantidade: %{x}<extra></extra>'
        }];

        const layout = {
            title: {
                text: 'Distribuição por Nível de Leitura',
                font: {
                    size: 16,
                    color: '#1f2937'
                }
            },
            xaxis: {
                title: {
                    text: 'Quantidade de Livros',
                    font: {
                        size: 12,
                        color: '#6b7280'
                    }
                },
                gridcolor: '#f3f4f6',
                zerolinecolor: '#f3f4f6'
            },
            yaxis: {
                title: {
                    text: 'Nível de Leitura',
                    font: {
                        size: 12,
                        color: '#6b7280'
                    }
                },
                gridcolor: '#f3f4f6',
                automargin: true
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: {
                t: 50,
                b: 60,
                l: 100,
                r: 50
            },
            height: 350,
            bargap: 0.3
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'distribuicao_niveis',
                height: 500,
                width: 700,
                scale: 2
            }
        };

        setTimeout(() => {
            try {
                Plotly.newPlot('chartNiveis', data, layout, config).then(() => {
                    this.charts.level = 'chartNiveis';
                    this.addChartInteractions('chartNiveis');
                });
            } catch (error) {
                console.error('Erro ao renderizar gráfico de níveis:', error);
                this.showChartError(container);
            }
        }, 100);
    },

    // ===== GRÁFICO DE DISTRIBUIÇÃO POR TIPO =====
    updateTypeChart: function(tiposData) {
        // Este gráfico pode ser adicionado posteriormente se necessário
        console.log('📊 Dados de tipos:', tiposData);
    },

    // ===== ATUALIZAR RESUMO ESTATÍSTICO =====
    updateStatsSummary: function(statistics) {
        const stats = {
            totalLivros: statistics.total_livros || 0,
            totalGeneros: statistics.total_generos || 0,
            generos: statistics.generos || {},
            tipos: statistics.tipos || {},
            niveis: statistics.niveis || {}
        };

        // Atualizar cards de estatísticas
        this.updateStatCard('total-livros', stats.totalLivros);
        this.updateStatCard('total-generos', stats.totalGeneros);
        this.updateStatCard('total-tipos', Object.keys(stats.tipos).length);
        
        // Calcular percentuais
        this.calculatePercentages(stats);
    },

    updateStatCard: function(cardId, value) {
        const element = document.getElementById(cardId);
        if (element) {
            this.animateValue(element, 0, value, 1000);
        }
    },

    // ===== ANIMAÇÃO DE VALORES =====
    animateValue: function(element, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        
        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(start + (range * easeOutQuart));
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }
        
        requestAnimationFrame(updateValue);
    },

    // ===== CÁLCULO DE PERCENTUAIS =====
    calculatePercentages: function(stats) {
        const totalBooks = stats.totalLivros;
        
        if (totalBooks > 0) {
            // Calcular percentual por gênero
            const genrePercentages = {};
            Object.entries(stats.generos).forEach(([genero, quantidade]) => {
                genrePercentages[genero] = ((quantidade / totalBooks) * 100).toFixed(1);
            });
            
            // Calcular percentual por nível
            const levelPercentages = {};
            Object.entries(stats.niveis).forEach(([nivel, quantidade]) => {
                levelPercentages[nivel] = ((quantidade / totalBooks) * 100).toFixed(1);
            });
            
            console.log('📈 Percentuais calculados:', { genrePercentages, levelPercentages });
        }
    },

    // ===== INTERAÇÕES COM GRÁFICOS =====
    addChartInteractions: function(chartId) {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) return;

        // Adicionar evento de clique
        chartElement.on('plotly_click', function(data) {
            const point = data.points[0];
            if (point) {
                ChartManager.handleChartClick(chartId, point);
            }
        });

        // Adicionar evento de hover
        chartElement.on('plotly_hover', function(data) {
            const point = data.points[0];
            ChartManager.showEnhancedTooltip(point);
        });

        // Adicionar evento de redimensionamento
        window.addEventListener('resize', function() {
            setTimeout(() => {
                Plotly.Plots.resize(chartId);
            }, 300);
        });
    },

    handleChartClick: function(chartId, pointData) {
        console.log('📊 Ponto clicado:', pointData);
        
        const chartType = chartId === 'chartGeneros' ? 'gênero' : 'nível';
        const value = pointData.label || pointData.y;
        const count = pointData.value || pointData.x;
        
        // Mostrar detalhes do item clicado
        this.showChartItemDetails(chartType, value, count);
    },

    showEnhancedTooltip: function(pointData) {
        // Tooltip customizado pode ser implementado aqui
        // Plotly já fornece tooltips nativos excelentes
    },

    showChartItemDetails: function(chartType, value, count) {
        const message = `📚 ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}: ${value}\n📊 Quantidade: ${count} livros`;
        
        // Usar a função de notificação existente
        if (window.showNotification) {
            window.showNotification(message, 'info');
        } else {
            alert(message);
        }
    },

    // ===== GERAR RELATÓRIO ESTATÍSTICO =====
    generateStatsReport: function(statistics) {
        const report = {
            timestamp: new Date().toISOString(),
            totalLivros: statistics.total_livros,
            totalGeneros: statistics.total_generos,
            distribuicaoGeneros: statistics.generos,
            distribuicaoNiveis: statistics.niveis,
            distribuicaoTipos: statistics.tipos
        };

        // Download do relatório em JSON
        this.downloadReport(report, 'relatorio_estatisticas.json');
        
        return report;
    },

    downloadReport: function(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // ===== EXPORTAÇÃO DE GRÁFICOS =====
    exportChart: function(chartId, format = 'png') {
        if (!this.charts[chartId]) {
            console.warn('Gráfico não encontrado:', chartId);
            return;
        }

        const config = {
            format: format,
            filename: `grafico_${chartId}`,
            height: 600,
            width: 800,
            scale: 2
        };

        Plotly.downloadImage(chartId, config);
    },

    // ===== MÉTRICAS DE PERFORMANCE =====
    getChartPerformance: function() {
        const performance = {};
        
        Object.keys(this.charts).forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element) {
                performance[chartId] = {
                    rendered: true,
                    dataPoints: element.data ? element.data[0].x.length : 0,
                    lastUpdate: new Date().toISOString()
                };
            }
        });
        
        return performance;
    },

    // ===== TRATAMENTO DE ERROS =====
    showChartError: function(container = null) {
        const errorHTML = `
            <div class="chart-error" style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: #f59e0b;"></i>
                <h3 style="margin-bottom: 0.5rem;">Erro ao Carregar Gráfico</h3>
                <p>Não foi possível carregar os dados do gráfico.</p>
                <button onclick="ChartManager.retryLoading()" 
                        style="margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
        
        if (container) {
            container.innerHTML = errorHTML;
        }
    },

    showNoDataMessage: function(container, dataType) {
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 0.5rem;">Sem Dados de ${dataType}</h3>
                <p>Não há dados disponíveis para exibir este gráfico.</p>
            </div>
        `;
    },

    retryLoading: function() {
        console.log('🔄 Tentando recarregar gráficos...');
        
        // Disparar evento para recarregar estatísticas
        const event = new CustomEvent('retryChartsLoading');
        document.dispatchEvent(event);
        
        // Recarregar após pequeno delay
        setTimeout(() => {
            if (window.loadStatistics) {
                window.loadStatistics();
            }
        }, 1000);
    },

    // ===== LIMPEZA E DESTRUIÇÃO =====
    destroy: function() {
        Object.keys(this.charts).forEach(chartId => {
            Plotly.purge(chartId);
        });
        
        this.charts = {};
        console.log('🧹 Gráficos destruídos');
    },

    // ===== ATUALIZAÇÃO EM TEMPO REAL =====
    startRealTimeUpdates: function(interval = 30000) {
        this.stopRealTimeUpdates(); // Parar qualquer intervalo existente
        
        this.updateInterval = setInterval(() => {
            console.log('🔄 Atualização automática de gráficos');
            if (window.loadStatistics) {
                window.loadStatistics();
            }
        }, interval);
    },

    stopRealTimeUpdates: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
};

// ===== INICIALIZAÇÃO AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', function() {
    ChartManager.init();
    
    // Event listener para recarregar gráficos
    document.addEventListener('retryChartsLoading', function() {
        if (window.loadStatistics) {
            window.loadStatistics();
        }
    });
});

// ===== INTEGRAÇÃO COM O APP PRINCIPAL =====
// Função global para atualizar gráficos
window.updateCharts = function(statistics) {
    ChartManager.updateCharts(statistics);
};

// Função para exportar gráficos
window.exportChart = function(chartId, format) {
    ChartManager.exportChart(chartId, format);
};

// Função para gerar relatório
window.generateStatsReport = function(statistics) {
    return ChartManager.generateStatsReport(statistics);
};

// Função para obter performance dos gráficos
window.getChartPerformance = function() {
    return ChartManager.getChartPerformance();
};

// ===== MOCK DATA PARA DESENVOLVIMENTO =====
ChartManager.mockData = {
    generos: {
        fantasia: 8,
        horror: 4,
        aventura: 3,
        comedia: 2,
        distopia: 2,
        tecnologia: 1,
        matematica: 1
    },
    niveis: {
        iniciante: 5,
        intermediario: 8,
        avancado: 8
    },
    tipos: {
        ficcao: 18,
        nao_ficcao: 3
    },
    total_livros: 21,
    total_generos: 7
};

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}