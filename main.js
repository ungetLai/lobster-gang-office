const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const logsContainer = document.getElementById('logs');

const TILE_W = 64;
const TILE_H = 32;
const MAP_SIZE = 10;

let offset = { x: 0, y: 0 };
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

// 模擬成員資料 (可透過 sync_agents.py 動態更新)
const members = [
    { id: 'main', name: 'Nexora 🦞', x: 2, y: 2, color: '#ff4d4d', role: '幫主', status: 'online' },
    { id: 'sub-writer', name: 'Writer', x: 5, y: 3, color: '#4d94ff', role: '文案代理', status: 'idle' },
    { id: 'sub-n8n', name: 'N8N小幫手', x: 1, y: 6, color: '#4dff88', role: '自動化代理', status: 'offline' },
    { id: 'sub-alex', name: 'Alex', x: 7, y: 2, color: '#f0ff4d', role: '系統開發', status: 'idle' }
];

async function updateAgentStatus() {
    try {
        // 這裡預留給未來串接真實 API (例如 OpenClaw API)
        // 目前先模擬從本地 agents.json 讀取
        const response = await fetch('agents.json');
        if (response.ok) {
            const data = await response.json();
            // 更新成員座標或狀態...
        }
    } catch (e) {
        // 如果沒有 agents.json 則維持現狀
    }
}
setInterval(updateAgentStatus, 5000);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offset.x = canvas.width / 2;
    offset.y = canvas.height / 4;
}

window.addEventListener('resize', resize);
resize();

// 繪製等軸測瓷磚
function drawTile(x, y, color, height = 0) {
    const screenX = (x - y) * (TILE_W / 2) + offset.x;
    const screenY = (x + y) * (TILE_H / 2) + offset.y - height;

    // 繪製頂部
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + TILE_W / 2, screenY + TILE_H / 2);
    ctx.lineTo(screenX, screenY + TILE_H);
    ctx.lineTo(screenX - TILE_W / 2, screenY + TILE_H / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.stroke();

    // 繪製側面 (增加立體感)
    if (height > 0) {
        // 左面
        ctx.beginPath();
        ctx.moveTo(screenX - TILE_W / 2, screenY + TILE_H / 2);
        ctx.lineTo(screenX, screenY + TILE_H);
        ctx.lineTo(screenX, screenY + TILE_H + height);
        ctx.lineTo(screenX - TILE_W / 2, screenY + TILE_H / 2 + height);
        ctx.closePath();
        ctx.fillStyle = shadeColor(color, -20);
        ctx.fill();

        // 右面
        ctx.beginPath();
        ctx.moveTo(screenX + TILE_W / 2, screenY + TILE_H / 2);
        ctx.lineTo(screenX, screenY + TILE_H);
        ctx.lineTo(screenX, screenY + TILE_H + height);
        ctx.lineTo(screenX + TILE_W / 2, screenY + TILE_H / 2 + height);
        ctx.closePath();
        ctx.fillStyle = shadeColor(color, -40);
        ctx.fill();
    }
}

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

function drawMember(member) {
    const screenX = (member.x - member.y) * (TILE_W / 2) + offset.x;
    const screenY = (member.x + member.y) * (TILE_H / 2) + offset.y - 10;

    // 繪製簡單角色 (像素風圓形/方塊)
    ctx.fillStyle = member.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 名字標籤
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(member.name, screenX, screenY - 40);
    
    // 角色標籤
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const textWidth = ctx.measureText(member.role).width;
    ctx.fillRect(screenX - (textWidth/2) - 5, screenY - 15, textWidth + 10, 16);
    ctx.fillStyle = '#aaa';
    ctx.fillText(member.role, screenX, screenY - 2);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製地圖
    for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
            const isWall = x === 0 || y === 0;
            const color = isWall ? '#555' : '#3d4a5d';
            const h = isWall ? 40 : 5;
            drawTile(x, y, color, h);
        }
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
    const div = document.createElement('div');
    div.className = 'log-entry';
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    div.innerHTML = `<span>${time}</span> ${msg}`;
    logsContainer.prepend(div);
}

// 隨機模擬活動
setInterval(() => {
    const member = members[Math.floor(Math.random() * members.length)];
    const actions = ['正在處理 REST API', '正在優化前端', '正在喝咖啡', '正在與主人通話', '正在巡視機房'];
    addLog(`[${member.name}] ${actions[Math.floor(Math.random() * actions.length)]}`);
    
    // 隨機移動
    member.x += (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.8 ? 1 : 0);
    member.y += (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.8 ? 1 : 0);
    member.x = Math.max(1, Math.min(MAP_SIZE - 1, member.x));
    member.y = Math.max(1, Math.min(MAP_SIZE - 1, member.y));
}, 3000);

render();
