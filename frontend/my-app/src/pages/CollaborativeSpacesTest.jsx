import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  createSpace,
  getAllSpaces,
  joinSpace,
  getUserSpaces,
  leaveSpace,
} from "../services/collaborativeSpaceService";
import API from "../api";
import AppShell from "../components/AppShell";

export default function CollaborativeSpaces() {
  const [spaceName, setSpaceName] = useState("");
  const [description, setDescription] = useState("");
  const [spaces, setSpaces] = useState([]);
  const [mySpaces, setMySpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [expandedMembers, setExpandedMembers] = useState({});
  const navigate = useNavigate();
  const [searchMySpaces, setSearchMySpaces] = useState("");
  const [searchAvailableSpaces, setSearchAvailableSpaces] = useState("");

  // Fetch all available spaces
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

  // Fetch spaces current user belongs to
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

  const displayedAvailableSpaces = useMemo(() => {
    const q = (searchAvailableSpaces || "").trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter((space) => {
      const title = (space.spaceName || "").toLowerCase();
      const owner = (space.ownerUserId?.username || space.ownerUserId?.email || "").toLowerCase();
      const members = ((space.members || []).map(m => (m.userId?.username || m.userId?.email || "").toLowerCase()).join(" "));
      if (title.includes(q) || owner.includes(q) || members.includes(q)) return true;
      return false;
    });
  }, [spaces, searchAvailableSpaces]);

  const displayedMySpaces = useMemo(() => {
    const q = (searchMySpaces || "").trim().toLowerCase();
    if (!q) return mySpaces;
    return mySpaces.filter((space) => {
      const title = (space.spaceName || "").toLowerCase();
      const owner = (space.ownerUserId?.username || space.ownerUserId?.email || "").toLowerCase();
      const members = ((space.members || []).map(m => (m.userId?.username || m.userId?.email || "").toLowerCase()).join(" "));
      if (title.includes(q) || owner.includes(q) || members.includes(q)) return true;
      return false;
    });
  }, [mySpaces, searchMySpaces]);

  // Create a new space
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

  // Join a space
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

  // Leave a space
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

  // Open modal for editing
  const startEdit = (space) => {
    setEditingSpace(space);
    setEditName(space.spaceName);
    setEditDesc(space.description);
  };

  // Save edited space
  const saveEdit = async () => {
    try {
      await API.put(
        `/collaborative-spaces/${editingSpace._id}`,
        { spaceName: editName, description: editDesc },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setEditingSpace(null);
      await fetchMySpaces();
    } catch (err) {
      console.error("❌ Failed to update space:", err);
      alert(err.response?.data?.message || "Failed to update space");
    }
  };

  // Toggle member dropdown
  const toggleMembers = (spaceId) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5">
        <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search My Spaces by title, owner or members..."
              value={searchMySpaces}
              onChange={(e) => setSearchMySpaces(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300"
            />
          </div>
        <button onClick={() => navigate("/homepage")}>🏠 Home</button>

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

      <h2>My Spaces</h2>
      {mySpaces.length === 0 ? (
        <p>You are not a member of any spaces yet.</p>
      ) : (
        displayedMySpaces.map((space) => (
          <div key={space._id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
            <button onClick={() => navigate(`/spaces/${space._id}`)} style={{ marginLeft: "10px" }}>
              View Space
            </button>
            <h3>
              Title: {space.spaceName}{" "}
              <button onClick={() => startEdit(space)}>Edit</button>
              <button onClick={() => handleLeave(space._id)} style={{ marginLeft: "10px", color: "red" }}>
                Leave
              </button>
            </h3>
            <p>Description: {space.description}</p>
            <p>
              <strong>Owner:</strong>{" "}
              {space.ownerUserId?.username || space.ownerUserId?.email || "Unknown"} <br />
              <strong>Members:</strong> {(space.members || []).length}
              <button onClick={() => toggleMembers(space._id)} style={{ marginLeft: "10px" }}>
                {expandedMembers[space._id] ? "Hide Members" : "Show Members"}
              </button>
            </p>

            {expandedMembers[space._id] && (
              <ul>
                {(space.members || []).map((m) => {
                  const user = m.userId;
                  const displayName =
                    (user && (user.username || user.email)) ||
                    (typeof user === "string" ? `UserId:${user}` : "Unknown User");
                  return <li key={user?._id || user}>{displayName} ({m.role})</li>;
                })}
              </ul>
            )}

            <h4>Shared Notes:</h4>
            {(space.sharedNotesIds || []).length === 0 ? (
              <p>No notes shared in this space.</p>
            ) : (
              <ul>
                {(space.sharedNotesIds || []).map((note) => (
                  <li key={note._id}>
                    <strong>{note.title}</strong> – {note.content}
                    <br />
                    <em>Subject: {note.subjectID}</em>
                  </li>
                ))}
              </ul>
            )}

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

      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search Available Spaces by title, owner or members..."
          value={searchAvailableSpaces}
          onChange={(e) => setSearchAvailableSpaces(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300"
        />
      </div>
      <h2>Available Spaces</h2>
      {loading ? (
        <p>Loading spaces...</p>
      ) : spaces.length === 0 ? (
        <p>No spaces available yet.</p>
      ) : (
        <ul>
          {displayedAvailableSpaces.map((space) => {
            const joined = mySpaces.some((s) => s._id === space._id);
            return (
              <li key={space._id} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}>
                <strong>{space.spaceName}</strong> – {space.description}
                <br />
                Members: {(space.members || []).length}
                <br />
                Owner: {space.ownerUserId?.username || space.ownerUserId?.email || "Unknown"}

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
                    {(space.members || []).map((m) => (
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
    </AppShell>
  );
}
