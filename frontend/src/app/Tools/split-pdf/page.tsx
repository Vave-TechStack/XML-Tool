import { customFetch } from '@/utils/customFetch';
"use client";

import { useState, useRef } from "react";

const API = "http://127.0.0.1:8000";

export default function PdfSplitByRangePage() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  /* ================= SPLIT ================= */

  const splitPdf = async () => {
    if (!file) return alert("Please upload PDF");
    if (!ranges.trim()) return alert("Enter page ranges");

    setProgress(0);
    setLogs([]);
    setDownloadUrl("");
    setLoading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("ranges", ranges);

    const res = await customFetch(`${API}/pdf/split-range`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      alert("Page Range Invalid");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setDownloadUrl(`${API}${data.download_url}`);

    const es = new EventSource(`${API}${data.progress_url}`);

    es.onmessage = (e) => {
      const p = Number(e.data);
      setProgress(p);

      if (p === 10) setLogs(l => [...l, "✔ PDF uploaded"]);
      if (p === 30) setLogs(l => [...l, "✔ Validating page ranges"]);
      if (p === 60) setLogs(l => [...l, "✔ Splitting PDF pages"]);
      if (p === 85) setLogs(l => [...l, "✔ Creating ZIP"]);
      if (p === 100) {
        setLogs(l => [...l, "✔ Ready for download"]);
        setLoading(false);
        es.close();
      }
    };
  };

  /* ================= DOWNLOAD ================= */

  const downloadZip = () => {
    const name = prompt("Enter base name (chapter / part)");
    if (!name) return;

    window.location.href = `${downloadUrl}?name=${encodeURIComponent(name)}`;
  };

  /* ================= RESET ================= */

  const reset = () => {
    setFile(null);
    setRanges("");
    setProgress(0);
    setLogs([]);
    setDownloadUrl("");
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ================= UI ================= */

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
          accept=".pdf"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <div style={styles.uploadIcon}>📄</div>
        <div style={styles.uploadText}>
          {file ? file.name : "Click to upload PDF"}
        </div>
      </label>

      {/* Ranges */}
      <input
        style={styles.rangeInput}
        placeholder="Page ranges (e.g. 1-10,11-25,30)"
        value={ranges}
        onChange={(e) => setRanges(e.target.value)}
      />

      {/* Button */}
      <button
        style={styles.splitBtn}
        onClick={splitPdf}
        disabled={loading}
      >
        {loading ? "Processing…" : "Split PDF"}
      </button>

      {/* Progress */}
      {progress > 0 && (
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          <p style={styles.progressText}>{progress}%</p>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div style={styles.logBox}>
          {logs.map((l, i) => (
            <div key={i}>• {l}</div>
          ))}
        </div>
      )}

      {/* Download */}
      {progress === 100 && downloadUrl && (
        <div style={styles.downloadBox}>
          <button style={styles.downloadBtn} onClick={downloadZip}>
            Download ZIP
          </button>
          <button style={styles.resetBtn} onClick={reset}>
            Split Another PDF
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    maxWidth: 900,
    margin: "40px auto",
    padding: 40,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: { fontSize: 28, marginBottom: 6 },
  subtitle: { color: "#475569", marginBottom: 30 },

  uploadBox: {
    border: "2px dashed #38bdf8",
    borderRadius: 14,
    padding: 50,
    cursor: "pointer",
    background: "#f0f9ff",
    marginBottom: 20,
    display: 'block',
  },
  uploadIcon: { fontSize: 40, marginBottom: 10 },
  uploadText: { fontWeight: "bold", color: "#0284c7" },

  rangeInput: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    marginBottom: 20,
  },

  splitBtn: {
    width: "100%",
    padding: 14,
    fontSize: 16,
    borderRadius: 10,
    border: "none",
    background: "#38bdf8",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },

  progressWrap: {
    background: "#e5e7eb",
    borderRadius: 10,
    marginTop: 25,
  },
  progressBar: {
    height: 10,
    background: "#38bdf8",
    borderRadius: 10,
  },
  progressText: {
    marginTop: 6,
    fontWeight: "bold",
  },

  logBox: {
    marginTop: 25,
    background: "#020617",
    color: "#e5e7eb",
    padding: 20,
    borderRadius: 12,
    textAlign: "left",
    fontFamily: "monospace",
    fontSize: 14,
  },

  downloadBox: { marginTop: 30 },
  downloadBtn: {
    padding: "12px 22px",
    background: "#0ea5e9",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    fontWeight: "bold",
    marginRight: 10,
    cursor: "pointer",
  },
  resetBtn: {
    padding: "12px 22px",
    background: "#f97316",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
