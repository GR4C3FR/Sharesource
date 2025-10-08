import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";
import { useMemo } from "react";

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
    const filtered = bookmarks.filter(f => !filterSubject || f.subject?._id === filterSubject);
    const sorted = filtered.slice().sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortOption === 'oldest') return new Date(a.uploadDate) - new Date(b.uploadDate);
      if (sortOption === 'ratingDesc') return (fileAverages[b._id] || 0) - (fileAverages[a._id] || 0);
      if (sortOption === 'ratingAsc') return (fileAverages[a._id] || 0) - (fileAverages[b._id] || 0);
      return 0;
    });
    return sorted;
  }, [bookmarks, filterSubject, sortOption, fileAverages]);

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
    <div style={{ padding: "20px" }}>
      <h2>My Bookmarked Files</h2>
      <button onClick={() => navigate("/")} style={{ marginBottom: "20px" }}>Back to Homepage</button>
      {/* Filter & Sort for bookmarks */}
      <div style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
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
            <option value="ratingDesc">High - Low</option>
            <option value="ratingAsc">Low - High</option>
          </select>
        </label>

        <button style={{ marginLeft: "15px" }} onClick={() => { setFilterSubject(""); setSortOption("newest"); }}>
          Clear Filters
        </button>
      </div>
      {displayedBookmarks.filter(file => file && file._id).length === 0 ? (
        <p>No bookmarks yet.</p>
      ) : (
        <ul>
          {displayedBookmarks.filter(file => file && file._id).map(file => (
            <li key={file._id} style={{ marginBottom: "15px" }}>
              <a href={`http://localhost:5000/uploads/${file.filename}`} target="_blank" rel="noopener noreferrer">
                {file.originalName}
              </a>
              <button onClick={() => downloadFile(file.filename)} style={{ marginLeft: "10px" }}>Download</button>
                <button
                  onClick={() => toggleBookmark(file._id)}
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "#f1c40f",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Remove Bookmark
                </button>
              <p>Subject: {file.subject?.name || "No subject"}</p>
              <p>Uploaded by: {file.uploaderName || file.user?.username || "Unknown"}</p>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
