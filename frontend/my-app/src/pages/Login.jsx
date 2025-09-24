import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/api/users/login", { email, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("userEmail", email);
      alert("Login successful!");
      navigate("/homepage");
    } catch (err) {
      alert(err.response?.data?.error || "Invalid email or password");
    }
  };

  return (
    <div>
      <h2>Login</h2>
        <button
        onClick={() => (window.location.href = "/")}
        >
        root
        </button>
        <button
        onClick={() => (window.location.href = "/signup")}
        >
        Signup
        </button>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
