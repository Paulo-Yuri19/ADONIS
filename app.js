// ==========================================
// 1. AUTENTICAÇÃO E INICIALIZAÇÃO
// ==========================================

function handleAuth(event) {
    event.preventDefault(); 
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const role = document.getElementById('auth-role').value;

    if (!email || !password || !role) {
        showToast('Por favor, preencha todos os campos!');
        return;
    }

    showToast('Autenticando...');
    
    setTimeout(() => {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('login-screen').classList.remove('active');
        auth(role);
    }, 1000);
}

function simulateRegister() {
    const email = document.getElementById('auth-email').value;
    if (!email) {
        showToast('Preencha o e-mail no campo acima para iniciar o cadastro.');
        return;
    }
    showToast('Código de verificação enviado para: ' + email);
}

const state = { role: null, theme: 'light', chartInstance: null, activeChatId: 1 };

// BANCO DE DADOS SIMULADO INTEGRADO
const db = {
    alunos: [
        { id: 1, nome: "Carlos Almeida", obj: "Hipertrofia", peso: "82kg", status: "Ativo" },
        { id: 2, nome: "Mariana Costa", obj: "Emagrecimento", peso: "65kg", status: "Pendente" },
        { id: 3, nome: "João Silva", obj: "Condicionamento", peso: "90kg", status: "Ativo" }
    ],
    treinos: [
        { id: 'A', nome: "Treino A - Peito e Tríceps", nivel: "Intermediário", duracao: "45 min", alunoId: 1 },
        { id: 'B', nome: "Treino B - Costas e Bíceps", nivel: "Intermediário", duracao: "50 min", alunoId: 2 },
    ],
    dieta: [
        { ref: "Café da Manhã", itens: "4 ovos mexidos, 1 fatia de pão integral, café preto", cal: "350 kcal" },
        { ref: "Almoço", itens: "200g Frango, 150g Arroz, Salada à vontade", cal: "450 kcal" },
        { ref: "Jantar", itens: "150g Patinho, 100g Batata Doce", cal: "380 kcal" }
    ],
    mensagens: {
        1: [{ sender: "other", text: "Bom dia! Posso trocar o supino hoje?", time: "09:00" }, { sender: "me", text: "Bom dia! Sim, pode fazer com halteres.", time: "09:05" }],
        2: [{ sender: "other", text: "Professor, enviei minha foto atualizada.", time: "Ontem" }],
        3: [{ sender: "me", text: "Bem-vindo ao suporte Adonis.", time: "Semana passada" }],
        'personal': [{ sender: "other", text: "Olá Carlos! Aqui é o seu Personal. Como foi o treino?", time: "Hoje" }] // Chat visto pelo aluno
    },
    checkins: [
        { local: "Unidade Central", data: "Hoje às 07:00" }
    ],
    fotos: [
        { url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=150&auto=format&fit=crop", label: "Antes (Mês Passado)" },
        { url: "https://images.unsplash.com/photo-1581009137042-c552e485697a?q=80&w=150&auto=format&fit=crop", label: "Atual" }
    ],
    notificacoes: [
        { text: "Bem-vindo ao sistema Adonis." }
    ]
};

function auth(role) {
    state.role = role;
    document.getElementById('app-shell').classList.remove('hidden');
    document.getElementById('display-user-name').innerText = role === 'personal' ? 'Dr. Adonis (Personal)' : 'Carlos Almeida (Aluno)';
    
    // Define o chat padrão ativo com base na role
    state.activeChatId = role === 'personal' ? 1 : 'personal';

    renderMenu();
    toggleView('inicio');
    updateNotifBadge();
    showToast(`Bem-vindo(a)! Acesso liberado.`);
}

function logout() { window.location.reload(); }

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', state.theme);
    
    const icon = document.getElementById('theme-icon');
    const loginIcon = document.getElementById('login-theme-icon');
    
    if(icon) icon.className = state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    if(loginIcon) loginIcon.className = state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    if(state.chartInstance) initChart();
}

// ==========================================
// 2. NAVEGAÇÃO E SPA ROUTER
// ==========================================

