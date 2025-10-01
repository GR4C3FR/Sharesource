import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Homepage from "./pages/Homepage";
import CollaborativeSpaces from "./pages/CollaborativeSpacesTest";
import SpaceDetails from "./pages/SpaceDetails";
import NoteView from "./pages/NoteView"; 
import MyNotes from "./pages/MyNotes";

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
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <h1>Welcome to the App</h1>
              <div style={{ marginTop: "20px" }}>
                <button
                  onClick={() => navigate("/signup")}
                  style={{ marginRight: "10px", padding: "10px 20px" }}
                >
                  Signup
                </button>
                <button
                  onClick={() => navigate("/login")}
                  style={{ padding: "10px 20px" }}
                >
                  Login
                </button>
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

    </Routes>
  );
}

export default App;