import React, { useEffect } from 'react';

function Toast({ message, onClear }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClear(), 1800);
    return () => clearTimeout(t);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div
      className="toast show"
      style={{
        position: 'fixed',
        bottom: 14,
        left: 14,
        right: 14,
        margin: '0 auto',
        maxWidth: 420,
        background: 'rgba(17,24,39,0.86)',
        color: '#fff',
        padding: '12px 14px',
        borderRadius: 14,
        boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
        zIndex: 1200,
        fontSize: 14,
        textAlign: 'center'
      }}
    >
      {message}
    </div>
  );
}

export default Toast;
