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

  if (loading) return <div className="p-3 text-sm text-[#1D2F58]">Loading top rated...</div>;

  return (
    <aside className="w-full overflow-x-hidden mb-5">
      <h4 className="text-[24px] font-semibold text-[#1D2F58]">Top-Rated Files</h4>
      {topFiles.length === 0 ? (
        <p className="text-sm text-[#1D2F58]">No top rated files yet.</p>
      ) : (
    <div className="overflow-y-auto overflow-x-hidden max-h-[75vh] pr-2 py-4">
              <ul className="space-y-3 p-0 m-0 list-none">
            {topFiles.map(file => (
                <li key={file._id} className="flex items-start bg-white rounded-md p-4 py-5 shadow-sm min-h-[84px] w-full mb-5">
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
                if (!file.user?.profileImageURL) return <div className="w-7 h-7" />;
                return (
                  <img src={avatarSrc} alt={file.user?.username || 'uploader'} className="w-7 h-7 object-cover rounded-md" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                );
              })()}

              {/* file icon */}
              {(() => {
                const name = (file.originalName || file.filename || '').toLowerCase();
                if (name.endsWith('.pdf')) return <img src="/icons/pdf.svg" alt="pdf" className="w-5 h-5" />;
                if (name.endsWith('.txt')) return <img src="/icons/txt.svg" alt="txt" className="w-5 h-5" />;
                if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.svg" alt="doc" className="w-5 h-5" />;
                return <img src="/icons/file.svg" alt="file" className="w-10 h-10" />;
              })()}

                <div className="flex-1 min-w-0 ml-4">
                <button onClick={() => setActive(file)} title={file.originalName} className="text-sm text-[#1D2F58] underline block truncate font-medium text-left cursor-pointer max-w-[10rem]">{file.originalName}</button>
                <div className="text-xs mt-2 space-y-1 text-[#1D2F58]">
                  <div>
                    <span className="text-[#1D2F58]">Uploader:</span>
                    <span className="ml-2">{file.user?.username || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-[#1D2F58]">Subject:</span>
                    <span className="ml-2">{file.subject?.name || 'n/a'}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-[#1D2F58]">Description:</span>
                    <span className="ml-2">{file.description || 'No description'}</span>
                  </div>
                  <div>
                    <span className="text-[#1D2F58]">Rating:</span>
                    <span className="ml-2">{Number.isInteger(Number(file.avgRating)) ? Number(file.avgRating) : Number(file.avgRating).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </li>
            ))}
          </ul>
        </div>
      )}
      {active && <FilePreviewModal file={active} token={token} onClose={() => setActive(null)} />}
    </aside>
  );
}
