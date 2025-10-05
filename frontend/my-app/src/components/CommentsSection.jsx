// src/components/CommentsSection.jsx
import { useEffect, useState } from "react";
import API from "../api";

export default function CommentsSection({ fileId, userId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("accessToken");

  const fetchComments = async () => {
    if (!fileId) return;
    try {
      const res = await API.get(`/comments/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data.comments || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fileId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return alert("Comment cannot be empty.");

    try {
      setLoading(true);
      const res = await API.post(
        "/comments",
        { fileId, userId, text: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // add returned comment to top of list
      setComments((prev) => [res.data.comment, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert(err.response?.data?.error || "Failed to post comment.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await API.delete(`/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { userId },
      });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert(err.response?.data?.error || "Failed to delete comment.");
    }
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <h4>💬 Comments</h4>

      <form onSubmit={handleAddComment} style={{ marginBottom: "10px" }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows="2"
          style={{ width: "100%", padding: 8, borderRadius: 4 }}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={{ marginTop: 6 }}>
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div key={comment._id} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
            <div style={{ marginBottom: 6 }}>
              <strong>{comment.userId?.username || comment.userId?.email || "Unknown"}</strong>
              <small style={{ marginLeft: 8, color: "gray" }}>
                {new Date(comment.createdAt).toLocaleString()}
              </small>
            </div>

            <div style={{ marginBottom: 6 }}>{comment.text}</div>

            {comment.userId?._id === userId && (
              <button
                onClick={() => handleDeleteComment(comment._id)}
                style={{ background: "red", color: "white", border: "none", padding: "4px 8px", borderRadius: 4 }}
              >
                Delete
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
