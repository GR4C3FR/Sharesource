import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";
import CommentsSection from "../components/CommentsSection";
import RatingSection from "../components/RatingSection";

export default function Homepage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [fileAverages, setFileAverages] = useState({}); // ⭐ Live average sync per file
  const [description, setDescription] = useState("");
  const [filterSubject, setFilterSubject] = useState(""); // "" = all subjects
  const [sortOption, setSortOption] = useState("newest"); // default newest → oldest


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

      // 🔹 map subject objects into files
      const filesWithSubjects = filesData.map((file) => {
        const subject = subjectsData.find((subj) => subj._id === file.subjectID);
        return { ...file, subjectID: subject || { name: "No subject" } };
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
      setUploadedFiles(Array.isArray(filesRes.data.files) ? filesRes.data.files : []);
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
    try {
      await API.post(
        "/subjects",
        { name: newSubjectName },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      alert("Subject added!");
      setNewSubjectName("");

      const subjectsRes = await API.get("/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(Array.isArray(subjectsRes.data.subjects) ? subjectsRes.data.subjects : []);
    } catch (err) {
      console.error(err);
      alert("Failed to add subject");
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




  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    alert("Logged out");
    navigate("/");
  };

  // Filter & sort files before rendering
  const displayedFiles = uploadedFiles
    .filter(file => !filterSubject || file.subject?.name === subjects.find(s => s._id === filterSubject)?.name)
    .sort((a, b) => {
      if (sortOption === "newest") return new Date(b.uploadDate) - new Date(a.uploadDate);
      if (sortOption === "oldest") return new Date(a.uploadDate) - new Date(b.uploadDate);
      if (sortOption === "ratingDesc") return (fileAverages[b._id] || 0) - (fileAverages[a._id] || 0);
      if (sortOption === "ratingAsc") return (fileAverages[a._id] || 0) - (fileAverages[b._id] || 0);
      return 0;
    });

  return (
    <div style={{ padding: "20px" }}>
      <h2>Homepage</h2>
      <p>Welcome, {email}!</p>

      {profile && (
        <div>
          <p>First Name: {profile.firstName}</p>
          <p>Last Name: {profile.lastName}</p>
          <p>Email: {profile.email}</p>
          <p>Role: {profile.role}</p>
        </div>
      )}

      {/* 🧭 Navigation Buttons */}
      <div style={{ margin: "20px 0" }}>
        <Link to="/my-files">
          <button>View Your Files</button>
        </Link>
      </div>

      <div>
        <Link to="/spaces">
          <button>Go to Collaborative Spaces</button>
        </Link>
      </div>

      {/* =====================
          Upload File Section
      ===================== */}
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

      {/* =====================
          Uploaded Files
      ===================== */}
      <h3>Uploaded Files</h3>
      {/* Filter & Sort */}
      <div style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
        <label>
          Filter by Subject:{" "}
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj._id} value={subj._id}>{subj.name}</option>
            ))}
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

      {uploadedFiles.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        displayedFiles.map((file) => (
          <div
            key={file._id}
            style={{
              border: "1px solid gray",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "5px",
            }}
          >
            <p>
              <strong>Filename:</strong>{" "}
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

            </p>

            <p>Uploaded by: {file.user?.username || "Unknown"}</p>
            <p>Subject: {file.subject?.name || "No subject"}</p>
            <p><strong>Description:</strong> {file.description || "No description"}</p>

      
      {/* 🗑️ Delete button (visible only to owner) */}
      {file.user?._id === profile?._id && (
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

            {/* ⭐ Show Average Rating (auto-updates) */}
            <RatingSection
              itemId={file._id}
              userId={profile?._id}
              showAverageOnly
              liveAverage={fileAverages[file._id]}
            />

            <button onClick={() => toggleComments(file._id)} style={{ marginTop: "8px" }}>
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
                <CommentsSection fileId={file._id} userId={profile?._id} />
                <RatingSection
                  itemId={file._id}
                  userId={profile?._id}
                  allowRating
                  onAverageUpdate={(avg) => handleAverageUpdate(file._id, avg)}
                />
              </div>
            )}
          </div>
        ))
      )}

      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
}
