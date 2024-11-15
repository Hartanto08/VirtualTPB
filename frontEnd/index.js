import CONFIG from "./login/config.js";

var buttons = document.querySelectorAll(".Button");
buttons.forEach(function(button) {
    button.addEventListener("click", function() {
            this.classList.toggle("clicked"); 
            setTimeout(() => {
                this.classList.remove("clicked");
            }, 100);
        
        });
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function checkLoginStatus() {
    const token = getCookie("token"); 
    const buttonSection = document.getElementById("buttonSection");
    const welcomeSection = document.getElementById("welcomeSection");
    const userNameElement = document.getElementById("userName");

    // Initially hide both sections
    buttonSection.style.display = "none";
    welcomeSection.style.display = "none";

    if (token) {
        // If logged in, fetch user data and update the UI
        fetch(`${CONFIG.BASE_URL}/get-user-data`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Failed to fetch user data.");
            }
        })
        .then(data => {
            // Show welcome section and hide button section
            welcomeSection.style.display = "block";
            userNameElement.textContent = data.username || "User";
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
            // Show buttons if fetching user data fails
            buttonSection.style.display = "block";
        });
    } else {
        // If not logged in, show login and register buttons
        buttonSection.style.display = "block";
    }
}


document.body.addEventListener("click", async (event) => {
    if ((event.target.tagName === "A" || event.target.tagName === "BUTTON") && event.target.classList.contains("trackable")) {
        const actionDescription = event.target.getAttribute("data-description") || "Aksi tanpa deskripsi";
        const token = getCookie("token");
        try {
            // Pastikan URL yang digunakan adalah URL lengkap ke endpoint backend
            const response = await fetch(`${CONFIG.BASE_URL}/log-action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`  
                },
                body: JSON.stringify({ action: actionDescription })
            });

            if (response.ok) {
                console.log("Action logged successfully");
            } else {
                console.error("Failed to log action");
            }
        } catch (error) {
            console.error("Error logging action:", error);
        }
    }
});



document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    const cards = document.querySelectorAll('.feature');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible');
        }, index * 200);
    });
});

document.getElementById("playButton").onclick = function() {
    window.location.href = "/materiRev/materiRev.html";
};

// (function() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const token = urlParams.get("token");

//     if (token) {
//         // Simpan token di localStorage
//         localStorage.setItem("token", token);

        
//         window.history.replaceState({}, document.title, "/dashboard");
//     }
//     fetchHistory();
// })();


// // Fungsi untuk mengambil riwayat aktivitas pengguna
// async function fetchHistory() {
//     const token = localStorage.getItem("token"); // Ambil token dari localStorage
//     if (!token) {
//         console.log("User not logged in");
//         return;
//     }

//     try {
//         const response = await fetch("http://localhost:3000/history", {
//             headers: {
//                 "Authorization": `Bearer ${token}` // Kirim token di header Authorization
//             }
//         });
//         if (response.status === 401) {
//             console.log("Unauthorized access. Token mungkin tidak valid atau kadaluarsa.");
//         } else {
//             const history = await response.json();
//             console.log(history); // Tampilkan atau olah data riwayat pengguna
//             displayHistory(history); // Fungsi untuk menampilkan riwayat di halaman
//         }
//     } catch (error) {
//         console.error("Error fetching history:", error);
//     }
// }

// // Fungsi untuk menampilkan riwayat di halaman
// function displayHistory(history) {
//     const historyContainer = document.getElementById("historyContainer");
//     if (historyContainer) {
//         historyContainer.innerHTML = ""; // Kosongkan container sebelum menambahkan item baru
//         history.forEach(item => {
//             const historyItem = document.createElement("div");
//             historyItem.textContent = `${item.action} - ${new Date(item.timestamp).toLocaleString()}`;
//             historyContainer.appendChild(historyItem);
//         });
//     }
// }


