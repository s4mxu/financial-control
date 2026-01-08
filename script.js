class ControleFinanceiro {
    constructor() {
        this.transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
        this.init();
    }

    init() {
        this.carregarDataAtual();
        this.atualizarTotais();
        this.renderizarTabela();
        this.configurarEventos();
    }

    carregarDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data').value = hoje;
    }

    configurarEventos() {
        // Formulário
        document.getElementById('transacaoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarTransacao();
        });

        // Filtros
        document.querySelectorAll('.filtro-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderizarTabela(e.target.dataset.filtro);
            });
        });

        // Aplicar filtro inicial
        this.renderizarTabela('todos');
    }

    adicionarTransacao() {
        const descricao = document.getElementById('descricao').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const cartegoria = document.getElementById('cartegoria').value;
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        const data = document.getElementById('data').value;

        const transacao = {
            id: Date.now(),
            descricao,
            valor,
            cartegoria,
            tipo,
            data,
            dataRegistro: new Date().toISOString()
        };

        this.transacoes.unshift(transacao);
        this.salvarNoLocalStorage();
        this.atualizarTotais();
        this.renderizarTabela();
        this.limparFormulario();

        // Feedback visual
        this.mostrarNotificacao('Transação adicionada com sucesso!', 'success');
    }

    removerTransacao(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.transacoes = this.transacoes.filter(t => t.id !== id);
            this.salvarNoLocalStorage();
            this.atualizarTotais();
            this.renderizarTabela();
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

        // Atualizar UI
        document.getElementById('totalReceitas').textContent =
            this.formatarMoeda(totalReceitas);
        document.getElementById('totalDespesas').textContent =
            this.formatarMoeda(totalDespesas);
        document.getElementById('saldoTotal').textContent =
            this.formatarMoeda(saldoTotal);

        //Cor do saldo (verde para positivo, vermelho para negativo)
        const saldoElement = document.getElementById('saldoTotal');
        saldoElement.style.color = saldoTotal >= 0 ? '#27ae60' : '#e74c3c'
    }

    renderizarTabela(filtro = 'todos') {
        const corpoTabela = document.getElementById('corpoTabela');
        const emptyState = document.getElementById('emptyState');

        // Filtrar transações
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

        // Ordenar por data (mais recente primeiro)
        transacoesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));

        const html = transacoesFiltradas.map(transacao => `
            <tr>
                <td>${this.formatarData(transacao.data)}</td>
                <td>${transacao.descricao}</td>
                <td>
                    <span class="cartegoria-badge ${transacao.cartegoria}">
                        ${this.formatarCartegoria(transacao.cartegoria)}
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
        document.getElementById('transacaoForm').reset();
        this.carregarDataAtual();
        document.getElementById('descricao').focus();
    }

    mostrarNotificacao(mensagem, tipo) {
        // Cria uma notificação simples
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
            notification.remove();
        }, 3000);
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    }

    formatarCartegoria(cartegoria) {
        const cartegorias = {
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'moradia': 'Moradia',
            'lazer': 'Lazer',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'salario': 'Salário',
            'outros': 'Outros'
        };
        return cartegorias[cartegoria] || cartegoria;
    }
}

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1} 
    }

    .cartegoria-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
        background: #ecf0f1;
        color: #2c3e50
    }

    .alimentacao { background: #ffeaa7 !important; }
    .transporte { background: #81ecec !important; }
    .moradia { background: #fab1a0 !important; }
    .lazer { background: #a29bfe !important; }
    .saude { baackground: #55efc4 !important; }
    .educacao { background: #74b9ff !important; color: white !important; }
    .salario { background: #00b894 !important; color: white !important; }
`;
document.head.appendChild(style);

// Inicializar aplicação
const app = new ControleFinanceiro();