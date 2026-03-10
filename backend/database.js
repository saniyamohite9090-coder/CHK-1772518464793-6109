// backend/database.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Create connection pool
const pool = mysql.createPool(config.database);

// Initialize database with schema
async function initDatabase() {
    let connection;
    try {
        console.log("🔌 Connecting to MySQL...");
        
        // Create connection without database selected
        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            port: config.database.port,
            multipleStatements: true
        });

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema
        await connection.query(schema);
        
        console.log("✅ Database initialized successfully");
        console.log("📊 Tables created:");
        console.log("   - users");
        console.log("   - voice_analysis");
        console.log("   - typing_analysis");
        console.log("   - mouse_analysis");
        console.log("   - drawing_analysis");
        console.log("   - complete_analysis");
        console.log("   - sessions");
        console.log("   - audit_logs");

    } catch (error) {
        console.error("❌ Database initialization error:", error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test database connection
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log("✅ MySQL connection test successful");
        
        // Get database stats
        const [tables] = await conn.query("SHOW TABLES");
        console.log(`📊 Total tables: ${tables.length}`);
        
        conn.release();
        return true;
    } catch (error) {
        console.error("❌ MySQL connection test failed:", error.message);
        return false;
    }
}

// ===== USER FUNCTIONS =====
async function createUser(userData) {
    const { name, aadhar, dob, gender, mobile, email, password } = userData;
    
    const [result] = await pool.query(
        `INSERT INTO users (name, aadhar, dob, gender, mobile, email, password) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, aadhar, dob, gender, mobile, email, password]
    );
    
    return result.insertId;
}

async function findUserByAadhar(aadhar) {
    const [users] = await pool.query(
        "SELECT * FROM users WHERE aadhar = ?",
        [aadhar]
    );
    return users[0];
}

async function findUserById(id) {
    const [users] = await pool.query(
        "SELECT id, name, aadhar, dob, gender, mobile, email, created_at FROM users WHERE id = ?",
        [id]
    );
    return users[0];
}

async function getAllUsers() {
    const [users] = await pool.query(`
        SELECT id, name, aadhar, mobile, email, created_at 
        FROM users 
        ORDER BY created_at DESC
    `);
    return users;
}

// ===== SESSION FUNCTIONS =====
async function createSession(userId, sessionId, ipAddress, userAgent) {
    const [result] = await pool.query(
        `INSERT INTO sessions (user_id, session_id, ip_address, user_agent) 
         VALUES (?, ?, ?, ?)`,
        [userId, sessionId, ipAddress, userAgent]
    );
    return result.insertId;
}

async function endSession(sessionId) {
    await pool.query(
        `UPDATE sessions SET is_active = FALSE, logout_time = CURRENT_TIMESTAMP 
         WHERE session_id = ?`,
        [sessionId]
    );
}

// ===== VOICE ANALYSIS FUNCTIONS =====
async function saveVoiceAnalysis(data) {
    const { user_id, session_id, question, answer, is_correct, attempt, 
            voice_pitch, background_noise, duration, naturalness, is_human, confidence } = data;
    
    const [result] = await pool.query(
        `INSERT INTO voice_analysis 
         (user_id, session_id, question_asked, user_answer, is_correct, attempt_count,
          voice_pitch, background_noise_level, voice_duration, voice_naturalness,
          is_human_voice, confidence_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, question, answer, is_correct, attempt,
         voice_pitch, background_noise, duration, naturalness, is_human, confidence]
    );
    
    return result.insertId;
}

// ===== TYPING ANALYSIS FUNCTIONS =====
async function saveTypingAnalysis(data) {
    const { user_id, session_id, speed, mistakes, backspaces, total_keys, 
            accuracy, is_human, confidence } = data;
    
    const [result] = await pool.query(
        `INSERT INTO typing_analysis 
         (user_id, session_id, typing_speed_wpm, typing_mistakes, backspace_count,
          total_keys_pressed, accuracy_percentage, is_human_typing, confidence_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, speed, mistakes, backspaces, total_keys, 
         accuracy, is_human, confidence]
    );
    
    return result.insertId;
}

// ===== MOUSE ANALYSIS FUNCTIONS =====
async function saveMouseAnalysis(data) {
    const { user_id, session_id, movements, distance, clicks, speed, 
            pattern, is_human, confidence } = data;
    
    const [result] = await pool.query(
        `INSERT INTO mouse_analysis 
         (user_id, session_id, mouse_movements, mouse_distance_pixels, mouse_clicks,
          mouse_speed, mouse_pattern, is_human_mouse, confidence_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, movements, distance, clicks, speed, 
         pattern, is_human, confidence]
    );
    
    return result.insertId;
}

