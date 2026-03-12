'use client';
import { customFetch } from '@/utils/customFetch';
import { useState, useEffect } from 'react';

const TAGS = ['p', 'h2', 'h3'];

export default function XmlEditor() {
  const [jobId, setJobId] = useState('');
  const [page, setPage] = useState(1);
  const [text, setText] = useState('');
  const [selection, setSelection] = useState<{start:number,end:number}|null>(null);

  useEffect(() => {
    customFetch(`http://127.0.0.1:8000/xml/job/${jobId}/page/${page}`)
      .then(r => r.json())
      .then(d => setText(d.text));
  }, [page, jobId]);

  const applyTag = async (tag: string) => {
    if (!selection) return;
    await customFetch(`http://127.0.0.1:8000/xml/job/${jobId}/annotate`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ page, tag, ...selection })
    });
    setSelection(null);
  };

  return (
    <div style={{padding:30}}>
      <h2>Manual XML Tagging</h2>

      {/* Toolbar */}
      <div>
        {TAGS.map(t =>
          <button key={t} onClick={() => applyTag(t)}>{t.toUpperCase()}</button>
        )}
      </div>

      {/* Viewer */}
      <pre
        style={{border:'1px solid #ccc',padding:20,minHeight:300}}
        onMouseUp={() => {
          const sel = window.getSelection();
          if (!sel || !sel.rangeCount) return;
          const r = sel.getRangeAt(0);
          setSelection({start:r.startOffset,end:r.endOffset});
        }}
      >
        {text}
      </pre>

      {/* Nav */}
      <div>
        <button onClick={()=>setPage(p=>p-1)} disabled={page===1}>Prev</button>
        <span> Page {page} </span>
        <button onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>

      {/* Generate */}
      <button onClick={()=>{
        customFetch(`http://127.0.0.1:8000/xml/job/${jobId}/generate`)
      }}>
        Generate XML
      </button>
    </div>
  );
}
