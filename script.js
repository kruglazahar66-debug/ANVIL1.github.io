// ========== STORAGE KEYS ==========
const STORAGE_USERS = 'anvil_users';
const STORAGE_MATCHES = 'anvil_matches';
const STORAGE_CURRENT_USER = 'anvil_current_user';

let matches = [];
let currentUser = null;

// Расширенная функция для получения embed-ссылки Match TV (3 попытки)
function getMatchTvEmbedUrl(url) {
    let videoId = null;
    const idMatch = url.match(/\/video\/(\d+)/);
    if (idMatch && idMatch[1]) videoId = idMatch[1];

    let embedUrl = url.replace(/matchtv\.ru\/video\//, 'matchtv.ru/embed/video/');
    if (embedUrl !== url) return embedUrl;

    embedUrl = url + (url.includes('?') ? '&embed=1' : '?embed=1');
    if (videoId) {
        embedUrl = `https://embed.matchtv.ru/video/${videoId}`;
    }
    return embedUrl;
}

function getEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('matchtv.ru')) return getMatchTvEmbedUrl(url);
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    }
    if (url.includes('twitch.tv') && !url.includes('player.twitch.tv')) {
        let channel = url.split('twitch.tv/')[1]?.split('/')[0];
        if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&parent=localhost&autoplay=false`;
    }
    if (url.includes('vimeo.com')) {
        let videoId = url.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) return `https://player.vimeo.com/video/${videoId}?autoplay=0`;
    }
    return url;
}

function getDirectUrl(url) {
    if (!url) return '';
    if (url.includes('matchtv.ru')) return url;
    if (url.includes('youtube-nocookie.com/embed/')) {
        let videoId = url.split('/embed/')[1]?.split('?')[0];
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }
    if (url.includes('player.twitch.tv/?channel=')) {
        let channel = url.split('channel=')[1]?.split('&')[0];
        if (channel) return `https://www.twitch.tv/${channel}`;
    }
    return url;
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
        // Больше никаких предустановленных матчей — пустой список
        localStorage.setItem(STORAGE_MATCHES, JSON.stringify([]));
    }
    matches = JSON.parse(localStorage.getItem(STORAGE_MATCHES));
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
    const newMatch = { id: Date.now().toString(), title, datetime, streamUrl, preview: preview || 'Прогнозы скоро', status: new Date(datetime) <= new Date() ? 'live' : 'upcoming' };
    matches.push(newMatch);
    saveMatches();
    renderApp();
}

function updateMatch(id, title, datetime, streamUrl, preview) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    const index = matches.findIndex(m => m.id === id);
    if (index !== -1) {
        matches[index] = { ...matches[index], title, datetime, streamUrl, preview: preview || matches[index].preview, status: new Date(datetime) <= new Date() ? 'live' : 'upcoming' };
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
    if (confirm('Вы уверены, что хотите удалить ВСЕ события? Это действие необратимо.')) {
        matches = [];
        saveMatches();
        renderApp();
        showAdminPanel(); // обновляем админ-панель
    }
}

function renderApp() {
    const navContainer = document.getElementById('navLinks');
    if (currentUser) {
        navContainer.innerHTML = `<button class="nav-btn" onclick="showMatchesView()"><i class="fas fa-calendar-alt"></i> Расписание</button><button class="nav-btn" onclick="showLiveView()"><i class="fas fa-tower-broadcast"></i> Эфиры</button>${currentUser.role === 'admin' ? '<button class="nav-btn" onclick="showAdminPanel()"><i class="fas fa-shield-alt"></i> Админ</button>' : ''}<div class="user-info"><i class="fas fa-user-astronaut"></i> ${escapeHtml(currentUser.name)}</div><button class="logout-btn" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Выйти</button>`;
    } else {
        navContainer.innerHTML = `<button class="nav-btn" onclick="showAuth()"><i class="fas fa-key"></i> Вход / Регистрация</button>`;
    }
    if (!currentUser) { showAuth(); return; }
    showMatchesView();
}

