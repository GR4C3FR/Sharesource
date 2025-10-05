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

  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId"); // Ensure owner check

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

  return (
    <div className="my-files-container" style={{ padding: "20px" }}>
      <h2>My Uploaded Files</h2>

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
          {files.map((file) => (
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
