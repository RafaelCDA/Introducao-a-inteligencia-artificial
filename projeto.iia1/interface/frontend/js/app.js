// ===== CONFIGURAÇÕES GLOBAIS =====
const API_BASE_URL = 'http://localhost:5000';
let currentUser = null;
let allBooks = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Carregado - Iniciando App...');
    initializeApp();
});

function initializeApp() {
    console.log('🔧 Inicializando aplicação...');
    
    // Configurar event listeners primeiro
    setupEventListeners();
    
    // Verificar API
    checkAPIStatus();
    
    // Carregar dados iniciais
    loadInitialData();
}

function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Formulário de usuário
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('📝 Formulário submetido!');
            handleUserProfileSubmit(event);
        });
    }
    
    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log('📁 Clicou na tab:', tabName);
            switchTab(tabName);
        });
    });
    
    // Filtros do catálogo
    const filterGenero = document.getElementById('filterGenero');
    const filterTipo = document.getElementById('filterTipo');
    const filterNivel = document.getElementById('filterNivel');
    
    if (filterGenero) filterGenero.addEventListener('change', filterCatalog);
    if (filterTipo) filterTipo.addEventListener('change', filterCatalog);
    if (filterNivel) filterNivel.addEventListener('change', filterCatalog);
    
    console.log('✅ Event listeners configurados!');
}

// ===== FUNÇÃO SWITCHTAB =====
function switchTab(tabName) {
    console.log('📁 Mudando para tab:', tabName);
    
    // Remover active de todas as tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Adicionar active à tab selecionada
    const activeTabButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeTabContent = document.getElementById(`${tabName}-tab`);

    if (activeTabButton && activeTabContent) {
        activeTabButton.classList.add('active');
        activeTabContent.classList.add('active');
        console.log('✅ Tab ativada:', tabName);
        
        // Carregar dados da tab
        if (tabName === 'catalogo') {
            loadCatalog();
        } else if (tabName === 'estatisticas') {
            loadStatistics();
        }
    }
}

// ===== CARREGAMENTO DE DADOS =====
async function loadInitialData() {
    try {
        console.log('📦 Carregando dados iniciais...');
        await loadBooks();
        populateFilterOptions();
        await loadStatistics(); // Carrega estatísticas automaticamente
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showError('Erro ao carregar dados do servidor');
    }
}

