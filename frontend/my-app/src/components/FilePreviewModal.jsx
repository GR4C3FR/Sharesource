import React, { useEffect, useState } from 'react';
import API from '../api';

export default function FilePreviewModal({ file, token, onClose }) {
  const [avg, setAvg] = useState(file?.avgRating ?? null);
  const [loadingAvg, setLoadingAvg] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchAvg = async () => {
      if (avg !== null && avg !== undefined) return;
      setLoadingAvg(true);
      try {
        const res = await API.get(`/ratings/${file._id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!mounted) return;
        setAvg(res.data.average ?? 0);
      } catch (err) {
        console.error('Failed to fetch avg rating', err);
        if (mounted) setAvg(0);
      } finally {
        if (mounted) setLoadingAvg(false);
      }
    };
    if (file && file._id) fetchAvg();
    return () => { mounted = false; };
  }, [file, token]);

  if (!file) return null;

  const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: '90%', maxWidth: '1000px', background: 'white', borderRadius: 6, padding: 16, maxHeight: '90%', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(() => {
              const name = (file.originalName || file.filename || '').toLowerCase();
              if (name.endsWith('.pdf')) return <img src="/icons/pdf.svg" alt="pdf" style={{ width: 28, height: 28 }} />;
              if (name.endsWith('.txt')) return <img src="/icons/txt.svg" alt="txt" style={{ width: 28, height: 28 }} />;
              if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.svg" alt="doc" style={{ width: 28, height: 28 }} />;
              return <img src="/icons/file.svg" alt="file" style={{ width: 28, height: 28 }} />;
            })()}
            <h3 style={{ margin: 0 }}>{file.originalName}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginTop: 8, color: '#555' }}>
          <div><strong>Uploader:</strong> {file.user?.username || file.uploaderName || 'Unknown'}</div>
          <div><strong>Subject:</strong> {file.subject?.name || 'No subject'}</div>
          <div><strong>Description:</strong> {file.description || 'No description'}</div>
          <div><strong>Average Rating:</strong> {loadingAvg ? 'Loading...' : (avg !== null ? Number(avg).toFixed(2) : '—')}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          {/* Use iframe for preview (works for PDFs/images/text in many setups). Fallback link provided. */}
          <div style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}>
            <iframe title="file-preview" src={fileUrl} style={{ width: '100%', height: '100%', border: 0 }} />
          </div>
          <div style={{ marginTop: 8 }}>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">Open in new tab</a>
          </div>
        </div>
      </div>
    </div>
  );
}
