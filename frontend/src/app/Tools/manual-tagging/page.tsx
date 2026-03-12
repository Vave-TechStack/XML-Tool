'use client';
import { customFetch } from '@/utils/customFetch';

import { useRef, useState } from 'react';

export default function ManualLnXmlUploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert('Please upload XML file');
      return;
    }

    setLoading(true);
    setDownloadUrl('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await customFetch('http://127.0.0.1:8000/ln-xml/manual-upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      setDownloadUrl(`http://127.0.0.1:8000${data.download_url}`);

      // ✅ reset upload after success
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      alert('LN XML generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>LN XML Manual Upload</h2>
      <p style={styles.subtitle}>
        Upload XML → Backend injects into LN template → Download final LN XML
      </p>

      {/* UPLOAD BOX */}
      <label style={styles.uploadBox}>
        <input ref={fileRef} type="file" accept=".xml" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />

        <div style={styles.icon}>📄</div>

        <div style={styles.uploadText}>
          {file ? file.name : 'Click to upload XML file'}
        </div>

        <div style={styles.supportText}>Only .xml files supported</div>
      </label>

      {/* ACTION BUTTON */}
      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          ...styles.primaryBtn,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Generating…' : 'Generate LN XML'}
      </button>

      {/* DOWNLOAD */}
      {downloadUrl && (
        <div style={styles.downloadBox}>
          <a href={downloadUrl} style={styles.downloadLink}>
            Download LN XML
          </a>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '40px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },

  title: {
    fontSize: '28px',
    marginBottom: '8px',
  },

  subtitle: {
    color: '#475569',
    marginBottom: '30px',
    fontSize: '15px',
  },

  uploadBox: {
    border: '2px dashed #38bdf8',
    borderRadius: '16px',
    padding: '40px',
    cursor: 'pointer',
    marginBottom: '25px',
    background: '#f8fcff',
    display: 'block',
  },

  icon: {
    fontSize: '44px',
    marginBottom: '10px',
  },

  uploadText: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '4px',
  },

  supportText: {
    fontSize: '13px',
    color: '#64748b',
  },

  primaryBtn: {
    width: '100%',
    padding: '16px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  downloadBox: {
    marginTop: '25px',
    padding: '16px',
    background: '#ecfeff',
    borderRadius: '12px',
  },

  downloadLink: {
    textDecoration: 'none',
    background: '#0ea5e9',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
};
