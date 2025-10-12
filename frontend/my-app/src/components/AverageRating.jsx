import { useEffect, useState } from "react";
import API from "../api";

export default function AverageRating({ itemId }) {
  const [average, setAverage] = useState(null);

  useEffect(() => {
    const fetchAverage = async () => {
      try {
        const res = await API.get(`/ratings/${itemId}/average`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setAverage(res.data.averageRating || 0);
      } catch (err) {
        console.error("Failed to load average rating:", err);
      }
    };
    fetchAverage();
  }, [itemId]);

  return (
    <div className="mt-1 text-yellow-500">
      ⭐ Average Rating: {average ? average.toFixed(1) : "N/A"}
    </div>
  );
}
