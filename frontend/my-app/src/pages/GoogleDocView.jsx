// frontend/src/pages/GoogleDocView.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import AppShell from "../components/AppShell";

export default function GoogleDocView() {
  const { spaceId, docId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/google-docs/${docId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        setDoc(res.data);
      } catch {
          console.error("Failed to load google doc");
          alert("Failed to load document");
        }
    };
    load();
    // fetch profile to determine role
    (async () => {
      try {
        const r = await API.get('/users/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        setProfile(r.data.user);
      } catch {
        // ignore
      }
    })();
  }, [docId]);

  // UI: hide page-level scrollbar while viewing this doc so only inner panels scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!doc) return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6">Loading document...</div>
    </AppShell>
  );

  // extract id if the saved doc.link is not pure id
  const idMatch = doc.link.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  const docIdFromLink = idMatch ? idMatch[1] : doc._id;

  // Use Google Docs edit URL (attempt to load the full editor). For admins, load the preview (read-only) variant.
  const embeddedUrl = profile?.role === 'Admin'
    ? `https://docs.google.com/document/d/${docIdFromLink}/preview`
    : `https://docs.google.com/document/d/${docIdFromLink}/edit`;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 h-screen overflow-hidden">
        <div className="flex items-start gap-6 h-full">
          {/* Main centered embed */}
          <main className="flex-1 h-full min-h-0 flex flex-col">
            <div className="mb-2">
              <button onClick={() => navigate(`/spaces/${spaceId}`)} className="inline-flex items-center gap-2 text-sm text-[#103E93] px-3 py-2 rounded-md border border-gray-200 bg-white shadow-sm hover:bg-gray-50">⬅ Back to Space</button>
            </div>

            {/* Compact doc header above the embed: title -> description -> uploader */}
            <div className="mb-3">
              <h2 className="text-lg font-semibold truncate">{doc.title}</h2>
              {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
              {doc.createdBy && <div className="text-xs text-gray-500 mt-1">Added by: {doc.createdBy.username || doc.createdBy.email}</div>}
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {/* Increase iframe wrapper height slightly to ensure full document visibility and move it higher */}
              <div className="rounded-md overflow-hidden border h-[calc(100vh-5.5rem)]">
                <iframe
                  src={embeddedUrl}
                  title={doc.title}
                  width="100%"
                  height="100%"
                  className="block w-full h-full min-h-0"
                  style={{ border: 'none' }}
                  allow="clipboard-read; clipboard-write; microphone; camera"
                />
              </div>
            </div>
          </main>

          {/* Right-side details panel */}
          <aside className="w-80 flex-shrink-0 h-full">
            <div className="h-full overflow-auto space-y-4">
              <div className="p-4 border rounded-md bg-white shadow-sm">
                <h2 className="text-lg font-semibold">{doc.title}</h2>
                <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                {doc.createdBy && (
                  <div className="mt-2 text-sm text-gray-500">Added by: {doc.createdBy.username || doc.createdBy.email}</div>
                )}
              </div>

              <div className="p-4 border rounded-md bg-white shadow-sm">
                <button onClick={() => window.open(doc.link, '_blank')} className="w-full px-3 py-2 bg-[#1D2F58] text-white rounded-md">Open in Google Docs</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
