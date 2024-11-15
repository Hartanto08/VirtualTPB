import CONFIG from "./config.js";
console.log("login.js berhasil dimuat");

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    console.log("Form submitted");
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");
    try {
        const response = await fetch(`${CONFIG.BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        console.log("response: ", response)

        if (response.ok) {
            const data = await response.json();
            console.log("Login successful", data);
            const { token, userId } = data;
            document.cookie = `token=${token}; path=/; max-age=3600; Secure; SameSite=Strict`;
            document.cookie = `userId=${userId}; path=/; max-age=3600; Secure; SameSite=Strict`;
            window.location.href = "../index.html";
        } else if (response.status === 401) {
            errorMessage.textContent = "Incorrect Password. Please try again."; 
        } else {
            let errorMsg = 'Login failed. Please try again.';
            try {
                const error = await response.json();
                errorMsg = error.error || errorMsg;
            } catch (err) {
                console.error("Error parsing response JSON:", err);
                errorMsg = "An unexpected error occurred. Please try again.";
            }
            alert(`Error: ${error.message || 'Login failed'}`);
            errorMessage.textContent = errorMsg;
            errorMessage.classList.add("show");
        }
    } catch (error) {
        errorMessage.textContent = "An error occurred while logging in.";
    }
});
