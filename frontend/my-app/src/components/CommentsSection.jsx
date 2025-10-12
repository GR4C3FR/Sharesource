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
    <div className="mt-3">
      <h4 className="mb-2">💬 Comments</h4>

      <form onSubmit={handleAddComment} className="mb-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows="2"
          className="w-full p-2 rounded-md border"
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="mt-2 px-3 py-1 rounded-md bg-[#1D2F58] text-white">{loading ? "Posting..." : "Post Comment"}</button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-600">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div key={comment._id} className="border p-2 mb-2 rounded-md">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <strong>{comment.userId?.username || comment.userId?.email || "Unknown"}</strong>
                <small className="ml-2 text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</small>
              </div>
              {comment.userId?._id === userId && (
                <button onClick={() => handleDeleteComment(comment._id)} className="px-2 py-0.5 rounded-md bg-red-600 text-white text-xs">Delete</button>
              )}
            </div>

            <div className="mb-1">{comment.text}</div>
          </div>
        ))
      )}
    </div>
  );
}
