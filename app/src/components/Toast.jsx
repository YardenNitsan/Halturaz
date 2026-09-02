import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { useI18n } from '../i18n/index.js';

const AXIS = 8;
const DISMISS = 64;
const FLICK = 0.45;
const SETTLE_MS = 220;

function reduceMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function Toast() {
  const { toast, dismissToast, holdToast, releaseToast, dispatch } = useStore();
  const { t } = useI18n();
  const drag = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0, o: 1, mode: 'in' });

  useEffect(() => {
    drag.current = null;
    setPos({ x: 0, y: 0, o: 1, mode: 'in' });
  }, [toast?.id]);

  if (!toast) return null;

  function undo() {
    if (!toast.undo) return;
    dispatch({ type: 'restore', ...toast.undo });
    dismissToast();
  }

  function flyOff(dx, dy) {
    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    const x = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? -w : w) : dx;
    const y = Math.abs(dy) > Math.abs(dx) ? dy + 160 : dy;
    setPos({ x, y, o: 0, mode: 'out' });
    window.setTimeout(() => dismissToast(), reduceMotion() ? 0 : SETTLE_MS);
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest?.('button')) return;
    holdToast();
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      t: e.timeStamp,
      vx: 0,
      vy: 0,
      axis: null,
      moved: false
    };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (d.axis === 'y' && dy < 0) {
        drag.current = null;
        releaseToast();
        return;
      }
      d.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    const dt = e.timeStamp - d.t;
    if (dt > 0) {
      d.vx = (e.clientX - d.x) / dt;
      d.vy = (e.clientY - d.y) / dt;
    }
    d.x = e.clientX;
    d.t = e.timeStamp;
    const x = d.axis === 'x' ? dx : 0;
    const y = d.axis === 'y' ? Math.max(0, dy) : 0;
    const dist = Math.max(Math.abs(x), y);
    setPos({ x, y, o: Math.max(0.28, 1 - dist / 180), mode: 'drag' });
  }

  function onPointerUp(e) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = e.clientX - d.x0;
    const dy = Math.max(0, e.clientY - d.y0);
    const far = d.axis === 'x' ? Math.abs(dx) > DISMISS : dy > DISMISS;
    const flick = d.axis === 'x' ? Math.abs(d.vx) > FLICK : d.vy > FLICK;
    if (d.moved && (far || flick)) {
      flyOff(d.axis === 'x' ? dx : 0, d.axis === 'y' ? dy : 0);
      return;
    }
    setPos({ x: 0, y: 0, o: 1, mode: 'in' });
    releaseToast();
  }

  function onPointerCancel(e) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setPos({ x: 0, y: 0, o: 1, mode: 'in' });
    releaseToast();
  }

  return (
    <div className="toast-host" key={toast.id}>
      <div
        className={'toast' + (pos.mode === 'drag' ? ' is-drag' : '')}
        role="status"
        style={{ '--tx': `${pos.x}px`, '--ty': `${pos.y}px`, '--to': pos.o }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onMouseEnter={holdToast}
        onMouseLeave={() => {
          if (drag.current || pos.mode === 'out') return;
          releaseToast();
        }}
      >
        <span className="dot" />
        <p>{toast.message}</p>
        {toast.undo && (
          <button
            type="button"
            className="toast-undo"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              undo();
            }}
          >
            {t('toast.undo')}
          </button>
        )}
      </div>
    </div>
  );
}
