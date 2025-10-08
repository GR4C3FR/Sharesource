// frontend/src/pages/GoogleDocView.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

export default function GoogleDocView() {
  const { spaceId, docId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/google-docs/${docId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        setDoc(res.data);
      } catch (err) {
        console.error("Failed to load google doc:", err);
        alert("Failed to load document");
      }
    };
    load();
  }, [docId]);

  if (!doc) return <p>Loading document...</p>;

  // extract id if the saved doc.link is not pure id
  const idMatch = doc.link.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  const docIdFromLink = idMatch ? idMatch[1] : doc._id;

  // Use Google Docs edit URL (attempt to load the full editor). NOTE: Google often blocks full editor in cross-origin iframes.
  const embeddedUrl = `https://docs.google.com/document/d/${docIdFromLink}/edit`;

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(`/spaces/${spaceId}`)}>⬅ Back to Space</button>
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{doc.title}</h2>
        <p style={{ marginTop: 6, color: '#555' }}>{doc.description}</p>
        {doc.createdBy && (
          <small style={{ color: '#666' }}>Added by: {doc.createdBy.username || doc.createdBy.email}</small>
        )}
      </div>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <button
          onClick={() => window.open(doc.link, '_blank')}
          style={{ padding: '8px 12px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Open in Google Docs
        </button>
      </div>

      <div style={{ marginTop: 16, height: '80vh', borderRadius: 6, overflow: 'hidden' }}>
        {/* Attempt to load the full Google Docs editor. If blocked, use the Open in Google Docs button above. */}
        <iframe
          src={embeddedUrl}
          title={doc.title}
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block' }}
          allow="clipboard-read; clipboard-write; microphone; camera"
        ></iframe>
      </div>
    </div>
  );
}
