# Api-MahiStream — Vercel Native

API serverless untuk MahiStream yang jalan NATIVE di Vercel (tanpa Puppeteer, FlareSolverr, atau Docker).

## Endpoint

| Endpoint | Deskripsi |
|---|---|
| `/kuramanime/latest?page=1` | List anime terbaru (Kuramanime) |
| `/kuramanime/search?q=naruto&page=1` | Cari anime (Kuramanime) |
| `/kuramanime/genres` | Daftar genre (Kuramanime) |
| `/kuramanime/anime/:id` | Detail anime + episode list (Kuramanime) |
| `/otakudesu/home` | Anime ongoing (Otakudesu) |
| `/otakudesu/search?q=naruto` | Cari anime (Otakudesu) |
| `/otakudesu/anime/:id` | Detail anime + episode list (Otakudesu) |
| `/nekopoi/latest?page=1` | List terbaru (Nekopoi) |

## Deploy

1. Push repo ke GitHub
2. Import ke Vercel — framework: **Other**, root: `./`
3. Build command: kosong (Vercel detect `api/` otomatis)
4. Deploy

## Limitasi (vs VPS backend)

- Streaming episode → butuh Puppeteer → fallback via proxy ke VPS
- User data (history, bookmark, comments) → butuh database → belum diimplementasi
- Rate: Vercel Hobby 10s timeout, 100GB egress/bulan
