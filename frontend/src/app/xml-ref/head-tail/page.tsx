'use client';

import { useState } from 'react';
import { customFetch } from '@/utils/customFetch';

export default function HeadTailPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [refCount, setRefCount] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setDownloadUrl('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await customFetch('http://127.0.0.1:8000/api/xml-ref/head-tail', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Conversion failed. Ensure the PDF contains a bibliography.');
      }

      const data = await response.json();
      
      // Get the correct download path
      const downloadRes = await customFetch(`http://127.0.0.1:8000/api/xml-ref/download?path=${encodeURIComponent(data.xml_file)}`);
      if (!downloadRes.ok) throw new Error('Failed to prepare download.');
      
      const blob = await downloadRes.blob();
      const url = window.URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setRefCount(data.ref_count);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>XML Ref: Head & Tail</h2>
        <p style={styles.description}>
          Upload a PDF to extract references into Elsevier-style structured XML.
          Punctuation and italics are analyzed to identify Authors, Titles, Sources, and more.
        </p>

        <div style={styles.uploadBox}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={styles.input}
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" style={styles.label}>
            {file ? file.name : 'Click to select a PDF file'}
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              ...styles.button,
              opacity: !file || loading ? 0.6 : 1,
              cursor: !file || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing Style & Tags...' : 'Extract XML Ref'}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {downloadUrl && (
          <div style={styles.successBox}>
            <p style={styles.successText}>
              ✅ Successfully extracted <strong>{refCount}</strong> references!
            </p>
            <a
              href={downloadUrl}
              download="references_head_tail.xml"
              style={styles.downloadLink}
            >
              Download Structured XML
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    padding: '60px 20px',
    display: 'flex',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    minHeight: '80vh',
  },
  card: {
    maxWidth: '700px',
    width: '100%',
    background: '#ffffff',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '16px',
    letterSpacing: '-0.02em',
  },
  description: {
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  uploadBox: {
    border: '2px dashed #cbd5e1',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '24px',
    transition: 'all 0.3s ease',
  },
  input: {
    display: 'none',
  },
  label: {
    display: 'block',
    padding: '20px',
    marginBottom: '20px',
    background: '#f1f5f9',
    borderRadius: '12px',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(to right, #0ea5e9, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
    transition: 'transform 0.2s ease',
  },
  error: {
    color: '#ef4444',
    background: '#fee2e2',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: '600',
  },
  successBox: {
    marginTop: '30px',
    padding: '24px',
    background: '#f0fdf4',
    borderRadius: '16px',
    border: '1px solid #bbf7d0',
  },
  successText: {
    color: '#166534',
    marginBottom: '16px',
  },
  downloadLink: {
    display: 'inline-block',
    padding: '12px 30px',
    background: '#059669',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
  },
};
