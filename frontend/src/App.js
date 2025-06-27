import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('basic');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    technician: 'Riccardo Gabetti',
    interventionNumber: '03817966/2025',
    serviceType: ['repair'],
    client: {
      name: 'Martini Alimentare',
      address: 'Via Luigi Pirandello',
      city: 'Gatteo',
      phone: '',
      fax: ''
    },
    product: {
      brand: 'OKI',
      model: 'MX8200',
      serialNumber: '6PT8A1533009'
    },
    issues: {
      reported: 'Fa Rumore',
      found: 'Guarnizioni isolanti usurate'
    },
    workDescription: 'Guarnizioni isolanti usurate, cambiati i pannelli anteriore e posteriore con stampante meno usata. Eseguita manutenzione completa.',
    copiesPrinted: '0',
    parts: [
      { code: '', description: 'Pannelli anteriore e posteriore', quantity: 2, price: 0 }
    ],
    hours: {
      travel: 4,
      work: 2,
      total: 6
    },
    costs: {
      materials: 0,
      labor: 0,
      callout: 0
    }
  });

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { code: '', description: '', quantity: 1, price: 0 }]
    }));
  };

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const calculateTotal = () => {
    const materialsCost = formData.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const subtotal = materialsCost + formData.costs.labor + formData.costs.callout;
    const withVat = subtotal * 1.22;
    return { subtotal, withVat, materialsCost };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:3001/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intervento_${formData.interventionNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('PDF generato e pronto per l\'invio al cliente!');
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Errore nella generazione del PDF');
    }
    setIsGenerating(false);
  };

  const saveForm = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/forms/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, status: 'draft' })
    });

    if (response.ok) {
      alert('Bozza salvata con successo');
    }
  } catch (error) {
    console.error('Error saving form:', error);
    alert('Errore nel salvataggio');
  }
 };

  const tabs = [
    { id: 'basic', name: 'Info Base', icon: '👤' },
    { id: 'work', name: 'Lavoro', icon: '🔧' },
    { id: 'parts', name: 'Ricambi', icon: '⚙️' },
    { id: 'signature', name: 'Firma', icon: '✍️' }
  ];

  const { subtotal, withVat, materialsCost } = calculateTotal();

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-info">
          <h1>Rapporto Intervento</h1>
          <p>#{formData.interventionNumber}</p>
        </div>
        <div className="header-buttons">
          <button className="camera-btn">📷</button>
          <button onClick={generatePDF} className="pdf-btn" disabled={isGenerating}>
            {isGenerating ? '⏳' : '📄'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`tab ${currentTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      <div className="content">
        {/* Basic Info Tab */}
        {currentTab === 'basic' && (
          <div className="tab-content">
            <div className="form-section">
              <div className="form-row">
                <label>
                  Data:
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData('date', e.target.value)}
                  />
                </label>
                <label>
                  Tecnico:
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => updateFormData('technician', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>🏢 Cliente</h3>
              <label>
                Nome:
                <input
                  type="text"
                  value={formData.client.name}
                  onChange={(e) => updateFormData('client.name', e.target.value)}
                />
              </label>
              <label>
                Indirizzo:
                <input
                  type="text"
                  value={formData.client.address}
                  onChange={(e) => updateFormData('client.address', e.target.value)}
                />
              </label>
              <div className="form-row">
                <label>
                  Città:
                  <input
                    type="text"
                    value={formData.client.city}
                    onChange={(e) => updateFormData('client.city', e.target.value)}
                  />
                </label>
                <label>
                  Telefono:
                  <input
                    type="tel"
                    value={formData.client.phone}
                    onChange={(e) => updateFormData('client.phone', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>🖨️ Prodotto</h3>
              <div className="form-row">
                <label>
                  Marca:
                  <input
                    type="text"
                    value={formData.product.brand}
                    onChange={(e) => updateFormData('product.brand', e.target.value)}
                  />
                </label>
                <label>
                  Modello:
                  <input
                    type="text"
                    value={formData.product.model}
                    onChange={(e) => updateFormData('product.model', e.target.value)}
                  />
                </label>
              </div>
              <label>
                Numero Seriale:
                <input
                  type="text"
                  value={formData.product.serialNumber}
                  onChange={(e) => updateFormData('product.serialNumber', e.target.value)}
                />
              </label>
            </div>
          </div>
        )}

        {/* Work Tab */}
        {currentTab === 'work' && (
          <div className="tab-content">
            <div className="form-section">
              <label>
                Difetto Segnalato:
                <textarea
                  value={formData.issues.reported}
                  onChange={(e) => updateFormData('issues.reported', e.target.value)}
                  rows={2}
                />
              </label>

              <label>
                Difetto Riscontrato:
                <textarea
                  value={formData.issues.found}
                  onChange={(e) => updateFormData('issues.found', e.target.value)}
                  rows={2}
                />
              </label>

              <label>
                Descrizione Intervento:
                <textarea
                  value={formData.workDescription}
                  onChange={(e) => updateFormData('workDescription', e.target.value)}
                  rows={4}
                />
              </label>

              <div className="form-row">
                <label>
                  Copie Stampate:
                  <input
                    type="number"
                    value={formData.copiesPrinted}
                    onChange={(e) => updateFormData('copiesPrinted', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>⏰ Ore Lavorate</h3>
              <div className="form-row">
                <label>
                  Viaggio:
                  <input
                    type="number"
                    value={formData.hours.travel}
                    onChange={(e) => updateFormData('hours.travel', parseInt(e.target.value) || 0)}
                  />
                </label>
                <label>
                  Lavoro:
                  <input
                    type="number"
                    value={formData.hours.work}
                    onChange={(e) => updateFormData('hours.work', parseInt(e.target.value) || 0)}
                  />
                </label>
                <label>
                  Totale:
                  <input
                    type="number"
                    value={formData.hours.total}
                    readOnly
                    className="readonly"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Parts Tab */}
        {currentTab === 'parts' && (
          <div className="tab-content">
            <div className="form-section">
              <div className="parts-header">
                <h3>Ricambi Utilizzati</h3>
                <button onClick={addPart} className="add-part-btn">
                  ➕ Aggiungi
                </button>
              </div>

              {formData.parts.map((part, index) => (
                <div key={index} className="part-item">
                  <div className="part-header">
                    <span>Ricambio #{index + 1}</span>
                    {formData.parts.length > 1 && (
                      <button onClick={() => removePart(index)} className="remove-btn">
                        🗑️
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Codice"
                    value={part.code}
                    onChange={(e) => updatePart(index, 'code', e.target.value)}
                  />
                  
                  <input
                    type="text"
                    placeholder="Descrizione"
                    value={part.description}
                    onChange={(e) => updatePart(index, 'description', e.target.value)}
                  />
                  
                  <div className="form-row">
                    <input
                      type="number"
                      placeholder="Quantità"
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                    <input
                      type="number"
                      placeholder="Prezzo €"
                      value={part.price}
                      onChange={(e) => updatePart(index, 'price', parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-section">
              <h3>💰 Costi</h3>
              <div className="cost-row">
                <span>Materiali:</span>
                <span>€{materialsCost.toFixed(2)}</span>
              </div>
              
              <div className="form-row">
                <label>
                  Manodopera:
                  <input
                    type="number"
                    value={formData.costs.labor}
                    onChange={(e) => updateFormData('costs.labor', parseFloat(e.target.value) || 0)}
                    step="0.01"
                  />
                </label>
                <label>
                  Chiamata:
                  <input
                    type="number"
                    value={formData.costs.callout}
                    onChange={(e) => updateFormData('costs.callout', parseFloat(e.target.value) || 0)}
                    step="0.01"
                  />
                </label>
              </div>

              <div className="total-section">
                <div className="total-row">
                  <span>Subtotale:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row final">
                  <span>Totale (IVA 22%):</span>
                  <span>€{withVat.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Tab */}
        {currentTab === 'signature' && (
          <div className="tab-content">
            <div className="form-section">
              <h3>✍️ Firma Cliente</h3>
              <div className="signature-area">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={150}
                  className="signature-canvas"
                />
                <button className="clear-signature">Cancella</button>
              </div>
            </div>

            <div className="form-section">
              <label>
                Note:
                <textarea
                  placeholder="Note aggiuntive..."
                  rows={3}
                />
              </label>
            </div>

            <div className="summary-section">
              <h4>Riepilogo Intervento</h4>
              <div className="summary-content">
                <p><strong>Cliente:</strong> {formData.client.name}</p>
                <p><strong>Prodotto:</strong> {formData.product.brand} {formData.product.model}</p>
                <p><strong>Ore Totali:</strong> {formData.hours.total}h</p>
                <p><strong>Totale:</strong> €{withVat.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions">
        <button onClick={saveForm} className="save-btn">
          💾 Salva Bozza
        </button>
        <button onClick={generatePDF} disabled={isGenerating} className="generate-btn">
          {isGenerating ? '⏳ Generando...' : '📄 Invia PDF'}
        </button>
      </div>
    </div>
  );
}

export default App;