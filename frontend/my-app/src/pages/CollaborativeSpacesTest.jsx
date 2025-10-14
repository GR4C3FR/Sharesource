import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  createSpace,
  getAllSpaces,
  joinSpace,
  getUserSpaces,
  leaveSpace,
  deleteSpace,
} from "../services/collaborativeSpaceService";
import API from "../api";
import AppShell from "../components/AppShell";

export default function CollaborativeSpaces() {
  const [spaceName, setSpaceName] = useState("");
  const [description, setDescription] = useState("");
  const [spaces, setSpaces] = useState([]);
  const [mySpaces, setMySpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [expandedMembers, setExpandedMembers] = useState({});
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const token = localStorage.getItem("accessToken");
  const [searchMySpaces, setSearchMySpaces] = useState("");
  const [searchAvailableSpaces, setSearchAvailableSpaces] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [all, mine] = await Promise.all([getAllSpaces(), getUserSpaces()]);
        setSpaces(all || []);
        setMySpaces(mine || []);
      } catch (err) {
        console.error(err);
      }
      try {
        const res = await API.get("/users/profile", { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data.user);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const data = await getAllSpaces();
      setSpaces(data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySpaces = async () => {
    const data = await getUserSpaces();
    setMySpaces(data || []);
  };

  const displayedAvailableSpaces = useMemo(() => {
    const q = (searchAvailableSpaces || "").trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter((space) => {
      const title = (space.spaceName || "").toLowerCase();
      const owner = (space.ownerUserId?.username || space.ownerUserId?.email || "").toLowerCase();
      const members = ((space.members || []).map((m) => (m.userId?.username || m.userId?.email || "").toLowerCase()).join(" "));
      return title.includes(q) || owner.includes(q) || members.includes(q);
    });
  }, [spaces, searchAvailableSpaces]);

  const displayedMySpaces = useMemo(() => {
    const q = (searchMySpaces || "").trim().toLowerCase();
    if (!q) return mySpaces;
    return mySpaces.filter((space) => {
      const title = (space.spaceName || "").toLowerCase();
      const owner = (space.ownerUserId?.username || space.ownerUserId?.email || "").toLowerCase();
      const members = ((space.members || []).map((m) => (m.userId?.username || m.userId?.email || "").toLowerCase()).join(" "));
      return title.includes(q) || owner.includes(q) || members.includes(q);
    });
  }, [mySpaces, searchMySpaces]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSpace(spaceName, description);
      setSpaceName("");
      setDescription("");
      await fetchSpaces();
      await fetchMySpaces();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create space");
    }
  };

  const handleJoin = async (spaceId) => {
    try {
      await joinSpace(spaceId);
      await fetchSpaces();
      await fetchMySpaces();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to join space");
    }
  };

  const handleLeave = async (spaceId) => {
    if (!window.confirm("Are you sure you want to leave this space?")) return;
    try {
      await leaveSpace(spaceId);
      await fetchSpaces();
      await fetchMySpaces();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to leave space");
    }
  };

  const startEdit = (space) => {
    setEditingSpace(space);
    setEditName(space.spaceName);
    setEditDesc(space.description);
  };

  const saveEdit = async () => {
    try {
      await API.put(
        `/collaborative-spaces/${editingSpace._id}`,
        { spaceName: editName, description: editDesc },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setEditingSpace(null);
      await fetchMySpaces();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update space");
    }
  };

  const toggleMembers = (spaceId, section = "available") => {
    const key = `${section}:${spaceId}`;
    setExpandedMembers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppShell>
      {/* Edit Modal for members (presentation-only) */}
      {editingSpace && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingSpace(null)} />
          <div className="relative z-70 w-full max-w-lg bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Edit Space</h3>
              <button onClick={() => setEditingSpace(null)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm text-gray-600">Title</label>
              <input
                className="p-2 rounded-md border"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={editingSpace?.spaceName || "Space title"}
              />

              <label className="text-sm text-gray-600">Description</label>
              <textarea
                className="p-2 rounded-md border min-h-[8rem]"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder={editingSpace?.description || "Description"}
              />

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditingSpace(null)} className="px-3 py-2 rounded-md border">Cancel</button>
                <button
                  onClick={async () => {
                    await saveEdit();
                    setEditingSpace(null);
                  }}
                  className="px-4 py-2 rounded-md bg-[#1D2F58] text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  <div className="mx-auto w-full max-w-screen-xl px-4 -mt-5 lg:pt-6 min-h-screen">
    <h1 className="block sm:hidden text-2xl font-semibold text-[#103E93] mb-4">Collaboration</h1>
        {/* Set a taller viewport for spaces and keep titles/search bars sticky */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* My Spaces (hidden for Admins) */}
          {profile?.role !== 'Admin' && (
            <div className="w-full lg:w-1/2 pr-0 lg:pr-4">
              <div className="sticky top-6 bg-transparent z-10">
                <h2 className="text-xl font-semibold mb-3">My Spaces</h2>
                {profile && profile.role !== "Admin" && (
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search My Spaces by title, owner or members..."
                      value={searchMySpaces}
                      onChange={(e) => setSearchMySpaces(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-[#1D2F58] bg-white w-full"
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 max-h-[65vh] overflow-y-auto pr-2">

                {profile?.role !== "Admin" && (
                  <button
                      onClick={() => setShowCreateModal(true)}
                      className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1D2F58] text-white shadow-lg hover:bg-[#16325a] cursor-pointer hide-when-mobile-open"
                    >
                      <img src="/collaborative space-logo.png" className="h-5" alt="create" />
                      Create Space
                    </button>
                )}

                {profile && profile.role !== "Admin" && (
                  <>
                    {mySpaces.length === 0 ? (
                      <p>You are not a member of any spaces yet.</p>
                    ) : (
                      displayedMySpaces.map((space) => (
                        <div key={space._id} className="relative py-6 px-5 bg-white mb-4 rounded-lg shadow-md h-auto min-h-[12em] flex">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-lg font-medium text-[#103E93] truncate">{space.spaceName}</h3>
                            <p className="text-sm text-gray-600 mt-1 truncate">{space.description}</p>

                            <div className="flex items-center gap-3 mt-3">
                              <p className="text-sm text-gray-500">
                                <strong>Members:</strong> {(space.members || []).length}
                              </p>
                              <button onClick={() => toggleMembers(space._id, "my")} className="px-2 py-0.5 rounded-md bg-gray-100 text-sm cursor-pointer">
                                {expandedMembers[`my:${space._id}`] ? "Hide" : "Show"}
                              </button>
                            </div>

                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Owner:</strong> {space.ownerUserId?.username || space.ownerUserId?.email || "Unknown"}
                            </p>

                            {expandedMembers[`my:${space._id}`] && (
                              <ul className="mt-2 pl-4 list-disc text-sm text-gray-700">
                                {(space.members || []).map((m) => {
                                  const user = m.userId;
                                  const displayName = (user && (user.username || user.email)) || (typeof user === "string" ? `UserId:${user}` : "Unknown User");
                                  return (
                                    <li key={user?._id || user}>
                                      {displayName} ({m.role})
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>

                          <div className="flex flex-col items-end justify-end gap-2">
                            <div className="flex gap-2">
                              <button onClick={() => navigate(`/spaces/${space._id}`)} className="px-3 rounded-md bg-gray-100 cursor-pointer">
                                View Space
                              </button>
                              <button onClick={() => startEdit(space)} className="px-3 rounded-md bg-yellow-50 cursor-pointer">
                                Edit
                              </button>
                              <button onClick={() => handleLeave(space._id)} className="px-3 rounded-md bg-red-50 text-red-700 cursor-pointer">
                                Leave
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Available Spaces */}
          <div className={profile?.role === 'Admin' ? "w-full lg:w-full pl-0 lg:pl-4" : "w-full lg:w-1/2 pl-0 lg:pl-4"}>
            <div className="sticky top-6 bg-transparent z-10">
              <h2 className="text-xl font-semibold mb-3">Available Spaces</h2>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search Available Spaces by title, owner or members..."
                  value={searchAvailableSpaces}
                  onChange={(e) => setSearchAvailableSpaces(e.target.value)}
                  className={profile?.role === 'Admin' ? "w-full p-3 rounded-xl border border-[#1D2F58] bg-white text-sm" : "w-full p-2 rounded-xl border border-[#1D2F58] bg-white"}
                />
              </div>
            </div>
            <div className="mt-3 max-h-[65vh] overflow-y-auto pr-2">{/* removed pl-2 */}

            {showCreateModal && (
              <div className="fixed inset-0 z-60 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)} />
                <div className="relative z-70 w-full max-w-md bg-white rounded-lg shadow-xl px-6 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Create a Collaborative Space</h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                      Close
                    </button>
                  </div>

                  <form onSubmit={(e) => { handleCreate(e); setShowCreateModal(false); }} className="flex flex-col gap-3">
                    <input type="text" placeholder="Space name" value={spaceName} onChange={(e) => setSpaceName(e.target.value)} required className="p-2 rounded-md border" />
                    <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 rounded-md border" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-2 rounded-md border cursor-pointer">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 rounded-md bg-[#1D2F58] text-white cursor-pointer">
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <p>Loading spaces...</p>
            ) : spaces.length === 0 ? (
              <p>No spaces available yet.</p>
            ) : (
              <ul>
                {displayedAvailableSpaces.map((space) => {
                  const joined = mySpaces.some((s) => s._id === space._id);
                  return (
                    <li key={space._id} className={"relative py-6 " + (profile?.role === 'Admin' ? 'px-6' : 'px-5') + " bg-white mb-4 rounded-lg shadow-md h-auto min-h-[12em] w-full"}>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-4">
                          <h3 className="text-lg font-medium text-[#103E93] truncate">{space.spaceName}</h3>
                          <p className="text-sm text-gray-600 mt-1 truncate">{space.description}</p>

                          <div className="flex items-center gap-3 mt-3">
                            <p className="text-sm text-gray-500">
                              <strong>Members:</strong> {(space.members || []).length}
                            </p>
                            <button onClick={() => toggleMembers(space._id, "available")} className="px-2 py-0.5 rounded-md bg-gray-100 text-sm cursor-pointer">
                              {expandedMembers[`available:${space._id}`] ? "Hide" : "Show"}
                            </button>
                          </div>

                          <p className="text-sm text-gray-500 mt-1">
                            <strong>Owner:</strong> {space.ownerUserId?.username || space.ownerUserId?.email || "Unknown"}
                          </p>
                          {expandedMembers[`available:${space._id}`] && (
                          <ul className="mt-2 pl-4 list-disc text-sm text-gray-700">
                            {(space.members || []).map((m) => (
                              <li key={m.userId?._id || m.userId}>
                                {m.userId?.username || m.userId?.email || "Unknown User"} ({m.role})
                              </li>
                            ))}
                          </ul>
                        )}
                        </div>

                        <div className="flex flex-col items-end justify-end gap-2">
                          <div className="flex gap-2">
                            {joined ? (
                              <span className="text-green-600 font-semibold self-center">Joined</span>
                            ) : (
                              profile?.role !== "Admin" ? (
                                <button onClick={() => handleJoin(space._id)} className="px-3 py-1 rounded-md bg-blue-50">
                                  Join
                                </button>
                              ) : null
                            )}

                            {profile?.role === "Admin" && (
                              <>
                                <button onClick={() => navigate(`/spaces/${space._id}`)} className="px-3 py-1 rounded-md border">
                                  View Space
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm("Delete this space? This will remove the space and any linked docs.")) return;
                                    try {
                                      setLoading(true);
                                      await deleteSpace(space._id);
                                      await fetchSpaces();
                                      await fetchMySpaces();
                                    } catch (err) {
                                      console.error("Failed to delete space", err);
                                      alert(err?.response?.data?.message || "Failed to delete space");
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  className="px-3 py-1 rounded-md bg-red-600 text-white"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