async function loadBooks() {
    try {
        console.log('📚 Buscando livros da API...');
        const response = await fetch(`${API_BASE_URL}/api/livros`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.livros) {
            allBooks = result.livros;
            console.log('✅ Livros carregados via API:', allBooks.length);
            return allBooks;
        } else {
            throw new Error('Formato de resposta inválido');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar livros:', error);
        // Fallback para dados locais
        console.log('🔄 Usando dados locais como fallback...');
        allBooks = getMockBooks();
        return allBooks;
    }
}

async function loadCatalog() {
    try {
        console.log('📖 Carregando catálogo...');
        
        // Se não tem livros carregados, busca da API
        if (allBooks.length === 0) {
            console.log('🔄 Buscando livros da API...');
            await loadBooks();
        }
        
        console.log('📚 Exibindo', allBooks.length, 'livros no catálogo');
        displayCatalog(allBooks);
        
    } catch (error) {
        console.error('❌ Erro ao carregar catálogo:', error);
        showError('Erro ao carregar catálogo: ' + error.message);
    }
}

async function loadStatistics() {
    try {
        console.log('📊 Carregando estatísticas...');
        const response = await fetch(`${API_BASE_URL}/api/estatisticas`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('📊 Estatísticas recebidas:', result.estatisticas);
            displayStatistics(result.estatisticas);
            
            // Atualizar gráficos se existirem
            if (window.updateCharts) {
                window.updateCharts(result.estatisticas);
            }
        } else {
            throw new Error(result.error || 'Erro na resposta da API');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
        // Fallback para estatísticas locais
        console.log('🔄 Usando estatísticas locais como fallback...');
        const fallbackStats = generateLocalStatistics();
        displayStatistics(fallbackStats);
    }
}

// ===== GERAR ESTATÍSTICAS LOCAIS =====
function generateLocalStatistics() {
    if (allBooks.length === 0) {
        return {
            total_livros: 0,
            total_generos: 0,
            total_usuarios: 0,
            total_avaliacoes: 0,
            generos: {},
            tipos: {},
            niveis: {}
        };
    }
    
    const generos = {};
    const tipos = {};
    const niveis = {};
    
    allBooks.forEach(book => {
        generos[book.genero] = (generos[book.genero] || 0) + 1;
        tipos[book.tipo] = (tipos[book.tipo] || 0) + 1;
        niveis[book.nivel] = (niveis[book.nivel] || 0) + 1;
    });
    
    return {
        total_livros: allBooks.length,
        total_generos: Object.keys(generos).length,
        total_usuarios: 3,
        total_avaliacoes: allBooks.length * 310,
        generos: generos,
        tipos: tipos,
        niveis: niveis
    };
}

// ===== EXIBIÇÃO DE DADOS COM CARROSSEL =====
function displayCatalog(books) {
    const container = document.getElementById('catalogContainer');
    
    if (!container) {
        console.error('❌ Container do catálogo não encontrado!');
        return;
    }

    // Reset completo do container
    container.innerHTML = '';
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.margin = '0';
    container.style.padding = '0';

    if (!books || books.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #6b7280; width: 100%;">
                <i class="fas fa-book" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Nenhum livro encontrado</h3>
                <p>Tente ajustar os filtros para encontrar mais livros.</p>
            </div>
        `;
        return;
    }

    console.log('🎨 Renderizando carrossel com', books.length, 'livros');

    const carrosselHTML = `
        <div class="carrossel-wrapper">
            <div class="carrossel-container">
                <button class="carrossel-nav prev" onclick="scrollCarrossel(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div class="carrossel" id="carrossel">
                    ${books.map(book => `
                        <div class="carrossel-item" onclick="showBookDetails(${book.id})">
                            <div class="carrossel-header">
                                <div style="flex: 1;">
                                    <div class="carrossel-title">${book.titulo}</div>
                                    <div class="carrossel-author">${book.autor || 'Autor não informado'}</div>
                                </div>
                                <div class="carrossel-id">#${book.id}</div>
                            </div>
                            
                            <div class="carrossel-meta">
                                <span class="carrossel-tag carrossel-genero">${book.genero}</span>
                                <span class="carrossel-tag carrossel-tipo">${book.tipo === 'ficcao' ? 'Ficção' : 'Não-Ficção'}</span>
                                <span class="carrossel-tag carrossel-nivel">${book.nivel}</span>
                            </div>
                            
                            <div class="carrossel-description">
                                ${book.descricao || 'Descrição não disponível.'}
                            </div>
                            
                            <div class="carrossel-footer">
                                <span class="carrossel-author">${book.autor || 'Autor não informado'}</span>
                                <span class="carrossel-year">${book.ano_publicacao || 'N/A'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button class="carrossel-nav next" onclick="scrollCarrossel(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="carrossel-stats">
                <p><strong>${books.length}</strong> livros encontrados • Use as setas para navegar</p>
            </div>
        </div>
    `;

    container.innerHTML = carrosselHTML;
    
    // Inicializar carrossel após renderizar
    setTimeout(() => {
        initializeCarrossel();
    }, 100);
}

// ===== FUNÇÕES DO CARROSSEL =====
function initializeCarrossel() {
    const carrossel = document.getElementById('carrossel');
    if (!carrossel) return;

    console.log('🔄 Inicializando carrossel...');

    // Configurar scroll suave com mouse
    carrossel.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            carrossel.scrollLeft += e.deltaY;
        }
    });

    // Atualizar botões quando scrollar
    carrossel.addEventListener('scroll', updateCarrosselNavButtons);
    
    // Atualizar estado inicial dos botões
    updateCarrosselNavButtons();
    
    console.log('✅ Carrossel inicializado');
}

function scrollCarrossel(direction) {
    const carrossel = document.getElementById('carrossel');
    if (!carrossel) return;

    console.log('📜 Scroll carrossel:', direction);
    
    const scrollAmount = 320; // Largura do item + gap
    carrossel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });

    // Atualizar botões após um pequeno delay
    setTimeout(updateCarrosselNavButtons, 300);
}

