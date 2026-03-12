'use client';
import { customFetch } from '@/utils/customFetch';
import { useState, useRef, useEffect } from 'react';

/* ================= CONFIG ================= */

const API_BASE = 'http://127.0.0.1:8000';

/* ================= TYPES ================= */

type TagDef = {
  label: string;
  open: string;
  close: string;
};

/* ================= TAGS ================= */

const TAGS: TagDef[] = [

  /* ================= ROOT ================= */
  {
    label: 'CourtCase',
    open: '<COURTCASE>',
    close: '</COURTCASE>',
  },

  /* ================= DOC META ================= */
  {
    label: 'DocInfo',
    open: `<lndocmeta:docinfo>
<lndocmeta:lnlni lnlni=""/>
<lndocmeta:lnminrev lnminrev="00000"/>
<lndocmeta:smi lnsmi="b30a"/>
<lndocmeta:dpsi lndpsi="0UIX"/>
<lndocmeta:lnsourcedocid lnsourcedocid=""/>
<lndocmeta:lndoctype lndoctypename="COURTCASE"/>
<lndocmeta:lndoctypeversion lndoctypeversionmajor="06" lndoctypeversionminor="000"/>
<lndocmeta:lndoctypelang lndoctypelang="EN"/>
<lndocmeta:lnfilenum lnfilenum="015"/>
<lndocmeta:fabinfo>
<lndocmeta:fabinfoitem name="B4DBNO" value="1MXR"/>
</lndocmeta:fabinfo>`,
    close: '</lndocmeta:docinfo>',
  },

  /* ================= ALT RENDITION ================= */
  {
    label: 'AltRendition',
    open: `<docinfo>
<docinfo:alt-renditions>
<docinfo:alt-rendition>
<lnlink service="ATTACHMENT">
<lnvxe:api-params>
<lnvxe:param name="attachment-smi" value="50592"/>
<lnvxe:param name="attachment-type" value="PDF"/>
<lnvxe:param name="attachment-key" value="XXXX.PDF"/>
<lnvxe:param name="componentseq" value="1"/>`,
    close: `</lnvxe:api-params>
</lnlink>
</docinfo:alt-rendition>
</docinfo:alt-renditions>
</docinfo>`,
  },

  /* ================= CASE HEADER ================= */
  {
    label: 'FullName',
    open: '<lnv:FULL-NAME><lnvxe:fullcasename>',
    close: '</lnvxe:fullcasename></lnv:FULL-NAME>',
  },
  {
    label: 'ShortName',
    open: '<lnv:SHORT-NAME><lnvxe:shortcasename>',
    close: '</lnvxe:shortcasename></lnv:SHORT-NAME>',
  },
  {
    label: 'DocketNo',
    open: '<lnv:NUMBER><lnvxe:docketnumber>',
    close: '</lnvxe:docketnumber></lnv:NUMBER>',
  },
  {
    label: 'Court',
    open: '<lnv:COURT>',
    close: '</lnv:COURT>',
  },
  {
    label: 'Citation',
    open: '<lnv:CITE><cite4thisdoc>',
    close: '</cite4thisdoc></lnv:CITE>',
  },

  /* ================= DATES ================= */
  {
    label: 'DecidedDate',
    open: '<lnv:DECIDEDDATE><lnvxe:date>',
    close: '</lnvxe:date></lnv:DECIDEDDATE>',
  },
  {
    label: 'FiledDate',
    open: '<lnv:FILEDDATE><lnvxe:date>',
    close: '</lnvxe:date></lnv:FILEDDATE>',
  },
  {
    label: 'ArguedDate',
    open: '<lnv:ARGUEDDATE><lnvxe:date>',
    close: '</lnvxe:date></lnv:ARGUEDDATE>',
  },

  /* ================= STATUS ================= */
  {
    label: 'DocStatus',
    open: '<lnv:DOC-STATUS><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnv:DOC-STATUS>',
  },
  {
    label: 'PubStatus',
    open: '<lnv:PUB-STATUS><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnv:PUB-STATUS>',
  },

  /* ================= HISTORY ================= */
  {
    label: 'SubseqHistory',
    open: '<lnv:SUBSEQ-HISTORY><lnvxe:subseqhistory><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:subseqhistory></lnv:SUBSEQ-HISTORY>',
  },
  {
    label: 'PriorHistory',
    open: '<lnv:PRIOR-HISTORY><lnvxe:priorhistory><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:priorhistory></lnv:PRIOR-HISTORY>',
  },

  /* ================= CONTENT ================= */
  {
    label: 'Disposition',
    open: '<lnv:DISPOSITION-1><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnv:DISPOSITION-1>',
  },
  {
    label: 'Headnotes',
    open: '<lnv:HEADNOTES-1><lnvxe:headnote-simple><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:headnote-simple></lnv:HEADNOTES-1>',
  },
  {
    label: 'Syllabus',
    open: '<lnv:SYLLABUS-1><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnv:SYLLABUS-1>',
  },

  /* ================= PEOPLE ================= */
  {
    label: 'Counsel',
    open: '<lnv:COUNSEL><lnvxe:counsel>',
    close: '</lnvxe:counsel></lnv:COUNSEL>',
  },
  {
    label: 'Judges',
    open: '<lnv:JUDGES><lnvxe:judges>',
    close: '</lnvxe:judges></lnv:JUDGES>',
  },

  /* ================= OPINIONS ================= */
  {
    label: 'Concur',
    open: '<lnv:CONCURS><lnvxe:concur><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:concur></lnv:CONCURS>',
  },
  {
    label: 'Dissent',
    open: '<lnv:DISSENTS><lnvxe:dissent><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:dissent></lnv:DISSENTS>',
  },
  {
    label: 'Opinion',
    open: '<lnv:OPINION>',
    close: '</lnv:OPINION>',
  },

  /* ================= BODY ================= */
  {
    label: 'HeadingBold',
    open: '<lnvxe:h><emph typestyle="bf">',
    close: '</emph></lnvxe:h>',
  },
  {
    label: 'Paragraph',
    open: '<p i="3"><lnvxe:text>',
    close: '</lnvxe:text></p>',
  },

  /* ================= FOOTNOTE ================= */
  {
    label: 'Footnote',
    open: `<lnvxe:footnotegrp>
<lnvxe:footnote fnrtokens="ref2" fntoken="fnote2">
<lnvxe:fnlabel alt-content="n2"/>
<lnvxe:fnbody>
<p><lnvxe:text><emph typestyle="it">`,
    close: `</emph></lnvxe:text></p>
</lnvxe:fnbody>
</lnvxe:footnote>
</lnvxe:footnotegrp>`,
  },

  /* ================= BLOCK ================= */
  {
    label: 'BlockQuote',
    open: '<lnvxe:blockquote><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:blockquote>',
  },

  /* ================= SYSTEM ================= */
  {
    label: 'SysAudit',
    open: '<lnv:SYS-AUDIT-TRAIL>',
    close: '</lnv:SYS-AUDIT-TRAIL>',
  },

];

