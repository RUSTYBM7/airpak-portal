import React, { useState, useCallback } from 'react';
import {
  FileText, Plane, Receipt, Tag, Plus, Trash2,
  Download, Printer, Share2, X, Check, Loader2
} from 'lucide-react';

type DocumentType = 'invoice' | 'waybill' | 'receipt' | 'label';

interface DocumentItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
}

interface SenderInfo {
  name: string;
  phone: string;
  address: string;
  email: string;
}

interface RecipientInfo {
  name: string;
  phone: string;
  address: string;
  email: string;
}

const typeConfig: Record<DocumentType, {
  title: string;
  icon: React.ReactNode;
  fromLegend: string;
  toLegend: string;
  showShipment: boolean;
}> = {
  invoice: {
    title: 'Invoice',
    icon: <FileText size={18} />,
    fromLegend: 'Bill From / Sender',
    toLegend: 'Bill To / Recipient',
    showShipment: false,
  },
  waybill: {
    title: 'Air Waybill',
    icon: <Plane size={18} />,
    fromLegend: 'Shipper',
    toLegend: 'Consignee',
    showShipment: true,
  },
  receipt: {
    title: 'Payment Receipt',
    icon: <Receipt size={18} />,
    fromLegend: 'Received From',
    toLegend: 'Customer (optional)',
    showShipment: false,
  },
  label: {
    title: 'Shipping Label',
    icon: <Tag size={18} />,
    fromLegend: 'From',
    toLegend: 'To',
    showShipment: true,
  },
};

const services = [
  'Standard Express',
  'Same-Day Delivery',
  'Next-Day Delivery',
  'International Express',
  'Document Express',
  'Freight / Pallet',
];

const paymentMethods = [
  'Cash',
  'Bank Transfer',
  'FPX / Online Banking',
  'Credit/Debit Card',
  'COD (Cash on Delivery)',
];

