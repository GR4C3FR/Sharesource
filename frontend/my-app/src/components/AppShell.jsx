import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import Avatar from './Avatar';

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  <div className="w-full flex flex-col items-center justify-center overflow-x-hidden bg-[#F8F8FF] min-h-screen">
      {/* Header */}
  <div className="w-full max-w-screen-xl flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 pt-6 pb-2 px-4 mb-15 relative">
        {/* Logo Section */}
        <section className="flex items-center justify-start gap-4 w-full lg:w-auto">
          <img src="/sharessource-logo.png" alt="ShareSource Logo" className="w-16 sm:w-20 md:w-24 lg:w-[90px] h-auto" />
          <img src="/sharessource-text.png" alt="ShareSource Text" className="w-28 sm:w-36 md:w-44 lg:w-[180px] h-auto"/>
        </section>

        {/* Mobile hamburger (fixed on small and medium screens) - moved to top-right and enlarged */}
        <div className="fixed right-4 top-4 z-50 lg:hidden">
          <button
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="p-4 lg:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#103E93] bg-white/0"
          >
            {/* simple hamburger icon - larger on phone/iPad */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-10 h-10 md:w-12 md:h-12 lg:w-7 lg:h-7 transform transition-transform duration-200 ${mobileOpen ? 'rotate-90' : 'rotate-0'}`}>
              <path d="M4 7H20" stroke="#103E93" strokeWidth="3" strokeLinecap="round" />
              <path d="M4 12H20" stroke="#103E93" strokeWidth="3" strokeLinecap="round" />
              <path d="M4 17H20" stroke="#103E93" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Buttons Section (show avatar + logout) - stack under logo on small/tablet, inline on desktop */}
      <section className="flex flex-row items-center justify-start gap-8 md:gap-10 lg:gap-6 lg:ml-4 mt-3 lg:mt-0 w-full lg:w-auto">
          {profile !== null && (
            <div onClick={() => navigate('/profile')} className="cursor-pointer transform scale-110 md:scale-125 lg:scale-100 origin-left">
              <Avatar user={profile} size={42} />
            </div>
          )}

          <button onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('userEmail'); navigate('/'); }} className="bg-transparent border-0 cursor-pointer p-1 md:p-2 rounded">
            <img src="/logout-icon.png" alt="logout" className="w-8 h-8 md:w-9 md:h-9 lg:w-7 lg:h-7" />
          </button>
        </section>
      </div>

        {/* Mobile overlay nav: fixed at top, appears above everything when open */}
        <div className={`lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
          {/* Backdrop */}
          <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileOpen(false)} />

          <div className={`fixed inset-0 left-0 top-0 z-50 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <nav className="bg-white w-full h-full shadow-sm p-6 relative">
              {/* Close button inside the panel */}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute right-4 top-4 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#103E93] bg-white/0"
              >
                <svg className="w-6 h-6 text-[#1D2F58]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6L18 18" stroke="#1D2F58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 18L18 6" stroke="#1D2F58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <ul className="flex flex-col gap-6 mt-6">
                <li>
                  <Link to="/homepage" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#1D2F58]">Dashboard</Link>
                </li>
                <li>
                  <Link to="/bookmarks" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#1D2F58]">Bookmarks</Link>
                </li>
                <li>
                  <Link to="/my-files" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#1D2F58]">Your Files</Link>
                </li>
                <li>
                  <Link to="/spaces" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#1D2F58]">Collaboration</Link>
                </li>
                <li>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#1D2F58]">Profile</Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="flex w-full max-w-screen-xl gap-10 px-4">
        {/* Left navigation column - hidden on small and medium screens */}
        <section className="hidden lg:block w-40">
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

        {/* Main content area (provided by caller) - expands when nav is hidden */}
        <main className='flex-1 w-full'>
          {children}
        </main>
      </div>
    </div>
  );
}