function updateCarrosselNavButtons() {
    const carrossel = document.getElementById('carrossel');
    if (!carrossel) return;

    const prevBtn = document.querySelector('.carrossel-nav.prev');
    const nextBtn = document.querySelector('.carrossel-nav.next');

    if (prevBtn) {
        const atStart = carrossel.scrollLeft <= 10;
        prevBtn.disabled = atStart;
        prevBtn.style.opacity = atStart ? '0.3' : '1';
        prevBtn.style.cursor = atStart ? 'not-allowed' : 'pointer';
    }

    if (nextBtn) {
        const maxScroll = carrossel.scrollWidth - carrossel.clientWidth;
        const atEnd = carrossel.scrollLeft >= maxScroll - 10;
        nextBtn.disabled = atEnd;
        nextBtn.style.opacity = atEnd ? '0.3' : '1';
        nextBtn.style.cursor = atEnd ? 'not-allowed' : 'pointer';
    }
}

// ===== FORMULÁRIO =====
async function handleUserProfileSubmit(event) {
    const formData = new FormData(event.target);
    const userData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        idade: parseInt(formData.get('idade')),
        genero: formData.get('genero'),
        tipo: formData.get('tipo'),
        nivel: formData.get('nivel')
    };

    console.log('👤 Dados do usuário:', userData);

    // Validação
    if (!userData.nome || !userData.genero || !userData.tipo || !userData.nivel) {
        showError('Por favor, preencha todos os campos obrigatórios');
        return;
    }

    try {
        showLoadingState();
        
        // Gerar recomendações
        const recommendations = await generateRecommendations(userData);
        
        // Mostrar resultados
        displayUserProfile(userData);
        displayRecommendations(recommendations);
        
        // Mudar para tab de recomendações
        switchTab('recomendacoes');
        
        console.log('✅ Recomendações geradas!');
        
    } catch (error) {
        console.error('❌ Erro nas recomendações:', error);
        showError('Erro ao gerar recomendações: ' + error.message);
    } finally {
        hideLoadingState();
    }
}

async function generateRecommendations(userData) {
    const response = await fetch(`${API_BASE_URL}/api/recomendacoes/perfil`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            genero: userData.genero,
            tipo: userData.tipo,
            nivel: userData.nivel,
            top_n: 6
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar recomendações');
    }

    const result = await response.json();
    
    if (result.success) {
        return result.recomendacoes;
    } else {
        throw new Error(result.error || 'Erro na resposta da API');
    }
}

