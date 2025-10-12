import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import Avatar from './Avatar';

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem('accessToken');
  const location = useLocation();

  const getTitleFromPath = (pathname) => {
    if (!pathname || pathname === '/' || pathname === '/homepage') return 'Dashboard';
    if (pathname.startsWith('/bookmarks')) return 'Bookmarks';
    if (pathname.startsWith('/my-files')) return 'Your Files';
    if (pathname.startsWith('/spaces')) return 'Collaboration';
  if (pathname.startsWith('/profile')) return 'Profile';
    if (pathname.startsWith('/notes')) return 'Notes';
    if (pathname.startsWith('/viewer')) return 'Viewer';
    // Fallback: turn path segments into a readable title
    const seg = pathname.split('/').filter(Boolean)[0] || 'Dashboard';
    return seg
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  };

  const pageTitle = getTitleFromPath(location.pathname);

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
    <div className="w-full flex flex-col items-center justify-center overflow-x-hidden">
      {/* Header */}
      <div className="w-full max-w-screen-xl flex justify-between items-center space-y-4 pt-6 pb-2 px-4 mb-15">
        {/* Logo Section */}
        <section className="flex items-center justify-center gap-4">
          <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-[90px] h-auto" />
          <img src="/sharessource-text.png" alt="ShareSource Text" className="w-[180px] h-auto"/>
        </section>

        {/* Buttons Section (show avatar + logout) - only render avatar after profile is loaded to avoid flash */}
        <section className="flex items-center gap-6">
          {profile !== null && (
            <div onClick={() => navigate('/profile')} className="cursor-pointer">
              <Avatar user={profile} size={42} />
            </div>
          )}

          <button onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('userEmail'); navigate('/'); }} className="bg-transparent border-0 cursor-pointer">
            <img src="/logout-icon.png" alt="logout" className="w-7 h-7" />
          </button>
        </section>
      </div>

    <div className="flex w-full max-w-screen-xl gap-10 px-4">
        {/* Left navigation column */}
        <section>
          <section className="w-max h-auto flex flex-col justify-center mb-8 min-w-0">
            {/* Dynamic page title based on current route */}
            <h1 className="text-2xl md:text-3xl font-inter font-normal text-[#1D2F58]">{pageTitle}</h1>
          </section>

          <section className="flex flex-col gap-6 max-h-[60vh] md:max-h-[520px] overflow-auto">
            <Link to="/homepage">
              <section className="flex gap-3 items-center">
                <img src="/dashboard-logo.png" className="w-6 h-6 object-contain" alt="dashboard" />
                <button className="text-[17px] font-inter font-normal leading-[14px] text-[#1D2F58] cursor-pointer">Dashboard</button>
              </section>
            </Link>
            {profile?.role !== 'Admin' && (
              <>
                <Link to="/bookmarks">
                  <section className="flex gap-3 items-center">
                    <img src="/bookmarks-logo.png" className="w-6 h-6 object-contain" alt="bookmarks" />
                    <button className="text-[17px] font-inter font-normal leading-[14px] text-[#1D2F58] cursor-pointer">Bookmarks</button>
                  </section>
                </Link>
                <Link to="/my-files">
                  <section className="flex gap-3 items-center">
                    <img src="/yourfiles-logo.png" className="w-6 h-6 object-contain" alt="your files" />
                    <button className="text-[17px] font-inter font-normal leading-[14px] text-[#1D2F58] cursor-pointer">Your Files</button>
                  </section>
                </Link>
              </>
            )}
            <Link to="/spaces">
                <section className="flex gap-3 items-center">
                  <img src="/collaborate-logo.png" className="w-6 h-6 object-contain" alt="collaboration" />
                  <button className="text-[17px] font-inter font-normal leading-[14px] text-[#1D2F58] cursor-pointer">Collaboration</button>
                </section>
            </Link>

            <div className="mt-20">
              <Link to="/profile">
                <section className="flex gap-3 items-center">
                  <img src="/profile-logo.png" className='w-6 h-6 object-contain'/>
                  <button className="text-[17px] font-inter font-normal leading-[14px] text-[#1D2F58] cursor-pointer">Profile</button>
                </section>
              </Link>
            </div>

          </section>
        </section>

        {/* Main content area (provided by caller) */}
        <main className='flex-1'>
          {children}
        </main>
      </div>
    </div>
  );
}
