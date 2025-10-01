import { useState, useEffect } from "react";
import axios from "axios";

const CommentsRatings = ({ noteId, userId }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [ratingValue, setRatingValue] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/comments/${noteId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch rating
  const fetchRating = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/ratings/${noteId}`);
      setAvgRating(res.data.average);
      setTotalRatings(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchRating();
  }, []);

  // Post a comment
  const postComment = async () => {
    if (!commentText) return;
    try {
      await axios.post("http://localhost:5000/api/comments", {
        noteId,
        userId,
        text: commentText,
        parentCommentId: null,
      });
      setCommentText("");
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 Delete a comment (only if user owns it)
  const deleteComment = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/comments/${id}`, {
        data: { userId }  
      });
      fetchComments(); 
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
    }
  };


  // Submit rating
  const submitRating = async (value) => {
    try {
      await axios.post("http://localhost:5000/api/ratings", {
        noteId,
        userId,
        value,
      });
      setRatingValue(value);
      fetchRating();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Comments</h2>
      <textarea
        rows="3"
        placeholder="Write a comment..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
      ></textarea>
      <br />
      <button onClick={postComment}>Post Comment</button>

      <ul>
        {comments.map((c) => (
          <li key={c._id}>
            <b>{c.userId.username || "User"}</b>: {c.text}
            {/* 🔥 Show delete button only if current user is the owner */}
            {c.userId._id === userId && (
              <button
                onClick={() => deleteComment(c._id)}
                style={{ marginLeft: "10px", color: "red" }}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2>Rating</h2>
      <div>
        Average Rating: {avgRating.toFixed(1)} ({totalRatings} ratings)
      </div>
      <div>
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => submitRating(v)}
            style={{ color: v <= ratingValue ? "gold" : "gray", fontSize: "20px" }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommentsRatings;
