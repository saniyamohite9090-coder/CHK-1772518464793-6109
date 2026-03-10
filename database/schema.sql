-- database/schema.sql
-- Run this file to create the database structure

-- Drop database if exists
DROP DATABASE IF EXISTS sbi_voice_auth;

-- Create database
CREATE DATABASE sbi_voice_auth;

-- Use database
USE sbi_voice_auth;

-- ============================================
-- USERS TABLE - Stores user registration data
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    aadhar VARCHAR(12) UNIQUE NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_aadhar (aadhar),
    INDEX idx_mobile (mobile),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- VOICE ANALYSIS TABLE - Stores voice metrics
-- ============================================
CREATE TABLE voice_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Voice Metrics
    question_asked TEXT,
    user_answer TEXT,
    is_correct BOOLEAN,
    attempt_count INT DEFAULT 0,
    
    -- Voice Characteristics
    voice_pitch DECIMAL(10,2),
    voice_tone VARCHAR(50),
    background_noise_level DECIMAL(10,2),
    voice_duration DECIMAL(10,2),
    voice_naturalness DECIMAL(5,2),
    
    -- Analysis Results
    is_human_voice BOOLEAN,
    confidence_score DECIMAL(5,2),
    
    -- Timestamps
    analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TYPING ANALYSIS TABLE - Stores typing metrics
-- ============================================
CREATE TABLE typing_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Typing Metrics
    typing_speed_wpm DECIMAL(5,2),
    typing_mistakes INT,
    backspace_count INT,
    total_keys_pressed INT,
    accuracy_percentage DECIMAL(5,2),
    
    -- Analysis Results
    is_human_typing BOOLEAN,
    confidence_score DECIMAL(5,2),
    
    -- Timestamps
    analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- MOUSE ANALYSIS TABLE - Stores mouse movements
-- ============================================
CREATE TABLE mouse_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Mouse Metrics
    mouse_movements INT,
    mouse_distance_pixels INT,
    mouse_clicks INT,
    mouse_speed DECIMAL(10,2),
    mouse_pattern TEXT,
    
    -- Analysis Results
    is_human_mouse BOOLEAN,
    confidence_score DECIMAL(5,2),
    
    -- Timestamps
    analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- DRAWING ANALYSIS TABLE - Stores canvas drawing
-- ============================================
CREATE TABLE drawing_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Drawing Metrics
    shape_required VARCHAR(10),
    shape_drawn TEXT,
    drawing_accuracy DECIMAL(5,2),
    drawing_duration DECIMAL(10,2),
    
    -- Analysis Results
    is_human_drawing BOOLEAN,
    confidence_score DECIMAL(5,2),
    
    -- Timestamps
    analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- COMPLETE ANALYSIS TABLE - Consolidated data
-- ============================================
CREATE TABLE complete_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- User Information
    name VARCHAR(255) NOT NULL,
    aadhar VARCHAR(12) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Voice Metrics
    voice_pitch DECIMAL(10,2),
    background_noise DECIMAL(10,2),
    voice_duration DECIMAL(10,2),
    voice_naturalness DECIMAL(5,2),
    voice_is_human BOOLEAN,
    voice_confidence DECIMAL(5,2),
    
    -- Typing Metrics
    typing_speed_wpm DECIMAL(5,2),
    typing_mistakes INT,
    backspace_count INT,
    typing_is_human BOOLEAN,
    typing_confidence DECIMAL(5,2),
    
    -- Mouse Metrics
    mouse_movements INT,
    mouse_distance INT,
    mouse_clicks INT,
    mouse_is_human BOOLEAN,
    mouse_confidence DECIMAL(5,2),
    
    -- Drawing Metrics
    drawing_accuracy DECIMAL(5,2),
    drawing_is_human BOOLEAN,
    drawing_confidence DECIMAL(5,2),
    
    -- Final Result
    is_human_overall BOOLEAN,
    overall_confidence DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SESSIONS TABLE - Track user sessions
