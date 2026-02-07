const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const logsContainer = document.getElementById('logs');

let offset = { x: 0, y: 0 };
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

// 載入資源
const bgImage = new Image();
bgImage.src = 'office-bg.jpg';

const nexoraImg = new Image();
nexoraImg.src = 'nexora-boss.jpg';

// 模擬成員資料
const members = [
    { id: 'main', name: 'Nexora 🦞', x: 2, y: 3.5, color: '#ff4d4d', role: '龍蝦幫幫主', status: 'online', isBoss: true },
    { id: 'sub-writer', name: 'Writer', x: 4.5, y: 4, color: '#4d94ff', role: '文案代理', status: 'idle' },
    { id: 'sub-n8n', name: 'N8N小幫手', x: 1, y: 6, color: '#4dff88', role: '自動化代理', status: 'offline' },
    { id: 'sub-alex', name: 'Alex', x: 6, y: 2, color: '#f0ff4d', role: '系統開發', status: 'idle' }
];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offset.x = canvas.width / 2;
    offset.y = canvas.height / 2;
}

window.addEventListener('resize', resize);
resize();

function drawMember(member) {
    // 配合背景圖的等軸角度進行偏移計算
    const screenX = (member.x - member.y) * 50 + offset.x;
    const screenY = (member.x + member.y) * 25 + offset.y - 120;

    if (member.isBoss && nexoraImg.complete) {
        // 繪製幫主專屬辦公圖案 (主管位)
        const bossW = 100;
        const bossH = 100;
        ctx.drawImage(nexoraImg, screenX - bossW / 2, screenY - bossH + 20, bossW, bossH);
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

    // 名字與角色標籤
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.fillText(member.name, screenX, screenY - (member.isBoss ? 85 : 60));
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = member.isBoss ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 77, 77, 0.8)';
    const textWidth = ctx.measureText(member.role).width;
    ctx.fillRect(screenX - (textWidth/2) - 5, screenY - (member.isBoss ? 80 : 55), textWidth + 10, 16);
    ctx.fillStyle = member.isBoss ? '#000' : '#fff';
    ctx.font = 'bold 10px "Segoe UI"';
    ctx.fillText(member.role, screenX, screenY - (member.isBoss ? 68 : 43));
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

function addLog(msg) {
    if (!logsContainer) return;
    const div = document.createElement('div');
    div.className = 'log-entry';
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    div.innerHTML = `<span>${time}</span> ${msg}`;
    logsContainer.prepend(div);
}

setInterval(() => {
    const member = members[Math.floor(Math.random() * members.length)];
    const bossActions = ['正在喝著頂級藍山咖啡', '正在審閱龍蝦幫年度計畫', '盯著螢幕運籌帷幄', '正在考慮幫成員加薪'];
    const actions = member.isBoss ? bossActions : ['正在巡視龍蝦牆', '正在沙發區休息', '正在檢查自動化腳本', '正在測試新功能'];
    addLog(`[${member.name}] ${actions[Math.floor(Math.random() * actions.length)]}`);
    
    if (!member.isBoss) {
        member.x += (Math.random() > 0.5 ? 0.2 : -0.2);
        member.y += (Math.random() > 0.5 ? 0.2 : -0.2);
        member.x = Math.max(0, Math.min(8, member.x));
        member.y = Math.max(0, Math.min(8, member.y));
    }
}, 4000);

render();
