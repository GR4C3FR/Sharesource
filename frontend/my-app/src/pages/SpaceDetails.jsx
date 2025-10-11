// frontend/src/pages/SpaceDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { searchUserByEmail, inviteMember, deleteSpace } from "../services/collaborativeSpaceService";

export default function SpaceDetails() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // Google Doc UI state
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [docLink, setDocLink] = useState("");
  const [docs, setDocs] = useState([]); // google docs linked to this space
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);

  // Add Member UI state
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Fetch space by ID
  const fetchSpace = async () => {
    try {
      const res = await API.get(`/collaborative-spaces/${spaceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      const data = res.data;
      data.members = data.members || [];
      data.sharedNotesIds = data.sharedNotesIds || [];

      setSpace(data);
      setTitle(data.spaceName || "");
      setDesc(data.description || "");
    } catch {
      console.error("❌ Failed to fetch space");
      alert("Failed to load space details");
    }
  };

  const fetchDocs = async () => {
    try {
      setLoadingDocs(true);
      const res = await API.get(`/google-docs/spaces/${spaceId}/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setDocs(res.data || []);
    } catch {
      console.error("Failed to fetch google docs");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchSpace();
    fetchDocs();
    // fetch current user profile
    const fetchProfile = async () => {
      try {
        const r = await API.get('/users/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        setProfile(r.data.user);
      } catch {
        // ignore
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [spaceId]);

  // Save updates
  const saveEdit = async () => {
    try {
      await API.put(
        `/collaborative-spaces/${spaceId}`,
        { spaceName: title, description: desc },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setEditMode(false);
      fetchSpace(); // refresh
    } catch (err) {
      console.error("❌ Failed to update space:", err);
      alert("Failed to update space");
    }
  };

  // Add Google Doc handler
  const addGoogleDoc = async () => {
    try {
      if (!docTitle || !docLink) {
        return alert("Please provide a title and a Google Docs link.");
      }
      setAddingDoc(true);
      const payload = { title: docTitle, description: docDesc, link: docLink };
      await API.post(`/google-docs/spaces/${spaceId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      alert("Google Doc added successfully.");
      setDocTitle("");
      setDocDesc("");
      setDocLink("");
      setShowAddDoc(false);
      fetchDocs();
      fetchSpace();
    } catch (err) {
      console.error("Failed to add google doc:", err);
      const msg = err?.response?.data?.message || "Failed to add Google Doc. Make sure the link is public.";
      alert(msg);
    } finally {
      setAddingDoc(false);
    }
  };

  if (!space) return <p>Loading space...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate("/spaces")}>⬅ Back to Spaces</button>

      {editMode ? (
        <div style={{ marginTop: "20px" }}>
          <h2>Edit Space</h2>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%" }}
          />
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%" }}
          />
          <button onClick={saveEdit} style={{ marginRight: "10px" }}>Save</button>
          <button onClick={() => setEditMode(false)}>Cancel</button>
        </div>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <h2>{space.spaceName}</h2>
          <p>{space.description}</p>
          {profile?.role !== 'Admin' && (
            <button onClick={() => setEditMode(true)}>Edit</button>
          )}
        </div>
      )}

      {/* Members */}
      <h3 style={{ marginTop: "20px" }}>Members ({space.members?.length || 0})</h3>
      <ul>
        {space.members?.length > 0
          ? space.members.map((m) => (
              <li key={m.userId?._id || m.userId}>
                {m.userId?.username || m.userId?.email || "Unknown User"} ({m.role})
              </li>
            ))
          : <li>No members yet</li>}
      </ul>

      {/* Add Member (owner only) */}
      {String(space.ownerUserId?._id || space.ownerUserId) === String(localStorage.getItem('userId')) && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowAddMember(s => !s)}>➕ Add Member</button>

          {showAddMember && (
            <div style={{ marginTop: 12, border: '1px solid #ddd', padding: 12, borderRadius: 6, maxWidth: 720 }}>
              <h4>Add member by email</h4>
              <input
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                style={{ display: 'block', width: '100%', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={async () => {
                    if (!searchEmail) return alert('Please enter an email');
                    try {
                      setSearchingUser(true);
                      setFoundUser(null);
                      const user = await searchUserByEmail(searchEmail);
                      setFoundUser(user);
                    } catch (err) {
                      console.error('User search failed', err);
                      alert(err?.response?.data?.message || 'User not found');
                    } finally {
                      setSearchingUser(false);
                    }
                  }}
                >
                  {searchingUser ? 'Searching...' : 'Search'}
                </button>
                <button onClick={() => { setShowAddMember(false); setSearchEmail(''); setFoundUser(null); }}>Cancel</button>
              </div>

              {foundUser && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div><strong>{foundUser.username || `${foundUser.firstName} ${foundUser.lastName}`}</strong></div>
                    <div style={{ color: '#555' }}>{foundUser.email}</div>
                  </div>
                  <div>
                    {space.members?.some(m => String(m.userId?._id || m.userId) === String(foundUser._id)) ? (
                      <span style={{ color: '#555' }}>Already a member</span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            setInviteLoading(true);
                            await inviteMember(spaceId, foundUser._id);
                            alert('User added to the space');
                            setSearchEmail('');
                            setFoundUser(null);
                            setShowAddMember(false);
                            fetchSpace();
                          } catch (err) {
                            console.error('Invite failed', err);
                            alert(err?.response?.data?.message || 'Failed to add member');
                          } finally {
                            setInviteLoading(false);
                          }
                        }}
                        disabled={inviteLoading}
                      >
                        {inviteLoading ? 'Inviting...' : 'Invite'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Collaborative File - hidden for Admins */}
      {profile?.role !== 'Admin' && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowAddDoc((s) => !s)}>➕ Add Collaborative File</button>
          {showAddDoc && (
            <div style={{ marginTop: 12, border: "1px solid #ddd", padding: 12, borderRadius: 6, maxWidth: 720 }}>
              <h4>Add Google Doc</h4>
              <input
                placeholder="Document title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: 8 }}
              />
              <input
                placeholder="Short description (optional)"
                value={docDesc}
                onChange={(e) => setDocDesc(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: 8 }}
              />
              <input
                placeholder="Google Docs link (must be shareable: Anyone with the link)"
                value={docLink}
                onChange={(e) => setDocLink(e.target.value)}
                style={{ display: "block", width: "100%", marginBottom: 8 }}
              />
              <div>
                <button onClick={addGoogleDoc} disabled={addingDoc} style={{ marginRight: 8 }}>
                  {addingDoc ? "Adding..." : "Add Document"}
                </button>
                <button onClick={() => setShowAddDoc(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin: allow deleting the entire space */}
      {profile?.role === 'Admin' && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={async () => {
              if (!confirm('Delete this space? This will remove the space and any linked docs.')) return;
              try {
                await deleteSpace(spaceId);
                alert('Space deleted');
                navigate('/spaces');
              } catch (err) {
                console.error('Failed to delete space', err);
                alert(err?.response?.data?.message || 'Failed to delete space');
              }
            }}
            style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}
          >
            Delete Space
          </button>
        </div>
      )}

      {/* Google Doc Cards */}
      <h3 style={{ marginTop: 20 }}>Shared Files (Google Docs)</h3>
      {loadingDocs ? (
        <p>Loading docs...</p>
      ) : docs.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          {docs.map((d) => (
            <div
              key={d._id}
              style={{
                border: "1px solid #ddd",
                padding: 12,
                borderRadius: 8,
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/spaces/${spaceId}/docs/${d._id}`)}>
                <h4 style={{ margin: 0 }}>{d.title}</h4>
                <p style={{ marginTop: 6, marginBottom: 8 }}>{d.description || "No description"}</p>
                <small>Added: {new Date(d.createdAt).toLocaleString()}</small>
              </div>

              {/* Delete button visible to members */}
              {space.members?.some(m => String(m.userId?._id || m.userId) === String(localStorage.getItem('userId'))) && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm('Delete this shared Google Doc? This will remove it from the space and delete the record.')) return;
                      try {
                        await API.delete(`/google-docs/spaces/${spaceId}/${d._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } });
                        alert('Deleted');
                        fetchDocs();
                        fetchSpace();
                      } catch (err) {
                        console.error('Failed to delete google doc', err);
                        alert(err?.response?.data?.message || 'Failed to delete');
                      }
                    }}
                    style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No Google Docs shared yet.</p>
      )}
    </div>
  );
}
