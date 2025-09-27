import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";
import CommentsRatings from "../components/CommentsRatings";

export default function Homepage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [allNotes, setAllNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newNote, setNewNote] = useState({ title: "", content: "", subjectID: "" });
  const [editingNote, setEditingNote] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState("");

  const email = localStorage.getItem("userEmail");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileRes = await API.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data.user);

        // Fetch all notes (backend handles filtering by role)
        const notesRes = await API.get("/api/notes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllNotes(notesRes.data.notes);

        // Fetch subjects
        const subjectsRes = await API.get("/api/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(subjectsRes.data.subjects);
      } catch (err) {
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
    if (editingNote) {
      setEditingNote({ ...editingNote, [name]: value });
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
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      alert("Note created.");
      setNewNote({ title: "", content: "", subjectID: "" });

      const notesRes = await API.get("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllNotes(notesRes.data.notes);
    } catch (err) {
      console.error("Creation error:", err.response?.data || err.message);
      alert("Failed to create note.");
    }
  };

  const startEditing = (note) => setEditingNote(note);

  const saveEditedNote = async () => {
    if (!editingNote.title || !editingNote.content || !editingNote.subjectID) {
      return alert("Please fill in all required note fields");
    }

    try {
      await API.put(`/api/notes/${editingNote._id}`, editingNote, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      alert("Note updated.");
      setEditingNote(null);

      const notesRes = await API.get("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllNotes(notesRes.data.notes);
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

      const notesRes = await API.get("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllNotes(notesRes.data.notes);
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
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      alert("Subject added!");
      setNewSubjectName("");

      const subjectsRes = await API.get("/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjectsRes.data.subjects);
    } catch (err) {
      console.error(err);
      alert("Failed to add subject");
    }
  };

  const canEditOrDelete = (note) => {
    if (!profile) return false;
    if (profile.role === "Admin") return true;
    return note.ownerUserID._id === profile._id;
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

      <h3>{editingNote ? "Edit Note" : "Create a New Note"}</h3>
      <input
        name="title"
        placeholder="Title"
        value={editingNote ? editingNote.title : newNote.title}
        onChange={handleInputChange}
      />
      <textarea
        name="content"
        placeholder="Content"
        value={editingNote ? editingNote.content : newNote.content}
        onChange={handleInputChange}
      />

      <div>
        <p>Select Subject:</p>
        {subjects.map((subj) => (
          <label key={subj._id} style={{ marginRight: "10px" }}>
            <input
              type="radio"
              name="subjectID"
              value={subj._id}
              checked={(editingNote ? editingNote.subjectID : newNote.subjectID) === subj._id}
              onChange={handleInputChange}
            />
            {subj.name}
          </label>
        ))}
      </div>

      {editingNote ? (
        <>
          <button onClick={saveEditedNote}>Save Edit</button>
          <button onClick={() => setEditingNote(null)}>Cancel</button>
        </>
      ) : (
        <button onClick={handleCreateNote}>Create Note</button>
      )}

      {/* Admin-only: add new subject */}
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
        </div>
      )}

      <h3>All Notes</h3>
      {allNotes.map((note) => (
        <div key={note._id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
          <h4>{note.title}</h4>
          <p>{note.content}</p>
          <p>Subject: {subjects.find((s) => s._id === note.subjectID)?.name || note.subjectID}</p>
          <p>Owner: {note.ownerUserID.username}</p>

          {canEditOrDelete(note) && (
            <>
              <button onClick={() => startEditing(note)}>Edit</button>
              <button onClick={() => deleteNote(note._id)}>Delete</button>
            </>
          )}

          {/* ===== Temporary Comments & Ratings Component ===== */}
          <div style={{ marginTop: "10px", borderTop: "1px dashed gray", paddingTop: "10px" }}>
            <CommentsRatings noteId={note._id} userId={profile?._id || "TEST_USER_ID"} />
          </div>
        </div>
      ))}

      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
}