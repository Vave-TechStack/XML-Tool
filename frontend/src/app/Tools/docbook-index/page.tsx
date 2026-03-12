'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

type Step = 1 | 2 | 3;

interface PageInfo {
  page: number;
  file: string;
  preview: string;
}

export default function BlackVaveIndexTool() {
  // --- States ---
  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [jobId, setJobId] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Selection state
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Debugger for Image loading
  useEffect(() => {
    if (pages.length > 0) {
      console.log("Current Page Image URL:", pages[currentPage]?.preview);
    }
  }, [currentPage, pages]);

  /* ================= HANDLERS ================= */
  
  // 1. UPLOAD
  const uploadPages = async () => {
    if (files.length === 0) return alert('Please select files');
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));

    try {
      const res = await axios.post('http://localhost:8000/api/docxmlindex/upload-pages', fd);
      setJobId(res.data.job_id);
      setPages(res.data.pages);
      setStep(2);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Backend connected kaadu. Please check if FastAPI is running on port 8000.");
    }
  };

  // 2. SELECTION LOGIC
  const onMouseDown = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    const startX = (e.clientX - r.left) / zoom;
    const startY = (e.clientY - r.top) / zoom;
    
    setStart({ x: startX, y: startY });
    setRect({ x: startX, y: startY, w: 0, h: 0 });
    setDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    const currentX = (e.clientX - r.left) / zoom;
    const currentY = (e.clientY - r.top) / zoom;

    setRect({
      x: Math.min(start.x, currentX),
      y: Math.min(start.y, currentY),
      w: Math.abs(currentX - start.x),
      h: Math.abs(currentY - start.y),
    });
  };

  // 3. SAVE SELECTION
  const saveSelection = async () => {
    if (rect.w === 0 || rect.h === 0) return alert("Please select a column area!");
    
    setIsSaving(true);
    try {
      await axios.post('http://localhost:8000/api/docxmlindex/save-selection', {
        job_id: jobId,
        file: pages[currentPage].file,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.w),
        height: Math.round(rect.h),
      });
      alert(`Column saved for Page ${currentPage + 1}! Select next column or click Generate.`);
      setRect({ x: 0, y: 0, w: 0, h: 0 });
    } catch (err) {
      alert("Error saving selection");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. GENERATE
  const generateXML = async () => {
    try {
      await axios.post(`http://localhost:8000/api/docxmlindex/generate-xml?job_id=${jobId}`);
      window.location.href = `http://localhost:8000/api/docxmlindex/download?job_id=${jobId}`;
    } catch (err) {
      alert("XML generation failed.");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Black Vave <span style={{fontWeight: 300}}>| IndexXML Tool</span></h1>
        <div style={styles.badge}>Software Tech</div>
      </header>

      {step === 1 && (
        <div style={styles.uploadCard}>
          <div style={styles.uploadIcon}>📁</div>
          <h3>Upload Index Pages</h3>
          <p>Select TIFF images to start indexing</p>
          <input 
            type="file" 
            multiple 
            accept=".tif,.tiff" 
            onChange={e => setFiles([...Array.from(e.target.files!)])}
            style={styles.fileInput}
          />
          <button style={styles.primaryBtn} onClick={uploadPages}>Start Processing</button>
        </div>
      )}

      {step === 2 && (
        <div style={styles.editorGrid}>
          <div style={styles.toolbar}>
            <div style={styles.navControls}>
              <button onClick={() => {setCurrentPage(p => Math.max(0, p - 1)); setRect({x:0,y:0,w:0,h:0})}}>◀ Prev</button>
              <span style={{margin: '0 15px'}}>Page {currentPage + 1} of {pages.length}</span>
              <button onClick={() => {setCurrentPage(p => Math.min(pages.length - 1, p + 1)); setRect({x:0,y:0,w:0,h:0})}}>Next ▶</button>
            </div>
            <div style={styles.zoomControls}>
              <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))}>Zoom +</button>
              <button onClick={() => setZoom(1)} style={{marginLeft: 5, marginRight: 5}}>Reset</button>
              <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>Zoom -</button>
            </div>
          </div>

          <div style={styles.canvasContainer}>
            <div 
              style={{
                ...styles.imageWrap,
                width: 'fit-content',
                height: 'fit-content'
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={() => setDragging(false)}
            >
              <img
                ref={imgRef}
                src={`http://localhost:8000${pages[currentPage]?.preview}`}
                alt="Index Page"
                crossOrigin="anonymous"
                draggable={false}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  display: 'block',
                  minWidth: '200px'
                }}
              />
              {rect.w > 0 && (
                <div style={{
                  position: 'absolute',
                  border: '2px solid #0070f3',
                  backgroundColor: 'rgba(0, 112, 243, 0.2)',
                  left: rect.x * zoom,
                  top: rect.y * zoom,
                  width: rect.w * zoom,
                  height: rect.h * zoom,
                  pointerEvents: 'none',
                  zIndex: 10
                }} />
              )}
            </div>
          </div>

          <div style={styles.sidebar}>
            <h4 style={{marginBottom: '10px'}}>Process Steps</h4>
            <p style={{fontSize: '12px', color: '#666', marginBottom: '20px'}}>
              1. Draw box on Column 1 → Click Save<br/>
              2. Draw box on Column 2 → Click Save<br/>
              3. Click Generate XML
            </p>
            <button 
              style={{...styles.primaryBtn, width: '100%', marginBottom: '10px', background: '#0070f3'}} 
              onClick={saveSelection}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : '➕ Save Selection'}
            </button>
            <button style={styles.generateBtn} onClick={generateXML}>🚀 Generate XML</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px 40px', background: '#fff', borderBottom: '1px solid #eaeaea', alignItems: 'center' },
  logo: { fontSize: '1.5rem', margin: 0, color: '#111' },
  badge: { padding: '5px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  uploadCard: { maxWidth: '500px', margin: '100px auto', padding: '40px', background: '#fff', textAlign: 'center', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  uploadIcon: { fontSize: '48px', marginBottom: '20px' },
  fileInput: { margin: '20px 0', display: 'block', width: '100%' },
  primaryBtn: { background: '#000', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  editorGrid: { display: 'grid', gridTemplateColumns: '1fr 280px', gridTemplateRows: '60px 1fr', height: 'calc(100vh - 70px)' },
  toolbar: { gridColumn: '1 / 3', background: '#fff', borderBottom: '1px solid #eaeaea', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' },
  navControls: { display: 'flex', alignItems: 'center' },
  zoomControls: { display: 'flex', alignItems: 'center' },
  canvasContainer: { overflow: 'auto', background: '#525659', padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
  imageWrap: { position: 'relative', boxShadow: '0 0 30px rgba(0,0,0,0.5)', background: '#fff' },
  sidebar: { background: '#fff', borderLeft: '1px solid #eaeaea', padding: '20px' },
  generateBtn: { width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};
