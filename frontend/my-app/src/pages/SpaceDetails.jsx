import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

export default function SpaceDetails() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // Fetch space by ID
  const fetchSpace = async () => {
    try {
      const res = await API.get(`/collaborative-spaces/${spaceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      const data = res.data;
      // Ensure members and sharedNotesIds are arrays to prevent .map errors
      data.members = data.members || [];
      data.sharedNotesIds = data.sharedNotesIds || [];

      setSpace(data);
      setTitle(data.spaceName || "");
      setDesc(data.description || "");
    } catch (err) {
      console.error("❌ Failed to fetch space:", err);
      alert("Failed to load space details");
    }
  };

  useEffect(() => {
    fetchSpace();
  }, [spaceId]);

  // Save updates
  const saveEdit = async () => {
    try {
      await API.put(
        `/collaborative-spaces/${spaceId}`,
        { spaceName: title, description: desc },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setEditMode(false);
      fetchSpace(); // refresh
    } catch (err) {
      console.error("❌ Failed to update space:", err);
      alert("Failed to update space");
    }
  };

  if (!space) return <p>Loading space...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate("/spaces")}>⬅ Back to Spaces</button>

      {editMode ? (
        <div style={{ marginTop: "20px" }}>
          <h2>Edit Space</h2>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%" }}
          />
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%" }}
          />
          <button onClick={saveEdit} style={{ marginRight: "10px" }}>Save</button>
          <button onClick={() => setEditMode(false)}>Cancel</button>
        </div>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <h2>{space.spaceName}</h2>
          <p>{space.description}</p>
          <button onClick={() => setEditMode(true)}>Edit</button>
        </div>
      )}

      {/* Members */}
      <h3 style={{ marginTop: "20px" }}>Members ({space.members?.length || 0})</h3>
      <ul>
        {space.members?.length > 0
          ? space.members.map((m) => (
              <li key={m.userId?._id || m.userId}>
                {m.userId?.username || m.userId?.email || "Unknown User"} ({m.role})
              </li>
            ))
          : <li>No members yet</li>}
      </ul>

      {/* Shared Notes */}
      <h3>Shared Notes</h3>
      <ul>
        {space.sharedNotesIds?.length > 0
          ? space.sharedNotesIds.map((note) => (
              <li key={note._id}>
                <strong>{note.title}</strong> – {note.content}
                <br />
                <em>Subject: {note.subjectID}</em>
              </li>
            ))
          : <li>No notes shared yet.</li>}
      </ul>
    </div>
  );
}
