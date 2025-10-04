import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";
import CommentsRatings from "../components/CommentsRatings";

export default function Homepage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [allNotes, setAllNotes] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [newNote, setNewNote] = useState({ title: "", content: "", subjectID: "" });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editValues, setEditValues] = useState({ title: "", content: "", subjectID: "" });
  const [newSubjectName, setNewSubjectName] = useState("");
  const [openComments, setOpenComments] = useState({}); // track which notes' comments are open

  const email = localStorage.getItem("userEmail");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await API.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data.user);

        const notesRes = await API.get("/api/notes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllNotes(Array.isArray(notesRes.data.notes) ? notesRes.data.notes : []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingNoteId) {
      setEditValues({ ...editValues, [name]: value });
    } else if (name === "subjectID") {
      setNewNote({ ...newNote, subjectID: value });
    } else {
      setNewNote({ ...newNote, [name]: value });
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.content || !newNote.subjectID) {
      return alert("Please fill in all required note fields");
    }

    try {
      await API.post("/api/notes", newNote, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      alert("Note created.");
      setNewNote({ title: "", content: "", subjectID: "" });

      const notesRes = await API.get("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllNotes(Array.isArray(notesRes.data.notes) ? notesRes.data.notes : []);
    } catch (err) {
      console.error("Creation error:", err.response?.data || err.message);
      alert("Failed to create note.");
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("ownerUserID", profile?._id);


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
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Failed to upload file.");
    }
  }

  const startEditing = (note) => {
    setEditingNoteId(note._id);
    setEditValues({ title: note.title, content: note.content, subjectID: note.subjectID });
  };

  const saveEditedNote = async () => {
    if (!editValues.title || !editValues.content || !editValues.subjectID) {
      return alert("Please fill in all required note fields");
    }

    try {
      await API.put(`/api/notes/${editingNoteId}`, editValues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Note updated.");

      setAllNotes((prev) =>
        prev.map((note) => (note._id === editingNoteId ? { ...note, ...editValues } : note))
      );
      setEditingNoteId(null);
      setEditValues({ title: "", content: "", subjectID: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to update note.");
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await API.delete(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Note deleted.");
      setAllNotes((prev) => prev.filter((note) => note._id !== noteId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete note.");
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

  const canEditOrDelete = (note) => {
    if (!profile) return false;
    if (profile.role === "Admin") return true;
    return note.ownerUserID?._id === profile._id;
  };

  const toggleComments = (noteId) => {
    setOpenComments((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
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

      <h3>Create a New Note</h3>
      <input
        name="title"
        placeholder="Title"
        value={newNote.title}
        onChange={handleInputChange}
      />
      <textarea
        name="content"
        placeholder="Content"
        value={newNote.content}
        onChange={handleInputChange}
      />

      <div>
        <p>Select Subject:</p>
        {Array.isArray(subjects) && subjects.map((subj) => (
          <label key={subj._id} style={{ marginRight: "10px" }}>
            <input
              type="radio"
              name="subjectID"
              value={subj._id}
              checked={newNote.subjectID === subj._id}
              onChange={handleInputChange}
            />
            {subj.name}
          </label>
        ))}
      </div>

      <button onClick={handleCreateNote}>Create Note</button>

      {profile?.role === "Admin" && (
        <div style={{ marginTop: "20px" }}>
          <h3>Add a New Subject</h3>
          <input
            type="text"
            placeholder="Subject name"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button onClick={handleAddSubject}>Add Subject</button>

          <h4 style={{ marginTop: "20px" }}>All Subjects</h4>
          <ul>
            {Array.isArray(subjects) && subjects.map((subj) => (
              <li key={subj._id} style={{ marginBottom: "5px" }}>
                {subj.name}{" "}
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete subject "${subj.name}"?`)) return;
                    try {
                      await API.delete(`/api/subjects/${subj._id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      alert(`Subject "${subj.name}" deleted!`);
                      setSubjects((prev) => prev.filter((s) => s._id !== subj._id));
                    } catch (err) {
                      console.error(err);
                      alert("Failed to delete subject");
                    }
                  }}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3>Upload a File</h3>
      <form onSubmit={handleFileUpload}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,.txt"
        />
        <button type="submit">Upload</button>
      </form>

      <h3>Uploaded Files</h3>
      {uploadedFiles.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        uploadedFiles.map((file) => (
          <div key={file._id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
            <p>
              <strong>Filename:</strong>{" "}
              <a href={`http://localhost:5000/${file.path}`} target="_blank" rel="noopener noreferrer">
                {file.originalName}
              </a>
            </p>
            <p>Uploaded by: {file.user?.username || "Unknown"}</p>
            <button onClick={() => toggleComments(file._id)}>
              {openComments[file._id] ? "Hide Comments" : "Show Comments"}
            </button>

            {openComments[file._id] && (
              <div style={{ marginTop: "10px", borderTop: "1px dashed gray", paddingTop: "10px" }}>
                <CommentsRatings itemId={file._id} userId={profile?._id || "TEST_USER_ID"} />
              </div>
            )}
          </div>
        ))
      )}


      <h3>All Notes</h3>
      {Array.isArray(allNotes) && allNotes.map((note) => (
        <div key={note._id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
          <Link to={`/notes/${note._id}`}>View Note</Link>
          <h4>{note.title}</h4>
          <p>{note.content}</p>
          <p>Subject: {note.subjectID?.name || "No subject"}</p>
          <p>Owner: {note.ownerUserID?.username || "Unknown"}</p>

          {canEditOrDelete(note) && <button onClick={() => startEditing(note)}>Edit</button>}
          {canEditOrDelete(note) && <button onClick={() => deleteNote(note._id)}>Delete</button>}
          <button onClick={() => toggleComments(note._id)} style={{ marginLeft: "10px" }}>
            {openComments[note._id] ? "Hide Comments" : "Show Comments"}
          </button>

          {/* Inline edit section */}
          {editingNoteId === note._id && (
            <div style={{ marginTop: "10px", padding: "10px", borderTop: "1px dashed gray" }}>
              <input
                name="title"
                placeholder="Title"
                value={editValues.title}
                onChange={handleInputChange}
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <textarea
                name="content"
                placeholder="Content"
                value={editValues.content}
                onChange={handleInputChange}
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <div style={{ textAlign: "right" }}>
                <button onClick={saveEditedNote} style={{ marginRight: "10px" }}>Save</button>
                <button onClick={() => setEditingNoteId(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Comments section */}
          {openComments[note._id] && (
            <div style={{ marginTop: "10px", borderTop: "1px dashed gray", paddingTop: "10px" }}>
              <CommentsRatings itemId={note._id} userId={profile?._id || "TEST_USER_ID"} />
            </div>
          )}
        </div>
      ))}

      <button onClick={handleLogout} style={{ marginTop: "20px"}}>
        Logout
      </button>
    </div>
  );
}
