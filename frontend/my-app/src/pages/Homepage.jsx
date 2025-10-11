import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import API from "../api";
import Avatar from '../components/Avatar';
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";
import TopRatedPanel from "../components/TopRatedPanel";
import FilePreviewModal from "../components/FilePreviewModal";
import AppShell from "../components/AppShell";

export default function Homepage() {
  console.debug("Homepage mount", { token: localStorage.getItem("accessToken") });
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showManageSubjects, setShowManageSubjects] = useState(false);
  const [manageSubjectName, setManageSubjectName] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [fileAverages, setFileAverages] = useState({}); // ⭐ Live average sync per file
  const [description, setDescription] = useState("");
  const [filterSubject, setFilterSubject] = useState(""); // "" = all subjects
  const [sortOption, setSortOption] = useState("newest"); // default newest → oldest
  const [bookmarkedFiles, setBookmarkedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");


  const email = localStorage.getItem("userEmail");
  const token = localStorage.getItem("accessToken");

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


useEffect(() => {
  const fetchData = async () => {
    try {
      const profileRes = await API.get("/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileRes.data.user);

      // 🔹 fetch subjects first
      const subjectsRes = await API.get("/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjectsData = Array.isArray(subjectsRes.data.subjects)
        ? subjectsRes.data.subjects
        : [];
      setSubjects(subjectsData);

      // 🔹 fetch files after subjects
      const filesRes = await API.get("/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filesData = Array.isArray(filesRes.data.files) ? filesRes.data.files : [];

      // 🔹 map subject objects into files (attach as `subject` so UI reads file.subject)
      const filesWithSubjects = filesData.map((file) => {
        // file.subjectID can be an id string or a populated subject object (from backend)
        const subjectId = file.subjectID && file.subjectID._id ? file.subjectID._id : file.subjectID;
        const subject = file.subject || subjectsData.find((subj) => subj._id === subjectId);
  return { ...file, subject: subject || { name: "n/a" } };
      });

      setUploadedFiles(filesWithSubjects);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch data. Please login again.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userEmail");
      navigate("/login");
    }
  };
  fetchData();
}, [navigate, token]);


  // 🔹 Upload File
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

      const filesRes = await API.get("/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filesData = Array.isArray(filesRes.data.files) ? filesRes.data.files : [];
      // attach subject objects based on current subjects state
      const filesWithSubjects = filesData.map((file) => {
        const subjectId = file.subjectID && file.subjectID._id ? file.subjectID._id : file.subjectID;
  const subject = file.subject || subjects.find((s) => s._id === subjectId) || { name: 'n/a' };
        return { ...file, subject };
      });
      setUploadedFiles(filesWithSubjects);
      setSelectedFile(null);
      setSelectedSubject("");
      setDescription("");
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Failed to upload file.");
    }
  };

  // 🔹 Add new subject
  const handleAddSubject = async () => {
    if (!newSubjectName) return alert("Enter a subject name");
    const nameToAdd = newSubjectName.trim();
    if (!nameToAdd) return alert("Enter a subject name");
    try {
      // create subject
      await API.post(
        "/subjects",
        { name: nameToAdd },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      // refresh subjects list
      const subjectsRes = await API.get("/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(subjectsRes.data.subjects) ? subjectsRes.data.subjects : [];
      setSubjects(list);

      // select the newly created subject if present
      const created = list.find((s) => (s.name || "").toLowerCase() === nameToAdd.toLowerCase());
      if (created) setSelectedSubject(created._id);

      setNewSubjectName("");
      alert("Subject added!");
    } catch (err) {
      console.error(err);
      alert("Failed to add subject");
    }
  };

  // Manage Subjects (admin) handlers
  const openManageSubjects = async () => {
    try {
      const res = await API.get('/subjects', { headers: { Authorization: `Bearer ${token}` } });
      setSubjects(Array.isArray(res.data.subjects) ? res.data.subjects : []);
      setShowManageSubjects(true);
    } catch (err) {
      console.error('Failed to load subjects', err);
      alert('Failed to load subjects');
    }
  };

  const handleManageAdd = async () => {
    if (!manageSubjectName) return alert('Enter a subject name');
    try {
      await API.post('/subjects', { name: manageSubjectName }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const res = await API.get('/subjects', { headers: { Authorization: `Bearer ${token}` } });
      setSubjects(Array.isArray(res.data.subjects) ? res.data.subjects : []);
      setManageSubjectName('');
    } catch (err) {
      console.error('Failed to add subject', err);
      alert(err?.response?.data?.error || 'Failed to add subject');
    }
  };

  const handleManageDelete = async (id) => {
    if (!confirm('Delete this subject? Files using this subject will show n/a.')) return;
    try {
      await API.delete(`/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const res = await API.get('/subjects', { headers: { Authorization: `Bearer ${token}` } });
      setSubjects(Array.isArray(res.data.subjects) ? res.data.subjects : []);
    } catch (err) {
      console.error('Failed to delete subject', err);
      alert(err?.response?.data?.error || 'Failed to delete subject');
    }
  };

  // 🔹 Toggle comments visibility
  const toggleComments = (fileId) => {
    setOpenComments((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  // 🔹 Update live averages when rating changes
  const handleAverageUpdate = (fileId, newAverage) => {
    setFileAverages((prev) => ({
      ...prev,
      [fileId]: newAverage,
    }));
  };

  // 🔹 Delete File
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await API.delete(`/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // remove from local state without reloading
      setUploadedFiles((prev) => prev.filter((file) => file._id !== fileId));

      alert("File deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
      alert("Failed to delete file.");
    }
  };

// Fetch bookmarks on page load
useEffect(() => {
  const fetchBookmarks = async () => {
    try {
      const res = await API.get("/bookmarks", { headers: { Authorization: `Bearer ${token}` } });
      const validBookmarks = res.data.bookmarks.filter(b => b.fileId && b.fileId._id);
      setBookmarkedFiles(validBookmarks.map(b => b.fileId._id));
    } catch (err) {
      setBookmarkedFiles([]);
      console.error("Failed to fetch bookmarks:", err);
    }
  };
  fetchBookmarks();
}, [token]);

  // Batch-fetch averages for uploaded files so sorting by rating works immediately
  useEffect(() => {
    const fetchAverages = async () => {
      try {
        console.debug("Homepage: batch fetch averages start", { count: uploadedFiles.length });
        const map = {};
        await Promise.all(uploadedFiles.map(async (f) => {
          try {
            const res = await API.get(`/ratings/${f._id}`, { headers: { Authorization: `Bearer ${token}` } });
            map[f._id] = res.data.average || 0;
          } catch {
            map[f._id] = 0;
          }
        }));
        setFileAverages(map);
        console.debug("Homepage: batch fetch averages done", { map });
      } catch (err) {
        console.error('Failed to fetch averages', err);
      }
    };
    if (uploadedFiles && uploadedFiles.length > 0) fetchAverages();
  }, [uploadedFiles, token]);

const toggleBookmark = async (fileID) => {
  try {
    if (bookmarkedFiles.includes(fileID)) {
      // Find the bookmark _id first
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
    console.error("Bookmark action failed:", err);
    alert("Failed to update bookmark");
  }
};

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    alert("Logged out");
    navigate("/");
  };

  // Filter & sort files before rendering (useMemo for responsiveness)
  const displayedFiles = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const filtered = uploadedFiles.filter(file => {
      // subject filter
      if (filterSubject) {
        const subjName = subjects.find(s => s._id === filterSubject)?.name;
        if (!subjName || file.subject?.name !== subjName) return false;
      }

      // search filter (filename or uploader)
      if (q) {
        const name = (file.originalName || file.filename || "").toLowerCase();
        const uploader = (file.user?.username || file.user?.email || "").toLowerCase();
        if (!name.includes(q) && !uploader.includes(q)) return false;
      }

      return true;
    });
    const sorted = filtered.slice().sort((a, b) => {
      if (sortOption === "newest") return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortOption === "oldest") return new Date(a.uploadDate) - new Date(b.uploadDate);
      // rating-based sorting removed; use TopRatedPanel for top-rated listing
      return 0;
    });
    return sorted;
  }, [uploadedFiles, filterSubject, sortOption, fileAverages, subjects, searchQuery]);

  const [previewFile, setPreviewFile] = useState(null);

  return (
    <AppShell>
      {/* Center and constrain homepage content width to match other pages (Tailwind/shadcn) */}
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5">
        <div className="flex gap-5 items-start w-full">
          {/* Center column: keep all existing page content here (unchanged) */}
          <section className="mb-5 w-[700px]">
          {profile && (
            <h1 className="text-[32px] font-inter font-normal leading-[16px] tracking-[0%] mb-10">Welcome, {profile.firstName}! </h1>
          )}

          {/* Realtime search: filter uploaded files by filename or uploader */}
        {/* Search + filter toggle (CSS-only) */}
        <div className="mb-4 relative">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-[#1D2F58] bg-white"
            />
            <label htmlFor="filters-toggle" className="inline-flex items-center px-3 py-2 rounded-md bg-[#1D2F58] text-white text-sm cursor-pointer select-none hover:bg-[#16325a]">
              Filters
            </label>
          </div>

          {/* Hidden checkbox placed just before the panel so peer selector works */}
          <input id="filters-toggle" type="checkbox" className="hidden peer" />

          {/* Filter & Sort: absolute overlay hidden by default, shown when #filters-toggle is checked */}
          <div className="filter-panel absolute left-0 mt-2 w-full z-50 transform origin-top scale-y-0 peer-checked:scale-y-100 peer-checked:block hidden bg-white rounded-md shadow-lg p-3">
            <div className="flex flex-col gap-2">
              <label>
                Filter by Subject:{" "}
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                  <option value="">All Subjects</option>
                  {subjects.map((subj) => (
                    <option key={subj._1d} value={subj._id}>{subj.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Sort by:{" "}
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                  <option value="newest">Newest - Oldest</option>
                  <option value="oldest">Oldest - Newest</option>
                </select>
              </label>

              <button
                onClick={() => {
                  setFilterSubject("");
                  setSortOption("newest");
                }}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
            {/* Admin: Manage Subjects button */}
            {profile?.role === 'Admin' && (
              <div style={{ marginLeft: 12 }}>
                <button onClick={openManageSubjects} style={{ padding: '6px 10px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 6 }}>
                  Manage Subjects
                </button>
              </div>
            )}
            
          </div>
        </div>

          {uploadedFiles.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            // Scrollable area: fixed height to show ~2 cards, inner scroll for additional items
            <div className="overflow-hidden bg-transparent">
              <div className="overflow-y-auto h-[400px] pr-2">
                {displayedFiles.map((file) => {
                  return (
                    <div key={file._id} className="py-7 px-5 bg-white mb-8 rounded-lg shadow-md">
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Avatar user={file.user} size={48} />
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
                        <button onClick={() => setPreviewFile(file)} style={{ background: 'transparent', border: 'none', padding: 0, color: '#0b66c3', textDecoration: 'underline', cursor: 'pointer' }}>{file.originalName}</button>
                        <button style={{ marginLeft: "10px" }} onClick={() => downloadFile(file.filename)}>Download</button>
                      </div>

                      <p>Uploaded by: {file.user?.username || "Unknown"}</p>
                      <p>Subject: {file.subject?.name || "No subject"}</p>
                      <p><strong>Description:</strong> {file.description || "No description"}</p>

                      {/* 🗑️ Delete button (visible only to owner) */}
                      {file.user?._id === profile?._id && (
                        <button onClick={() => handleDeleteFile(file._id)} style={{ marginTop: "8px", backgroundColor: "#e74c3c", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>Delete File</button>
                      )}

                      {profile?.role !== 'Admin' && (
                        <button onClick={() => toggleBookmark(file._id)} style={{ marginLeft: "10px", backgroundColor: bookmarkedFiles.includes(file._id) ? "#f1c40f" : "#bdc3c7", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>{bookmarkedFiles.includes(file._id) ? "Bookmarked ★" : "Bookmark ☆"}</button>
                      )}

                      {/* ⭐ Show Average Rating (auto-updates) */}
                      <RatingSection itemId={file._id} userId={profile?._id} showAverageOnly liveAverage={fileAverages[file._id]} onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />

                      <button onClick={() => toggleComments(file._id)} style={{ marginTop: "8px" }}>{openComments[file._id] ? "Hide Comments & Ratings" : "Show Comments & Ratings"}</button>

                      {openComments[file._id] && (
                        <div style={{ marginTop: "10px", borderTop: "1px dashed gray", paddingTop: "10px" }}>
                          <CommentsSection fileId={file._id} userId={profile?._id} />
                          <RatingSection itemId={file._id} userId={profile?._id} allowRating onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =====================
              Upload File Section
          ===================== */}
          {profile?.role === 'Admin' ? null : (
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
        </section>

          {/* Right-side Top Rated panel */}
          <TopRatedPanel scope="all" token={token} />
        </div>

        {previewFile && <FilePreviewModal file={previewFile} token={token} onClose={() => setPreviewFile(null)} />}
        {/* Admin Manage Subjects Modal */}
        {showManageSubjects && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 600, maxHeight: '80vh', overflow: 'auto' }}>
              <h3>Manage Subjects</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input placeholder="New subject" value={manageSubjectName} onChange={(e) => setManageSubjectName(e.target.value)} style={{ flex: 1 }} />
                <button onClick={handleManageAdd} style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Add</button>
                <button onClick={() => setShowManageSubjects(false)} style={{ marginLeft: 8 }}>Close</button>
              </div>
              <ul>
                {subjects.map(s => (
                  <li key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                    <span>{s.name}</span>
                    <button onClick={() => handleManageDelete(s._id)} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6 }}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
