// Client-side mirror of sfh-video-server/src/screenTemplates.js
// Generates identical HTML for storyboard preview

const COLORS = {
  navy: '#0C115B', crimson: '#A61E51', teal: '#0F766E', cream: '#FFFBF7',
  white: '#FFFFFF', pinkLight: '#f9a8c9', warmGray: '#4A4A4A',
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Petrona:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap');`;

const W = 1280, H = 720;

function esc(s: string) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function base(bodyStyle: string, content: string) {
  return `<!DOCTYPE html><html><head><style>${FONTS}*{margin:0;padding:0;box-sizing:border-box;}body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Quicksand',sans-serif;font-weight:600;${bodyStyle}}</style></head><body>${content}</body></html>`;
}

const ICONS = {
  clipboard: `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="${COLORS.crimson}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>`,
  pause: `<svg width="28" height="28" viewBox="0 0 24 24" fill="${COLORS.crimson}" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
  play: `<svg width="48" height="48" viewBox="0 0 24 24" fill="${COLORS.teal}" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>`,
  playWhite: `<svg width="80" height="80" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>`,
  checkTeal: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${COLORS.teal}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  checkWhite: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${COLORS.white}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  switchArrows: `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="${COLORS.crimson}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8l4 4-4 4"/><path d="M2 12h20"/><path d="M6 16l-4-4 4-4"/></svg>`,
};

function dots(cur: number, tot: number) {
  let d = '';
  for (let i=1;i<=tot;i++){
    if(i<cur) d+=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${COLORS.crimson}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin:0 4px;vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>`;
    else if(i===cur) d+=`<svg width="18" height="18" viewBox="0 0 24 24" style="margin:0 4px;vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="${COLORS.navy}"/></svg>`;
    else d+=`<svg width="18" height="18" viewBox="0 0 24 24" style="margin:0 4px;vertical-align:middle;"><circle cx="12" cy="12" r="9" fill="none" stroke="rgba(12,17,91,0.25)" stroke-width="2"/></svg>`;
  }
  return `<div style="background:${COLORS.cream};border-bottom:3px solid rgba(12,17,91,0.08);padding:14px 28px;display:flex;align-items:center;justify-content:space-between;width:100%;"><div style="display:flex;align-items:center;">${d}</div><span style="font-size:22px;font-weight:700;color:${COLORS.navy};">Exercise ${cur} of ${tot}</span></div>`;
}

function tags(t?: string[]) {
  if(!t||!t.length) return '';
  return `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px;">${t.map(x=>`<span style="display:inline-block;background:rgba(15,118,110,0.1);color:${COLORS.teal};font-size:18px;font-weight:700;padding:6px 16px;border-radius:14px;margin:3px 4px;">${esc(x)}</span>`).join('')}</div>`;
}

