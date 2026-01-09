class ControleFinanceiro {
    constructor() {
        this.transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
        this.graficoPizza = null;
        this.graficoBarras = null;
        this.graficoLinha = null;
        this.init();
    }

    init() {
        this.carregarDataAtual();
        this.atualizarTotais();
        this.renderizarTabela();
        this.configurarEventos();
        
        // Criar gráficos apenas se houver dados
        if (this.transacoes.length > 0) {
            this.criarGraficos();
        } else {
            this.mostrarMensagemSemDados();
        }
    }

    carregarDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data').value = hoje;
    }

    configurarEventos() {
        // Formulário
        const form = document.getElementById('transacaoForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.adicionarTransacao();
            });
        }

        // Filtros
        document.querySelectorAll('.filtro-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderizarTabela(e.target.dataset.filtro);
            });
        });

        // Botão de atualizar gráficos
        const btnAtualizar = document.getElementById('btnAtualizarGraficos');
        if (btnAtualizar) {
            btnAtualizar.addEventListener('click', () => {
                this.atualizarGraficos();
                this.mostrarNotificacao('Gráficos atualizados!', 'success');
            });
        }

        // Aplicar filtro inicial
        this.renderizarTabela('todos');
    }

    adicionarTransacao() {
        const descricaoInput = document.getElementById('descricao');
        const valorInput = document.getElementById('valor');
        const categoriaInput = document.getElementById('cartegoria'); // ID CORRETO
        const tipoInput = document.querySelector('input[name="tipo"]:checked');
        const dataInput = document.getElementById('data');

        // Verificar se os elementos existem
        if (!descricaoInput || !valorInput || !categoriaInput || !tipoInput || !dataInput) {
            console.error('Elemento do formulário não encontrado!');
            this.mostrarNotificacao('Erro no formulário!', 'error');
            return;
        }

        const descricao = descricaoInput.value;
        const valor = parseFloat(valorInput.value);
        const categoria = categoriaInput.value; // CORRETO: usa 'cartegoria' do HTML
        const tipo = tipoInput.value;
        const data = dataInput.value;

        // Validar dados
        if (!descricao || isNaN(valor) || valor <= 0 || !data) {
            this.mostrarNotificacao('Preencha todos os campos corretamente!', 'error');
            return;
        }

        const transacao = {
            id: Date.now(),
            descricao,
            valor,
            categoria, // CORRETO
            tipo,
            data,
            dataRegistro: new Date().toISOString()
        };

        this.transacoes.unshift(transacao);
        this.salvarNoLocalStorage();
        this.atualizarTotais();
        this.renderizarTabela();
        this.limparFormulario();
        this.atualizarGraficos();
        
        this.mostrarNotificacao('Transação adicionada com sucesso!', 'success');
    }

    removerTransacao(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.transacoes = this.transacoes.filter(t => t.id !== id);
            this.salvarNoLocalStorage();
            this.atualizarTotais();
            this.renderizarTabela();
            this.atualizarGraficos();
            this.mostrarNotificacao('Transação removida!', 'error');
        }
    }

    salvarNoLocalStorage() {
        localStorage.setItem('transacoes', JSON.stringify(this.transacoes));
    }

    atualizarTotais() {
        let totalReceitas = 0;
        let totalDespesas = 0;

        this.transacoes.forEach(transacao => {
            if (transacao.tipo === 'receita') {
                totalReceitas += transacao.valor;
            } else {
                totalDespesas += transacao.valor;
            }
        });

        const saldoTotal = totalReceitas - totalDespesas;

        const totalReceitasEl = document.getElementById('totalReceitas');
        const totalDespesasEl = document.getElementById('totalDespesas');
        const saldoTotalEl = document.getElementById('saldoTotal');

        if (totalReceitasEl && totalDespesasEl && saldoTotalEl) {
            totalReceitasEl.textContent = this.formatarMoeda(totalReceitas);
            totalDespesasEl.textContent = this.formatarMoeda(totalDespesas);
            saldoTotalEl.textContent = this.formatarMoeda(saldoTotal);
            saldoTotalEl.style.color = saldoTotal >= 0 ? '#27ae60' : '#e74c3c';
        }
    }

    renderizarTabela(filtro = 'todos') {
        const corpoTabela = document.getElementById('corpoTabela');
        const emptyState = document.getElementById('emptyState');

        if (!corpoTabela || !emptyState) return;

        let transacoesFiltradas = this.transacoes;
        if (filtro !== 'todos') {
            transacoesFiltradas = this.transacoes.filter(t => t.tipo === filtro);
        }

        if (transacoesFiltradas.length === 0) {
            corpoTabela.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        transacoesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));

        const html = transacoesFiltradas.map(transacao => `
            <tr>
                <td>${this.formatarData(transacao.data)}</td>
                <td>${transacao.descricao}</td>
                <td>
                    <span class="categoria-badge ${transacao.categoria}">
                        ${this.formatarCategoria(transacao.categoria)}
                    </span>
                </td>
                <td class="valor-${transacao.tipo}">
                    ${transacao.tipo === 'despesa' ? '-' : '+'} ${this.formatarMoeda(transacao.valor)}
                </td>
                <td>
                    <button class="btn-excluir" onclick="app.removerTransacao(${transacao.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            </tr>
        `).join('');

        corpoTabela.innerHTML = html;
    }

    limparFormulario() {
        const form = document.getElementById('transacaoForm');
        if (form) {
            form.reset();
            this.carregarDataAtual();
            const descricaoInput = document.getElementById('descricao');
            if (descricaoInput) descricaoInput.focus();
        }
    }

    mostrarNotificacao(mensagem, tipo) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${tipo === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = mensagem;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    mostrarMensagemSemDados() {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = '16px Arial';
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('Adicione transações para ver os gráficos', canvas.width/2, canvas.height/2);
            }
        });
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    formatarData(dataString) {
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR');
        } catch (e) {
            return dataString;
        }
    }

    formatarCategoria(categoria) {
        const categorias = {
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'moradia': 'Moradia',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'salario': 'Salário',
            'outros': 'Outros'
        };
        return categorias[categoria] || categoria;
    }

    criarGraficos() {
        // Destruir gráficos antigos se existirem
        if (this.graficoPizza) {
            this.graficoPizza.destroy();
            this.graficoPizza = null;
        }
        if (this.graficoBarras) {
            this.graficoBarras.destroy();
            this.graficoBarras = null;
        }
        if (this.graficoLinha) {
            this.graficoLinha.destroy();
            this.graficoLinha = null;
        }

        // Criar novos gráficos
        this.criarGraficoPizza();
        this.criarGraficoBarras();
        this.criarGraficoLinha();
    }

    criarGraficoPizza() {
        const canvas = document.getElementById('graficoPizza');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Limpar canvas antes de criar novo gráfico
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const gastosPorCategoria = {};
        this.transacoes
            .filter(t => t.tipo === 'despesa')
            .forEach(t => {
                gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + t.valor;
            });

        const categorias = Object.keys(gastosPorCategoria);
        const valores = Object.values(gastosPorCategoria);

        if (categorias.length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('Sem despesas para exibir', canvas.width/2, canvas.height/2);
            return;
        }

        try {
            this.graficoPizza = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: categorias.map(cat => this.formatarCategoria(cat)),
                    datasets: [{
                        data: valores,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#8AC926', '#1982C4'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const valor = context.raw;
                                    const total = valores.reduce((a, b) => a + b, 0);
                                    const percentual = ((valor / total) * 100).toFixed(1);
                                    return `${context.label}: ${this.formatarMoeda(valor)} (${percentual}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de pizza:', error);
        }
    }

    criarGraficoBarras() {
        const canvas = document.getElementById('graficoBarras');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const meses = [];
        const receitasPorMes = [];
        const despesasPorMes = [];

        for (let i = 5; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);
            meses.push(this.getNomeMes(data.getMonth()));

            const mesInicio = new Date(data.getFullYear(), data.getMonth(), 1);
            const mesFim = new Date(data.getFullYear(), data.getMonth() + 1, 0);

            const receitas = this.transacoes
                .filter(t => t.tipo === 'receita' && 
                       new Date(t.data) >= mesInicio && 
                       new Date(t.data) <= mesFim)
                .reduce((sum, t) => sum + t.valor, 0);
                
            const despesas = this.transacoes
                .filter(t => t.tipo === 'despesa' && 
                       new Date(t.data) >= mesInicio && 
                       new Date(t.data) <= mesFim)
                .reduce((sum, t) => sum + t.valor, 0);

            receitasPorMes.push(receitas);
            despesasPorMes.push(despesas);
        }

        try {
            this.graficoBarras = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [
                        {
                            label: 'Receitas',
                            data: receitasPorMes,
                            backgroundColor: '#2ecc71',
                            borderColor: '#27ae60',
                            borderWidth: 1
                        },
                        {
                            label: 'Despesas',
                            data: despesasPorMes,
                            backgroundColor: '#e74c3c',
                            borderColor: '#c0392b',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    return `${context.dataset.label}: ${this.formatarMoeda(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de barras:', error);
        }
    }

    criarGraficoLinha() {
        const canvas = document.getElementById('graficoLinha');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const dados = [];
        const hoje = new Date();

        for (let i = 29; i >= 0; i--) {
            const data = new Date();
            data.setDate(hoje.getDate() - i);
            const dataStr = data.toISOString().split('T')[0];

            const transacoesAteData = this.transacoes.filter(t => {
                try {
                    const transacaoData = new Date(t.data);
                    return transacaoData <= data;
                } catch (e) {
                    return false;
                }
            });

            const saldo = transacoesAteData.reduce((total, t) => {
                return t.tipo === 'receita' ? total + t.valor : total - t.valor;
            }, 0);

            dados.push({
                x: dataStr,
                y: saldo
            });
        }

        if (dados.length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados para exibir', canvas.width/2, canvas.height/2);
            return;
        }

        try {
            this.graficoLinha = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Saldo Acumulado',
                        data: dados,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'dd/MM'
                                }
                            }
                        },
                        y: {
                            ticks: {
                                callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    return `Saldo: ${this.formatarMoeda(context.raw.y)}`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de linha:', error);
        }
    }

    getNomeMes(numeroMes) {
        const meses = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        return meses[numeroMes];
    }

    atualizarGraficos() {
        if (this.transacoes.length > 0) {
            this.criarGraficos();
        } else {
            this.mostrarMensagemSemDados();
        }
    }
}

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .categoria-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8em;
        background: #ecf0f1;
        color: #2c3e50;
    }
    
    .alimentacao { background: #ffeaa7 !important; }
    .transporte { background: #81ecec !important; }
    .moradia { background: #fab1a0 !important; }
    .lazer { background: #a29bfe !important; color: white !important; }
    .saude { background: #55efc4 !important; }
    .educacao { background: #74b9ff !important; color: white !important; }
    .salario { background: #00b894 !important; color: white !important; }
    .outros { background: #dfe6e9 !important; }
`;
document.head.appendChild(style);

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ControleFinanceiro();
});