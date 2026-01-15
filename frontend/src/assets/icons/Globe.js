import React from 'react';

function Globe({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2C15 6 15 18 12 22" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 2C9 6 9 18 12 22" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
}

export default Globe;
