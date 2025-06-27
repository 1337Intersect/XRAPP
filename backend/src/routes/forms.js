const express = require('express');
const db = require('../models/database');

const router = express.Router();

// Save form data
router.post('/save', (req, res) => {
    const formData = req.body;
ECHO disattivato.
    const sql = `
        INSERT INTO service_reports (
            intervention_number, date, technician_name, client_name,
            client_address, client_city, product_brand, product_model,
            work_description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
ECHO disattivato.
    const values = [
        formData.interventionNumber,
        formData.date,
        formData.technician,
        formData.client?.name,
        formData.client?.address,
        formData.client?.city,
        formData.product?.brand,
        formData.product?.model,
        formData.workDescription,
        formData.status || 'draft'
    ];
ECHO disattivato.
    db.run(sql, values, function(err) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to save form' });
        } else {
            res.json({ id: this.lastID, message: 'Form saved successfully' });
        }
    });
});

// Get all forms
router.get('/list', (req, res) => {
    const sql = 'SELECT * FROM service_reports ORDER BY created_at DESC';
ECHO disattivato.
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch forms' });
        } else {
            res.json(rows);
        }
    });
});

module.exports = router;
