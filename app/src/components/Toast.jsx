import React from 'react';
import { useStore } from '../store.jsx';
import { useI18n } from '../i18n/index.js';

export function Toast() {
  const { toast, dismissToast, dispatch } = useStore();
  const { t } = useI18n();
  if (!toast) return null;

  return (
    <div className="toast" role="status" key={toast.id}>
      <span className="dot" />
      <p>{toast.message}</p>
      {toast.undo && (
        <button
          onClick={() => {
            dispatch({ type: 'restore', ...toast.undo });
            dismissToast();
          }}
        >
          {t('toast.undo')}
        </button>
      )}
    </div>
  );
}
