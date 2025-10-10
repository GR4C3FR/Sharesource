import { useEffect, useState } from 'react';
import API from '../api';
import FilePreviewModal from './FilePreviewModal';

export default function TopRatedPanel({ scope = 'all', token }) {
  const [topFiles, setTopFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        let url = '/ratings/top-files/all';
        if (scope === 'my') url = '/ratings/top-files/my';
        if (scope === 'bookmarks') url = '/ratings/top-files/bookmarks';

        const res = await API.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setTopFiles(Array.isArray(res.data.topFiles) ? res.data.topFiles : []);
      } catch (err) {
        console.error('Failed to fetch top rated files', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, [scope, token]);

  if (loading) return <div style={{ padding: '10px' }}>Loading top rated...</div>;

  return (
    <aside>
      <h4 style={{ marginTop: 0 }}>Top Rated (4 - 5)</h4>
      {topFiles.length === 0 ? (
        <p style={{ fontSize: '0.9rem' }}>No top rated files yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {topFiles.map(file => (
            <li key={file._id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {(() => {
                const name = (file.originalName || file.filename || '').toLowerCase();
                if (name.endsWith('.pdf')) return <img src="/icons/pdf.png" alt="pdf" style={{ width: 22, height: 22 }} />;
                if (name.endsWith('.txt')) return <img src="/icons/txt.png" alt="txt" style={{ width: 22, height: 22 }} />;
                if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.png" alt="doc" style={{ width: 22, height: 22 }} />;
                return <img src="/icons/file.png" alt="file" style={{ width: 22, height: 22 }} />;
              })()}
              <button onClick={() => setActive(file)} style={{ background: 'transparent', border: 'none', padding: 0, color: '#0b66c3', textDecoration: 'underline', cursor: 'pointer' }}>{file.originalName}</button>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                <div>Uploader: {file.user?.username || 'Unknown'}</div>
                <div>Subject: {file.subject?.name || 'No subject'}</div>
                <div>Description: {file.description || 'No description'}</div>
                <div>Avg: {Number(file.avgRating).toFixed(2)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {active && <FilePreviewModal file={active} token={token} onClose={() => setActive(null)} />}
    </aside>
  );
}