export default function DocumentGenerator() {
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [sender, setSender] = useState<SenderInfo>({ name: '', phone: '', address: '', email: '' });
  const [recipient, setRecipient] = useState<RecipientInfo>({ name: '', phone: '', address: '', email: '' });
  const [service, setService] = useState(services[0]);
  const [weight, setWeight] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [items, setItems] = useState<DocumentItem[]>([
    { id: '1', description: 'Express courier service', qty: 1, unit: 'shipment', price: 15.00 },
  ]);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const generateDocumentNumber = useCallback(() => {
    const prefix = documentType.toUpperCase().slice(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }, [documentType]);

  const addItem = useCallback(() => {
    const newItem: DocumentItem = {
      id: Date.now().toString(),
      description: '',
      qty: 1,
      unit: 'pc',
      price: 0,
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, field: keyof DocumentItem, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const resetForm = useCallback(() => {
    setDocumentNumber('');
    setDocumentDate(new Date().toISOString().split('T')[0]);
    setSender({ name: '', phone: '', address: '', email: '' });
    setRecipient({ name: '', phone: '', address: '', email: '' });
    setService(services[0]);
    setWeight('');
    setTrackingNumber('');
    setPaymentMethod(paymentMethods[0]);
    setItems([{ id: '1', description: 'Express courier service', qty: 1, unit: 'shipment', price: 15.00 }]);
    setNotes('');
    setStatus({ message: '', type: null });
  }, []);

  const handleGenerate = useCallback(async () => {
    const validItems = items.filter(item => item.description.trim() !== '');
    if (documentType !== 'label' && documentType !== 'waybill' && validItems.length === 0) {
      setStatus({ message: 'Please add at least one item before generating.', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setStatus({ message: 'Generating PDF...', type: 'success' });

    const docNumber = documentNumber || generateDocumentNumber();
    const data = {
      type: documentType,
      number: docNumber,
      date: new Date(documentDate).toLocaleDateString('en-MY'),
      sender,
      recipient,
      service,
      weight,
      trackingNumber,
      paymentMethod,
      items: validItems,
      notes,
    };

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `airpak-${documentType}-${docNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 500);
      setStatus({ message: 'Downloaded successfully.', type: 'success' });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to generate document.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [documentType, documentNumber, documentDate, sender, recipient, service, weight, trackingNumber, paymentMethod, items, notes, generateDocumentNumber]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    const docNumber = documentNumber || generateDocumentNumber();
    const shareData = {
      title: `Airpak ${typeConfig[documentType].title}`,
      text: `Document ${docNumber} from Airpak Express`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setStatus({ message: 'Failed to share.', type: 'error' });
        }
      }
    } else {
      const shareUrl = `${window.location.origin}/share/${documentType}/${docNumber}`;
      await navigator.clipboard.writeText(shareUrl);
      setStatus({ message: 'Link copied to clipboard!', type: 'success' });
    }
  }, [documentType, documentNumber, generateDocumentNumber]);

  const config = typeConfig[documentType];
  const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

  return (
    <div className="dg-container">
      <style>{`
        .dg-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        .dg-types {
          background: var(--surface-primary);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid var(--border-primary);
          height: fit-content;
          position: sticky;
          top: 24px;
        }

        .dg-types h3 {
          margin: 0 0 12px;
          font: 700 14px 'Sarabun', sans-serif;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dg-type-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
          padding: 11px 12px;
          border: 1px solid var(--border-primary);
          background: var(--surface-primary);
          border-radius: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          font: 600 14px 'Inter', sans-serif;
          color: var(--text-secondary);
          transition: all 0.15s;
        }

        .dg-type-btn i, .dg-type-btn svg {
          color: var(--accent-primary);
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .dg-type-btn:hover {
          border-color: var(--accent-primary);
          background: rgba(205, 39, 39, 0.05);
        }

        .dg-type-btn.active {
          background: var(--accent-primary);
          color: #fff;
          border-color: var(--accent-primary);
        }

        .dg-type-btn.active i, .dg-type-btn.active svg {
          color: #fff;
        }

        .dg-form {
          background: var(--surface-primary);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid var(--border-primary);
        }

        .dg-form h2 {
          margin: 0 0 4px;
          font: 800 22px 'Sarabun', sans-serif;
          color: var(--text-primary);
        }

        .dg-form .hint {
          margin: 0 0 18px;
          color: var(--text-tertiary);
          font-size: 13px;
        }

        .dg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .dg-grid.full {
          grid-template-columns: 1fr;
        }

        .dg-label {
          display: block;
          font: 600 12px 'Inter', sans-serif;
          color: var(--text-secondary);
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .dg-input, .dg-textarea, .dg-select {
          width: 100%;
          padding: 9px 11px;
          border: 1px solid var(--border-secondary);
          border-radius: 8px;
          font: 14px 'Inter', sans-serif;
          color: var(--text-primary);
          background: var(--surface-primary);
          transition: all 0.2s;
        }

        .dg-input:focus, .dg-textarea:focus, .dg-select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(205, 39, 39, 0.12);
        }

        .dg-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .dg-fieldset {
          border: 1px solid var(--border-primary);
          border-radius: 10px;
          padding: 14px 16px 16px;
          margin: 18px 0 0;
        }

        .dg-legend {
          font: 700 12px 'Inter', sans-serif;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0 6px;
        }

        .dg-items table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
        }

        .dg-items th {
          font: 600 11px 'Inter', sans-serif;
          color: var(--text-tertiary);
          text-transform: uppercase;
          text-align: left;
          padding: 6px 4px;
          border-bottom: 1px solid var(--border-primary);
        }

        .dg-items td {
          padding: 5px 4px;
        }

        .dg-items input {
          padding: 7px 9px;
          font-size: 13px;
          width: 100%;
        }

        .dg-items .col-desc { width: 46%; }
        .dg-items .col-num { width: 12%; }
        .dg-items .col-unit { width: 14%; }
        .dg-items .col-act { width: 6%; text-align: center; }

        .dg-items .rm {
          background: transparent;
          border: 0;
          color: var(--accent-primary);
          cursor: pointer;
          font-size: 15px;
          padding: 4px;
        }

        .dg-items .add {
          margin-top: 8px;
          background: transparent;
          border: 1px dashed var(--accent-primary);
          color: var(--accent-primary);
          border-radius: 8px;
          padding: 7px 12px;
          cursor: pointer;
          font: 600 13px 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dg-items .add:hover {
          background: rgba(205, 39, 39, 0.05);
        }

        .dg-actions {
          margin-top: 22px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dg-btn {
          font: 700 14px 'Inter', sans-serif;
          padding: 11px 20px;
          border: 0;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .dg-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dg-btn-primary {
          background: var(--accent-primary);
          color: #fff;
          box-shadow: 0 4px 10px rgba(205, 39, 39, 0.25);
        }

        .dg-btn-primary:hover:not(:disabled) {
          background: #9b1a1a;
        }

        .dg-btn-ghost {
          background: var(--surface-primary);
          color: var(--text-secondary);
          border: 1px solid var(--border-secondary);
        }

        .dg-btn-ghost:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .dg-btn-icon {
          background: var(--surface-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-secondary);
          padding: 11px 16px;
        }

        .dg-btn-icon:hover:not(:disabled) {
          background: var(--surface-tertiary);
          color: var(--text-primary);
        }

        .dg-status {
          margin-top: 14px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          display: none;
        }

        .dg-status.show {
          display: block;
        }

        .dg-status.success {
          background: #e7f7ec;
          color: #1d6b32;
          border: 1px solid #b7e6c4;
        }

        .dg-status.error {
          background: #fdecec;
          color: #9b1a1a;
          border: 1px solid #f3caca;
        }

        .dg-total {
          margin-top: 16px;
          padding: 16px;
          background: var(--surface-secondary);
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dg-total-label {
          font: 600 14px 'Inter', sans-serif;
          color: var(--text-secondary);
        }

        .dg-total-value {
          font: 800 24px 'Sarabun', sans-serif;
          color: var(--accent-primary);
        }

        @media (max-width: 820px) {
          .dg-container {
            grid-template-columns: 1fr;
          }
          .dg-types {
            position: static;
          }
          .dg-grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          .dg-types, .dg-actions, .dg-status {
            display: none !important;
          }
          .dg-container {
            display: block;
          }
        }
      `}</style>

      <aside className="dg-types">
        <h3>Document Type</h3>
        {(Object.keys(typeConfig) as DocumentType[]).map(type => (
          <button
            key={type}
            className={`dg-type-btn ${documentType === type ? 'active' : ''}`}
            onClick={() => setDocumentType(type)}
          >
            {typeConfig[type].icon}
            {typeConfig[type].title}
          </button>
        ))}
      </aside>

      <main className="dg-form">
        <h2>{config.title}</h2>
        <p className="hint">Fill in the details below and generate a branded PDF with the Airpak logo, ready to print, sign or email.</p>

        <div className="dg-grid">
          <div>
            <label className="dg-label">Document Number</label>
            <input
              type="text"
              className="dg-input"
              id="f-number"
              placeholder={generateDocumentNumber()}
              value={documentNumber}
              onChange={e => setDocumentNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="dg-label">Date</label>
            <input
              type="date"
              className="dg-input"
              value={documentDate}
              onChange={e => setDocumentDate(e.target.value)}
            />
          </div>
        </div>

        <fieldset className="dg-fieldset">
          <legend className="dg-legend">{config.fromLegend}</legend>
          <div className="dg-grid">
            <div>
              <label className="dg-label">Name</label>
              <input
                type="text"
                className="dg-input"
                placeholder="ABC Trading Sdn Bhd"
                value={sender.name}
                onChange={e => setSender(s => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="dg-label">Phone</label>
              <input
                type="text"
                className="dg-input"
                placeholder="+60 12-345 6789"
                value={sender.phone}
                onChange={e => setSender(s => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div className="dg-grid full">
              <div>
                <label className="dg-label">Address</label>
                <textarea
                  className="dg-textarea"
                  placeholder="Street, City, Postcode, State"
                  value={sender.address}
                  onChange={e => setSender(s => ({ ...s, address: e.target.value }))}
                />
              </div>
            </div>
            <div className="dg-grid full">
              <div>
                <label className="dg-label">Email</label>
                <input
                  type="email"
                  className="dg-input"
                  placeholder="hello@example.com"
                  value={sender.email}
                  onChange={e => setSender(s => ({ ...s, email: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="dg-fieldset" style={{ display: documentType === 'receipt' ? 'none' : '' }}>
          <legend className="dg-legend">{config.toLegend}</legend>
          <div className="dg-grid">
            <div>
              <label className="dg-label">Name</label>
              <input
                type="text"
                className="dg-input"
                placeholder="XYZ Logistics"
                value={recipient.name}
                onChange={e => setRecipient(r => ({ ...r, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="dg-label">Phone</label>
              <input
                type="text"
                className="dg-input"
                placeholder="+60 12-987 6543"
                value={recipient.phone}
                onChange={e => setRecipient(r => ({ ...r, phone: e.target.value }))}
              />
            </div>
            <div className="dg-grid full">
              <div>
                <label className="dg-label">Address</label>
                <textarea
                  className="dg-textarea"
                  value={recipient.address}
                  onChange={e => setRecipient(r => ({ ...r, address: e.target.value }))}
                />
              </div>
            </div>
            <div className="dg-grid full">
              <div>
                <label className="dg-label">Email</label>
                <input
                  type="email"
                  className="dg-input"
                  value={recipient.email}
                  onChange={e => setRecipient(r => ({ ...r, email: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {config.showShipment && (
          <fieldset className="dg-fieldset">
            <legend className="dg-legend">Shipment Details</legend>
            <div className="dg-grid">
              <div>
                <label className="dg-label">Service</label>
                <select
                  className="dg-select"
                  value={service}
                  onChange={e => setService(e.target.value)}
                >
                  {services.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="dg-label">Weight (kg)</label>
                <input
                  type="text"
                  className="dg-input"
                  placeholder="2.5"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="dg-label">Tracking #</label>
                <input
                  type="text"
                  className="dg-input"
                  placeholder="AP1234567890"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="dg-label">Payment Method</label>
                <select
                  className="dg-select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        )}

        {documentType !== 'label' && documentType !== 'waybill' && (
          <fieldset className="dg-fieldset dg-items">
            <legend className="dg-legend">Items / Contents</legend>
            <table>
              <thead>
                <tr>
                  <th className="col-desc">Description</th>
                  <th className="col-num">Qty</th>
                  <th className="col-unit">Unit</th>
                  <th className="col-num">Price (RM)</th>
                  <th className="col-act"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        className="i-desc"
                        placeholder="Item description"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="i-qty"
                        min="0"
                        step="1"
                        value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="i-unit"
                        value={item.unit}
                        onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="i-price"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="rm"
                        onClick={() => removeItem(item.id)}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="add" onClick={addItem}>
              <Plus size={14} /> Add item
            </button>
          </fieldset>
        )}

        {total > 0 && (
          <div className="dg-total">
            <span className="dg-total-label">Total Amount</span>
            <span className="dg-total-value">RM {total.toFixed(2)}</span>
          </div>
        )}

        <fieldset className="dg-fieldset">
          <legend className="dg-legend">Notes</legend>
          <textarea
            className="dg-textarea"
            placeholder="Special handling instructions, terms, etc."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </fieldset>

        <div className="dg-actions">
          <button
            className="dg-btn dg-btn-primary"
            id="genBtn"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isGenerating ? 'Generating...' : 'Generate & Download PDF'}
          </button>
          <button
            className="dg-btn dg-btn-ghost"
            id="resetBtn"
            onClick={resetForm}
          >
            <X size={18} /> Clear form
          </button>
          <button
            className="dg-btn dg-btn-icon"
            onClick={handlePrint}
            title="Print"
          >
            <Printer size={18} />
          </button>
          <button
            className="dg-btn dg-btn-icon"
            onClick={handleShare}
            title="Share"
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className={`dg-status ${status.type ? 'show' : ''} ${status.type || ''}`}>
          {status.type === 'success' && <Check size={14} style={{ marginRight: 6, display: 'inline' }} />}
          {status.message}
        </div>
      </main>
    </div>
  );
}