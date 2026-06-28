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
// ==========================================
    // ==========================================
    // LOGIKA US-04: DASHBOARD & KELOLA ADMIN
    // ==========================================
    if (window.location.pathname.includes('kelola-laporan.html') || window.location.pathname.includes('dashboard-admin.html')) {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        
        if (!loggedInUser || loggedInUser.role !== 'admin') {
            alert("PELANGGARAN HAK AKSES! Halaman ini khusus Staf Prasarana.");
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('header-user-name').innerText = loggedInUser.nama;
        let masterDataAdmin = [];

        async function muatSemuaLaporan() {
            try {
                const response = await fetch('/api/admin/laporan');
                const result = await response.json();
                if(result.success) {
                    masterDataAdmin = result.data;

                    // CABANG A: Jika sedang membuka Kelola Laporan
                    if (window.location.pathname.includes('kelola-laporan.html')) {
                        renderTabelAdmin(masterDataAdmin);
                    }

                    // CABANG B: Jika sedang membuka Dashboard Admin
                    if (window.location.pathname.includes('dashboard-admin.html')) {
                        kalkulasiDashboard(masterDataAdmin);
                    }
                }
            } catch(err) {
                console.error("Gagal menarik pusat data:", err);
            }
        }

        // --- MESIN KALKULATOR DASHBOARD ---
        function kalkulasiDashboard(data) {
            const total = data.length;
            const lapor = data.filter(x => x.status === 'Dilaporkan').length;
            const proses = data.filter(x => x.status === 'Diproses').length;
            const selesai = data.filter(x => x.status === 'Selesai').length;

            if(document.getElementById('stat-total')) document.getElementById('stat-total').innerText = total;
            if(document.getElementById('stat-lapor')) document.getElementById('stat-lapor').innerText = lapor;
            if(document.getElementById('stat-proses')) document.getElementById('stat-proses').innerText = proses;
            if(document.getElementById('stat-selesai')) document.getElementById('stat-selesai').innerText = selesai;

            // Render 5 Laporan Terbaru
            const tbodyTerbaru = document.getElementById('table-terbaru-body');
            if(tbodyTerbaru) {
                tbodyTerbaru.innerHTML = '';
                const limaTerbaru = data.slice(0, 5);

                if(limaTerbaru.length === 0) {
                    tbodyTerbaru.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada laporan masuk.</td></tr>`;
                } else {
                    limaTerbaru.forEach(item => {
                        let bClass = 'badge-warning';
                        if(item.status === 'Selesai') bClass = 'badge-success';
                        if(item.status === 'Dilaporkan') bClass = 'badge-danger';

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><b>LP-${String(item.id).padStart(3, '0')}</b></td>
                            <td>${item.nama_pelapor || 'Mahasiswa'}</td>
                            <td>${item.kategori}</td>
                            <td>${item.lokasi}</td>
                            <td><span class="badge ${bClass}">${item.status}</span></td>
                        `;
                        tbodyTerbaru.appendChild(tr);
                    });
                }
            }

            // Render Kotak Prioritas Darurat (Urgensi Tinggi & Belum Selesai)
            const boxDarurat = document.getElementById('list-prioritas');
            if(boxDarurat) {
                boxDarurat.innerHTML = '';
                const darurat = data.filter(x => x.urgensi === 'Tinggi' && x.status !== 'Selesai');

                if(darurat.length === 0) {
                    boxDarurat.innerHTML = `<p style="padding:15px; color:#28a745; font-weight:bold;">✔ Aman! Tidak ada kerusakan darurat saat ini.</p>`;
                } else {
                    darurat.forEach(d => {
                        const div = document.createElement('div');
                        div.className = 'priority-item';
                        div.style.borderLeft = '4px solid #dc3545';
                        div.style.margin = '10px';
                        div.innerHTML = `
                            <h4 style="color:#dc3545;">LP-2026-${String(d.id).padStart(3, '0')} [${d.kategori}]</h4>
                            <p>${d.lokasi} — <b>"${d.kronologi}"</b> <br><small>Pelapor: ${d.nama_pelapor}</small></p>
                        `;
                        boxDarurat.appendChild(div);
                    });
                }
            }
        }

        // --- MESIN RENDER TABEL KELOLA ADMIN (YANG KEMAREN) ---
        function renderTabelAdmin(data) {
            const adminTableBody = document.getElementById('admin-table-body');
            if(!adminTableBody) return;
            adminTableBody.innerHTML = '';

            if(data.length === 0) {
                adminTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Tidak ada laporan kerusakan masuk.</td></tr>`;
                return;
            }

            data.forEach(item => {
                const tgl = new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                let badgeClass = 'badge-warning';
                if(item.status === 'Selesai') badgeClass = 'badge-success';
                if(item.status === 'Dilaporkan') badgeClass = 'badge-info';

                let tombolAksi = '';
                if(item.status === 'Dilaporkan') {
                    tombolAksi = `<button class="btn" style="padding:4px 8px; font-size:12px; background:#ffc107; color:#000;" onclick="ubahStatusLaporan(${item.id}, 'Diproses')">⚡ Proses</button>`;
                } else if(item.status === 'Diproses') {
                    tombolAksi = `<button class="btn" style="padding:4px 8px; font-size:12px; background:#28a745;" onclick="ubahStatusLaporan(${item.id}, 'Selesai')">✔ Selesai</button>`;
                } else {
                    tombolAksi = `<span style="color:#28a745; font-weight:bold; font-size:12px;">Tuntas</span>`;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><b>LP-${String(item.id).padStart(3, '0')}</b></td>
                    <td>${tgl}</td>
                    <td>${item.kategori} <br><small style="color:#666;">(${item.nama_pelapor})</small></td>
                    <td>${item.lokasi}</td>
                    <td>${item.urgensi}</td>
                    <td><span class="badge ${badgeClass}">${item.status}</span></td>
                    <td>
                        <button class="btn-detail" style="margin-right:5px;" onclick="bukaModalAdmin(${item.id})">🔍</button>
                        ${tombolAksi}
                    </td>
                `;
                adminTableBody.appendChild(tr);
            });
        }

        window.ubahStatusLaporan = async function(id, statusBaru) {
            if(!confirm(`Yakin ingin mengubah status laporan ini menjadi "${statusBaru}"?`)) return;
            try {
                const res = await fetch(`/api/admin/laporan/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status_baru: statusBaru })
                });
                const hasil = await res.json();
                if(hasil.success) muatSemuaLaporan();
            } catch(e) { alert("Koneksi terputus."); }
        }

        window.bukaModalAdmin = function(id) {
            const pilihan = masterDataAdmin.find(x => x.id === id);
            if(pilihan) {
                document.getElementById('modal-id').innerText = `LP-2026-${String(pilihan.id).padStart(3, '0')}`;
                document.getElementById('modal-lokasi').innerText = pilihan.lokasi;
                document.getElementById('modal-kronologi').innerText = pilihan.kronologi;
                const fotoC = document.getElementById('modal-foto-container');
                if(pilihan.foto_bukti) {
                    document.getElementById('modal-foto').src = pilihan.foto_bukti;
                    fotoC.style.display = 'block';
                } else fotoC.style.display = 'none';
                document.getElementById('detailModal').style.display = 'flex';
            }
        }

        document.getElementById('btn-close-modal')?.addEventListener('click', () => {
            document.getElementById('detailModal').style.display = 'none';
        });

        muatSemuaLaporan();
    }

// ==========================================
    // LOGIKA US-05: FITUR MONITORING & FILTER
    // ==========================================
    if (window.location.pathname.includes('monitoring.html')) {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        
        if (!loggedInUser || loggedInUser.role !== 'admin') {
            alert("PELANGGARAN HAK AKSES! Radar monitoring khusus Staf Prasarana.");
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('header-user-name').innerText = loggedInUser.nama;
        const mTbody = document.getElementById('monitoring-tbody');
        let dataMonitoring = [];

        window.jalankanFilter = async function() {
            const kw = document.getElementById('search-keyword')?.value || '';
            const kat = document.getElementById('search-kategori')?.value || '';
            const urg = document.getElementById('search-urgensi')?.value || '';

            mTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Menyaring data dari server SQLite...</td></tr>`;

            try {
                // Kirim kombinasi filter via URL Query Parameter
                const url = `/api/laporan/filter?keyword=${encodeURIComponent(kw)}&kategori=${encodeURIComponent(kat)}&urgensi=${encodeURIComponent(urg)}`;
                const res = await fetch(url);
                const hasil = await res.json();

                if (hasil.success) {
                    dataMonitoring = hasil.data;
                    renderTabelMonitoring(dataMonitoring);
                }
            } catch(e) {
                mTbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Radar terputus dari pusat data!</td></tr>`;
            }
        }

        function renderTabelMonitoring(data) {
            mTbody.innerHTML = '';
            if (data.length === 0) {
                mTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#dc3545; font-weight:bold;">Data kerusakan tidak ditemukan sesuai kriteria filter.</td></tr>`;
                return;
            }

            data.forEach(item => {
                let badgeClass = 'badge-warning';
                if(item.status === 'Selesai') badgeClass = 'badge-success';
                if(item.status === 'Dilaporkan') badgeClass = 'badge-danger';

                let uColor = '#000';
                if(item.urgensi === 'Tinggi') uColor = '#dc3545';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><b>LP-${String(item.id).padStart(3, '0')}</b></td>
                    <td>${item.nama_pelapor || 'Mahasiswa'}</td>
                    <td>${item.kategori}</td>
                    <td>${item.lokasi}</td>
                    <td style="color:${uColor}; font-weight:bold;">${item.urgensi}</td>
                    <td><span class="badge ${badgeClass}">${item.status}</span></td>
                    <td>
                        <button class="btn-detail" onclick="bukaModalMonitoring(${item.id})">🔍 Lihat Bukti</button>
                    </td>
                `;
                mTbody.appendChild(tr);
            });
        }

        window.bukaModalMonitoring = function(id) {
            const p = dataMonitoring.find(x => x.id === id);
            if(p) {
                document.getElementById('modal-id').innerText = `LP-2026-${String(p.id).padStart(3, '0')}`;
                document.getElementById('modal-lokasi').innerText = p.lokasi;
                document.getElementById('modal-kronologi').innerText = p.kronologi;
                const fc = document.getElementById('modal-foto-container');
                if(p.foto_bukti) {
                    document.getElementById('modal-foto').src = p.foto_bukti;
                    fc.style.display = 'block';
                } else fc.style.display = 'none';
                document.getElementById('detailModal').style.display = 'flex';
            }
        }

        document.getElementById('btn-close-modal')?.addEventListener('click', () => {
            document.getElementById('detailModal').style.display = 'none';
        });

        // Fitur Live Search ala Gen Z: pas ngetik langsung nyaring tanpa klik tombol!
        document.getElementById('search-keyword')?.addEventListener('input', () => {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(jalankanFilter, 400); // Debounce 400ms biar gak spam API
        });

        jalankanFilter(); // Tarik data awal saat radar dibuka!
    }
// ==========================================
    // LOGIKA US-03B: DASHBOARD RINGKASAN PELAPOR
    // ==========================================
    if (window.location.pathname.includes('dashboard-pelapor.html')) {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        
        if (!loggedInUser) {
            window.location.href = 'index.html';
            return;
        }

        // Render identitas asli di Header & Welcome Banner
        document.getElementById('header-user-name').innerText = loggedInUser.nama;
        document.getElementById('header-user-role').innerText = loggedInUser.role;
        document.getElementById('header-avatar').innerText = loggedInUser.nama.charAt(0).toUpperCase();
        document.getElementById('welcome-name').innerText = loggedInUser.nama;

        async function muatDasborPelapor() {
            try {
                // KITA REUSE API US-03 YANG KEMAREN!
                const res = await fetch(`/api/laporan/user/${loggedInUser.id}`);
                const hasil = await res.json();

                if (hasil.success) {
                    const data = hasil.data;

                    // Hitung Matematika Statistik Pribadi
                    const total = data.length;
                    const proses = data.filter(x => x.status === 'Diproses').length;
                    const selesai = data.filter(x => x.status === 'Selesai').length;
                    const darurat = data.filter(x => x.urgensi === 'Tinggi').length;

                    document.getElementById('pelapor-stat-total').innerText = total;
                    document.getElementById('pelapor-stat-proses').innerText = proses;
                    document.getElementById('pelapor-stat-selesai').innerText = selesai;
                    document.getElementById('pelapor-stat-darurat').innerText = darurat;

                    // Render 3 Laporan Terakhir
                    const tbody = document.getElementById('pelapor-tbody-terbaru');
                    tbody.innerHTML = '';
                    const tigaTerakhir = data.slice(0, 3);

                    if (tigaTerakhir.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada aktivitas pelaporan.</td></tr>`;
                    } else {
                        tigaTerakhir.forEach(item => {
                            const tgl = new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year:'numeric' });
                            let bClass = 'badge-warning';
                            if(item.status === 'Selesai') bClass = 'badge-success';
                            if(item.status === 'Dilaporkan') bClass = 'badge-info';

                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td><b>LP-2026-${String(item.id).padStart(3, '0')}</b></td>
                                <td>${tgl}</td>
                                <td>${item.kategori}</td>
                                <td>${item.lokasi}</td>
                                <td><span class="badge ${bClass}">${item.status}</span></td>
                            `;
                            tbody.appendChild(tr);
                        });
                    }
                }
            } catch(e) {
                console.error("Gagal menarik statistik pelapor:", e);
            }
        }

        muatDasborPelapor();
    }
});