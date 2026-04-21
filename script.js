const STORAGE_USERS = 'anvil_users';
const STORAGE_MATCHES = 'anvil_matches';
const STORAGE_CURRENT_USER = 'anvil_current_user';

let matches = [];
let currentUser = null;
let autoUpdateInterval = null;

const MATCH_DURATION = 2 * 60 * 60 * 1000;
const TARGET_MATCH_COUNT = 12;

const SPORT_TEAMS = [
    "Спартак", "Зенит", "ЦСКА", "Локомотив", "Динамо", "Краснодар", "Ростов", "Ахмат",
    "Сочи", "Урал", "Химки", "Рубин", "Крылья Советов", "Торпедо", "Факел", "Пари НН"
];
const SPORT_TOURNAMENTS = ["РПЛ", "КХЛ", "НХЛ", "Евролига", "Теннис", "Баскетбол", "Волейбол"];
const SPORT_ICONS = { "РПЛ": "⚽", "КХЛ": "🏒", "НХЛ": "🏒", "Евролига": "🏀", "Теннис": "🎾", "Баскетбол": "🏀", "Волейбол": "🏐" };

const ESPORT_GAMES = ["CS2", "Dota 2", "LoL", "Valorant", "StarCraft II", "FIFA", "Rocket League"];
const ESPORT_TEAMS = [
    "NAVI", "G2", "FaZe", "Team Spirit", "Virtus.pro", "OG", "Fnatic", "Team Liquid",
    "Cloud9", "ENCE", "BetBoom", "MOUZ", "Heroic", "Astralis", "Tundra", "GG"
];
const ESPORT_ICONS = { "CS2": "🎮", "Dota 2": "🪓", "LoL": "🏆", "Valorant": "💥", "StarCraft II": "🚀", "FIFA": "⚽", "Rocket League": "🚗" };

