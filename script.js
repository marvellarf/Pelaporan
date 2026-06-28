document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                // Tembak API yang udah kita bikin di server.js
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // SIMPAN KTP DIGITAL USER KE BROWSER (Krusial buat fitur selanjutnya!)
                    localStorage.setItem('user', JSON.stringify(data.user));

                    alert(data.message);

                    // Arahkan berdasarkan role asli dari database SQLite
                    if (data.user.role === 'admin') {
                        window.location.href = "dashboard-admin.html";
                    } else {
                        window.location.href = "dashboard-pelapor.html";
                    }
                } else {
                    // Kalau password salah / email gak terdaftar
                    alert(data.message || "Login gagal! Periksa kembali email dan password Anda.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Gagal terhubung ke server CampusFix!");
            }
        });
    }
// LOGIKA US-02: FORM BUAT LAPORAN & UPLOAD
    // ==========================================
    const formLaporan = document.querySelector('form'); // Ambil form pertama di halaman
    const fotoInput = document.getElementById('foto');
    const previewImg = document.getElementById('preview');

    // Fitur Gen Z: Live Preview Foto sebelum di-submit!
    if (fotoInput && previewImg) {
        fotoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                previewImg.src = URL.createObjectURL(file);
                previewImg.style.display = 'block';
            }
        });
    }

    // Eksekusi kalau user lagi buka halaman buat-laporan.html
    if (window.location.pathname.includes('buat-laporan.html')) {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));

        // SATPAM PINTU: Kalo ada mahasiswa iseng ngetik URL langsung tanpa login, tendang!
        if (!loggedInUser) {
            alert("Eits, login dulu bos sebelum bikin laporan!");
            window.location.href = 'index.html';
            return; 
        }

        if (formLaporan) {
            formLaporan.addEventListener('submit', async function(e) {
                e.preventDefault();

                // Kita jahit manual FormData di JS biar gak butuh atribut 'name' di HTML
                const customData = new FormData();
                
                customData.append('kategori', document.getElementById('kategori')?.value || '');
                customData.append('lokasi', document.getElementById('lokasi')?.value || '');
                customData.append('kronologi', document.getElementById('kronologi')?.value || '');
                customData.append('urgensi', document.getElementById('urgensi')?.value || '');
                customData.append('user_id', loggedInUser.id);

                // INI JEMBATAN KONTRAK MULTER-NYA:
                // Kita ambil file dari id="foto", lalu kita bungkus pakai label "foto_bukti"
                if (fotoInput.files[0]) {
                    customData.append('foto_bukti', fotoInput.files[0]);
                }

                try {
                    // PERINGATAN KRUSIAL: Kalo pake FormData, JANGAN ketik header 'Content-Type' !!
                    const response = await fetch('/api/laporan', {
                        method: 'POST',
                        body: customData 
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        alert(result.message);
                        window.location.href = 'riwayat-laporan.html'; // Lompat ke US-03
                    } else {
                        alert(result.message || "Gagal mengirim laporan.");
                    }
                } catch (err) {
                    console.error(err);
                    alert("Terjadi kesalahan koneksi saat mengirim laporan.");
                }
            });
        }
    }
});