import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";
import TopRatedPanel from "../components/TopRatedPanel";
import FilePreviewModal from "../components/FilePreviewModal";
import Avatar from "../components/Avatar";
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
  const [showUploadModal, setShowUploadModal] = useState(false);


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
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 min-h-screen">
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
          <div className="flex-1">
            {/* Search + Filters (CSS-only toggle like Bookmarks/Homepage) */}
            <h1 className="text-3xl font-semibold text-[#1D2F58] mb-7">Your Files</h1>
            <div className="mb-4 relative">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 p-2 rounded-xl border border-[#1D2F58] bg-white"
                />
                <label htmlFor="bookmarks-filters-toggle" className="inline-flex items-center px-3 py-2 rounded-md bg-[#1D2F58] text-white text-sm cursor-pointer select-none hover:bg-[#16325a]">Filters</label>
              </div>

              <input id="bookmarks-filters-toggle" type="checkbox" className="hidden peer" />

              <div className="filter-panel absolute left-0 mt-2 w-full z-50 transform origin-top scale-y-0 peer-checked:scale-y-100 peer-checked:block hidden bg-white rounded-lg shadow-2xl p-4 py-6 border">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#103E93]">Filters & Sorting</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-1">Filter by Subject</label>
                      <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="p-2 rounded-md border bg-white text-sm">
                        <option value="">All Subjects</option>
                        {Array.from(new Set(files.map(f => f.subject?._id))).map(subjId => {
                          const subjName = files.find(f => f.subject?._id === subjId)?.subject?.name || "No subject";
                          return <option key={subjId} value={subjId}>{subjName}</option>;
                        })}
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
                  </div>
                </div>
              </div>
            </div>

            {/* Files list: scrollable area showing ~2 cards initially */}
            {displayedFiles.length === 0 ? (
              <p>You haven’t uploaded any files yet.</p>
            ) : (
              <div className="overflow-hidden bg-transparent">
                <div className="overflow-y-auto max-h-[65vh] pr-2">
                  {displayedFiles.map((file) => (
                    <div key={file._id} className="relative py-5 px-5 bg-white mb-4 rounded-lg shadow-md">
                      <div className="flex gap-3">
                        <div className="w-[72px] flex flex-col items-center gap-2 flex-shrink-0">
                          <Avatar user={file.user} size={50} className="rounded-full" />
                        </div>

                        <div className="flex-1 w-[40em]">
                          <section className="flex justify-between items-start">
                            <div className="flex flex-col mb-2 justify-between min-w-0">
                              {/* Owner username on top (above icon & filename) */}
                              <section className="flex gap-4 mb-3 items-center min-w-0">
                                <p className="font-inter font-medium text-sm text-[#103E93] w-[70%] truncate">{file.user?.username || file.user?.email || "Unknown"}</p>
                              </section>

                              <div className="flex flex-col justify-between w-full">
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
                                    <button onClick={() => setPreviewFile(file)} title={file.originalName} className="bg-transparent border-0 p-0 text-[#0b66c3] underline text-left cursor-pointer truncate block">{file.originalName}</button>

                                    {/* Subject value below file name (no 'Subject:' label) */}
                                    <p className="text-sm text-[#103E93] mt-2 truncate">{file.subject?.name || "No subject"}</p>
                                  </div>
                                </div>

                                <div className="w-44 flex-shrink-0 mt-1.5 text-left">
                                  {/* Keep description value but remove literal 'Description' label */}
                                  <p className="text-[15px] text-[#D05A02] break-words">{file.description || "No description"}</p>
                                </div>
                              </div>
                            </div>
                          </section>

                          {/* Rating and actions */}
                          <div className="mt-2 flex items-start justify-between">
                            <div className="flex flex-col">
                              <RatingSection itemId={file._id} userId={profile?._id} showAverageOnly liveAverage={fileAverages[file._id]} onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />
                              <button onClick={() => toggleComments(file._id)} className="mt-2 text-sm text-gray-700">{openComments[file._id] ? "Hide Comments & Ratings" : "Show Comments & Ratings"}</button>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <button onClick={() => downloadFile(file.filename )} className="px-3 py-1 text-sm rounded-md bg-green-50 border border-green-100 cursor-pointer w-[8em]">Download</button>
                              {(file.user?._id === userId || profile?.role === 'Admin') && (
                                <button onClick={() => handleDeleteFile(file._id)} className="px-3 py-1 text-sm rounded-md bg-red-50 border border-red-100 text-red-700 cursor-pointer w-[8em]">Delete</button>
                              )}
                            </div>
                          </div>

                          {openComments[file._id] && (
                            <div className="mt-3 border-t border-dashed border-gray-300 pt-3">
                              <CommentsSection fileId={file._id} userId={file.user?._id} />
                              <RatingSection itemId={file._id} userId={file.user?._id} allowRating onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {previewFile && <FilePreviewModal file={previewFile} token={token} onClose={() => setPreviewFile(null)} />}

        {/* Floating Upload File button (bottom-right) */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1D2F58] text-white shadow-lg hover:bg-[#16325a] cursor-pointer hide-when-mobile-open"
        >
          <img src="/file-upload.png" className="h-5" alt="upload" />
          Upload File
        </button>

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
                    <label className="block mb-1 text-[#103E93] font-inter font-medium">Select Subject:</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      required
                      className="w-full p-2 rounded-md border text-[#103E93] focus:ring-2 focus:ring-[#103E93] focus:outline-none"
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
                    <label className="block mb-1 text-[#103E93] font-inter font-medium">Add Subject:</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Add new subject"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="flex-1 p-2 rounded-md border text-[#103E93] focus:ring-2 focus:ring-[#103E93] focus:outline-none"
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
                    <label className="block mb-1 text-[#103E93] font-inter font-medium">Description:</label>
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
      </div>
    </AppShell>
  );
}
