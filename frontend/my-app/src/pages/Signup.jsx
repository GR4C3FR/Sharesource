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
      await API.post("/users/signup", {
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
      alert(err.response?.data?.message || err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center overflow-auto py-0 px-4 mb-10">

  <div className="w-full max-w-screen-xl flex flex-col sm:flex-row justify-center sm:justify-between items-center space-y-6 sm:space-y-0 py-6 mb-6 px-4 mx-auto relative z-50">
        {/* Logo Section (match landing mobile sizes/stacking) */}
        <section className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4 relative z-50">
          <a href="/" aria-label="ShareSource Home" onClick={(e) => { if (localStorage.getItem('accessToken')) { e.preventDefault(); window.location.href = '/homepage'; } }} className="p-0 bg-transparent border-0 cursor-pointer">
            <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[60px] sm:w-[90px] h-auto" />
          </a>
          <a href="/" aria-label="ShareSource Landing" className="p-0 bg-transparent border-0 cursor-pointer -mt-2 sm:mt-0">
            <img src="/sharessource-text.png" alt="ShareSource Text" className="w-[120px] sm:w-[180px] h-auto"/>
          </a>
        </section>

        <section>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            className="hidden sm:block"
            style={{
              background: 'url("/close-btn.png") no-repeat center center',
              backgroundSize: "contain",
              border: "none",
              width: "40px",  
              height: "40px",
              cursor: "pointer",
              padding: 0,
            }}
          />
        </section>
      </div>

  <main className="flex-1 w-full max-w-screen-xl mx-auto flex items-center justify-center px-4">
  <div className="w-full max-w-xl flex flex-col my-0 sm:mt-0">
        <section className="mb-6 w-full px-4 sm:px-0">
                <h1 className="inter-text font-normal text-2xl sm:text-[36px] leading-tight mb-3 text-[#1D2F58]">Sign Up</h1>
                <p className="inter-text font-normal text-sm sm:text-[16px] leading-[16px] text-[#1D2F58]">Ready to collaborate? Let’s get you started.</p>
              </section>

        <section className="flex bg-[#1D2F58] rounded-[8px] shadow-[0_0_10px_rgba(0,0,0,0.15)] p-4 sm:p-6 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-center w-full gap-4 sm:gap-5"
          >
            {/* Username */}
      <section className="flex flex-col w-full">
        <label htmlFor="username" className="mb-2 text-sm sm:text-md font-medium text-left sm:text-left text-[#FFFFFF] bg-transparent">Username</label>
        <input
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
          className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 sm:p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* Password */}
            <section className="flex flex-col w-full">
              <label htmlFor="password" className="mb-2 text-md font-medium text-[#FFFFFF]">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 sm:p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* Email */}
            <section className="flex flex-col w-full">
              <label htmlFor="email" className="mb-2 text-sm sm:text-md font-medium text-left text-[#FFFFFF]">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 sm:p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* First Name */}
            <section className="flex flex-col w-full">
              <label htmlFor="firstName" className="mb-2 text-sm sm:text-md font-medium text-left text-[#FFFFFF]">First Name</label>
              <input
                id="firstName"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 sm:p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* Last Name */}
            <section className="flex flex-col w-full">
              <label htmlFor="lastName" className="mb-2 text-sm sm:text-md font-medium text-left text-[#FFFFFF]">Last Name</label>
              <input
                id="lastName"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 sm:p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D2F58] mb-4"
              />
            </section>

            {/* Hidden Role */}
            <input type="hidden" value="Student" />

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full border-2 border-[#F8F8FF] text-white rounded-[8px] py-2 px-3 text-sm sm:text-base hover:bg-[#F8F8FF] hover:text-[#1D2F58] mt-2 mb-5 cursor-pointer transition-colors duration-150"
            >
              Sign up
            </button>
          </form>
        </section>

        <p className="text-base text-[#103E93] mt-4 text-center">
          Already have an account?{" "}
          <button
            onClick={() => (window.location.href = "/login")}
            className="hover:text-blue-700 underline px-0 py-0 text-sm font-medium cursor-pointer"
          >
            Sign In
          </button>
        </p>
    </div>
  </main>
    </div>
  );
}
