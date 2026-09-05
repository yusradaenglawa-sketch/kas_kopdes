// Entry point serverless function untuk Vercel.
// Semua request ke /api/* diarahkan ke sini (lihat vercel.json), lalu diteruskan
// ke Express app di file app.ts (satu folder yang sama, supaya aman saat di-bundle).
import app from './app';

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
