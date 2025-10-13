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
    <div className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4 mb-10">

      <div className="w-full max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0 py-4 mb-8 px-4">
        {/* Logo Section */}
        <section className="flex items-center justify-center gap-4">
          <button
            aria-label="ShareSource Home"
            onClick={() => {
              const t = localStorage.getItem('accessToken');
              if (t) navigate('/homepage');
              else navigate('/');
            }}
            className="p-0 bg-transparent border-0 cursor-pointer"
          >
            <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[90px] h-auto" />
          </button>
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
      
      <div className="w-full max-w-screen-xl mx-auto flex items-center justify-center px-4">
        <div className="w-full max-w-xl flex flex-col mb-7">
        <section className="mb-9">
          <h1 className="inter-text font-normal text-[36px] leading-[36px] tracking-[0%] mb-5 text-[#1D2F58]">Sign In</h1>
          <p className="inter-text font-normal text-[16px] leading-[16px] tracking-[0%] pl-5 text-[#1D2F58]">Please fill out the form to continue.</p>
        </section>

        <section className="flex bg-[#1D2F58] rounded-[8px] shadow-[0_0_10px_rgba(0,0,0,0.15)] p-6 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-center w-full gap-5"
          >
            {/* Email */}
            <section className="flex flex-col w-full">
              <label htmlFor="email" className="mb-2 text-md font-medium text-left text-[#FFFFFF] bg-transparent">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* Password */}
            <section className="flex flex-col w-full mb-3">
              <label htmlFor="password" className="mb-2 text-md font-medium text-[#FFFF]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full border border-[#D9D9D9] bg-white text-[#1D2F58] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-[#1D2F58]"
              />
            </section>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full border-2 border-[#F8F8FF] text-white rounded-[8px] p-2 hover:bg-[#F8F8FF] hover:text-[#1D2F58] mb-5 cursor-pointer transition-colors duration-150"
            >
              Sign In
            </button>
          </form>
        </section>
        </div>
      </div>
      
      <p className="text-base text-[#103E93]">
        Don’t have an account yet?{" "}
        <button
          onClick={() => (window.location.href = "/signup")}
          className="hover:text-blue-700 underline px-0 py-0 text-sm font-medium cursor-pointer"
        >
          Sign Up
        </button>
      </p>

    </div>
  );
}
