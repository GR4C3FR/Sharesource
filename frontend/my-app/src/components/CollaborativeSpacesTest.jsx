import { useEffect, useState } from "react";
import { createSpace, getAllSpaces, joinSpace } from "../services/collaborativeSpaceService";

export default function CollaborativeSpacesTest() {
  const [spaceName, setSpaceName] = useState("");
  const [description, setDescription] = useState("");
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchSpaces();
  }, []);

  // Create a new space
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSpace(spaceName, description);
      alert("✅ Space created!");
      setSpaceName("");
      setDescription("");
      await fetchSpaces(); // refresh the list
    } catch (err) {
      console.error("❌ Failed to create space:", err);
      alert(err.response?.data?.message || "Failed to create space");
    }
  };

  // Join a space
  const handleJoin = async (spaceId) => {
    try {
      await joinSpace(spaceId);
      alert("✅ Joined space successfully!");
      await fetchSpaces(); // refresh the list
    } catch (err) {
      console.error("❌ Failed to join space:", err);
      alert(err.response?.data?.message || "Failed to join space");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Create Space Form */}
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

      {/* List of Available Spaces */}
      <h2>Available Spaces</h2>
      {loading ? (
        <p>Loading spaces...</p>
      ) : spaces.length === 0 ? (
        <p>No spaces available yet.</p>
      ) : (
        <ul>
          {spaces.map((space) => {
            // Check if the current user is already a member
            const joined = space.members.some(
              (m) => m.userId === localStorage.getItem("userId")
            );

            return (
              <li key={space._id} style={{ marginBottom: "8px" }}>
                <strong>{space.spaceName}</strong> – {space.description}{" "}
                {joined ? (
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    Joined
                  </span>
                ) : (
                  <button
                    onClick={() => handleJoin(space._id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Join
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