export function titleCard(name: string, count: number, dur: string, subtitle?: string, level?: string, condition?: string) {
  return base(
    `background:linear-gradient(135deg,${COLORS.navy} 0%,${COLORS.crimson} 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;`,
    `<p style="font-size:22px;letter-spacing:4px;color:rgba(255,255,255,0.8);font-weight:700;text-transform:uppercase;">SENIOR FITNESS <span style="color:${COLORS.pinkLight};">HUB</span></p>
    <div style="width:240px;height:2px;background:rgba(255,255,255,0.3);margin:20px 0;"></div>
    ${level?`<span style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:${COLORS.white};font-size:20px;font-weight:700;padding:8px 24px;border-radius:24px;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;">${esc(level)}</span>`:''}
    <h1 style="font-family:Petrona,Georgia,serif;font-size:62px;font-weight:700;color:${COLORS.white};line-height:1.15;margin-bottom:16px;">${esc(name)}</h1>
    ${subtitle?`<p style="font-size:30px;color:rgba(255,255,255,0.85);font-weight:600;font-style:italic;margin-bottom:16px;max-width:85%;">${esc(subtitle)}</p>`:''}
    <p style="font-size:28px;color:rgba(255,255,255,0.9);font-weight:700;">${count} Exercises &middot; ${esc(dur)}</p>
    ${condition?`<span style="display:inline-block;background:rgba(15,118,110,0.8);color:${COLORS.white};font-size:22px;font-weight:700;padding:10px 28px;border-radius:24px;margin-top:12px;">${esc(condition)}</span>`:''}
    <div style="width:240px;height:2px;background:rgba(255,255,255,0.3);margin:20px 0;"></div>
    <p style="font-size:20px;color:rgba(255,255,255,0.5);font-weight:700;margin-top:16px;">Practice with purpose. Move with confidence. Live with independence.</p>`
  );
}

export function trackerReminder() {
  return base(
    `background:${COLORS.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;`,
    `<div style="width:100px;height:100px;border-radius:50%;background:rgba(166,30,81,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:24px;">${ICONS.clipboard}</div>
    <h2 style="font-family:Petrona,Georgia,serif;font-size:48px;font-weight:700;color:${COLORS.navy};margin-bottom:6px;">Haven't Downloaded Your</h2>
    <h2 style="font-family:Petrona,Georgia,serif;font-size:48px;font-weight:700;color:${COLORS.navy};">Progress Tracker Yet?</h2>
    <div style="width:80px;height:4px;background:${COLORS.crimson};border-radius:2px;margin:24px auto;"></div>
    <p style="font-size:32px;color:${COLORS.crimson};font-weight:700;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:12px;">${ICONS.pause} Pause the video now</p>
    <p style="font-size:24px;color:${COLORS.warmGray};font-weight:700;">Download your tracker and follow along.</p>`
  );
}

export function equipment(items?: string[]) {
  const list = items || ['Exercise mat or firm surface','Sturdy chair without wheels','Wall space for support','Comfortable, non-slip footwear'];
  const bullet = `<svg width="16" height="16" viewBox="0 0 24 24" style="flex-shrink:0;margin-right:20px;"><circle cx="12" cy="12" r="8" fill="${COLORS.crimson}"/></svg>`;
  return base(
    `background:${COLORS.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;`,
    `<h2 style="font-family:Petrona,Georgia,serif;font-size:60px;font-weight:700;color:${COLORS.navy};margin-bottom:44px;">Equipment Needed</h2>
    <div style="border-left:6px solid ${COLORS.teal};padding-left:36px;"><ul style="list-style:none;padding:0;margin:0;">${list.map(i=>`<li style="font-size:42px;color:${COLORS.navy};font-weight:700;padding:18px 0;display:flex;align-items:center;">${bullet}${esc(i)}</li>`).join('')}</ul></div>
    <div style="position:absolute;bottom:28px;"><p style="font-size:24px;letter-spacing:5px;color:rgba(12,17,91,0.4);font-weight:700;text-transform:uppercase;">SENIOR FITNESS <span style="color:${COLORS.crimson};">HUB</span></p></div>`
  );
}

export function letsGo() {
  return base(
    `background:linear-gradient(135deg,${COLORS.navy} 0%,${COLORS.crimson} 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;`,
    `<h1 style="font-family:Petrona,Georgia,serif;font-size:60px;font-weight:700;color:${COLORS.white};">Let's Get Started!</h1>
    <p style="font-size:28px;color:rgba(255,255,255,0.8);font-weight:700;margin-top:16px;">Follow along at your own pace.</p>
    <div style="margin-top:32px;">${ICONS.playWhite}</div>`
  );
}

export function watchLearn(exNum: number, total: number, name: string, timeDisplay: string, cue?: string, tagsList?: string[], focus?: string, posType?: string, imageUrl?: string) {
  return base(`display:flex;flex-direction:column;`,
    `${dots(exNum,total)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 40px;background:${COLORS.cream};">
      <span style="background:${COLORS.crimson};color:${COLORS.white};font-size:22px;font-weight:700;padding:10px 28px;border-radius:24px;margin-bottom:16px;">Exercise ${exNum} of ${total}</span>
      ${posType?`<span style="display:inline-block;background:rgba(12,17,91,0.08);color:${COLORS.navy};font-size:18px;font-weight:700;padding:6px 18px;border-radius:14px;margin-bottom:12px;text-transform:uppercase;">${esc(posType)}</span>`:''}
      <h2 style="font-family:Petrona,Georgia,serif;font-size:34px;font-weight:700;color:${COLORS.navy};margin-bottom:12px;">Watch and Learn</h2>
      <h3 style="font-family:Petrona,Georgia,serif;font-size:40px;font-weight:700;color:${COLORS.navy};margin-bottom:16px;text-align:center;">${esc(name)}</h3>
      ${imageUrl?`<img src="${imageUrl}" style="width:480px;height:280px;object-fit:cover;border-radius:14px;margin-bottom:16px;box-shadow:0 4px 16px rgba(0,0,0,0.1);" />`:''}
      <span style="background:${COLORS.teal};color:${COLORS.white};font-size:24px;font-weight:700;padding:10px 28px;border-radius:24px;margin-bottom:14px;">${esc(timeDisplay)}</span>
      ${tags(tagsList)}
      ${focus?`<p style="font-size:24px;color:${COLORS.warmGray};font-weight:600;margin-top:14px;max-width:85%;text-align:center;line-height:1.4;">${esc(focus)}</p>`:''}
      ${cue?`<div style="border-left:5px solid ${COLORS.crimson};background:rgba(166,30,81,0.05);padding:12px 20px;border-radius:0 10px 10px 0;margin-top:16px;max-width:90%;"><p style="font-size:24px;color:${COLORS.navy};font-weight:700;text-align:center;">"${esc(cue)}"</p></div>`:''}</div>`
  );
}

export function videoPlay(name: string, imageUrl?: string) {
  return base(`background:#111;display:flex;align-items:center;justify-content:center;`,
    `${imageUrl?`<img src="${imageUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.3;" />`:''}
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>
      </div>
      <p style="font-size:24px;color:white;font-weight:700;">${esc(name)}</p>
      <p style="font-size:18px;color:rgba(255,255,255,0.5);font-weight:700;margin-top:8px;">Instruction Video</p>
    </div>`
  );
}

export function yourTurn(exNum: number, total: number, name: string, timeDisplay: string, cue?: string, bilateral?: boolean, side?: string, tagsList?: string[], focus?: string, posType?: string) {
  return base(`display:flex;flex-direction:column;`,
    `${dots(exNum,total)}
    <div style="flex:1;background:${COLORS.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 40px;">
      <div style="width:84px;height:84px;border-radius:50%;background:rgba(15,118,110,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:20px;">${ICONS.play}</div>
      ${posType?`<span style="display:inline-block;background:rgba(12,17,91,0.08);color:${COLORS.navy};font-size:18px;font-weight:700;padding:6px 18px;border-radius:14px;margin-bottom:12px;text-transform:uppercase;">${esc(posType)}</span>`:''}
      <h2 style="font-family:Petrona,Georgia,serif;font-size:44px;font-weight:700;color:${COLORS.navy};margin-bottom:16px;">Now It's Your Turn!</h2>
      <h3 style="font-family:Petrona,Georgia,serif;font-size:34px;font-weight:700;color:${COLORS.navy};margin-bottom:16px;">${esc(name)}</h3>
      <span style="background:${COLORS.teal};color:${COLORS.white};font-size:24px;font-weight:700;padding:10px 28px;border-radius:10px;margin-bottom:14px;">${esc(timeDisplay)}</span>
      ${bilateral?`<span style="background:${COLORS.crimson};color:${COLORS.white};font-size:22px;font-weight:700;padding:10px 28px;border-radius:24px;margin-bottom:14px;">Starting: ${(side||'RIGHT').toUpperCase()} SIDE</span>`:''}
      ${tags(tagsList)}
      ${cue?`<div style="background:${COLORS.crimson};padding:14px 28px;border-radius:10px;margin-top:16px;max-width:85%;"><p style="font-size:24px;color:${COLORS.white};font-weight:700;text-align:center;">"${esc(cue)}"</p></div>`:''}
      ${focus?`<p style="font-size:22px;color:${COLORS.warmGray};font-weight:600;font-style:italic;margin-top:12px;max-width:80%;text-align:center;line-height:1.4;">${esc(focus)}</p>`:''}</div>`
  );
}

export function practiceFrame(exNum: number, total: number, name: string, imageUrl?: string, cue?: string, timeDisplay?: string, side?: string) {
  return base(`display:flex;flex-direction:column;`,
    `${dots(exNum,total)}
    <div style="flex:1;background:${COLORS.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 40px;position:relative;">
      ${side?`<span style="position:absolute;top:20px;right:24px;background:${COLORS.crimson};color:${COLORS.white};font-size:24px;font-weight:700;padding:10px 28px;border-radius:24px;">${side.toUpperCase()} SIDE</span>`:''}
      <p style="font-family:Petrona,Georgia,serif;font-size:36px;font-weight:700;color:${COLORS.navy};margin-bottom:14px;">${esc(name)}</p>
      <div style="display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
        ${imageUrl?`<img src="${imageUrl}" style="max-width:800px;max-height:460px;object-fit:contain;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,0.1);" />`:`<span style="font-size:20px;color:rgba(12,17,91,0.3);font-weight:700;">NO IMAGE</span>`}
      </div>
      <span style="background:${COLORS.teal};color:${COLORS.white};font-size:24px;font-weight:700;padding:10px 28px;border-radius:24px;">${esc(timeDisplay||'')}</span>
      ${cue?`<p style="font-size:28px;color:${COLORS.crimson};font-weight:700;margin-top:16px;text-align:center;max-width:85%;">"${esc(cue)}"</p>`:''}
      <p style="position:absolute;bottom:10px;font-size:18px;letter-spacing:3px;color:rgba(12,17,91,0.25);font-weight:700;text-transform:uppercase;">SENIOR FITNESS <span style="color:${COLORS.crimson};">HUB</span></p>
    </div>`
  );
}

export function switchSides(exNum: number, total: number, name: string, secondSide: string) {
  return base(`display:flex;flex-direction:column;`,
    `${dots(exNum,total)}
    <div style="flex:1;background:${COLORS.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 40px;">
      <div style="width:84px;height:84px;border-radius:50%;background:rgba(166,30,81,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:22px;">${ICONS.switchArrows}</div>
      <h2 style="font-family:Petrona,Georgia,serif;font-size:50px;font-weight:700;color:${COLORS.navy};margin-bottom:18px;">Switch Sides</h2>
      <span style="background:${COLORS.crimson};color:${COLORS.white};font-size:24px;font-weight:700;padding:10px 30px;border-radius:24px;">Now: ${(secondSide||'LEFT').toUpperCase()} SIDE</span>
      ${name?`<p style="font-size:24px;color:${COLORS.navy};font-weight:700;margin-top:18px;">${esc(name)}</p>`:''}</div>`
  );
}

export function exerciseComplete(exNum: number, total: number, name: string, nextName?: string, nextPos?: string) {
  const nextHTML = nextName
    ? `<div style="text-align:center;"><p style="font-size:24px;color:${COLORS.warmGray};font-weight:700;">Next Up:</p><p style="font-size:30px;color:${COLORS.navy};font-weight:700;margin-top:8px;">${esc(nextName)}</p>${nextPos?`<span style="display:inline-block;background:rgba(12,17,91,0.08);color:${COLORS.navy};font-size:18px;font-weight:700;padding:6px 18px;border-radius:14px;margin-top:10px;text-transform:uppercase;">${esc(nextPos)}</span>`:''}</div>`
    : `<p style="font-size:30px;color:${COLORS.crimson};font-weight:700;">Routine Complete!</p>`;
  return base(`display:flex;flex-direction:column;`,
    `${dots(exNum,total)}
    <div style="flex:1;background:${COLORS.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 40px;">
      <div style="width:84px;height:84px;border-radius:50%;background:rgba(15,118,110,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:18px;">${ICONS.checkTeal}</div>
      <h2 style="font-family:Petrona,Georgia,serif;font-size:40px;font-weight:700;color:${COLORS.crimson};margin-bottom:12px;">Exercise ${exNum} Complete!</h2>
      <p style="font-size:28px;color:${COLORS.navy};font-weight:700;margin-bottom:12px;">${esc(name)}</p>
      <div style="width:80px;height:4px;background:${COLORS.crimson};border-radius:2px;margin:16px auto;"></div>
      ${nextHTML}</div>`
  );
}

export function outro(name: string, count: number, dur: string, level?: string, condition?: string) {
  return base(
    `background:linear-gradient(135deg,${COLORS.navy} 0%,${COLORS.crimson} 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;`,
    `<div style="width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;margin-bottom:22px;">${ICONS.checkWhite}</div>
    <h1 style="font-family:Petrona,Georgia,serif;font-size:54px;font-weight:700;color:${COLORS.white};margin-bottom:16px;">Routine Complete!</h1>
    ${level?`<span style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:${COLORS.white};font-size:18px;font-weight:700;padding:6px 22px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;">${esc(level)}</span>`:''}
    <p style="font-size:28px;color:rgba(255,255,255,0.9);font-weight:700;margin-bottom:8px;">${esc(name)}</p>
    <p style="font-size:26px;color:${COLORS.white};font-weight:700;margin-bottom:8px;">${count} exercises &middot; ${esc(dur)}</p>
    ${condition?`<p style="font-size:24px;color:rgba(255,255,255,0.85);font-weight:600;font-style:italic;margin-bottom:12px;">Building your ${esc(condition.toLowerCase())}, one session at a time.</p>`:''}
    <p style="font-size:24px;color:rgba(255,255,255,0.8);font-weight:700;margin-bottom:20px;">Great work today. Consistency builds confidence.</p>
    <div style="width:240px;height:2px;background:rgba(255,255,255,0.3);margin:16px 0;"></div>
    <p style="font-size:20px;letter-spacing:4px;color:rgba(255,255,255,0.8);font-weight:700;text-transform:uppercase;">SENIOR FITNESS <span style="color:${COLORS.pinkLight};">HUB</span></p>
    <p style="font-size:20px;color:rgba(255,255,255,0.5);font-weight:700;margin-top:16px;">Practice with purpose. Move with confidence. Live with independence.</p>`
  );
}
