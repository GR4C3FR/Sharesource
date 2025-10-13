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
  const [showUploadModal, setShowUploadModal] = useState(false);
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
      {/* Center and constrain homepage content width to match AppShell and let center column flex */}
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <div className="flex flex-col lg:flex-row justify-between gap-10 items-start w-full">
          {/* Center column: use flexible width so right panel feels like part of the page */}
          <section className="w-full lg:flex-1 min-w-0">
          {/* Mobile: show simple 'Dashboard'; Desktop: show welcome with username (exclamation) */}
          <h1 className="text-3xl font-semibold text-[#1D2F58] mb-7 block lg:hidden">Dashboard</h1>
          <h1 className="text-3xl font-semibold text-[#1D2F58] mb-7 hidden lg:block">Welcome{profile ? `, ${profile.username || profile.email || ''}` : ''}!</h1>

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
          <div className="filter-panel absolute left-0 mt-2 w-full z-50 transform origin-top scale-y-0 peer-checked:scale-y-100 peer-checked:block hidden bg-white rounded-lg shadow-2xl p-4 py-6 border">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#1D2F58]">Filters & Sorting</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Filter by Subject</label>
                  <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="p-2 rounded-md border bg-white text-sm">
                    <option value="">All Subjects</option>
                    {subjects.map((subj) => (
                      <option key={subj._id} value={subj._id}>{subj.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Sort by</label>
                  <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="p-2 rounded-md border bg-white text-sm">
                    <option value="newest">Newest - Oldest</option>
                    <option value="oldest">Oldest - Newest</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => {
                    setFilterSubject("");
                    setSortOption("newest");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200"
                >
                  Clear Filters
                </button>

                {/* Admin: Manage Subjects button kept here for convenience */}
              </div>
            </div>
            {/* Admin: Manage Subjects button */}
            {profile?.role === 'Admin' && (
              <div className="ml-3">
                <button onClick={openManageSubjects} className="px-3 py-1.5 bg-[#2b6cb0] text-white border-0 rounded-md">
                  Manage Subjects
                </button>
              </div>
            )}
            
          </div>
          </div>

          {/* Keep a fixed-height scroll area so the right TopRatedPanel doesn't resize when search yields no results */}
          <div className="overflow-hidden bg-transparent py-1 mb-10 min-h-0">
            <div className="overflow-y-auto max-h-[65vh] pr-2 mb-10 min-h-0">
              {displayedFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">No matching files.</div>
              ) : (
                displayedFiles.map((file) => (
                  <div key={file._id} className="relative py-5 px-5 bg-white mb-4 rounded-lg shadow-md">
                  {/* Bookmark icon button (top-right) */}
                  {profile?.role !== 'Admin' && (
                    <button
                      type="button"
                      onClick={() => toggleBookmark(file._id)}
                      aria-pressed={bookmarkedFiles.includes(file._id)}
                      className={
                        `absolute -top-1 right-3 p-0 transition-transform focus:outline-none z-20 cursor-pointer ` +
                        'hover:scale-110'
                      }
                      title={bookmarkedFiles.includes(file._id) ? 'Remove bookmark' : 'Add bookmark'}
                    >
                      <img
                        src="/bookmark-logo.png"
                        alt="bookmark"
                        className={
                          "w-10 h-10 transition-all duration-150 " +
                          (bookmarkedFiles.includes(file._id)
                            ? 'filter-none saturate-150 drop-shadow-md'
                            : 'filter grayscale hover:grayscale-0')
                        }
                      />
                      <span className="sr-only">{bookmarkedFiles.includes(file._id) ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  )}

                  <div className="flex gap-3">
                    <div className="w-[72px] flex flex-col items-center gap-2 flex-shrink-0">
                      <Avatar user={file.user} size={50} />
                    </div>

                    <div className="flex-1 max-w-[40em] min-w-0">

                      <section className="flex justify-between items-start">
                        <div className="flex flex-col mb-2 justify-between">
                          <section className="flex flex-col sm:flex-row gap-4 mb-3 items-center sm:items-center min-w-0">
                            <p className="font-inter font-medium text-[20px] leading-[16px] text-[#1D2F58] w-full sm:w-[10em]">{file.user?.username || "Unknown"}</p>
                            {/* Subject value moved below and displayed in uppercase near the description */}
                          </section>

                        <div className="flex flex-col justify-between w-full">
                          <div className="w-[calc(100%-11rem)]">
                            <div className="flex gap-3 items-start">
                              <div className="w-[36px] h-[36px] flex items-center justify-center flex-shrink-0">
                                {(() => {
                                  const name = (file.originalName || file.filename || '').toLowerCase();
                                  if (name.endsWith('.pdf')) return <img src="/icons/pdf.svg" alt="pdf" className="w-7 h-7" />;
                                  if (name.endsWith('.txt')) return <img src="/icons/txt.svg" alt="txt" className="w-7 h-7" />;
                                  if (name.endsWith('.doc') || name.endsWith('.docx')) return <img src="/icons/doc.svg" alt="doc" className="w-7 h-7" />;
                                  return <img src="/icons/file.svg" alt="file" className="w-7 h-7" />;
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <button onClick={() => setPreviewFile(file)} title={file.originalName} className="    bg-transparent border-0 p-0 text-[#1D2F58] underline text-left cursor-pointer
                                block truncate overflow-hidden text-ellipsis whitespace-nowrap
                                w-[150px] sm:w-[180px] md:w-auto lg:w-auto ">
                                {file.originalName}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="w-44 flex-shrink-0 mt-1.5 text-left">
                            {/* Subject (uppercase) - label removed but value kept */}
                            <p className="text-xs font-semibold mb-1 text-[#1D2F58] uppercase">{(file.subject?.name || "NO SUBJECT").toUpperCase()}</p>
                            {/* Description value kept; label removed per requirement */}
                            <p className="font-inter font-normal text-[15px] leading-[16px] text-[#1D2F58] break-words">{file.description || "No description"}</p>
                          </div>
                        </div>

                        </div>
                      </section>

                      {/* ⭐ Show Average Rating (auto-updates) and actions aligned */}
                      <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-start justify-between">
                        <div className="flex flex-col">
                          <RatingSection itemId={file._id} userId={profile?._id} showAverageOnly liveAverage={fileAverages[file._id]} onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />
                          <button onClick={() => toggleComments(file._id)} className="mt-2 text-sm text-gray-700">{openComments[file._id] ? "Hide Comments & Ratings" : "Show Comments & Ratings"}</button>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
                          <button onClick={() => downloadFile(file.filename )} className="px-3 py-1 text-sm rounded-md bg-green-50 border border-green-100 cursor-pointer w-full sm:w-[8em]">Download</button>
                              {(file.user?._id === profile?._id || profile?.role === 'Admin') && (
                                <button onClick={() => handleDeleteFile(file._id)} className="px-3 py-1 text-sm rounded-md bg-red-50 border border-red-100 text-red-700 cursor-pointer w-full sm:w-[8em]">Delete</button>
                              )}
                        </div>
                      </div>

                      {openComments[file._id] && (
                        <div className="mt-3 border-t border-dashed border-gray-300 pt-3">
                          <RatingSection itemId={file._id} userId={profile?._id} allowRating onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />
                          <CommentsSection fileId={file._id} userId={profile?._id} />
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                ))
              )}
            </div>
          </div>

          </section>

          {/* Right-side Top Rated panel */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-6">
              <TopRatedPanel scope="all" token={token} />
            </div>
          </div>
        </div>

        {previewFile && <FilePreviewModal file={previewFile} token={token} onClose={() => setPreviewFile(null)} />}

        {/* Floating action button: Upload for regular users, Manage Subjects for Admins */}
        {profile?.role === 'Admin' ? (
          <button
            onClick={openManageSubjects}
            className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1D2F58] text-white shadow-lg hover:bg-[#16325a] cursor-pointer hide-when-mobile-open"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M10 2a1 1 0 011 1v1h3a1 1 0 011 1v2h-1V6h-2V4h-2V3a1 1 0 00-1-1zM3 7h1v9a1 1 0 001 1h10a1 1 0 001-1V7h1v9a3 3 0 01-3 3H6a3 3 0 01-3-3V7z" />
            </svg>
            Manage Subjects
          </button>
        ) : (
          <button
            onClick={() => setShowUploadModal(true)}
            className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1D2F58] text-white shadow-lg hover:bg-[#16325a] cursor-pointer hide-when-mobile-open"
          >
            <img src="/file-upload.png" className="h-5"/>
            Upload File
          </button>
        )}

        {/* Upload Modal (reuses existing handlers/state) */}
        {showUploadModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowUploadModal(false)} />
            <div className="relative z-70 w-full max-w-2xl bg-white rounded-lg shadow-xl px-8 py-10">
              <div className="flex items-center justify-between mb-7">
                <h3 className="text-lg font-medium">Upload a File</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">Close</button>
              </div>

                <form onSubmit={(e) => { handleFileUpload(e); setShowUploadModal(false); }}>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.txt"
                    className="block w-full text-sm text-gray-900 border rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#1D2F58] file:text-white hover:file:bg-[#103E93] mb-5"
                  />

                  <div className="mt-4">
                    <label className="block mb-1 text-[#1D2F58] font-inter font-medium">Select Subject:</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      required
                      className="w-full p-2 rounded-md border text-[#1D2F58] focus:ring-2 focus:ring-[#103E93] focus:outline-none max-h-[10rem] overflow-auto"
                      size={Math.min(subjects.length, 8)}
                    >
                      <option value="">Select a Subject</option>
                      {subjects.map((subj) => (
                        <option key={subj._id} value={subj._id}>
                          {subj.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 gap-2">
                    <label className="block mb-1 text-[#1D2F58] font-inter font-medium">Add Subject:</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Add new subject"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="flex-1 p-2 rounded-md border text-[#1D2F58] focus:ring-2 focus:ring-[#103E93] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        className="px-3 py-2 rounded-md bg-[#103E93] text-white hover:bg-[#1D2F58] transition-colors cursor-pointer"
                      >
                        Add New Subject
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 mb-6">
                    <label className="block mb-1 text-[#1D2F58] font-inter font-medium">Description:</label>
                    <input
                      type="text"
                      placeholder="Add file description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="w-full p-2 rounded-md border text-[#103E93] focus:ring-2 focus:ring-[#103E93] focus:outline-none"
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="mr-2 px-4 py-2 rounded-md border border-[#1D2F58] text-[#103E93] hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-[#1D2F58] text-white hover:bg-[#103E93] transition-colors cursor-pointer"
                    >
                      Upload
                    </button>
                  </div>
                </form>
            </div>
          </div>
        )}
        {/* Admin Manage Subjects Modal */}
        {showManageSubjects && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-5 rounded-md w-[600px] max-h-[80vh] overflow-auto">
              <h3>Manage Subjects</h3>
              <div className="flex gap-2 mb-3">
                <input placeholder="New subject" value={manageSubjectName} onChange={(e) => setManageSubjectName(e.target.value)} className="flex-1 p-2 border rounded-md" />
                <button onClick={handleManageAdd} className="bg-[#2b6cb0] text-white border-0 px-3 py-1.5 rounded-md">Add</button>
                <button onClick={() => setShowManageSubjects(false)} className="ml-2">Close</button>
              </div>
              <ul>
                {subjects.map(s => (
                  <li key={s._id} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span>{s.name}</span>
                    <button onClick={() => handleManageDelete(s._id)} className="bg-red-600 text-white border-0 px-2 py-1 rounded-md">Delete</button>
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
