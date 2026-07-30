# Print Label — GS 2208D

Aplikasi web untuk mencetak label food-safety (mirip PrepSafe) ke printer
thermal **GS 2208D**, ukuran kertas **56mm x 26mm** (diukur langsung dari
label fisik — lihat `LABEL_WIDTH_MM`/`LABEL_HEIGHT_MM` di
[`lib/tspl.ts`](lib/tspl.ts) kalau ganti ukuran label). Halaman cetak
mengirim perintah **TSPL** langsung ke printer dari browser lewat **WebUSB**.

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

1. Buat database **Postgres** (Neon) dan hubungkan ke project ini. Vercel
   otomatis menambahkan `DATABASE_URL` (pooled, dipakai app saat runtime) dan
   `DATABASE_URL_UNPOOLED` (direct, dipakai Prisma CLI untuk migrasi — lihat
   `prisma.config.ts`), plus alias `POSTGRES_*`/`PG*` lain yang tidak perlu
   disentuh.
2. Buat **Blob** store dan hubungkan ke project ini. Vercel otomatis
   menambahkan `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN` — `@vercel/blob`
   memakai OIDC ini otomatis saat jalan di Vercel, tidak perlu token statis.
3. Set `AUTH_SECRET` (`openssl rand -base64 32` atau `npx auth secret`) dan
   `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`/`SEED_COMPANY_NAME`/
   `SEED_STORE_NAME` lewat `vercel env add <NAMA> production preview
   development --value "..."` atau dashboard Settings → Environment
   Variables.

**Catatan:** Vercel menandai `DATABASE_URL`/`DATABASE_URL_UNPOOLED` dan
variabel Postgres lain sebagai *Sensitive* — nilainya tidak bisa ditarik ke
lokal lewat `vercel env pull` (hanya muncul `"[SENSITIVE]"`). Karena itu
migrasi & seed **tidak** dijalankan manual dari lokal, tapi otomatis lewat
script `vercel-build` (lihat `package.json`) setiap kali Vercel build,
memakai nilai asli yang cuma tersedia di lingkungan build/runtime Vercel.
`prisma db seed` aman dijalankan berulang — skip otomatis kalau
`SEED_ADMIN_EMAIL` sudah ada.

### 2. Deploy

```bash
npx vercel --prod
```

Atau hubungkan repo ke [Vercel](https://vercel.com/new) lewat dashboard
untuk deploy otomatis tiap push ke `main`.

### 3. Matikan "Vercel Authentication" (deployment protection)

Secara default Vercel memasang SSO wall miliknya sendiri di depan URL
`*.vercel.app` (terpisah dari `/login` aplikasi ini) — ini akan memblokir
staf hotel yang belum punya akun di tim Vercel Anda. Kalau belum pakai
custom domain (yang otomatis bebas dari wall ini), matikan di
**Project Settings → Deployment Protection → Vercel Authentication**, atau
lewat API:

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/<PROJECT_ID>" \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"ssoProtection": null}'
```

### 4. Jalankan lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000/login](http://localhost:3000/login), masuk
dengan kredensial `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`. Lokal tetap
butuh koneksi ke Postgres production yang sama (tidak ada DB lokal
terpisah) — jalankan `vercel env pull` untuk environment `development` agar
`AUTH_SECRET` dkk tersedia; nilai Postgres/Blob tidak akan ikut ter-pull
(sensitive), jadi fitur yang butuh DB (login, data master, halaman cetak)
hanya benar-benar bisa dites dari deployment Vercel, bukan `npm run dev` di
lokal, kecuali Anda menambahkan `DATABASE_URL`/`DATABASE_URL_UNPOOLED`
sendiri ke environment `development`.

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
   bukan dari jam saat dicetak. Isi `Defrost Life`/`Direct Defrost` (jam)
   kalau item ini juga bisa di-thaw — begitu salah satunya diisi, halaman
   cetak menampilkan pilihan mode **Prep Normal** vs **Thawing**, dan mode
   Thawing menghitung EXP dari durasi itu (bukan Shelf Life), mengganti label
   baris jadi **OOF**/**Prep By**, serta mencetak tag `THAWING` sejajar di
   sebelah baris Prep By (bukan baris terpisah).
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

## Kalibrasi label (margin & jarak baris)

Setiap **Store** punya pengaturan margin cetak sendiri (atas/bawah/kiri/kanan
dalam mm) plus **jarak antar baris** (mm) — edit di
**Administration → Stores → Edit**. Ukuran font tiap
baris (nama, EXP, prep, clerk) dihitung otomatis untuk memenuhi ruang yang
tersisa setelah margin itu — jadi menaikkan margin akan mengecilkan teks
(memberi ruang kosong lebih di tepi), sedangkan menurunkan margin akan
membesarkan teks (mepet ke tepi). Kalau teks kepotong di salah satu sisi,
naikkan margin sisi itu; kalau masih banyak ruang kosong, turunkan.

Preview di halaman cetak memakai margin Store yang sedang dipilih dan dijamin
sama persis dengan yang akan tercetak (lihat `buildLabelElements` di
[`lib/tspl.ts`](lib/tspl.ts) — dipakai bersama oleh preview & generator TSPL).

Di form Store yang sama juga ada **Ukuran Font (mult)** per field (Nama,
Prep/OOF, EXP/Prep By, Clerk, Status) — kosongkan untuk Otomatis, atau isi
angka untuk memaksa ukuran itu persis (field lain yang masih Otomatis akan
menyesuaikan ke sisa ruang yang ada). "Status" di sini mengatur ukuran tag
`THAWING` yang tercetak sejajar di sebelah baris EXP/Prep By, bukan baris
tersendiri — Otomatis berarti ukurannya sama dengan baris EXP/Prep By.

Constants lain (ukuran kertas 56x26mm, resolusi 8 dot/mm) ada di
[`lib/tspl.ts`](lib/tspl.ts) kalau perlu diubah untuk printer/label lain.

Setelah deploy (lihat "Setup awal" di atas), login dan ulangi tes hubungkan
printer & cetak dari domain Vercel (HTTPS) untuk memastikan WebUSB tetap
berfungsi di production.

## Batasan versi ini

- Role `SUPER_ADMIN` (multi-company) ada di schema tapi belum ada UI-nya —
  setiap login `COMPANY_ADMIN` hanya mengelola satu Company miliknya sendiri.
- Kalau Item punya Defrost Life DAN Direct Defrost sekaligus, keduanya
  ditampilkan sebagai pilihan mode terpisah — tidak ada logika yang memilih
  otomatis di antara keduanya.
- Tidak ada riwayat/log label yang pernah dicetak.
- Satu printer aktif per browser/perangkat pada satu waktu.
