const STORAGE_USERS = 'anvil_users';
const STORAGE_MATCHES = 'anvil_matches';
const STORAGE_CURRENT_USER = 'anvil_current_user';

let matches = [];
let currentUser = null;

function getMatchStatus(match) {
    const now = new Date();
    const matchTime = new Date(match.datetime);
    const diff = now - matchTime;
    const MATCH_DURATION = 2 * 60 * 60 * 1000; // 2 часа
    if (diff >= 0 && diff < MATCH_DURATION) return 'live';
    if (diff >= MATCH_DURATION) return 'finished';
    return 'upcoming';
}

function updateAllMatchesStatus() {
    matches.forEach(m => m.status = getMatchStatus(m));
    saveMatches();
}

function initData() {
    let users = localStorage.getItem(STORAGE_USERS);
    if (!users) {
        const defaultUsers = [
            { id: '1', login: 'admin', password: 'admin123', role: 'admin', name: 'Захар' },
            { id: '2', login: 'user', password: 'user123', role: 'user', name: 'Алексей' }
        ];
        localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
    }
    let storedMatches = localStorage.getItem(STORAGE_MATCHES);
    if (!storedMatches) {
        matches = [];
        saveMatches();
    } else {
        matches = JSON.parse(storedMatches);
        updateAllMatchesStatus();
    }
    const sess = sessionStorage.getItem(STORAGE_CURRENT_USER);
    if (sess) currentUser = JSON.parse(sess);
}

function saveMatches() {
    localStorage.setItem(STORAGE_MATCHES, JSON.stringify(matches));
}

function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS));
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function register(login, password, name) {
    const users = getUsers();
    if (users.find(u => u.login === login)) throw new Error('Логин уже занят');
    const newUser = { id: Date.now().toString(), login, password, role: 'user', name: name || login };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

function login(login, password) {
    const users = getUsers();
    const user = users.find(u => u.login === login && u.password === password);
    if (!user) throw new Error('Неверный логин/пароль');
    const sessionUser = { ...user };
    delete sessionUser.password;
    currentUser = sessionUser;
    sessionStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(currentUser));
    return currentUser;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem(STORAGE_CURRENT_USER);
    renderApp();
}

function addMatch(title, datetime, streamUrl, preview) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    const newMatch = {
        id: Date.now().toString(),
        title,
        datetime,
        streamUrl,
        preview: preview || 'Прогнозы скоро',
        status: getMatchStatus({ datetime })
    };
    matches.push(newMatch);
    saveMatches();
    renderApp(); // остаёмся на той же странице (будет вызвана та же функция, которая сейчас активна)
}

function updateMatch(id, title, datetime, streamUrl, preview) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    const index = matches.findIndex(m => m.id === id);
    if (index !== -1) {
        matches[index] = {
            ...matches[index],
            title,
            datetime,
            streamUrl,
            preview: preview || matches[index].preview,
            status: getMatchStatus({ datetime })
        };
        saveMatches();
        renderApp();
    }
}

function deleteMatch(id) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    matches = matches.filter(m => m.id !== id);
    saveMatches();
    renderApp();
}

function clearAllMatches() {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    if (confirm('Удалить все события?')) {
        matches = [];
        saveMatches();
        renderApp();
    }
}

function renderApp() {
    const navContainer = document.getElementById('navLinks');
    if (currentUser) {
        navContainer.innerHTML = `<button class="nav-btn" onclick="showMatchesView()"><i class="fas fa-calendar-alt"></i> Расписание</button><button class="nav-btn" onclick="showLiveView()"><i class="fas fa-tower-broadcast"></i> Эфиры</button>${currentUser.role === 'admin' ? '<button class="nav-btn" onclick="showAdminPanel()"><i class="fas fa-shield-alt"></i> Админ</button>' : ''}<div class="user-info"><i class="fas fa-user-astronaut"></i> ${escapeHtml(currentUser.name)}</div><button class="logout-btn" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Выйти</button>`;
    } else {
        navContainer.innerHTML = `<button class="nav-btn" onclick="showAuth()"><i class="fas fa-key"></i> Вход / Регистрация</button>`;
    }
    if (!currentUser) {
        showAuth();
        return;
    }
    // Показываем последний активный вид (по умолчанию расписание)
    if (window.currentView === 'admin') showAdminPanel();
    else if (window.currentView === 'live') showLiveView();
    else showMatchesView();
}

