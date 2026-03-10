const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const DB_PATH = path.join(__dirname, 'database', 'db.json');

// Ensure database directory and file exist
async function ensureDatabase() {
    const dbDir = path.join(__dirname, 'database');
    try {
        await fs.access(dbDir);
    } catch {
        await fs.mkdir(dbDir);
    }
    
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.writeFile(DB_PATH, JSON.stringify({ users: [], audits: [] }, null, 2));
    }
}

// Helper to read database
async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [], audits: [] };
    }
}

// Helper to write database
async function writeDB(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// Initialize database
ensureDatabase();

// Routes

// Register user
app.post('/api/register', async (req, res) => {
    try {
        const db = await readDB();
        
        // Check if user already exists
        const existingUser = db.users.find(u => u.aadhar === req.body.aadhar);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }
        
        const newUser = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        db.users.push(newUser);
        await writeDB(db);
        
        res.json({ 
            success: true, 
            user: { 
                id: newUser.id, 
                name: newUser.name, 
                aadhar: newUser.aadhar 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { aadhar, password } = req.body;
        const db = await readDB();
        
        const user = db.users.find(u => u.aadhar === aadhar && u.password === password);
        
        if (user) {
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    aadhar: user.aadhar 
                } 
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users (for testing)
app.get('/api/users', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add audit log
app.post('/api/audit', async (req, res) => {
    try {
        const db = await readDB();
        db.audits.push({
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString()
        });
        await writeDB(db);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Database: ${DB_PATH}`);
});