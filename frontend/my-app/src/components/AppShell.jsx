import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import Avatar from './Avatar';

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data.user);
      } catch (err) {
        console.debug('AppShell: failed to load profile', err?.message || err);
        setProfile(null);
      }
    };
    fetchProfile();
  }, [token]);

  return (
    <div className="w-auto h-auto flex flex-col items-center justify-center">
      {/* Header */}
      <div className="w-[1500px] flex justify-between items-center space-y-8 py-8 mb-7">
        {/* Logo Section */}
        <section className="flex items-center justify-center gap-4">
          <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[90px] h-auto" />
          <img src="/sharessource-text.png" alt="ShareSource Text" className="w-[180px] h-auto"/>
        </section>

        {/* Buttons Section (show avatar + logout) - only render avatar after profile is loaded to avoid flash */}
        <section style={{ display: 'flex', alignItems: 'center', gap: 25 }}>
          {profile !== null && (
            <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <Avatar user={profile} size={42} />
            </div>
          )}

          <button onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('userEmail'); navigate('/'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <img src="/logout-icon.png" alt="logout" style={{ width: 28, height: 28 }} />
          </button>
        </section>
      </div>

      <div className="flex w-[1500px] gap-35">
        {/* Left navigation column */}
        <section>
          <section className="w-max h-auto flex flex-col justify-center mb-35">
            <h1 className="text-[45px] font-inter font-normal leading-[16px] tracking-[0%] text-[#1D2F58]">Dashboard</h1>
          </section>

          <section className="flex flex-col gap-10">
            <Link to="/homepage">
              <section className="flex gap-3">
                <img src="/dashboard-logo.png"/>
                <button className="text-[20px] font-inter font-normal leading-[14px] tracking-[-0] text-[#1D2F58] cursor-pointer">Dashboard</button>
              </section>
            </Link>
            <Link to="/bookmarks">
              <section className="flex gap-3">
                <img src="/bookmarks-logo.png"/>
                <button className="text-[20px] font-inter font-normal leading-[14px] tracking-[-0] text-[#1D2F58] cursor-pointer">Bookmarks</button>
              </section>
            </Link>
            <Link to="/my-files">
              <section className="flex gap-3">
                <img src="/yourfiles-logo.png"/>
                <button className="text-[20px] font-inter font-normal leading-[14px] tracking-[-0] text-[#1D2F58] cursor-pointer">Your Files</button>
              </section>
            </Link>
            <Link to="/spaces">
              <section className="flex gap-3">
                <img src="/collaborate-logo.png"/>
                <button className="text-[20px] font-inter font-normal leading-[14px] tracking-[-0] text-[#1D2F58] cursor-pointer">Collaboration</button>
              </section>
            </Link>

            <section>
              <Link to="/profile">
                <section className="flex gap-3">
                  <img src="/settings_logo.png"/>
                  <button className="text-[20px] font-inter font-normal leading-[14px] tracking-[-0] text-[#1D2F58] cursor-pointer">Profile & Settings</button>
                </section>
              </Link>
            </section>

          </section>
        </section>

        {/* Main content area (provided by caller) */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