function renderMatchCard(match, isLive, isFinished = false) {
    const statusBadge = isLive ? '<div class="badge badge-live"><i class="fas fa-circle"></i> LIVE</div>' :
        (isFinished ? '<div class="badge" style="background:#555;"><i class="fas fa-check-circle"></i> Завершено</div>' :
            '<div class="badge badge-upcoming"><i class="fas fa-hourglass-half"></i> Скоро</div>');
    const disabledAttr = isFinished ? 'disabled style="opacity:0.5; cursor:default;"' : '';
    const btnText = isLive ? '<i class="fas fa-play"></i> Смотреть сейчас' : (isFinished ? '<i class="fas fa-video"></i> Трансляция завершена' : '<i class="fas fa-ticket"></i> Запланировано');
    const onclickAttr = isFinished ? '' : `onclick="watchStream('${match.id}')"`;
    return `<div class="match-card" ${onclickAttr}>
                ${statusBadge}
                <div class="match-title">${escapeHtml(match.title)}</div>
                <div class="match-datetime"><i class="far fa-clock"></i> ${new Date(match.datetime).toLocaleString()}</div>
                <div class="match-preview"><i class="fas fa-chart-simple"></i> ${escapeHtml(match.preview)}</div>
                <button class="stream-btn" ${disabledAttr}>${btnText}</button>
            </div>`;
}

window.showMatchesView = function() {
    window.currentView = 'matches';
    updateAllMatchesStatus();
    const appDiv = document.getElementById('app');
    const liveMatches = matches.filter(m => m.status === 'live');
    const upcomingMatches = matches.filter(m => m.status === 'upcoming');
    const finishedMatches = matches.filter(m => m.status === 'finished');
    let html = `<div class="hero"><h1>🔥 ANVIL SPORTS</h1><p>Спортивные трансляции и прогнозы</p></div>`;
    if (liveMatches.length) {
        html += `<div class="live-banner"><h3><i class="fas fa-circle" style="font-size: 14px; color:#ff5e2e;"></i> ПРЯМОЙ ЭФИР</h3><div class="live-count">${liveMatches.length} LIVE</div></div>`;
        liveMatches.forEach(m => { html += renderMatchCard(m, true); });
    }
    if (upcomingMatches.length) {
        html += `<h2 style="margin: 30px 0 10px;">📅 Скоро</h2><div class="matches-grid">`;
        upcomingMatches.forEach(m => { html += renderMatchCard(m, false); });
        html += `</div>`;
    }
    if (finishedMatches.length) {
        html += `<h2 style="margin: 30px 0 10px;">✅ Завершённые</h2><div class="matches-grid">`;
        finishedMatches.forEach(m => { html += renderMatchCard(m, false, true); });
        html += `</div>`;
    }
    if (matches.length === 0) html += `<div style="text-align:center; padding: 40px;">Нет событий. Добавьте первый матч в админ-панели!</div>`;
    appDiv.innerHTML = html;
};

