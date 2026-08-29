import React from 'react';

const SEED = [3,7,12,18,11,6,14,22,17,9,5,13,24,19,10,7,16,26,21,12,6,11,20,28,23,14,8,15,25,18,9,5,12,21,16,10,6,13,23,17,8,4,10,19,14,7];

/** Decorative level meter. `lit` is how many bars read as "played". */
export function Wave({ lit = 18, height = 34, color }) {
  return (
    <div className="wave" style={{ height }} aria-hidden>
      {SEED.map((h, i) => (
        <i
          key={i}
          className={i < lit ? 'lit' : ''}
          style={{ height: Math.max(3, h * (height / 34)), background: i < lit && color ? color : undefined }}
        />
      ))}
    </div>
  );
}
