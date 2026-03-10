// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./database');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize database
(async () => {
    try {
        await db.initDatabase();
        await db.testConnection();
    } catch (error) {
        console.error("Failed to initialize database:", error.message);
    }
})();

// Generate session ID
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

// Get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
}

// ===== TEST ROUTES =====
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: "Server is working correctly!",
        time: new Date().toISOString()
    });
});

app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await db.testConnection();
        const stats = await db.getDatabaseStats();
        res.json({ 
            success: true,
            status: 'healthy',
            database: dbStatus ? 'connected' : 'disconnected',
            server: 'running',
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({ 
            success: false,
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// ===== REGISTRATION ROUTE =====
app.post('/api/register', async (req, res) => {
    try {
        console.log("📝 Registration request received");
        
        const { name, aadhar, dob, gender, mobile, email, password } = req.body;
        
        // Validate required fields
        if (!name || !aadhar || !dob || !gender || !mobile || !email || !password) {
            return res.json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        // Validate aadhar (12 digits)
        if (!/^\d{12}$/.test(aadhar)) {
            return res.json({ 
                success: false, 
                message: 'Aadhaar must be 12 digits' 
            });
        }
        
        // Validate mobile (10 digits)
        if (!/^\d{10}$/.test(mobile)) {
            return res.json({ 
                success: false, 
                message: 'Mobile must be 10 digits' 
            });
        }
        
        // Check if user exists
        const existingUser = await db.findUserByAadhar(aadhar);
        if (existingUser) {
            return res.json({ 
                success: false, 
                message: 'User already exists with this Aadhaar number' 
            });
        }
        
        // Create user in database
        const userId = await db.createUser({
            full_name: name,
            aadhar,
            mobile,
            email,
            password
        });
        
        console.log("✅ User registered with ID:", userId);
        
        res.json({ 
            success: true, 
            message: 'Registration successful',
            user_id: userId
        });
        
    } catch (error) {
        console.error("❌ Registration error:", error.message);
        res.json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// ===== LOGIN ROUTE - FIXED VERSION =====
app.post('/api/login', async (req, res) => {
    try {
        console.log("🔐 Login attempt received for:", req.body.uid);
        
        const { uid, pwd } = req.body;
        
        if (!uid || !pwd) {
            return res.json({ 
                success: false, 
                message: 'Aadhaar and password required' 
            });
        }
        
        const user = await db.findUserByAadhar(uid);
        
        if (!user) {
            console.log("❌ User not found:", uid);
            return res.json({ 
                success: false, 
                message: 'Invalid credentials. Demo: 123412341234 / Demo@123'
            });
        }

        console.log("✅ User found:", user.full_name);
        console.log("Password from DB:", user.password ? user.password.substring(0, 20) + "..." : "No password");
        
        let validPassword = false;
        
        // Check if password is hashed (starts with $2a$)
        if (user.password && user.password.startsWith('$2a$')) {
            // Compare with bcrypt
            validPassword = await bcrypt.compare(pwd, user.password);
            console.log("🔐 Bcrypt comparison result:", validPassword);
        } else {
            // Direct comparison for plain text passwords
            validPassword = (user.password === pwd);
            console.log("🔐 Direct comparison result:", validPassword);
        }
        
        if (!validPassword) {
            console.log("❌ Invalid password for user:", uid);
            return res.json({ 
                success: false, 
                message: 'Invalid credentials. Demo: 123412341234 / Demo@123'
            });
        }
        
        const sessionId = generateSessionId();
        
        console.log("✅ Login successful for:", user.full_name);
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user_id: user.id,
            session_id: sessionId,
            user: {
                name: user.full_name,
                aadhar: user.aadhar,
                email: user.email,
                mobile: user.mobile
            }
        });
        
    } catch (error) {
        console.error("❌ Login error:", error.message);
        res.json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// ===== SAVE USER ANALYSIS =====
app.post('/api/save-analysis', async (req, res) => {
    try {
        const data = req.body;
        console.log("📊 Saving analysis for user:", data.user_id);
        
        const analysisId = await db.saveUserAnalysis({
            user_id: data.user_id,
            session_id: data.session_id,
            full_name: data.full_name,
            aadhar_number: data.aadhar_number,
            mobile_number: data.mobile_number,
            email: data.email,
            typing_speed_wpm: data.typing_speed_wpm,
            typing_mistakes: data.typing_mistakes,
            backspace_count: data.backspace_count,
            mouse_movements: data.mouse_movements,
            mouse_distance_pixels: data.mouse_distance_pixels,
            mouse_clicks: data.mouse_clicks,
            voice_pitch_hz: data.voice_pitch_hz,
            background_noise_level: data.background_noise_level,
            voice_duration_seconds: data.voice_duration_seconds,
            is_human: data.is_human,
            confidence_score: data.confidence_score
        });
        
        res.json({ 
            success: true, 
            message: 'Analysis saved successfully',
            analysis_id: analysisId
        });
        
    } catch (error) {
        console.error("❌ Save analysis error:", error.message);
        res.json({ success: false, message: error.message });
    }
});

// ===== GET ALL ANALYSIS =====
app.get('/api/all-analysis', async (req, res) => {
    try {
        const analysis = await db.getAllAnalysis();
        res.json({ success: true, analysis });
    } catch (error) {
        console.error("❌ Fetch error:", error.message);
        res.json({ success: false, analysis: [] });
    }
});

// ===== GET USER ANALYSIS =====
app.get('/api/user-analysis/:userId', async (req, res) => {
    try {
        const analysis = await db.getAnalysisByUserId(req.params.userId);
        res.json({ success: true, analysis });
    } catch (error) {
        console.error("❌ Fetch error:", error.message);
        res.json({ success: false, analysis: [] });
    }
});

// ===== GET DATABASE STATS =====
app.get('/api/db-stats', async (req, res) => {
    try {
        const stats = await db.getDatabaseStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error("❌ Stats error:", error.message);
        res.json({ success: false, stats: {} });
    }
});

// ===== GET ALL USERS =====
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json({ success: true, users });
    } catch (error) {
        console.error("❌ Fetch users error:", error.message);
        res.json({ success: false, users: [] });
    }
});

// ===== SERVE FRONTEND =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`\n🚀 ==================================`);
    console.log(`✅ Server is running!`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 Test API: http://localhost:${PORT}/api/test`);
    console.log(`💊 Health: http://localhost:${PORT}/api/health`);
    console.log(`📊 DB Stats: http://localhost:${PORT}/api/db-stats`);
    console.log(`📋 All Analysis: http://localhost:${PORT}/api/all-analysis`);
    console.log(`👥 All Users: http://localhost:${PORT}/api/users`);
    console.log(`💾 Database: MySQL (${config.database.database})`);
    console.log(`👤 Demo Login: 123412341234 / Demo@123`);
    console.log(`=====================================\n`);
});