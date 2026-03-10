// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
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
        
        // Create user (password stored as-is from frontend)
        const userId = await db.createUser({
            name, aadhar, dob, gender, mobile, email, password
        });
        
        const sessionId = generateSessionId();
        
        // Create session
        await db.createSession(userId, sessionId, getClientIp(req), req.headers['user-agent']);
        
        // Create audit log
        await db.createAuditLog({
            user_id: userId,
            session_id: sessionId,
            event_type: 'user_registered',
            description: 'New user registration',
            ip_address: getClientIp(req),
            user_agent: req.headers['user-agent'],
            additional_data: { name, aadhar, email }
        });
        
        console.log("✅ User registered with ID:", userId);
        
        res.json({ 
            success: true, 
            message: 'Registration successful',
            user_id: userId,
            session_id: sessionId
        });
        
    } catch (error) {
        console.error("❌ Registration error:", error.message);
        res.json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});

// ===== LOGIN ROUTE =====
app.post('/api/login', async (req, res) => {
    try {
        console.log("🔐 Login attempt received");
        
        const { uid, pwd } = req.body;
        
        if (!uid || !pwd) {
            return res.json({ 
                success: false, 
                message: 'Aadhaar and password required' 
            });
        }
        
        const user = await db.findUserByAadhar(uid);
        
        if (!user) {
            return res.json({ 
                success: false, 
                message: 'Invalid credentials. Demo: 123412341234 / Demo@123'
            });
        }
        
        // Direct password comparison (as in original code)
        if (user.password !== pwd) {
            return res.json({ 
                success: false, 
                message: 'Invalid credentials. Demo: 123412341234 / Demo@123'
            });
        }
        
        const sessionId = generateSessionId();
        
        // Create session
        await db.createSession(user.id, sessionId, getClientIp(req), req.headers['user-agent']);
        
        // Create audit log
        await db.createAuditLog({
            user_id: user.id,
            session_id: sessionId,
            event_type: 'user_login',
            description: 'User logged in successfully',
            ip_address: getClientIp(req),
            user_agent: req.headers['user-agent'],
            additional_data: { name: user.name }
        });
        
        console.log("✅ Login successful for:", user.name);
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user_id: user.id,
            session_id: sessionId,
            user: {
                name: user.name,
                aadhar: user.aadhar,
                email: user.email,
                mobile: user.mobile
            }
        });
        
    } catch (error) {
        console.error("❌ Login error:", error.message);
        res.json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// ===== SAVE VOICE ANALYSIS =====
app.post('/api/save-voice-analysis', async (req, res) => {
    try {
        const data = req.body;
        console.log("🎤 Saving voice analysis for user:", data.user_id);
        
        const analysisId = await db.saveVoiceAnalysis({
            user_id: data.user_id,
            session_id: data.session_id,
            question: data.question,
            answer: data.answer,
            is_correct: data.is_correct,
            attempt: data.attempt,
            voice_pitch: Math.random() * 100 + 100, // Simulated
            background_noise: Math.random() * 50,    // Simulated
            duration: 3.2,                           // Simulated
            naturalness: Math.random() * 30 + 70,    // Simulated
            is_human: data.is_correct,
            confidence: data.is_correct ? 85 : 40
        });
        
        res.json({ success: true, analysis_id: analysisId });
        
    } catch (error) {
        console.error("❌ Save voice analysis error:", error.message);
        res.json({ success: false, message: error.message });
    }
});

// ===== SAVE TYPING ANALYSIS =====
app.post('/api/save-typing-analysis', async (req, res) => {
    try {
        const data = req.body;
        console.log("⌨️ Saving typing analysis for user:", data.user_id);
        
        const analysisId = await db.saveTypingAnalysis({
            user_id: data.user_id,
            session_id: data.session_id,
            speed: data.speed || 45,
            mistakes: data.mistakes || 3,
            backspaces: data.backspaces || 5,
            total_keys: data.total_keys || 50,
            accuracy: data.accuracy || 94,
            is_human: true,
            confidence: 85
        });
        
        res.json({ success: true, analysis_id: analysisId });
        
    } catch (error) {
        console.error("❌ Save typing analysis error:", error.message);
        res.json({ success: false, message: error.message });
    }
});

// ===== SAVE MOUSE ANALYSIS =====
app.post('/api/save-mouse-analysis', async (req, res) => {
    try {
        const data = req.body;
        console.log("🖱️ Saving mouse analysis for user:", data.user_id);
        
        const analysisId = await db.saveMouseAnalysis({
            user_id: data.user_id,
            session_id: data.session_id,
            movements: data.movements || 150,
            distance: data.distance || 2000,
            clicks: data.clicks || 8,
            speed: data.speed || 80,
            pattern: "natural",
            is_human: true,
            confidence: 88
        });
        
        res.json({ success: true, analysis_id: analysisId });
        
    } catch (error) {
        console.error("❌ Save mouse analysis error:", error.message);
        res.json({ success: false, message: error.message });
    }
});

// ===== SAVE DRAWING ANALYSIS =====
app.post('/api/save-drawing-analysis', async (req, res) => {
    try {
        const data = req.body;
        console.log("🎨 Saving drawing analysis for user:", data.user_id);
        
        const analysisId = await db.saveDrawingAnalysis({
            user_id: data.user_id,
            session_id: data.session_id,
            shape: data.shape || '⬤',
            accuracy: data.accuracy || 85,
            duration: data.duration || 15,
            is_human: true,
            confidence: 85
        });
        
        res.json({ success: true, analysis_id: analysisId });
        
    } catch (error) {
        console.error("❌ Save drawing analysis error:", error.message);
        res.json({ success: false, message: error.message });
    }
});

// ===== SAVE COMPLETE ANALYSIS =====
app.post('/api/save-complete-analysis', async (req, res) => {
    try {
        const data = req.body;
        console.log("📊 Saving complete analysis for user:", data.user_id);
        
        // Get user details
        const user = await db.findUserById(data.user_id);
        
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        const analysisId = await db.saveCompleteAnalysis({
            user_id: data.user_id,
            session_id: data.session_id,
            name: user.name,
            aadhar: user.aadhar,
            mobile: user.mobile,
            email: user.email,
            
            // Voice metrics
            voice_pitch: data.voice_pitch || 145,
            background_noise: data.background_noise || 32,
            voice_duration: data.voice_duration || 3.2,
            voice_naturalness: data.voice_naturalness || 87,
            voice_is_human: data.voice_is_human || true,
            voice_confidence: data.voice_confidence || 87,
            
            // Typing metrics
            typing_speed: data.typing_speed || 45,
            typing_mistakes: data.typing_mistakes || 3,
            backspace_count: data.backspace_count || 5,
            typing_is_human: data.typing_is_human || true,
            typing_confidence: data.typing_confidence || 92,
            
            // Mouse metrics
            mouse_movements: data.mouse_movements || 156,
            mouse_distance: data.mouse_distance || 2450,
            mouse_clicks: data.mouse_clicks || 8,
            mouse_is_human: data.mouse_is_human || true,
            mouse_confidence: data.mouse_confidence || 88,
            
            // Drawing metrics
            drawing_accuracy: data.drawing_accuracy || 85,
            drawing_is_human: data.drawing_is_human || true,
            drawing_confidence: data.drawing_confidence || 85,
            
            // Overall result
            is_human_overall: data.is_human_overall !== undefined ? data.is_human_overall : true,
            overall_confidence: data.overall_confidence || 89
        });
        
        // Create audit log
        await db.createAuditLog({
            user_id: data.user_id,
            session_id: data.session_id,
            event_type: 'analysis_complete',
            description: 'Complete user analysis saved',
            ip_address: getClientIp(req),
            user_agent: req.headers['user-agent'],
            additional_data: { 
                analysis_id: analysisId,
                is_human: data.is_human_overall,
                confidence: data.overall_confidence
            }
        });
        
        res.json({ 
            success: true, 
            message: 'Complete analysis saved successfully',
            analysis_id: analysisId
        });
        
    } catch (error) {
        console.error("❌ Save complete analysis error:", error.message);
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

// ===== GET SESSION ANALYSIS =====
app.get('/api/session-analysis/:sessionId', async (req, res) => {
    try {
        const analysis = await db.getAnalysisBySessionId(req.params.sessionId);
        res.json({ success: true, analysis });
    } catch (error) {
        console.error("❌ Fetch error:", error.message);
        res.json({ success: false, analysis: null });
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

// ===== GET DATABASE STATS =====
app.get('/api/db-stats', async (req, res) => {
    try {
        const stats = await db.getDatabaseStats();
        const humanBotStats = await db.getHumanBotStats();
        res.json({ 
            success: true, 
            stats: { ...stats, ...humanBotStats }
        });
    } catch (error) {
        console.error("❌ Stats error:", error.message);
        res.json({ success: false, stats: {} });
    }
});

// ===== LOGOUT =====
app.post('/api/logout', async (req, res) => {
    try {
        const { session_id } = req.body;
        await db.endSession(session_id);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error("❌ Logout error:", error.message);
        res.json({ success: false, message: error.message });
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