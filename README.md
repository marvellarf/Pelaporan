# 🏛️ Suara Kampus - Sistem Pelaporan Kerusakan Fasilitas Kampus Berbasis Web


**Suara Kampus** adalah aplikasi berbasis web (*Minimum Viable Product*) yang dikembangkan menggunakan kerangka kerja manajemen proyek **Scrum (Agile)**. Sistem ini dibangun untuk memfasilitasi civitas akademika (Mahasiswa, Dosen, dan Staf) dalam melaporkan kerusakan sarana prasarana kampus secara langsung, transparan, dan terintegrasi dengan panel penanganan staf prasarana.

---

## 👥 Tim Pengembang (Scrum Team)

| NIM | Nama Lengkap | Peran Scrum | Kontak / GitHub |
| :--- | :--- | :--- | :--- |
| **[2313025041]** | **Asrafil Ambia** | *Scrum Master / Lead QA* | [@Asrafil041](https://github.com/Asrafil041) |
| **[2313025044]** | **[Marvella Rizkia Putri]** | *Product Owner / UI-UX* | [@marvellarf](https://github.com/username_marvellarf) |
| **[2313025024]** | **[M. Tegar Dwi Prakoso]** | *Development Team* | [@tegaarv](https://github.com/tegaarv) |
| **[NIM_REKAN_2]** | **[Fachtrezi Putra Kori]** | | [@fachrezi02](https://github.com/fachrezi02) |

> **🔗 Tautan Manajemen Proyek:**
> * **GitHub Projects (Papan Kanban):** [KLIK DI SINI UNTUK MELIHAT KANBAN BOARD](https://github.com/marvellarf/Agile-Pelaporan-Fasilitas-Kelompok2/projects)
> * **Dokumen LKM & Log Daily Scrum:** Terlampir di folder [`/docs`](./docs)

---

## 🚀 Fitur Utama MVP (100% Fungsional)

1. **🔒 Autentikasi & Registrasi Pengguna:** Sistem isolasi hak akses (*Role Guard*) ketat antara Pelapor (`mahasiswa`) dan Staf Penangan (`admin`) berbantuan *Session Storage*.
2. **📝 Form Pelaporan Kerusakan:** Mengirim keluhan fasilitas beserta bukti foto (*Multipart Photo Upload via Multer* dengan batas proteksi memori 5MB).
3. **📊 Dasbor & Riwayat Pelapor:** Pantauan statistik pribadi dan pelacakan status perbaikan secara *real-time* (*Dilaporkan ➔ Diproses ➔ Selesai*).
4. **🛠️ Panel Manajemen Admin:** Pusat verifikasi pelaporan masuk dan pembaruan status perbaikan satu klik (*Single-Click Status Patching*).
5. **📡 Radar Monitoring & Live Filter:** Mesin pencari SQL dinamis berdasarkan ID Laporan, Lokasi Gedung, serta penyaringan kategori darurat (*Urgensi Tinggi*).

---

## 💻 Petunjuk Instalasi & Menjalankan di Komputer Lokal (*Local Setup*)

Aplikasi ini dirancang dengan arsitektur **Zero-Configuration DBMS** menggunakan SQLite, sehingga penguji tidak perlu menginstal XAMPP, MySQL, atau melakukan konfigurasi port eksternal.

### Prasyarat Wajib
* Pastikan komputer telah terinstal **Node.js** (Versi v18.x atau terbaru).

### Langkah-Langkah Eksekusi:

1. **Clone Repositori ini ke komputer lokal:**
   ```bash
   git clone [https://github.com/marvellarf/Agile-Pelaporan-Fasilitas-Kelompok2.git]

2. **Unduh seluruh dependensi modul eksternal:**

   npm install

3. **Nyalakan Server Mesin Utama**

   node server.js

4. **Buka Aplikasi melalui Peramban (Browser):**

   Akses alamat berikut: http://localhost:3000

🔑 Kredensial Pengujian (Seeder Accounts)
Gunakan akun siap pakai berikut untuk menguji pembatasan logika gerbang (Auth Guards):

1. Akun Pelapor (Mahasiswa)
Email: marvella@mhs.unila.ac.id

Password: marvella123
(Atau silakan gunakan fitur Registrasi Akun Baru di halaman awal).

2. Akun Staf Prasarana (Panel Admin)
Email: admin@unila.ac.id

Password: admin123

🗃️ Arsitektur & Git Flow Strategy
Proyek ini secara ketat melarang komit langsung (No Direct Commit) ke branch main. Setiap penambahan kode dieksekusi melalui dahan fitur tersendiri dan disatukan via Pull Request (PR) serta Peer Code Review:

Plaintext
main ───┬───────────────────────────────────────────────────────────► (Production Ready)
        ├── feature/US-01-login-logic ───────► [PR #1 Approved] ───┘
        ├── feature/US-02-form-laporan ──────► [PR #2 Approved] ───┘
        ├── feature/US-03-riwayat-laporan ───► [PR #3 Approved] ───┘
        └── feature/US-05-monitoring-filter ─► [PR #5 Approved] ───┘
Struktur Direktori:

/uploads : Penampung berkas biner foto kerusakan (dilindungi .gitkeep)

/docs : Tempat penyimpanan artefak Word Agile LKM

campusfix.sqlite : Basis data tunggal relasional lokal

server.js : Jantung peladen Node.js & REST API Controller

Dikembangkan untuk memenuhi Tugas Proyek Mata Kuliah Agile Software Development — Program Studi Pendidikan Teknologi Informasi, Universitas Lampung (2026).

