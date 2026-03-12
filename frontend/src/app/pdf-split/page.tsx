'use client';

import { useState, useRef } from 'react';
import { customFetch } from '@/utils/customFetch';

export default function PdfSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState('');
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // =============================
  // START SPLIT
  // =============================
  const splitPdf = async () => {
    if (!file || !ranges) {
      alert('Upload PDF and enter page ranges');
      return;
    }

    setLoading(true);
    setProgress(0);
    setDownloadUrl('');
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ranges', ranges);

      const res = await customFetch('http://127.0.0.1:8000/pdf-split', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Split failed');
      }

      const data = await res.json();
      const jid = data.job_id;

      setJobId(jid);
      listenProgress(jid);
      setDownloadUrl(`http://127.0.0.1:8000/download-split/${jid}`);
    } catch (e) {
      alert('PDF split failed');
      setLoading(false);
    }
  };

  // =============================
  // SSE PROGRESS LISTENER
  // =============================
  const listenProgress = (jid: string) => {
    const es = new EventSource(
      `http://127.0.0.1:8000/events/pdf-split-progress/${jid}`
    );

    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setProgress(data.progress);

      if (data.progress >= 100) {
        es.close();
        setLoading(false);
      }
    };

    es.onerror = () => {
      es.close();
      setLoading(false);
    };
  };

  // =============================
  // AFTER DOWNLOAD (RESET UI)
  // =============================
  const handleDownloadClick = async () => {
    // Small delay to allow browser download start
    setTimeout(() => {
      setFile(null);
      setRanges('');
      setProgress(0);
      setJobId(null);
      setDownloadUrl('');

      if (fileRef.current) {
        fileRef.current.value = '';
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }, 1000);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>PDF Split by Page Range</h2>

      <p style={styles.subtitle}>
        Enter page ranges like <b>1-10, 11-25, 30</b>.  
        Each range will be split and downloaded as a ZIP.
      </p>

      {/* Upload */}
      <label style={styles.uploadBox}>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {!file ? (
          <>
            <div style={styles.uploadIcon}>📄</div>
            <p style={styles.uploadText}>Click to upload PDF</p>
          </>
        ) : (
          <strong>{file.name}</strong>
        )}
      </label>

      {/* Ranges */}
      <input
        style={styles.input}
        placeholder="Page ranges (e.g. 1-10,11-25,30)"
        value={ranges}
        onChange={(e) => setRanges(e.target.value)}
      />

      {/* Button */}
      <button
        onClick={splitPdf}
        disabled={loading}
        style={{
          ...styles.convertBtn,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Splitting…' : 'Split PDF'}
      </button>

      {/* Progress Bar */}
      {loading && (
        <div style={styles.progressWrap}>
          <div style={styles.progressLabel}>{progress}%</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Download */}
      {downloadUrl && progress === 100 && (
        <div style={styles.downloadBox}>
          <a
            href={downloadUrl}
            onClick={handleDownloadClick}
            style={styles.downloadLink}
          >
            Download Split PDFs (ZIP)
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

  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    marginBottom: '22px',
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
  },

  progressWrap: {
    marginTop: '26px',
  },

  progressLabel: {
    marginBottom: '8px',
    fontWeight: '700',
    color: '#0284c7',
  },

  progressBar: {
    height: '12px',
    background: '#e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
    transition: 'width 0.3s ease',
  },

  downloadBox: {
    marginTop: '28px',
    padding: '20px',
    background: '#ecfeff',
    borderRadius: '14px',
    border: '1px solid #bae6fd',
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
