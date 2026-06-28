// ==========================================
    // LOGIKA GLOBAL: MESIN PENGHANCUR SESI (LOGOUT)
    // ==========================================
    document.addEventListener('click', function(e) {
        const tombolLogout = e.target.closest('a'); // Jurus ambil tag <a> meski user ngeklik ikon/teks di dalamnya

        if (tombolLogout && (tombolLogout.id === 'logout-btn' || tombolLogout.innerText.trim().toLowerCase() === 'logout')) {
            e.preventDefault(); // <--- INI REM-NYA! Tahan browser biar gak kabur duluan!
            
            localStorage.removeItem('user'); // Eksekusi bakar KTP sampai tuntas
            
            alert("Anda telah berhasil logout!"); 
            window.location.href = 'index.html'; // Baru kita lempar manual secara sadar
        }
    });
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
    // LOGIKA US-03: DAFTAR RIWAYAT & DETAIL MODAL
    // ==========================================
   if (window.location.pathname.includes('riwayat-laporan.html')) {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser) {
            alert("Silahkan Login Terlebih Dahulu!"); // <--- Toa satpam aktif!
            window.location.href = 'index.html';
            return;
        }

        // Tampilkan nama user asli di pojok kanan atas!
        document.getElementById('header-user-name').innerText = loggedInUser.nama;
        document.getElementById('header-user-role').innerText = loggedInUser.role;

        const tableBody = document.getElementById('laporan-table-body');
        let masterDataLaporan = []; // Penampung data mentah buat fitur Search (US-05)

        async function muatRiwayat() {
            try {
                const response = await fetch(`/api/laporan/user/${loggedInUser.id}`);
                const result = await response.json();

                if (result.success) {
                    masterDataLaporan = result.data;
                    renderTabel(masterDataLaporan);
                }
            } catch (err) {
                tableBody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Gagal mengambil data dari server!</td></tr>`;
            }
        }

        function renderTabel(data) {
            tableBody.innerHTML = '';
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Belum ada laporan kerusakan yang dikirim.</td></tr>`;
                return;
            }

            data.forEach(item => {
                // Trik ubah format waktu SQLite biar gampang dibaca manusia
                const tgl = new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                
                // Trik pewarnaan status badge dinamis
                let badgeClass = 'badge-warning';
                if(item.status === 'Selesai') badgeClass = 'badge-success';
                if(item.status === 'Dilaporkan') badgeClass = 'badge-info';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>LP-2026-${String(item.id).padStart(3, '0')}</td>
                    <td>${tgl}</td>
                    <td>${item.kategori}</td>
                    <td>${item.lokasi}</td>
                    <td>${item.urgensi}</td>
                    <td><span class="badge ${badgeClass}">${item.status}</span></td>
                    <td>
                        <button class="btn-detail" onclick="bukaDetailModal(${item.id})">Lihat</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // Fungsi Global Jendela Modal (Dipanggil lewat onclick di tabel)
        window.bukaDetailModal = function(id) {
            const dataPilihan = masterDataLaporan.find(x => x.id === id);
            if(dataPilihan) {
                document.getElementById('modal-id').innerText = `LP-2026-${String(dataPilihan.id).padStart(3, '0')}`;
                document.getElementById('modal-kategori').innerText = dataPilihan.kategori;
                document.getElementById('modal-lokasi').innerText = dataPilihan.lokasi;
                document.getElementById('modal-urgensi').innerText = dataPilihan.urgensi;
                document.getElementById('modal-status').innerText = dataPilihan.status;
                document.getElementById('modal-kronologi').innerText = dataPilihan.kronologi;

                const fotoContainer = document.getElementById('modal-foto-container');
                const fotoImg = document.getElementById('modal-foto');
                if(dataPilihan.foto_bukti) {
                    fotoImg.src = dataPilihan.foto_bukti;
                    fotoContainer.style.display = 'block';
                } else {
                    fotoContainer.style.display = 'none';
                }

                document.getElementById('detailModal').style.display = 'flex';
            }
        }

        document.getElementById('btn-close-modal')?.addEventListener('click', () => {
            document.getElementById('detailModal').style.display = 'none';
        });

        muatRiwayat(); // Jalankan mesin saat halaman terbuka!
    }
});