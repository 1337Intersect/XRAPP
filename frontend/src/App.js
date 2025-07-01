import React, { useState, useRef } from 'react';

const App = () => {
  const canvasRef = useRef(null);
  const [currentTab, setCurrentTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD per input date
    technician: '',
    interventionNumber: '',
    
    // Checkboxes per tipo di lavoro
    interventionType: {
      repair: false,
      installation: false,
      course: false,
      demo: false,
      other: false
    },
    
    // Checkboxes per altre opzioni
    options: {
      contract: false,
      warranty: false,
      payment: false
    },
    
    // Chi ha effettuato l'intervento
    performedBy: {
      pernix: true,
      axter: false
    },
    
    // Dati cliente
    client: {
      name: '',
      address: '',
      city: '',
      phone: '',
      fax: ''
    },
    
    // Dati prodotto
    product: {
      brand: '',
      model: '',
      serialNumber: ''
    },
    
    // Problemi
    issues: {
      reported: '',
      found: ''
    },
    
    // Descrizione lavoro
    workDescription: '',
    copiesPrinted: '',
    
    // Ore e km
    hours: {
      travel: 0,
      work: 0
    },
    km: {
      total: 0
    },
    
    // Costi
    costs: {
      labor: 0,
      callout: 0
    },
    
    // Parti sostituite
    parts: [],
    
    // Note
    notes: ''
  });

  const updateFormData = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateCheckbox = (section, field) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { code: '', description: '', quantity: 1, price: 0 }]
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

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
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

  const tabs = [
    { id: 'basic', name: 'Info Base', icon: '📋' },
    { id: 'client', name: 'Cliente', icon: '👤' },
    { id: 'work', name: 'Lavoro', icon: '🔧' },
    { id: 'parts', name: 'Ricambi', icon: '⚙️' },
    { id: 'costs', name: 'Costi', icon: '💰' },
    { id: 'finish', name: 'Finalizza', icon: '✅' }
  ];

  const { subtotal, withVat, materialsCost } = calculateTotal();

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div>
          <h1 style={{ margin: '0', color: '#2563eb' }}>Rapporto Intervento</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>#{formData.interventionNumber || 'Nuovo'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={generatePDF} 
            disabled={isGenerating}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? '⏳ Generando...' : '📄 Genera PDF'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              padding: '10px 15px',
              border: 'none',
              backgroundColor: currentTab === tab.id ? '#2563eb' : 'transparent',
              color: currentTab === tab.id ? 'white' : '#374151',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              marginRight: '5px'
            }}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        
        {/* Basic Info Tab */}
        {currentTab === 'basic' && (
          <div>
            <h3>📋 Informazioni Base</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Data:
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Numero Intervento:
                <input
                  type="text"
                  value={formData.interventionNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, interventionNumber: e.target.value }))}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                Tecnico:
                <input
                  type="text"
                  value={formData.technician}
                  onChange={(e) => setFormData(prev => ({ ...prev, technician: e.target.value }))}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Effettuato da:</h4>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData.performedBy.pernix}
                    onChange={() => updateCheckbox('performedBy', 'pernix')}
                    style={{ marginRight: '8px' }}
                  />
                  PERNIX
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData.performedBy.axter}
                    onChange={() => updateCheckbox('performedBy', 'axter')}
                    style={{ marginRight: '8px' }}
                  />
                  AXTER
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Tipo di Intervento:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {Object.entries({
                  repair: 'RIPARAZIONE/MANUTENZIONE',
                  installation: 'INSTALLAZIONE',
                  course: 'CORSO',
                  demo: 'DEMO',
                  other: 'ALTRO'
                }).map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={formData.interventionType[key]}
                      onChange={() => updateCheckbox('interventionType', key)}
                      style={{ marginRight: '8px' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4>Altre Opzioni:</h4>
              <div style={{ display: 'flex', gap: '20px' }}>
                {Object.entries({
                  contract: 'CONTRATTO',
                  warranty: 'GARANZIA',
                  payment: 'PAGAMENTO'
                }).map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={formData.options[key]}
                      onChange={() => updateCheckbox('options', key)}
                      style={{ marginRight: '8px' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Client Tab */}
        {currentTab === 'client' && (
          <div>
            <h3>👤 Dati Cliente</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                Nome Cliente:
                <input
                  type="text"
                  value={formData.client.name}
                  onChange={(e) => updateFormData('client', 'name', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Indirizzo:
                <input
                  type="text"
                  value={formData.client.address}
                  onChange={(e) => updateFormData('client', 'address', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Città:
                <input
                  type="text"
                  value={formData.client.city}
                  onChange={(e) => updateFormData('client', 'city', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Telefono:
                <input
                  type="tel"
                  value={formData.client.phone}
                  onChange={(e) => updateFormData('client', 'phone', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Fax:
                <input
                  type="tel"
                  value={formData.client.fax}
                  onChange={(e) => updateFormData('client', 'fax', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
            </div>

            <h4 style={{ marginTop: '30px' }}>🔧 Dati Prodotto</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Marca:
                <input
                  type="text"
                  value={formData.product.brand}
                  onChange={(e) => updateFormData('product', 'brand', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Modello:
                <input
                  type="text"
                  value={formData.product.model}
                  onChange={(e) => updateFormData('product', 'model', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Numero Seriale:
                <input
                  type="text"
                  value={formData.product.serialNumber}
                  onChange={(e) => updateFormData('product', 'serialNumber', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Work Tab */}
        {currentTab === 'work' && (
          <div>
            <h3>🔧 Dettagli Lavoro</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Difetto Segnalato:
                <textarea
                  value={formData.issues.reported}
                  onChange={(e) => updateFormData('issues', 'reported', e.target.value)}
                  rows={3}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Difetto Riscontrato:
                <textarea
                  value={formData.issues.found}
                  onChange={(e) => updateFormData('issues', 'found', e.target.value)}
                  rows={3}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                />
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Descrizione Intervento Eseguito:
                <textarea
                  value={formData.workDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                  rows={5}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                />
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Ore Viaggio:
                <input
                  type="number"
                  value={formData.hours.travel}
                  onChange={(e) => updateFormData('hours', 'travel', parseFloat(e.target.value) || 0)}
                  step="0.5"
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Ore Intervento:
                <input
                  type="number"
                  value={formData.hours.work}
                  onChange={(e) => updateFormData('hours', 'work', parseFloat(e.target.value) || 0)}
                  step="0.5"
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Ore Totali:
                <input
                  type="number"
                  value={formData.hours.travel + formData.hours.work}
                  readOnly
                  step="0.5"
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                    color: '#666'
                  }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                KM Totali:
                <input
                  type="number"
                  value={formData.km.total}
                  onChange={(e) => updateFormData('km', 'total', parseFloat(e.target.value) || 0)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Copie Stampate:
                <input
                  type="text"
                  value={formData.copiesPrinted}
                  onChange={(e) => setFormData(prev => ({ ...prev, copiesPrinted: e.target.value }))}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Parts Tab */}
        {currentTab === 'parts' && (
          <div>
            <h3>⚙️ Parti Sostituite</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={addPart}
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: '#059669', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                + Aggiungi Parte
              </button>
            </div>

            {formData.parts.map((part, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr 80px 100px 50px', 
                gap: '10px', 
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f9fafb',
                borderRadius: '5px'
              }}>
                <input
                  type="text"
                  placeholder="Codice"
                  value={part.code}
                  onChange={(e) => updatePart(index, 'code', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                
                <input
                  type="text"
                  placeholder="Descrizione"
                  value={part.description}
                  onChange={(e) => updatePart(index, 'description', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                
                <input
                  type="number"
                  placeholder="Q.tà"
                  value={part.quantity}
                  onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                
                <input
                  type="number"
                  placeholder="Prezzo €"
                  value={part.price}
                  onChange={(e) => updatePart(index, 'price', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                
                <button
                  onClick={() => removePart(index)}
                  style={{ 
                    padding: '8px', 
                    backgroundColor: '#dc2626', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}

            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Costo Materiali:</span>
                <span>€{materialsCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {currentTab === 'costs' && (
          <div>
            <h3>💰 Costi e Totali</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Costo Manodopera (€):
                <input
                  type="number"
                  value={formData.costs.labor}
                  onChange={(e) => updateFormData('costs', 'labor', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Costo Chiamata (€):
                <input
                  type="number"
                  value={formData.costs.callout}
                  onChange={(e) => updateFormData('costs', 'callout', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </label>
            </div>

            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px',
              border: '2px solid #2563eb'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2563eb' }}>Riepilogo Costi</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Costo Materiali:</span>
                <span>€{materialsCost.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Costo Manodopera:</span>
                <span>€{formData.costs.labor.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Costo Chiamata:</span>
                <span>€{formData.costs.callout.toFixed(2)}</span>
              </div>
              
              <hr style={{ margin: '10px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
                <span>Subtotale:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                <span>Totale (IVA 22%):</span>
                <span>€{withVat.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Finish Tab */}
        {currentTab === 'finish' && (
          <div>
            <h3>✅ Finalizza Rapporto</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Note:
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="Note aggiuntive..."
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                />
              </label>
            </div>

            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '8px',
              border: '2px solid #059669',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#059669' }}>Riepilogo Intervento</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div><strong>Intervento N°:</strong> {formData.interventionNumber}</div>
                <div><strong>Data:</strong> {formData.date}</div>
                <div><strong>Tecnico:</strong> {formData.technician}</div>
                <div><strong>Cliente:</strong> {formData.client.name}</div>
                <div><strong>Prodotto:</strong> {formData.product.brand} {formData.product.model}</div>
                <div><strong>Ore Totali:</strong> {(formData.hours.travel + formData.hours.work).toFixed(1)}h</div>
                <div><strong>Parti Sostituite:</strong> {formData.parts.length}</div>
                <div><strong>Totale:</strong> €{withVat.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ 
              padding: '15px', 
              backgroundColor: '#fffbeb', 
              borderRadius: '8px',
              border: '1px solid #d97706'
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#d97706' }}>⚠️ Prima di generare il PDF</h5>
              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
                <li>Verifica che tutti i dati siano corretti</li>
                <li>Controlla i calcoli dei costi</li>
                <li>Assicurati che il numero di intervento sia univoco</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => {
            const currentIndex = tabs.findIndex(tab => tab.id === currentTab);
            if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1].id);
          }}
          disabled={currentTab === 'basic'}
          style={{
            padding: '10px 20px',
            backgroundColor: currentTab === 'basic' ? '#e5e7eb' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: currentTab === 'basic' ? 'not-allowed' : 'pointer'
          }}
        >
          ← Precedente
        </button>

        <button
          onClick={() => {
            const currentIndex = tabs.findIndex(tab => tab.id === currentTab);
            if (currentIndex < tabs.length - 1) setCurrentTab(tabs[currentIndex + 1].id);
          }}
          disabled={currentTab === 'finish'}
          style={{
            padding: '10px 20px',
            backgroundColor: currentTab === 'finish' ? '#e5e7eb' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: currentTab === 'finish' ? 'not-allowed' : 'pointer'
          }}
        >
          Successivo →
        </button>
      </div>
    </div>
  );
};

export default App;