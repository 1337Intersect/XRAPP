const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Configure CORS for PDF downloads
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is working!' });
});

// PDF generation with clean response
app.post('/api/pdf/generate', async (req, res) => {
  try {
    console.log('🔄 PDF generation started...');
    
    // Load template
    const templatePath = path.join(__dirname, 'templates/pdfTemplate.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace template variables
    const formData = req.body;
    const materialsCost = formData.parts?.reduce((sum, part) => 
      sum + (part.price * part.quantity), 0) || 0;
    const subtotal = materialsCost + (formData.costs?.labor || 0) + (formData.costs?.callout || 0);
    const withVat = subtotal * 1.22;
    
    // Simple replacements
    htmlContent = htmlContent.replace(/{{date}}/g, formData.date || '');
    htmlContent = htmlContent.replace(/{{technician}}/g, formData.technician || '');
    htmlContent = htmlContent.replace(/{{interventionNumber}}/g, formData.interventionNumber || '');
    htmlContent = htmlContent.replace(/{{clientName}}/g, formData.client?.name || '');
    htmlContent = htmlContent.replace(/{{clientAddress}}/g, formData.client?.address || '');
    htmlContent = htmlContent.replace(/{{clientCity}}/g, formData.client?.city || '');
    htmlContent = htmlContent.replace(/{{clientPhone}}/g, formData.client?.phone || '');
    htmlContent = htmlContent.replace(/{{productBrand}}/g, formData.product?.brand || '');
    htmlContent = htmlContent.replace(/{{productModel}}/g, formData.product?.model || '');
    htmlContent = htmlContent.replace(/{{productSerial}}/g, formData.product?.serialNumber || '');
    htmlContent = htmlContent.replace(/{{problemReported}}/g, formData.issues?.reported || '');
    htmlContent = htmlContent.replace(/{{problemFound}}/g, formData.issues?.found || '');
    htmlContent = htmlContent.replace(/{{workDescription}}/g, formData.workDescription || '');
    htmlContent = htmlContent.replace(/{{totalWithVat}}/g, withVat.toFixed(2));
    
    // Clean up any remaining placeholders
    htmlContent = htmlContent.replace(/{{[^}]+}}/g, '');
    
    console.log('🚀 Launching browser...');
    
    // Launch browser with specific settings
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for completion
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('📄 Generating PDF...');
    
    // Generate PDF with specific options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm', 
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
    
    // Set headers before sending
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="intervento_${formData.interventionNumber || 'report'}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send only the PDF buffer, nothing else
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('❌ PDF Error:', error.message);
    
    // Send JSON error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'PDF generation failed',
        message: error.message
      });
    }
  }
});

// Simple form save
app.post('/api/forms/save', (req, res) => {
  console.log('💾 Form saved:', req.body.interventionNumber);
  res.json({ message: 'Form saved successfully' });
});

app.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
  console.log('📄 Ready for PDF generation');
});