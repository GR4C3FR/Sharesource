import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import CommentsRatings from "../components/CommentsRatings";

export default function MyNotes() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null); // store currently editing note id
  const [editValues, setEditValues] = useState({ title: "", content: "" }); // store temporary inputs
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchUserNotes = async () => {
      try {
        const profileRes = await API.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data.user);

        const notesRes = await API.get("/api/notes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const myNotes = notesRes.data.notes.filter(
          (note) => note.ownerUserID?._id === profileRes.data.user._id
        );
        setUserNotes(myNotes);
      } catch (err) {
        alert("Failed to fetch notes. Please login again.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userEmail");
        navigate("/login");
      }
    };

    fetchUserNotes();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const saveEditedNote = async () => {
    if (!editValues.title || !editValues.content) {
      return alert("Please fill in all fields");
    }

    try {
      await API.put(`/api/notes/${editingNoteId}`, editValues, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Note updated.");

      setUserNotes((prev) =>
        prev.map((note) =>
          note._id === editingNoteId ? { ...note, ...editValues } : note
        )
      );
      setEditingNoteId(null);
      setEditValues({ title: "", content: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to update note.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/homepage" style={{ display: "inline-block", marginBottom: "20px" }}>
        ⬅ Back to Homepage
      </Link>
      <h2>My Notes</h2>
      {userNotes.length === 0 && <p>You have no notes yet.</p>}
      {userNotes.map((note) => (
        <div key={note._id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
          <Link to={`/notes/${note._id}`}>View Note</Link>
          <h4>{note.title}</h4>
          <p>{note.content}</p>
          <p>Subject: {note.subjectID?.name || "No subject"}</p>
          <p>Owner: {note.ownerUserID?.username || "Unknown"}</p>

          {canEditOrDelete(note) && (
            <button onClick={() => startEditing(note)}>Edit</button>
          )}
          {canEditOrDelete(note) && (
            <button onClick={() => deleteNote(note._id)}>Delete</button>
          )}

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
