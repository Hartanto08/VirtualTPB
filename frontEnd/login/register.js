document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();  

    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = "";
    try {
        const response = await fetch("https://virtual-tpb-puce.vercel.app/register", {
            method: 'POST',  
            headers: {
                'Content-Type': 'application/json',  
            },
            body: JSON.stringify({ username, password }), 
        });
        console.log(response)
        if (response.ok) {
            const data = await response.json();
            console.log('Registration successful:', data);
            window.location.href = "./login.html"; 
        } else if (response.status === 409) {
                errorMessage.textContent = "Email already exist. Please try again."; 
        } else {
            const error = await response.json();
            // alert(`Error: ${error.message || 'Registration failed'}`);
            errorMessage.textContent = error.message || "Registration failed.";
        }
    } catch (error) {
        console.error('Error during registration:', error);
        // alert('An error occurred while registering.');
        errorMessage.textContent = "An error occurred while registering.";
    }
});