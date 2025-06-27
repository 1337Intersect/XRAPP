const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'technician',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Service reports table
    db.run(`
        CREATE TABLE IF NOT EXISTS service_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            intervention_number TEXT UNIQUE NOT NULL,
            date TEXT NOT NULL,
            technician_name TEXT NOT NULL,
            client_name TEXT NOT NULL,
            client_address TEXT,
            client_city TEXT,
            client_phone TEXT,
            product_brand TEXT,
            product_model TEXT,
            product_serial TEXT,
            service_type TEXT NOT NULL,
            problem_reported TEXT,
            problem_found TEXT,
            work_description TEXT,
            parts_data TEXT,
            hours_data TEXT,
            costs_data TEXT,
            notes TEXT,
            customer_signature TEXT,
            status TEXT DEFAULT 'draft',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;
