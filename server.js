const db = require('./database.js');
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Menyajikan semua file HTML/CSS/JS rekan lo sebagai static files
app.use(express.static(path.join(__dirname, '/')));

// Middleware agar Express bisa membaca data JSON yang dikirim dari HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint API untuk memproses Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Cari user di database SQLite berdasarkan email dan password
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            // Jika ketemu, kirim respon sukses beserta data user dan role-nya
            res.json({
                success: true,
                message: "Login berhasil!",
                user: {
                    id: row.id,
                    nama: row.nama,
                    email: row.email,
                    role: row.role
                }
            });
        } else {
            // Jika salah email/password
            res.status(401).json({
                success: false,
                message: "Email atau Password salah!"
            });
        }
    });
});


const multer = require('multer');

// 1. Konfigurasi tempat penampungan foto Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        // Jurus anti-bentrok: namain file pakai "waktu_sekarang + angka_random"
        // Biar kalo ada 2 orang upload file bernama 'foto.jpg' barengan, gak saling timpa
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bukti-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Kontrak hukum: Maksimal 5 MB!
});

// 2. Endpoint API Kirim Laporan Kerusakan
app.post('/api/laporan', upload.single('foto_bukti'), (req, res) => {
    const { kategori, lokasi, kronologi, urgensi, user_id } = req.body;
    
    // Ambil path fotonya jika pelapor mengunggah gambar
    const foto_path = req.file ? `uploads/${req.file.filename}` : null;

    // Validasi backend: semua kolom wajib terisi
    if (!kategori || !lokasi || !kronologi || !urgensi || !user_id) {
        return res.status(400).json({ 
            success: false, 
            message: "Semua data kerusakan wajib diisi lengkap!" 
        });
    }

    const sql = `INSERT INTO laporan (kategori, lokasi, kronologi, urgensi, foto_bukti, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [kategori, lokasi, kronologi, urgensi, foto_path, user_id], function(err) {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ success: false, message: "Gagal menyimpan laporan ke database." });
        }
        
        res.json({
            success: true,
            message: "Laporan kerusakan berhasil dikirim!",
            laporan_id: this.lastID
        });
    });
});


// Endpoint API untuk menarik riwayat laporan milik user tertentu
app.get('/api/laporan/user/:user_id', (req, res) => {
    const userId = req.params.user_id;

    const sql = "SELECT * FROM laporan WHERE user_id = ? ORDER BY id DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// [API US-04A] Tarik SEMUA laporan + NAMA ASLI PELAPOR (Upgrade LEFT JOIN!)
app.get('/api/admin/laporan', (req, res) => {
    const sql = `SELECT laporan.*, users.nama AS nama_pelapor 
                 FROM laporan 
                 LEFT JOIN users ON laporan.user_id = users.id 
                 ORDER BY laporan.id DESC`;
                 
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows });
    });
});

// [API US-04B] Update Status Laporan (Dilaporkan -> Diproses -> Selesai)
app.patch('/api/admin/laporan/:id/status', (req, res) => {
    const laporanId = req.params.id;
    const { status_baru } = req.body;

    const sql = "UPDATE laporan SET status = ? WHERE id = ?";
    db.run(sql, [status_baru, laporanId], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        res.json({ 
            success: true, 
            message: `Status laporan LP-2026-${String(laporanId).padStart(3, '0')} berhasil diubah menjadi: ${status_baru}` 
        });
    });
});

// [API US-05] Mesin Pencari & Filter Laporan Dinamis (SQL Query Builder)
app.get('/api/laporan/filter', (req, res) => {
    const keyword = (req.query.keyword || '').trim();
    const kategori = (req.query.kategori || '').trim();
    const urgensi = (req.query.urgensi || '').trim();

    let sql = `SELECT laporan.*, users.nama AS nama_pelapor 
               FROM laporan 
               LEFT JOIN users ON laporan.user_id = users.id 
               WHERE 1=1`;
    let params = [];

    // Jika admin mengetik kata kunci lokasi, kronologi, kategori, atau ID
    if (keyword !== '') {
        const idMatch = keyword.match(/(\d+)(?!.*\d)/);
        const idValue = idMatch ? Number(idMatch[1]) : null;
        const wild = `%${keyword}%`;

        sql += ` AND (`;
        sql += `laporan.lokasi LIKE ? OR laporan.kronologi LIKE ? OR laporan.kategori LIKE ? OR users.nama LIKE ? OR CAST(laporan.id AS TEXT) LIKE ?`;
        params.push(wild, wild, wild, wild, wild);

        if (idValue !== null) {
            sql += ` OR laporan.id = ?`;
            params.push(idValue);
        }

        sql += `)`;
    }

    // Jika admin memilih dropdown kategori
    if (kategori !== '') {
        sql += ` AND laporan.kategori = ?`;
        params.push(kategori);
    }

    // Jika admin memilih dropdown urgensi
    if (urgensi !== '') {
        sql += ` AND laporan.urgensi = ?`;
        params.push(urgensi);
    }

    sql += ` ORDER BY laporan.id DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows });
    });
});

app.listen(PORT, () => {
    console.log(`Server CampusFix berjalan di http://localhost:${PORT}`);
});