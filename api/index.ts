// Entry point serverless function untuk Vercel.
// Semua request ke /api/* diarahkan ke sini (lihat vercel.json), lalu diteruskan
// ke Express app di file app.ts (satu folder yang sama).
// PENTING: karena package.json punya "type": "module", import file lokal WAJIB
// pakai ekstensi .js (bukan .ts) meski source file-nya .ts — ini aturan Node ESM,
// bukan typo. Setelah dikompilasi, app.ts menjadi app.js.
import app from './app.js';

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
