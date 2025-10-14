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
    <div className="mt-3 space-y-4 mb-4">
      <form onSubmit={handleAddComment} className="mb-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows="2"
          className="w-full p-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#103E93] resize-none"
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="px-3 py-1 -mt-1 rounded-md bg-[#1D2F58] text-[14px] text-white hover:bg-[#16325a] focus:outline-none focus:ring-2 focus:ring-[#103E93] cursor-pointer">{loading ? "Posting..." : "Post Comment"}</button>
      </form>

      <h4 className="mb-2 mt-4 text-sm font-medium text-[#1D2F58]">Comments</h4>
      {comments.length === 0 ? (
        <p className="text-sm text-[#1D2F58]">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div key={comment._id} className="bg-white border rounded-md p-3 mb-2 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <strong className="text-sm text-[#1D2F58]">{comment.userId?.username || comment.userId?.email || "Unknown"}</strong>
                <small className="ml-2 text-xs text-[#1D2F58]">{new Date(comment.createdAt).toLocaleString()}</small>
              </div>
              {comment.userId?._id === userId && (
                <button onClick={() => handleDeleteComment(comment._id)} className="px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-xs cursor-pointer">Delete</button>
              )}
            </div>

            <div className="mb-1 text-sm text-[#1D2F58]">{comment.text}</div>
          </div>
        ))
      )}
    </div>
  );
}
