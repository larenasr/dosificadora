// Proxy mínimo para evitar bloqueos CORS entre el navegador y Factory I/O.
// Uso:  node proxy.js   y luego abrir  http://localhost:8080
// Debe estar en la misma carpeta que index.html. No requiere paquetes.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FIO = { host: '127.0.0.1', port: 7410 };   // servidor web de Factory I/O
const HTML = path.join(__dirname, 'index.html');

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const fwd = http.request(
      { ...FIO, path: req.url, method: req.method,
        headers: { 'content-type': req.headers['content-type'] || 'application/json' } },
      r => { res.writeHead(r.statusCode, { 'content-type': r.headers['content-type'] || 'application/json' }); r.pipe(res); }
    );
    fwd.on('error', e => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Factory I/O no responde: ' + e.message }));
    });
    req.pipe(fwd);
    return;
  }
  if (req.url === '/' || req.url.startsWith('/dosificadora')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(HTML).pipe(res);
    return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`HMI en http://localhost:${PORT}  →  Factory I/O en http://${FIO.host}:${FIO.port}`));
