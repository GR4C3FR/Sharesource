import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";
import TopRatedPanel from "../components/TopRatedPanel";
import FilePreviewModal from "../components/FilePreviewModal";
import API from "../api";
import AppShell from "../components/AppShell";

export default function MyFiles() {
  console.debug("MyFiles mount", { token: localStorage.getItem("accessToken") });
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const [bookmarkedFiles, setBookmarkedFiles] = useState([]);
  const [fileAverages, setFileAverages] = useState({});
  const [openComments, setOpenComments] = useState({}); // ⭐ Toggle comments
  const [filterSubject, setFilterSubject] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [profile, setProfile] = useState(null);

  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId"); // Ensure owner check

  const downloadFile = async (filename) => {
  try {
    const response = await fetch(`http://localhost:5000/uploads/${filename}`, {
      headers: { Authorization: `Bearer ${token}` }, // only if needed for auth
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // use original filename
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download file.");
  }
};

  const [previewFile, setPreviewFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");


  const handleAverageUpdate = (fileId, newAverage) => {
    setFileAverages((prev) => ({
      ...prev,
      [fileId]: newAverage,
    }));
  };

  const toggleComments = (fileId) => {
    setOpenComments((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await API.delete(`/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles((prev) => prev.filter((file) => file._id !== fileId));
      alert("File deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
      alert("Failed to delete file.");
    }
  };

  // Consolidated fetch: bookmarks, profile, subjects
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bkRes, profileRes, subjRes] = await Promise.all([
          API.get("/bookmarks", { headers: { Authorization: `Bearer ${token}` } }),
          API.get("/users/profile", { headers: { Authorization: `Bearer ${token}` } }),
          API.get("/subjects", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const validBookmarks = Array.isArray(bkRes.data.bookmarks)
          ? bkRes.data.bookmarks.filter(b => b.fileId && b.fileId._id)
          : [];
        setBookmarkedFiles(validBookmarks.map(b => b.fileId._id));

        setProfile(profileRes.data.user);

        const subjectsData = Array.isArray(subjRes.data.subjects) ? subjRes.data.subjects : [];
        setSubjects(subjectsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, [token]);

  // Bookmark toggle (component-scoped)
  const toggleBookmark = async (fileID) => {
    try {
      if (bookmarkedFiles.includes(fileID)) {
        const res = await API.get("/bookmarks", { headers: { Authorization: `Bearer ${token}` } });
        const bookmark = res.data.bookmarks.find(b => b.fileId._id === fileID);
        if (!bookmark) return alert("Bookmark not found");
        await API.delete(`/bookmarks/${bookmark._id}`, { headers: { Authorization: `Bearer ${token}` } });
        setBookmarkedFiles(prev => prev.filter(id => id !== fileID));
      } else {
        await API.post("/bookmarks/add", { fileId: fileID }, { headers: { Authorization: `Bearer ${token}` } });
        setBookmarkedFiles(prev => [...prev, fileID]);
      }
    } catch (err) {
      console.error('Bookmark action failed:', err);
      alert("Failed to update bookmark");
    }
  };


  useEffect(() => {
    const fetchAverages = async () => {
      try {
        const map = {};
        await Promise.all(files.map(async (f) => {
          try {
            const res = await API.get(`/ratings/${f._id}`, { headers: { Authorization: `Bearer ${token}` } });
            map[f._id] = res.data.average || 0;
          } catch {
              map[f._id] = 0;
            }
        }));
        setFileAverages(map);
      } catch {
          console.error('Failed to fetch averages');
        }
    };
    if (files && files.length > 0) fetchAverages();
  }, [files, token]);

  // Fetch user's files on mount
  useEffect(() => {
    const fetchMyFiles = async () => {
      try {
        const res = await API.get('/files/my', { headers: { Authorization: `Bearer ${token}` } });
        setFiles(Array.isArray(res.data.files) ? res.data.files : []);
      } catch (err) {
        console.error('Failed to load your files', err);
        setError('Failed to load your files');
      } finally {
        setLoading(false);
      }
    };
    fetchMyFiles();
  }, [token]);

  // compute displayedFiles using filters, sort and search
  const displayedFiles = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const filtered = files.filter(f => {
      if (filterSubject && f.subject?._id !== filterSubject) return false;
      if (q) {
        const name = (f.originalName || f.filename || '').toLowerCase();
        const uploader = (f.user?.username || f.user?.email || '').toLowerCase();
        if (!name.includes(q) && !uploader.includes(q)) return false;
      }
      return true;
    });
    const sorted = filtered.slice().sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortOption === 'oldest') return new Date(a.uploadDate) - new Date(b.uploadDate);
      return 0;
    });
    return sorted;
  }, [files, filterSubject, sortOption, searchQuery]);

  // Add new subject helper (same behavior as Homepage)
  const handleAddSubject = async () => {
    if (!newSubjectName) return alert('Enter a subject name');
    try {
      await API.post('/subjects', { name: newSubjectName }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      alert('Subject added!');
      setNewSubjectName('');
      const subjRes = await API.get('/subjects', { headers: { Authorization: `Bearer ${token}` } });
      setSubjects(Array.isArray(subjRes.data.subjects) ? subjRes.data.subjects : []);
    } catch (err) {
      console.error('Failed to add subject', err);
      alert('Failed to add subject');
    }
  };

  // Upload File
  const handleFileUpload = async (e) => {
    e.preventDefault();
  if (!selectedFile) return alert("Please select a file");
  if (!selectedSubject) return alert("Please select a subject before uploading");

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("ownerUserID", profile?._id);
  formData.append("subjectID", selectedSubject);
  formData.append("description", description);

  try {
    await API.post("/files/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    alert("File uploaded successfully!");

    // Refresh files
    const res = await API.get("/files/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setFiles(Array.isArray(res.data.files) ? res.data.files : []);
    setSelectedFile(null);
    setSelectedSubject("");
  } catch (err) {
    console.error('Upload failed', err);
    alert('Failed to upload file.');
  }
};

  if (loading) return <p>Loading your files...</p>;
  if (error) return <p>{error}</p>;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5">
      <div className="flex gap-5 items-start w-full">
        <div style={{ flex: 1 }}>
      <h2>My Uploaded Files</h2>
      {/* Search, Filter & Sort */}
      <div style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
        <input
          type="text"
          placeholder="Search files or uploader..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300 mb-2"
        />
        <label>
          Filter by Subject:{" "}
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {Array.from(new Set(files.map(f => f.subject?._id))).map(subjId => {
              const subjName = files.find(f => f.subject?._id === subjId)?.subject?.name || "No subject";
              return <option key={subjId} value={subjId}>{subjName}</option>;
            })}
          </select>
        </label>

        <label style={{ marginLeft: "15px" }}>
          Sort by: {" "}
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Newest - Oldest</option>
            <option value="oldest">Oldest - Newest</option>
          </select>
        </label>

        <button
          style={{ marginLeft: "15px" }}
          onClick={() => {
            setFilterSubject("");
            setSortOption("newest");
          }}
        >
          Clear Filters
        </button>
      </div>


      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "20px",
          padding: "5px 10px",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Back to Homepage
      </button>

      {profile?.role !== 'Admin' && (
        <>
          <h3>Upload a File</h3>
          <form onSubmit={handleFileUpload}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,.txt"
        />

        <div style={{ marginTop: "10px" }}>
          <label>
            Select Subject:{" "}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              required
            >
              <option value="">-- Select a Subject --</option>
              {subjects.map((subj) => (
                <option key={subj._id} value={subj._id}>
                  {subj.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Add new subject"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button type="button" onClick={handleAddSubject}>
            Add Subject
          </button>
        </div>

        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Add file description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

            <button type="submit" style={{ marginTop: "10px" }}>
              Upload
            </button>
          </form>
        </>
      )}


      {displayedFiles.length === 0 ? (
        <p>You haven’t uploaded any files yet.</p>
      ) : (
        <ul>
          {displayedFiles.map((file) => (
            <li
              key={file._id}
              style={{
                marginBottom: "20px",
                borderBottom: "1px dashed gray",
                paddingBottom: "10px",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setPreviewFile(file)} style={{ background: 'transparent', border: 'none', padding: 0, color: '#0b66c3', textDecoration: 'underline', cursor: 'pointer' }}>{file.originalName}</button>
              </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* file icon */}
                    {(() => {
                      const name = (file.originalName || file.filename || '').toLowerCase();
                      if (name.endsWith('.pdf')) return <img src="/icons/pdf.svg" alt="pdf" style={{ width: 28, height: 28 }} />;
                      if (name.endsWith('.txt')) return <img src="/icons/txt.svg" alt="txt" style={{ width: 28, height: 28 }} />;
                      if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.svg" alt="doc" style={{ width: 28, height: 28 }} />;
                      return <img src="/icons/file.svg" alt="file" style={{ width: 28, height: 28 }} />;
                    })()}
                    <button onClick={() => setPreviewFile(file)} style={{ background: 'transparent', border: 'none', padding: 0, color: '#0b66c3', textDecoration: 'underline', cursor: 'pointer' }}>{file.originalName}</button>
                  </div>
              <button
                style={{ marginLeft: "10px" }}
                onClick={() => downloadFile(file.filename)}
              >
                Download
              </button>

              <p>Subject: {file.subject?.name || "n/a"}</p>
              <p>Uploaded on: {new Date(file.uploadDate).toLocaleString()}</p>
              <p><strong>Description:</strong> {file.description || "No description"}</p>

              {/* Buttons: Delete (owner) and Bookmark - placed together */}
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
                {file.user?._id === userId && (
                  <button
                    onClick={() => handleDeleteFile(file._id)}
                    style={{
                      backgroundColor: "#e74c3c",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete File
                  </button>
                )}

                {profile?.role !== 'Admin' && (
                  <button
                    onClick={() => toggleBookmark(file._id)}
                    style={{
                      backgroundColor: bookmarkedFiles.includes(file._id) ? "#f1c40f" : "#bdc3c7",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {bookmarkedFiles.includes(file._id) ? "Bookmarked ★" : "Bookmark ☆"}
                  </button>
                )}
              </div>

              {/* ⭐ Show Average Rating (auto-updates) - placed under buttons */}
              <div style={{ marginTop: "8px" }}>
                <RatingSection
                  itemId={file._id}
                  userId={profile?._id}
                  showAverageOnly
                  liveAverage={fileAverages[file._id]}
                  onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)}
                />
              </div>

              {/* Show/hide comments & ratings */}
              <button
                onClick={() => toggleComments(file._id)}
                style={{ marginTop: "8px" }}
              >
                {openComments[file._id] ? "Hide Comments & Ratings" : "Show Comments & Ratings"}
              </button>

              {openComments[file._id] && (
                <div
                  style={{
                    marginTop: "10px",
                    borderTop: "1px dashed gray",
                    paddingTop: "10px",
                  }}
                >
                  {/* Allow live rating (interactive) */}
                  <RatingSection
                    itemId={file._id}
                    userId={file.user?._id}
                    allowRating
                    onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)}
                    liveAverage={fileAverages[file._id]}
                  />

                  <CommentsSection fileId={file._id} userId={file.user?._id} />
                </div>
              )}
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
