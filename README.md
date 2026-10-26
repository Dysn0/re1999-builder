# Reverse: 1999 — Roster, Team & Resonance Builder

Aplikasi web **Full-Stack** untuk membantu pemain **Reverse: 1999** mencatat koleksi karakter (*Roster*), menyusun tim terbaik berdasarkan sinergi gaya bertarung (*Dynamo*, *Bloodtithe*, *Follow-Up*, dll.) & keunggulan elemen (*Afflatus 1.3×*), serta merancang susunan *Resonance* ($7 \times 7$ Grid).

Dibangun sebagai proyek pembelajaran **Backend Development (Go & SQL)** dan **Modern Frontend (React & TypeScript)**.

---

## Fitur Utama

1. **Koleksi Karakter & Build Tracker (129 Karakter & Psychube 6★):**
   - Filter cepat berdasarkan nama, elemen (*Afflatus*), dan gaya bertarung (*Archetype*).
   - Pencatatan build karakter (*Insight 0–III*, *Level*, *Portray P0–P5*, *Resonance Lv.1–15*, *Pola Modulasi*, dan *Psychube*).
2. **Smart Team Builder:**
   - Rekomendasi formasi 4 slot otomatis berdasarkan *Archetype* dan kelemahan elemen lawan (*Afflatus Advantage 1.3×*).
   - Penyimpanan formasi tim ke database SQLite menggunakan transaksi SQL (`BEGIN` / `COMMIT`).
3. **Dual-Mode Resonance Builder:**
   - **Mode Cepat (Pemula):** Rekomendasi instan 6 Pola Stat (*Elucidation*, *Placidity*, *Stupefaction*, *Hyperphrenia*, *Genuinity*, *Aspirational*).
   - **Mode Papan Puzzle ($7 \times 7$ Grid):** Susun kepingan balok Resonance secara interaktif dengan kalkulasi bonus stat *real-time*.

---

## Tech Stack

- **Backend:** Go (`net/http` standard library routing, `database/sql` Raw SQL, `//go:embed`)
- **Database:** SQLite (`modernc.org/sqlite` — Pure Go, tanpa dependensi C/CGO)
- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons

---

## Cara Menjalankan di Lokal

### 1. Jalankan Backend (Go)
```bash
cd backend
go run ./cmd/server
```
Server REST API akan berjalan di `http://localhost:8080` dan otomatis membuat serta mengisi database `backend/data/r1999.db`.

### 2. Jalankan Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Buka `http://localhost:5173` di browser.
