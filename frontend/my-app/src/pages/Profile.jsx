import { useEffect, useState } from 'react';
import API from '../api';
import AppShell from '../components/AppShell';
import Avatar from '../components/Avatar';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: '' });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data.user);
        setForm({ username: res.data.user.username || '' });
      } catch (err) {
        console.error('Failed to fetch profile', err);
        alert('Failed to fetch profile');
      }
    };
    fetchProfile();
  }, [token]);

  // create preview URL for selected image file
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  if (!profile) return <div>Loading profile...</div>;

  const backendBase = API.defaults.baseURL ? API.defaults.baseURL.replace(/\/api$/, '') : '';
  const imgSrc = profile.profileImageURL ? `${backendBase}${profile.profileImageURL}` : '/placeholder-profile.jpg';

  const handleUsernameChange = async () => {
    try {
      const res = await API.put('/users/profile', { username: form.username }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      setProfile(res.data.user);
      setShowUsernameInput(false);
      alert('Username updated');
    } catch (err) {
      console.error('Update failed', err);
      alert(err?.response?.data?.message || 'Failed to update username');
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return alert('Select an image first');
    const fd = new FormData();
    fd.append('profileImage', imageFile);
    try {
      const res = await API.post('/users/profile/picture', fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data.user);
      setImageFile(null);
      alert('Profile picture updated');
    } catch (err) {
      console.error('Image upload failed', err?.response || err);
      alert('Failed to upload image');
    }
  };

  const handleRemoveImage = async () => {
    try {
      await API.delete('/users/profile/picture', { headers: { Authorization: `Bearer ${token}` } });
      const res = await API.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data.user);
      alert('Profile picture removed');
    } catch (err) {
      console.error('Remove failed', err?.response || err);
      alert('Failed to remove profile picture');
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) return alert('Fill all password fields');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return alert('New password and confirmation do not match');
    try {
      const res = await API.post('/users/profile/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      alert(res.data.message || 'Password changed');
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password change failed', err);
      alert(err?.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Delete your profile? This will permanently remove your account and all related data.')) return;
    try {
      const res = await API.delete('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message || 'Account deleted');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      window.location.href = '/';
    } catch (err) {
      console.error('Delete profile failed', err);
      alert(err?.response?.data?.message || 'Failed to delete profile');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 min-h-screen">
        <h1 className="block sm:hidden text-2xl font-semibold text-[#103E93] mb-4">Profile</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Avatar + controls */}
          <div className="w-full lg:w-1/3 flex flex-col items-center">
            <div className="relative group">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-40 h-40 rounded-full object-cover" />
              ) : (
                <Avatar user={profile} size={160} className="rounded-full" />
              )}

              <label htmlFor="profile-pic-input" className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl text-[#1D2F58] font-bold">+</div>
              </label>
              <input id="profile-pic-input" type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
            </div>

            <div className="w-full mt-4 text-center ">
              <div className="flex items-center justify-center gap-3">
                <button onClick={handleImageUpload} className="px-4 py-2 bg-[#1D2F58] text-white rounded-md cursor-pointer">Upload</button>
                {profile.profileImageURL && (
                  <button onClick={handleRemoveImage} className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer">Remove</button>
                )}
              </div>
              {previewUrl && (
                <p className="mt-2 text-xs text-gray-500">Click upload to save.</p>
              )}
            </div>
          </div>

          {/* Right: Profile details */}
          <div className="w-full lg:w-2/3 relative bg-white rounded-lg border py-6 px-9">
            <div>
              <div className="text-center lg:text-left">
                <h2 className="text-4xl font-semibold text-[#103E93]">{profile.firstName} {profile.lastName}</h2>
                <p className="text-lg text-gray-700">{profile.email}</p>
              </div>

              {/* Username block: under the name/email and above the password section */}
              <div className="mt-6 border py-3 px-5">
                <p className="text-base font-medium">Username</p>
                {!showUsernameInput ? (
                  <div className="flex items-center gap-3 mt-2 justify-between">
                    <p className="text-lg text-[#103E93]">{profile.username}</p>
                    <button onClick={() => setShowUsernameInput(true)} className="px-3 py-1 bg-gray-100 rounded-md cursor-pointer">Change</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <input value={form.username} onChange={(e) => setForm(s => ({ ...s, username: e.target.value }))} className="p-3 border rounded-md text-lg" />
                    <button onClick={handleUsernameChange} className="px-3 py-1 bg-[#1D2F58] text-white rounded-md cursor-pointer">Save</button>
                    <button onClick={() => { setShowUsernameInput(false); setForm({ username: profile.username }); }} className="px-3 py-1 bg-gray-100 rounded-md cursor-pointer">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between border rounded-md py-3 px-5">
                <h3 className="text-lg font-medium mb-2 lg:mb-0">Password</h3>
                {!showPasswordForm && (
                  <button onClick={() => setShowPasswordForm(true)} className="px-3 py-2 bg-gray-100 rounded-md cursor-pointer">Change Password</button>
                )}
              </div>

              {showPasswordForm && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg 3 px-5">
                  <div>
                    <label className="block text-sm mb-1">Current Password</label>
                    <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(s => ({ ...s, currentPassword: e.target.value }))} className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">New Password</label>
                    <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(s => ({ ...s, newPassword: e.target.value }))} className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Confirm New Password</label>
                    <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(s => ({ ...s, confirmPassword: e.target.value }))} className="w-full p-2 border rounded-md" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handlePasswordChange} className="px-4 py-2 bg-[#1D2F58] text-white rounded-md cursor-pointer">Save Password</button>
                    <button onClick={() => setShowPasswordForm(false)} className="ml-2 px-3 py-2 bg-gray-100 rounded-md cursor-pointer">Cancel</button>
                  </div>
                </div>
              )}
            </div>
            {/* Danger Zone aligned under the right column (aligned with header signout) 
            NOTE: hidden for Admin users per admin-profile UI requirement */}
            {profile?.role !== 'Admin' && (
              <div className="mt-20 w-full border py-3 px-5 rounded-md mb-5">
                {/* empty left column aligns with avatar column */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between p-4 rounded-md">
                    <div className="flex items-start gap-4">
                      <img src="/delete-icon.png" alt="trash" className="w-10 h-10 text-red-600" />
                      <div>
                        <p className="text-base font-semibold text-red-600">DELETE MY ACCOUNT</p>
                        <p className="text-sm text-red-500">Say goodbye to your account and exit all workspaces.</p>
                      </div>
                    </div>

                    <div>
                      <button onClick={handleDeleteProfile} className="px-4 py-2 bg-red-600 text-white rounded-md cursor-pointer">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          
        </div>

      </div>
    </AppShell>
  );
}
