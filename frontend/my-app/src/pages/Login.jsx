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
    <div className="w-auto h-auto flex flex-col items-center justify-center">

      <div className="w-[1500px] flex justify-between items-center space-y-8 py-8 mb-8">
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
      
      <div className="w-[800px] flex flex-col mb-7">
        <section className="mb-9">
          <h1 class="inter-text font-normal text-[36px] leading-[36px] tracking-[0%] mb-5 text-[#1D2F58]">Login </h1>
          <p class="inter-text font-normal text-[16px] leading-[16px] tracking-[0%] pl-5 text-[#1D2F58]">Hey, you’re back! Let’s pick up where you left off.</p>
        </section>

        <section className="flex bg-[#FFFCF7] rounded-[8px] shadow-[0_0_10px_rgba(0,0,0,0.15)] p-6 h-[290px]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-center w-full h-full gap-5"
          >
            {/* Email */}
            <section className="flex flex-col w-full">
              <label htmlFor="email" className="mb-2 text-md font-medium text-left text-[#103E93]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                className="w-full border border-[#D9D9D9] bg-[#FFFFFF] text-[#103E93A6] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* Password */}
            <section className="flex flex-col w-full mb-3">
              <label htmlFor="password" className="mb-2 text-md font-medium text-[#D05A02]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full border border-[#D9D9D9] bg-[#FFFFFF] text-[#103E93A6] rounded-[8px] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#103E93] text-white rounded-[8px] p-2 hover:bg-[#0d2c70] mb-5 cursor-pointer"
            >
              Login
            </button>
          </form>
        </section>
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
