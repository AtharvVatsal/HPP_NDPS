import React from 'react';

// HP Police text-based branding placeholder. Swap the SVG in HPLogo for an
// official PNG/SVG when one is provided by replacing this file only.

export const HP_COLORS = {
  navy:     '#1d2a44', // primary
  navyDark: '#141d33',
  khaki:    '#c9a449', // secondary / accent
  ink:      '#1f1a14',
  paper:    '#fdfbf5',
  red:      '#a52521',
};

export const HP_MOTTO = 'सत्यमेव जयते';        // Truth alone triumphs
export const HP_NAME_EN = 'Himachal Pradesh Police';
export const HP_NAME_HI = 'हिमाचल प्रदेश पुलिस';
export const SUB_LINE_EN = 'Letters Generator';

// Simple text-rendered shield-style logo. Sized via the `size` prop in px.
// Square viewBox (48×48) so it scales to any height.
export function HPLogo({ size = 36, ringColor = HP_COLORS.khaki, bodyColor = HP_COLORS.navy, textColor = HP_COLORS.khaki }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Himachal Pradesh Police emblem">
      {/* Shield body */}
      <path
        d="M24 2 L42 8 L42 24 Q42 38 24 46 Q6 38 6 24 L6 8 Z"
        fill={bodyColor}
        stroke={ringColor}
        strokeWidth="1.4"
      />
      {/* Devanagari short form at top */}
      <text x="24" y="15" textAnchor="middle" fontSize="6.4" fontWeight="700" fill={textColor} fontFamily="'Noto Sans Devanagari', system-ui">हि.प्र.</text>
      {/* HP wordmark */}
      <text x="24" y="27" textAnchor="middle" fontSize="13" fontWeight="800" fill={textColor} fontFamily="'IBM Plex Sans', 'Inter', sans-serif" letterSpacing="0.5">HP</text>
      {/* Three Himalayan peaks at base */}
      <path d="M11 36 L17 28 L22 34 L24 31 L26 34 L31 28 L37 36 Z" fill={textColor} opacity="0.95" />
      {/* Subtle inner ring */}
      <path
        d="M24 5 L39 10.5 L39 24 Q39 36 24 43 Q9 36 9 24 L9 10.5 Z"
        fill="none"
        stroke={ringColor}
        strokeWidth="0.4"
        opacity="0.5"
      />
    </svg>
  );
}

// Compact "logo + wordmark" lockup for headers and nav bars.
export function HPLockup({ size = 30, dark = true, sub = SUB_LINE_EN }) {
  const txtMain = dark ? '#f2e9d8' : HP_COLORS.navy;
  const txtSub  = dark ? 'rgba(242,233,216,0.7)' : 'rgba(31,42,68,0.7)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <HPLogo size={size} />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: txtMain, fontFamily: "'IBM Plex Sans', 'Inter', sans-serif" }}>
          {HP_NAME_EN.toUpperCase()}
        </div>
        <div style={{ fontSize: 10, color: txtSub, fontFamily: "'Noto Sans Devanagari', 'IBM Plex Sans', system-ui", marginTop: 1 }}>
          {HP_NAME_HI} {sub && <span>· {sub}</span>}
        </div>
      </div>
    </div>
  );
}

// Bigger emblem block for splash / letterhead.
export function HPMastHead({ stationName, stationAddress }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', borderBottom: `2px solid ${HP_COLORS.navy}` }}>
      <HPLogo size={56} />
      <div style={{ flex: 1, lineHeight: 1.2, fontFamily: "'Libre Caslon Text', 'Cormorant Garamond', Georgia, serif", color: HP_COLORS.ink }}>
        <div style={{ fontSize: 11, color: HP_COLORS.navy, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Government of Himachal Pradesh</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: HP_COLORS.navy, letterSpacing: 0.3 }}>{HP_NAME_EN} <span style={{ fontWeight: 400, color: HP_COLORS.ink }}>· {HP_NAME_HI}</span></div>
        {stationName && (
          <div style={{ fontSize: 12.5, marginTop: 2, color: HP_COLORS.ink }}>
            Office of the Station House Officer, <b>{stationName}</b>{stationAddress && <> &nbsp;·&nbsp; {stationAddress}</>}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', fontFamily: "'Noto Sans Devanagari', system-ui", fontSize: 11, color: HP_COLORS.navy, fontStyle: 'italic' }}>
        {HP_MOTTO}
      </div>
    </div>
  );
}

// Full-page loading splash used by each entry point before React mounts.
// (Rendered as static HTML in index.html / dashboard.html / letters.html so
//  it appears before the JS bundle is even parsed.)
export const SPLASH_HTML = `
<div style="position:fixed;inset:0;background:${HP_COLORS.paper};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'IBM Plex Sans','Inter',system-ui,sans-serif;color:${HP_COLORS.navy};">
  <svg width="72" height="72" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 2 L42 8 L42 24 Q42 38 24 46 Q6 38 6 24 L6 8 Z" fill="${HP_COLORS.navy}" stroke="${HP_COLORS.khaki}" stroke-width="1.4"/>
    <text x="24" y="15" text-anchor="middle" font-size="6.4" font-weight="700" fill="${HP_COLORS.khaki}" font-family="'Noto Sans Devanagari',system-ui">हि.प्र.</text>
    <text x="24" y="27" text-anchor="middle" font-size="13" font-weight="800" fill="${HP_COLORS.khaki}" font-family="'IBM Plex Sans',system-ui" letter-spacing="0.5">HP</text>
    <path d="M11 36 L17 28 L22 34 L24 31 L26 34 L31 28 L37 36 Z" fill="${HP_COLORS.khaki}"/>
  </svg>
  <div style="margin-top:14px;font-size:13px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">${HP_NAME_EN}</div>
  <div style="font-size:11px;color:${HP_COLORS.ink};opacity:0.7;margin-top:2px;font-family:'Noto Sans Devanagari',system-ui;">${HP_NAME_HI}</div>
  <div style="margin-top:18px;font-size:11px;color:${HP_COLORS.navy};opacity:0.55;">Loading NDPS Financial Investigation…</div>
</div>`;
