// frontend/src/pages/SpaceDetails.jsx
import { useEffect, useState, useMemo } from "react";
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
  const [sortOption, setSortOption] = useState("newest");
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
    // allow the whole page to scroll while on this page
    document.body.style.overflow = 'auto';
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
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 min-h-screen">
        <p>Loading space...</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto w-full px-4 -mt-5 lg:pt-6 min-h-screen overflow-auto lg:max-w-screen-xl">
  <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-full lg:flex-1 flex flex-col min-h-0">
            <div className="mb-6">
              <button onClick={() => navigate('/spaces')} className="inline-flex items-center gap-2 text-sm text-[#1D2F58] px-5 py-2 rounded-md border border-gray-200 bg-white shadow-sm hover:bg-gray-50 cursor-pointer">
                <img src="/back-logo.png" className="h-4 w-4"/>
                Back to Spaces
              </button>
            </div>

            {/* Mobile-only: inject the space details + members + add buttons directly under Back button */}
            <div className="lg:hidden">
              <div className="py-6 px-4 border rounded-md bg-white shadow-sm mb-4">
                <section className="flex justify-between items-center mb-3">
                  <h1 className="text-[16px]">Space Details:</h1>
                  {profile?.role !== 'Admin' && (
                    <div>
                      <button onClick={() => setEditMode(true)} className="px-4 py-1 bg-gray-100 rounded-md text-sm cursor-pointer">Edit</button>
                    </div>
                  )}
                </section>
                <h2 className="text-lg font-semibold text-[#1D2F58]">{space.spaceName}</h2>
                <p className="text-sm text-[#1D2F58] mt-2">{space.description}</p>
              </div>

              <div className="p-4 border rounded-md bg-white shadow-sm mb-4">
                <div onClick={() => setShowMembersDropdown(s => !s)} className="flex items-center justify-between cursor-pointer">
                    <h3 className="font-medium text-[#1D2F58]">Members</h3>
                    <div className="text-sm text-[#1D2F58]">{space.members?.length || 0} ▾</div>
                  </div>
                  {showMembersDropdown && (
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                    {space.members?.length > 0 ? space.members.map((m) => (
                      <div key={m.userId?._id || m.userId} className="flex items-center justify-between text-sm text-[#1D2F58]">
                        <div>{m.userId?.username || m.userId?.email || 'Unknown User'}</div>
                        <div className="text-xs text-[#1D2F58]">{m.role}</div>
                      </div>
                    )) : <div className="text-sm text-[#1D2F58]">No members yet</div>}
                  </div>
                )}
              </div>

              {String(space.ownerUserId?._id || space.ownerUserId) === String(localStorage.getItem('userId')) && (
                  <div className="mb-4">
                    <button onClick={() => setShowAddMember(true)} className="px-3 py-3 bg-[#1D2F58] text-white rounded-md cursor-pointer w-full flex justify-center items-center gap-4">
                       <img src="/add-member-logo.png" className="h-7 w-7"/>
                       Add Member
                    </button>
                  </div>
                )}

                {profile?.role !== 'Admin' && (
                  <div className="mb-4">
                    <button onClick={() => setShowAddDoc(true)} className="w-full px-3 py-3 bg-[#1D2F58] text-white rounded-md cursor-pointer flex justify-center items-center gap-4">
                      <img src="/add-post.png" className="h-7 w-7"/>
                       Add Collaborative File
                    </button>
                  </div>
                )}
            </div>

            {/* Shared files in center column */}
            <section className="flex flex-col flex-1 min-h-0">
              <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between mb-5 gap-3">
                <h3 className="text-lg font-medium w-full md:w-auto text-center md:text-left">Shared Files</h3>

                {/* Search + Filters (homepage-style, but scoped to document title) */}
                <div className="w-full md:w-1/2 relative">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full">
                    <input
                      type="text"
                      placeholder="Search by document title"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 rounded-xl border border-[#1D2F58] bg-white text-sm"
                    />
                    <label htmlFor="space-filters-toggle" className="inline-flex justify-center w-full md:w-auto items-center px-3 py-2 rounded-md bg-[#1D2F58] text-white text-sm cursor-pointer select-none hover:bg-[#16325a]">Filters</label>
                  </div>

                  <input id="space-filters-toggle" type="checkbox" className="hidden peer" />

                  <div className="filter-panel absolute right-0 mt-2 w-[260px] z-50 transform origin-top scale-y-0 peer-checked:scale-y-100 peer-checked:block hidden bg-white rounded-lg shadow-2xl p-3 border">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#1D2F58]">Filters & Sorting</h4>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-xs text-[#1D2F58] mb-1">Sort by</label>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="p-2 rounded-md border bg-white text-sm text-[#1D2F58]">
                          <option value="newest">Newest - Oldest</option>
                          <option value="oldest">Oldest - Newest</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <button onClick={() => setSortOption('newest')} className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-[#1D2F58] text-white hover:bg-[#0f1f38]">Clear Filters</button>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>

              {loadingDocs ? (
                <p className="mt-2 text-sm">Loading docs...</p>
              ) : (
                <div className="mt-1">
                  <div className="overflow-y-auto h-[40em] pr-2">
                    {(() => {
                      const q = (searchQuery || "").trim().toLowerCase();
                      let filtered = docs.filter(d => !q || d.title?.toLowerCase().includes(q));
                      if (sortOption === 'newest') filtered = filtered.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                      if (sortOption === 'oldest') filtered = filtered.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                      return filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {filtered.map((d) => (
                            <div key={d._id} className="relative border p-3 rounded-md bg-white shadow-sm flex flex-col justify-between">
                              {/* Mobile-only overlay: open actual Google Doc link in new tab when tapped on mobile */}
                              <a
                                href={d.link || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="lg:hidden absolute inset-0 z-10"
                                aria-label={`Open ${d.title} in Google Docs`}
                              />

                              <div onClick={() => navigate(`/spaces/${spaceId}/docs/${d._id}`)} className="cursor-pointer">
                                <h4 className="text-md font-semibold text-[#1D2F58]">{d.title}</h4>
                                <p className="text-sm text-[#1D2F58] mt-2">{d.description || "No description"}</p>
                                <small className="text-xs text-[#1D2F58]">Added: {new Date(d.createdAt).toLocaleString()}</small>
                              </div>

                              {(space.members?.some(m => String(m.userId?._id || m.userId) === String(localStorage.getItem('userId'))) || profile?.role === 'Admin') && (
                                <div className="mt-3 flex justify-end z-20">
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
                                  }} className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-md cursor-pointer">Delete</button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#1D2F58]">No Google Docs shared yet.</p>
                    );
                  })()}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right-side panel (hidden on mobile; mobile copy injected above Back button) */}
          <aside className="hidden lg:block w-full lg:w-80 flex-shrink-0">
            <div className="overflow-auto space-y-4">
              <div className="py-10 px-8 border rounded-md bg-white shadow-sm">
                <section className="flex justify-between items-center mb-4">
                  <h1 className="text-[16px]">Space Details:</h1>
                  {profile?.role !== 'Admin' && (
                    <div className="mt-3">
                      <button onClick={() => setEditMode(true)} className="px-9 py-1 bg-gray-100 rounded-md text-[14px] cursor-pointer">Edit</button>
                    </div>
                  )}
                </section>
                <h2 className="text-lg font-semibold text-[#1D2F58]">{space.spaceName}</h2>
                <p className="text-sm text-[#1D2F58] mt-2">{space.description}</p>
              </div>

              <div className="p-4 border rounded-md bg-white shadow-sm mb-7">
                <div onClick={() => setShowMembersDropdown(s => !s)} className="flex items-center justify-between cursor-pointer">
                    <h3 className="font-medium text-[#1D2F58]">Members</h3>
                    <div className="text-sm text-[#1D2F58]">{space.members?.length || 0} ▾</div>
                  </div>
                  {showMembersDropdown && (
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                    {space.members?.length > 0 ? space.members.map((m) => (
                      <div key={m.userId?._id || m.userId} className="flex items-center justify-between text-sm text-[#1D2F58]">
                        <div>{m.userId?.username || m.userId?.email || 'Unknown User'}</div>
                        <div className="text-xs text-[#1D2F58]">{m.role}</div>
                      </div>
                    )) : <div className="text-sm text-[#1D2F58]">No members yet</div>}
                  </div>
                )}
              </div>

              {String(space.ownerUserId?._id || space.ownerUserId) === String(localStorage.getItem('userId')) && (
                  <div className="mt-3 mb-5">
                    <button onClick={() => setShowAddMember(true)} className="px-3 py-3 bg-[#1D2F58] text-white rounded-md cursor-pointer w-full flex justify-center items-center gap-4">
                       <img src="/add-member-logo.png" className="h-7 w-7"/>
                       Add Member
                    </button>
                  </div>
                )}

                {profile?.role !== 'Admin' && (
                  <div>
                    <button onClick={() => setShowAddDoc(true)} className="w-full px-3 py-3 bg-[#1D2F58] text-white rounded-md cursor-pointer w-full flex justify-center items-center gap-4">
                      <img src="/add-post.png" className="h-7 w-7"/>
                       Add Collaborative File
                    </button>
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
                    }} className="w-full px-3 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-md cursor-pointer">Delete Space</button>
                  </div>
                )}

            </div>
          </aside>
        </div>

        {/* Edit modal (matches /spaces popup behavior) */}
        {editMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setEditMode(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-md shadow-lg p-6">
              <h2 className="text-xl font-semibold text-[#1D2F58]">Edit Space</h2>
              <p className="text-sm text-[#1D2F58] mt-1">Change the space name and description below.</p>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full mt-3 p-2 border rounded-md text-[#1D2F58]" />
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="block w-full mt-3 p-2 border rounded-md text-[#1D2F58]" />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setEditMode(false)} className="px-3 py-2 bg-gray-100 rounded-md cursor-pointer text-[#1D2F58]">Cancel</button>
                <button onClick={saveEdit} className="px-3 py-2 bg-[#1D2F58] text-white rounded-md cursor-pointer">Save changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Collaborative File modal (matches previous behavior) */}
        {showAddDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowAddDoc(false)} />
            <div className="flex flex-col gap-4 relative z-10 w-full max-w-lg bg-white rounded-md shadow-lg p-6">
              <h4 className="font-medium">Add Google Doc</h4>
              <input placeholder="Document title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <input placeholder="Short description (optional)" value={docDesc} onChange={(e) => setDocDesc(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <input placeholder="Google Docs link (must be shareable: Anyone with the link)" value={docLink} onChange={(e) => setDocLink(e.target.value)} className="block w-full mt-3 p-2 border rounded-md" />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowAddDoc(false)} className="px-3 py-2 bg-gray-100 rounded-md cursor-pointer">Cancel</button>
                <button onClick={addGoogleDoc} disabled={addingDoc} className="px-3 py-2 bg-[#1D2F58] text-white rounded-md cursor-pointer">{addingDoc ? 'Adding...' : 'Add Document'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member modal (popup) */}
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowAddMember(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-md shadow-lg p-6">
              <section className="flex items-center justify-between">
                <h4 className="font-medium text-[#1D2F58]">Add Member</h4>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setShowAddMember(false)} className="px-3 py-2 cursor-pointer text-[#1D2F58]">Close</button>
                </div>
              </section>
              <p className="text-sm text-[#1D2F58] mt-1">Search by email and invite a user to this space.</p>
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-5">
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
                  }} className="px-3 py-2 bg-[#1D2F58] text-white rounded cursor-pointer">Search</button>
                </div>
                {searchingUser && <div className="mt-2 text-sm text-[#1D2F58]">Searching...</div>}
                {foundUser && (
                  <div className="mt-2 p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#1D2F58]">{foundUser.name || foundUser.email}</div>
                      <div className="text-xs text-[#1D2F58]">{foundUser.email}</div>
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
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
