import CONFIG from "../login/config.js"; 

document.body.addEventListener("click", async (event) => {
    if ((event.target.tagName === "A" || event.target.tagName === "BUTTON") && event.target.classList.contains("trackable")) {
        const actionDescription = event.target.getAttribute("data-description") || "Aksi tanpa deskripsi";

        const token = getCookie("token");
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/log-action`, { // Gunakan CONFIG.BASE_URL
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

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

document.addEventListener("DOMContentLoaded", () => {
    const usernameDisplay = document.getElementById("username");
    const userInfoText = document.getElementById("userInfoText");
    const passwordForm = document.getElementById("passwordForm");
    const passwordMessage = document.getElementById("passwordMessage");
    const historyList = document.getElementById("historyList");
    const dropdownButtons = document.querySelectorAll(".dropdownButton");
    const logoutButton = document.getElementById("logoutButton"); 

    dropdownButtons.forEach(button => {
        button.addEventListener("click", () => {
            const dropdownContent = button.nextElementSibling;
            dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
        });
    });

    async function fetchUserData() {
        try {
            const token = getCookie("token");
            if (!token) {
                console.error("User not logged in, no token found.");
                window.location.href = "../login/login.html"
                return;
            }

            const response = await fetch(`${CONFIG.BASE_URL}/get-user-data`, { 
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error("Failed to fetch user data:", response.status);
                return;
            }

            const data = await response.json();
            userInfoText.textContent = `Username : ${data.username}`;
        } catch (error) {
            console.error("Error fetching user data:", error);
            window.location.href = "../index.html";
        }
    }

    passwordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = getCookie("token");
        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = document.getElementById("newPassword").value;

        try {
            const response = await fetch(`${CONFIG.BASE_URL}/change-password`, { // Gunakan CONFIG.BASE_URL
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const result = await response.json();
            passwordMessage.textContent = result.message;
            passwordMessage.style.color = response.ok ? "green" : "red";
        } catch (error) {
            passwordMessage.textContent = "Gagal mengubah password";
            console.error("Error changing password:", error);
        }
    });

    async function fetchHistory() {
        try {
            const token = getCookie("token");
            if (!token) {
                console.error("User not logged in, no token found.");
                return;
            }

            const response = await fetch(`${CONFIG.BASE_URL}/user-history`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error("Failed to fetch user history:", response.status);
                return;
            }

            const historyData = await response.json();

            
            historyList.innerHTML = "";

            historyData.forEach((item) => {
                const listItem = document.createElement("li");
                listItem.textContent = `${item.action} - ${new Date(item.timestamp).toLocaleString()}`;
                historyList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }

    async function logout() {
        try {
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Strict";
                document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Strict";
                window.location.href = "../login/login.html"; 
            
        } catch (error) {
            console.error("Error logging out:", error);
        }
    }

    logoutButton.addEventListener("click", logout);


    fetchUserData();
    fetchHistory();
});

async function deleteHistory() {
    try {
        const token = getCookie("token");
        if (!token) {
            console.error("User not logged in, no token found.");
            return;
        }

        const response = await fetch(`${CONFIG.BASE_URL}/delete-history`, {
            method: "DELETE", 
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            console.log("History deleted successfully.");
            
            const historyList = document.getElementById("historyList");
            historyList.innerHTML = "";
        } else {
            console.error("Failed to delete history:", response.status);
            const errorMessage = await response.text();
            console.error("Error details:", errorMessage);
        }
    } catch (error) {
        console.error("Error deleting history:", error);
    }
}

document.getElementById("deleteHistoryButton").addEventListener("click", async () => {
    const confirmation = confirm("Apakah Anda yakin ingin menghapus seluruh riwayat?");
    if (!confirmation) return;

    try {
        const token = getCookie("token");
        if (!token) {
            alert("Anda belum login.");
            return;
        }

        const response = await fetch(`${CONFIG.BASE_URL}/delete-history`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            alert("Riwayat berhasil dihapus.");
            const historyList = document.getElementById("historyList");
            historyList.innerHTML = ""; // Clear the history list
        } else {
            alert("Gagal menghapus riwayat. Silakan coba lagi.");
        }
    } catch (error) {
        console.error("Error deleting history:", error);
        alert("Terjadi kesalahan saat menghapus riwayat.");
    }
});