window.showMatchesView = function() {
    const appDiv = document.getElementById('app');
    const now = new Date();
    const liveMatches = matches.filter(m => new Date(m.datetime) <= now);
    const upcoming = matches.filter(m => new Date(m.datetime) > now);
    let html = `<div class="hero"><h1>🔥 ANVIL SPORTS</h1><p>Прямые трансляции с Match TV, прогнозы и аналитика</p></div>`;
    if (liveMatches.length) {
        html += `<div class="live-banner"><h3><i class="fas fa-circle" style="font-size: 14px; color:#ff5e2e;"></i> ПРЯМОЙ ЭФИР</h3><div class="live-count">${liveMatches.length} LIVE</div></div>`;
        liveMatches.forEach(m => { html += `<div class="match-card" onclick="watchStream('${m.id}')"><div class="badge badge-live"><i class="fas fa-circle"></i> LIVE</div><div class="match-title">${escapeHtml(m.title)}</div><div class="match-datetime"><i class="far fa-clock"></i> ${new Date(m.datetime).toLocaleString()}</div><div class="match-preview"><i class="fas fa-chart-simple"></i> ${escapeHtml(m.preview)}</div><button class="stream-btn"><i class="fas fa-play"></i> Смотреть сейчас</button></div>`; });
    }
    html += `<div class="matches-grid">`;
    upcoming.forEach(m => { html += `<div class="match-card" onclick="watchStream('${m.id}')"><div class="badge badge-upcoming"><i class="fas fa-hourglass-half"></i> Скоро</div><div class="match-title">${escapeHtml(m.title)}</div><div class="match-datetime"><i class="far fa-calendar"></i> ${new Date(m.datetime).toLocaleString()}</div><div class="match-preview"><i class="fas fa-chart-simple"></i> ${escapeHtml(m.preview)}</div><button class="stream-btn"><i class="fas fa-ticket"></i> Запланировано</button></div>`; });
    html += `</div>`;
    if (upcoming.length === 0 && liveMatches.length === 0) html += `<div style="text-align:center; padding: 40px;">Нет предстоящих событий</div>`;
    appDiv.innerHTML = html;
};

window.watchStream = function(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return alert('Событие не найдено');
    const embedSrc = getEmbedUrl(match.streamUrl);
    const directUrl = getDirectUrl(match.streamUrl);
    const isLive = new Date(match.datetime) <= new Date();
    const frameId = 'streamFrame_' + Date.now();
    const appDiv = document.getElementById('app');
    
    appDiv.innerHTML = `
        <button onclick="showMatchesView()" class="nav-btn" style="margin-bottom: 20px;"><i class="fas fa-arrow-left"></i> К расписанию</button>
        <div class="player-container">
            <div class="player-header">
                <div class="player-title">
                    ${isLive ? '<span class="badge badge-live">LIVE</span>' : ''}
                    ${escapeHtml(match.title)}
                </div>
                <div class="player-actions">
                    <button class="player-action-btn" onclick="openDirect('${escapeHtml(directUrl)}')"><i class="fas fa-external-link-alt"></i> Открыть в новой вкладке</button>
                    <button class="player-action-btn" onclick="toggleFullscreen('${frameId}')"><i class="fas fa-expand"></i> На весь экран</button>
                </div>
            </div>
            <iframe id="${frameId}" class="player-frame" src="${escapeHtml(embedSrc)}" allowfullscreen allow="autoplay; encrypted-media; fullscreen" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"></iframe>
            <div id="fallbackMsg" style="background:#0a0a0f; padding:14px; font-size:14px; color:#aaa; text-align:center; border-top:1px solid #222; display: none;">
                <i class="fas fa-exclamation-triangle" style="color:#ffaa00;"></i> 
                <strong>Трансляция не загружается</strong> — скорее всего, сайт Match TV запрещает встраивание. 
                <button onclick="openDirect('${escapeHtml(directUrl)}')" style="background:#ff3b00; border:none; color:white; padding:6px 16px; border-radius:40px; margin-left:12px; cursor:pointer;">Открыть в новой вкладке</button>
            </div>
            <div style="background:#0a0a0f; padding:14px; font-size:14px; color:#aaa; text-align:center; border-top:1px solid #222;">
                <i class="fas fa-info-circle"></i> Если видео не работает — нажмите кнопку <strong>"Открыть в новой вкладке"</strong> выше.
            </div>
        </div>
    `;
    
    let fallbackShown = false;
    const timer = setTimeout(() => {
        const fallbackDiv = document.getElementById('fallbackMsg');
        if (fallbackDiv && !fallbackShown) {
            fallbackDiv.style.display = 'block';
            fallbackShown = true;
        }
    }, 4000);
    
    const iframe = document.getElementById(frameId);
    iframe.onerror = () => {
        const fallbackDiv = document.getElementById('fallbackMsg');
        if (fallbackDiv && !fallbackShown) {
            fallbackDiv.style.display = 'block';
            fallbackShown = true;
            clearTimeout(timer);
        }
    };
    
    window.openDirect = function(url) {
        clearTimeout(timer);
        window.open(url, '_blank', 'noopener,noreferrer');
    };
};

