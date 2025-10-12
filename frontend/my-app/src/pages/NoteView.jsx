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
    <div className="p-5 w-full max-w-3xl mx-auto">
      <Link to="/homepage" className="inline-block mb-4 text-sm text-[#103E93]">
        ⬅ Back to Homepage
      </Link>

      <h2 className="text-2xl font-semibold">{note.title}</h2>
      <p className="mt-3">{note.content}</p>
      <p className="mt-3"><strong>Subject:</strong> {note.subjectID?.name || "N/A"}</p>
      <p><strong>Owner:</strong> {note.ownerUserID?.username || "Unknown"}</p>
    </div>
  );
}
