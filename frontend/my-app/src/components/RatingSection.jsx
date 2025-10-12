import { useState, useEffect } from "react";
import API from "../api";

export default function RatingSection({
  itemId,
  userId,
  showAverageOnly = false,
  allowRating = false,
  onAverageUpdate = () => {},
  liveAverage,
}) {
  const [rating, setRating] = useState(0);
  const [average, setAverage] = useState(liveAverage || 0);
  const [hovered, setHovered] = useState(0);
  const token = localStorage.getItem("accessToken");

  // Fetch average and user rating
  const fetchRatings = async () => {
    try {
      const res = await API.get(`/ratings/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const avg = res.data.average || 0;
      setAverage(avg);
      if (res.data.userRating) setRating(res.data.userRating);

      onAverageUpdate(avg); // 🔥 notify parent immediately
    } catch (err) {
      console.error("❌ Failed to load rating info:", err);
    }
  };

  useEffect(() => {
    if (itemId) fetchRatings();
  }, [itemId]);

  useEffect(() => {
    if (liveAverage !== undefined) setAverage(liveAverage);
  }, [liveAverage]);

  const handleRating = async (value) => {
    if (!allowRating) return;
    try {
      await API.post(
        "/ratings",
        { fileId: itemId, userId, value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(value);
      await fetchRatings(); // 🔁 refresh after rating
    } catch (err) {
      console.error("❌ Failed to submit rating:", err);
      alert("Failed to submit rating");
    }
  };

  if (showAverageOnly) {
    return (
      <div className="w-[9vh] geologica flex justify-between">
       {average.toFixed(1)} / 5 
       <img src="/star-logo.png" className="w-[20px] h-[20px]"/>
      </div>
    );
  } 

  return (
    <div style={{ marginTop: "10px" }}>
      <h4>⭐ Rate this File</h4>
      <div>
        {[1, 2, 3, 4, 5].map((val) => (
          <span
            key={val}
            onClick={() => handleRating(val)}
            onMouseEnter={() => setHovered(val)}
            onMouseLeave={() => setHovered(0)}
            style={{
              fontSize: "22px",
              cursor: "pointer",
              color: val <= (hovered || rating) ? "gold" : "#ccc",
              transition: "color 0.2s ease",
            }}
          >
            ★
          </span>
        ))}
      </div>
      {rating > 0 && (
        <p style={{ marginTop: "5px", color: "gray" }}>
          Your Rating: {rating} / 5
        </p>
      )}
    </div>
  );
}
