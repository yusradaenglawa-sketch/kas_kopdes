import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import app from './api/app';

const PORT = 3000;

// ---------------------------------------------
// Vite Middleware (dev) / Static Serving (production di luar Vercel, misal Railway/Render)
// ---------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kas Kopdes server running at http://0.0.0.0:${PORT}`);
  });
}

// File ini (server.ts) TIDAK dipakai oleh Vercel sama sekali.
// Vercel menjalankan api/index.ts -> api/app.ts sebagai serverless function.
// server.ts ini hanya untuk: development lokal (npm run dev) dan
// deployment ke platform server tradisional seperti Railway/Render (npm start).
start();
