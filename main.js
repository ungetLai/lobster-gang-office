const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const logsOnline = document.getElementById('logs-online');
const logsOffline = document.getElementById('logs-offline');
const speechBubble = document.getElementById('speech-bubble');

let offset = { x: 0, y: 0 };
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let systemLoad = 0; // 0 to 1, based on recent token activity

// Socket.io 初始化
const socket = io();

// 載入資源
const bgImage = new Image();
bgImage.src = 'assets/office-bg.jpg';

const nexoraImg = new Image();
nexoraImg.src = 'assets/nexora-boss.png';

const nexoraOfflineImg = new Image();
nexoraOfflineImg.src = 'assets/nexora-offline.png';

const looploomImg = new Image();
looploomImg.src = 'assets/looploom.png';

const looploomOfflineImg = new Image();
looploomOfflineImg.src = 'assets/looploom-offline.png';

const signalscoutImg = new Image();
signalscoutImg.src = 'assets/signalscout.png';

const signalscoutOfflineImg = new Image();
signalscoutOfflineImg.src = 'assets/signalscout-offline.png';

const shadowledgerImg = new Image();
shadowledgerImg.src = 'assets/shadowledger.png';

const shadowledgerOfflineImg = new Image();
shadowledgerOfflineImg.src = 'assets/shadowledger-offline.png';

// 成員資料
const members = [
    { id: 'main', name: 'Nexora 🦞', x: 2, y: 3.2, color: '#ff4d4d', role: '龍蝦幫幫主', status: 'offline', agentStatus: 'idle', isBoss: true, img: nexoraImg, offlineImg: nexoraOfflineImg, offlinePos: { x: 4.2, y: 1.2 } },
    { id: 'looploom', name: 'LoopLoom 🕷️', x: 2, y: 9, color: '#ff0000', role: '專案開發專家', status: 'offline', agentStatus: 'idle', isCustom: true, img: looploomImg, offlineImg: looploomOfflineImg, offlinePos: { x: 8, y: 7 } },
    { id: 'signalscout', name: 'SignalScout 蜥', x: 2.3, y: 6.3, color: '#00ff00', role: '專案企劃大師', status: 'offline', agentStatus: 'idle', isCustom: true, img: signalscoutImg, offlineImg: signalscoutOfflineImg, offlinePos: { x: 6.1, y: 4.2 } },
    { id: 'shadowledger', name: 'ShadowLedger 🦉', x: 6, y: 9, color: '#ffa500', role: '財務大總管', status: 'offline', agentStatus: 'idle', isCustom: true, img: shadowledgerImg, offlineImg: shadowledgerOfflineImg, offlinePos: { x: 9, y: 4 } },
];

// Agent 狀態顏色映射
const statusColors = {
    idle: '#00ff00',      // 綠色
    writing: '#3399ff',   // 藍色
    researching: '#9966ff', // 紫色
    executing: '#ff9900', // 橙色
    syncing: '#00cccc',   // 青色
    error: '#ff3333'      // 紅色
};

const statusEmojis = {
    idle: '🟢',
    writing: '🔵',
    researching: '🔍',
    executing: '⚙️',
    syncing: '🔄',
    error: '🔴'
};

// Socket 事件監聽
socket.on('sync_update', (data) => {
    const member = members.find(m => m.id === data.agentId || m.name.includes(data.agentId));
    if (member) {
        if (member.status !== 'online') {
            member.status = 'online';
            addLog(`[System] ${member.name} 🟢 偵測到活動，自動進入在線模式`, 'system');
            updateOnlineCount();
        }
        // 更新 Agent 狀態
        if (data.status) {
            member.agentStatus = data.status;
        }
        // 增加系統負載感
        systemLoad = Math.min(1.0, systemLoad + (data.output / 5000));
    }
});

