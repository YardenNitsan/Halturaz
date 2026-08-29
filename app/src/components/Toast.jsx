import React from 'react';
import { useStore } from '../store.jsx';

export function Toast() {
  const { toast, dismissToast, dispatch } = useStore();
  if (!toast) return null;

  return (
    <div className="toast" role="status" key={toast.id}>
      <span className="dot" />
      <p>{toast.message}</p>
      {toast.undo && (
        <button
          onClick={() => {
            dispatch({ type: 'restore', events: toast.undo });
            dismissToast();
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}