window.watchStream = function(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return alert('Событие не найдено');
    if (match.status === 'finished' && !confirm('Матч завершён, но вы можете посмотреть запись. Открыть?')) return;
    const directUrl = match.streamUrl;
    const isLive = (match.status === 'live');
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
        <button onclick="showMatchesView()" class="nav-btn" style="margin-bottom:20px;"><i class="fas fa-arrow-left"></i> К расписанию</button>
        <div class="player-container" style="background:#0a0a0f; text-align:center; padding:40px 20px;">
            <div class="player-header"><div class="player-title">${isLive ? '<span class="badge badge-live">LIVE</span>' : ''} ${escapeHtml(match.title)}</div></div>
            <div style="margin:40px 0;">
                <i class="fas fa-external-link-alt" style="font-size:64px; color:#ff3b00;"></i>
                <h3>Трансляция</h3>
                <button onclick="openDirect('${escapeHtml(directUrl)}')" class="stream-btn" style="max-width:300px; margin:20px auto;">Смотреть трансляцию</button>
            </div>
        </div>
    `;
};

window.openDirect = function(url) { window.open(url, '_blank', 'noopener,noreferrer'); };

window.showLiveView = function() {
    window.currentView = 'live';
    updateAllMatchesStatus();
    const live = matches.filter(m => m.status === 'live');
    const appDiv = document.getElementById('app');
    if (!live.length) return appDiv.innerHTML = `<div class="hero"><h2>📡 Прямые эфиры</h2><p>Нет активных трансляций</p><button onclick="showMatchesView()" class="stream-btn" style="margin-top:30px;">К расписанию</button></div>`;
    let html = `<div class="hero"><h2>📡 Прямые эфиры</h2></div><div class="matches-grid">`;
    live.forEach(m => { html += renderMatchCard(m, true); });
    html += `</div>`; appDiv.innerHTML = html;
};

window.showAdminPanel = function() {
    window.currentView = 'admin';
    if (!currentUser || currentUser.role !== 'admin') { alert('Нет прав'); showMatchesView(); return; }
    const appDiv = document.getElementById('app');
    let matchesHtml = matches.map(m => `<div class="match-item"><div class="match-info"><strong>${escapeHtml(m.title)}</strong><br><small>${new Date(m.datetime).toLocaleString()}</small><br><small>Статус: ${m.status}</small></div><div><button class="edit-btn" onclick="editMatch('${m.id}')"><i class="fas fa-pen"></i> Ред.</button><button class="delete-btn" onclick="deleteMatchAdmin('${m.id}')"><i class="fas fa-trash-can"></i> Уд.</button></div></div>`).join('');
    appDiv.innerHTML = `<div class="admin-panel">
        <h2><i class="fas fa-gavel"></i> Панель управления ANVIL</h2>
        <div class="admin-form">
            <h3>➕ Создать событие</h3>
            <div class="form-group"><label>Название</label><input type="text" id="newTitle" placeholder="Спартак — Зенит"></div>
            <div class="form-group"><label>Дата и время</label><input type="datetime-local" id="newDatetime"></div>
            <div class="form-group"><label>Ссылка на трансляцию</label><input type="text" id="newUrl" placeholder="https://rutube.ru/video/..."></div>
            <div class="form-group"><label>Прогноз / описание</label><input type="text" id="newPreview" placeholder="Прогноз: 2:1"></div>
            <button class="admin-btn" onclick="addMatchFromAdmin()"><i class="fas fa-plus-circle"></i> Добавить матч</button>
            <button class="admin-btn" onclick="clearAllMatches()" style="background:#dc3545; margin-left:12px;"><i class="fas fa-trash-alt"></i> Очистить все события</button>
        </div>
        <h3>📋 Существующие матчи</h3>
        ${matchesHtml || '<p>Нет событий</p>'}
        <button class="nav-btn" style="margin-top:30px;" onclick="showMatchesView()">← Вернуться на главную</button>
    </div>`;
};

window.addMatchFromAdmin = function() {
    const title = document.getElementById('newTitle')?.value;
    const datetime = document.getElementById('newDatetime')?.value;
    const url = document.getElementById('newUrl')?.value;
    const preview = document.getElementById('newPreview')?.value;
    if (!title || !datetime || !url) return alert('Заполните название, дату и URL!');
    addMatch(title, datetime, url, preview);
    // после добавления остаёмся в админке
    showAdminPanel();
};

window.editMatch = function(id) {
    const m = matches.find(m => m.id === id);
    if (!m) return;
    const newTitle = prompt('Новое название', m.title);
    const newDt = prompt('Дата и время (YYYY-MM-DDTHH:MM)', m.datetime);
    const newUrl = prompt('Ссылка на трансляцию', m.streamUrl);
    const newPreview = prompt('Прогноз', m.preview);
    if (newTitle && newDt && newUrl) {
        updateMatch(id, newTitle, newDt, newUrl, newPreview);
        showAdminPanel(); // остаёмся в админке
    }
};

window.deleteMatchAdmin = function(id) {
    if (confirm('Удалить трансляцию навсегда?')) {
        deleteMatch(id);
        showAdminPanel(); // остаёмся в админке
    }
};

window.showAuth = function() {
    window.currentView = 'auth';
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `<div class="auth-card"><h2 id="authTitle">🔐 Вход в ANVIL</h2><input type="text" id="loginInput" class="auth-input" placeholder="Логин"><input type="password" id="passwordInput" class="auth-input" placeholder="Пароль"><div id="nameGroup" style="display:none;"><input type="text" id="nameInput" class="auth-input" placeholder="Ваше имя"></div><button id="submitBtn" class="auth-btn">Войти</button><div class="toggle-auth" id="toggleBtn">Нет аккаунта? Зарегистрироваться</div><div id="errorMsg" class="error-msg"></div></div>`;
    let isLogin = true;
    const titleEl = document.getElementById('authTitle'), submitBtn = document.getElementById('submitBtn'), nameGroup = document.getElementById('nameGroup'), toggleBtn = document.getElementById('toggleBtn'), errorSpan = document.getElementById('errorMsg');
    const updateForm = () => {
        if (isLogin) {
            titleEl.innerText = '🔐 Вход в ANVIL';
            submitBtn.innerText = 'Войти';
            nameGroup.style.display = 'none';
            toggleBtn.innerText = 'Нет аккаунта? Зарегистрироваться';
        } else {
            titleEl.innerText = '📝 Регистрация ANVIL';
            submitBtn.innerText = 'Зарегистрироваться';
            nameGroup.style.display = 'block';
            toggleBtn.innerText = 'Уже есть аккаунт? Войти';
        }
        errorSpan.innerText = '';
    };
    toggleBtn.onclick = () => {
        isLogin = !isLogin;
        updateForm();
    };
    submitBtn.onclick = () => {
        const loginVal = document.getElementById('loginInput').value.trim();
        const passVal = document.getElementById('passwordInput').value;
        try {
            if (isLogin) {
                login(loginVal, passVal);
                renderApp();
            } else {
                const nameVal = document.getElementById('nameInput').value.trim();
                if (!loginVal || !passVal) throw new Error('Заполните логин и пароль');
                register(loginVal, passVal, nameVal);
                alert('✅ Регистрация успешна! Теперь войдите.');
                isLogin = true;
                updateForm();
                document.getElementById('passwordInput').value = '';
            }
        } catch (err) {
            errorSpan.innerText = err.message;
        }
    };
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

initData();
renderApp();