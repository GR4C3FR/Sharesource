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
    <div className="p-5 w-full max-w-4xl mx-auto">
      <Link to="/homepage" className="inline-block mb-4 text-sm text-[#103E93]">
        ⬅ Back to Homepage
      </Link>
      <h2 className="text-2xl font-semibold mb-4">My Notes</h2>

      {/* Toggle Create Form */}
      {!showCreateForm ? (
        <button onClick={() => setShowCreateForm(true)} className="mb-4 px-3 py-2 bg-[#1D2F58] text-white rounded-md">➕ Create New Note</button>
      ) : (
        <div className="border p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-3">Create New Note</h3>
          <input
            name="title"
            placeholder="Title"
            value={newNote.title}
            onChange={handleNewNoteChange}
            className="w-full mb-3 p-2 border rounded-md"
          />
          <textarea
            name="content"
            placeholder="Content"
            value={newNote.content}
            onChange={handleNewNoteChange}
            className="w-full mb-3 p-2 border rounded-md"
          />

          <div className="mb-3">
            <p className="font-medium mb-2">Select Subject:</p>
            <div className="flex flex-wrap gap-3">
              {subjects.map((subj) => (
                <label key={subj._id} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="subjectID"
                    value={subj._id}
                    checked={newNote.subjectID === subj._id}
                    onChange={handleNewNoteChange}
                    className="form-radio"
                  />
                  <span>{subj.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={createNote} className="px-3 py-2 bg-[#1D2F58] text-white rounded-md mr-2">Create Note</button>
            <button onClick={() => setShowCreateForm(false)} className="px-3 py-2 border rounded-md">Cancel</button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {userNotes.length === 0 && <p>You have no notes yet.</p>}
      {userNotes.map((note) => (
        <div key={note._id} className="border p-3 rounded-md mb-3">
          <Link to={`/notes/${note._id}`} className="text-sm text-blue-600 underline">View Note</Link>
          <h4 className="text-lg font-semibold mt-2">{note.title}</h4>
          <p className="mt-2">{note.content}</p>
          <p className="text-sm text-gray-600 mt-2">Subject: {note.subjectID?.name || "n/a"}</p>
          <p className="text-sm text-gray-600">Owner: {note.ownerUserID?.username || "Unknown"}</p>

          {canEditOrDelete(note) && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => startEditing(note)} className="px-3 py-1 border rounded-md">Edit</button>
              <button onClick={() => deleteNote(note._id)} className="px-3 py-1 border rounded-md text-red-600">Delete</button>
            </div>
          )}

          {editingNoteId === note._id && (
            <div className="mt-3 pt-3 border-t border-dashed">
              <input
                name="title"
                placeholder="Title"
                value={editValues.title}
                onChange={handleEditChange}
                className="w-full mb-3 p-2 border rounded-md"
              />
              <textarea
                name="content"
                placeholder="Content"
                value={editValues.content}
                onChange={handleEditChange}
                className="w-full mb-3 p-2 border rounded-md"
              />
              <div className="flex justify-end">
                <button onClick={saveEditedNote} className="px-3 py-2 bg-[#1D2F58] text-white rounded-md mr-2">Save</button>
                <button onClick={() => setEditingNoteId(null)} className="px-3 py-2 border rounded-md">Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
