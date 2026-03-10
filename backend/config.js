// backend/config.js
module.exports = {
    database: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'sbi_auth_db',
        port: 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    server: {
        port: 3000
    }
};