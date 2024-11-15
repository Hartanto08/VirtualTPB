import CONFIG from "./config.js";
console.log("login.js berhasil dimuat");

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    console.log("Form submitted");
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`http://localhost:3000/login`, {
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

        // Check if the response is OK (status code 2xx)
        if (response.ok) {
            const data = await response.json();
            console.log("Login successful", data);
            const { token, userId } = data;
            document.cookie = `token=${token}; path=/; max-age=3600; Secure; SameSite=Strict`;
            document.cookie = `userId=${userId}; path=/; max-age=3600; Secure; SameSite=Strict`;
            // Redirect to dashboard upon successful login
            window.location.href = "../index.html";
        } else {
            
            let errorMsg = 'Login failed. Please try again.';
            try {
                const error = await response.json();
                errorMsg = error.error || errorMsg;
            } catch (err) {
                // If the response isn't JSON, log it and show a fallback error
                console.error("Error parsing response JSON:", err);
                errorMsg = "An unexpected error occurred. Please try again.";
            }
            alert(errorMsg); // Show alert with error message
        }
    } catch (error) {
        // console.error("Error:", error);
        alert("An error occurred while logging in.");
    }
});