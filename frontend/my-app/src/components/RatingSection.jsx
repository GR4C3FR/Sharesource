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
      <div className="flex items-center gap-2 geologica text-sm">
        <span className="font-medium">{average.toFixed(1)} / 5</span>
        <img src="/star-logo.png" className="w-5 h-5" alt="star" />
      </div>
    );
  } 

  return (
    <div className="mt-2">
      <h4 className="mb-1">⭐ Rate this File</h4>
      <div className="flex gap-1 items-center text-2xl">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            onClick={() => handleRating(val)}
            onMouseEnter={() => setHovered(val)}
            onMouseLeave={() => setHovered(0)}
            className={`transition-colors duration-150 ${val <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            aria-label={`Rate ${val}`}
          >
            ★
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="mt-1 text-sm text-gray-600">Your Rating: {rating} / 5</p>
      )}
    </div>
  );
}
