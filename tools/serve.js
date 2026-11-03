// Servidor estático local: node tools/serve.js [porta]
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.resolve(__dirname, '..');
const porta = Number(process.argv[2]) || 8000;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
    const alvo = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
    const arq = fs.existsSync(alvo) && fs.statSync(alvo).isDirectory() ? path.join(alvo, 'index.html') : alvo;
    if (!arq.startsWith(raiz) || !fs.existsSync(arq)) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(arq).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(arq).pipe(res);
}).listen(porta, '127.0.0.1', () => console.log(`http://localhost:${porta}`));