socket.on('announcement', (data) => {
    const typeClass = data.type === 'task' ? 'command' : 'system';
    addLog(`[${data.sender}] ${data.message}`, typeClass);
    
    // 如果是廣播任務，讓對應成員說話
    const member = members.find(m => data.message.includes(m.name) || data.sender.includes(m.name));
    if (member) {
        showSpeech(member.id, data.message.length > 20 ? data.message.substring(0, 20) + '...' : data.message, 5000);
    }
});

socket.on('boss_command', (data) => {
    window.receiveBossCommand(data.target || 'looploom', data.command);
});

function switchTab(tab) {
    document.querySelectorAll('.log-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.log-container').forEach(el => el.classList.remove('active'));
    
    if (tab === 'online') {
        document.querySelector('.log-tab:nth-child(1)').classList.add('active');
        logsOnline.classList.add('active');
    } else {
        document.querySelector('.log-tab:nth-child(2)').classList.add('active');
        logsOffline.classList.add('active');
    }
}

window.switchTab = switchTab;

function showSpeech(memberId, text, duration = 3000) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const isOnline = member.status === 'online';
    let drawX = isOnline ? member.x : (member.offlinePos ? member.offlinePos.x : member.x);
    let drawY = isOnline ? member.y : (member.offlinePos ? member.offlinePos.y : member.y);

    const screenX = (drawX - drawY) * 50 + offset.x;
    const screenY = (drawX + drawY) * 25 + offset.y - 120;

    const labelYOffset = member.isBoss ? 180 : (member.isCustom ? 140 : 100);

    speechBubble.textContent = text;
    speechBubble.style.display = 'block';
    speechBubble.style.left = `${screenX - speechBubble.offsetWidth / 2}px`;
    speechBubble.style.top = `${screenY - labelYOffset - 40}px`;

    setTimeout(() => {
        speechBubble.style.display = 'none';
    }, duration);
}

function updateOnlineCount() {
    const onlineCount = members.filter(m => m.status === 'online').length;
    const onlineCountEl = document.getElementById('online-count');
    if (onlineCountEl) {
        onlineCountEl.textContent = onlineCount;
    }
}

async function fetchMemberStatus() {
    try {
        const response = await fetch('/api/status');
        const statuses = await response.json();
        
        let changed = false;
        members.forEach(member => {
            const newStatus = statuses[member.id] || 'offline';
            if (member.status !== newStatus) {
                member.status = newStatus;
                const statusText = member.status === 'online' ? '🟢 上線' : '🔴 離線';
                addLog(`[System] ${member.name} ${statusText}`, 'system');
                changed = true;
            }
        });
        
        if (changed) {
            updateOnlineCount();
        }
    } catch (err) {
        console.error('Failed to fetch member status:', err);
    }
}

setInterval(fetchMemberStatus, 15000);

window.receiveBossCommand = function(targetMemberId = 'looploom', commandText = '接獲首領指令！') {
    const boss = members.find(m => m.isBoss);
    const target = members.find(m => m.id === targetMemberId);
    
    addLog(`[${boss.name}] 接獲首領的指示: ${commandText}`, 'command');
    showSpeech(boss.id, `📢 ${commandText}`, 3000);

    setTimeout(() => {
        if (target) {
            addLog(`[${boss.name}] 將首領的指示指派給 ${target.name}`, 'command');
            showSpeech(boss.id, `👉 ${target.name}，交給你了！`, 2000);
            
            setTimeout(() => {
                showSpeech(target.id, '🫡 收到，立即執行！', 2500);
                addLog(`[${target.name}] 開始執行首領指示任務...`, 'online');
                systemLoad = Math.min(1.0, systemLoad + 0.3);
            }, 2500);
        }
    }, 2500);
};

// 視覺特效：矩陣代碼雨
const codes = [];
function createCode() {
    if (systemLoad < 0.1) return;
    const count = Math.floor(systemLoad * 5);
    for(let i=0; i<count; i++) {
        codes.push({
            x: Math.random() * canvas.width,
            y: -20,
            speed: 2 + Math.random() * 5,
            text: Math.random() > 0.5 ? '0' : '1',
            opacity: systemLoad * 0.5
        });
    }
}

