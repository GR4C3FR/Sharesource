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
    <div className="w-full min-h-screen flex flex-col items-center justify-center pb-12 px-4 mt-22 mb-10">

      <div className="w-full max-w-screen-xl flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0 py-4 mb-8">
        {/* Logo Section */}
        <section className="flex items-center justify-center gap-4">
          <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[90px] h-auto" />
          <img src="/sharessource-text.png" alt="ShareSource Text" className="w-[180px] h-auto"/>
        </section>

        <section>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              background: 'url("/close-btn.png") no-repeat center center',
              backgroundSize: "contain",
              border: "none",
              width: "40px",  
              height: "40px",
              cursor: "pointer",
              padding: 0,
            }}
          >
          </button>
        </section>
      </div>

  <div className="w-full max-w-xl flex flex-col mb-7">
        <section className="mb-9">
          <h1 className="inter-text font-normal text-[36px] leading-[36px] tracking-[0%] mb-5 text-[#1D2F58]">Signup</h1>
          <p className="inter-text font-normal text-[16px] leading-[16px] tracking-[0%] pl-5 text-[#1D2F58]">Ready to collaborate? Let’s get you started.</p>
        </section>

  <section className="flex bg-[#FFFCF7] rounded-[8px] shadow-[0_0_10px_rgba(0,0,0,0.15)] p-6 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-center w-full gap-5"
          >
            {/* Username */}
            <section className="flex flex-col w-full">
              <label htmlFor="username" className="mb-2 text-md font-medium text-left text-[#103E93]">Username</label>
              <input
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-[#FFFFFF] text-[#103E93A6] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* Password */}
            <section className="flex flex-col w-full">
              <label htmlFor="password" className="mb-2 text-md font-medium text-[#103E93]">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-[#FFFFFF] text-[#103E93A6] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* Email */}
            <section className="flex flex-col w-full">
              <label htmlFor="email" className="mb-2 text-md font-medium text-left text-[#103E93]">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-[#FFFFFF] text-[#103E93A6] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* First Name */}
            <section className="flex flex-col w-full">
              <label htmlFor="firstName" className="mb-2 text-md font-medium text-left text-[#D05A02]">First Name</label>
              <input
                id="firstName"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-[#FFFFFF] text-[#103E93A6] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* Last Name */}
            <section className="flex flex-col w-full">
              <label htmlFor="lastName" className="mb-2 text-md font-medium text-left text-[#D05A02]">Last Name</label>
              <input
                id="lastName"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full border border-[#D9D9D9] bg-[#FFFFFF] text-[#103E93A6] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
            </section>

            {/* Hidden Role */}
            <input type="hidden" value="Student" />

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#103E93] text-white rounded-[8px] p-2 hover:bg-[#0d2c70] mt-2 mb-5 cursor-pointer"
            >
              Signup
            </button>
          </form>
        </section>
      </div>

      <p className="text-base text-[#103E93]">
        Already have an account?{" "}
        <button
          onClick={() => (window.location.href = "/login")}
          className="hover:text-blue-700 underline px-0 py-0 text-sm font-medium cursor-pointer"
        >
          Sign In
        </button>
      </p>

    </div>
  );
}
