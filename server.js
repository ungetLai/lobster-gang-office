const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 提供靜態檔案服務
app.use(express.static(path.join(__dirname, './')));

// 預留 API 介面：未來可以用來動態寫入 agents.json
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', message: 'Lobster Gang Office is running' });
});

app.listen(PORT, () => {
    console.log(`🦞 Lobster Gang Office is sailing on port ${PORT}`);
});
