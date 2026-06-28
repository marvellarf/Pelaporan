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
});