// ===== DRAWING ANALYSIS FUNCTIONS =====
async function saveDrawingAnalysis(data) {
    const { user_id, session_id, shape, accuracy, duration, is_human, confidence } = data;
    
    const [result] = await pool.query(
        `INSERT INTO drawing_analysis 
         (user_id, session_id, shape_required, drawing_accuracy, drawing_duration,
          is_human_drawing, confidence_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, shape, accuracy, duration, is_human, confidence]
    );
    
    return result.insertId;
}

// ===== COMPLETE ANALYSIS FUNCTIONS =====
async function saveCompleteAnalysis(data) {
    const { 
        user_id, session_id, name, aadhar, mobile, email,
        voice_pitch, background_noise, voice_duration, voice_naturalness, 
        voice_is_human, voice_confidence,
        typing_speed, typing_mistakes, backspace_count, 
        typing_is_human, typing_confidence,
        mouse_movements, mouse_distance, mouse_clicks, 
        mouse_is_human, mouse_confidence,
        drawing_accuracy, drawing_is_human, drawing_confidence,
        is_human_overall, overall_confidence
    } = data;
    
    const [result] = await pool.query(
        `INSERT INTO complete_analysis 
         (user_id, session_id, name, aadhar, mobile, email,
          voice_pitch, background_noise, voice_duration, voice_naturalness, 
          voice_is_human, voice_confidence,
          typing_speed_wpm, typing_mistakes, backspace_count, 
          typing_is_human, typing_confidence,
          mouse_movements, mouse_distance, mouse_clicks, 
          mouse_is_human, mouse_confidence,
          drawing_accuracy, drawing_is_human, drawing_confidence,
          is_human_overall, overall_confidence) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, name, aadhar, mobile, email,
         voice_pitch, background_noise, voice_duration, voice_naturalness, 
         voice_is_human, voice_confidence,
         typing_speed, typing_mistakes, backspace_count, 
         typing_is_human, typing_confidence,
         mouse_movements, mouse_distance, mouse_clicks, 
         mouse_is_human, mouse_confidence,
         drawing_accuracy, drawing_is_human, drawing_confidence,
         is_human_overall, overall_confidence]
    );
    
    return result.insertId;
}

// ===== DATA RETRIEVAL FUNCTIONS =====
async function getAllAnalysis() {
    const [rows] = await pool.query(`
        SELECT * FROM complete_analysis 
        ORDER BY created_at DESC
    `);
    return rows;
}

async function getAnalysisByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT * FROM complete_analysis 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `, [userId]);
    return rows;
}

async function getAnalysisBySessionId(sessionId) {
    const [rows] = await pool.query(`
        SELECT * FROM complete_analysis 
        WHERE session_id = ? 
        ORDER BY created_at DESC
    `, [sessionId]);
    return rows[0];
}

// ===== AUDIT FUNCTIONS =====
async function createAuditLog(data) {
    const { user_id, session_id, event_type, description, ip_address, user_agent, additional_data } = data;
    
    const [result] = await pool.query(
        `INSERT INTO audit_logs 
         (user_id, session_id, event_type, event_description, ip_address, user_agent, additional_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, event_type, description, ip_address, user_agent, JSON.stringify(additional_data)]
    );
    
    return result.insertId;
}

// ===== STATISTICS FUNCTIONS =====
async function getDatabaseStats() {
    const [stats] = await pool.query(`
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM voice_analysis) as total_voice_analyses,
            (SELECT COUNT(*) FROM typing_analysis) as total_typing_analyses,
            (SELECT COUNT(*) FROM mouse_analysis) as total_mouse_analyses,
            (SELECT COUNT(*) FROM drawing_analysis) as total_drawing_analyses,
            (SELECT COUNT(*) FROM complete_analysis) as total_complete_analyses,
            (SELECT COUNT(*) FROM sessions) as total_sessions,
            (SELECT COUNT(*) FROM audit_logs) as total_audit_logs
    `);
    return stats[0];
}

async function getHumanBotStats() {
    const [stats] = await pool.query(`
        SELECT 
            SUM(CASE WHEN is_human_overall = TRUE THEN 1 ELSE 0 END) as human_count,
            SUM(CASE WHEN is_human_overall = FALSE THEN 1 ELSE 0 END) as bot_count,
            AVG(overall_confidence) as avg_confidence
        FROM complete_analysis
    `);
    return stats[0];
}

module.exports = {
    pool,
    initDatabase,
    testConnection,
    
    // User functions
    createUser,
    findUserByAadhar,
    findUserById,
    getAllUsers,
    
    // Session functions
    createSession,
    endSession,
    
    // Analysis functions
    saveVoiceAnalysis,
    saveTypingAnalysis,
    saveMouseAnalysis,
    saveDrawingAnalysis,
    saveCompleteAnalysis,
    
    // Data retrieval
    getAllAnalysis,
    getAnalysisByUserId,
    getAnalysisBySessionId,
    
    // Audit functions
    createAuditLog,
    
    // Statistics
    getDatabaseStats,
    getHumanBotStats
};