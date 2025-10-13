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
  const token = localStorage.getItem('accessToken');
  const [bookmarks, setBookmarks] = useState([]);
  const [fileAverages, setFileAverages] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [filterSubject, setFilterSubject] = useState("");
  const [sortOption, setSortOption] = useState('newest');
  const [subjects, setSubjects] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedFiles, setBookmarkedFiles] = useState([]);

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
          } catch {
            map[f._id] = 0;
          }
        }));
        setFileAverages(map);
      } catch {
        console.error('Failed to fetch bookmark averages');
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
          const subject = file.subject || { name: "n/a" };
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

  // fetch current user profile to determine ownership (same logic as Homepage)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data.user);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  // Delete file (only if owner) — same logic as Homepage
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await API.delete(`/files/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      // remove from local bookmarks/files state
      setBookmarks(prev => prev.filter(f => f._id !== fileId));
      alert('File deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err.response?.data || err.message);
      alert('Failed to delete file.');
    }
  };

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
  <div className="mx-auto w-full max-w-screen-xl px-4 py-6 min-h-screen">
      {/* Filter & Sort for bookmarks (CSS-only toggle like Homepage) */}
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
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1">
          {displayedBookmarks.filter(file => file && file._id).length === 0 ? (
            <p>No bookmarks yet.</p>
          ) : (
            <div className="overflow-hidden bg-transparent py-1 min-h-0">
              <div className="overflow-y-auto max-h-[65vh] pr-2 min-h-0">
                {displayedBookmarks.filter(file => file && file._id).map((file) => {
                  return (
                    <div key={file._id} className="relative py-5 px-5 bg-white mb-4 rounded-lg shadow-md w-[20rem] sm:w-full max-w-[calc(100vw-2rem)] mx-auto overflow-hidden box-border">
                      {/* Bookmark icon button (top-right) */}
                      {profile?.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => toggleBookmark(file._id)}
                          aria-pressed={bookmarks.some(b => b._id === file._id)}
                          className={
                            `absolute -top-1 right-3 p-0 transition-transform focus:outline-none z-20 cursor-pointer ` +
                            'hover:scale-110'
                          }
                          title={bookmarks.some(b => b._id === file._id) ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          <img
                            src="/bookmark-logo.png"
                            alt="bookmark"
                            className={
                              "w-10 h-10 transition-all duration-150 " +
                              (bookmarks.some(b => b._id === file._id)
                                ? 'filter-none saturate-150 drop-shadow-md'
                                : 'filter grayscale hover:grayscale-0')
                            }
                          />
                          <span className="sr-only">{bookmarks.some(b => b._id === file._id) ? 'Bookmarked' : 'Bookmark'}</span>
                        </button>
                      )}

                      <div className="flex gap-3 min-w-0">
                        <div className="w-18 sm:w-20 flex flex-col items-center gap-2 flex-shrink-0">
                          <Avatar user={file.user} size={50} />
                        </div>

                        <div className="flex-1 min-w-0">

                          <section className="flex justify-between items-start">
                            <div className="flex flex-col mb-2 justify-between">
                              <section className="flex flex-col sm:flex-row gap-4 mb-3 items-center sm:items-center min-w-0">
                                <p className="font-inter font-medium text-lg leading-tight text-[#103E93] w-full sm:w-[10em] truncate">{file.user?.username || "Unknown"}</p>
                                <p className="font-inter font-normal text-sm leading-tight text-[#103E93] w-full sm:w-[60%] truncate">Subject: {file.subject?.name || "No subject"}</p>
                              </section>

                              <div className="flex flex-col justify-between w-full">
                                <div className="flex-1 min-w-0">
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
                                      <button
                                        onClick={() => setPreviewFile(file)}
                                        title={file.originalName}
                                        className="bg-transparent border-0 p-0 text-[#0b66c3] underline text-left cursor-pointer block truncate overflow-hidden text-ellipsis whitespace-nowrap w-[150px] sm:w-[180px] md:w-auto lg:w-auto"
                                      >
                                        {file.originalName}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="w-44 max-w-xs sm:flex-shrink-0 flex-shrink mt-1.5 text-left">
                                  <h1 className="text-sm font-semibold mb-1">Description</h1>
                                  <p className="font-inter font-normal text-[15px] leading-[16px] text-[#D05A02] break-words">{file.description || "No description"}</p>
                                </div>
                              </div>

                            </div>
                          </section>

                          {/* ⭐ Show Average Rating (auto-updates) and actions aligned */}
                          <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-start justify-between">
                            <div className="flex flex-col">
                              <RatingSection itemId={file._id} userId={file.user?._id} showAverageOnly liveAverage={fileAverages[file._id]} onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)} />
                            </div>

                              <div className="flex flex-col items-start sm:items-end gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
                              <button onClick={() => downloadFile(file.filename )} className="px-3 py-1 text-sm rounded-md bg-green-50 border border-green-100 cursor-pointer w-full sm:w-32">Download</button>
                              {(file.user?._id === profile?._id || profile?.role === 'Admin') && (
                                <button onClick={() => handleDeleteFile(file._id)} className="px-3 py-1 text-sm rounded-md bg-red-50 border border-red-100 text-red-700 cursor-pointer w-full sm:w-32">Delete</button>
                              )}
                              <button onClick={() => toggleComments(file._id)} className="mt-2 text-sm text-gray-700 w-full sm:w-auto text-left sm:text-right">{openComments[file._id] ? "Hide Comments & Ratings" : "Show Comments & Ratings"}</button>
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {previewFile && <FilePreviewModal file={previewFile} token={token} onClose={() => setPreviewFile(null)} />}
      </div>
    </AppShell>
  );
}
