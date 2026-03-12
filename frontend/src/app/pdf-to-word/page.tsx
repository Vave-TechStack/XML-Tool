'use client';
import { customFetch } from '@/utils/customFetch';

import { useState, useRef, useEffect } from 'react';

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ================= CONVERT ================= */
  const uploadPdf = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    setLoading(true);
    // Revoke previous URL if it exists to prevent memory leaks
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await customFetch('http://127.0.0.1:8000/pdf-to-word', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Backend conversion failed');
      }

      // Read the response as a pure file stream
      const blob = await res.blob();
      
      // Create a local browser URL pointer to the stream
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

    } catch (error) {
      console.error(error);
      alert('Failed to convert PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  /* ================= RESET AFTER DOWNLOAD ================= */
  const resetUpload = () => {
    setFile(null);
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>PDF to Word Converter</h2>
      <p style={styles.subtitle}>
        Upload your PDF and convert it to an editable Word document
        while preserving layout and formatting.
      </p>

      {/* ================= UPLOAD BOX ================= */}
      <label style={styles.uploadBox}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {!file ? (
          <>
            <div style={styles.uploadIcon}>📄</div>
            <p style={styles.uploadText}>
              Click to upload or drag & drop your PDF here
            </p>
            <span style={styles.uploadHint}>
              Only PDF files are supported
            </span>
          </>
        ) : (
          <>
            <div style={styles.fileInfo}>
              <strong>{file.name}</strong>
              <span>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <span style={styles.changeFile}>Click to change file</span>
          </>
        )}
      </label>

      {/* ================= CONVERT BUTTON ================= */}
      <button
        style={{
          ...styles.convertBtn,
          opacity: loading ? 0.6 : 1,
        }}
        onClick={uploadPdf}
        disabled={loading}
      >
        {loading ? 'Converting PDF…' : 'Convert to Word'}
      </button>

      {/* ================= DOWNLOAD ================= */}
      {downloadUrl && (
        <div style={styles.downloadBox}>
          <p>✅ Conversion completed successfully</p>

          {/* Native browser download (SAFE) */}
          <a
            href={downloadUrl}
            download={file ? file.name.replace('.pdf', '.docx').replace('.PDF', '.docx') : 'converted.docx'}
            style={styles.downloadLink}
          >
            Download Word File
          </a>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES (UNCHANGED UI) ================= */

const styles: any = {
  page: {
    maxWidth: '720px',
    margin: '40px auto',
    padding: '40px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },

  title: {
    fontSize: '26px',
    marginBottom: '10px',
  },

  subtitle: {
    fontSize: '15px',
    color: '#475569',
    marginBottom: '30px',
  },

  uploadBox: {
    border: '2px dashed #38bdf8',
    borderRadius: '14px',
    padding: '35px 20px',
    cursor: 'pointer',
    background: '#f8fafc',
    marginBottom: '25px',
    display: 'block',
  },

  uploadIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },

  uploadText: {
    fontSize: '16px',
    fontWeight: 'bold',
  },

  uploadHint: {
    fontSize: '13px',
    color: '#64748b',
  },

  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '14px',
  },

  changeFile: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#2563eb',
    textDecoration: 'underline',
  },

  convertBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: '#38bdf8',
  },

  downloadBox: {
    marginTop: '30px',
    padding: '20px',
    background: '#ecfeff',
    borderRadius: '12px',
  },

  downloadLink: {
    display: 'inline-block',
    marginTop: '10px',
    padding: '10px 18px',
    background: '#0ea5e9',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};
