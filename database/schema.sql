-- database/schema.sql
-- Run this file to create the database structure

-- Drop database if exists
DROP DATABASE IF EXISTS sbi_auth_db;

-- Create database
CREATE DATABASE sbi_auth_db;

-- Use database
USE sbi_auth_db;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    aadhar VARCHAR(12) UNIQUE NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_analysis table
CREATE TABLE user_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    aadhar_number VARCHAR(12) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    typing_speed_wpm DECIMAL(5,2),
    typing_mistakes INT,
    backspace_count INT,
    mouse_movements INT,
    mouse_distance_pixels INT,
    mouse_clicks INT,
    voice_pitch_hz DECIMAL(10,2),
    background_noise_level DECIMAL(10,2),
    voice_duration_seconds DECIMAL(5,2),
    is_human BOOLEAN,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert demo user (password will be hashed by application)
INSERT INTO users (full_name, aadhar, mobile, email, password) 
VALUES ('Demo User', '123412341234', '9988776655', 'demo@bank.com', 'Demo@123');

-- Show tables to confirm
SHOW TABLES;