/* ================= COMPONENT ================= */

export default function LnXmlEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Undo / Redo
  const [history, setHistory] = useState<Record<number, string[]>>({});
  const [redoStack, setRedoStack] = useState<Record<number, string[]>>({});

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ================= HISTORY ================= */

  const pushHistory = (page: number, content: string) => {
    setHistory(prev => ({
      ...prev,
      [page]: [...(prev[page] || []), content],
    }));
    setRedoStack(prev => ({ ...prev, [page]: [] }));
  };

  const undo = () => {
    const h = history[pageIndex];
    if (!h || h.length === 0) return;

    setRedoStack(r => ({
      ...r,
      [pageIndex]: [pages[pageIndex], ...(r[pageIndex] || [])],
    }));

    const copy = [...pages];
    copy[pageIndex] = h[h.length - 1];
    setPages(copy);

    setHistory(prev => ({
      ...prev,
      [pageIndex]: h.slice(0, -1),
    }));
  };

  const redo = () => {
    const r = redoStack[pageIndex];
    if (!r || r.length === 0) return;

    setHistory(h => ({
      ...h,
      [pageIndex]: [...(h[pageIndex] || []), pages[pageIndex]],
    }));

    const copy = [...pages];
    copy[pageIndex] = r[0];
    setPages(copy);

    setRedoStack(prev => ({
      ...prev,
      [pageIndex]: r.slice(1),
    }));
  };

  /* ================= SHORTCUTS ================= */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        applyTag(TAGS[0]); // Paragraph
      }
      if (e.ctrlKey && e.key === 'z') undo();
      if (e.ctrlKey && e.key === 'y') redo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pages, pageIndex, history, redoStack]);

  /* ================= UPLOAD ================= */

  const upload = async () => {
    if (!file) return alert('Upload Word file');

    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);

    const res = await customFetch(`${API_BASE}/lnxml/upload`, { method: 'POST', body: fd });
    const data = await res.json();

    setJobId(data.job_id);
    setPages(data.pages);
    setPageIndex(0);
    setHistory({});
    setRedoStack({});
    setLoading(false);
  };

  /* ================= APPLY TAG ================= */

  const applyTag = async (t: TagDef) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return alert('Select text first');

    pushHistory(pageIndex, pages[pageIndex]);

    const updated =
      ta.value.slice(0, start) +
      t.open +
      ta.value.slice(start, end) +
      t.close +
      ta.value.slice(end);

    const copy = [...pages];
    copy[pageIndex] = updated;
    setPages(copy);

    // 🔥 SAVE TO BACKEND
    await customFetch(`${API_BASE}/lnxml/tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        page: pageIndex + 1,
        start,
        end,
        tag: t.label,
        open: t.open,
        close: t.close,
      }),
    });
  };

  /* ================= GENERATE ================= */

const generate = async () => {
  const res = await customFetch(`${API_BASE}/lnxml/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId }),
  });

  const d = await res.json();

  // 🔽 Download XML
  window.open(`${API_BASE}${d.download}`, '_blank');

  // 🔥 IMPORTANT: RESET UI AFTER DOWNLOAD
  setTimeout(() => {
    setJobId('');
    setPages([]);
    setPageIndex(0);
    setFile(null);
    setHistory({});
    setRedoStack({});
  }, 500);
};


  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>LN XML Manual Tagging</h2>
      <p style={styles.subtitle}>
        Upload Word → Page wise tagging → Ctrl+Alt+P → Generate XML
      </p>

      <div style={styles.uploadBar}>
        <input type="file" accept=".docx" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button style={styles.primaryBtn} onClick={upload}>
          {loading ? 'Uploading...' : 'Upload OCR Word'}
        </button>
      </div>

      {pages.length > 0 && (
        <div style={styles.layout}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <h4>Pages ({pages.length})</h4>
            {pages.map((_, i) => (
              <div
                key={i}
                onClick={() => setPageIndex(i)}
                style={{
                  ...styles.pageItem,
                  background: i === pageIndex ? '#38bdf8' : '#f1f5f9',
                }}
              >
                Page {i + 1}
              </div>
            ))}
          </div>

          {/* Editor */}
          <div style={styles.editorWrapper}>
            <div style={styles.toolbar}>
              <button style={styles.undoBtn} onClick={undo}>Undo</button>
              <button style={styles.redoBtn} onClick={redo}>Redo</button>

              {TAGS.map(t => (
                <button key={t.label} style={styles.tagBtn} onClick={() => applyTag(t)}>
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={pages[pageIndex]}
              onChange={e => {
                pushHistory(pageIndex, pages[pageIndex]);
                const c = [...pages];
                c[pageIndex] = e.target.value;
                setPages(c);
              }}
              style={styles.textarea}
            />
          </div>
        </div>
      )}

      {jobId && (
        <button style={styles.exportBtn} onClick={generate}>
          Generate LN XML
        </button>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    maxWidth: '1600px',
    margin: '20px auto',
    padding: '30px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },
  title: { textAlign: 'center', fontSize: '28px' },
  subtitle: { textAlign: 'center', color: '#475569', marginBottom: '20px' },
  uploadBar: {
    display: 'flex',
    gap: '12px',
    padding: '14px',
    border: '2px dashed #38bdf8',
    borderRadius: '12px',
    marginBottom: '20px',
    background: '#f0f9ff',
  },
  primaryBtn: {
    padding: '10px 18px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  layout: { display: 'flex', gap: '20px' },
  sidebar: {
    width: '220px',
    background: '#f8fafc',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  pageItem: {
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  editorWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f1f5f9',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px',
    background: '#020617',
  },
  tagBtn: {
    padding: '6px 12px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '12px',
  },
  undoBtn: { background: '#f97316', border: 'none', padding: '6px 12px', fontWeight: 'bold' },
  redoBtn: { background: '#22c55e', border: 'none', padding: '6px 12px', fontWeight: 'bold' },
  textarea: {
    width: '100%',
    height: '70vh',
    padding: '16px',
    fontSize: '15px',
    border: 'none',
    outline: 'none',
    resize: 'none',
      },
  exportBtn: {
    marginTop: '20px',
    width: '100%',
    padding: '16px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
  },
};
