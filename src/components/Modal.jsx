import React, { useEffect } from 'react';

function Modal({ open, title, onClose, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop open"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        zIndex: 999
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 22,
          boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
          overflow: 'hidden'
        }}
      >
        <div
          className="modal-head"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 14,
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(249,250,251,0.9)'
          }}
        >
          <strong>{title}</strong>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.10)',
              background: 'rgba(255,255,255,0.95)',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: 14, maxHeight: '70vh', overflow: 'auto' }}>
          {children}
        </div>

        {actions ? (
          <div
            className="modal-actions"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 10,
              padding: 14,
              borderTop: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(249,250,251,0.9)'
            }}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
