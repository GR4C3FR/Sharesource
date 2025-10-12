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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="w-[95%] max-w-[1000px] bg-white rounded-lg p-4 max-h-[95%] overflow-y-auto shadow-lg py-10 px-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 mb-5">
            {(() => {
              const name = (file.originalName || file.filename || '').toLowerCase();
              if (name.endsWith('.pdf')) return <img src="/icons/pdf.svg" alt="pdf" className="h-7 w-7" />;
              if (name.endsWith('.txt')) return <img src="/icons/txt.svg" alt="txt" className="h-7 w-7" />;
              if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.svg" alt="doc" className="h-7 w-7" />;
              return <img src="/icons/file.svg" alt="file" className="h-7 w-7" />;
            })()}
            <h3 className="text-lg font-semibold m-0">{file.originalName}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer">Close</button>
        </div>

        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <div><strong>Uploader:</strong> {file.user?.username || file.uploaderName || 'Unknown'}</div>
          <div><strong>Subject:</strong> {file.subject?.name || 'n/a'}</div>
          <div><strong>Description:</strong> {file.description || 'No description'}</div>
          <div><strong>Average Rating:</strong> {loadingAvg ? 'Loading...' : (avg !== null ? Number(avg).toFixed(2) : '—')}</div>
        </div>

        <div className="mt-4">
          {/* Use iframe for preview (works for PDFs/images/text in many setups). Fallback link provided. */}
          <div className="w-full h-[40rem] md:h-[60vh] border border-gray-200 rounded-md overflow-hidden">
            <iframe title="file-preview" src={fileUrl} className="w-full h-full border-0" />
          </div>
          <div className="mt-3 text-sm">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#103E93] hover:underline">Open in new tab</a>
          </div>
        </div>
      </div>
    </div>
  );
}
