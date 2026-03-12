import { customFetch } from '@/utils/customFetch';
"use client";

import { useState } from "react";

/* ================= TYPES ================= */
type MainSection = "front" | "chapter" | "back" | "meta";
type SubOption =
  | "title"
  | "half-title"
  | "foreword"
  | "contents"
  | "chapter"
  | "references"
  | "bibliography"
  | "index"
  | "about-author"
  | "nav"
  | "toc"
  | "opf"
  | "";

/* ================= INLINE STYLES ================= */
const styles: any = {
  page: {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "32px",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 15px 40px rgba(2, 6, 23, 0.12)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: { marginBottom: "24px" },
  title: { fontSize: "26px", fontWeight: 700 },
  subtitle: { fontSize: "14px", color: "#6b7280" },

  mainButtons: { display: "flex", gap: "10px", marginBottom: "20px" },
  button: (active = false) => ({
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: active ? "#2563eb" : "#ffffff",
    color: active ? "#ffffff" : "#374151",
    cursor: "pointer",
    fontWeight: 500,
  }),

  subBox: {
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    marginBottom: "20px",
    background: "#f9fafb",
  },

  uploadBox: {
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#eff6ff",
    marginBottom: "24px",
  },

  split: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },

  panel: {
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },

  textarea: {
    width: "100%",
    height: "350px",
    fontFamily: "monospace",
    padding: "12px",
  },
};
/* ================================================= */

export default function PdfToXhtmlPage() {
  const [main, setMain] = useState<MainSection>("front");
  const [sub, setSub] = useState<SubOption>("");
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔑 NEW STATES (DOWNLOAD SUPPORT)
  const [fileId, setFileId] = useState("");
  const [fileName, setFileName] = useState("");

  const changeMain = (m: MainSection) => {
    setMain(m);
    setSub("");
    setFile(null);
    setOutput("");
    setFileId("");
    setFileName("");
  };

  /* 🔗 FE → BE BUILD */
  const applyRules = async () => {
    if (!file || !sub) return;

    setLoading(true);
    setOutput("Processing...");

    try {
      const formData = new FormData();
      formData.append("section", main);
      formData.append("type", sub);
      formData.append("file", file);

      const res = await customFetch("http://localhost:8000/build", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.content) {
        setOutput(data.content);
        setFileId(data.id);
        setFileName(data.filename);
      } else {
        setOutput("No output generated.");
      }
    } catch (err) {
      setOutput("Backend connection error.");
    } finally {
      setLoading(false);
    }
  };

  /* ⬇️ DOWNLOAD GENERATED FILE */
  const downloadFile = () => {
    if (!fileId || !fileName) return;

    const url = `http://localhost:8000/download/${fileId}/${fileName}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>PDF → XHTML (EPUB Workflow Tool)</div>
        <div style={styles.subtitle}>
          Select Section → Select Type → Upload → Apply Rules
        </div>
      </div>

      {/* MAIN BUTTONS */}
      <div style={styles.mainButtons}>
        <button style={styles.button(main === "front")} onClick={() => changeMain("front")}>Front Matter</button>
        <button style={styles.button(main === "chapter")} onClick={() => changeMain("chapter")}>Chapters</button>
        <button style={styles.button(main === "back")} onClick={() => changeMain("back")}>Back Matter</button>
        <button style={styles.button(main === "meta")} onClick={() => changeMain("meta")}>Meta</button>
      </div>

      {/* SUB OPTIONS */}
      <div style={styles.subBox}>
        {main === "front" && (
          <>
            <SubBtn label="Title Page" v="title" sub={sub} setSub={setSub} />
            <SubBtn label="Half Title" v="half-title" sub={sub} setSub={setSub} />
            <SubBtn label="Foreword" v="foreword" sub={sub} setSub={setSub} />
            <SubBtn label="Contents (TOC text)" v="contents" sub={sub} setSub={setSub} />
          </>
        )}

        {main === "chapter" && (
          <SubBtn label="Chapter Content" v="chapter" sub={sub} setSub={setSub} />
        )}

        {main === "back" && (
          <>
            <SubBtn label="References" v="references" sub={sub} setSub={setSub} />
            <SubBtn label="Bibliography" v="bibliography" sub={sub} setSub={setSub} />
            <SubBtn label="Index" v="index" sub={sub} setSub={setSub} />
            <SubBtn label="About Author" v="about-author" sub={sub} setSub={setSub} />
          </>
        )}

        {main === "meta" && (
          <>
            <SubBtn label="nav.xhtml" v="nav" sub={sub} setSub={setSub} />
            <SubBtn label="toc.ncx" v="toc" sub={sub} setSub={setSub} />
            <SubBtn label="OPF" v="opf" sub={sub} setSub={setSub} />
          </>
        )}
      </div>

      {/* UPLOAD */}
      {sub && (
        <div style={styles.uploadBox}>
          <strong>Selected:</strong> {main} → {sub}
          <br /><br />
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
          />
          {file && <div style={{ color: "green" }}>Uploaded: {file.name}</div>}
        </div>
      )}

      {/* PREVIEW + OUTPUT */}
      <div style={styles.split}>
        <div style={styles.panel}>PDF / DOCX Preview</div>
        <div style={styles.panel}>
          <textarea
            style={styles.textarea}
            value={output}
            readOnly
            placeholder="Generated XHTML / nav / toc / opf"
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {file && (
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            style={styles.button(true)}
            onClick={applyRules}
            disabled={loading}
          >
            {loading ? "Processing..." : "Apply Rules & Generate"}
          </button>

          {fileId && (
            <button
              style={{ ...styles.button(true), marginLeft: "10px" }}
              onClick={downloadFile}
            >
              Download {fileName}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* SUB BUTTON */
function SubBtn({
  label,
  v,
  sub,
  setSub,
}: {
  label: string;
  v: SubOption;
  sub: SubOption;
  setSub: (v: SubOption) => void;
}) {
  return (
    <button
      style={{ ...styles.button(sub === v), marginRight: "8px", marginBottom: "8px" }}
      onClick={() => setSub(v)}
    >
      {label}
    </button>
  );
}
