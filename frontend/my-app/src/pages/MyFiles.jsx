import { useEffect, useState } from "react";
import API from "../api";

export default function MyFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      {files.length === 0 ? (
        <p>You haven’t uploaded any files yet.</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file._id}>
              <a
                href={`http://localhost:5000/uploads/${file.filename}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {file.originalName}
              </a>
              <p>Subject: {file.subject?.name || "No subject"}</p>
              <p>Uploaded on: {new Date(file.uploadDate).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}