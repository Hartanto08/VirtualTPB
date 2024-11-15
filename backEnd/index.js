import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from "jsonwebtoken";



dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;


app.use(cors({ origin: '*', credentials: true }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });
  
const { Client } = pg;
const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async () => {
    try {
        await db.connect();
        console.log("Connected to the database successfully!");
    } catch (err) {
        console.error("Failed to connect to the database:", err.stack);
    }
})();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Ubah dari false ke true
    cookie: {
        maxAge: 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    }
}));


// app.use((req, res, next) => {
//     if (req.path.endsWith('/') && req.path.length > 1) {
//         const query = req.url.slice(req.path.length);
//         res.redirect(301, req.path.slice(0, -1) + query);
//     } else {
//         next();
//     }
// });

// // Middleware untuk autentikasi sesi
// function authenticateJWT(req, res, next) {
//     if (req.session.user) {
//         console.log("User authenticated:", req.session.user);
//         next();
//     } else {
//         console.log("User not authenticated, redirecting to /login");
//         // res.redirect("/login");
//     }
// }

const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";

// Middleware to verify JWT
function authenticateJWT(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
}

app.get('/favicon.ico', (req, res) => res.status(204).end());


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontEnd", "login", "home.html"));
});

app.use(express.static(path.join(__dirname, "..", "frontEnd")));

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontEnd", "login", "login.html"));
});


// app.get("/register", (req, res) => {
//     res.sendFile(path.join(__dirname, "..", "frontEnd", "login", "register.html"));
// });

app.get("/dashboard", authenticateJWT, async (req, res) => {
    const user_id = req.user.id;
    await saveHistory(user_id, "Akses Dashboard");
    res.sendFile(path.join(__dirname, "..", "frontEnd", "index.html"));
});

async function saveHistory(user_id, action) {
    try {
        const timestamp = new Date();
        await db.query("INSERT INTO history (user_id, action, timestamp) VALUES ($1, $2, $3)", [user_id, action, timestamp]);
    } catch (err) {
        console.error("Failed to save history:", err);
    }
}

app.post("/login", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedPassword = user.password;

            if (password === storedPassword) {
                const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });
                await saveHistory(user.id, "Login");
                return res.status(200).json({ message: "Login successful", token: token, userId: user.id });
            } else {
                return res.status(401).json({ error: "Incorrect Password" });
            }
        } else {
            return res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ error: "Internal server error " });
    }
});

app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        // Check if the email already exists
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ error: "Email already exists. Try logging in." });
        } else {
            // Insert new user
            const insertResult = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [email, password]);
            
            // Check if the insertion was successful by examining the result
            if (insertResult.rows.length > 0) {
                console.log("User registered successfully:", insertResult.rows[0]);
                return res.status(200).json({ message: "Berhasil terdaftar", user: insertResult.rows[0] });
            } else {
                console.error("Failed to insert user.");
                return res.status(500).json({ error: "Failed to register user. Please try again later." });
            }
        }
    } catch (err) {
        console.error("Error during registration:", err);
        return res.status(500).json({ error: "Internal server error. Please try again later." });
    }
});


// app.post("/login", async (req, res) => {
//     const email = req.body.username;
//     const password = req.body.password;

//     if (!email || !password) {
//         return res.status(400).json({ error: "Username and password are required." });
//     }

//     try {
//         const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        
//         if (result.rows.length > 0) {
//             const user = result.rows[0];
//             const storedPassword = user.password;

//             if (password === storedPassword) {
//                 req.session.user = { id: user.id, email: user.email }; // Simpan data user di sesi
//                 await saveHistory(user.id, "Login");
//                 res.json({ message: "Login successful" });
//             } else {
//                 res.status(401).json({ error: "Incorrect Password" });
//             }
//         } else {
//             res.status(404).json({ error: "User not found" });
//         }
//     } catch (err) {
//         console.error("Error during login:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

app.get("/history", authenticateJWT, async (req, res) => {
    try {
        const user_id = req.user.id;
        const result = await db.query("SELECT * FROM history WHERE user_id = $1 ORDER BY timestamp DESC", [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching history:", err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

app.post("/log-action", authenticateJWT, async (req, res) => {
    const user_id = req.user.id;
    const action = req.body.action || "Aksi yang tidak dijelaskan";

    try {
        await saveHistory(user_id, action);
        res.json({ message: "Action logged successfully" });
    } catch (err) {
        console.error("Error logging action:", err);
        res.status(500).json({ error: "Failed to log action" });
    }
});

app.get("/get-user-data", authenticateJWT, async (req, res) => {
    try {
        const userResult = await db.query("SELECT email FROM users WHERE id = $1", [req.user.id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ username: userResult.rows[0].email });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

app.get("/user-history", authenticateJWT, async (req, res) => {
    try {
        const historyResult = await db.query(
            "SELECT action, timestamp FROM history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 30", 
            [req.user.id]  
        );

        res.json(historyResult.rows);
    } catch (error) {
        console.error("Error fetching user history:", error);
        res.status(500).json({ error: "Failed to fetch user history" });
    }
});

app.post("/change-password", authenticateJWT, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Old password and new password are required." });
    }

    try {
        const userResult = await db.query("SELECT password FROM users WHERE id = $1", [req.user.id]);

        if (userResult.rows.length === 0 || userResult.rows[0].password !== oldPassword) {
            return res.status(400).json({ error: "Incorrect old password" });
        }

        await db.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, req.user.id]);
        await saveHistory(req.user.id, "Password changed");
        
        res.json({ message: "Password successfully updated" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie("connect.sid"); // Hapus cookie sesi
        res.json({ message: "Logout successful" });
    });
});

// Endpoint untuk menyimpan hasil permainan
app.post("/save-game-result", authenticateJWT, async (req, res) => {
    const { result, distance_to_finish } = req.body;
    const user_id = req.user.id;

    if (result === undefined || result === null || distance_to_finish === undefined || distance_to_finish === null) {
        return res.status(400).json({ error: "Result and distance to finish are required." });
    }

    try {
        await db.query("INSERT INTO game_results (user_id, result, distance_to_finish, timestamp) VALUES ($1, $2, $3, NOW())", [user_id, result, distance_to_finish]);
        res.json({ message: "Game result saved successfully" });
    } catch (error) {
        console.error("Error saving game result:", error);
        res.status(500).json({ error: "Failed to save game result" });
    }
});

// Endpoint untuk mengambil riwayat permainan
app.get("/user-game-history", authenticateJWT, async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await db.query("SELECT result, distance_to_finish, timestamp FROM game_results WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 30", [user_id]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching user game history:", error);
        res.status(500).json({ error: "Failed to fetch user game history" });
    }
});

app.delete("/delete-history", authenticateJWT, async (req, res) => {
    try {
        const deleteResult = await db.query(
            "DELETE FROM history WHERE user_id = $1", 
            [req.user.id]  
        );
        res.json({ message: "History deleted successfully", deletedRows: deleteResult.rowCount });
    } catch (error) {
        console.error("Error deleting  user history:", error);
        res.status(500).json({ error: "Failed to delete user history" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
