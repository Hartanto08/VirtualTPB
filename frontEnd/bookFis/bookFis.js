import { CONFIG } from "../login/config.js";

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

document.body.addEventListener("click", async (event) => {
    if (event.target.tagName === "A" && event.target.classList.contains("trackable")) {
        event.preventDefault();

        const actionDescription = event.target.getAttribute("data-description") || event.target.textContent;
        const targetUrl = event.target.href;
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
            window.location.href = targetUrl;
        } catch (error) {  
            window.location.href = targetUrl;
        }
    }
});
