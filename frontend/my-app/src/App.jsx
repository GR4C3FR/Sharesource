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
          <div className="w-auto h-auto flex flex-col items-center justify-center">
            {/* Header */}
            <div className="w-[1500px] flex justify-between items-center space-y-8 py-8 mb-7">
              {/* Logo Section */}
              <section className="flex items-center justify-center gap-4">
                <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[90px] h-auto" />
                <img src="/sharessource-text.png" alt="ShareSource Text" className="w-[180px] h-auto"/>
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
                  className="px-6 py-2 border-2 border-[#1D2F58] rounded-[20px] text-[#1D2F58] geologica 
                   hover:bg-[#1D2F58] hover:text-white transition-colors duration-200 cursor-pointer text-[20px]"
                >
                  Sign up
                </button>
              </section>
            </div>
            
            <div className="w-[1450px] h-[500px] flex justify-between items-center space-y-8 px-10 text-[#103E93]">
              <section className="flex flex-col gap-30">
                <h1 className="inter-text font-normal text-[40px] leading-[50px] tracking-[0%]">
                  <span className="font-sans font-medium text-[45px] leading-[100%] tracking-[0%]">
                    Welcome to our space — 
                    </span><br />
                    a place to learn, connect, <br />
                    and make it your own.
                </h1>

                <div>
                  <p className="font-geologica font-normal text-[25px] leading-[40px] mb-5">
                    Join the Sharesource community <br />
                    and make it yours.
                  </p>

                <button
                  className="px-10 py-3 font-geologica font-normal text-[20px] leading-[100%] tracking-[-6%] 
                            text-[#D05A02] border-2 border-[#D05A02] rounded-[20px] hover:bg-[#D05A02] hover:text-white 
                            transition-colors duration-200 cursor-pointer"
                  onClick={() => (window.location.href = "/login")}
                >
                  Get Started
                </button>
                </div>
              </section>

              <section>
                <img src="/hero-img-landing.png" className="w-[600px]"/>
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