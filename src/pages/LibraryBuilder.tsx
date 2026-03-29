// @ts-nocheck
import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
// SFH Video Library Builder — MVP
// ═══════════════════════════════════════════════

interface Routine {
  id: string;
  name: string;
  mvCode: string;
}

interface Module {
  id: string;
  name: string;
  routines: Routine[];
}

interface Program {
  id: string;
  name: string;
  subtitle: string;
  modules: Module[];
}

const STORAGE_KEY = "sfh-lib-builder-v1";

const MODULE_COLORS = [
  { bg: "#e8f5e9", border: "#2E7D32", text: "#1b5e20" },
  { bg: "#ede7f6", border: "#4A148C", text: "#4A148C" },
  { bg: "#e3f2fd", border: "#0D47A1", text: "#0d47a1" },
  { bg: "#fce4ec", border: "#C62828", text: "#C62828" },
  { bg: "#fff3e0", border: "#E65100", text: "#E65100" },
  { bg: "#e0f2f1", border: "#00695C", text: "#00695C" },
  { bg: "#f3e5f5", border: "#6A1B9A", text: "#6A1B9A" },
  { bg: "#e8eaf6", border: "#283593", text: "#283593" },
  { bg: "#fdf2f5", border: "#A61E51", text: "#A61E51" },
  { bg: "#f5f5f5", border: "#0C115B", text: "#0C115B" },
];

const DEFAULT_PROGRAMS = [
  { id: "sib", name: "STEP into Balance — Video Library", subtitle: "Your complete follow-along routine collection", modules: [] },
];

// ─── Helpers ───

