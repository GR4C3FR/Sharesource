import { useEffect, useState } from 'react';
import API from '../api';
import AppShell from '../components/AppShell';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '' });
  const [imageFile, setImageFile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/users/profile');
        setProfile(res.data.user);
        setForm({
          firstName: res.data.user.firstName || '',
          lastName: res.data.user.lastName || '',
          username: res.data.user.username || '',
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
        alert('Failed to fetch profile');
      }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    try {
      const res = await API.put('/users/profile', form, { headers: { 'Content-Type': 'application/json' } });
      setProfile(res.data.user);
      setEditing(false);
      alert('Profile updated');
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update profile');
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return alert('Select an image first');
    const fd = new FormData();
    fd.append('profileImage', imageFile);
    try {
      const res = await API.post('/users/profile/picture', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data.user);
      setImageFile(null);
      alert('Profile picture updated');
    } catch (err) {
      console.error('Image upload failed', err.response || err);
      alert('Failed to upload image');
    }
  };

  const handleRemoveImage = async () => {
    try {
      await API.delete('/users/profile/picture');
      // refetch profile
      const res = await API.get('/users/profile');
      setProfile(res.data.user);
      alert('Profile picture removed');
    } catch (err) {
      console.error('Remove failed', err.response || err);
      alert('Failed to remove profile picture');
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  const backendBase = API.defaults.baseURL.replace(/\/api$/, '');

  const imgSrc = profile.profileImageURL ? `${backendBase}${profile.profileImageURL}` : '/placeholder-profile.jpg';

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5">
      <h1>My Profile</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div>
          <img src={imgSrc} alt="avatar" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: '8px' }} />
          <div style={{ marginTop: 10 }}>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            <button onClick={handleImageUpload} style={{ display: 'block', marginTop: 8 }}>Upload Picture</button>
            {profile.profileImageURL && (
              <button onClick={handleRemoveImage} style={{ display: 'block', marginTop: 8, background: '#e74c3c', color: 'white' }}>Remove Picture</button>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {!editing ? (
            <div>
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <button onClick={() => setEditing(true)} style={{ marginTop: 10 }}>Edit Profile</button>
            </div>
          ) : (
            <div>
              <label>Username<br />
                <input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
              </label>
              <br />
              <label>First Name<br />
                <input value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} />
              </label>
              <br />
              <label>Last Name<br />
                <input value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} />
              </label>
              <br />
              <br />
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 20 }}>
        <h3>Change Password</h3>
        <label>Current Password<br />
          <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(s => ({ ...s, currentPassword: e.target.value }))} />
        </label>
        <br />
        <label>New Password<br />
          <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(s => ({ ...s, newPassword: e.target.value }))} />
        </label>
        <br />
        <button onClick={async () => {
          if (!passwordForm.currentPassword || !passwordForm.newPassword) return alert('Enter both passwords');
          try {
            const res = await API.post('/users/profile/password', passwordForm);
            alert(res.data.message || 'Password changed');
            setPasswordForm({ currentPassword: '', newPassword: '' });
          } catch (err) {
            console.error('Password change failed', err);
            alert(err?.response?.data?.message || 'Failed to change password');
          }
        }} style={{ marginTop: 8 }}>Change Password</button>

        <h3 style={{ marginTop: 20 }}>Danger Zone</h3>
        <button onClick={async () => {
          if (!confirm('Delete your profile? This will permanently remove your account and all related data.')) return;
          try {
            const res = await API.delete('/users/profile');
            alert(res.data.message || 'Account deleted');
            // log out locally
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.location.href = '/';
          } catch (err) {
            console.error('Delete profile failed', err);
            alert(err?.response?.data?.message || 'Failed to delete profile');
          }
        }} style={{ background: '#e74c3c', color: 'white', marginTop: 8 }}>Delete Profile</button>
      </div>
      </div>
    </AppShell>
  );
}