function drawCodes() {
    ctx.font = '10px monospace';
    for (let i = codes.length - 1; i >= 0; i--) {
        const c = codes[i];
        ctx.fillStyle = `rgba(0, 255, 136, ${c.opacity})`;
        ctx.fillText(c.text, c.x, c.y);
        c.y += c.speed;
        if (c.y > canvas.height) codes.splice(i, 1);
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offset.x = canvas.width / 2;
    offset.y = canvas.height / 2;
    updateOnlineCount();
}

window.addEventListener('resize', resize);
resize();

function drawMember(member) {
    const isOnline = member.status === 'online';
    let drawX = isOnline ? member.x : (member.offlinePos ? member.offlinePos.x : member.x);
    let drawY = isOnline ? member.y : (member.offlinePos ? member.offlinePos.y : member.y);

    const screenX = (drawX - drawY) * 50 + offset.x;
    const screenY = (drawX + drawY) * 25 + offset.y - 120;

    // 繪製狀態光暈 (僅在線時顯示)
    if (isOnline && member.agentStatus) {
        const statusColor = statusColors[member.agentStatus] || statusColors.idle;
        const gradient = ctx.createRadialGradient(screenX, screenY - 50, 0, screenX, screenY - 50, 80);
        gradient.addColorStop(0, statusColor + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY - 50, 80, 0, Math.PI * 2);
        ctx.fill();
    }

    if (!isOnline) {
        ctx.globalAlpha = 0.5;
        if (!member.offlineImg) ctx.filter = 'grayscale(100%)';
    }

    const imgToDraw = isOnline ? member.img : (member.offlineImg || member.img);
    if (imgToDraw && imgToDraw.complete) {
        const size = member.isBoss ? 200 : 150;
        const yAdjust = member.isBoss ? 40 : 20;
        ctx.drawImage(imgToDraw, screenX - size / 2, screenY - size + yAdjust, size, size);
    }

    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';

    // 名字與角色標籤
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    const labelYOffset = member.isBoss ? 165 : (member.isCustom ? 125 : 80);

    const statusColor = isOnline ? '#00ff00' : '#888';
    const nameWidth = ctx.measureText(member.name).width;
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(screenX - (nameWidth / 2) - 15, screenY - labelYOffset - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // 顯示 Agent 狀態圖示 (僅在線時)
    if (isOnline && member.agentStatus) {
        const statusEmoji = statusEmojis[member.agentStatus] || statusEmojis.idle;
        ctx.font = '12px "Segoe UI"';
        ctx.fillText(statusEmoji, screenX + (nameWidth / 2) + 15, screenY - labelYOffset - 2);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.fillText(member.name, screenX, screenY - labelYOffset);
    ctx.shadowBlur = 0;

    const roleColor = member.isBoss ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 77, 77, 0.8)';
    const textWidth = ctx.measureText(member.role).width;
    ctx.fillStyle = roleColor;
    ctx.fillRect(screenX - (textWidth / 2) - 5, screenY - labelYOffset + 5, textWidth + 10, 16);
    ctx.fillStyle = member.isBoss ? '#000' : '#fff';
    ctx.font = 'bold 10px "Segoe UI"';
    ctx.fillText(member.role, screenX, screenY - labelYOffset + 17);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 動態背景色 (根據 Load 變紅)
    const redIntensity = Math.floor(systemLoad * 50);
    ctx.fillStyle = `rgb(${redIntensity}, ${20 - redIntensity/2}, ${30 - redIntensity/2})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (bgImage.complete) {
        ctx.drawImage(bgImage, offset.x - bgImage.width / 2, offset.y - bgImage.height / 2);
    }

    drawCodes();
    members.forEach(drawMember);

    // 負載自然衰減
    systemLoad = Math.max(0, systemLoad - 0.002);
    if (Math.random() < 0.1) createCode();

    requestAnimationFrame(render);
}

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        offset.x += e.clientX - lastMousePos.x;
        offset.y += e.clientY - lastMousePos.y;
        lastMousePos = { x: e.clientX, y: e.clientY };
    }
});

function addLog(msg, category = 'online') {
    const container = category === 'offline' ? logsOffline : logsOnline;
    if (!container) return;
    const div = document.createElement('div');
    div.className = `log-entry ${category}`;
    div.innerHTML = `<span>${new Date().toLocaleTimeString('zh-TW', { hour12: false })}</span> ${msg}`;
    container.prepend(div);
    if (container.children.length > 50) container.removeChild(container.lastChild);
}

// 後台功能保持不變...
window.openBackstage = function() {
    document.getElementById('backstage-modal').style.display = 'block';
    fetchBackstageData();
};
window.closeBackstage = function() {
    document.getElementById('backstage-modal').style.display = 'none';
};
window.switchBackstageTab = function(tab) {
    document.querySelectorAll('.modal-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const idx = tab === 'dashboard' ? 1 : 2;
    document.querySelector(`.modal-tab:nth-child(${idx})`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
};
window.verifyStaff = function(isStaff) {
    if (isStaff) {
        document.getElementById('staff-verification').style.display = 'none';
        document.getElementById('mood-content').style.display = 'block';
    } else {
        document.getElementById('recruitment-msg').style.display = 'block';
    }
};

async function fetchBackstageData() {
    try {
        const response = await fetch('/api/backstage');
        const data = await response.json();
        document.getElementById('stat-sessions').textContent = data.totalSessions;
        document.getElementById('stat-tokens').textContent = data.totalTokens.toLocaleString();
        document.getElementById('stat-total-cost').textContent = `$${data.totalCost.toFixed(4)}`;
        document.getElementById('stat-input').textContent = data.totalInput.toLocaleString();
        document.getElementById('stat-output').textContent = data.totalOutput.toLocaleString();
        document.getElementById('stat-api-cost').textContent = `$${data.totalCost.toFixed(4)}`;

        const tbody = document.getElementById('member-stats-body');
        tbody.innerHTML = data.members.map(m => `
            <tr>
                <td>${m.name}</td>
                <td>${m.sessions}</td>
                <td>${m.tokens.toLocaleString()}</td>
                <td>$${m.cost.toFixed(4)}</td>
                <td>${m.tasks}</td>
            </tr>
        `).join('');

        const grid = document.getElementById('mood-grid');
        grid.innerHTML = data.moods.map(m => `
            <div class="mood-card">
                <div class="mood-agent">
                    <span>${m.agent}</span>
                    <span class="mood-status" style="color: ${statusColors[m.status] || statusColors.idle}">${statusEmojis[m.status] || statusEmojis.idle} ${m.status}</span>
                    <span class="mood-time">⏱️ 上線 ${m.onlineTime}</span>
                </div>
                <div class="mood-text">"${m.mood}"</div>
            </div>
        `).join('');

        // 獲取每日摘要數據
        fetchDailySummary();
    } catch (err) {}
}

async function fetchDailySummary() {
    try {
        const response = await fetch('/api/backstage/daily?days=7');
        const data = await response.json();
        
        // 更新昨日摘要
        const yesterdayDiv = document.getElementById('yesterday-summary');
        if (yesterdayDiv && data.summary) {
            yesterdayDiv.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">對話次數</span>
                    <span class="stat-value">${data.summary.totalSessions}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">消耗 Tokens</span>
                    <span class="stat-value">${data.summary.totalTokens.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">完成任務</span>
                    <span class="stat-value">${data.summary.totalTasks}</span>
                </div>
            `;
        }

        // 更新趨勢圖 (控制台輸出，實際可用 Chart.js)
        console.log('7日趨勢數據:', data.trend);
    } catch (err) {}
}

render();