function esc(t) {
  return (t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getColor(i) {
  return MODULE_COLORS[i % MODULE_COLORS.length];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── MV Code extraction ───

function extractVimeoSrc(code) {
  const m = code.match(/<iframe[^>]+src="([^"]*)"[^>]*>/i);
  return m ? m[1] : "about:blank";
}

function extractTrackerScript(code) {
  const m = code.match(/<script>([\s\S]*?)<\/script>/i) || code.match(/<script>([\s\S]*?)<\\\/script>/i);
  return m ? m[1].trim() : "";
}

// Extract exercise count from tracker script rows array
function extractExerciseCount(code) {
  const script = extractTrackerScript(code);
  if (!script) return "";
  // Count unique exercise names (not bilateral duplicates)
  const rowMatches = script.match(/\{\s*name\s*:/g);
  if (!rowMatches) return "";
  const total = rowMatches.length;
  // Count bilateral sides (left entries usually have empty instruction)
  const leftMatches = script.match(/side\s*:\s*'left'/g);
  const unique = leftMatches ? total - leftMatches.length : total;
  return `${unique} exercises`;
}

// Extract duration from tracker script
function extractDuration(code) {
  const script = extractTrackerScript(code);
  if (!script) return "";
  const m = script.match(/var\s+duration\s*=\s*'([^']*)'/);
  return m ? m[1] : "";
}

function renameTracker(script, id) {
  if (!script) return "";
  // Rename function declaration to window assignment (needed for eval scope)
  let out = script.replace(/function\s+generateTracker\s*\(/g, `window.generateTracker_${id}=function(`);
  // Rename any internal calls
  out = out.replace(/generateTracker\s*\(/g, `generateTracker_${id}(`);
  // Fix URL scope for nested eval — bare URL doesn't resolve, needs window.URL
  out = out.replace(/\bURL\.createObjectURL\b/g, '(window.URL||window.webkitURL).createObjectURL');
  out = out.replace(/\bURL\.revokeObjectURL\b/g, '(window.URL||window.webkitURL).revokeObjectURL');
  return out;
}

// ─── Library HTML Assembly ───

function assembleHTML(program) {
  const { name, subtitle, modules } = program;
  const totalRoutines = modules.reduce((s, m) => s + m.routines.length, 0);
  const totalModules = modules.filter(m => m.routines.length > 0).length;
  const date = new Date().toISOString().split("T")[0];

  const filterPills = modules.map((mod, mi) => {
    const c = getColor(mi);
    return `    <button onclick="sfhVLOpen(${mi})" style="padding:8px 16px;border-radius:20px;font-size:14px;font-weight:700;border:2px solid ${c.border};color:${c.text};background:#fff;cursor:pointer;font-family:'Quicksand',sans-serif;">${esc(mod.name)}</button>`;
  }).join("\n");

  // Tracker scripts: base64 into hidden inputs (contains HTML strings that break MV parser)
  // Toggle functions: raw in hidden div (clean JS, no HTML strings)
  const trackerInputs = [];
  const moduleBlocks = modules.map((mod, mi) => {
    const c = getColor(mi);
    const count = mod.routines.length;
    const countLabel = count === 1 ? "1 routine" : `${count} routines`;

    const routineRows = mod.routines.map((r, ri) => {
      const rid = `${mi}_${ri}`;
      const vimeoSrc = extractVimeoSrc(r.mvCode);
      const ts = extractTrackerScript(r.mvCode);
      const renamed = renameTracker(ts, rid);
      if (renamed) {
        try {
          const encoded = btoa(unescape(encodeURIComponent(renamed)));
          trackerInputs.push({ id: `sfhVL-tk-${rid}`, value: encoded });
        } catch(e) { console.error('Base64 encode error', rid, e); }
      }

      const exCount = extractExerciseCount(r.mvCode);
      const duration = extractDuration(r.mvCode);
      const metaParts = [exCount, duration].filter(Boolean);
      const metaHtml = metaParts.length > 0
        ? `<span style="font-size:14px;font-weight:600;color:#444;margin-left:8px;">${esc(metaParts.join(' \u00B7 '))}</span>`
        : '';

      return `      <div style="border:1px solid #e0e0e0;border-radius:10px;margin-bottom:8px;overflow:hidden;background:#fff;">
        <button onclick="sfhVLToggleR('${rid}')" style="width:100%;padding:14px 16px;background:#FAFAFA;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:'Quicksand',sans-serif;font-size:16px;font-weight:700;color:#0C115B;text-align:left;">
          <span style="flex:1;">${esc(r.name)}${metaHtml}</span>
          <span id="sfhVL-ra-${rid}" style="color:#A61E51;font-size:20px;font-weight:700;flex-shrink:0;margin-left:10px;">+</span>
        </button>
        <div id="sfhVL-rb-${rid}" style="display:none;">
          <div style="margin:12px 12px 0 12px;">
            <div style="background:linear-gradient(135deg,#0C115B,#A61E51);color:white;padding:8px 14px;border-radius:10px 10px 0 0;text-align:center;">
              <p style="margin:0;font-size:16px;font-weight:700;font-family:'Petrona',Georgia,serif;">Press Play &amp; Follow Along</p>
            </div>
            <div style="position:relative;padding-bottom:56.25%;height:0;background:#000;">
              <iframe id="sfhVL-if-${rid}" data-src="${esc(vimeoSrc)}" src="about:blank" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe>
            </div>
            <div style="background:#f5f5f5;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 10px 10px;padding:8px 14px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#444;font-weight:600;">Pause anytime you need. Your pace, your practice.</p>
            </div>
          </div>
          <div style="margin:10px 12px;background:#e3f2fd;border-left:4px solid #0d47a1;border-radius:0 10px 10px 0;padding:12px 14px;">
            <p style="margin:0;font-size:14px;color:#0d47a1;font-weight:700;line-height:1.5;">Follow-along videos are longer because they include video instructions for every exercise. Once you know the exercises, you can be done in under 10 minutes using the PDF tracker below.</p>
          </div>
          <div style="margin:0 12px 12px 12px;background:#FFFFFF;border:1.5px solid #e0e0e0;border-radius:10px;padding:10px 12px;text-align:center;">
            <button onclick="generateTracker_${rid}()" style="background:linear-gradient(135deg,#0C115B 0%,#A61E51 100%);border:none;color:#ffffff;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Quicksand',sans-serif;min-height:44px;width:100%;max-width:360px;line-height:1.5;">
              <span style="display:block;font-size:14px;font-weight:700;">&#x2193; Download 1-Week Progress Tracker</span>
              <span style="display:block;font-size:14px;font-weight:600;margin-top:2px;opacity:0.9;">Best on desktop</span>
            </button>
          </div>
        </div>
      </div>`;
    }).join("\n");

    return `    <div id="sfhVL-mod-${mi}" style="margin-bottom:12px;">
      <button onclick="sfhVLToggleM(${mi})" style="width:100%;padding:16px 20px;background:${c.bg};border:none;border-left:5px solid ${c.border};cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-radius:10px;font-family:'Quicksand',sans-serif;">
        <span style="text-align:left;">
          <span style="font-size:18px;font-weight:700;color:${c.text};font-family:'Petrona',Georgia,serif;">${esc(mod.name)}</span>
          <span style="font-size:14px;font-weight:600;color:#444;margin-left:10px;">${countLabel}</span>
          <span id="sfhVL-mh-${mi}" style="display:block;font-size:14px;font-weight:600;color:#A61E51;margin-top:4px;">Tap to see routines</span>
        </span>
        <span id="sfhVL-ma-${mi}" style="color:#A61E51;font-size:24px;font-weight:700;flex-shrink:0;">+</span>
      </button>
      <div id="sfhVL-mb-${mi}" style="display:none;padding:10px 0 0 0;">
${routineRows}
      </div>
    </div>`;
  }).join("\n\n");

  const subtitleHtml = subtitle ? `\n    <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:8px 0 0 0;font-weight:600;">${esc(subtitle)}</p>` : "";

  // Hidden inputs for tracker scripts (base64 encoded — contains HTML strings MV would break)
  const hiddenInputsHTML = trackerInputs.map(t => 
    `<input type="hidden" id="${t.id}" value="${t.value}">`
  ).join("\n");

  return `<!-- VIDEO LIBRARY: ${name} -->
<!-- ${totalRoutines} routines across ${totalModules} modules | Generated: ${date} -->

<p></p>
<div style="font-family:'Quicksand','Segoe UI',sans-serif;max-width:900px;margin:0 auto;padding:20px;background:#FFFBF7;font-weight:600;">

  <div style="background:linear-gradient(135deg,#0C115B 0%,#A61E51 100%);border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;">
    <h1 style="font-family:'Petrona',Georgia,serif;color:white;font-size:30px;font-weight:700;margin:0;">${esc(name)}</h1>${subtitleHtml}
    <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:14px;">
      <span style="background:rgba(255,255,255,0.2);color:white;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:700;">${totalRoutines} Routines</span>
      <span style="background:rgba(255,255,255,0.2);color:white;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:700;">${totalModules} Modules</span>
    </div>
  </div>

  <div style="background:#FFFBF7;border:2px solid #e0d6cc;border-radius:10px;padding:14px 18px;margin-bottom:20px;text-align:center;">
    <p style="font-size:15px;color:#1a1a1a;line-height:1.6;margin:0 0 6px 0;font-weight:600;">Open a module below, pick a routine, and press play to follow along. Each routine includes a downloadable 1-Week Progress Tracker you can print and use to check off exercises as you go.</p>
    <p style="font-size:14px;color:#A61E51;line-height:1.5;margin:0;font-weight:700;">Once you know the exercises well, the tracker alone is all you need to complete your routine in under 10 minutes.</p>
  </div>

  <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:20px;">
${filterPills}
  </div>

${moduleBlocks}

  <div style="text-align:center;padding:24px 20px;margin-top:24px;border-top:1px solid #e0e0e0;">
    <p style="font-family:'Petrona',Georgia,serif;color:#0C115B;font-size:16px;font-weight:700;margin:0 0 4px 0;">SENIOR FITNESS <span style="color:#A61E51;">HUB</span></p>
    <p style="color:#444;font-size:14px;font-weight:600;margin:0;">Practice with purpose. Move with confidence. Live with independence.</p>
  </div>

</div>
<!-- Tracker data (base64 encoded — MV treats as form inputs) -->
${hiddenInputsHTML}
<!-- JS ENGINE (matches SIB Program Library pattern) -->
<div style="display: none;"><img src="https://learn.senior-fitness-hub.com/admin/lessons/edit/x" onerror="if(!window.sfhVLInit){window.sfhVLInit=true;try{eval(document.getElementById('sfhVLJS').textContent);}catch(e){}}" /></div>
<details style="display: none;" open ontoggle="if(!window.sfhVLInit){window.sfhVLInit=true;try{eval(document.getElementById('sfhVLJS').textContent);}catch(e){}}"></details>
<div id="sfhVLJS" style="display: none;">
window.sfhVLInit=true;
var sfhVLMods=[${modules.map((_,i) => i).join(',')}];
var sfhVLBusy=false;

function sfhVLGetEl(id){try{return document.getElementById(id);}catch(e){return null;}}

function sfhVLSetMod(mi,show){
  var body=sfhVLGetEl('sfhVL-mb-'+mi);
  var arrow=sfhVLGetEl('sfhVL-ma-'+mi);
  var hint=sfhVLGetEl('sfhVL-mh-'+mi);
  if(body){body.style.display=show?'block':'none';}
  if(arrow){arrow.textContent=show?'\\u2212':'+';}
  if(hint){hint.style.display=show?'none':'block';}
}

window.sfhVLToggleM=function(mi){
  if(sfhVLBusy)return;
  sfhVLBusy=true;
  try{
    var isOpen=false;
    var body=sfhVLGetEl('sfhVL-mb-'+mi);
    if(body){isOpen=(body.style.display==='block');}
    for(var i=0;i<sfhVLMods.length;i++){
      sfhVLSetMod(sfhVLMods[i],false);
    }
    if(!isOpen){sfhVLSetMod(mi,true);}
  }catch(e){}
  setTimeout(function(){sfhVLBusy=false;},150);
};

window.sfhVLToggleR=function(uid){
  var c=sfhVLGetEl('sfhVL-rb-'+uid);
  var a=sfhVLGetEl('sfhVL-ra-'+uid);
  var iframe=sfhVLGetEl('sfhVL-if-'+uid);
  if(!c)return;
  if(c.style.display==='none'){
    var p=c.parentElement.parentElement;
    if(p){
      var sibs=p.querySelectorAll('[id^="sfhVL-rb-"]');
      for(var i=0;i<sibs.length;i++){
        if(sibs[i]!==c&&sibs[i].style.display!=='none'){
          sibs[i].style.display='none';
          var si=sibs[i].querySelector('iframe');
          if(si)si.src='about:blank';
          var sid=sibs[i].id.replace('sfhVL-rb-','');
          var sa=sfhVLGetEl('sfhVL-ra-'+sid);
          if(sa)sa.textContent='+';
        }
      }
    }
    c.style.display='block';
    if(a)a.textContent='\\u2212';
    if(iframe&&iframe.getAttribute('data-src')){
      iframe.src=iframe.getAttribute('data-src');
    }
  }else{
    c.style.display='none';
    if(a)a.textContent='+';
    if(iframe)iframe.src='about:blank';
  }
};

window.sfhVLOpen=function(mi){
  if(sfhVLBusy)return;
  sfhVLBusy=true;
  try{
    for(var i=0;i<sfhVLMods.length;i++){
      sfhVLSetMod(sfhVLMods[i],(sfhVLMods[i]===mi));
    }
  }catch(e){}
  setTimeout(function(){sfhVLBusy=false;},150);
};

var tkI=document.querySelectorAll('input[id^="sfhVL-tk-"]');
for(var t=0;t<tkI.length;t++){try{eval(decodeURIComponent(escape(atob(tkI[t].value))));}catch(e){}}
</div>`;
}

// ─── Styles ───

const S = {
  app: { fontFamily: "'Quicksand', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" },
  header: { background: "linear-gradient(135deg, #0C115B 0%, #A61E51 100%)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: 700, margin: 0, fontFamily: "'Petrona', Georgia, serif" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0 },
  main: { flex: 1, maxWidth: 900, margin: "0 auto", padding: "20px 16px", width: "100%" },
  card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #e2e8f0", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  inputFocus: { borderColor: "#0C115B" },
  btnPrimary: { background: "linear-gradient(135deg, #0C115B, #A61E51)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 44 },
  btnOutline: (color) => ({ background: "#fff", border: `2px solid ${color}`, color, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 40 }),
  btnGhost: { background: "transparent", border: "none", padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#94a3b8", fontFamily: "inherit" },
  btnSmall: (color) => ({ background: "transparent", border: `1.5px solid ${color}`, color, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }),
  tag: (bg, color) => ({ background: bg, color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }),
  flex: { display: "flex", alignItems: "center", gap: 8 },
  flexBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  textarea: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #e2e8f0", fontSize: 11, fontWeight: 500, outline: "none", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", minHeight: 160 },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modalBox: { background: "#fff", borderRadius: 16, maxWidth: 640, width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" },
  pre: { flex: 1, padding: 12, margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, lineHeight: 1.5, overflow: "auto", background: "#f8fafc", whiteSpace: "pre-wrap", wordBreak: "break-all" },
  dot: (active) => ({ width: 8, height: 8, borderRadius: "50%", background: active ? "#A61E51" : "#e2e8f0", cursor: "pointer", border: "none", padding: 0 }),
};

// ─── App ───

export default function LibraryBuilder() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramSubtitle, setNewProgramSubtitle] = useState("");
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [addingRoutine, setAddingRoutine] = useState<{ moduleIndex: number; name: string; mvCode: string } | null>(null);
  const [editingRoutineCode, setEditingRoutineCode] = useState<{ mi: number; ri: number; name: string; mvCode: string } | null>(null);
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);
  const [movingRoutine, setMovingRoutine] = useState<{ mi: number; ri: number } | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [outputHTML, setOutputHTML] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [editingProgram, setEditingProgram] = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setPrograms(data.programs || []);
        setActiveProgramId(data.activeProgramId || null);
      }
    } catch (e) { /* */ }
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ programs, activeProgramId }));
  }, [programs, activeProgramId]);

  const activeProgram = programs.find(p => p.id === activeProgramId) || null;
  const totalRoutines = activeProgram ? activeProgram.modules.reduce((s, m) => s + m.routines.length, 0) : 0;

  // ─── Program ops ───
  function addProgram() {
    if (!newProgramName.trim()) return;
    const p = { id: uid(), name: newProgramName.trim(), subtitle: newProgramSubtitle.trim(), modules: [] };
    setPrograms(prev => [...prev, p]);
    setActiveProgramId(p.id);
    setShowAddProgram(false);
    setNewProgramName("");
    setNewProgramSubtitle("");
  }

  function deleteProgram(id: string) {
    const p = programs.find(x => x.id === id);
    if (!confirm(`Delete "${p?.name}" and all its modules/routines?`)) return;
    setPrograms(prev => prev.filter(x => x.id !== id));
    if (activeProgramId === id) setActiveProgramId(programs.find(x => x.id !== id)?.id || null);
  }

  function updateProgram(id: string, updates: Partial<Program>) {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  // ─── Module ops ───
  function addModule() {
    if (!newModuleName.trim() || !activeProgram) return;
    updateProgram(activeProgram.id, {
      modules: [...activeProgram.modules, { id: uid(), name: newModuleName.trim(), routines: [] }]
    });
    setNewModuleName("");
    setShowAddModule(false);
  }

  const [pendingModDelete, setPendingModDelete] = useState<number | null>(null);

  function removeModule(mi: number) {
    const mod = activeProgram.modules[mi];
    if (mod.routines.length > 0) {
      if (pendingModDelete === mi) {
        updateProgram(activeProgram.id, { modules: activeProgram.modules.filter((_, i) => i !== mi) });
        setPendingModDelete(null);
      } else {
        setPendingModDelete(mi);
        setTimeout(() => setPendingModDelete(null), 3000);
      }
    } else {
      updateProgram(activeProgram.id, { modules: activeProgram.modules.filter((_, i) => i !== mi) });
    }
  }

  function moveModule(mi: number, dir: number) {
    const ni = mi + dir;
    if (ni < 0 || ni >= activeProgram.modules.length) return;
    const mods = [...activeProgram.modules];
    [mods[mi], mods[ni]] = [mods[ni], mods[mi]];
    updateProgram(activeProgram.id, { modules: mods });
  }

  // Drag refs for modules
  const dragModRef = useRef<number | null>(null);
  const dragModOverRef = useRef<number | null>(null);

  function handleModDragEnd() {
    if (dragModRef.current === null || dragModOverRef.current === null || dragModRef.current === dragModOverRef.current) {
      dragModRef.current = null; dragModOverRef.current = null; return;
    }
    const mods = [...activeProgram.modules];
    const dragged = mods.splice(dragModRef.current, 1)[0];
    mods.splice(dragModOverRef.current, 0, dragged);
    updateProgram(activeProgram.id, { modules: mods });
    dragModRef.current = null; dragModOverRef.current = null;
  }

  // Drag refs for routines (within same module)
  const dragRoutineRef = useRef<{ mi: number; ri: number } | null>(null);
  const dragRoutineOverRef = useRef<{ mi: number; ri: number } | null>(null);

  function handleRoutineDragEnd() {
    const from = dragRoutineRef.current;
    const to = dragRoutineOverRef.current;
    dragRoutineRef.current = null; dragRoutineOverRef.current = null;
    if (!from || !to) return;
    if (from.mi === to.mi && from.ri === to.ri) return;

    if (from.mi === to.mi) {
      // Same module — reorder
      const mods = activeProgram.modules.map((m, i) => {
        if (i !== from.mi) return m;
        const routines = [...m.routines];
        const dragged = routines.splice(from.ri, 1)[0];
        routines.splice(to.ri, 0, dragged);
        return { ...m, routines };
      });
      updateProgram(activeProgram.id, { modules: mods });
    } else {
      // Cross-module — move routine
      const routine = activeProgram.modules[from.mi].routines[from.ri];
      const mods = activeProgram.modules.map((m, i) => {
        if (i === from.mi) return { ...m, routines: m.routines.filter((_, j) => j !== from.ri) };
        if (i === to.mi) {
          const routines = [...m.routines];
          routines.splice(to.ri, 0, routine);
          return { ...m, routines };
        }
        return m;
      });
      updateProgram(activeProgram.id, { modules: mods });
    }
  }

  // Move routine to another module via dropdown
  function moveRoutineToModule(fromMi: number, ri: number, toMi: number) {
    if (fromMi === toMi) return;
    const routine = activeProgram.modules[fromMi].routines[ri];
    const mods = activeProgram.modules.map((m, i) => {
      if (i === fromMi) return { ...m, routines: m.routines.filter((_, j) => j !== ri) };
      if (i === toMi) return { ...m, routines: [...m.routines, routine] };
      return m;
    });
    updateProgram(activeProgram.id, { modules: mods });
  }

  // ─── Routine ops ───
  function addRoutine(mi: number, name: string, mvCode: string) {
    const mods = activeProgram.modules.map((m, i) => {
      if (i !== mi) return m;
      return { ...m, routines: [...m.routines, { name, mvCode }] };
    });
    updateProgram(activeProgram.id, { modules: mods });
    setAddingRoutine(null);
  }

  function updateRoutineCode(mi: number, ri: number, name: string, mvCode: string) {
    const mods = activeProgram.modules.map((m, i) => {
      if (i !== mi) return m;
      return { ...m, routines: m.routines.map((r, j) => j === ri ? { ...r, name, mvCode } : r) };
    });
    updateProgram(activeProgram.id, { modules: mods });
    setEditingRoutineCode(null);
  }

  function copyRoutineCode(mi: number, ri: number) {
    const code = activeProgram.modules[mi]?.routines[ri]?.mvCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedRoutineId(`${mi}-${ri}`);
      setTimeout(() => setCopiedRoutineId(null), 2000);
    }).catch(() => {});
  }

  const [pendingDelete, setPendingDelete] = useState<{ mi: number; ri: number } | null>(null);

  function removeRoutine(mi: number, ri: number) {
    if (pendingDelete && pendingDelete.mi === mi && pendingDelete.ri === ri) {
      // Second click — actually delete
      const mods = activeProgram.modules.map((m, i) => {
        if (i !== mi) return m;
        return { ...m, routines: m.routines.filter((_, j) => j !== ri) };
      });
      updateProgram(activeProgram.id, { modules: mods });
      setPendingDelete(null);
    } else {
      // First click — show confirm state
      setPendingDelete({ mi, ri });
      setTimeout(() => setPendingDelete(null), 3000);
    }
  }

  function moveRoutine(mi: number, ri: number, dir: number) {
    const ni = ri + dir;
    if (ni < 0 || ni >= activeProgram.modules[mi].routines.length) return;
    const mods = activeProgram.modules.map((m, i) => {
      if (i !== mi) return m;
      const routines = [...m.routines];
      [routines[ri], routines[ni]] = [routines[ni], routines[ri]];
      return { ...m, routines };
    });
    updateProgram(activeProgram.id, { modules: mods });
  }

  // ─── Export ───
  function handleExport() {
    if (!activeProgram) return;
    const html = assembleHTML(activeProgram);
    setOutputHTML(html);
    setShowOutput(true);
  }

  function handleCopy() {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(outputHTML).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    try {
      const ta = document.createElement("textarea");
      ta.value = outputHTML;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {
      // Last resort: download as file
      const b = new Blob([outputHTML], { type: "text/html" });
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u;
      a.download = "video_library.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  function handleDownload() {
    const b = new Blob([outputHTML], { type: "text/html" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = (activeProgram?.name || "library").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
  }

  // ─── Render ───
  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 1.5 }}>SFH</span>
            </div>
            <div>
              <h1 style={S.headerTitle}>Video Library Builder</h1>
              <p style={S.headerSub}>Assemble MV codes into nested accordion libraries</p>
            </div>
          </div>
        </div>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.8)", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Reset All</button>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600 }}>Delete everything?</span>
            <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setPrograms([]); setActiveProgramId(null); setShowOutput(false); setOutputHTML(""); setEditingProgram(false); setConfirmReset(false); }} style={{ background: "#dc2626", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Yes, Reset</button>
            <button onClick={() => setConfirmReset(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "rgba(255,255,255,0.8)", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        )}
      </div>

      <div style={S.main}>
        {/* Program Selector */}
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.flexBetween}>
            <div style={{ ...S.flex, flexWrap: "wrap" }}>
              {programs.map(p => (
                <button key={p.id} onClick={() => { setActiveProgramId(p.id); setEditingProgram(false); }}
                  style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: "2px solid " + (p.id === activeProgramId ? "#0C115B" : "#e2e8f0"), color: p.id === activeProgramId ? "#fff" : "#0C115B", background: p.id === activeProgramId ? "#0C115B" : "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                  {p.name.length > 30 ? p.name.slice(0, 30) + "..." : p.name}
                </button>
              ))}
              <button onClick={() => setShowAddProgram(true)} style={S.btnSmall("#0F766E")}>+ New Program</button>
            </div>
          </div>
        </div>

        {/* Add Program Form */}
        {showAddProgram && (
          <div style={{ ...S.card, background: "#f0fdf4", borderColor: "#86efac" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#166534", margin: "0 0 12px 0" }}>New Program</p>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Program Name</label>
              <input style={S.input} value={newProgramName} onChange={e => setNewProgramName(e.target.value)} onKeyDown={e => e.key === "Enter" && addProgram()} placeholder="e.g. STEP into Balance — Video Library" autoFocus />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Subtitle (optional)</label>
              <input style={S.input} value={newProgramSubtitle} onChange={e => setNewProgramSubtitle(e.target.value)} placeholder="e.g. Your complete follow-along routine collection" />
            </div>
            <div style={{ ...S.flex }}>
              <button onClick={addProgram} style={S.btnPrimary}>Create Program</button>
              <button onClick={() => { setShowAddProgram(false); setNewProgramName(""); setNewProgramSubtitle(""); }} style={S.btnGhost}>Cancel</button>
            </div>
          </div>
        )}

        {/* No program selected */}
        {!activeProgram && !showAddProgram && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No program selected</p>
            <p style={{ fontSize: 14, marginBottom: 16 }}>Create a new program to get started.</p>
            <button onClick={() => setShowAddProgram(true)} style={S.btnPrimary}>+ New Program</button>
          </div>
        )}

        {/* Active Program */}
        {activeProgram && (
          <>
            {/* Program Header */}
            <div style={{ ...S.card, background: "linear-gradient(135deg, #0C115B 0%, #A61E51 100%)", color: "#fff", padding: 20 }}>
              <div style={S.flexBetween}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Petrona', Georgia, serif", fontWeight: 700 }}>{activeProgram.name}</h2>
                  {activeProgram.subtitle && <p style={{ margin: "4px 0 0 0", fontSize: 14, opacity: 0.85 }}>{activeProgram.subtitle}</p>}
                </div>
                <div style={S.flex}>
                  <button onClick={() => setEditingProgram(!editingProgram)} style={{ ...S.btnSmall("rgba(255,255,255,0.5)"), color: "rgba(255,255,255,0.8)" }}>{editingProgram ? "Done" : "Edit"}</button>
                  <button onClick={() => deleteProgram(activeProgram.id)} style={{ ...S.btnSmall("rgba(255,255,255,0.3)"), color: "rgba(255,255,255,0.6)" }}>Delete</button>
                </div>
              </div>
              {editingProgram && (
                <div style={{ marginTop: 12 }}>
                  <input style={{ ...S.input, background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }} value={activeProgram.name} onChange={e => updateProgram(activeProgram.id, { name: e.target.value })} />
                  <input style={{ ...S.input, background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)", marginTop: 8 }} value={activeProgram.subtitle} onChange={e => updateProgram(activeProgram.id, { subtitle: e.target.value })} placeholder="Subtitle" />
                </div>
              )}
              <div style={{ ...S.flex, marginTop: 12 }}>
                <span style={S.tag("rgba(255,255,255,0.2)", "#fff")}>{activeProgram.modules.length} modules</span>
                <span style={S.tag("rgba(255,255,255,0.2)", "#fff")}>{totalRoutines} routines</span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ ...S.flexBetween, marginBottom: 12 }}>
              <button onClick={() => setShowAddModule(true)} style={S.btnOutline("#0F766E")}>+ Add Module</button>
              <button onClick={handleExport} disabled={totalRoutines === 0}
                style={{ ...S.btnPrimary, opacity: totalRoutines > 0 ? 1 : 0.4, cursor: totalRoutines > 0 ? "pointer" : "not-allowed" }}>
                Export Library HTML
              </button>
            </div>

            {/* Add Module */}
            {showAddModule && (
              <div style={{ ...S.card, background: "#f0fdfa", borderColor: "#99f6e4", padding: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <input style={{ ...S.input, flex: 1 }} value={newModuleName} onChange={e => setNewModuleName(e.target.value)} onKeyDown={e => e.key === "Enter" && addModule()} placeholder="Module name (e.g. STEP into Warm-Up)" autoFocus />
                <button onClick={addModule} style={{ ...S.btnPrimary, whiteSpace: "nowrap" }}>Add</button>
                <button onClick={() => { setShowAddModule(false); setNewModuleName(""); }} style={S.btnGhost}>Cancel</button>
              </div>
            )}

            {/* Empty state */}
            {activeProgram.modules.length === 0 && !showAddModule && (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📁</p>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>No modules yet</p>
                <button onClick={() => setShowAddModule(true)} style={S.btnOutline("#0F766E")}>+ Add First Module</button>
              </div>
            )}

            {/* Modules */}
            {activeProgram.modules.map((mod, mi) => {
              const c = getColor(mi);
              return (
                <div key={mod.id} draggable onDragStart={() => { dragModRef.current = mi; }} onDragEnter={() => { dragModOverRef.current = mi; }} onDragEnd={handleModDragEnd} onDragOver={e => e.preventDefault()} style={{ ...S.card, padding: 0, overflow: "hidden", marginBottom: 10, cursor: "grab" }}>
                  {/* Module header */}
                  <div style={{ padding: "12px 16px", background: c.bg, borderLeft: `5px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ ...S.flex, cursor: "grab" }}>
                      <span style={{ color: c.text, fontSize: 14, marginRight: 4, cursor: "grab" }}>⠿</span>
                      <div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: "'Petrona', Georgia, serif" }}>{mod.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#666", marginLeft: 8 }}>{mod.routines.length} routine{mod.routines.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div style={S.flex}>
                      <button onClick={() => setAddingRoutine({ moduleIndex: mi, name: "", mvCode: "" })} style={S.btnSmall("#A61E51")}>+ Routine</button>
                      <button onClick={() => removeModule(mi)} style={{ ...S.btnGhost, color: pendingModDelete === mi ? "#fff" : "#f87171", background: pendingModDelete === mi ? "#dc2626" : "transparent", fontSize: pendingModDelete === mi ? 11 : 16, borderRadius: 6, padding: pendingModDelete === mi ? "4px 10px" : undefined, fontWeight: 700 }}>
                        {pendingModDelete === mi ? "Confirm?" : "✕"}
                      </button>
                    </div>
                  </div>

                  {/* Routines */}
                  <div style={{ padding: mod.routines.length > 0 ? 10 : 0 }}>
                    {mod.routines.length === 0 && (
                      <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: 13, fontWeight: 600, padding: 16, margin: 0 }}>No routines yet</p>
                    )}
                    {mod.routines.map((r, ri) => (
                      <div key={ri} draggable onDragStart={e => { e.stopPropagation(); dragRoutineRef.current = { mi, ri }; }} onDragEnter={e => { e.stopPropagation(); dragRoutineOverRef.current = { mi, ri }; }} onDragEnd={e => { e.stopPropagation(); handleRoutineDragEnd(); }} onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: ri % 2 === 0 ? "#fafbfc" : "#fff", borderRadius: 8, marginBottom: 4, cursor: "grab" }}>
                        <span style={{ color: "#ccc", fontSize: 12, cursor: "grab", flexShrink: 0 }}>⠿</span>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#0C115B" }}>{r.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: r.mvCode ? "#16a34a" : "#f59e0b" }}>{r.mvCode ? "Code attached" : "No code"}</span>
                        {r.mvCode && <button onClick={() => copyRoutineCode(mi, ri)} style={{ ...S.btnGhost, fontSize: 11, fontWeight: 700, color: copiedRoutineId === `${mi}-${ri}` ? "#16a34a" : "#0F766E", padding: "2px 8px" }}>{copiedRoutineId === `${mi}-${ri}` ? "✓ Copied" : "Copy"}</button>}
                        <button onClick={() => setEditingRoutineCode({ mi, ri, name: r.name, mvCode: r.mvCode })} style={{ ...S.btnGhost, fontSize: 11, fontWeight: 700, color: "#6366f1", padding: "2px 8px" }}>Edit</button>
                        {activeProgram.modules.length > 1 && (
                          movingRoutine?.mi === mi && movingRoutine?.ri === ri ? (
                            <select onChange={e => { const toMi = parseInt(e.target.value); if (!isNaN(toMi)) moveRoutineToModule(mi, ri, toMi); setMovingRoutine(null); }} onBlur={() => setMovingRoutine(null)} autoFocus defaultValue="" style={{ fontSize: 11, fontWeight: 600, padding: "2px 4px", borderRadius: 4, border: "1px solid #6366f1", cursor: "pointer", maxWidth: 120 }}>
                              <option value="" disabled>Move to...</option>
                              {activeProgram.modules.map((m, mIdx) => mIdx !== mi && <option key={m.id} value={mIdx}>{m.name}</option>)}
                            </select>
                          ) : (
                            <button onClick={() => setMovingRoutine({ mi, ri })} style={{ ...S.btnGhost, fontSize: 11, fontWeight: 700, color: "#8b5cf6", padding: "2px 6px" }}>Move</button>
                          )
                        )}
                        <button onClick={() => removeRoutine(mi, ri)} style={{ ...S.btnGhost, color: pendingDelete?.mi === mi && pendingDelete?.ri === ri ? "#fff" : "#f87171", background: pendingDelete?.mi === mi && pendingDelete?.ri === ri ? "#dc2626" : "transparent", fontSize: pendingDelete?.mi === mi && pendingDelete?.ri === ri ? 11 : 14, borderRadius: 6, padding: pendingDelete?.mi === mi && pendingDelete?.ri === ri ? "4px 10px" : undefined, fontWeight: 700 }}>
                          {pendingDelete?.mi === mi && pendingDelete?.ri === ri ? "Confirm?" : "✕"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add Routine Modal */}
      {addingRoutine && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <div style={{ padding: 20, borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0C115B" }}>Add Routine to "{activeProgram?.modules[addingRoutine.moduleIndex]?.name}"</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>Paste the MV code from the Video Builder.</p>
            </div>
            <div style={{ padding: 20, flex: 1, overflow: "auto" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Routine Name</label>
                <input style={S.input} value={addingRoutine.name} onChange={e => setAddingRoutine({ ...addingRoutine, name: e.target.value })} placeholder="e.g. Core & Posture Awareness" autoFocus />
              </div>
              <div>
                <label style={S.label}>MV Code</label>
                <textarea style={S.textarea} value={addingRoutine.mvCode} onChange={e => setAddingRoutine({ ...addingRoutine, mvCode: e.target.value })} placeholder="Paste the full MV code here..." />
              </div>
              {addingRoutine.mvCode && !addingRoutine.mvCode.includes("generateTracker") && (
                <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 8, padding: 10, marginTop: 10, fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                  No tracker function found. Make sure you pasted the complete MV code.
                </div>
              )}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
              <button onClick={() => setAddingRoutine(null)} style={{ ...S.btnOutline("#94a3b8"), flex: 1 }}>Cancel</button>
              <button onClick={() => addRoutine(addingRoutine.moduleIndex, addingRoutine.name, addingRoutine.mvCode)} disabled={!addingRoutine.name.trim() || !addingRoutine.mvCode.trim()}
                style={{ ...S.btnPrimary, flex: 1, opacity: addingRoutine.name.trim() && addingRoutine.mvCode.trim() ? 1 : 0.4 }}>
                Add Routine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Routine Modal */}
      {editingRoutineCode && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <div style={{ padding: 20, borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0C115B" }}>Edit Routine</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>Update the routine name or MV code.</p>
            </div>
            <div style={{ padding: 20, flex: 1, overflow: "auto" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Routine Name</label>
                <input style={S.input} value={editingRoutineCode.name} onChange={e => setEditingRoutineCode({ ...editingRoutineCode, name: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>MV Code</label>
                <textarea style={S.textarea} value={editingRoutineCode.mvCode} onChange={e => setEditingRoutineCode({ ...editingRoutineCode, mvCode: e.target.value })} />
              </div>
              {editingRoutineCode.mvCode && !editingRoutineCode.mvCode.includes("generateTracker") && (
                <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 8, padding: 10, marginTop: 10, fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                  No tracker function found. Make sure the MV code is complete.
                </div>
              )}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
              <button onClick={() => setEditingRoutineCode(null)} style={{ ...S.btnOutline("#94a3b8"), flex: 1 }}>Cancel</button>
              <button onClick={() => updateRoutineCode(editingRoutineCode.mi, editingRoutineCode.ri, editingRoutineCode.name, editingRoutineCode.mvCode)} disabled={!editingRoutineCode.name.trim() || !editingRoutineCode.mvCode.trim()}
                style={{ ...S.btnPrimary, flex: 1, opacity: editingRoutineCode.name.trim() && editingRoutineCode.mvCode.trim() ? 1 : 0.4 }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output Modal */}
      {showOutput && (
        <div style={S.modal}>
          <div style={{ ...S.modalBox, maxWidth: 800 }}>
            <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9", ...S.flexBetween }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0C115B" }}>Library HTML</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>{totalRoutines} routines across {activeProgram?.modules.length} modules</p>
              </div>
              <button onClick={() => setShowOutput(false)} style={{ ...S.btnGhost, fontSize: 18 }}>✕</button>
            </div>
            <pre style={S.pre}>{outputHTML}</pre>
            <div style={{ padding: 12, borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
              <button onClick={handleCopy} style={{ ...S.btnPrimary, flex: 1 }}>
                {copySuccess ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button onClick={handleDownload} style={{ ...S.btnOutline("#0F766E") }}>Download HTML</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
