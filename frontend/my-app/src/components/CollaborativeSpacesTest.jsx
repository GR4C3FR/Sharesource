// components/CollaborativeSpacesTest.jsx
import { useEffect, useState } from "react";
import { createSpace, getAllSpaces, joinSpace, getUserSpaces, leaveSpace, shareFile } from "../services/collaborativeSpaceService";

export default function CollaborativeSpacesTest() {
  const [spaceName, setSpaceName] = useState("");
  const [description, setDescription] = useState("");
  const [spaces, setSpaces] = useState([]);
  const [mySpaces, setMySpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [expandedMembers, setExpandedMembers] = useState({});

  // Fetch all spaces
  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const data = await getAllSpaces();
      setSpaces(data);
    } catch (err) {
      console.error("❌ Failed to load spaces:", err);
      alert(err.response?.data?.message || "Failed to fetch spaces");
    } finally {
      setLoading(false);
    }
  };

  // Fetch my spaces
  const fetchMySpaces = async () => {
    try {
      const data = await getUserSpaces();
      setMySpaces(data);
    } catch (err) {
      console.error("❌ Failed to load my spaces:", err);
      alert(err.response?.data?.message || "Failed to fetch my spaces");
    }
  };

  useEffect(() => {
    fetchSpaces();
    fetchMySpaces();
  }, []);

  // Create space
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSpace(spaceName, description);
      setSpaceName("");
      setDescription("");
      await fetchSpaces();
      await fetchMySpaces();
    } catch (err) {
      console.error("❌ Failed to create space:", err);
      alert(err.response?.data?.message || "Failed to create space");
    }
  };

  // Join space
  const handleJoin = async (spaceId) => {
    try {
      await joinSpace(spaceId);
      await fetchSpaces();
      await fetchMySpaces();
    } catch (err) {
      console.error("❌ Failed to join space:", err);
      alert(err.response?.data?.message || "Failed to join space");
    }
  };

  // Leave space
  const handleLeave = async (spaceId) => {
    if (!window.confirm("Are you sure you want to leave this space?")) return;
    try {
      await leaveSpace(spaceId);
      await fetchSpaces();
      await fetchMySpaces();
    } catch (err) {
      console.error("❌ Failed to leave space:", err);
      alert(err.response?.data?.message || "Failed to leave space");
    }
  };

  // Edit space
  const startEdit = (space) => {
    setEditingSpace(space);
    setEditName(space.spaceName);
    setEditDesc(space.description);
  };

  const saveEdit = async () => {
    try {
      await fetch(`/api/collaborative-spaces/${editingSpace._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ spaceName: editName, description: editDesc }),
      });
      setEditingSpace(null);
      await fetchMySpaces();
      await fetchSpaces();
    } catch (err) {
      console.error("❌ Failed to update space:", err);
      alert(err.response?.data?.message || "Failed to update space");
    }
  };

  // Toggle members list
  const toggleMembers = (spaceId) => {
    setExpandedMembers((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }));
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Create Space */}
      <h2>Create a Collaborative Space</h2>
      <form onSubmit={handleCreate} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Space name"
          value={spaceName}
          onChange={(e) => setSpaceName(e.target.value)}
          required
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button type="submit">Create</button>
      </form>

      {/* My Spaces */}
      <h2>My Spaces</h2>
      {mySpaces.length === 0 ? (
        <p>You are not a member of any spaces yet.</p>
      ) : (
        mySpaces.map((space) => (
          <div key={space._id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
            <h3>
              {space.spaceName}{" "}
              <button onClick={() => startEdit(space)}>Edit</button>
              <button onClick={() => handleLeave(space._id)} style={{ marginLeft: "10px", color: "red" }}>
                Leave
              </button>
            </h3>
            <p>Description: {space.description}</p>
            <p>
              <strong>Owner:</strong> {space.ownerUserId?.username || space.ownerUserId?.email || "Unknown"}
              <br />
              <strong>Members:</strong> {space.members?.length || 0}
              <button onClick={() => toggleMembers(space._id)} style={{ marginLeft: "10px" }}>
                {expandedMembers[space._id] ? "Hide Members" : "Show Members"}
              </button>
            </p>
            {expandedMembers[space._id] && (
              <ul>
                {space.members?.map((m) => (
                  <li key={m.userId?._id || m.userId}>
                    {m.userId?.username || m.userId?.email || "Unknown User"} ({m.role})
                  </li>
                ))}
              </ul>
            )}

            {/* Shared Files */}
            <h4>Shared Files:</h4>
            {space.sharedFilesIds?.length === 0 ? (
              <p>No files shared in this space.</p>
            ) : (
              <ul>
                {space.sharedFilesIds.map((file) => (
                  <li key={file._id}>
                    <strong>{file.title}</strong> – <a href={file.link} target="_blank">{file.link}</a>
                  </li>
                ))}
              </ul>
            )}

            {/* Inline modal for editing */}
            {editingSpace?._id === space._id && (
              <div style={{ marginTop: "10px", padding: "10px", border: "1px solid gray", background: "#f9f9f9" }}>
                <h4>Edit Space</h4>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ display: "block", marginBottom: "10px", width: "100%" }}
                />
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ display: "block", marginBottom: "10px", width: "100%" }}
                />
                <button onClick={saveEdit} style={{ marginRight: "10px" }}>Save</button>
                <button onClick={() => setEditingSpace(null)}>Cancel</button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Available Spaces */}
      <h2>Available Spaces</h2>
      {loading ? (
        <p>Loading spaces...</p>
      ) : spaces.length === 0 ? (
        <p>No spaces available yet.</p>
      ) : (
        <ul>
          {spaces.map((space) => {
            const joined = mySpaces.some((s) => s._id === space._id);
            return (
              <li key={space._id} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}>
                <strong>{space.spaceName}</strong> – {space.description}
                <br />
                Owner: {space.ownerUserId?.username || space.ownerUserId?.email || "Unknown"}
                <br />
                Members: {space.members?.length || 0}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <button onClick={() => toggleMembers(space._id)}>
                    {expandedMembers[space._id] ? "Hide Members" : "Show Members"}
                  </button>
                  {joined ? (
                    <span style={{ color: "green", fontWeight: "bold", alignSelf: "center" }}>Joined</span>
                  ) : (
                    <button onClick={() => handleJoin(space._id)}>Join</button>
                  )}
                </div>
                {expandedMembers[space._id] && (
                  <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                    {space.members?.map((m) => (
                      <li key={m.userId?._id || m.userId}>
                        {m.userId?.username || m.userId?.email || "Unknown User"} ({m.role})
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
