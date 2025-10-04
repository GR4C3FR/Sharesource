import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";
import CommentsRatings from "../components/CommentsRatings";

export default function Homepage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [openComments, setOpenComments] = useState({});

  const email = localStorage.getItem("userEmail");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await API.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data.user);

        const subjectsRes = await API.get("/api/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(Array.isArray(subjectsRes.data.subjects) ? subjectsRes.data.subjects : []);

        const filesRes = await API.get("/api/files", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUploadedFiles(Array.isArray(filesRes.data.files) ? filesRes.data.files : []);
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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please select a file");
    if (!selectedSubject) return alert("Please select a subject before uploading");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("ownerUserID", profile?._id);
    formData.append("subjectID", selectedSubject);

    try {
      await API.post("/api/files/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("File uploaded successfully!");

      const filesRes = await API.get("/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedFiles(Array.isArray(filesRes.data.files) ? filesRes.data.files : []);
      setSelectedFile(null);
      setSelectedSubject("");
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Failed to upload file.");
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName) return alert("Enter a subject name");

    try {
      await API.post(
        "/api/subjects",
        { name: newSubjectName },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      alert("Subject added!");
      setNewSubjectName("");

      const subjectsRes = await API.get("/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(Array.isArray(subjectsRes.data.subjects) ? subjectsRes.data.subjects : []);
    } catch (err) {
      console.error(err);
      alert("Failed to add subject");
    }
  };

  const toggleComments = (fileId) => {
    setOpenComments((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    alert("Logged out");
    navigate("/login");
  };

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

      <div style={{ margin: "20px 0" }}>
        <Link to="/my-notes">
          <button>View Your Notes</button>
        </Link>
      </div>

      <div>
        <Link to="/spaces">
          <button>Go to Collaborative Spaces</button>
        </Link>
      </div>

      {/* Removed Create Note and All Notes sections */}

      <h3>Upload a File</h3>
      <form onSubmit={handleFileUpload}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,.txt"
        />

        {/* Subject dropdown (required) */}
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

        {/* Add new subject below dropdown */}
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

        <button type="submit" style={{ marginTop: "10px" }}>
          Upload
        </button>
      </form>

      <h3>Uploaded Files</h3>
      {uploadedFiles.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        uploadedFiles.map((file) => (
          <div
            key={file._id}
            style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}
          >
            <p>
              <strong>Filename:</strong>{" "}
              <a
                href={`http://localhost:5000/${file.path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {file.originalName}
              </a>
            </p>
            <p>Uploaded by: {file.user?.username || "Unknown"}</p>
            <p>Subject: {file.subjectID?.name || "No subject"}</p>

            <button onClick={() => toggleComments(file._id)}>
              {openComments[file._id] ? "Hide Comments" : "Show Comments"}
            </button>

            {openComments[file._id] && (
              <div
                style={{
                  marginTop: "10px",
                  borderTop: "1px dashed gray",
                  paddingTop: "10px",
                }}
              >
                <CommentsRatings itemId={file._id} userId={profile?._id || "TEST_USER_ID"} />
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
