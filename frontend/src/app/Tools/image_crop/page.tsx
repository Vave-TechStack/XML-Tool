'use client';
import { customFetch } from '@/utils/customFetch';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function ImageCropTool() {
  const [previewUrl, setPreviewUrl] = useState('');
  const [jobId, setJobId] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState('');

  const onCropComplete = useCallback((_: any, areaPixels: any) => {
    setCroppedArea(areaPixels);
  }, []);

  const uploadTiff = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);

    const res = await customFetch('http://127.0.0.1:8000/tools/image-crop/preview', {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();
    setPreviewUrl('http://127.0.0.1:8000' + data.preview_url);
    setJobId(data.job_id);
  };

  const cropImage = async () => {
    const fd = new FormData();
    fd.append('job_id', jobId);
    fd.append('x', Math.round(croppedArea.x).toString());
    fd.append('y', Math.round(croppedArea.y).toString());
    fd.append('width', Math.round(croppedArea.width).toString());
    fd.append('height', Math.round(croppedArea.height).toString());

    const res = await customFetch('http://127.0.0.1:8000/tools/image-crop', {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();
    setDownloadUrl('http://127.0.0.1:8000' + data.download_url);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Image Crop Tool (300 DPI)</h2>

      {!previewUrl && (
        <label style={styles.uploadBox}>
          <input
            type="file"
            accept=".tif,.tiff"
            hidden
            onChange={(e) => e.target.files && uploadTiff(e.target.files[0])}
          />
          <div style={styles.icon}>📁</div>
          <b>Click to upload TIFF</b>
          <p>Only .tif / .tiff supported</p>
        </label>
      )}

      {previewUrl && (
        <>
          <div style={styles.cropBox}>
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <button style={styles.primaryBtn} onClick={cropImage}>
            Crop & Save (300 DPI)
          </button>
        </>
      )}

      {downloadUrl && (
        <a href={downloadUrl} style={styles.downloadBtn}>
          Download Cropped TIFF
        </a>
      )}
    </div>
  );
}

const styles: any = {
  page: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '40px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  title: { fontSize: '26px', marginBottom: '20px' },
  uploadBox: {
    border: '2px dashed #38bdf8',
    borderRadius: '14px',
    padding: '40px',
    cursor: 'pointer',
    display: 'block',
  },
  icon: { fontSize: '48px', marginBottom: '10px' },
  cropBox: {
    position: 'relative',
    width: '100%',
    height: '420px',
    background: '#000',
    marginBottom: '20px',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px',
    background: '#38bdf8',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
  },
  downloadBtn: {
    display: 'block',
    marginTop: '20px',
    padding: '12px',
    background: '#0ea5e9',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};
