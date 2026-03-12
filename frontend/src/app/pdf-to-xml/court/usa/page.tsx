'use client';
import { customFetch } from '@/utils/customFetch';
import { useState, useRef } from 'react';

/* ================= TAG DEFINITIONS ================= */

const TAGS = [
  /* ================= ROOT ================= */
  { label: 'CourtCase', open: '<COURTCASE>', close: '</COURTCASE>' },

  /* ================= DOC META ================= */
  { label: 'DocInfo', open: '<lndocmeta:docinfo>', close: '</lndocmeta:docinfo>' },

  { label: 'LNLNI', open: '<lndocmeta:lnlni lnlni=""/>', close: '' },
  { label: 'MinRev', open: '<lndocmeta:lnminrev lnminrev="00000"/>', close: '' },
  { label: 'SMI', open: '<lndocmeta:smi lnsmi="9658"/>', close: '' },
  { label: 'DPSI', open: '<lndocmeta:dpsi lndpsi="07Y1"/>', close: '' },
  { label: 'SourceDoc', open: '<lndocmeta:lnsourcedocid lnsourcedocid=""/>', close: '' },

  {
    label: 'DocType',
    open: '<lndocmeta:lndoctype lndoctypename="COURTCASE"/>',
    close: '',
  },

  {
    label: 'DocVersion',
    open: '<lndocmeta:lndoctypeversion lndoctypeversionmajor="06" lndoctypeversionminor="000"/>',
    close: '',
  },

  {
    label: 'DocLang',
    open: '<lndocmeta:lndoctypelang lndoctypelang="EN"/>',
    close: '',
  },

  {
    label: 'FileNum',
    open: '<lndocmeta:lnfilenum lnfilenum="001"/>',
    close: '',
  },

  {
    label: 'FabInfo',
    open: '<lndocmeta:fabinfo>',
    close: '</lndocmeta:fabinfo>',
  },

  {
    label: 'FabItem',
    open: '<lndocmeta:fabinfoitem name="B4DBNO" value="1HKW"/>',
    close: '',
  },

  /* ================= CASE HEADER ================= */
  {
    label: 'FullName',
    open: '<lnv:FULL-NAME><lnvxe:fullcasename>',
    close: '</lnvxe:fullcasename></lnv:FULL-NAME>',
  },

  {
    label: 'DocketNo',
    open: '<lnv:NUMBER><lnvxe:docketnumber>',
    close: '</lnvxe:docketnumber></lnv:NUMBER>',
  },

  { label: 'Court', open: '<lnv:COURT>', close: '</lnv:COURT>' },

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

  /* ================= META SECTIONS ================= */
  {
    label: 'PubStatus',
    open: '<lnv:PUB-STATUS><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnv:PUB-STATUS>',
  },

  {
    label: 'PriorHistory',
    open: '<lnv:PRIOR-HISTORY><lnvxe:priorhistory><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:priorhistory></lnv:PRIOR-HISTORY>',
  },

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

  { label: 'OpinionBy', open: '<lnv:OPINIONBY>', close: '</lnv:OPINIONBY>' },

  {
    label: 'Citation',
    open: '<lnv:CITE><cite4thisdoc>',
    close: '</cite4thisdoc></lnv:CITE>',
  },

  /* ================= OPINION BODY ================= */
  { label: 'Opinion', open: '<lnv:OPINION>', close: '</lnv:OPINION>' },

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
<lnvxe:footnote fntoken="fnote2">
<lnvxe:fnlabel alt-content="n2"></lnvxe:fnlabel>
<lnvxe:fnbody>
<p><lnvxe:text><emph typestyle="it">`,
  close: `</emph></lnvxe:text></p>
</lnvxe:fnbody>
</lnvxe:footnote>
</lnvxe:footnotegrp>`
},

  
  /* ================= BLOCK & INLINE ================= */
  {
    label: 'BlockQuote',
    open: '<lnvxe:blockquote><p><lnvxe:text>',
    close: '</lnvxe:text></p></lnvxe:blockquote>',
  },

  { label: 'Bold', open: '<emph typestyle="bf">', close: '</emph>' },
  { label: 'Italic', open: '<emph typestyle="it">', close: '</emph>' },
];


/* ================= COMPONENT ================= */

export default function LnXmlEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

   // ✅ NEW: Undo / Redo stacks
  const [history, setHistory] = useState<string[][]>([]);
  const [future, setFuture] = useState<string[][]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ================= UPLOAD ================= */

  const upload = async () => {
    if (!file) return alert('Upload OCR Word file');

    const fd = new FormData();
    fd.append('file', file);

    const res = await customFetch('http://127.0.0.1:8000/lnxml/upload', {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();

    setJobId(data.job_id);
    setPages(data.pages);
    setPageIndex(0);
  };

  /* ================= APPLY TAG ================= */

  const applyTag = async (tagObj: { label: string; open: string; close: string }) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    if (start === end) {
      alert('Please select text first');
      return;
    }

    
    // ✅ save history BEFORE change
    setHistory(prev => [...prev, pages]);
    setFuture([]);

    const selected = ta.value.slice(start, end);

    const wrapped =
      tagObj.open + selected + tagObj.close;

    const updated =
      ta.value.slice(0, start) +
      wrapped +
      ta.value.slice(end);

    const copy = [...pages];
    copy[pageIndex] = updated;
    setPages(copy);

    /* optional backend save */
    await customFetch('http://127.0.0.1:8000/lnxml/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        page: pageIndex + 1,
        start,
        end,
        tag: tagObj.label,
      }),
    });
  };

   /* ================= UNDO ================= */
  const undo = () => {
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setFuture([pages, ...future]);
    setPages(previous);
  };

    /* ================= REDO ================= */
  const redo = () => {
    if (future.length === 0) return;

    const next = future[0];
    setFuture(future.slice(1));
    setHistory([...history, pages]);
    setPages(next);
  };

  
  /* ================= GENERATE ================= */

 const generate = async () => {
  const res = await customFetch('http://127.0.0.1:8000/lnxml/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId }),
  });

  const d = await res.json();

  // 🔽 Download XML
  window.open('http://127.0.0.1:8000' + d.download);

  // 🔥 CLEAR ALL DATA → BACK TO UPLOAD PAGE
  setJobId('');
  setPages([]);
  setPageIndex(0);
  setHistory([]);
  setFuture([]);
  setFile(null);
};


  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>LN XML Manual Tagging</h2>

      {/* Upload */}
      <div style={styles.uploadBar}>
        <input type="file" accept=".docx" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button style={styles.primaryBtn} onClick={upload}>
          Upload OCR Word
        </button>
      </div>

      {pages.length > 0 && (
        <div style={styles.layout}>
          {/* Pages */}
          <div style={styles.sidebar}>
            <h4>Pages</h4>
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
            {/* Toolbar */}
             {/* ✅ NEW UNDO / REDO */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={styles.exportBtn} onClick={undo}>Undo</button>
            <button style={styles.exportBtn} onClick={redo}>Redo</button>
          </div>
            <div style={styles.toolbar}>
              {TAGS.map(t => (
                <button
                  key={t.label}
                  style={styles.tagBtn}
                  onClick={() => applyTag(t)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={pages[pageIndex]}
              onChange={e => {
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
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },
  title: { textAlign: 'center', fontSize: '28px' },

  uploadBar: {
    display: 'flex',
    gap: '12px',
    padding: '14px',
    border: '2px dashed #38bdf8',
    borderRadius: '12px',
    marginBottom: '20px',
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
    background: '#f1f5f9',
    borderRadius: '12px',
    overflow: 'hidden',
  },

  toolbar: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px',
    background: '#020617',
    maxHeight: '140px',
    overflowY: 'auto',
  },

  tagBtn: {
    padding: '6px 12px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
  },

  textarea: {
    width: '100%',
    height: '70vh',
    padding: '16px',
    border: 'none',
    resize: 'none',
    outline: 'none',
    fontSize: '15px',
  },

  exportBtn: {
   padding: '6px 12px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
     },
};
