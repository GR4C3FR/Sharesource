import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("Student"); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/users/signup", {
        username,
        // password,
        passwordHash: password,
        email,
        firstName,
        lastName,
        role: "Student"  
      });
      alert("Signup successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <button onClick={() => (window.location.href = "/")}>root</button>
      <button onClick={() => (window.location.href = "/login")}>Login</button>
      <form onSubmit={handleSubmit}>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        
        <input type="hidden" value="Student" />
        {/* <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="Student">Student</option>
          <option value="Admin">Admin</option>
        </select> */}

        <button type="submit">Signup</button>
      </form>
    </div>
  );
}
