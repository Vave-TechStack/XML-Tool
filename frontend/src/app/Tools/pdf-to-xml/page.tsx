'use client';
import { customFetch } from '@/utils/customFetch';
import { useState, useRef } from 'react';

const API = 'http://127.0.0.1:8000';

export default function PdfToXml() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [download, setDownload] = useState('');
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return alert('Upload PDF');

    setLoading(true);
    setProgress(0);

    const fd = new FormData();
    fd.append('file', file);

    const res = await customFetch(`${API}/tools/pdf-to-xml`, {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();
    pollProgress(data.job_id);
    setDownload(API + data.download);
  };

  const pollProgress = (jobId: string) => {
    const i = setInterval(async () => {
      const r = await customFetch(`${API}/tools/progress/${jobId}`);
      const d = await r.json();
      setProgress(d.progress);
      if (d.progress === 100) {
        clearInterval(i);
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div style={styles.page}>
      <h2>PDF → XML (Auto Tag)</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={upload} disabled={loading}>
        {loading ? 'Processing...' : 'Convert'}
      </button>

      {loading && (
        <div style={styles.barWrap}>
          <div style={{ ...styles.bar, width: `${progress}%` }} />
          <p>{progress}%</p>
        </div>
      )}

      {progress === 100 && (
        <a href={download} download>
          Download XML
        </a>
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
    borderRadius: 12,
    textAlign: 'center',
  },
  barWrap: {
    marginTop: 20,
    background: '#eee',
    borderRadius: 6,
  },
  bar: {
    height: 10,
    background: '#22c55e',
    borderRadius: 6,
  },
};
