'use client';
import { customFetch } from '@/utils/customFetch';

import { useState, useRef } from 'react';

export default function PdfToTiffPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  /* ================= CONVERT ================= */
  const convertPdf = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    setLoading(true);
    setProgress(0);
    setDownloadUrl('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await customFetch('http://127.0.0.1:8000/pdf-to-tiff', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Conversion failed');

      const data = await res.json();
      listenProgress(data.job_id);
      setDownloadUrl(`http://127.0.0.1:8000/download-tiff/${data.job_id}`);
    } catch (err) {
      console.error(err);
      alert('PDF to TIFF conversion failed');
      setLoading(false);
    }
  };

  /* ================= SSE PROGRESS ================= */
  const listenProgress = (jobId: string) => {
    const es = new EventSource(
      `http://127.0.0.1:8000/events/pdf-to-tiff-progress/${jobId}`
    );

    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const { progress } = JSON.parse(e.data);
      setProgress(progress);

      if (progress >= 100) {
        es.close();
        setLoading(false);
      }
    };

    es.onerror = () => {
      es.close();
      setLoading(false);
    };
  };

  /* ================= RESET AFTER DOWNLOAD ================= */
  const resetUI = () => {
    setTimeout(() => {
      setFile(null);
      setProgress(0);
      setDownloadUrl('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }, 1000);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>PDF to TIFF Converter</h2>
      <p style={styles.subtitle}>
        Convert PDF pages into high-resolution TIFF images (300 DPI).
        Ideal for OCR and publishing workflows.
      </p>

      {/* Upload */}
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
            <p style={styles.uploadText}>Click to upload PDF</p>
            <span style={styles.uploadHint}>Multi-page PDFs supported</span>
          </>
        ) : (
          <>
            <strong>{file.name}</strong>
            <span style={styles.fileSize}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <span style={styles.changeFile}>Click to change file</span>
          </>
        )}
      </label>

      {/* Button */}
      <button
        onClick={convertPdf}
        disabled={loading}
        style={{
          ...styles.convertBtn,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Converting…' : 'Convert to TIFF'}
      </button>

      {/* Progress */}
      {loading && (
        <div style={styles.progressWrap}>
          <div style={styles.progressLabel}>{progress}%</div>
          <div style={styles.progressOuter}>
            <div
              style={{
                ...styles.progressInner,
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Download */}
      {progress === 100 && downloadUrl && (
        <div style={styles.downloadBox}>
          <p style={styles.successText}>✅ Conversion completed</p>
          <a
            href={downloadUrl}
            onClick={resetUI}
            style={styles.downloadLink}
          >
            Download TIFF Images (ZIP)
          </a>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    maxWidth: '760px',
    margin: '50px auto',
    padding: '42px',
    background: '#ffffff',
    borderRadius: '18px',
    boxShadow: '0 15px 40px rgba(2, 6, 23, 0.12)',
    textAlign: 'center',
  },

  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#020617',
  },

  subtitle: {
    fontSize: '15px',
    color: '#475569',
    marginBottom: '32px',
    lineHeight: '1.6',
  },

  uploadBox: {
    border: '2px dashed #38bdf8',
    borderRadius: '16px',
    padding: '36px',
    cursor: 'pointer',
    marginBottom: '24px',
    background: '#f0f9ff',
    transition: 'all 0.25s ease',
    display: 'block',
  },

  uploadIcon: {
    fontSize: '46px',
    marginBottom: '10px',
  },

  uploadText: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#0369a1',
  },

  uploadHint: {
    fontSize: '13px',
    color: '#64748b',
  },

  fileSize: {
    display: 'block',
    marginTop: '6px',
    fontSize: '13px',
    color: '#475569',
  },

  changeFile: {
    display: 'block',
    marginTop: '8px',
    fontSize: '13px',
    color: '#0284c7',
    textDecoration: 'underline',
  },

  convertBtn: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    borderRadius: '12px',
    border: 'none',
    background: '#38bdf8',
    color: '#020617',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },

  progressWrap: {
    marginTop: '28px',
  },

  progressLabel: {
    marginBottom: '8px',
    fontWeight: '700',
    color: '#0284c7',
  },

  progressOuter: {
    height: '12px',
    background: '#e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },

  progressInner: {
    height: '100%',
    background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
    transition: 'width 0.3s ease',
  },

  downloadBox: {
    marginTop: '32px',
    padding: '22px',
    background: '#ecfeff',
    borderRadius: '16px',
    border: '1px solid #bae6fd',
  },

  successText: {
    marginBottom: '12px',
    fontWeight: '700',
    color: '#0369a1',
  },

  downloadLink: {
    display: 'inline-block',
    padding: '12px 22px',
    background: '#0ea5e9',
    color: '#ffffff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '15px',
  },
};
