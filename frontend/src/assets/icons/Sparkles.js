import React from 'react';

function Sparkles({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
      <path d="M19 15L19.5 17.5L22 18L19.5 18.5L19 21L18.5 18.5L16 18L18.5 17.5L19 15Z" fill="currentColor"/>
      <path d="M5 19L5.5 20.5L7 21L5.5 21.5L5 23L4.5 21.5L3 21L4.5 20.5L5 19Z" fill="currentColor"/>
    </svg>
  );
}

export default Sparkles;