window.toggleFullscreen = function(frameId) {
    const frame = document.getElementById(frameId);
    if (frame) {
        if (frame.requestFullscreen) frame.requestFullscreen();
        else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
    }
};

window.showLiveView = function() {
    const now = new Date();
    const live = matches.filter(m => new Date(m.datetime) <= now);
    const appDiv = document.getElementById('app');
    if (!live.length) { appDiv.innerHTML = `<div class="hero"><h2>📡 Прямые эфиры</h2><p>Нет активных трансляций</p><button onclick="showMatchesView()" class="stream-btn" style="margin-top: 30px; width: auto; padding: 12px 32px;">К расписанию</button></div>`; return; }
    let html = `<div class="hero"><h2><i class="fas fa-broadcast-tower"></i> Прямые эфиры</h2></div><div class="matches-grid">`;
    live.forEach(m => { html += `<div class="match-card" onclick="watchStream('${m.id}')"><div class="badge badge-live">🔴 LIVE</div><div class="match-title">${escapeHtml(m.title)}</div><button class="stream-btn"><i class="fas fa-play"></i> Смотреть</button></div>`; });
    html += `</div>`; appDiv.innerHTML = html;
};

window.showAdminPanel = function() {
    if (!currentUser || currentUser.role !== 'admin') { alert('Нет прав администратора'); showMatchesView(); return; }
    const appDiv = document.getElementById('app');
    let matchesHtml = matches.map(m => `<div class="match-item"><div class="match-info"><strong>${escapeHtml(m.title)}</strong><br><small>${new Date(m.datetime).toLocaleString()}</small><br><small style="font-size:10px;">${escapeHtml(m.streamUrl.substring(0, 55))}</small></div><div><button class="edit-btn" onclick="editMatch('${m.id}')"><i class="fas fa-pen"></i> Ред.</button><button class="delete-btn" onclick="deleteMatchAdmin('${m.id}')"><i class="fas fa-trash-can"></i> Уд.</button></div></div>`).join('');
    appDiv.innerHTML = `<div class="admin-panel"><h2><i class="fas fa-gavel"></i> Панель управления ANVIL</h2><div class="admin-form"><h3>➕ Создать событие</h3><div class="form-group"><label>Название</label><input type="text" id="newTitle" placeholder="Спартак — Зенит"></div><div class="form-group"><label>Дата и время</label><input type="datetime-local" id="newDatetime"></div><div class="form-group"><label>Ссылка на трансляцию (Match TV / YouTube / Twitch)</label><input type="text" id="newUrl" placeholder="https://matchtv.ru/video/..."></div><div class="form-group"><label>Прогноз / описание</label><input type="text" id="newPreview" placeholder="Прогноз: 2:1"></div><button class="admin-btn" onclick="addMatchFromAdmin()"><i class="fas fa-plus-circle"></i> Добавить матч</button><button class="admin-btn" onclick="clearAllMatches()" style="background:#dc3545; margin-left: 12px;"><i class="fas fa-trash-alt"></i> Очистить все события</button></div><h3>📋 Редактировать существующие</h3>${matchesHtml || '<p>Нет событий</p>'}<button class="nav-btn" style="margin-top: 30px;" onclick="showMatchesView()">← Вернуться на главную</button></div>`;
};