-- ============================================
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- AUDIT LOGS TABLE - Track all activities
-- ============================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    additional_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_event (event_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INSERT DEMO USER
-- ============================================
INSERT INTO users (name, aadhar, dob, gender, mobile, email, password) VALUES
('Demo User', '123412341234', '1985-05-15', 'Male', '9988776655', 'demo@bank.com', 'Demo@123');

-- Get the user ID
SET @user_id = LAST_INSERT_ID();
SET @session_id = 'demo-session-123';

-- Insert sample voice analysis
INSERT INTO voice_analysis (user_id, session_id, question_asked, user_answer, is_correct, attempt_count, voice_pitch, background_noise_level, voice_duration, voice_naturalness, is_human_voice, confidence_score) VALUES
(@user_id, @session_id, 'What happens to ice in a hot pan?', 'melts', TRUE, 1, 145.5, 32.3, 3.2, 87.5, TRUE, 87.5);

-- Insert sample typing analysis
INSERT INTO typing_analysis (user_id, session_id, typing_speed_wpm, typing_mistakes, backspace_count, total_keys_pressed, accuracy_percentage, is_human_typing, confidence_score) VALUES
(@user_id, @session_id, 45.5, 3, 5, 50, 94.0, TRUE, 92.3);

-- Insert sample mouse analysis
INSERT INTO mouse_analysis (user_id, session_id, mouse_movements, mouse_distance_pixels, mouse_clicks, mouse_speed, is_human_mouse, confidence_score) VALUES
(@user_id, @session_id, 156, 2450, 8, 82.5, TRUE, 88.9);

-- Insert sample drawing analysis
INSERT INTO drawing_analysis (user_id, session_id, shape_required, drawing_accuracy, drawing_duration, is_human_drawing, confidence_score) VALUES
(@user_id, @session_id, '⬤', 85.5, 15.2, TRUE, 85.5);

-- Insert complete analysis
INSERT INTO complete_analysis (
    user_id, session_id, name, aadhar, mobile, email,
    voice_pitch, background_noise, voice_duration, voice_naturalness, voice_is_human, voice_confidence,
    typing_speed_wpm, typing_mistakes, backspace_count, typing_is_human, typing_confidence,
    mouse_movements, mouse_distance, mouse_clicks, mouse_is_human, mouse_confidence,
    drawing_accuracy, drawing_is_human, drawing_confidence,
    is_human_overall, overall_confidence
) VALUES (
    @user_id, @session_id, 'Demo User', '123412341234', '9988776655', 'demo@bank.com',
    145.5, 32.3, 3.2, 87.5, TRUE, 87.5,
    45.5, 3, 5, TRUE, 92.3,
    156, 2450, 8, TRUE, 88.9,
    85.5, TRUE, 85.5,
    TRUE, 89.5
);

-- Insert session
INSERT INTO sessions (user_id, session_id, ip_address, user_agent) VALUES
(@user_id, @session_id, '127.0.0.1', 'Demo Browser');

-- Insert audit log
INSERT INTO audit_logs (user_id, session_id, event_type, event_description, ip_address, user_agent) VALUES
(@user_id, @session_id, 'user_registered', 'Demo user registered', '127.0.0.1', 'Demo Browser');

-- ============================================
-- CREATE VIEWS FOR EASY DATA ACCESS
-- ============================================

-- View for complete user profile
CREATE VIEW user_complete_profile AS
SELECT 
    u.id,
    u.name,
    u.aadhar,
    u.dob,
    u.gender,
    u.mobile,
    u.email,
    u.created_at as registration_date,
    ca.*
FROM users u
LEFT JOIN complete_analysis ca ON u.id = ca.user_id
ORDER BY ca.created_at DESC;

-- View for analysis statistics
CREATE VIEW analysis_statistics AS
SELECT 
    COUNT(DISTINCT user_id) as total_users_analyzed,
    AVG(typing_speed_wpm) as avg_typing_speed,
    AVG(mouse_movements) as avg_mouse_movements,
    AVG(voice_pitch) as avg_voice_pitch,
    AVG(background_noise) as avg_background_noise,
    SUM(CASE WHEN is_human_overall = TRUE THEN 1 ELSE 0 END) as human_count,
    SUM(CASE WHEN is_human_overall = FALSE THEN 1 ELSE 0 END) as bot_count,
    AVG(overall_confidence) as avg_confidence
FROM complete_analysis;

-- ============================================
-- SHOW ALL TABLES
-- ============================================
SHOW TABLES;

-- ============================================
-- CREATE DATABASE USER FOR APPLICATION
-- ============================================
-- CREATE USER IF NOT EXISTS 'sbi_app'@'localhost' IDENTIFIED BY 'Sbi@123';
-- GRANT ALL PRIVILEGES ON sbi_voice_auth.* TO 'sbi_app'@'localhost';
-- FLUSH PRIVILEGES;