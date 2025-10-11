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
              {/* uploader avatar */}
              {(() => {
                const pi = file.user?.profileImageURL;
                const base = API.defaults.baseURL ? API.defaults.baseURL.replace(/\/api$/, '') : '';
                let avatarSrc = '/sharessource-logo.png';
                if (pi) {
                  if (/^https?:\/\//i.test(pi) || /^data:/i.test(pi)) avatarSrc = pi;
                  else avatarSrc = `${base}${pi}`;
                }
                // only render avatar when uploader has an uploaded profileImageURL
                if (!file.user?.profileImageURL) return <div style={{ width: 28, height: 28 }} />;
                return (
                  <img src={avatarSrc} alt={file.user?.username || 'uploader'} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                );
              })()}

              {/* file icon */}
              {(() => {
                const name = (file.originalName || file.filename || '').toLowerCase();
                if (name.endsWith('.pdf')) return <img src="/icons/pdf.svg" alt="pdf" style={{ width: 22, height: 22 }} />;
                if (name.endsWith('.txt')) return <img src="/icons/txt.svg" alt="txt" style={{ width: 22, height: 22 }} />;
                if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.svg" alt="doc" style={{ width: 22, height: 22 }} />;
                return <img src="/icons/file.svg" alt="file" style={{ width: 22, height: 22 }} />;
              })()}

              <button onClick={() => setActive(file)} style={{ background: 'transparent', border: 'none', padding: 0, color: '#0b66c3', textDecoration: 'underline', cursor: 'pointer' }}>{file.originalName}</button>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                <div>Uploader: {file.user?.username || 'Unknown'}</div>
                <div>Subject: {file.subject?.name || 'n/a'}</div>
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
