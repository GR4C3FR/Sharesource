import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";
import API from "../api";

export default function MyFiles() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileAverages, setFileAverages] = useState({});
  const [openComments, setOpenComments] = useState({}); // ⭐ Toggle comments
  const [filterSubject, setFilterSubject] = useState("");
  const [sortOption, setSortOption] = useState("newest");


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

  useEffect(() => {
    const fetchMyFiles = async () => {
      try {
        const res = await API.get("/files/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFiles(res.data.files);
      } catch (err) {
        setError("Failed to load your files");
      } finally {
        setLoading(false);
      }
    };
    fetchMyFiles();
  }, [token]);

  if (loading) return <p>Loading your files...</p>;
  if (error) return <p>{error}</p>;

  // Filter & sort files before rendering
  const displayedFiles = files
    .filter(file => !filterSubject || file.subject?._id === filterSubject)
    .sort((a, b) => {
      if (sortOption === "newest") return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortOption === "oldest") return new Date(a.uploadDate) - new Date(b.uploadDate);
      if (sortOption === "ratingDesc") return (fileAverages[b._id] || 0) - (fileAverages[a._id] || 0);
      if (sortOption === "ratingAsc") return (fileAverages[a._id] || 0) - (fileAverages[b._id] || 0);
      return 0;
    });

  return (
    <div className="my-files-container" style={{ padding: "20px" }}>
      <h2>My Uploaded Files</h2>
      {/* Filter & Sort */}
      <div style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
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
          Sort by:{" "}
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Newest - Oldest</option>
            <option value="oldest">Oldest - Newest</option>
            <option value="ratingDesc">High - Low</option>
            <option value="ratingAsc">Low - High</option>
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

      {files.length === 0 ? (
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
              <a
                href={`http://localhost:5000/uploads/${file.filename}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {file.originalName}
              </a>
              <button
                style={{ marginLeft: "10px" }}
                onClick={() => downloadFile(file.filename)}
              >
                Download
              </button>

              <p>Subject: {file.subject?.name || "No subject"}</p>
              <p>Uploaded on: {new Date(file.uploadDate).toLocaleString()}</p>
              <p><strong>Description:</strong> {file.description || "No description"}</p>


              {/* 🗑️ Delete button (owner only) */}
              {file.user?._id === userId && (
                <button
                  onClick={() => handleDeleteFile(file._id)}
                  style={{
                    marginTop: "8px",
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
                  {/* ⭐ Display current average rating above the stars */}
                  <p>
                    <strong>Average Rating:</strong>{" "}
                    {fileAverages[file._id] !== undefined
                      ? fileAverages[file._id].toFixed(1)
                      : "No ratings yet"}
                  </p>

                  {/* Allow live rating */}
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
  );
}
