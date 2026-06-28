const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "campusfix.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Terhubung ke database SQLite.');
        
        // Bikin tabel user (untuk US-01 Login)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`, (err) => {
            if (!err) {
                // Suntik 1 akun Admin default biar dosen bisa langsung ngetes login admin
                const insert = 'INSERT OR IGNORE INTO users (id, nama, email, password, role) VALUES (?,?,?,?,?)';
                db.run(insert, [1, "Admin Prasarana", "admin@unila.ac.id", "admin123", "admin"]);
                db.run(insert, [2, "Marvella", "marvella@mhs.unila.ac.id", "marvella123", "mahasiswa"]);
            }

        });

        // Bikin tabel laporan (untuk US-02 Form Kerusakan)
        db.run(`CREATE TABLE IF NOT EXISTS laporan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kategori TEXT,
            lokasi TEXT,
            kronologi TEXT,
            urgensi TEXT,
            foto_bukti TEXT,
            status TEXT DEFAULT 'Dilaporkan',
            user_id INTEGER,
            tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

module.exports = db;