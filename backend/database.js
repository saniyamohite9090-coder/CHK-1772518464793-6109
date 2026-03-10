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

        // Read schema.sql file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema
        await connection.query(schema);
        
        console.log("✅ Database initialized successfully");
        console.log("📊 Tables created: users, user_analysis");

        // Hash the demo user password if it exists and is plain text
        await hashDemoUserPassword(connection);

    } catch (error) {
        console.error("❌ Database initialization error:", error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Hash demo user password if it's plain text
async function hashDemoUserPassword(connection) {
    try {
        // Use the connection passed or create a new one
        const conn = connection || await pool.getConnection();
        
        // Check if demo user exists with plain text password
        const [users] = await conn.query(
            "SELECT * FROM users WHERE aadhar = ?",
            ['123412341234']
        );
        
        if (users.length > 0) {
            const user = users[0];
            
            // Check if password is not hashed (starts with $2a$ for bcrypt)
            if (!user.password.startsWith('$2a$')) {
                console.log("🔄 Hashing demo user password...");
                
                // Hash the password
                const hashedPassword = await bcrypt.hash(user.password, 10);
                
                // Update the password
                await conn.query(
                    "UPDATE users SET password = ? WHERE aadhar = ?",
                    [hashedPassword, '123412341234']
                );
                
                console.log("✅ Demo user password hashed successfully");
            } else {
                console.log("✅ Demo user password already hashed");
            }
        }
        
        if (!connection) conn.release();
        
    } catch (error) {
        console.error("❌ Error hashing demo password:", error.message);
    }
}

// Test database connection
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log("✅ MySQL connection test successful");
        conn.release();
        return true;
    } catch (error) {
        console.error("❌ MySQL connection test failed:", error.message);
        return false;
    }
}

// ===== USER FUNCTIONS =====
async function createUser(userData) {
    const { full_name, aadhar, mobile, email, password } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
        `INSERT INTO users (full_name, aadhar, mobile, email, password) 
         VALUES (?, ?, ?, ?, ?)`,
        [full_name, aadhar, mobile, email, hashedPassword]
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
        "SELECT id, full_name, aadhar, mobile, email, created_at FROM users WHERE id = ?",
        [id]
    );
    return users[0];
}

async function getAllUsers() {
    const [users] = await pool.query(`
        SELECT id, full_name, aadhar, mobile, email, created_at 
        FROM users 
        ORDER BY created_at DESC
    `);
    return users;
}

// ===== ANALYSIS FUNCTIONS =====
async function saveUserAnalysis(analysisData) {
    const { 
        user_id, session_id, full_name, aadhar_number, mobile_number, email,
        typing_speed_wpm, typing_mistakes, backspace_count,
        mouse_movements, mouse_distance_pixels, mouse_clicks,
        voice_pitch_hz, background_noise_level, voice_duration_seconds,
        is_human, confidence_score
    } = analysisData;
    
    const [result] = await pool.query(
        `INSERT INTO user_analysis 
         (user_id, session_id, full_name, aadhar_number, mobile_number, email,
          typing_speed_wpm, typing_mistakes, backspace_count,
          mouse_movements, mouse_distance_pixels, mouse_clicks,
          voice_pitch_hz, background_noise_level, voice_duration_seconds,
          is_human, confidence_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, session_id, full_name, aadhar_number, mobile_number, email,
         typing_speed_wpm, typing_mistakes, backspace_count,
         mouse_movements, mouse_distance_pixels, mouse_clicks,
         voice_pitch_hz, background_noise_level, voice_duration_seconds,
         is_human, confidence_score]
    );
    
    return result.insertId;
}

async function getAllAnalysis() {
    const [rows] = await pool.query(`
        SELECT * FROM user_analysis 
        ORDER BY created_at DESC
    `);
    return rows;
}

async function getAnalysisByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT * FROM user_analysis 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `, [userId]);
    return rows;
}

async function getAnalysisBySessionId(sessionId) {
    const [rows] = await pool.query(`
        SELECT * FROM user_analysis 
        WHERE session_id = ? 
        ORDER BY created_at DESC
    `, [sessionId]);
    return rows;
}

// ===== STATISTICS FUNCTIONS =====
async function getDatabaseStats() {
    const [stats] = await pool.query(`
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM user_analysis) as total_analyses,
            (SELECT AVG(typing_speed_wpm) FROM user_analysis) as avg_typing_speed,
            (SELECT AVG(confidence_score) FROM user_analysis) as avg_confidence,
            (SELECT SUM(CASE WHEN is_human = TRUE THEN 1 ELSE 0 END) FROM user_analysis) as human_count,
            (SELECT SUM(CASE WHEN is_human = FALSE THEN 1 ELSE 0 END) FROM user_analysis) as bot_count
    `);
    return stats[0];
}

module.exports = {
    pool,
    initDatabase,
    testConnection,
    createUser,
    findUserByAadhar,
    findUserById,
    getAllUsers,
    saveUserAnalysis,
    getAllAnalysis,
    getAnalysisByUserId,
    getAnalysisBySessionId,
    getDatabaseStats
};