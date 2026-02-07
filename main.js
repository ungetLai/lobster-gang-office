const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const logsOnline = document.getElementById('logs-online');
const logsOffline = document.getElementById('logs-offline');

let offset = { x: 0, y: 0 };
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

// 載入資源
const bgImage = new Image();
bgImage.src = 'office-bg.jpg';

const nexoraImg = new Image();
nexoraImg.src = 'nexora-boss.png';

const nexoraOfflineImg = new Image();
nexoraOfflineImg.src = 'nexora-offline.png';

const looploomImg = new Image();
looploomImg.src = 'looploom.png';

const looploomOfflineImg = new Image();
looploomOfflineImg.src = 'looploom-offline.png';

const signalscoutImg = new Image();
signalscoutImg.src = 'signalscout.png';

const signalscoutOfflineImg = new Image();
signalscoutOfflineImg.src = 'signalscout-offline.png';

const shadowledgerImg = new Image();
shadowledgerImg.src = 'shadowledger.png';

const shadowledgerOfflineImg = new Image();
shadowledgerOfflineImg.src = 'shadowledger-offline.png';

// 模擬成員資料
const members = [
    { id: 'main', name: 'Nexora 🦞', x: 2, y: 3.2, color: '#ff4d4d', role: '龍蝦幫幫主', status: 'offline', isBoss: true, img: nexoraImg, offlineImg: nexoraOfflineImg, offlinePos: { x: 4.2, y: 1.2 } },
    { id: 'looploom', name: 'LoopLoom 🕷️', x: 2, y: 9, color: '#ff0000', role: '專案開發專家', status: 'offline', isCustom: true, img: looploomImg, offlineImg: looploomOfflineImg, offlinePos: { x: 8, y: 7 } },
    { id: 'signalscout', name: 'SignalScout 🦎', x: 2.3, y: 6.3, color: '#00ff00', role: '專案企劃大師', status: 'offline', isCustom: true, img: signalscoutImg, offlineImg: signalscoutOfflineImg, offlinePos: { x: 6.1, y: 4.2 } },
    { id: 'shadowledger', name: 'ShadowLedger 🦉', x: 6, y: 9, color: '#ffa500', role: '財務大總管', status: 'offline', isCustom: true, img: shadowledgerImg, offlineImg: shadowledgerOfflineImg, offlinePos: { x: 9, y: 4 } },
];

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
            if (statuses[member.id] && member.status !== statuses[member.id]) {
                member.status = statuses[member.id];
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

// 每 10 秒檢查一次狀態
setInterval(fetchMemberStatus, 10000);

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
    
    // 計算繪製座標
    let drawX = member.x;
    let drawY = member.y;
    
    if (!isOnline && member.offlinePos) {
        drawX = member.offlinePos.x;
        drawY = member.offlinePos.y;
    }

    // 配合背景圖的等軸角度進行偏移計算
    const screenX = (drawX - drawY) * 50 + offset.x;
    const screenY = (drawX + drawY) * 25 + offset.y - 120;

    // 繪製離線半透明效果
    if (!isOnline) {
        ctx.globalAlpha = 0.5;
        // 如果有專屬離線圖案，就不套用灰階濾鏡，保持圖案原色
        if (!member.offlineImg) {
            ctx.filter = 'grayscale(100%)';
        }
    }

    if (member.isBoss) {
        // 繪製幫主專屬辦公圖案 (主管位，放大兩倍且去背)
        const imgToDraw = isOnline ? member.img : (member.offlineImg || member.img);
        if (imgToDraw && imgToDraw.complete) {
            const bossW = 200;
            const bossH = 200;
            ctx.drawImage(imgToDraw, screenX - bossW / 2, screenY - bossH + 40, bossW, bossH);
        }
    } else if (member.isCustom) {
        // 繪製自定義成員 (如 LoopLoom, ShadowLedger)
        const imgToDraw = isOnline ? member.img : (member.offlineImg || member.img);
        if (imgToDraw && imgToDraw.complete) {
            const charW = 150;
            const charH = 150;
            ctx.drawImage(imgToDraw, screenX - charW / 2, screenY - charH + 20, charW, charH);
        }
    } else {
        // 繪製其他成員 (像素風小人)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = member.color;
        ctx.fillRect(screenX - 10, screenY - 40, 20, 30);
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(screenX - 8, screenY - 35, 16, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX - 5, screenY - 32, 2, 2);
        ctx.fillRect(screenX + 3, screenY - 32, 2, 2);
    }

    // 重置濾鏡
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';

    // 名字與角色標籤
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    const labelYOffset = member.isBoss ? 165 : (member.isCustom ? 125 : 80);

    // 繪製狀態小圓點
    const statusColor = isOnline ? '#00ff00' : '#888';
    const nameWidth = ctx.measureText(member.name).width;
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(screenX - (nameWidth / 2) - 15, screenY - labelYOffset - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillText(member.name, screenX, screenY - labelYOffset);
    ctx.shadowBlur = 0;

    ctx.fillStyle = member.isBoss ? 'rgba(255, 215, 0, 0.9)' : (member.id === 'looploom' ? 'rgba(138, 43, 226, 0.8)' : (member.id === 'signalscout' ? 'rgba(34, 139, 34, 0.8)' : (member.id === 'shadowledger' ? 'rgba(255, 140, 0, 0.8)' : 'rgba(255, 77, 77, 0.8)')));
    const textWidth = ctx.measureText(member.role).width;
    ctx.fillRect(screenX - (textWidth / 2) - 5, screenY - labelYOffset + 5, textWidth + 10, 16);
    ctx.fillStyle = member.isBoss ? '#000' : '#fff';
    ctx.font = 'bold 10px "Segoe UI"';
    ctx.fillText(member.role, screenX, screenY - labelYOffset + 17);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage.complete) {
        const scale = 1.0;
        const imgW = bgImage.width * scale;
        const imgH = bgImage.height * scale;
        ctx.drawImage(bgImage, offset.x - imgW / 2, offset.y - imgH / 2, imgW, imgH);
    }

    // 繪製成員
    members.forEach(drawMember);

    requestAnimationFrame(render);
}