function displayUserProfile(userData) {
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userGenero = document.getElementById('userGenero');
    const userTipo = document.getElementById('userTipo');
    const userNivel = document.getElementById('userNivel');
    
    if (userProfile && userName) {
        userName.textContent = userData.nome;
        if (userGenero) userGenero.textContent = userData.genero;
        if (userTipo) userTipo.textContent = userData.tipo === 'ficcao' ? 'Ficção' : 'Não-Ficção';
        if (userNivel) userNivel.textContent = userData.nivel;
        userProfile.style.display = 'block';
    }
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContainer');
    
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h2>Nenhuma recomendação encontrada</h2>
                <p>Tente ajustar suas preferências para obter melhores resultados.</p>
            </div>
        `;
        return;
    }

    const recommendationsHTML = `
        <div class="recommendations-grid">
            ${recommendations.map(book => `
                <div class="book-card">
                    <div class="book-header">
                        <div>
                            <div class="book-title">${book.titulo}</div>
                            <div class="book-author">${book.autor || 'Autor não informado'}</div>
                        </div>
                        <div class="book-score">${Math.round(book.score_similaridade * 100)}%</div>
                    </div>
                    
                    <div class="book-meta">
                        <span class="book-tag book-genero">${book.genero}</span>
                        <span class="book-tag book-tipo">${book.tipo === 'ficcao' ? 'Ficção' : 'Não-Ficção'}</span>
                        <span class="book-tag book-nivel">${book.nivel}</span>
                    </div>
                    
                    <div class="book-description">
                        ${book.descricao || 'Descrição não disponível.'}
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${book.score_similaridade * 100}%"></div>
                    </div>
                    
                    <div class="book-footer">
                        <span class="book-author">${book.autor || 'Autor não informado'}</span>
                        <span class="book-year">${book.ano_publicacao || 'N/A'}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = recommendationsHTML;
}

// ===== FUNÇÃO displayStatistics ATUALIZADA =====
function displayStatistics(stats) {
    console.log('📈 Exibindo estatísticas:', stats);
    
    // Formatar números
    const formatNumber = (num) => {
        if (typeof num === 'number') {
            return num.toLocaleString('pt-BR');
        }
        return num || '0';
    };
    
    // Atualizar cards de estatísticas principais
    const totalLivros = document.getElementById('totalLivros');
    if (totalLivros) {
        totalLivros.textContent = formatNumber(stats.total_livros);
    }
    
    const totalUsuarios = document.getElementById('totalUsuarios');
    if (totalUsuarios) {
        totalUsuarios.textContent = formatNumber(stats.total_usuarios);
    }
    
    const totalAvaliacoes = document.getElementById('totalAvaliacoes');
    if (totalAvaliacoes) {
        totalAvaliacoes.textContent = formatNumber(stats.total_avaliacoes);
    }
    
    // Atualizar Hero section também
    const heroUsuarios = document.getElementById('heroUsuarios');
    const heroLivros = document.getElementById('heroLivros');
    const heroAvaliacoes = document.getElementById('heroAvaliacoes');
    
    if (heroUsuarios) heroUsuarios.textContent = formatNumber(stats.total_usuarios);
    if (heroLivros) heroLivros.textContent = formatNumber(stats.total_livros);
    if (heroAvaliacoes) heroAvaliacoes.textContent = formatNumber(stats.total_avaliacoes);
    
    console.log('✅ Estatísticas atualizadas no frontend');
    
    // Atualizar gráficos se existirem
    if (window.updateCharts) {
        window.updateCharts(stats);
    }
}

// ===== FILTROS =====
function populateFilterOptions() {
    const generoSelect = document.getElementById('filterGenero');
    const tipoSelect = document.getElementById('filterTipo');
    const nivelSelect = document.getElementById('filterNivel');
    
    if (generoSelect && allBooks.length > 0) {
        const generos = [...new Set(allBooks.map(book => book.genero))].sort();
        generos.forEach(genero => {
            const option = document.createElement('option');
            option.value = genero;
            option.textContent = genero;
            generoSelect.appendChild(option);
        });
    }
    
    // Preencher opções de tipo e nível
    if (tipoSelect) {
        const tipos = ['ficcao', 'nao_ficcao'];
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo === 'ficcao' ? 'Ficção' : 'Não-Ficção';
            tipoSelect.appendChild(option);
        });
    }
    
    if (nivelSelect) {
        const niveis = ['iniciante', 'intermediario', 'avancado'];
        niveis.forEach(nivel => {
            const option = document.createElement('option');
            option.value = nivel;
            option.textContent = nivel;
            nivelSelect.appendChild(option);
        });
    }
}

function filterCatalog() {
    const generoFilter = document.getElementById('filterGenero').value;
    const tipoFilter = document.getElementById('filterTipo').value;
    const nivelFilter = document.getElementById('filterNivel').value;

    const filteredBooks = allBooks.filter(book => {
        const matchGenero = !generoFilter || book.genero === generoFilter;
        const matchTipo = !tipoFilter || book.tipo === tipoFilter;
        const matchNivel = !nivelFilter || book.nivel === nivelFilter;
        
        return matchGenero && matchTipo && matchNivel;
    });

    displayCatalog(filteredBooks);
}

// ===== UTILITIES =====
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/`);
        if (response.ok) {
            console.log('✅ API Online!');
            updateSystemStatus('online');
            return true;
        } else {
            throw new Error('API não respondeu corretamente');
        }
    } catch (error) {
        console.error('❌ API Offline:', error);
        updateSystemStatus('offline');
        showError('Servidor offline. Verifique se o backend está rodando.');
        return false;
    }
}

