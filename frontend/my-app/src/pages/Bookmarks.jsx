import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";
import { useMemo } from "react";
import TopRatedPanel from "../components/TopRatedPanel";
import Avatar from '../components/Avatar';
import FilePreviewModal from "../components/FilePreviewModal";
import AppShell from "../components/AppShell";

export default function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const token = localStorage.getItem("accessToken");
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [openComments, setOpenComments] = useState({});
  const [fileAverages, setFileAverages] = useState({});

  const toggleComments = (fileId) => {
    setOpenComments((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const handleAverageUpdate = (fileId, newAverage) => {
    setFileAverages((prev) => ({ ...prev, [fileId]: newAverage }));
  };

  // fetch subjects for filter dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/subjects', { headers: { Authorization: `Bearer ${token}` } });
        setSubjects(Array.isArray(res.data.subjects) ? res.data.subjects : []);
      } catch (err) {
        console.error('Failed to load subjects', err);
      }
    };
    fetchSubjects();
  }, [token]);
  const [previewFile, setPreviewFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Batch fetch averages for bookmarked files to support immediate sorting
  useEffect(() => {
    const fetchAverages = async () => {
      try {
        const map = {};
        await Promise.all(bookmarks.map(async (f) => {
          try {
            const res = await API.get(`/ratings/${f._id}`, { headers: { Authorization: `Bearer ${token}` } });
            map[f._id] = res.data.average || 0;
          } catch (err) {
            map[f._id] = 0;
          }
        }));
        setFileAverages(map);
      } catch (err) {
        console.error('Failed to fetch bookmark averages', err);
      }
    };
    if (bookmarks && bookmarks.length) fetchAverages();
  }, [bookmarks, token]);

  // computed displayed bookmarks with filter & sort
  const displayedBookmarks = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const filtered = bookmarks.filter(f => {
      if (filterSubject && f.subject?._id !== filterSubject) return false;
      if (q) {
        const name = (f.originalName || f.filename || "").toLowerCase();
        const uploader = (f.user?.username || f.user?.email || "").toLowerCase();
        if (!name.includes(q) && !uploader.includes(q)) return false;
      }
      return true;
    });
    const sorted = filtered.slice().sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortOption === 'oldest') return new Date(a.uploadDate) - new Date(b.uploadDate);
      // rating-based sorting removed; TopRatedPanel provides top-rated listing
      return 0;
    });
    return sorted;
  }, [bookmarks, filterSubject, sortOption, fileAverages, searchQuery]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await API.get("/bookmarks", { headers: { Authorization: `Bearer ${token}` } });

        const validBookmarks = Array.isArray(res.data.bookmarks)
          ? res.data.bookmarks.filter(b => b.fileId && b.fileId._id)
          : [];

        // Use the populated file objects directly. Ensure safe fallbacks for user and subject.
        const files = validBookmarks.map(b => {
          const file = b.fileId;
          const user = file.user || { username: "Unknown", firstName: "", lastName: "" };
          const subject = file.subject || { name: "No subject" };
          const uploaderName = user.firstName || user.lastName
            ? `${(user.firstName || "").trim()} ${(user.lastName || "").trim()}`.trim()
            : (user.username || "Unknown");

          return {
            ...file,
            user,
            subject,
            uploaderName,
          };
        });

        setBookmarks(files);
      } catch (err) {
        console.error(err);
        alert("Failed to load bookmarks");
      }
    };
    fetchBookmarks();
  }, [token]);

  const downloadFile = async (filename) => {
    try {
      const res = await fetch(`http://localhost:5000/uploads/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }
  };

  // Allow removing bookmarks from the Bookmarks page
  const toggleBookmark = async (fileID) => {
    try {
      // find the bookmark id from server then delete
      const res = await API.get("/bookmarks");
      const bookmark = res.data.bookmarks.find(b => b.fileId._id === fileID);
      if (!bookmark) return alert("Bookmark not found");

      await API.delete(`/bookmarks/${bookmark._id}`);
      // remove the file from local state
      setBookmarks(prev => prev.filter(f => f._id !== fileID));
    } catch (err) {
      console.error(err);
      alert("Failed to update bookmark");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5">
      <h2>My Bookmarked Files</h2>
      <button onClick={() => navigate("/")} style={{ marginBottom: "20px" }}>Back to Homepage</button>
      {/* Filter & Sort for bookmarks */}
      <div style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
        <input
          type="text"
          placeholder="Search files or uploader..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300 mb-2"
        />
        <label>
          Filter by Subject: {" "}
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </label>

        <label style={{ marginLeft: "15px" }}>
          Sort by: {" "}
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Newest - Oldest</option>
            <option value="oldest">Oldest - Newest</option>
          </select>
        </label>

        <button style={{ marginLeft: "15px" }} onClick={() => { setFilterSubject(""); setSortOption("newest"); }}>
          Clear Filters
        </button>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {displayedBookmarks.filter(file => file && file._id).length === 0 ? (
            <p>No bookmarks yet.</p>
          ) : (
            <ul>
              {displayedBookmarks.filter(file => file && file._id).map(file => (
                <li key={file._id} style={{ marginBottom: "15px", display: 'flex', gap: 12 }}>
                  <div style={{ width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Avatar user={file.user} size={48} />
                    {/* file icon below avatar */}
                    <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(() => {
                        const name = (file.originalName || file.filename || '').toLowerCase();
                        if (name.endsWith('.pdf')) return <img src="/icons/pdf.svg" alt="pdf" style={{ width: 28, height: 28 }} />;
                        if (name.endsWith('.txt')) return <img src="/icons/txt.svg" alt="txt" style={{ width: 28, height: 28 }} />;
                        if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.svg" alt="doc" style={{ width: 28, height: 28 }} />;
                        return <img src="/icons/file.svg" alt="file" style={{ width: 28, height: 28 }} />;
                      })()}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => setPreviewFile(file)} style={{ background: 'transparent', border: 'none', padding: 0, color: '#0b66c3', textDecoration: 'underline', cursor: 'pointer', fontSize: 16 }}>{file.originalName}</button>
                      <button onClick={() => downloadFile(file.filename)} style={{ marginLeft: "10px" }}>Download</button>
                      <button onClick={() => toggleBookmark(file._id)} style={{ marginLeft: "10px", backgroundColor: "#f1c40f", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>Remove Bookmark</button>
                    </div>
                    <p>Subject: {file.subject?.name || "No subject"}</p>
                    <p>Uploaded by: {file.user?.username || "Unknown"}</p>
                    <p><strong>Description:</strong> {file.description || "No description"}</p>

                  {/* ⭐ Show Average Rating (auto-updates) - outside dropdown to match Homepage */}
                  <RatingSection itemId={file._id} userId={file.user?._id} showAverageOnly liveAverage={fileAverages[file._id]} onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />
                  <button onClick={() => toggleComments(file._id)} style={{ marginTop: "8px" }}>
                    {openComments[file._id] ? "Hide Comments & Ratings" : "Show Comments & Ratings"}
                  </button>

                  {openComments[file._id] && (
                    <div style={{ marginTop: "10px", borderTop: "1px dashed gray", paddingTop: "10px" }}>
                      <CommentsSection fileId={file._id} userId={file.user?._id} />
                      <RatingSection
                        itemId={file._id}
                        userId={file.user?._id}
                        allowRating
                        onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)}
                        liveAverage={fileAverages[file._id]}
                      />
                    </div>
                  )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {previewFile && <FilePreviewModal file={previewFile} token={token} onClose={() => setPreviewFile(null)} />}
      </div>
    </AppShell>
  );
}
