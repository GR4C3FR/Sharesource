import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { cn } from '../lib/utils';
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

  // keep body class in sync with mobile nav open state (styling-only, no logic change)
  useEffect(() => {
    try {
      if (mobileOpen) document.body.classList.add('mobile-nav-open');
      else document.body.classList.remove('mobile-nav-open');
    } catch (err) {
      // ignore
    }
    return () => {
      try { document.body.classList.remove('mobile-nav-open'); } catch (e) {}
    };
  }, [mobileOpen]);

  return (
  <div className="w-full flex flex-col items-center justify-center overflow-x-hidden bg-[#F8F8FF] min-h-screen">
  {/* Phone-style fixed header (show on small screens and when zoomed up to lg) */}
  <div className="fixed inset-x-0 top-0 z-50 block lg:hidden bg-white border-b border-gray-200">
        <div className="mx-auto max-w-screen-xl px-4 h-14 flex items-center justify-between">
          <button
            aria-label="ShareSource Home"
            onClick={() => {
              const t = localStorage.getItem('accessToken');
              if (t) navigate('/homepage');
              else navigate('/');
            }}
            className={cn('p-0 bg-transparent border-0 cursor-pointer', 'order-2 lg:order-1')}
          >
            <img src="/sharessource-logo.png" alt="ShareSource Logo" className={`${token ? 'w-10' : 'w-9'} h-auto`} />
          </button>

          <button
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className={cn('p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#103E93] bg-transparent', 'order-1 lg:order-2')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 transform transition-transform duration-200 ${mobileOpen ? 'rotate-90' : 'rotate-0'}`}>
              <path d="M4 7H20" stroke="#1D2F58" strokeWidth="3" strokeLinecap="round" />
              <path d="M4 12H20" stroke="#1D2F58" strokeWidth="3" strokeLinecap="round" />
              <path d="M4 17H20" stroke="#1D2F58" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      {/* Header */}
      <div className="w-full max-w-screen-xl flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 pt-6 pb-2 px-4 mb-15 relative">
        {/* Logo Section (visible on sm+; hidden on phones because we added a fixed phone header) */}
        <section className="flex items-center justify-start gap-4 w-full lg:w-auto">
          <button
            aria-label="ShareSource Home"
            onClick={() => {
              const t = localStorage.getItem('accessToken');
              if (t) navigate('/homepage');
              else navigate('/');
            }}
            className="p-0 bg-transparent border-0 cursor-pointer hidden lg:block"
          >
            <img src="/sharessource-logo.png" alt="ShareSource Logo" className={`${token ? 'w-12 sm:w-20 md:w-28 lg:w-[100px]' : 'w-10 sm:w-16 md:w-24 lg:w-[90px]'} h-auto`} />
          </button>
        </section>

        {/* Buttons Section (avatar visible starting at lg) */}
  <section className="flex flex-row items-center justify-start gap-8 md:gap-10 lg:gap-6 lg:ml-4 mt-3 lg:mt-0 w-full lg:w-auto">
          {profile !== null && (
            <div onClick={() => navigate('/profile')} className="hidden lg:flex cursor-pointer transform scale-110 md:scale-125 lg:scale-100 origin-left">
              <Avatar user={profile} size={42} />
            </div>
          )}

          {/* header logout: hide on small screens (moved into mobile nav) */}
          <button onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('userEmail'); navigate('/'); }} className="hidden lg:inline-flex bg-transparent border-0 cursor-pointer p-1 md:p-2 rounded">
            <img src="/logout-icon.png" alt="logout" className="w-8 h-8 md:w-9 md:h-9 lg:w-7 lg:h-7" />
          </button>
      </section>

      </div>

      {/* Mobile overlay nav: fixed at top, appears above everything when open */}
      <div className={`lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileOpen(false)} />

        <div className={`fixed inset-0 left-0 top-0 z-50 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="bg-[#F8F8FF] w-full h-full shadow-sm p-6 relative">
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

            <ul className="flex flex-col gap-6 mt-8">
              <li>
                <Link to="/homepage" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 text-lg md:text-xl text-[#1D2F58] px-4 py-3 rounded-lg hover:bg-gray-50">
                  <img src="/dashboard-logo.png" alt="dashboard" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </li>
              {profile?.role !== 'Admin' && (
                <>
                  <li>
                    <Link to="/bookmarks" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 text-lg md:text-xl text-[#1D2F58] px-4 py-3 rounded-lg hover:bg-gray-50">
                      <img src="/bookmarks-logo.png" alt="bookmarks" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                      <span className="font-medium">Bookmarks</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-files" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 text-lg md:text-xl text-[#1D2F58] px-4 py-3 rounded-lg hover:bg-gray-50">
                      <img src="/yourfiles-logo.png" alt="your files" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                      <span className="font-medium">Your Files</span>
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/spaces" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 text-lg md:text-xl text-[#1D2F58] px-4 py-3 rounded-lg hover:bg-gray-50">
                  <img src="/collaborate-logo.png" alt="collaboration" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                  <span className="font-medium">Collaboration</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 text-lg md:text-xl text-[#1D2F58] px-4 py-3 rounded-lg hover:bg-gray-50">
                  <img src="/profile-logo.png" alt="profile" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                  <span className="font-medium">Profile</span>
                </Link>
              </li>
            </ul>

            {/* Mobile logout placed at the bottom of the nav panel */}
            <div className="absolute left-0 right-0 bottom-6 px-6">
              <button
                onClick={() => { localStorage.removeItem('accessToken'); localStorage.removeItem('userEmail'); setMobileOpen(false); navigate('/'); }}
                aria-label="Logout"
                className="w-14 h-14 mx-auto flex items-center justify-center rounded-full text-white shadow-md"
              >
                <img src="/logout-icon.png" alt="logout" className="w-6 h-6" />
              </button>
            </div>
          </nav>
        </div>
      </div>

        <div className="flex w-full max-w-screen-xl gap-10 px-4">
        {/* Left navigation column - hidden on small and medium screens */}
        <section className="hidden lg:block w-40">
          <section className="w-max h-auto flex flex-col justify-center mb-8 min-w-0">
            {/* Dynamic page title based on current route */}
            <h1 className="text-2xl md:text-3xl font-inter font-bold text-[#1D2F58]">{pageTitle}</h1>
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
