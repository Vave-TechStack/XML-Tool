'use client';
import { customFetch } from '@/utils/customFetch';

import { useState, useRef } from 'react';

export default function OCRPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [download, setDownload] = useState('');

  const fileRef = useRef<HTMLInputElement | null>(null);

  const startOCR = async () => {
    if (!files.length) return alert('Upload TIFF files');

    setLoading(true);
    setDone(false);
    setDownload('');

    const fd = new FormData();
    files.forEach(f => fd.append('files', f));

    const res = await customFetch('http://127.0.0.1:8000/ocr/process', {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();
    setDownload(`http://127.0.0.1:8000${data.download_url}`);
    setLoading(false);
    setDone(true);
  };

  const reset = () => {
    setFiles([]);
    setDone(false);
    setDownload('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>TIFF OCR → Word</h2>

      <label style={styles.uploadBox}>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".tif,.tiff"
          hidden
          onChange={e => setFiles(Array.from(e.target.files || []))}
        />
        {files.length ? `${files.length} files selected` : 'Click to upload TIFF files'}
      </label>

      <button onClick={startOCR} disabled={loading} style={styles.btn}>
        {loading ? 'Processing…' : 'Start OCR'}
      </button>

      {loading && (
        <div style={styles.progressWrap}>
          <div style={styles.progressBar} />
          <p>Processing…</p>
        </div>
      )}

      {done && download && (
        <>
          <a href={download} style={styles.download} onClick={reset}>
            Download Word
          </a>
        </>
      )}
    </div>
  );
}

const styles: any = {
  page: {
    maxWidth: 600,
    margin: '40px auto',
    padding: 30,
    background: '#fff',
    borderRadius: 16,
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,.1)',
  },
  title: { fontSize: 24, marginBottom: 20 },
  uploadBox: {
    border: '2px dashed #38bdf8',
    borderRadius: 16,
    padding: 40,
    cursor: 'pointer',
    marginBottom: 20,
    background: '#f8fafc',
    display: 'block',
  },
  btn: {
    padding: '12px 20px',
    background: '#22c55e',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
  progressWrap: {
    marginTop: 20,
  },
  progressBar: {
    height: 10,
    background: '#38bdf8',
    borderRadius: 8,
    animation: 'pulse 1.2s infinite',
  },
  download: {
    display: 'inline-block',
    marginTop: 20,
    padding: '12px 18px',
    background: '#0ea5e9',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};
