import React, { useState } from 'react';
import { hue } from '../lib/hues.js';
import { songKey } from '../lib/chords.js';

/** The row's tile: the album cover when the import brought one home, the key
 *  badge otherwise. A cover row carries its key beside the artist instead —
 *  see `.lib-key` in the stylesheet. */
export function SongArt({ song }) {
  const [broken, setBroken] = useState(false);

  if (!song.artwork || broken) {
    const key = songKey(song);
    return <span className={'art' + (song.own ? ' own' : '')} style={hue(key)}>{key}</span>;
  }

  return (
    <span className="art art-cover">
      <img src={song.artwork} alt="" width={42} height={42} loading="lazy" onError={() => setBroken(true)} />
    </span>
  );
}