function renderMenu() {
    const nav = document.getElementById('menu-nav');
    const menus = {
        personal: [
            { id: 'inicio', icon: 'fas fa-th-large', label: 'Dashboard' },
            { id: 'alunos', icon: 'fas fa-users', label: 'Meus Alunos' },
            { id: 'biblioteca', icon: 'fas fa-dumbbell', label: 'Biblioteca' },
            { id: 'relatorios', icon: 'fas fa-chart-line', label: 'Relatórios' },
            { id: 'mensagens', icon: 'fas fa-comment-dots', label: 'Mensagens' }
        ],
        aluno: [
            { id: 'inicio', icon: 'fas fa-home', label: 'Visão Geral' },
            { id: 'meutreino', icon: 'fas fa-running', label: 'Meu Treino' },
            { id: 'dieta', icon: 'fas fa-utensils', label: 'Minha Dieta' },
            { id: 'progresso', icon: 'fas fa-chart-bar', label: 'Progresso' },
            { id: 'mensagens', icon: 'fas fa-comment-dots', label: 'Falar com Personal' }
        ]
    };

    nav.innerHTML = menus[state.role].map(item => `
        <a href="#" class="nav-item" onclick="toggleView('${item.id}')" id="nav-${item.id}">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        </a>
    `).join('');
}

function toggleView(view) {
    const content = document.getElementById('content-area');
    const title = document.getElementById('view-title');
    state.activeView = view;
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`nav-${view}`)?.classList.add('active');
    
    const routers = {
        'inicio': () => { title.innerText = 'Dashboard'; renderDashboard(content); },
        'alunos': () => { title.innerText = 'Gestão de Alunos'; renderAlunos(content); },
        'biblioteca': () => { title.innerText = 'Biblioteca de Treinos'; renderBiblioteca(content); },
        'relatorios': () => { title.innerText = 'Relatórios de Performance'; renderRelatorios(content); },
        'meutreino': () => { title.innerText = 'Treino do Dia'; renderMeuTreino(content); },
        'dieta': () => { title.innerText = 'Plano Alimentar'; renderDieta(content); },
        'progresso': () => { title.innerText = 'Meu Progresso e Fotos'; renderEvolucaoComFotos(content); },
        'mensagens': () => { title.innerText = 'Central de Mensagens'; renderMensagens(content); },
    };

    if(routers[view]) routers[view]();
}

// ==========================================
// 3. RENDERIZADORES E LÓGICA DE DADOS
// ==========================================

