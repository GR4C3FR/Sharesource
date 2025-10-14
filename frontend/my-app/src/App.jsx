import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Homepage from "./pages/Homepage";
import CollaborativeSpaces from "./pages/CollaborativeSpacesTest";
import SpaceDetails from "./pages/SpaceDetails";
import NoteView from "./pages/NoteView"; 
import MyNotes from "./pages/MyNotes";
import MyFiles from './pages/MyFiles';
import GoogleDocView from "./pages/GoogleDocView";
import FileManager from './pages/FileManager';
import Viewer from './pages/Viewer';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';


function App() {
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Landing page */}
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Navigate to="/homepage" />
          ) : (
          <div className="w-full h-screen flex flex-col items-center justify-start px-4 overflow-hidden pt-0">
            {/* Header */}
            <div className="w-full max-w-screen-xl flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0 py-6 mb-2 sm:mb-6 relative z-50">
              {/* Logo Section (mobile: stacked & smaller; desktop: inline) */}
              <section className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4 relative z-50">
                <a
                  href="/"
                  aria-label="ShareSource Home"
                  onClick={(e) => { if (localStorage.getItem('accessToken')) { e.preventDefault(); window.location.href = '/homepage'; } }}
                  className="p-0 bg-transparent border-0 cursor-pointer"
                >
                  <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[60px] sm:w-[90px] h-auto" />
                </a>
                <a href="/" aria-label="ShareSource Landing" onClick={() => { window.location.href = '/'; }} className="p-0 bg-transparent border-0 cursor-pointer -mt-2 sm:mt-0">
                  <img src="/sharessource-text.png" alt="ShareSource Text" className="w-[120px] sm:w-[180px] h-auto"/>
                </a>
              </section>

              {/* Buttons Section (hidden on small screens) */}
              <section className="hidden sm:flex gap-4">
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 text-[#1D2F58] geologica cursor-pointer text-[20px]"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-6 py-2 bg-[#1D2F58] border-2 border-[#1D2F58] rounded-lg text-white geologica hover:bg-[#162240] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer text-[20px]"
                >
                  Sign up
                </button>
              </section>
            </div>
            
            <div className="w-full max-w-screen-xl flex-1 md:min-h-[68vh] lg:min-h-[75vh] flex flex-col lg:flex-row justify-center md:justify-between items-center gap-6 md:gap-4 lg:gap-6 px-4 text-[#1D2F58] text-center lg:text-left mt-0 md:-mt-16">
              <section className="flex flex-col gap-6 md:gap-4 lg:gap-6 flex-1 max-w-2xl items-center text-center sm:items-start sm:text-left">
                <h1 className="inter-text font-normal text-4xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight">
                  <span className="font-sans font-medium text-3xl md:text-2xl lg:text-4xl xl:text-5xl">
                    Welcome to our space —
                  </span>
                  <br />
                  <span className="text-3xl md:text-2xl lg:text-4xl xl:text-5xl">a place to learn, connect, and make it your own.</span>
                </h1>

                {/* Mobile-only hero image: shown below md, hidden on md+ (desktop keeps the existing hero) */}
                <div className="block md:hidden w-full flex justify-center pt-2">
                  <img src="/landingArt.png" alt="hero mobile" className="w-64 sm:w-72 object-contain" />
                </div>

                <div>
                  <p className="font-geologica font-normal text-lg md:text-base lg:text-xl leading-relaxed mb-6 md:mb-4 text-[#1D2F58]">Join the Sharesource community and make it yours.</p>

                  <button
                    className="px-8 py-3 md:px-6 md:py-2 lg:px-8 lg:py-3 font-geologica text-base md:text-sm lg:text-base bg-[#1D2F58] text-white sm:bg-transparent sm:text-[#1D2F58] border-2 border-[#1D2F58] rounded-lg hover:bg-[#162240] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
                    onClick={() => (window.location.href = "/login")}
                  >
                    Get Started
                  </button>
                </div>
              </section>

                <section className="hidden md:flex flex-1 items-center justify-end pl-8 lg:pl-16">
                  <img src="/landingArt.png" className="w-full max-w-md md:max-w-lg lg:max-w-xl object-contain" alt="hero"/>
                </section>
            </div>

          </div>

          )
        }
      />


      {/* Signup/Login/Homepage */}
      <Route
        path="/signup"
        element={isLoggedIn ? <Navigate to="/homepage" /> : <Signup />}
      />
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/homepage" /> : <Login />}
      />
      <Route
        path="/homepage"
        element={isLoggedIn ? <Homepage /> : <Navigate to="/login" />}
      />

      {/* Collaborative spaces testing */}
      <Route
        path="/spaces"
        element={isLoggedIn ? <CollaborativeSpaces /> : <Navigate to="/login" />}
      />

      {/* Single space details */}
      <Route
        path="/spaces/:spaceId"
        element={isLoggedIn ? <SpaceDetails /> : <Navigate to="/login" />}
      /> 
      
      <Route path="/notes/:id" element={<NoteView />} />

      <Route path="/my-notes" element={<MyNotes />} />

      <Route path="/my-files" element={isLoggedIn ? <MyFiles /> : <Navigate to="/login" />} />

  <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />

      <Route path="/spaces/:spaceId/docs/:docId" element={<GoogleDocView />} />

      <Route path="/files" element={<FileManager />} />

      <Route path="/viewer/:id" element={<Viewer />} />

      <Route path="/bookmarks" element={isLoggedIn ? <Bookmarks /> : <Navigate to="/login" />} />

    </Routes>
  );
}

export default App;