window.addMatchFromAdmin = function() {
    const title = document.getElementById('newTitle')?.value;
    const datetime = document.getElementById('newDatetime')?.value;
    const url = document.getElementById('newUrl')?.value;
    const preview = document.getElementById('newPreview')?.value;
    if (!title || !datetime || !url) return alert('Заполните название, дату и URL!');
    addMatch(title, datetime, url, preview);
};

window.editMatch = function(id) {
    const match = matches.find(m => m.id === id);
    if (!match) return;
    const newTitle = prompt('Новое название', match.title);
    const newDt = prompt('Дата и время (YYYY-MM-DDTHH:MM)', match.datetime);
    const newUrl = prompt('Ссылка на трансляцию (Match TV, YouTube...)', match.streamUrl);
    const newPreview = prompt('Прогноз', match.preview);
    if (newTitle && newDt && newUrl) updateMatch(id, newTitle, newDt, newUrl, newPreview);
};

window.deleteMatchAdmin = function(id) { if (confirm('Удалить трансляцию навсегда?')) deleteMatch(id); };

window.showAuth = function() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `<div class="auth-card"><h2 id="authTitle">🔐 Вход в ANVIL</h2><input type="text" id="loginInput" class="auth-input" placeholder="Логин"><input type="password" id="passwordInput" class="auth-input" placeholder="Пароль"><div id="nameGroup" style="display:none;"><input type="text" id="nameInput" class="auth-input" placeholder="Ваше имя"></div><button id="submitBtn" class="auth-btn">Войти</button><div class="toggle-auth" id="toggleBtn">Нет аккаунта? Зарегистрироваться</div><div id="errorMsg" class="error-msg"></div></div>`;
    let isLogin = true;
    const titleEl = document.getElementById('authTitle'), submitBtn = document.getElementById('submitBtn'), nameGroup = document.getElementById('nameGroup'), toggleBtn = document.getElementById('toggleBtn'), errorSpan = document.getElementById('errorMsg');
    const updateForm = () => { if (isLogin) { titleEl.innerText = '🔐 Вход в ANVIL'; submitBtn.innerText = 'Войти'; nameGroup.style.display = 'none'; toggleBtn.innerText = 'Нет аккаунта? Зарегистрироваться'; } else { titleEl.innerText = '📝 Регистрация ANVIL'; submitBtn.innerText = 'Зарегистрироваться'; nameGroup.style.display = 'block'; toggleBtn.innerText = 'Уже есть аккаунт? Войти'; } errorSpan.innerText = ''; };
    toggleBtn.onclick = () => { isLogin = !isLogin; updateForm(); };
    submitBtn.onclick = () => { const loginVal = document.getElementById('loginInput').value.trim(); const passVal = document.getElementById('passwordInput').value; try { if (isLogin) { login(loginVal, passVal); renderApp(); } else { const nameVal = document.getElementById('nameInput').value.trim(); if (!loginVal || !passVal) throw new Error('Заполните логин и пароль'); register(loginVal, passVal, nameVal); alert('✅ Регистрация успешна! Теперь войдите.'); isLogin = true; updateForm(); document.getElementById('passwordInput').value = ''; } } catch (err) { errorSpan.innerText = err.message; } };
};

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, (m) => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'); }

initData();
renderApp();