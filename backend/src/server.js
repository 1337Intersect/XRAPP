const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001; // Ripristinato a 3001

// Configure CORS for PDF downloads
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Serve static assets (logos)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is working!' });
});

// Helper function to generate parts table rows (6 righe dati + 1 header = 7 totali)
const generatePartsRows = (parts) => {
  const dataRows = 6; // Esattamente 6 righe di dati come l'originale
  const partRows = [];
  
  // Add actual parts
  if (parts && parts.length > 0) {
    parts.slice(0, dataRows).forEach(part => {
      partRows.push(`
        <tr>
          <td class="parts-data">${part.code || ''}</td>
          <td class="parts-data description">${part.description || ''}</td>
          <td class="parts-data">${part.quantity || ''}</td>
          <td class="parts-data">€ ${part.price ? part.price.toFixed(2) : '0.00'}</td>
        </tr>
      `);
    });
  }
  
  // Fill remaining rows to make exactly 6 data rows
  const emptyRowsNeeded = dataRows - partRows.length;
  for (let i = 0; i < emptyRowsNeeded; i++) {
    partRows.push(`
      <tr>
        <td class="parts-data">&nbsp;</td>
        <td class="parts-data">&nbsp;</td>
        <td class="parts-data">&nbsp;</td>
        <td class="parts-data">&nbsp;</td>
      </tr>
    `);
  }
  
  return partRows.join('');
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString('it-IT');
  
  try {
    // Handle various date formats
    let date;
    if (dateString.includes('-')) {
      // ISO format: YYYY-MM-DD
      date = new Date(dateString);
    } else if (dateString.includes('/')) {
      // Format: DD/MM/YYYY or MM/DD/YYYY
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY for Italian format
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString('it-IT');
    }
    
    return date.toLocaleDateString('it-IT');
  } catch (error) {
    console.error('Date formatting error:', error);
    return new Date().toLocaleDateString('it-IT');
  }
};

// Helper function to get checked class
const getCheckedClass = (value) => {
  return value === true ? 'checked' : '';
};

