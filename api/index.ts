// Entry point serverless function untuk Vercel.
// Semua request ke /api/* diarahkan ke sini (lihat vercel.json), lalu diteruskan
// ke Express app yang sudah berisi semua route (/api/summary, /api/transactions, dll).
import app from '../server';

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
