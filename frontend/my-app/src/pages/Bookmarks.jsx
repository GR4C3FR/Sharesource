import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const token = localStorage.getItem("accessToken");

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

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Bookmarked Files</h2>
      <button onClick={() => navigate("/")} style={{ marginBottom: "20px" }}>Back to Homepage</button>
      {bookmarks.filter(file => file && file._id).length === 0 ? (
        <p>No bookmarks yet.</p>
      ) : (
        <ul>
          {bookmarks.filter(file => file && file._id).map(file => (
            <li key={file._id} style={{ marginBottom: "15px" }}>
              <a href={`http://localhost:5000/uploads/${file.filename}`} target="_blank" rel="noopener noreferrer">
                {file.originalName}
              </a>
              <button onClick={() => downloadFile(file.filename)} style={{ marginLeft: "10px" }}>Download</button>
              <p>Subject: {file.subject?.name || "No subject"}</p>
              <p>Uploaded by: {file.uploaderName || file.user?.username || "Unknown"}</p>
              <p><strong>Description:</strong> {file.description || "No description"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
