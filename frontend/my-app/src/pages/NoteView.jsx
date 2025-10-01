import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api";

export default function NoteView() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await API.get(`/api/notes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNote(res.data.note);
      } catch (err) {
        console.error("Error fetching note:", err);
        setError("Failed to load note");
      }
    };
    fetchNote();
  }, [id, token]);

  if (error) return <p>{error}</p>;
  if (!note) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/homepage" style={{ display: "inline-block", marginBottom: "20px" }}>
        ⬅ Back to Homepage
      </Link>

      <h2>{note.title}</h2>
      <p>{note.content}</p>
      <p>
        <strong>Subject:</strong> {note.subjectID?.name || "N/A"}
      </p>
      <p>
        <strong>Owner:</strong> {note.ownerUserID?.username || "Unknown"}
      </p>
    </div>
  );
}