function updateSystemStatus(status) {
    const statusItems = document.querySelectorAll('.status-dot');
    statusItems.forEach(item => {
        item.className = 'status-dot ' + status;
    });
}

function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'block';
}

function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'none';
}

function showError(message) {
    // Você pode implementar um sistema de notificação mais sofisticado aqui
    alert('Erro: ' + message);
    console.error('❌ Erro:', message);
}

// ===== DADOS MOCK PARA FALLBACK =====
function getMockBooks() {
    return [
        {
            "id": 1,
            "titulo": "Como Treinar seu Dragão",
            "genero": "aventura",
            "tipo": "ficcao",
            "nivel": "iniciante",
            "autor": "Cressida Cowell",
            "ano_publicacao": 2003,
            "descricao": "As aventuras de um jovem viking que faz amizade com um dragão e desafia as tradições de seu povo."
        },
        {
            "id": 2,
            "titulo": "Cujo",
            "genero": "horror",
            "tipo": "ficcao", 
            "nivel": "intermediario",
            "autor": "Stephen King",
            "ano_publicacao": 1981,
            "descricao": "Um romance de terror sobre um São Bernardo raivoso que aterroriza uma pequena cidade."
        }
    ];
}

// ===== FUNÇÕES GLOBAIS =====
window.switchTab = switchTab;
window.filterCatalog = filterCatalog;
window.scrollCarrossel = scrollCarrossel;
window.initializeCarrossel = initializeCarrossel;
window.updateCarrosselNavButtons = updateCarrosselNavButtons;

window.showBookDetails = function(bookId) {
    const book = allBooks.find(b => b.id == bookId);
    if (book) {
        alert(`📚 ${book.titulo}\n✍️ Autor: ${book.autor}\n🎭 Gênero: ${book.genero}\n📖 Tipo: ${book.tipo === 'ficcao' ? 'Ficção' : 'Não-Ficção'}\n📊 Nível: ${book.nivel}\n\n${book.descricao}`);
    }
};

// ===== NAVEGAÇÃO POR TECLADO =====
document.addEventListener('keydown', (e) => {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'catalogo-tab') {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollCarrossel(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollCarrossel(1);
        }
    }
});

// ===== RESIZE HANDLER =====
window.addEventListener('resize', function() {
    // Atualizar carrossel quando a janela for redimensionada
    if (document.querySelector('.tab-content.active')?.id === 'catalogo-tab') {
        updateCarrosselNavButtons();
    }
});

// ===== DEBUG DO SISTEMA =====
function debugSystem() {
    console.log('🔍 DEBUG DO SISTEMA:');
    console.log('1. Livros carregados no frontend:', allBooks.length);
    console.log('2. Primeiros 3 livros:', allBooks.slice(0, 3).map(l => ({ id: l.id, titulo: l.titulo })));
    
    // Testar API de estatísticas
    fetch(`${API_BASE_URL}/api/estatisticas`)
        .then(response => {
            console.log('3. Status da API:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('4. Resposta da API:', data);
            if (data.success) {
                console.log('5. Estatísticas da API:', data.estatisticas);
            } else {
                console.log('5. Erro da API:', data.error);
            }
        })
        .catch(error => {
            console.log('5. Erro ao chamar API:', error);
        });
}

// Executar debug após inicialização
setTimeout(debugSystem, 2000);

console.log('✅ JavaScript carregado e pronto!');