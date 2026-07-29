# Print Label — GS 2208D

Aplikasi web untuk mencetak label food-safety (mirip PrepSafe) ke printer
thermal **GS 2208D**, ukuran kertas **55mm x 30mm**. Aplikasi mengirim
perintah **TSPL** langsung ke printer dari browser lewat **WebUSB** — tidak
ada server backend, tidak ada database, tidak ada login (v1).

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Syarat browser

- **Chrome atau Edge terbaru.** WebUSB tidak didukung Safari maupun Firefox.
- **HTTPS**, kecuali di `localhost` saat development. Deploy ke Vercel sudah
  otomatis HTTPS jadi tidak perlu setup tambahan.
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

## Kustomisasi isi & posisi label

Generator perintah TSPL ada di [`lib/tspl.ts`](lib/tspl.ts). Ukuran kertas,
posisi teks (`x,y` dalam dot, 8 dot = 1mm pada resolusi 203dpi), dan ukuran
font (`multiplier`) semuanya konstanta di file itu. Kalau posisi teks meleset
di label fisik (tergantung kalibrasi gap sensor tiap unit printer), sesuaikan
angka `x,y` di sana lalu tes ulang cetak — biasanya cukup satu-dua kali
iterasi sambil melihat hasil cetak fisiknya.

## Deploy ke Vercel

```bash
npx vercel --prod
```

Atau hubungkan repo ini ke [Vercel](https://vercel.com/new) lewat dashboard
untuk deploy otomatis tiap push. Tidak ada environment variable yang perlu
diset untuk v1 (tanpa database/auth).

Setelah deploy, ulangi tes hubungkan printer & cetak dari domain Vercel
(HTTPS) untuk memastikan WebUSB tetap berfungsi di production, bukan cuma di
`localhost`.

## Batasan versi ini (v1)

- Tanpa login/akun user.
- Tanpa riwayat label yang tersimpan — setiap cetak bersifat sekali pakai,
  tidak ada log ke database.
- Satu printer aktif per browser/perangkat pada satu waktu.
