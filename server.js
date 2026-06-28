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

app.listen(PORT, () => {
    console.log(`Server CampusFix berjalan di http://localhost:${PORT}`);
});