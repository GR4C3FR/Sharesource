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
          <div className="w-full min-h-screen flex flex-col items-center justify-center px-4">
            {/* Header */}
            <div className="w-full max-w-screen-xl flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0 py-6 mb-6 relative z-50">
              {/* Logo Section */}
              <section className="flex items-center justify-center gap-4 relative z-50">
                <a
                  href="/"
                  aria-label="ShareSource Home"
                  onClick={(e) => { if (localStorage.getItem('accessToken')) { e.preventDefault(); window.location.href = '/homepage'; } }}
                  className="p-0 bg-transparent border-0 cursor-pointer"
                >
                  <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[90px] h-auto" />
                </a>
                <a href="/" aria-label="ShareSource Landing" onClick={() => { window.location.href = '/'; }} className="p-0 bg-transparent border-0 cursor-pointer">
                  <img src="/sharessource-text.png" alt="ShareSource Text" className="w-[180px] h-auto"/>
                </a>
              </section>

              {/* Buttons Section */}
              <section className="flex gap-4">
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
            
            <div className="w-full max-w-screen-xl min-h-[75vh] flex flex-col lg:flex-row justify-between items-center gap-6 px-4 text-[#1D2F58]">
              <section className="flex flex-col gap-6 flex-1 max-w-2xl">
                <h1 className="inter-text font-normal text-3xl md:text-4xl lg:text-5xl leading-tight">
                  <span className="font-sans font-medium text-3xl md:text-4xl lg:text-5xl">
                    Welcome to our space —
                  </span>
                  <br />
                  a place to learn, connect, and make it your own.
                </h1>

                <div>
                  <p className="font-geologica font-normal text-lg md:text-xl leading-relaxed mb-5 text-[#1D2F58]">Join the Sharesource community and make it yours.</p>

                  <button
                    className="px-8 py-3 font-geologica text-base text-[#1D2F58] border-2 border-[#1D2F58] rounded-lg hover:bg-[#1D2F58] hover:border-[#1D2F58] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer"
                    onClick={() => (window.location.href = "/login")}
                  >
                    Get Started
                  </button>
                </div>
              </section>

                <section className="flex-1 flex items-center justify-center">
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