// PDF generation with complete form support
app.post('/api/pdf/generate', async (req, res) => {
  try {
    console.log('🔄 PDF generation started...');
    
    // Load template
    const templatePath = path.join(__dirname, 'templates/pdfTemplate.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');
    
    const formData = req.body;
    console.log('📋 Form data received:', JSON.stringify(formData, null, 2));
    
    // Calculate totals
    const materialsCost = formData.parts?.reduce((sum, part) => 
      sum + ((part.price || 0) * (part.quantity || 0)), 0) || 0;
    const laborCost = formData.costs?.labor || 0;
    const calloutCost = formData.costs?.callout || 0;
    const subtotal = materialsCost + laborCost + calloutCost;
    const withVat = subtotal * 1.22;
    
    console.log('💰 Calculated costs:', {
      materialsCost: materialsCost.toFixed(2),
      laborCost: laborCost.toFixed(2),
      calloutCost: calloutCost.toFixed(2),
      subtotal: subtotal.toFixed(2),
      withVat: withVat.toFixed(2)
    });
    
    // Generate parts table
    const partsRows = generatePartsRows(formData.parts);
    
    // Basic replacements
    htmlContent = htmlContent.replace(/{{date}}/g, formatDate(formData.date));
    htmlContent = htmlContent.replace(/{{technician}}/g, formData.technician || '');
    htmlContent = htmlContent.replace(/{{interventionNumber}}/g, formData.interventionNumber || '');
    
    // Loghi sempre visibili - rimosse le sostituzioni {{showPernix}} e {{showAxter}}
    
    // Performed by checkboxes
    htmlContent = htmlContent.replace(/{{pernixChecked}}/g, getCheckedClass(formData.performedBy?.pernix));
    htmlContent = htmlContent.replace(/{{axterChecked}}/g, getCheckedClass(formData.performedBy?.axter));
    
    // Intervention type checkboxes
    htmlContent = htmlContent.replace(/{{repairChecked}}/g, getCheckedClass(formData.interventionType?.repair));
    htmlContent = htmlContent.replace(/{{installationChecked}}/g, getCheckedClass(formData.interventionType?.installation));
    htmlContent = htmlContent.replace(/{{courseChecked}}/g, getCheckedClass(formData.interventionType?.course));
    htmlContent = htmlContent.replace(/{{demoChecked}}/g, getCheckedClass(formData.interventionType?.demo));
    htmlContent = htmlContent.replace(/{{otherChecked}}/g, getCheckedClass(formData.interventionType?.other));
    
    // Options checkboxes
    htmlContent = htmlContent.replace(/{{contractChecked}}/g, getCheckedClass(formData.options?.contract));
    htmlContent = htmlContent.replace(/{{warrantyChecked}}/g, getCheckedClass(formData.options?.warranty));
    htmlContent = htmlContent.replace(/{{paymentChecked}}/g, getCheckedClass(formData.options?.payment));
    
    // Client data
    htmlContent = htmlContent.replace(/{{clientName}}/g, formData.client?.name || '');
    htmlContent = htmlContent.replace(/{{clientAddress}}/g, formData.client?.address || '');
    htmlContent = htmlContent.replace(/{{clientCity}}/g, formData.client?.city || '');
    htmlContent = htmlContent.replace(/{{clientPhone}}/g, formData.client?.phone || '');
    htmlContent = htmlContent.replace(/{{clientFax}}/g, formData.client?.fax || '');
    
    // Product data
    htmlContent = htmlContent.replace(/{{productBrand}}/g, formData.product?.brand || '');
    htmlContent = htmlContent.replace(/{{productModel}}/g, formData.product?.model || '');
    htmlContent = htmlContent.replace(/{{productSerial}}/g, formData.product?.serialNumber || '');
    
    // Issues
    htmlContent = htmlContent.replace(/{{problemReported}}/g, formData.issues?.reported || '');
    htmlContent = htmlContent.replace(/{{problemFound}}/g, formData.issues?.found || '');
    
    // Work description and copies
    htmlContent = htmlContent.replace(/{{workDescription}}/g, formData.workDescription || '');
    htmlContent = htmlContent.replace(/{{copiesPrinted}}/g, formData.copiesPrinted || '');
    
    // Hours and kilometers
    const hoursTravel = formData.hours?.travel || 0;
    const hoursWork = formData.hours?.work || 0;
    const hoursTotal = formData.hours?.total || (hoursTravel + hoursWork);
    
    htmlContent = htmlContent.replace(/{{hoursTravel}}/g, hoursTravel);
    htmlContent = htmlContent.replace(/{{hoursWork}}/g, hoursWork);
    htmlContent = htmlContent.replace(/{{hoursTotal}}/g, hoursTotal);
    htmlContent = htmlContent.replace(/{{kmTotal}}/g, formData.km?.total || '0');
    
    // Costs and totals
    htmlContent = htmlContent.replace(/{{materialsCost}}/g, materialsCost.toFixed(2));
    htmlContent = htmlContent.replace(/{{laborCost}}/g, laborCost.toFixed(2));
    htmlContent = htmlContent.replace(/{{calloutCost}}/g, calloutCost.toFixed(2));
    htmlContent = htmlContent.replace(/{{subtotal}}/g, subtotal.toFixed(2));
    htmlContent = htmlContent.replace(/{{totalWithVat}}/g, withVat.toFixed(2));
    
    // Parts table
    htmlContent = htmlContent.replace(/{{partsRows}}/g, partsRows);
    
    // Notes
    htmlContent = htmlContent.replace(/{{notes}}/g, formData.notes || '');
    
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
    
    console.log('📄 Generating Single-Page PDF...');
    
    // Generate PDF optimized for single A4 page
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm', 
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: true,
      scale: 1.0,
      displayHeaderFooter: false
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
    
    // Set headers before sending
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="rapporto_intervento_${formData.interventionNumber || 'report'}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send only the PDF buffer, nothing else
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('❌ PDF Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Send JSON error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'PDF generation failed',
        message: error.message,
        details: error.stack
      });
    }
  }
});

// Simple form save endpoint
app.post('/api/forms/save', (req, res) => {
  try {
    const formData = req.body;
    console.log('💾 Form saved:', formData.interventionNumber || 'Draft');
    
    // Here you could save to a database or file system
    // For now, just acknowledge the save
    
    res.json({ 
      message: 'Form saved successfully',
      interventionNumber: formData.interventionNumber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Save Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to save form',
      message: error.message
    });
  }
});

// Get form endpoint (for future use)
app.get('/api/forms/:interventionNumber', (req, res) => {
  try {
    const { interventionNumber } = req.params;
    console.log('📖 Form requested:', interventionNumber);
    
    // Here you would load from database or file system
    // For now, return empty form
    
    res.json({
      message: 'Form loading not implemented yet',
      interventionNumber: interventionNumber
    });
  } catch (error) {
    console.error('❌ Load Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to load form',
      message: error.message
    });
  }
});

// List forms endpoint (for future use)
app.get('/api/forms', (req, res) => {
  try {
    console.log('📋 Forms list requested');
    
    // Here you would load list from database or file system
    
    res.json({
      message: 'Forms listing not implemented yet',
      forms: []
    });
  } catch (error) {
    console.error('❌ List Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to list forms',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error.message);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
  console.log('📄 Ready for PDF generation');
  console.log('📊 Endpoints available:');
  console.log('  - POST /api/pdf/generate - Generate PDF');
  console.log('  - POST /api/forms/save - Save form');
  console.log('  - GET /api/forms/:id - Load form');
  console.log('  - GET /api/forms - List forms');
  console.log('  - GET /api/health - Health check');
  console.log('  - GET /assets/* - Static assets (pernix_logo.png, axter_logo.png, xholding_logo.png)');
});