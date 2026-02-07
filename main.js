const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const logsContainer = document.getElementById('logs');

let offset = { x: 0, y: 0 };
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

// 載入背景圖
const bgImage = new Image();
bgImage.src = 'office-bg.jpg';

// 模擬成員資料 (配合新場景調整座標)
const members = [
    { id: 'main', name: 'Nexora 🦞', x: 2, y: 2, color: '#ff4d4d', role: '幫主', status: 'online' },
    { id: 'sub-writer', name: 'Writer', x: 4, y: 3, color: '#4d94ff', role: '文案代理', status: 'idle' },
    { id: 'sub-n8n', name: 'N8N小幫手', x: 0, y: 5, color: '#4dff88', role: '自動化代理', status: 'offline' },
    { id: 'sub-alex', name: 'Alex', x: 6, y: 1, color: '#f0ff4d', role: '系統開發', status: 'idle' }
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

    // 繪製角色陰影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 繪製像素風角色 (簡單的小人)
    ctx.fillStyle = member.color;
    ctx.fillRect(screenX - 10, screenY - 40, 20, 30); // 身體
    ctx.fillStyle = '#ffdbac'; // 臉部
    ctx.fillRect(screenX - 8, screenY - 35, 16, 10);
    
    // 裝飾
    ctx.fillStyle = '#000';
    ctx.fillRect(screenX - 5, screenY - 32, 2, 2); // 眼
    ctx.fillRect(screenX + 3, screenY - 32, 2, 2);

    // 名字標籤
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.fillText(member.name, screenX, screenY - 60);
    
    // 角色標籤
    ctx.fillStyle = 'rgba(255, 77, 77, 0.8)';
    const textWidth = ctx.measureText(member.role).width;
    ctx.fillRect(screenX - (textWidth/2) - 5, screenY - 55, textWidth + 10, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Segoe UI"';
    ctx.fillText(member.role, screenX, screenY - 43);
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

// 隨機模擬活動
setInterval(() => {
    const member = members[Math.floor(Math.random() * members.length)];
    const actions = ['正在巡視龍蝦牆', '正在沙發區休息', '正在檢查自動化腳本', '正在幫大家點午餐', '正在測試新功能'];
    addLog(`[${member.name}] ${actions[Math.floor(Math.random() * actions.length)]}`);
    
    // 隨機移動 (微調範圍)
    member.x += (Math.random() > 0.5 ? 0.2 : -0.2);
    member.y += (Math.random() > 0.5 ? 0.2 : -0.2);
    member.x = Math.max(0, Math.min(8, member.x));
    member.y = Math.max(0, Math.min(8, member.y));
}, 4000);

render();
