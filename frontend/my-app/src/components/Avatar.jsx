import React from 'react';
import API from '../api';

// Simple avatar component: shows single-letter initial by default, overlays profile image if provided
export default function Avatar({ user, size = 48, style = {}, className = '' }) {
  const pi = user?.profileImageURL;
  const base = API.defaults.baseURL ? API.defaults.baseURL.replace(/\/api$/, '') : '';
  let avatarSrc = null;
  if (pi) {
    if (/^https?:\/\//i.test(pi) || /^data:/i.test(pi)) avatarSrc = pi;
    else avatarSrc = `${base}${pi}`;
  }

  const rawName = user?.firstName || user?.username || user?.email || 'U';
  const initial = (rawName && rawName[0]) ? String(rawName[0]).toUpperCase() : 'U';

  const containerStyle = {
    position: 'relative',
    width: size,
    height: size,
    ...style,
  };

  const initialsStyle = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#e2e8f0',
    color: '#0b66c3',
    borderRadius: 8,
    fontWeight: 600,
  };

  const imgStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: size,
    height: size,
    objectFit: 'cover',
    borderRadius: 8,
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={initialsStyle}>{initial}</div>
      {avatarSrc && (
        <img src={avatarSrc} alt={user?.username || 'avatar'} style={imgStyle} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
      )}
    </div>
  );
}
