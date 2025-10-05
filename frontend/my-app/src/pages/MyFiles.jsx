import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ⭐ Added
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";
import API from "../api";

export default function MyFiles() {
  const navigate = useNavigate(); // ⭐ Added
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileAverages, setFileAverages] = useState({}); // ⭐ Live averages

  const handleAverageUpdate = (fileId, newAverage) => {
    setFileAverages((prev) => ({
      ...prev,
      [fileId]: newAverage,
    }));
  };

  useEffect(() => {
    const fetchMyFiles = async () => {
      try {
        const res = await API.get("/files/my");
        setFiles(res.data.files);
      } catch (err) {
        setError("Failed to load your files");
      } finally {
        setLoading(false);
      }
    };
    fetchMyFiles();
  }, []);

  if (loading) return <p>Loading your files...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="my-files-container" style={{ padding: "20px" }}>
      <h2>My Uploaded Files</h2>

      {/* ⭐ Homepage button */}
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

              <RatingSection
                itemId={file._id}
                userId={file.user?._id}
                showAverageOnly
                liveAverage={fileAverages[file._id]}
                onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)}
              />

              <CommentsSection fileId={file._id} userId={file.user?._id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}