function randomFutureDate(minDays = 0, maxDays = 7) {
    const now = new Date();
    const days = minDays + Math.floor(Math.random() * (maxDays - minDays + 1));
    const hours = 12 + Math.floor(Math.random() * 12);
    const minutes = Math.random() > 0.5 ? 0 : 30;
    const date = new Date(now);
    date.setDate(now.getDate() + days);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function generateSportMatch() {
    const tournament = SPORT_TOURNAMENTS[Math.floor(Math.random() * SPORT_TOURNAMENTS.length)];
    const icon = SPORT_ICONS[tournament] || "🏆";
    if (tournament === "Теннис") {
        const players = ["Медведев", "Рублёв", "Карацев", "Хачанов", "Самсонова", "Касаткина"];
        let p1 = players[Math.floor(Math.random() * players.length)];
        let p2 = players[Math.floor(Math.random() * players.length)];
        while (p1 === p2) p2 = players[Math.floor(Math.random() * players.length)];
        return `${icon} Теннис: ${p1} — ${p2}`;
    } else {
        let t1 = SPORT_TEAMS[Math.floor(Math.random() * SPORT_TEAMS.length)];
        let t2 = SPORT_TEAMS[Math.floor(Math.random() * SPORT_TEAMS.length)];
        while (t1 === t2) t2 = SPORT_TEAMS[Math.floor(Math.random() * SPORT_TEAMS.length)];
        return `${icon} ${tournament}: ${t1} — ${t2}`;
    }
}

function generateEsportMatch() {
    const game = ESPORT_GAMES[Math.floor(Math.random() * ESPORT_GAMES.length)];
    const icon = ESPORT_ICONS[game] || "🎮";
    let t1 = ESPORT_TEAMS[Math.floor(Math.random() * ESPORT_TEAMS.length)];
    let t2 = ESPORT_TEAMS[Math.floor(Math.random() * ESPORT_TEAMS.length)];
    while (t1 === t2) t2 = ESPORT_TEAMS[Math.floor(Math.random() * ESPORT_TEAMS.length)];
    return `${icon} ${game}: ${t1} vs ${t2}`;
}

function generateMatchTitle() {
    const isEsport = Math.random() > 0.5;
    return isEsport ? generateEsportMatch() : generateSportMatch();
}

function generateAIPrediction(title, matchDate) {
    const hour = matchDate.getHours();
    const isDerby = (title.includes("Спартак") && title.includes("Зенит")) ||
                    (title.includes("ЦСКА") && title.includes("Спартак")) ||
                    (title.includes("NAVI") && title.includes("G2"));
    const timeStr = hour < 14 ? "днём" : (hour < 19 ? "вечером" : "ночью");
    
    if (title.includes("CS2") || title.includes("Dota") || title.includes("LoL") || title.includes("Valorant")) {
        const esportPredictions = [
            `🎮 AI-анализ: ${title.includes("NAVI") ? "NAVI в хорошей форме" : "Будет близкий матч"}. Карты: ${Math.floor(1 + Math.random() * 3)}:${Math.floor(1 + Math.random() * 3)}`,
            `🧠 Кибер-нейросеть: Фаворит — ${Math.random() > 0.5 ? "первая команда" : "вторая команда"} с вероятностью ${Math.floor(55 + Math.random() * 35)}%`,
            `🤖 По статистике: тотал раундов больше ${Math.floor(20 + Math.random() * 15)}.5`,
            `💡 Совет: смотреть ${timeStr}, матч будет напряжённым`
        ];
        return esportPredictions[Math.floor(Math.random() * esportPredictions.length)];
    }
    
    const predictions = [
        `🤖 Нейросеть: ${isDerby ? "Дерби! Ожидаем голов. " : ""}Прогноз: ${Math.random() > 0.5 ? "обе забьют" : "тотал меньше 2.5"}`,
        `🧠 AI: ${Math.random() > 0.66 ? "Победа хозяев" : (Math.random() > 0.5 ? "Ничья" : "Гости выиграют")} с вероятностью ${Math.floor(50 + Math.random() * 40)}%`,
        `📊 ИИ-анализ: ${timeStr} ожидается ${Math.random() > 0.5 ? "атакующий футбол" : "осторожная игра"}.`,
        `🔮 AI预测: Счёт ${Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 3)}`,
        `⚡ Нейросеть: Ставка на ${Math.random() > 0.5 ? "жёлтые карточки" : "угловые"}`
    ];
    let idx = Math.floor(Math.random() * predictions.length);
    if (isDerby) idx = 0;
    return predictions[idx];
}

function generateRutubeUrl() {
    const fakeIds = ["9e3b2c1d4f5a6b7c8d9e0f1a2b3c4d5e", "a1b2c3d4e5f67890", "1234567890abcdef", "fedcba0987654321", "abc123def456"];
    return `https://rutube.ru/video/${fakeIds[Math.floor(Math.random() * fakeIds.length)]}/`;
}

function getMatchStatus(match) {
    const now = new Date();
    const matchTime = new Date(match.datetime);
    const diff = now - matchTime;
    if (diff >= 0 && diff < MATCH_DURATION) return 'live';
    if (diff >= MATCH_DURATION) return 'finished';
    return 'upcoming';
}

function aiManageSchedule() {
    if (!currentUser || currentUser.role !== 'admin') return;
    matches.forEach(m => m.status = getMatchStatus(m));
    matches = matches.filter(m => m.status !== 'finished');
    while (matches.length < TARGET_MATCH_COUNT) {
        let matchDate = randomFutureDate(0, 7);
        if (matchDate < new Date()) matchDate = randomFutureDate(1, 7);
        const title = generateMatchTitle();
        const preview = generateAIPrediction(title, matchDate);
        const streamUrl = generateRutubeUrl();
        matches.push({
            id: Date.now().toString() + Math.random(),
            title,
            datetime: matchDate.toISOString().slice(0, 16),
            streamUrl,
            preview,
            status: getMatchStatus({ datetime: matchDate.toISOString().slice(0,16) })
        });
    }
    matches.sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
    saveMatches();
    if (document.getElementById('app')) renderApp();
}

function getEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('rutube.ru')) {
        if (url.includes('/embed/')) return url;
        let videoId = '';
        if (url.includes('/video/')) {
            videoId = url.split('/video/')[1]?.split('/')[0]?.split('?')[0];
        } else if (url.includes('/pl/')) {
            videoId = url.split('/pl/')[1]?.split('/')[0]?.split('?')[0];
        }
        if (videoId) return `https://rutube.ru/embed/${videoId}/?autoplay=0`;
        return url;
    }
    if (url.includes('matchtv.ru')) return url;
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
    if (url.includes('rutube.ru')) {
        if (url.includes('/embed/')) {
            let videoId = url.split('/embed/')[1]?.split('/')[0];
            if (videoId) return `https://rutube.ru/video/${videoId}/`;
        }
        return url;
    }
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
        matches = [];
        aiManageSchedule();
    } else {
        matches = JSON.parse(storedMatches);
        aiManageSchedule();
    }
    const sess = sessionStorage.getItem(STORAGE_CURRENT_USER);
    if (sess) currentUser = JSON.parse(sess);
    if (autoUpdateInterval) clearInterval(autoUpdateInterval);
    autoUpdateInterval = setInterval(() => {
        if (currentUser && currentUser.role === 'admin') {
            aiManageSchedule();
        } else {
            matches.forEach(m => m.status = getMatchStatus(m));
            saveMatches();
            if (document.getElementById('app')) renderApp();
        }
    }, 30000);
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
    const newMatch = { id: Date.now().toString(), title, datetime, streamUrl, preview: preview || 'Прогнозы скоро', status: getMatchStatus({ datetime }) };
    matches.push(newMatch);
    saveMatches();
    renderApp();
}

