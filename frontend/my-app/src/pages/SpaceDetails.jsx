// frontend/src/pages/SpaceDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { searchUserByEmail, inviteMember, deleteSpace } from "../services/collaborativeSpaceService";
import AppShell from "../components/AppShell";

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
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // UI-only: hide page-level scrollbar while viewing this page so only inner panels scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

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

  if (!space) return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
        <p>Loading space...</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 h-screen overflow-hidden">
        <div className="flex items-start gap-6 h-full">
          <div className="flex-1 h-full flex flex-col min-h-0">
            <div className="mb-4">
              <button onClick={() => navigate('/spaces')} className="inline-flex items-center gap-2 text-sm text-[#103E93] px-3 py-2 rounded-md border border-gray-200 bg-white shadow-sm hover:bg-gray-50">⬅ Back to Spaces</button>
            </div>

            {/* Shared files in center column */}
            <section className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between flex-none">
                <h3 className="text-lg font-medium">Shared Files (Google Docs)</h3>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by document title" className="ml-4 p-2 border rounded-md text-sm" />
              </div>

              {loadingDocs ? (
                <p className="mt-2 text-sm">Loading docs...</p>
              ) : (
                <div className="mt-3">
                  <div className="overflow-y-auto h-[40em] pr-2">
                    {docs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {docs
                          .filter(d => !searchQuery || d.title?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                          .map((d) => (
                            <div key={d._id} className="border p-3 rounded-md bg-white shadow-sm flex flex-col justify-between">
                              <div onClick={() => navigate(`/spaces/${spaceId}/docs/${d._id}`)} className="cursor-pointer">
                                <h4 className="text-md font-semibold">{d.title}</h4>
                                <p className="text-sm text-gray-600 mt-2">{d.description || "No description"}</p>
                                <small className="text-xs text-gray-500">Added: {new Date(d.createdAt).toLocaleString()}</small>
                              </div>

                              {space.members?.some(m => String(m.userId?._id || m.userId) === String(localStorage.getItem('userId'))) && (
                                <div className="mt-3 flex justify-end">
                                  <button onClick={async (e) => {
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
                                  }} className="px-3 py-1 bg-red-600 text-white rounded-md">Delete</button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600">No Google Docs shared yet.</p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right-side panel */}
          <aside className="w-80 flex-shrink-0 h-full">
            <div className="h-full overflow-auto space-y-4">
              <div className="p-4 border rounded-md bg-white shadow-sm">
                <h2 className="text-lg font-semibold">{space.spaceName}</h2>
                <p className="text-sm text-gray-600 mt-2">{space.description}</p>
                {profile?.role !== 'Admin' && (
                  <div className="mt-3">
                    <button onClick={() => setEditMode(true)} className="px-3 py-2 bg-gray-100 rounded-md">Edit</button>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-md bg-white shadow-sm">
                <div onClick={() => setShowMembersDropdown(s => !s)} className="flex items-center justify-between cursor-pointer">
                    <h3 className="font-medium">Members</h3>
                    <div className="text-sm text-gray-500">{space.members?.length || 0} ▾</div>
                  </div>
                  {showMembersDropdown && (
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                    {space.members?.length > 0 ? space.members.map((m) => (
                      <div key={m.userId?._id || m.userId} className="flex items-center justify-between text-sm">
                        <div>{m.userId?.username || m.userId?.email || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{m.role}</div>
                      </div>
                    )) : <div className="text-sm text-gray-600">No members yet</div>}
                  </div>
                )}
                {String(space.ownerUserId?._id || space.ownerUserId) === String(localStorage.getItem('userId')) && (
                  <div className="mt-3">
                    <button onClick={() => setShowAddMember(true)} className="px-3 py-2 bg-[#1D2F58] text-white rounded-md">➕ Add Member</button>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-md bg-white shadow-sm">
                {profile?.role !== 'Admin' && (
                  <div>
                    <button onClick={() => setShowAddDoc(true)} className="w-full px-3 py-2 bg-[#1D2F58] text-white rounded-md">➕ Add Collaborative File</button>
                  </div>
                )}
                {profile?.role === 'Admin' && (
                  <div className="mt-2">
                    <button onClick={async () => {
                      if (!confirm('Delete this space? This will remove the space and any linked docs.')) return;
                      try {
                        await deleteSpace(spaceId);
                        alert('Space deleted');
                        navigate('/spaces');
                      } catch (err) {
                        console.error('Failed to delete space', err);
                        alert(err?.response?.data?.message || 'Failed to delete space');
                      }
                    }} className="w-full px-3 py-2 bg-red-600 text-white rounded-md">Delete Space</button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Edit modal (matches /spaces popup behavior) */}
        {editMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setEditMode(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-md shadow-lg p-6">
              <h2 className="text-xl font-semibold">Edit Space</h2>
              <p className="text-sm text-gray-500 mt-1">Change the space name and description below.</p>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setEditMode(false)} className="px-3 py-2 bg-gray-100 rounded-md">Cancel</button>
                <button onClick={saveEdit} className="px-3 py-2 bg-[#1D2F58] text-white rounded-md">Save changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Collaborative File modal (matches previous behavior) */}
        {showAddDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowAddDoc(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-md shadow-lg p-6">
              <h4 className="font-medium">Add Google Doc</h4>
              <input placeholder="Document title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <input placeholder="Short description (optional)" value={docDesc} onChange={(e) => setDocDesc(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <input placeholder="Google Docs link (must be shareable: Anyone with the link)" value={docLink} onChange={(e) => setDocLink(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowAddDoc(false)} className="px-3 py-2 bg-gray-100 rounded-md">Cancel</button>
                <button onClick={addGoogleDoc} disabled={addingDoc} className="px-3 py-2 bg-[#1D2F58] text-white rounded-md">{addingDoc ? 'Adding...' : 'Add Document'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member modal (popup) */}
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowAddMember(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-md shadow-lg p-6">
              <h4 className="font-medium">Add Member</h4>
              <p className="text-sm text-gray-500 mt-1">Search by email and invite a user to this space.</p>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <input value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Search by email" className="flex-1 px-3 py-2 border rounded" />
                  <button onClick={async () => {
                    setSearchingUser(true);
                    try {
                      const u = await searchUserByEmail(searchEmail);
                      setFoundUser(u || null);
                    } catch (err) {
                      console.error('Search failed', err);
                      setFoundUser(null);
                      alert(err?.response?.data?.message || 'User not found');
                    } finally {
                      setSearchingUser(false);
                    }
                  }} className="px-3 py-2 bg-[#1D2F58] text-white rounded">Search</button>
                </div>
                {searchingUser && <div className="mt-2 text-sm">Searching...</div>}
                {foundUser && (
                  <div className="mt-2 p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{foundUser.name || foundUser.email}</div>
                      <div className="text-xs text-gray-500">{foundUser.email}</div>
                    </div>
                    <div>
                      <button onClick={async () => {
                        setInviteLoading(true);
                        try {
                          await inviteMember(spaceId, foundUser._id || foundUser.id || foundUser.userId);
                          alert('Invitation sent');
                          setFoundUser(null);
                          setSearchEmail('');
                          fetchSpace();
                          setShowAddMember(false);
                        } catch (err) {
                          console.error('Invite failed', err);
                          alert(err?.response?.data?.message || 'Failed to invite');
                        } finally {
                          setInviteLoading(false);
                        }
                      }} className="px-3 py-1 bg-[#1D2F58] text-white rounded">{inviteLoading ? 'Inviting...' : 'Invite'}</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowAddMember(false)} className="px-3 py-2 bg-gray-100 rounded-md">Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
