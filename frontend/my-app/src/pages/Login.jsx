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
      const res = await API.post("/users/login", { email, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("userEmail", email);
      // localStorage.setItem("userId", res.data.user._id);
      if (res.data.user?._id) {
        localStorage.setItem("userId", res.data.user._id);
      }
      alert("Login successful!");
      navigate("/homepage");
    } catch (err) {
      alert(err.response?.data?.error || "Invalid email or password");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center overflow-auto py-0 px-4 mb-10">

  <div className="w-full max-w-screen-xl flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0 py-6 mb-6 px-4 mx-auto relative z-50">
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
          <section className="mb-6">
            <h1 className="inter-text font-normal text-2xl sm:text-3xl leading-tight mb-2 text-[#1D2F58] text-center sm:text-left">Sign In</h1>
            <p className="inter-text font-normal text-xs sm:text-sm leading-[16px] text-[#1D2F58] text-center sm:text-left">Please fill out the form to continue.</p>
          </section>

          <section className="flex bg-[#1D2F58] rounded-[8px] shadow-[0_0_10px_rgba(0,0,0,0.15)] p-3 md:p-6 w-full">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col justify-center w-full gap-4 sm:gap-5"
            >
            {/* Email */}
            <section className="flex flex-col w-full">
              <label htmlFor="email" className="mb-1 text-sm font-medium text-left text-[#FFFFFF] bg-transparent">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 sm:p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* Password */}
            <section className="flex flex-col w-full mb-3">
              <label htmlFor="password" className="mb-1 text-sm font-medium text-[#FFFFFF]">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 sm:p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full border-2 border-[#F8F8FF] text-white rounded-[8px] py-2 px-3 text-sm sm:text-base hover:bg-[#F8F8FF] hover:text-[#1D2F58] mb-5 cursor-pointer transition-colors duration-150"
            >
              Sign In
            </button>
          </form>
        </section>

        <p className="text-base text-[#103E93] mt-4 text-center">
          Don’t have an account yet?{" "}
          <button
            onClick={() => (window.location.href = "/signup")}
            className="hover:text-blue-700 underline px-0 py-0 text-sm font-medium cursor-pointer"
          >
            Sign Up
          </button>
        </p>

        </div>
      </main>

    </div>
  );
}
