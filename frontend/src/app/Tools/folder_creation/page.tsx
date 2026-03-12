'use client';
import { customFetch } from '@/utils/customFetch';

import { useState } from 'react';

export default function FolderCreationPage() {
  const [projectName, setProjectName] = useState('');
  const [structure, setStructure] = useState('');
  const [loading, setLoading] = useState(false);

  const generateFolders = async () => {
    if (!projectName || !structure) {
      alert('Project name and structure are required');
      return;
    }

    setLoading(true);

    try {
      const res = await customFetch('http://127.0.0.1:8000/folder_creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          structure: structure,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Folder generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Folder & File Generator</h2>
      <p style={styles.subtitle}>
        Create project folders and files automatically and download as ZIP
      </p>

      {/* PROJECT NAME */}
      <div style={styles.block}>
        <label style={styles.label}>Project / ZIP Name</label>
        <input
          style={styles.input}
          placeholder="e.g. my-awesome-project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* STRUCTURE */}
      <div style={styles.block}>
        <label style={styles.label}>Folder & File Structure</label>
        <p style={styles.hint}>
          Example:
          <br />
          <code>
            src/
            <br />├─ app/
            <br />│ ├─ page.tsx
            <br />│ └─ layout.tsx
            <br />├─ components/
            <br />│ └─ Header.tsx
            <br />└─ README.md
          </code>
        </p>

        <textarea
          style={styles.textarea}
          placeholder="Paste your folder & file structure here..."
          value={structure}
          onChange={(e) => setStructure(e.target.value)}
        />
      </div>

      <button
        style={{
          ...styles.primaryBtn,
          opacity: loading ? 0.6 : 1,
        }}
        onClick={generateFolders}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Folder Structure (ZIP)'}
      </button>

      <div style={styles.infoBox}>
        ✔ Folders and files will be created exactly as provided  
        <br />
        ✔ Output will be downloaded as a ZIP file
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '40px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },
  title: { fontSize: '28px', textAlign: 'center', marginBottom: '8px' },
  subtitle: { textAlign: 'center', color: '#475569', marginBottom: '30px' },
  block: { marginBottom: '25px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px' },
  hint: {
    fontSize: '13px',
    color: '#475569',
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
  },
  textarea: {
    width: '100%',
    height: '260px',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  primaryBtn: {
    width: '100%',
    padding: '16px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
  },
  infoBox: {
    marginTop: '20px',
    padding: '14px',
    background: '#ecfeff',
    borderRadius: '10px',
    fontSize: '14px',
    textAlign: 'center',
  },
};
