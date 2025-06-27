const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Load HTML template
const loadTemplate = async () => {
    const templatePath = path.join(__dirname, '../templates/pdfTemplate.html');
    return await fs.readFile(templatePath, 'utf-8');
};

// Generate PDF endpoint
router.post('/generate', async (req, res) => {
    try {
        const formData = req.body;
ECHO disattivato.
        // Calculate totals
        const materialsCost = formData.parts?.reduce((sum, part) => 
            sum + (part.price * part.quantity), 0) || 0;
        const subtotal = materialsCost + (formData.costs?.labor || 0) + (formData.costs?.callout || 0);
        const withVat = subtotal * 1.22;
ECHO disattivato.
        const dataWithTotals = {
            ...formData,
            totals: {
                materials: materialsCost,
                subtotal: subtotal,
                withVat: withVat
            }
        };
ECHO disattivato.
        // Load and populate template
        let htmlTemplate = await loadTemplate();
ECHO disattivato.
        // Simple template replacement
        htmlTemplate = htmlTemplate.replace(/{{date}}/g, formData.date || ''');
        htmlTemplate = htmlTemplate.replace(/{{technician}}/g, formData.technician || ''');
        htmlTemplate = htmlTemplate.replace(/{{interventionNumber}}/g, formData.interventionNumber || ''');
        htmlTemplate = htmlTemplate.replace(/{{clientName}}/g, formData.client?.name || ''');
        htmlTemplate = htmlTemplate.replace(/{{clientAddress}}/g, formData.client?.address || ''');
        htmlTemplate = htmlTemplate.replace(/{{clientCity}}/g, formData.client?.city || ''');
        htmlTemplate = htmlTemplate.replace(/{{productBrand}}/g, formData.product?.brand || ''');
        htmlTemplate = htmlTemplate.replace(/{{productModel}}/g, formData.product?.model || ''');
        htmlTemplate = htmlTemplate.replace(/{{workDescription}}/g, formData.workDescription || ''');
        htmlTemplate = htmlTemplate.replace(/{{totalWithVat}}/g, withVat.toFixed(2));
ECHO disattivato.
        // Generate PDF
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
ECHO disattivato.
        const page = await browser.newPage();
        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
ECHO disattivato.
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });
ECHO disattivato.
        await browser.close();
ECHO disattivato.
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
            `attachment; filename=intervento_${formData.interventionNumber || 'report'}.pdf`);
ECHO disattivato.
        res.send(pdfBuffer);
ECHO disattivato.
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

module.exports = router;
