# Print Label — GS 2208D

Aplikasi web untuk mencetak label food-safety (mirip PrepSafe) ke printer
thermal **GS 2208D**, ukuran kertas **55mm x 30mm**. Halaman cetak mengirim
perintah **TSPL** langsung ke printer dari browser lewat **WebUSB**.

Di balik login ada **Data Master**: Company, Region, Store, Category, Item,
dan Clerk. Halaman cetak (`/`) mengambil daftar Clerk/Category/Item dari data
master itu — staf tinggal pilih Clerk (foto), Category, lalu Item, dan
tanggal kedaluwarsa dihitung otomatis dari `Shelf Life`/`TodayPlusShelfLife`
milik Item tersebut.

## Stack

- Next.js (App Router, TypeScript) di Vercel.
- PostgreSQL lewat Prisma ORM (7.x) — cocok untuk Vercel Postgres (Neon).
- Auth.js (NextAuth v5), Credentials login, session JWT.
- Vercel Blob untuk foto Clerk & Item.

## Setup awal

### 1. Provision Postgres & Blob storage

Di dashboard project Vercel Anda, tab **Storage**:

1. Buat database **Postgres** (Neon). Anda akan diberi dua connection
   string — satu dengan `-pooler` di hostname (pooled) dan satu tanpa
   (direct/unpooled).
2. Buat **Blob** store.
3. `vercel link` lalu `vercel env pull .env.local` di project ini supaya
   semua env var tersebut otomatis masuk ke `.env.local`. Atau salin manual
   dari `.env.example` ke `.env` dan isi sendiri — lihat komentar di file itu
   untuk tahu connection string mana yang pooled vs direct.

### 2. Migrasi & seed database

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

`prisma db seed` membuat satu Company, satu Store, dan satu user
`COMPANY_ADMIN` dari `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`/
`SEED_COMPANY_NAME`/`SEED_STORE_NAME` di `.env` — ini satu-satunya cara
membuat akun admin pertama, tidak ada halaman sign-up publik.

### 3. Jalankan lokal

```bash
npm run dev
```

Buka [http://localhost:3000/login](http://localhost:3000/login), masuk
dengan kredensial seed di atas.

## Mengisi Data Master

Setelah login, buka **Administration** di nav bar:

1. **Company** — cek/ubah nama company Anda.
2. **Regions** (opsional) — kelompok Store, misalnya per area.
3. **Stores** — outlet/dapur, mis. "Aston Cilegon Kitchen". Clerk terikat ke
   Store.
4. **Categories** — dipakai bersama semua Store dalam satu Company (bisa
   dibatasi ke satu Region).
5. **Items** — di dalam Category, isi `Shelf Life` (jam) dan centang
   `TodayPlusShelfLife` kalau masa simpannya dihitung dari awal hari ini,
   bukan dari jam saat dicetak. `Defrost Life`/`Direct Defrost` tersedia di
   form tapi **belum** memengaruhi perhitungan tanggal exp otomatis (lihat
   Batasan di bawah).
6. **Clerks** — staf yang muncul sebagai pilihan foto di halaman cetak.

Halaman cetak (`/`) otomatis menampilkan data yang baru dibuat begitu ada
minimal 1 Store dan 1 Category (dengan Item aktif di dalamnya).

## Syarat browser (halaman cetak)

- **Chrome atau Edge terbaru.** WebUSB tidak didukung Safari maupun Firefox.
- **HTTPS**, kecuali di `localhost` saat development. Deploy ke Vercel sudah
  otomatis HTTPS.
- Tombol "Hubungkan Printer" harus diklik langsung oleh user (syarat browser
  untuk WebUSB) — tidak bisa dipicu otomatis dari kode.

## Menghubungkan printer

1. Colokkan GS 2208D via USB ke komputer yang menjalankan browser.
2. Buka aplikasi, klik **Hubungkan Printer**, pilih printer dari dialog yang
   muncul.
3. Kunjungan berikutnya, aplikasi otomatis mencoba menyambung ulang ke
   printer yang sama tanpa perlu klik ulang (selama browser & origin sama).

### Windows: printer tidak muncul / gagal terhubung

Windows biasanya memasang driver bawaan **"USB Printing Support"**
(`usbprint.sys`) untuk printer USB, dan driver ini menguasai perangkat secara
eksklusif — WebUSB tidak bisa mengambil alih koneksi selama driver itu masih
terpasang untuk device tersebut. Kalau muncul error terkait koneksi/driver
saat menghubungkan:

1. Download [Zadig](https://zadig.akeo.ie/).
2. Jalankan Zadig, aktifkan **Options → List All Devices**.
3. Pilih GS 2208D dari daftar device.
4. Ganti driver-nya ke **WinUSB**, lalu klik **Replace Driver**.
5. Cabut-colok ulang printer, lalu coba **Hubungkan Printer** lagi di
   aplikasi.

Ini hanya mengganti driver untuk keperluan raw-printing dari browser pada
device tersebut — tidak memengaruhi printer/device USB lain di komputer yang
sama. Kalau nanti printer perlu dipakai lagi lewat aplikasi Windows biasa
(bukan browser ini), driver bisa dikembalikan lewat Device Manager.

macOS dan Linux umumnya tidak mengalami masalah ini karena tidak ada driver
printer class bawaan yang mengklaim device secara eksklusif.

## Kustomisasi posisi label

Generator perintah TSPL ada di [`lib/tspl.ts`](lib/tspl.ts). Ukuran kertas,
posisi teks (`x,y` dalam dot, 8 dot = 1mm pada resolusi 203dpi), dan ukuran
font (`multiplier`) semuanya konstanta di file itu. Kalau posisi teks meleset
di label fisik (tergantung kalibrasi gap sensor tiap unit printer), sesuaikan
angka `x,y` di sana lalu tes ulang cetak.

## Deploy ke Vercel

```bash
npx vercel --prod
```

Atau hubungkan repo ini ke [Vercel](https://vercel.com/new) lewat dashboard
untuk deploy otomatis tiap push. Pastikan environment variable di
`.env.example` sudah diisi di project Vercel (Storage tab biasanya mengisi
`DATABASE_URL`/`DIRECT_URL`/`BLOB_READ_WRITE_TOKEN` otomatis saat resource
dibuat lewat dashboard). Jalankan `npx prisma migrate deploy` (bukan
`migrate dev`) terhadap database production sebelum atau saat deploy pertama.

Setelah deploy, login dan ulangi tes hubungkan printer & cetak dari domain
Vercel (HTTPS) untuk memastikan WebUSB tetap berfungsi di production.

## Batasan versi ini

- Role `SUPER_ADMIN` (multi-company) ada di schema tapi belum ada UI-nya —
  setiap login `COMPANY_ADMIN` hanya mengelola satu Company miliknya sendiri.
- `Defrost Life`/`Direct Defrost` di Item tersimpan tapi belum memengaruhi
  perhitungan tanggal kedaluwarsa otomatis di halaman cetak (hanya
  `Shelf Life` + `TodayPlusShelfLife` yang dipakai).
- Tidak ada riwayat/log label yang pernah dicetak.
- Satu printer aktif per browser/perangkat pada satu waktu.