// 互動邏輯
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => isDragging = false);

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        offset.x += dx;
        offset.y += dy;
        lastMousePos = { x: e.clientX, y: e.clientY };
    }
});

function addLog(msg, category = 'online') {
    const container = category === 'online' ? logsOnline : logsOffline;
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = `log-entry ${category}`;
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    div.innerHTML = `<span>${time}</span> ${msg}`;
    
    container.prepend(div);
    
    // 限制日誌數量
    if (container.children.length > 50) {
        container.removeChild(container.lastChild);
    }
}

setInterval(() => {
    const onlineMembers = members.filter(m => m.status === 'online');
    const offlineMembers = members.filter(m => m.status !== 'online');
    
    // 隨機挑選一名成員
    const member = members[Math.floor(Math.random() * members.length)];
    if (!member) return;

    const isOnline = member.status === 'online';
    
    if (isOnline) {
        // 在線成員：工作訊息
        const bossActions = ['正在喝著頂級藍山咖啡', '正在審閱龍蝦幫年度計畫', '盯著螢幕運籌帷幄', '正在考慮幫成員加薪'];
        const spiderActions = ['正在重構核心代碼', '優化資料庫查詢性能', '部署新的微服務單元', '正在進行壓力測試'];
        const chameleonActions = ['正在調整專案排程', '觀察市場趨勢中...', '正在優化團隊工作流', '擬定下一階段開發計畫'];
        const owlActions = ['正在核對龍蝦金庫帳目', '計算專案投資回報率', '正在優化團隊預算分配', '盯著股市盤後數據'];
        const actions = member.isBoss ? bossActions : (member.id === 'looploom' ? spiderActions : (member.id === 'signalscout' ? chameleonActions : (member.id === 'shadowledger' ? owlActions : ['正在巡視龍蝦牆', '正在沙發區休息', '正在檢查自動化腳本', '正在測試新功能'])));
        addLog(`[${member.name}] ${actions[Math.floor(Math.random() * actions.length)]}`, 'online');
    } else {
        // 離線成員：輕鬆俏皮的訊息
        const chillMessages = [
            '下週該去哪裡玩呢？',
            '這遊戲好難啊啊～',
            '想吃門口那家拉麵了...',
            '咖啡機是不是該洗了？',
            '今天天氣真不錯，適合發呆。',
            '有人要一起訂珍奶嗎？',
            '剛才好像看到龍蝦在飛...',
            '睡個午覺應該沒人發現吧？'
        ];
        addLog(`[${member.name}] (遠端) ${chillMessages[Math.floor(Math.random() * chillMessages.length)]}`, 'offline');
    }

    if (isOnline && !member.isBoss && !member.isCustom) {
        member.x += (Math.random() > 0.5 ? 0.2 : -0.2);
        member.y += (Math.random() > 0.5 ? 0.2 : -0.2);
        member.x = Math.max(0, Math.min(8, member.x));
        member.y = Math.max(0, Math.min(8, member.y));
    }
}, 4000);

render();