function renderDashboard(container) {
    if (state.role === 'personal') {
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="card stat-card"><h3>Alunos Ativos</h3><span class="value">${db.alunos.length}</span></div>
                <div class="card stat-card"><h3>Treinos Criados</h3><span class="value">${db.treinos.length}</span></div>
                <div class="card stat-card"><h3>Receita Estimada</h3><span class="value">R$ 4.200</span></div>
            </div>
            <div class="card" style="margin-top: 20px; height: 350px;">
                <canvas id="mainChart"></canvas>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="card stat-card"><h3>Treino Hoje</h3><span class="value">Treino A</span></div>
                <div class="card stat-card"><h3>Adesão à Dieta</h3><span class="value">95%</span></div>
                <div class="card stat-card"><h3>Check-ins</h3><span class="value">${db.checkins.length}</span></div>
            </div>
            <div class="card" style="margin-top: 20px;">
                <div style="display:flex; justify-content: space-between; align-items:center;">
                    <div>
                        <h2>Pronto para treinar?</h2>
                        <p style="color:var(--text-muted)">Registre sua presença na academia.</p>
                    </div>
                    <button class="btn-primary" onclick="abrirModalCheckin()">Fazer Check-in</button>
                </div>
                <div style="margin-top:20px; border-top: 1px solid var(--border); padding-top:15px;">
                    <h4 style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">Últimos Check-ins</h4>
                    ${db.checkins.map(c => `
                        <div class="list-item" style="padding: 10px; font-size: 0.85rem;">
                            <span><i class="fas fa-check-circle text-success"></i> ${c.local}</span>
                            <span style="color:var(--text-muted)">${c.data}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    setTimeout(initChart, 100);
}

// ADICIONAR ALUNO (MECÂNICA REAL NA TELA)
function renderAlunos(container) {
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; margin-bottom: 20px;">
                <h3>Todos os Alunos</h3>
                <button class="btn-primary" onclick="abrirModalNovoAluno()">+ Adicionar Aluno</button>
            </div>
            <div>
                ${db.alunos.map(a => `
                    <div class="list-item">
                        <div>
                            <strong>${a.nome}</strong>
                            <p style="font-size:0.8rem; color:var(--text-muted)">Obj: ${a.obj} | Peso: ${a.peso}</p>
                        </div>
                        <button class="btn-outline" style="border-color:var(--border); color:var(--text-main)" onclick="abrirChatAluno(${a.id})">Abrir Chat</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function salvarNovoAluno(event) {
    event.preventDefault();
    const nome = document.getElementById('cad-nome').value;
    const obj = document.getElementById('cad-obj').value;
    const id = db.alunos.length + 1;
    
    db.alunos.push({ id, nome, obj, peso: "N/A", status: "Ativo" });
    db.mensagens[id] = [{ sender: "me", text: `Olá ${nome}, bem-vindo ao Adonis!`, time: "Agora" }];
    addNotification(`Novo aluno ${nome} matriculado.`);
    
    closeModal();
    if(state.activeView === 'alunos') renderAlunos(document.getElementById('content-area'));
    showToast('Aluno salvo e chat criado com sucesso!');
}

// ATRIBUIR TREINO (MECÂNICA REAL NA TELA)
function renderBiblioteca(container) {
    container.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom: 20px;">
            <button class="btn-primary" onclick="abrirModalNovoTreino()">+ Prescrever Treino</button>
        </div>
        <div class="dashboard-grid">
            ${db.treinos.map(t => {
                let alunoResp = db.alunos.find(a => a.id == t.alunoId);
                return `
                <div class="card">
                    <h4>${t.nome}</h4>
                    <p style="color:var(--primary); font-size:0.8rem; font-weight:bold; margin-top:5px;">Atribuído a: ${alunoResp ? alunoResp.nome : 'Todos'}</p>
                    <p style="color:var(--text-muted); margin: 10px 0; font-size:0.9rem;">${t.nivel} • ${t.duracao}</p>
                    <button class="btn-outline" style="width:100%; padding: 10px; border-color:var(--border); color:var(--text-main);" onclick="showToast('Abrindo detalhes do treino...')">Ver Detalhes</button>
                </div>
            `}).join('')}
        </div>
    `;
}

function salvarTreino(event) {
    event.preventDefault();
    const nomeTreino = document.getElementById('cad-treino-nome').value;
    const alunoId = document.getElementById('cad-treino-aluno').value;
    
    db.treinos.push({ id: Date.now(), nome: nomeTreino, nivel: "Personalizado", duracao: "Ajustável", alunoId: parseInt(alunoId) });
    addNotification(`Novo treino prescrito: ${nomeTreino}`);
    
    closeModal();
    if(state.activeView === 'biblioteca') renderBiblioteca(document.getElementById('content-area'));
    showToast('Treino atribuído ao aluno com sucesso!');
}

// CHECK-IN DO ALUNO
function salvarCheckin(event) {
    event.preventDefault();
    const local = document.getElementById('cad-checkin-loc').value;
    
    db.checkins.unshift({ local, data: "Agora mesmo" });
    addNotification(`Check-in realizado em: ${local}`);
    
    closeModal();
    if(state.activeView === 'inicio') renderDashboard(document.getElementById('content-area'));
    showToast('Check-in realizado com sucesso!');
}

// MÓDULOS ALUNO BÁSICOS
function renderMeuTreino(container) {
    const execs = ['Supino Reto - 4x12', 'Crucifixo Inclinado - 3x15', 'Tríceps Testa - 4x10'];
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 15px;">
                <h2>Treino A (Peitoral e Tríceps)</h2>
                <button class="btn-primary" onclick="showToast('Cronômetro iniciado!')">Iniciar Treino</button>
            </div>
            ${execs.map(e => `
                <div class="list-item exercise-item" style="cursor:pointer;" onclick="toggleExercise(this)">
                    <span style="font-size:1.1rem;">
                        <i class="far fa-circle text-muted-icon" style="margin-right:10px; width:20px; text-align:center;"></i> 
                        ${e}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDieta(container) {
    container.innerHTML = `
        <div class="dashboard-grid">
            ${db.dieta.map(d => `
                <div class="card">
                    <h3 style="color:var(--primary); margin-bottom:10px;">${d.ref} <span style="float:right; font-size:0.8rem; color:var(--text-muted)">${d.cal}</span></h3>
                    <p style="line-height:1.6;">${d.itens}</p>
                    <button class="btn-outline meal-btn" style="width:100%; margin-top:15px; color:var(--text-main); border-color:var(--border);" onclick="markMealDone(this)">
                        <i class="fas fa-check" style="display:none; margin-right:5px;"></i> Marcar como feito
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// GALERIA COM UPLOAD DE FOTOS REAIS
function renderEvolucaoComFotos(container) {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Galeria de Evolução</h3>
            <input type="file" id="galeria-upload" accept="image/*" style="display:none" onchange="handleGalleryUpload(event)">
            <button class="btn-primary" onclick="document.getElementById('galeria-upload').click()"><i class="fas fa-camera"></i> Anexar Foto Real</button>
        </div>

        <div class="photo-grid" style="margin-bottom:30px;">
            ${db.fotos.map(f => `
                <div class="photo-card">
                    <div class="photo-box">
                        <img src="${f.url}" alt="${f.label}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; background: var(--input-bg);">
                        <span class="photo-label" style="margin-top:10px; display:block;">${f.label}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="card" style="height: 350px;">
            <h3 style="margin-bottom: 15px;">Gráfico de Peso (kg)</h3>
            <canvas id="mainChart"></canvas>
        </div>
    `;
    setTimeout(initChart, 100);
}

function handleGalleryUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        db.fotos.push({ url: e.target.result, label: "Nova Foto Anexada" });
        showToast("Foto salva na galeria!");
        if(state.activeView === 'progresso') renderEvolucaoComFotos(document.getElementById('content-area'));
    };
    reader.readAsDataURL(file);
}

// ==========================================
// CHAT COM ANEXOS REAIS (FOTO, DOCUMENTO, ÁUDIO)
// ==========================================
function abrirChatAluno(id) {
    state.activeChatId = id;
    toggleView('mensagens');
}

function renderMensagens(container) {
    const contatos = state.role === 'personal' 
        ? db.alunos 
        : [{id: 'personal', nome: "Prof. Adonis (Personal)"}];
    
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div style="padding:20px; font-weight:bold; border-bottom:1px solid var(--border)">Conversas</div>
                ${contatos.map((c) => `
                    <div class="chat-contact ${c.id === state.activeChatId ? 'active' : ''}" onclick="state.activeChatId='${c.id}'; renderMensagens(document.getElementById('content-area'));">
                        <div class="avatar">${c.nome.charAt(0)}</div>
                        <span>${c.nome}</span>
                    </div>
                `).join('')}
            </div>
            <div class="chat-main">
                <div class="chat-history" id="chat-history">
                    ${(db.mensagens[state.activeChatId] || []).map(m => `
                        <div class="msg ${m.sender === 'me' ? 'sent' : 'received'}">
                            ${m.text ? `<div>${m.text}</div>` : ''}
                            ${m.img ? `<img src="${m.img}" class="chat-media-attachment">` : ''}
                            ${m.doc ? `<div class="chat-file-attachment"><i class="fas fa-file-alt" style="color:var(--primary)"></i> <a href="${m.docUrl}" download="${m.doc}" style="color:inherit; text-decoration:underline;">${m.doc}</a></div>` : ''}
                            ${m.audio ? `<audio controls class="chat-audio-attachment"><source src="${m.audio}"></audio>` : ''}
                            <span style="font-size:0.65rem; opacity:0.7; display:block; text-align:right; margin-top:5px;">${m.time}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="position: relative; padding: 20px; background: var(--bg-surface); border-top: 1px solid var(--border);">
                    <div id="attachment-menu" class="chat-attachment-menu">
                        <input type="file" id="chat-upload-doc" accept=".pdf,.doc,.docx,.txt" style="display:none" onchange="handleChatFile(event, 'doc')">
                        <input type="file" id="chat-upload-img" accept="image/*" style="display:none" onchange="handleChatFile(event, 'img')">
                        <input type="file" id="chat-upload-audio" accept="audio/*" style="display:none" onchange="handleChatFile(event, 'audio')">
                        
                        <button class="attach-btn" onclick="document.getElementById('chat-upload-doc').click()"><i class="fas fa-file-alt"></i> Enviar Documento</button>
                        <button class="attach-btn" onclick="document.getElementById('chat-upload-img').click()"><i class="fas fa-image"></i> Enviar Foto</button>
                        <button class="attach-btn" onclick="document.getElementById('chat-upload-audio').click()"><i class="fas fa-microphone"></i> Anexar Áudio</button>
                    </div>
                    
                    <div class="chat-input-row" style="display:flex; gap:10px;">
                        <button class="btn-outline" style="border-color: var(--border); color: var(--text-main); border-radius:20px;" onclick="toggleAttachmentMenu()"><i class="fas fa-paperclip"></i></button>
                        <input type="text" id="chat-input" placeholder="Digite sua mensagem..." style="flex: 1; border-radius: 20px; padding: 10px 15px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-main); outline: none;" onkeypress="if(event.key==='Enter') enviarMensagem()">
                        <button class="btn-primary" style="border-radius:20px;" onclick="enviarMensagem()"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
    const hist = document.getElementById('chat-history');
    if(hist) hist.scrollTop = hist.scrollHeight;
}

function handleChatFile(event, type) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        if(!db.mensagens[state.activeChatId]) db.mensagens[state.activeChatId] = [];
        let msg = { sender: "me", text: "", time: "Agora" };
        
        if(type === 'img') { msg.text = "Foto enviada:"; msg.img = e.target.result; }
        if(type === 'doc') { msg.text = "Documento anexado:"; msg.doc = file.name; msg.docUrl = e.target.result; }
        if(type === 'audio') { msg.text = "Áudio enviado:"; msg.audio = e.target.result; }
        
        db.mensagens[state.activeChatId].push(msg);
        toggleAttachmentMenu(); 
        renderMensagens(document.getElementById('content-area'));
        addNotification("Você enviou um arquivo no chat.");
    };
    reader.readAsDataURL(file);
}

function enviarMensagem() {
    const input = document.getElementById('chat-input');
    const txt = input.value.trim();
    if(!txt) return;
    
    if(!db.mensagens[state.activeChatId]) db.mensagens[state.activeChatId] = [];
    db.mensagens[state.activeChatId].push({ sender: "me", text: txt, time: "Agora" });
    input.value = '';
    renderMensagens(document.getElementById('content-area'));
    
    // Auto-resposta para simulação
    setTimeout(() => {
        db.mensagens[state.activeChatId].push({ sender: "other", text: "Mensagem recebida e registrada.", time: "Agora" });
        if(state.activeView === 'mensagens') renderMensagens(document.getElementById('content-area'));
        addNotification("Nova resposta recebida no chat.");
    }, 1500);
}

// ==========================================
// NOTIFICAÇÕES (Sistema Universal para Aluno e Personal)
// ==========================================
function toggleNotifications() {
    document.getElementById('notif-dropdown').classList.toggle('hidden');
}

function addNotification(text) {
    db.notificacoes.unshift({ text });
    updateNotifBadge();
    renderNotifList();
}

function updateNotifBadge() {
    const badge = document.getElementById('notif-badge');
    if(!badge) return;
    badge.innerText = db.notificacoes.length;
    if(db.notificacoes.length > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
}

function renderNotifList() {
    const list = document.getElementById('notif-list');
    if(!list) return;
    if(db.notificacoes.length === 0) {
        list.innerHTML = `<div style="padding:15px; text-align:center; font-size:0.8rem; color:var(--text-muted)">Nenhuma notificação nova.</div>`;
        return;
    }
    list.innerHTML = db.notificacoes.map(n => `
        <div class="notif-item">
            <i class="fas fa-info-circle" style="color:var(--primary)"></i> <span>${n.text}</span>
        </div>
    `).join('');
}

function clearNotifications() {
    db.notificacoes = [];
    updateNotifBadge();
    renderNotifList();
    toggleNotifications();
}

// ==========================================
// FUNÇÕES DE INTERAÇÃO DOS MODAIS
// ==========================================
function abrirModalNovoAluno() {
    document.getElementById('modal-title').innerText = "Cadastrar Novo Aluno";
    document.getElementById('modal-body').innerHTML = `
        <form onsubmit="salvarNovoAluno(event)" style="display:flex; flex-direction:column; gap:15px; margin-top:10px;">
            <input type="text" id="cad-nome" placeholder="Nome Completo" required class="form-input" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--input-bg); color:var(--text-main);">
            <select id="cad-obj" required class="form-input" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--input-bg); color:var(--text-main);">
                <option value="Hipertrofia">Hipertrofia</option>
                <option value="Emagrecimento">Emagrecimento</option>
            </select>
            <button type="submit" class="btn-primary" style="padding:12px;">Salvar Cadastro</button>
        </form>
    `;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function abrirModalNovoTreino() {
    document.getElementById('modal-title').innerText = "Prescrever Novo Treino";
    document.getElementById('modal-body').innerHTML = `
        <form onsubmit="salvarTreino(event)" style="display:flex; flex-direction:column; gap:15px; margin-top:10px;">
            <select id="cad-treino-aluno" required class="form-input" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--input-bg); color:var(--text-main);">
                ${db.alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('')}
            </select>
            <input type="text" id="cad-treino-nome" placeholder="Ex: Ficha A - Peitoral" required class="form-input" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--input-bg); color:var(--text-main);">
            <button type="submit" class="btn-primary" style="padding:12px;">Atribuir ao Aluno</button>
        </form>
    `;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function abrirModalCheckin() {
    document.getElementById('modal-title').innerText = "Confirmar Presença na Unidade";
    document.getElementById('modal-body').innerHTML = `
        <form onsubmit="salvarCheckin(event)" style="display:flex; flex-direction:column; gap:15px; margin-top:10px;">
            <input type="text" id="cad-checkin-loc" placeholder="Sua localização (ex: Unidade Centro - Área Livre)" required class="form-input" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--input-bg); color:var(--text-main);">
            <button type="submit" class="btn-primary" style="padding:12px;">Confirmar Entrada</button>
        </form>
    `;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeModalOutside(e) { if(e.target.id === 'modal-overlay') closeModal(); }

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:var(--primary)"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function toggleAttachmentMenu() {
    const menu = document.getElementById('attachment-menu');
    if(menu) menu.classList.toggle('active');
}

function toggleExercise(element) {
    element.classList.toggle('exercise-done');
    const icon = element.querySelector('i');
    if (element.classList.contains('exercise-done')) {
        icon.className = 'fas fa-check-circle text-success';
        showToast('Exercício concluído! Muito bem!');
    } else {
        icon.className = 'far fa-circle text-muted-icon';
        showToast('Exercício desmarcado.');
    }
}

function markMealDone(btn) {
    if(btn.classList.contains('btn-done')) return;
    btn.classList.add('btn-done');
    btn.innerHTML = '<i class="fas fa-check"></i> Refeição Consumida';
    showToast('Refeição registrada com sucesso!');
}

function renderRelatorios(container) {
    container.innerHTML = `
        <div class="card" style="height: 400px; margin-bottom: 20px;">
            <h3>Evolução de Retenção de Alunos</h3>
            <canvas id="mainChart"></canvas>
        </div>
        <div style="text-align: right;">
            <button class="btn-outline" style="color:var(--text-main)" onclick="showToast('Relatório exportado em PDF.')"><i class="fas fa-file-pdf"></i> Exportar Relatório</button>
        </div>
    `;
    setTimeout(initChart, 100);
}

function initChart() {
    const canvas = document.getElementById('mainChart');
    if(!canvas) return;
    if(state.chartInstance) state.chartInstance.destroy();
    
    const ctx = canvas.getContext('2d');
    const isDark = state.theme === 'dark';
    
    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: state.role === 'personal' ? 'Evolução de Alunos' : 'Peso (kg)',
                data: state.role === 'personal' ? [12, 19, 15, 25, 22, 30] : [85, 84, 83, 81, 79, 78],
                borderColor: '#E60000',
                backgroundColor: 'rgba(230, 0, 0, 0.1)',
                fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: '#E60000'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: isDark ? '#27272A' : '#E5E7EB' }, ticks: { color: isDark ? '#9CA3AF' : '#6C757D' } },
                x: { grid: { display: false }, ticks: { color: isDark ? '#9CA3AF' : '#6C757D' } }
            }
        }
    });
}