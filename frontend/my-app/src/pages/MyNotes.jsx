import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

export default function MyNotes() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editValues, setEditValues] = useState({ title: "", content: "" });

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    subjectID: "",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch profile
        const profileRes = await API.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data.user);

        // fetch notes
        const notesRes = await API.get("/api/notes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myNotes = notesRes.data.notes.filter(
          (note) => note.ownerUserID?._id === profileRes.data.user._id
        );
        setUserNotes(myNotes);

        // fetch subjects
        const subjRes = await API.get("/api/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(subjRes.data.subjects);
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

  const canEditOrDelete = (note) => {
    if (!profile) return false;
    if (profile.role === "Admin") return true;
    return note.ownerUserID?._id === profile._id;
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await API.delete(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Note deleted.");
      setUserNotes((prev) => prev.filter((note) => note._id !== noteId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete note.");
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note._id);
    setEditValues({ title: note.title, content: note.content });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const saveEditedNote = async () => {
    if (!editValues.title || !editValues.content) {
      return alert("Please fill in all fields");
    }

    try {
      const res = await API.put(`/api/notes/${editingNoteId}`, editValues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Note updated.");

      setUserNotes((prev) =>
        prev.map((note) =>
          note._id === editingNoteId ? { ...note, ...res.data.note } : note
        )
      );
      setEditingNoteId(null);
      setEditValues({ title: "", content: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to update note.");
    }
  };

  const handleNewNoteChange = (e) => {
    const { name, value } = e.target;
    setNewNote((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createNote = async () => {
    if (!newNote.title || !newNote.content || !newNote.subjectID) {
      return alert("Please fill in all fields and select a subject");
    }

    try {
      const res = await API.post("/api/notes", newNote, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Note created!");
      setUserNotes((prev) => [res.data.note, ...prev]);
      setNewNote({ title: "", content: "", subjectID: "" });
      setShowCreateForm(false); // close form after create
    } catch (err) {
      console.error(err);
      alert("Failed to create note.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/homepage" style={{ display: "inline-block", marginBottom: "20px" }}>
        ⬅ Back to Homepage
      </Link>
      <h2>My Notes</h2>

      {/* Toggle Create Form */}
      {!showCreateForm ? (
        <button onClick={() => setShowCreateForm(true)} style={{ marginBottom: "20px" }}>
          ➕ Create New Note
        </button>
      ) : (
        <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "20px" }}>
          <h3>Create New Note</h3>
          <input
            name="title"
            placeholder="Title"
            value={newNote.title}
            onChange={handleNewNoteChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <textarea
            name="content"
            placeholder="Content"
            value={newNote.content}
            onChange={handleNewNoteChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <div style={{ marginBottom: "10px" }}>
            <p><strong>Select Subject:</strong></p>
            {subjects.map((subj) => (
              <label key={subj._id} style={{ marginRight: "10px" }}>
                <input
                  type="radio"
                  name="subjectID"
                  value={subj._id}
                  checked={newNote.subjectID === subj._id}
                  onChange={handleNewNoteChange}
                />
                {subj.name}
              </label>
            ))}
          </div>

          <button onClick={createNote} style={{ marginRight: "10px" }}>Create Note</button>
          <button onClick={() => setShowCreateForm(false)}>Cancel</button>
        </div>
      )}

      {/* Notes List */}
      {userNotes.length === 0 && <p>You have no notes yet.</p>}
      {userNotes.map((note) => (
        <div
          key={note._id}
          style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}
        >
          <Link to={`/notes/${note._id}`}>View Note</Link>
          <h4>{note.title}</h4>
          <p>{note.content}</p>
          <p>Subject: {note.subjectID?.name || "No subject"}</p>
          <p>Owner: {note.ownerUserID?.username || "Unknown"}</p>

          {canEditOrDelete(note) && (
            <>
              <button onClick={() => startEditing(note)}>Edit</button>
              <button onClick={() => deleteNote(note._id)}>Delete</button>
            </>
          )}

          {editingNoteId === note._id && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                borderTop: "1px dashed gray",
              }}
            >
              <input
                name="title"
                placeholder="Title"
                value={editValues.title}
                onChange={handleEditChange}
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <textarea
                name="content"
                placeholder="Content"
                value={editValues.content}
                onChange={handleEditChange}
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <div style={{ textAlign: "right" }}>
                <button onClick={saveEditedNote} style={{ marginRight: "10px" }}>
                  Save
                </button>
                <button onClick={() => setEditingNoteId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
