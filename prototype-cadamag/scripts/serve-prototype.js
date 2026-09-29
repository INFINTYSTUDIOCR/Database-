const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const port = Number(process.env.PORT || 57736);

const ct = {
  '.html': 'text/html;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.js': 'text/javascript;charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  const f = path.normalize(path.join(root, u));
  if (!f.startsWith(root)) {
    res.writeHead(403);
    return res.end();
  }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) {
      res.writeHead(404);
      return res.end('404 ' + u);
    }
    const type = ct[path.extname(f).toLowerCase()] || 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes'
    };
    if (req.method === 'HEAD') {
      res.writeHead(200, Object.assign({}, headers, { 'Content-Length': st.size }));
      return res.end();
    }
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : st.size - 1;
      res.writeHead(206, Object.assign({}, headers, {
        'Content-Length': end - start + 1,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + st.size
      }));
      fs.createReadStream(f, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, Object.assign({}, headers, { 'Content-Length': st.size }));
    fs.createReadStream(f).pipe(res);
  });
}).listen(port, () => {
  console.log('ok http://localhost:' + port + '/prototype-cadamag/?v=20260927video');
});