function updateMatch(id, title, datetime, streamUrl, preview) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    const index = matches.findIndex(m => m.id === id);
    if (index !== -1) {
        matches[index] = { ...matches[index], title, datetime, streamUrl, preview: preview || matches[index].preview, status: getMatchStatus({ datetime }) };
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
        aiManageSchedule();
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
    if (!currentUser) { showAuth(); return; }
    showMatchesView();
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
                <div class="ai-preview"><i class="fas fa-robot"></i> ${escapeHtml(generateAIPrediction(match.title, new Date(match.datetime)))}</div>
                <button class="stream-btn" ${disabledAttr}>${btnText}</button>
            </div>`;
}

window.showMatchesView = function() {
    if (currentUser && currentUser.role === 'admin') aiManageSchedule();
    else matches.forEach(m => m.status = getMatchStatus(m));
    const appDiv = document.getElementById('app');
    const liveMatches = matches.filter(m => m.status === 'live');
    const upcomingMatches = matches.filter(m => m.status === 'upcoming');
    const finishedMatches = matches.filter(m => m.status === 'finished');
    let html = `<div class="hero"><h1>🔥 ANVIL SPORTS + ESPORTS</h1><p>Автоматические эфиры, AI-прогнозы, киберспорт</p></div>`;
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
    if (matches.length === 0) html += `<div style="text-align:center; padding: 40px;">Нет событий. AI скоро создаст расписание...</div>`;
    appDiv.innerHTML = html;
};

window.watchStream = function(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return alert('Событие не найдено');
    if (match.status === 'finished' && !confirm('Матч завершён, но вы можете посмотреть запись. Открыть?')) return;
    const embedSrc = getEmbedUrl(match.streamUrl);
    const directUrl = getDirectUrl(match.streamUrl);
    const isLive = (match.status === 'live');
    const isMatchTv = match.streamUrl.includes('matchtv.ru');
    const frameId = 'streamFrame_' + Date.now();
    const appDiv = document.getElementById('app');
    if (isMatchTv) {
        appDiv.innerHTML = `
            <button onclick="showMatchesView()" class="nav-btn" style="margin-bottom:20px;"><i class="fas fa-arrow-left"></i> К расписанию</button>
            <div class="player-container" style="background:#0a0a0f; text-align:center; padding:40px 20px;">
                <div class="player-header"><div class="player-title">${isLive ? '<span class="badge badge-live">LIVE</span>' : ''} ${escapeHtml(match.title)}</div></div>
                <div style="margin:40px 0;">
                    <i class="fas fa-external-link-alt" style="font-size:64px; color:#ff3b00;"></i>
                    <h3>Трансляция на Match TV</h3>
                    <button onclick="openDirect('${escapeHtml(directUrl)}')" class="stream-btn" style="max-width:300px; margin:20px auto;">Смотреть на Match TV</button>
                </div>
            </div>
        `;
        return;
    }
    appDiv.innerHTML = `
        <button onclick="showMatchesView()" class="nav-btn" style="margin-bottom:20px;"><i class="fas fa-arrow-left"></i> К расписанию</button>
        <div class="player-container">
            <div class="player-header">
                <div class="player-title">${isLive ? '<span class="badge badge-live">LIVE</span>' : ''} ${escapeHtml(match.title)}</div>
                <div class="player-actions">
                    <button class="player-action-btn" onclick="openDirect('${escapeHtml(directUrl)}')"><i class="fas fa-external-link-alt"></i> Открыть в новой вкладке</button>
                    <button class="player-action-btn" onclick="toggleFullscreen('${frameId}')"><i class="fas fa-expand"></i> На весь экран</button>
                </div>
            </div>
            <iframe id="${frameId}" class="player-frame" src="${escapeHtml(embedSrc)}" allowfullscreen allow="autoplay; encrypted-media; fullscreen" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"></iframe>
            <div style="background:#0a0a0f; padding:14px; font-size:14px; color:#aaa; text-align:center;">Если видео не работает — нажмите "Открыть в новой вкладке".</div>
        </div>
    `;
};

window.openDirect = function(url) { window.open(url, '_blank', 'noopener,noreferrer'); };
window.toggleFullscreen = function(frameId) {
    const frame = document.getElementById(frameId);
    if (frame) frame.requestFullscreen?.() || frame.webkitRequestFullscreen?.();
};

window.showLiveView = function() {
    const live = matches.filter(m => m.status === 'live');
    const appDiv = document.getElementById('app');
    if (!live.length) return appDiv.innerHTML = `<div class="hero"><h2>📡 Прямые эфиры</h2><p>Нет активных трансляций</p><button onclick="showMatchesView()" class="stream-btn" style="margin-top:30px;">К расписанию</button></div>`;
    let html = `<div class="hero"><h2>📡 Прямые эфиры</h2></div><div class="matches-grid">`;
    live.forEach(m => { html += renderMatchCard(m, true); });
    html += `</div>`; appDiv.innerHTML = html;
};

window.showAdminPanel = function() {
    if (!currentUser || currentUser.role !== 'admin') { alert('Нет прав'); showMatchesView(); return; }
    const appDiv = document.getElementById('app');
    let matchesHtml = matches.map(m => `<div class="match-item"><div class="match-info"><strong>${escapeHtml(m.title)}</strong><br><small>${new Date(m.datetime).toLocaleString()}</small><br><small>Статус: ${m.status}</small></div><div><button class="edit-btn" onclick="editMatch('${m.id}')"><i class="fas fa-pen"></i> Ред.</button><button class="delete-btn" onclick="deleteMatchAdmin('${m.id}')"><i class="fas fa-trash-can"></i> Уд.</button></div></div>`).join('');
    appDiv.innerHTML = `<div class="admin-panel">
        <h2><i class="fas fa-gavel"></i> Панель ANVIL + AI (Спорт + Киберспорт)</h2>
        <div class="admin-form">
            <h3>🤖 Нейросеть управляет расписанием автоматически</h3>
            <button class="admin-btn" onclick="aiManageSchedule()" style="background:#0d6efd; margin-bottom:20px;"><i class="fas fa-sync-alt"></i> Запустить AI сейчас</button>
            <h3>➕ Ручное добавление</h3>
            <div class="form-group"><label>Название</label><input type="text" id="newTitle" placeholder="Спартак — Зенит или NAVI vs G2"></div>
            <div class="form-group"><label>Дата и время</label><input type="datetime-local" id="newDatetime"></div>
            <div class="form-group"><label>Ссылка (Rutube/YouTube/Twitch)</label><input type="text" id="newUrl" placeholder="https://rutube.ru/video/..."></div>
            <div class="form-group"><label>Прогноз</label><input type="text" id="newPreview" placeholder="Прогноз"></div>
            <button class="admin-btn" onclick="addMatchFromAdmin()"><i class="fas fa-plus"></i> Добавить матч</button>
            <button class="admin-btn" onclick="clearAllMatches()" style="background:#dc3545; margin-left:12px;"><i class="fas fa-trash"></i> Очистить всё (AI восстановит)</button>
        </div>
        <h3>📋 Существующие матчи (${matches.length} шт.)</h3>
        ${matchesHtml || '<p>Нет событий</p>'}
        <button class="nav-btn" style="margin-top:30px;" onclick="showMatchesView()">← На главную</button>
    </div>`;
};

window.addMatchFromAdmin = function() {
    const title = document.getElementById('newTitle')?.value;
    const datetime = document.getElementById('newDatetime')?.value;
    const url = document.getElementById('newUrl')?.value;
    const preview = document.getElementById('newPreview')?.value;
    if (!title || !datetime || !url) return alert('Заполните все поля!');
    addMatch(title, datetime, url, preview);
};

window.editMatch = function(id) {
    const m = matches.find(m => m.id === id);
    if (!m) return;
    const newTitle = prompt('Название', m.title);
    const newDt = prompt('Дата (YYYY-MM-DDTHH:MM)', m.datetime);
    const newUrl = prompt('Ссылка', m.streamUrl);
    const newPreview = prompt('Прогноз', m.preview);
    if (newTitle && newDt && newUrl) updateMatch(id, newTitle, newDt, newUrl, newPreview);
};

window.deleteMatchAdmin = function(id) { if (confirm('Удалить?')) deleteMatch(id); };

window.showAuth = function() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `<div class="auth-card"><h2 id="authTitle">🔐 Вход в ANVIL</h2><input type="text" id="loginInput" class="auth-input" placeholder="Логин"><input type="password" id="passwordInput" class="auth-input" placeholder="Пароль"><div id="nameGroup" style="display:none;"><input type="text" id="nameInput" class="auth-input" placeholder="Имя"></div><button id="submitBtn" class="auth-btn">Войти</button><div class="toggle-auth" id="toggleBtn">Нет аккаунта? Зарегистрироваться</div><div id="errorMsg" class="error-msg"></div></div>`;
    let isLogin = true;
    const titleEl = document.getElementById('authTitle'), submitBtn = document.getElementById('submitBtn'), nameGroup = document.getElementById('nameGroup'), toggleBtn = document.getElementById('toggleBtn'), errorSpan = document.getElementById('errorMsg');
    const updateForm = () => { if (isLogin) { titleEl.innerText = '🔐 Вход'; submitBtn.innerText = 'Войти'; nameGroup.style.display = 'none'; toggleBtn.innerText = 'Регистрация'; } else { titleEl.innerText = '📝 Регистрация'; submitBtn.innerText = 'Зарегистрироваться'; nameGroup.style.display = 'block'; toggleBtn.innerText = 'Войти'; } errorSpan.innerText = ''; };
    toggleBtn.onclick = () => { isLogin = !isLogin; updateForm(); };
    submitBtn.onclick = () => {
        const loginVal = document.getElementById('loginInput').value.trim();
        const passVal = document.getElementById('passwordInput').value;
        try {
            if (isLogin) { login(loginVal, passVal); renderApp(); }
            else {
                const nameVal = document.getElementById('nameInput').value.trim();
                if (!loginVal || !passVal) throw new Error('Заполните логин/пароль');
                register(loginVal, passVal, nameVal);
                alert('✅ Регистрация успешна! Теперь войдите.');
                isLogin = true; updateForm();
                document.getElementById('passwordInput').value = '';
            }
        } catch(err) { errorSpan.innerText = err.message; }
    };
};

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'); }

initData();
renderApp();