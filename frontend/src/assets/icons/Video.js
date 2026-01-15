import React from 'react';

function Video({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 10L18.5 7.5V16.5L15 14V10Z" fill="currentColor"/>
      <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
}

export default Video;
