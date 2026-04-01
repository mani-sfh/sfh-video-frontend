import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMVCodes, deleteMVCode, updateMVCode, getThumbnailImages, saveThumbnailImage, deleteThumbnailImage, updateThumbnailImage, getSavedTemplates, deleteSavedTemplate, updateSavedTemplate, saveTemplate, getRecentVideoJobs, updateVideoJob, deleteVideoJob, cleanupVideoStorage, uploadToVimeo, generateThumbnailOnly } from '../lib/supabase';
import type { MVCode, ThumbnailImage, SavedTemplate } from '../lib/supabase';
import { Code, Trash2, Clock, ListChecks, Copy, FileText, CheckCircle2, ChevronDown, ChevronUp, ChevronRight, ImagePlus, Image, Pencil, Check, X, GripVertical, Plus, Play, Download, Upload, Video, Loader2, ExternalLink, CheckSquare, Square, FolderOpen } from 'lucide-react';

function useDragReorder<T extends {id:string}>(items: T[], setItems: (items: T[]) => void, onPersist: (items: T[]) => Promise<void>) {
  const dragItem = useRef<number|null>(null);
  const dragOverItem = useRef<number|null>(null);
  return {
    onDragStart: (i: number) => { dragItem.current = i; },
    onDragEnter: (i: number) => { dragOverItem.current = i; },
    onDragEnd: async () => {
      if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) { dragItem.current = null; dragOverItem.current = null; return; }
      const u = [...items]; const d = u.splice(dragItem.current, 1)[0]; u.splice(dragOverItem.current, 0, d);
      setItems(u); dragItem.current = null; dragOverItem.current = null;
      await onPersist(u);
    }
  };
}

export default function SavedCodes() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<MVCode[]>([]);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [thumbImages, setThumbImages] = useState<ThumbnailImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string|null>(null);

  // Individual expand state
  const [openItemId, setOpenItemId] = useState<string|null>(null);
  const [previewId, setPreviewId] = useState<string|null>(null);
  const [previewType, setPreviewType] = useState<'mv'|'template'|null>(null);

  const [newImgLabel, setNewImgLabel] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [savingImage, setSavingImage] = useState(false);
  const [editImgId, setEditImgId] = useState<string|null>(null);
  const [editImgLabel, setEditImgLabel] = useState('');
  const [editImgUrl, setEditImgUrl] = useState('');

  const [showAddTpl, setShowAddTpl] = useState(false);
  const [newTplLabel, setNewTplLabel] = useState('');
  const [newTplText, setNewTplText] = useState('');
  const [newTplThumb, setNewTplThumb] = useState('');
  const [showNewTplPicker, setShowNewTplPicker] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);

  const [editTplId, setEditTplId] = useState<string|null>(null);
  const [editTplLabel, setEditTplLabel] = useState('');
  const [editTplText, setEditTplText] = useState('');
  const [editTplThumb, setEditTplThumb] = useState('');
  const [showEditTplPicker, setShowEditTplPicker] = useState(false);

  const [showImages, setShowImages] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [videoJobs, setVideoJobs] = useState<any[]>([]);
  const [vimeoUploading, setVimeoUploading] = useState<string|null>(null);
  const [editingVimeoId, setEditingVimeoId] = useState<string | null>(null);
  const [vimeoIdInput, setVimeoIdInput] = useState('');
  const [editCodeNameId, setEditCodeNameId] = useState<string | null>(null);
  const [editCodeNameValue, setEditCodeNameValue] = useState('');
  const [generatingThumbId, setGeneratingThumbId] = useState<string | null>(null);
  const [generatedThumbUrls, setGeneratedThumbUrls] = useState<Record<string, string>>({});

  // Multi-select
  const [selectMode, setSelectMode] = useState<'images'|'templates'|'codes'|'videos'|null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  function toggleSelect(id: string) { setSelectedIds(prev => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; }); }
  function exitSelectMode() { setSelectMode(null); setSelectedIds(new Set()); setShowMoveDropdown(false); }
  function selectAll(ids: string[]) { setSelectedIds(new Set(ids)); }

  // Folders
  const [activeFolder, setActiveFolder] = useState<Record<string, string|null>>({ images: null, templates: null, codes: null, videos: null });
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState<string|null>(null); // which section
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<{section:string,old:string}|null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  function getFolders(items: {folder?: string|null}[]) {
    const folders = new Set<string>();
    items.forEach(i => { if(i.folder) folders.add(i.folder); });
    return Array.from(folders).sort();
  }
  function filterByFolder(items: any[], section: string) {
    const f = activeFolder[section];
    if (f === null) return items; // "All"
    if (f === '__unfiled__') return items.filter(i => !i.folder);
    return items.filter(i => i.folder === f);
  }
  function toggleFolder(key: string) { setOpenFolders(prev => { const n = new Set(prev); if(n.has(key)) n.delete(key); else n.add(key); return n; }); }

  async function handleCreateFolder(section: string) {
    if (!newFolderName.trim()) return;
    setCreatingFolder(null); setNewFolderName('');
    // Folder is just a label — it exists when items have it
    // Set active folder to the new one
    setActiveFolder(p => ({...p, [section]: newFolderName.trim()}));
  }

  async function handleRenameFolder(section: string, oldName: string, newName: string) {
    if (!newName.trim() || newName.trim() === oldName) { setRenamingFolder(null); return; }
    const name = newName.trim();
    if (section === 'images') { for(const i of thumbImages.filter(x=>x.folder===oldName)){try{await updateThumbnailImage(i.id,{folder:name});}catch(e){}} setThumbImages(p=>p.map(i=>i.folder===oldName?{...i,folder:name}:i)); }
    if (section === 'templates') { for(const t of templates.filter(x=>x.folder===oldName)){try{await updateSavedTemplate(t.id,{folder:name});}catch(e){}} setTemplates(p=>p.map(t=>t.folder===oldName?{...t,folder:name}:t)); }
    if (section === 'codes') { for(const c of codes.filter(x=>x.folder===oldName)){try{await updateMVCode(c.id,{folder:name});}catch(e){}} setCodes(p=>p.map(c=>c.folder===oldName?{...c,folder:name}:c)); }
    if (section === 'videos') { for(const v of videoJobs.filter(x=>x.folder===oldName)){try{await updateVideoJob(v.id,{folder:name});}catch(e){}} setVideoJobs(p=>p.map(v=>v.folder===oldName?{...v,folder:name}:v)); }
    setActiveFolder(p => ({...p, [section]: name}));
    setRenamingFolder(null);
  }

  async function handleDeleteFolder(section: string, folderName: string) {
    if (!confirm(`Remove folder "${folderName}"? Items will be moved to Unfiled.`)) return;
    if (section === 'images') { for(const i of thumbImages.filter(x=>x.folder===folderName)){try{await updateThumbnailImage(i.id,{folder:null});}catch(e){}} setThumbImages(p=>p.map(i=>i.folder===folderName?{...i,folder:null}:i)); }
    if (section === 'templates') { for(const t of templates.filter(x=>x.folder===folderName)){try{await updateSavedTemplate(t.id,{folder:null});}catch(e){}} setTemplates(p=>p.map(t=>t.folder===folderName?{...t,folder:null}:t)); }
    if (section === 'codes') { for(const c of codes.filter(x=>x.folder===folderName)){try{await updateMVCode(c.id,{folder:null});}catch(e){}} setCodes(p=>p.map(c=>c.folder===folderName?{...c,folder:null}:c)); }
    if (section === 'videos') { for(const v of videoJobs.filter(x=>x.folder===folderName)){try{await updateVideoJob(v.id,{folder:null});}catch(e){}} setVideoJobs(p=>p.map(v=>v.folder===folderName?{...v,folder:null}:v)); }
    setActiveFolder(p => ({...p, [section]: null}));
  }

  async function handleMoveToFolder(section: string, folderName: string|null) {
    const ids = selectedIds;
    if (section === 'images') { for(const id of ids){try{await updateThumbnailImage(id,{folder:folderName});}catch(e){}} setThumbImages(p=>p.map(i=>ids.has(i.id)?{...i,folder:folderName}:i)); }
    if (section === 'templates') { for(const id of ids){try{await updateSavedTemplate(id,{folder:folderName});}catch(e){}} setTemplates(p=>p.map(t=>ids.has(t.id)?{...t,folder:folderName}:t)); }
    if (section === 'codes') { for(const id of ids){try{await updateMVCode(id,{folder:folderName});}catch(e){}} setCodes(p=>p.map(c=>ids.has(c.id)?{...c,folder:folderName}:c)); }
    if (section === 'videos') { for(const id of ids){try{await updateVideoJob(id,{folder:folderName});}catch(e){}} setVideoJobs(p=>p.map(v=>ids.has(v.id)?{...v,folder:folderName}:v)); }
    exitSelectMode();
  }

  async function bulkDeleteImages() { if(!confirm(`Delete ${selectedIds.size} image(s)?`)) return; for(const id of selectedIds){ try{await deleteThumbnailImage(id);}catch(e){} } setThumbImages(p=>p.filter(i=>!selectedIds.has(i.id))); exitSelectMode(); }
  async function bulkDeleteTemplates() { if(!confirm(`Delete ${selectedIds.size} template(s)?`)) return; for(const id of selectedIds){ try{await deleteSavedTemplate(id);}catch(e){} } setTemplates(p=>p.filter(t=>!selectedIds.has(t.id))); exitSelectMode(); }
  async function bulkDeleteCodes() { if(!confirm(`Delete ${selectedIds.size} code(s)?`)) return; for(const id of selectedIds){ try{await deleteMVCode(id);}catch(e){} } setCodes(p=>p.filter(c=>!selectedIds.has(c.id))); exitSelectMode(); }
  async function bulkDeleteVideos() { if(!confirm(`Delete ${selectedIds.size} video(s)?`)) return; for(const id of selectedIds){ try{await deleteVideoJob(id);}catch(e){console.error('Delete failed:',id,e);} } setVideoJobs(p=>p.filter(j=>!selectedIds.has(j.id))); exitSelectMode(); }

  function FolderBar({ section, items }: { section: string; items: {folder?:string|null}[] }) {
    const folders = getFolders(items);
    if (items.length === 0) return null;
    const current = activeFolder[section];
    return (
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          <button onClick={()=>setActiveFolder(p=>({...p,[section]:null}))} className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer border-none transition-all ${current===null?'bg-navy text-white':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>All ({items.length})</button>
          {folders.map(f => {
            const count = items.filter(i=>i.folder===f).length;
            return renamingFolder?.section===section && renamingFolder?.old===f ? (
              <div key={f} className="flex items-center gap-1">
                <input type="text" value={renameFolderValue} onChange={e=>setRenameFolderValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleRenameFolder(section,f,renameFolderValue);if(e.key==='Escape')setRenamingFolder(null);}} className="px-2 py-0.5 rounded-full border-2 border-navy text-xs font-bold focus:outline-none w-32" autoFocus/>
                <button onClick={()=>handleRenameFolder(section,f,renameFolderValue)} className="text-teal cursor-pointer bg-transparent border-none p-0"><Check className="w-3.5 h-3.5"/></button>
                <button onClick={()=>setRenamingFolder(null)} className="text-gray-400 cursor-pointer bg-transparent border-none p-0"><X className="w-3.5 h-3.5"/></button>
              </div>
            ) : (
              <div key={f} className="flex items-center group">
                <button onClick={()=>setActiveFolder(p=>({...p,[section]:f}))} className={`text-xs font-bold px-3 py-1 rounded-l-full cursor-pointer border-none transition-all ${current===f?'bg-crimson text-white':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{f} ({count})</button>
                <div className={`flex items-center rounded-r-full overflow-hidden ${current===f?'bg-crimson/80':'bg-gray-100 group-hover:bg-gray-200'}`}>
                  <button onClick={e=>{e.stopPropagation();setRenamingFolder({section,old:f});setRenameFolderValue(f);}} className={`cursor-pointer bg-transparent border-none p-0 px-1 ${current===f?'text-white/70 hover:text-white':'text-gray-400 hover:text-navy'}`}><Pencil className="w-3 h-3"/></button>
                  <button onClick={e=>{e.stopPropagation();handleDeleteFolder(section,f);}} className={`cursor-pointer bg-transparent border-none p-0 px-1 ${current===f?'text-white/70 hover:text-white':'text-gray-400 hover:text-red-500'}`}><X className="w-3 h-3"/></button>
                </div>
              </div>
            );
          })}
          {items.filter(i=>!i.folder).length > 0 && folders.length > 0 && (
            <button onClick={()=>setActiveFolder(p=>({...p,[section]:'__unfiled__'}))} className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer border-none transition-all ${current==='__unfiled__'?'bg-gray-500 text-white':'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Unfiled ({items.filter(i=>!i.folder).length})</button>
          )}
          {creatingFolder===section ? (
            <div className="flex items-center gap-1">
              <input type="text" value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleCreateFolder(section);if(e.key==='Escape'){setCreatingFolder(null);setNewFolderName('');}}} placeholder="Folder name" className="px-2 py-0.5 rounded-full border-2 border-navy text-xs font-bold focus:outline-none w-28" autoFocus/>
              <button onClick={()=>handleCreateFolder(section)} className="text-teal cursor-pointer bg-transparent border-none p-0"><Check className="w-3.5 h-3.5"/></button>
              <button onClick={()=>{setCreatingFolder(null);setNewFolderName('');}} className="text-gray-400 cursor-pointer bg-transparent border-none p-0"><X className="w-3.5 h-3.5"/></button>
            </div>
          ) : (
            <button onClick={()=>{setCreatingFolder(section);setNewFolderName('');}} className="text-xs font-bold px-2 py-1 rounded-full cursor-pointer border border-dashed border-gray-300 text-gray-400 hover:text-navy hover:border-navy bg-transparent">+ Folder</button>
          )}
        </div>
      </div>
    );
  }

  function SelectBar({ section, items }: { section: string; items: {id:string;folder?:string|null}[] }) {
    const folders = getFolders(items);
    const bulkDelete = section === 'images' ? bulkDeleteImages : section === 'templates' ? bulkDeleteTemplates : section === 'codes' ? bulkDeleteCodes : bulkDeleteVideos;
    return (
      <div className="flex items-center gap-2 mb-2 px-2 flex-wrap">
        <button onClick={()=>selectAll(filterByFolder(items, section).map(i=>i.id))} className="text-xs font-bold text-navy cursor-pointer bg-transparent border-none p-0 hover:underline">Select All</button>
        <span className="text-xs text-gray-300">|</span>
        <span className="text-xs font-bold text-gray-400">{selectedIds.size} selected</span>
        <span className="flex-1"/>
        {selectedIds.size > 0 && (
          <div className="relative">
            <button onClick={()=>setShowMoveDropdown(!showMoveDropdown)} className="text-xs font-bold text-navy cursor-pointer bg-navy/5 hover:bg-navy/10 border border-navy/20 rounded-lg px-3 py-1">Move to →</button>
            {showMoveDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                <button onClick={()=>handleMoveToFolder(section,null)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer border-none bg-transparent">Unfiled</button>
                {folders.map(f => (
                  <button key={f} onClick={()=>handleMoveToFolder(section,f)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-navy hover:bg-cream cursor-pointer border-none bg-transparent">{f}</button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={()=>{const name=prompt('New folder name:');if(name?.trim()){handleMoveToFolder(section,name.trim());}}} className="w-full text-left px-3 py-1.5 text-xs font-bold text-crimson hover:bg-crimson/5 cursor-pointer border-none bg-transparent">+ New Folder</button>
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={bulkDelete} disabled={selectedIds.size===0} className="text-xs font-bold text-red-500 cursor-pointer bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1 disabled:opacity-40"><Trash2 className="w-3 h-3 inline mr-1"/>Delete</button>
      </div>
    );
  }

  useEffect(() => { async function load() { try { const [c,i,t,v] = await Promise.all([getMVCodes(),getThumbnailImages(),getSavedTemplates(),getRecentVideoJobs()]); setCodes(c); setThumbImages(i); setTemplates(t); setVideoJobs(v); } catch(e){console.error(e);} finally{setLoading(false);} } load(); }, []);

  function doCopy(text:string,id:string,type:string) { navigator.clipboard.writeText(text).then(()=>{setCopiedId(id+type);setTimeout(()=>setCopiedId(null),2000);}).catch(()=>{}); }
  function toggleItem(id:string) { setOpenItemId(openItemId===id?null:id); }
  function togglePreview(id:string,type:'mv'|'template') { if(previewId===id&&previewType===type){setPreviewId(null);setPreviewType(null);}else{setPreviewId(id);setPreviewType(type);} }

  const imgDrag = useDragReorder(thumbImages, setThumbImages, async(u)=>{ for(let i=0;i<u.length;i++){try{await updateThumbnailImage(u[i].id,{sort_order:i});}catch(e){}} });
  const tplDrag = useDragReorder(templates, setTemplates, async(u)=>{ for(let i=0;i<u.length;i++){try{await updateSavedTemplate(u[i].id,{sort_order:i});}catch(e){}} });
  const codeDrag = useDragReorder(codes, setCodes, async(u)=>{ for(let i=0;i<u.length;i++){try{await updateMVCode(u[i].id,{sort_order:i});}catch(e){}} });

  async function handleAddImage() { if(!newImgLabel.trim()||!newImgUrl.trim())return; setSavingImage(true); try { const mx=thumbImages.reduce((m,i)=>Math.max(m,i.sort_order||0),0); const s=await saveThumbnailImage({label:newImgLabel.trim(),image_url:newImgUrl.trim(),sort_order:mx+1}); setThumbImages(p=>[...p,s]); setNewImgLabel('');setNewImgUrl(''); }catch(e){console.error(e);} finally{setSavingImage(false);} }
  async function handleDeleteImage(id:string) { if(!confirm('Delete?'))return; try{await deleteThumbnailImage(id);setThumbImages(p=>p.filter(i=>i.id!==id));}catch(e){} }
  function startEditImage(img:ThumbnailImage) { setEditImgId(img.id);setEditImgLabel(img.label);setEditImgUrl(img.image_url); }
  async function saveEditImage() { if(!editImgId||!editImgLabel.trim()||!editImgUrl.trim())return; try{await updateThumbnailImage(editImgId,{label:editImgLabel.trim(),image_url:editImgUrl.trim()});setThumbImages(p=>p.map(i=>i.id===editImgId?{...i,label:editImgLabel.trim(),image_url:editImgUrl.trim()}:i));setEditImgId(null);}catch(e){} }

  async function handleAddTemplate() { if(!newTplLabel.trim()||!newTplText.trim())return; setSavingTpl(true); try { const mx=templates.reduce((m,t)=>Math.max(m,t.sort_order||0),0); const s=await saveTemplate({label:newTplLabel.trim(),template_text:newTplText.trim(),thumbnail_image_url:newTplThumb.trim()||undefined,sort_order:mx+1}); setTemplates(p=>[...p,s]); setNewTplLabel('');setNewTplText('');setNewTplThumb('');setShowAddTpl(false); }catch(e){} finally{setSavingTpl(false);} }
  async function handleDeleteTemplate(id:string) { if(!confirm('Delete?'))return; try{await deleteSavedTemplate(id);setTemplates(p=>p.filter(t=>t.id!==id));}catch(e){} }
  function startEditTemplate(t:SavedTemplate) { setEditTplId(t.id);setEditTplLabel(t.label);setEditTplText(t.template_text);setEditTplThumb(t.thumbnail_image_url||''); }
  async function saveEditTemplate() { if(!editTplId||!editTplLabel.trim())return; try{await updateSavedTemplate(editTplId,{label:editTplLabel.trim(),template_text:editTplText,thumbnail_image_url:editTplThumb.trim()||undefined});setTemplates(p=>p.map(t=>t.id===editTplId?{...t,label:editTplLabel.trim(),template_text:editTplText,thumbnail_image_url:editTplThumb.trim()||undefined}:t));setEditTplId(null);}catch(e){} }
  async function handleDeleteCode(id:string) { if(!confirm('Delete?'))return; try{await deleteMVCode(id);setCodes(p=>p.filter(c=>c.id!==id));}catch(e){} }
  async function handleSaveCodeName(id: string) { if(!editCodeNameValue.trim()) return; try { await updateMVCode(id, { routine_name: editCodeNameValue.trim() }); setCodes(p=>p.map(c=>c.id===id?{...c,routine_name:editCodeNameValue.trim()}:c)); setEditCodeNameId(null); } catch(e){ console.error(e); } }

  async function handleGenerateThumbForCode(code: MVCode) {
    setGeneratingThumbId(code.id);
    try {
      const result = await generateThumbnailOnly({
        routineName: code.routine_name,
        totalDuration: `~${code.duration_minutes} min`,
        thumbnailImageUrl: code.thumbnail_image_url || undefined,
        thumbnailBadge: code.thumbnail_badge || undefined,
        thumbnailTitle: code.thumbnail_title || undefined,
      });
      setGeneratedThumbUrls(prev => ({ ...prev, [code.id]: result.thumbnailUrl }));
      // Save the URL to the MV code record
      await updateMVCode(code.id, { generated_thumbnail_url: result.thumbnailUrl });
      setCodes(p => p.map(c => c.id === code.id ? { ...c, generated_thumbnail_url: result.thumbnailUrl } : c));
    } catch (e) { alert('Thumbnail failed: ' + (e as Error).message); }
    finally { setGeneratingThumbId(null); }
  }

  async function handleSaveVimeoId(codeId: string) {
    let vid = vimeoIdInput.trim();
    // Extract ID from various formats: full URL, player URL, or just the number
    const urlMatch = vid.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (urlMatch) vid = urlMatch[1];
    else vid = vid.replace(/[^0-9]/g, '');
    if (!vid) return;
    const code = codes.find(c => c.id === codeId);
    if (!code) return;
    const updatedMvCode = code.mv_code.replace(/YOUR_VIDEO_ID_HERE/g, vid).replace(/player\.vimeo\.com\/video\/\d+/g, `player.vimeo.com/video/${vid}`);
    try {
      await updateMVCode(codeId, { mv_code: updatedMvCode, vimeo_id: vid });
      setCodes(p => p.map(c => c.id === codeId ? { ...c, mv_code: updatedMvCode, vimeo_id: vid } : c));
      setEditingVimeoId(null); setVimeoIdInput('');
    } catch (e) { console.error(e); }
  }

  function ThumbPicker({value,onChange,show,setShow}:{value:string,onChange:(v:string)=>void,show:boolean,setShow:(v:boolean)=>void}) {
    const [s,setS]=useState('');
    const filtered=thumbImages.filter(i=>!s||i.label.toLowerCase().includes(s.toLowerCase()));
    return (<div className="relative"><div className="flex gap-1">
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder="Thumbnail image URL (optional)" className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-semibold text-gray-500"/>
      {thumbImages.length>0&&<button onClick={()=>setShow(!show)} type="button" className="px-2 py-2 rounded-lg border-2 border-gray-200 hover:border-navy bg-white cursor-pointer flex items-center"><ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${show?'rotate-180':''}`}/></button>}
    </div>{show&&thumbImages.length>0&&(<div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-navy/20 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
      <input type="text" value={s} onChange={e=>setS(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 border-b border-gray-200 text-xs font-semibold focus:outline-none sticky top-0 bg-white"/>
      {filtered.map(i=>(<button key={i.id} onClick={()=>{onChange(i.image_url);setShow(false);setS('');}} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cream cursor-pointer border-none bg-transparent text-left"><img src={i.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0 bg-gray-100"/><span className="text-xs font-bold text-navy truncate">{i.label}</span></button>))}
      {filtered.length===0&&<p className="text-xs text-gray-400 text-center py-3">No matches</p>}
    </div>)}</div>);
  }

  if(loading) return (<div className="text-center py-20"><div className="animate-spin w-10 h-10 border-4 border-navy border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-gray-500 font-semibold">Loading...</p></div>);

  return (
    <div className="max-w-4xl mx-auto">

      {/* ═══ THUMBNAIL IMAGE LIBRARY ═══ */}
      <div className="mb-6">
        <button onClick={()=>setShowImages(!showImages)} className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
          <Image className="w-5 h-5 text-purple-700"/><span className="text-lg font-bold text-navy flex-1">Thumbnail Image Library</span>
          <span className="text-xs font-bold text-gray-400">{thumbImages.length}</span>
          {showImages && thumbImages.length>0 && <button onClick={e=>{e.stopPropagation();selectMode==='images'?exitSelectMode():(() => {setSelectMode('images');setSelectedIds(new Set());})();}} className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer border-none ${selectMode==='images'?'text-red-500 bg-red-50':'text-gray-400 bg-gray-100 hover:text-navy'}`}>{selectMode==='images'?'Cancel':'Select'}</button>}
          {showImages?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
        </button>
        {showImages&&(<div className="mt-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3"><div className="flex gap-2">
            <input type="text" value={newImgLabel} onChange={e=>setNewImgLabel(e.target.value)} placeholder="Label" className="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold"/>
            <input type="text" value={newImgUrl} onChange={e=>setNewImgUrl(e.target.value)} placeholder="Paste image URL" className="flex-[2] px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold text-gray-500"/>
            <button onClick={handleAddImage} disabled={savingImage||!newImgLabel.trim()||!newImgUrl.trim()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md cursor-pointer border-none disabled:opacity-50 whitespace-nowrap min-h-[44px]"><ImagePlus className="w-4 h-4"/>{savingImage?'...':'Save'}</button>
          </div></div>
          {thumbImages.length>0?(<div className="space-y-1">
            <FolderBar section="images" items={thumbImages} />
            {selectMode==='images'&&<SelectBar section="images" items={thumbImages} />}
            {filterByFolder(thumbImages, 'images').map((img,idx)=>(
            <div key={img.id} draggable={editImgId!==img.id&&selectMode!=='images'} onDragStart={()=>imgDrag.onDragStart(idx)} onDragEnter={()=>imgDrag.onDragEnter(idx)} onDragEnd={imgDrag.onDragEnd} onDragOver={e=>e.preventDefault()} className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${editImgId!==img.id&&selectMode!=='images'?'cursor-grab active:cursor-grabbing':''} hover:shadow-sm transition-shadow`}>
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={()=>selectMode==='images'?toggleSelect(img.id):editImgId!==img.id&&toggleItem('img-'+img.id)}>
                {selectMode==='images'&&<div className="flex-shrink-0">{selectedIds.has(img.id)?<CheckSquare className="w-5 h-5 text-crimson"/>:<Square className="w-5 h-5 text-gray-300"/>}</div>}
                {selectMode!=='images'&&<GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0"/>}
                <img src={img.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100"/>
                <span className="font-bold text-navy text-sm flex-1 truncate">{img.label}</span>
                <button onClick={e=>{e.stopPropagation();doCopy(img.image_url,'img-'+img.id,'');}} className="text-xs font-bold text-teal hover:text-teal/80 cursor-pointer bg-transparent border-none p-0 flex-shrink-0">{copiedId==='img-'+img.id?'✓':'Copy'}</button>
                <ChevronRight className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${openItemId==='img-'+img.id?'rotate-90':''}`}/>
              </div>
              {/* Expanded details */}
              {openItemId==='img-'+img.id&&editImgId!==img.id&&(
                <div className="border-t border-gray-100 px-3 py-2.5 bg-gray-50">
                  <p className="text-xs text-gray-400 truncate mb-2">{img.image_url}</p>
                  <div className="flex gap-3">
                    <button onClick={()=>doCopy(img.image_url,'img-'+img.id,'')} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0">{copiedId==='img-'+img.id?'✓ Copied!':'Copy URL'}</button>
                    <button onClick={()=>startEditImage(img)} className="text-xs font-bold text-gray-400 hover:text-navy cursor-pointer bg-transparent border-none p-0 flex items-center gap-0.5"><Pencil className="w-3 h-3"/>Edit</button>
                    <button onClick={()=>handleDeleteImage(img.id)} className="text-xs font-bold text-gray-300 hover:text-red-500 cursor-pointer bg-transparent border-none p-0">Delete</button>
                  </div>
                </div>
              )}
              {/* Edit mode */}
              {editImgId===img.id&&(<div className="border-t border-gray-100 px-3 py-2.5 bg-gray-50 space-y-1.5">
                <input type="text" value={editImgLabel} onChange={e=>setEditImgLabel(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveEditImage();if(e.key==='Escape')setEditImgId(null);}} className="w-full px-2 py-1 rounded border-2 border-navy text-sm font-semibold focus:outline-none" autoFocus/>
                <input type="text" value={editImgUrl} onChange={e=>setEditImgUrl(e.target.value)} className="w-full px-2 py-1 rounded border-2 border-gray-200 text-xs text-gray-500 font-semibold focus:outline-none focus:border-navy"/>
                <div className="flex gap-2"><button onClick={saveEditImage} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0 flex items-center gap-0.5"><Check className="w-3 h-3"/>Save</button><button onClick={()=>setEditImgId(null)} className="text-xs font-bold text-gray-400 cursor-pointer bg-transparent border-none p-0 flex items-center gap-0.5"><X className="w-3 h-3"/>Cancel</button></div>
              </div>)}
            </div>
          ))}</div>):(<p className="text-sm text-gray-400 text-center py-4">No images saved yet.</p>)}
        </div>)}
      </div>

      {/* ═══ SAVED TEMPLATES ═══ */}
      <div className="mb-6">
        <button onClick={()=>setShowTemplates(!showTemplates)} className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
          <FileText className="w-5 h-5 text-crimson"/><span className="text-lg font-bold text-navy flex-1">Saved Templates</span>
          <span className="text-xs font-bold text-gray-400">{templates.length}</span>
          {showTemplates && templates.length>0 && <button onClick={e=>{e.stopPropagation();selectMode==='templates'?exitSelectMode():(() => {setSelectMode('templates');setSelectedIds(new Set());})();}} className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer border-none ${selectMode==='templates'?'text-red-500 bg-red-50':'text-gray-400 bg-gray-100 hover:text-navy'}`}>{selectMode==='templates'?'Cancel':'Select'}</button>}
          {showTemplates?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
        </button>
        {showTemplates&&(<div className="mt-3">
          {!showAddTpl?(<button onClick={()=>setShowAddTpl(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm border-2 border-dashed border-crimson/30 text-crimson hover:bg-crimson/5 cursor-pointer bg-white w-full justify-center mb-3 min-h-[44px]"><Plus className="w-4 h-4"/>Add Template</button>):(
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 space-y-2">
              <input type="text" value={newTplLabel} onChange={e=>setNewTplLabel(e.target.value)} placeholder="Template name" className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold"/>
              <ThumbPicker value={newTplThumb} onChange={setNewTplThumb} show={showNewTplPicker} setShow={setShowNewTplPicker}/>
              <textarea value={newTplText} onChange={e=>setNewTplText(e.target.value)} placeholder="Paste template text..." className="w-full min-h-[200px] px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-mono bg-gray-50"/>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>{setShowAddTpl(false);setNewTplLabel('');setNewTplText('');setNewTplThumb('');}} className="px-4 py-2 rounded-lg font-bold text-sm border-2 border-gray-200 text-gray-500 cursor-pointer bg-white min-h-[40px]">Cancel</button>
                <button onClick={handleAddTemplate} disabled={savingTpl||!newTplLabel.trim()||!newTplText.trim()} className="px-4 py-2 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson cursor-pointer border-none disabled:opacity-50 min-h-[40px]">{savingTpl?'Saving...':'Save'}</button>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <FolderBar section="templates" items={templates} />
            {selectMode==='templates'&&<SelectBar section="templates" items={templates} />}
            {filterByFolder(templates, 'templates').length>0?filterByFolder(templates, 'templates').map((t,idx)=>(
            <div key={t.id} draggable={editTplId!==t.id&&selectMode!=='templates'} onDragStart={()=>tplDrag.onDragStart(idx)} onDragEnter={()=>tplDrag.onDragEnter(idx)} onDragEnd={tplDrag.onDragEnd} onDragOver={e=>e.preventDefault()} className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${editTplId!==t.id&&selectMode!=='templates'?'cursor-grab active:cursor-grabbing':''} hover:shadow-sm transition-shadow`}>
              {selectMode==='templates'&&editTplId!==t.id ? (
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={()=>toggleSelect(t.id)}>
                  {selectedIds.has(t.id)?<CheckSquare className="w-5 h-5 text-crimson flex-shrink-0"/>:<Square className="w-5 h-5 text-gray-300 flex-shrink-0"/>}
                  {t.thumbnail_image_url&&<img src={t.thumbnail_image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100"/>}
                  <span className="font-bold text-navy text-sm flex-1 truncate">{t.label}</span>
                </div>
              ) : editTplId===t.id?(
                <div className="p-4 space-y-2">
                  <input type="text" value={editTplLabel} onChange={e=>setEditTplLabel(e.target.value)} className="w-full px-3 py-2 rounded-lg border-2 border-navy text-sm font-bold focus:outline-none"/>
                  <ThumbPicker value={editTplThumb} onChange={setEditTplThumb} show={showEditTplPicker} setShow={setShowEditTplPicker}/>
                  <textarea value={editTplText} onChange={e=>setEditTplText(e.target.value)} className="w-full min-h-[200px] px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-mono bg-gray-50"/>
                  <div className="flex gap-2 justify-end">
                    <button onClick={()=>setEditTplId(null)} className="px-4 py-2 rounded-lg font-bold text-sm border-2 border-gray-200 text-gray-500 cursor-pointer bg-white min-h-[40px]">Cancel</button>
                    <button onClick={saveEditTemplate} className="px-4 py-2 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson cursor-pointer border-none min-h-[40px]">Save</button>
                  </div>
                </div>
              ):(
                <>
                  {/* Collapsed row */}
                  <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={()=>toggleItem('tpl-'+t.id)}>
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0"/>
                    {t.thumbnail_image_url&&<img src={t.thumbnail_image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100"/>}
                    <span className="font-bold text-navy text-sm flex-1 truncate">{t.label}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{t.exercise_count?`${t.exercise_count} ex`:''}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${openItemId==='tpl-'+t.id?'rotate-90':''}`}/>
                  </div>
                  {/* Expanded */}
                  {openItemId==='tpl-'+t.id&&(
                    <div className="border-t border-gray-100 px-3 py-2.5 bg-gray-50">
                      <p className="text-xs text-gray-400 mb-2">Saved {new Date(t.created_at).toLocaleDateString()}{t.thumbnail_image_url&&' · Has thumbnail'}</p>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={()=>{navigate('/',{state:{templateText:t.template_text,thumbnailImageUrl:t.thumbnail_image_url||''}});}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs text-white bg-gradient-to-r from-navy to-crimson cursor-pointer border-none"><Play className="w-3 h-3"/>Load in Builder</button>
                        <button onClick={()=>doCopy(t.template_text,t.id,'tpl')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-crimson text-crimson hover:bg-crimson/5 cursor-pointer bg-white">{copiedId===t.id+'tpl'?<><CheckCircle2 className="w-3 h-3"/>Copied</>:<><Copy className="w-3 h-3"/>Copy Template</>}</button>
                        {t.thumbnail_image_url&&<button onClick={()=>doCopy(t.thumbnail_image_url!,t.id,'thu')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-purple-600 text-purple-600 hover:bg-purple-50 cursor-pointer bg-white">{copiedId===t.id+'thu'?'✓ Copied':'Copy Thumb URL'}</button>}
                        <button onClick={()=>startEditTemplate(t)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-gray-200 text-gray-500 hover:border-navy cursor-pointer bg-white"><Pencil className="w-3 h-3"/>Edit</button>
                        <button onClick={()=>togglePreview(t.id,'template')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-gray-200 text-gray-500 hover:border-navy cursor-pointer bg-white">{previewId===t.id&&previewType==='template'?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}Preview</button>
                        <button onClick={()=>handleDeleteTemplate(t.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs text-gray-300 hover:text-red-500 cursor-pointer bg-transparent border-none"><Trash2 className="w-3 h-3"/></button>
                      </div>
                      {previewId===t.id&&previewType==='template'&&(<pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-48 overflow-y-auto font-mono mt-2 p-2 bg-white rounded border border-gray-200">{t.template_text.substring(0,3000)}{t.template_text.length>3000?'\n...(truncated)':''}</pre>)}
                    </div>
                  )}
                </>
              )}
            </div>
          )):(<p className="text-sm text-gray-400 text-center py-4">No templates saved yet.</p>)}</div>
        </div>)}
      </div>

      {/* ═══ SAVED MV CODES ═══ */}
      <div className="mb-6">
        <button onClick={()=>setShowCodes(!showCodes)} className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
          <Code className="w-5 h-5 text-purple-700"/><span className="text-lg font-bold text-navy flex-1">Saved MV Codes</span>
          <span className="text-xs font-bold text-gray-400">{codes.length}</span>
          {showCodes && codes.length>0 && <button onClick={e=>{e.stopPropagation();selectMode==='codes'?exitSelectMode():(() => {setSelectMode('codes');setSelectedIds(new Set());})();}} className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer border-none ${selectMode==='codes'?'text-red-500 bg-red-50':'text-gray-400 bg-gray-100 hover:text-navy'}`}>{selectMode==='codes'?'Cancel':'Select'}</button>}
          {showCodes?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
        </button>
        {showCodes&&(<div className="mt-3 space-y-1">
          <FolderBar section="codes" items={codes} />
          {selectMode==='codes'&&<SelectBar section="codes" items={codes} />}
          {filterByFolder(codes, 'codes').length>0?filterByFolder(codes, 'codes').map((code,idx)=>(
            <div key={code.id} draggable={selectMode!=='codes'} onDragStart={()=>codeDrag.onDragStart(idx)} onDragEnter={()=>codeDrag.onDragEnter(idx)} onDragEnd={codeDrag.onDragEnd} onDragOver={e=>e.preventDefault()} className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${selectMode!=='codes'?'cursor-grab active:cursor-grabbing':''} hover:shadow-sm transition-shadow`}>
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={()=>selectMode==='codes'?toggleSelect(code.id):editCodeNameId===code.id?null:toggleItem('code-'+code.id)}>
                {selectMode==='codes'?<div className="flex-shrink-0">{selectedIds.has(code.id)?<CheckSquare className="w-5 h-5 text-crimson"/>:<Square className="w-5 h-5 text-gray-300"/>}</div>:<GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0"/>}
                {editCodeNameId===code.id ? (
                  <div className="flex-1 flex items-center gap-1.5" onClick={e=>e.stopPropagation()}>
                    <input type="text" value={editCodeNameValue} onChange={e=>setEditCodeNameValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSaveCodeName(code.id);if(e.key==='Escape')setEditCodeNameId(null);}} className="flex-1 px-2 py-1 rounded border-2 border-navy text-sm font-bold focus:outline-none" autoFocus/>
                    <button onClick={()=>handleSaveCodeName(code.id)} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0"><Check className="w-4 h-4"/></button>
                    <button onClick={()=>setEditCodeNameId(null)} className="text-xs font-bold text-gray-400 cursor-pointer bg-transparent border-none p-0"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-navy text-sm flex-1 truncate">{code.routine_name}</span>
                    <button onClick={e=>{e.stopPropagation();setEditCodeNameId(code.id);setEditCodeNameValue(code.routine_name);}} className="text-gray-300 hover:text-navy cursor-pointer bg-transparent border-none p-0 flex-shrink-0"><Pencil className="w-3.5 h-3.5"/></button>
                  </>
                )}
                <span className="text-xs text-gray-400 flex-shrink-0">{code.exercise_count} ex · ~{code.duration_minutes}m</span>
                <button onClick={e=>{e.stopPropagation();doCopy(code.mv_code,code.id,'mv');}} className="text-xs font-bold text-white bg-gradient-to-r from-navy to-crimson px-2.5 py-1 rounded cursor-pointer border-none flex-shrink-0">{copiedId===code.id+'mv'?'✓':'MV'}</button>
                <ChevronRight className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${openItemId==='code-'+code.id?'rotate-90':''}`}/>
              </div>
              {/* Expanded */}
              {openItemId==='code-'+code.id&&(
                <div className="border-t border-gray-100 px-3 py-2.5 bg-gray-50">
                  <div className="flex items-center gap-3 mb-2 text-xs flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-gray-500"><ListChecks className="w-3 h-3 text-teal"/>{code.exercise_count} exercises</span>
                    <span className="flex items-center gap-1 font-semibold text-gray-500"><Clock className="w-3 h-3 text-teal"/>~{code.duration_minutes} min</span>
                    {code.thumbnail_badge&&<span className="font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded text-[10px]">{code.thumbnail_badge}</span>}
                    {code.thumbnail_title&&<span className="font-bold text-purple-700 text-[10px]">{code.thumbnail_title}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Saved {new Date(code.created_at).toLocaleDateString()} at {new Date(code.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <button onClick={()=>doCopy(code.mv_code,code.id,'mv')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs text-white bg-gradient-to-r from-navy to-crimson cursor-pointer border-none">{copiedId===code.id+'mv'?<><CheckCircle2 className="w-3 h-3"/>Copied</>:<><Copy className="w-3 h-3"/>MV Code</>}</button>
                    {code.template_text&&<button onClick={()=>{navigate('/',{state:{templateText:code.template_text,thumbnailImageUrl:code.thumbnail_image_url||''}});}} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-navy text-navy hover:bg-navy/5 cursor-pointer bg-white"><Play className="w-3 h-3"/>Rebuild</button>}
                    {code.template_text&&<button onClick={()=>doCopy(code.template_text!,code.id,'tpl')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-crimson text-crimson cursor-pointer bg-white">{copiedId===code.id+'tpl'?'✓ Copied':'Template'}</button>}
                    <button onClick={()=>handleGenerateThumbForCode(code)} disabled={generatingThumbId===code.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-orange-400 text-orange-600 hover:bg-orange-50 cursor-pointer bg-white disabled:opacity-50">{generatingThumbId===code.id?<><Loader2 className="w-3 h-3 animate-spin"/>Generating...</>:<><Image className="w-3 h-3"/>Generate Thumbnail</>}</button>
                  </div>
                  {/* Generated thumbnail preview */}
                  {(generatedThumbUrls[code.id] || code.generated_thumbnail_url) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
                      <img src={generatedThumbUrls[code.id] || code.generated_thumbnail_url!} alt="Thumbnail" className="w-full max-w-xs rounded-lg mb-2" />
                      <button onClick={()=>doCopy(generatedThumbUrls[code.id] || code.generated_thumbnail_url!,code.id,'thumb')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs text-orange-600 border border-orange-300 bg-white hover:bg-orange-50 cursor-pointer">{copiedId===code.id+'thumb'?<><Check className="w-3 h-3"/>Copied!</>:<><Copy className="w-3 h-3"/>Copy Thumbnail URL</>}</button>
                    </div>
                  )}
                  <div className="flex gap-3 flex-wrap items-center">
                    {code.video_url&&<button onClick={()=>doCopy(code.video_url!,code.id,'vid')} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0">{copiedId===code.id+'vid'?'✓':'Video URL'}</button>}
                    {code.thumbnail_image_url&&<button onClick={()=>doCopy(code.thumbnail_image_url!,code.id,'img')} className="text-xs font-bold text-purple-600 cursor-pointer bg-transparent border-none p-0">{copiedId===code.id+'img'?'✓':'Overlay URL'}</button>}
                    <button onClick={()=>togglePreview(code.id,'mv')} className="text-xs font-bold text-purple-700 cursor-pointer bg-transparent border-none p-0 flex items-center gap-0.5">{previewId===code.id&&previewType==='mv'?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}Preview</button>
                    <button onClick={()=>handleDeleteCode(code.id)} className="text-xs font-bold text-gray-300 hover:text-red-500 cursor-pointer bg-transparent border-none p-0"><Trash2 className="w-3 h-3"/></button>
                  </div>
                  {previewId===code.id&&previewType==='mv'&&(<pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-48 overflow-y-auto font-mono mt-2 p-2 bg-white rounded border border-gray-200">{code.mv_code.substring(0,2000)}{code.mv_code.length>2000?'\n...(truncated)':''}</pre>)}
                  {/* Vimeo ID */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {code.vimeo_id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-green-600">Vimeo ID: {code.vimeo_id}</span>
                        <button onClick={()=>doCopy(`https://player.vimeo.com/video/${code.vimeo_id}`,code.id,'vimeo')} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0">{copiedId===code.id+'vimeo'?'✓ Copied':'Copy Player URL'}</button>
                        <button onClick={()=>{setEditingVimeoId(code.id);setVimeoIdInput(code.vimeo_id||'');}} className="text-xs font-bold text-gray-400 hover:text-navy cursor-pointer bg-transparent border-none p-0">Update</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">No Vimeo ID</span>
                        {editingVimeoId!==code.id&&<button onClick={()=>{setEditingVimeoId(code.id);setVimeoIdInput('');}} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0">+ Add Vimeo ID</button>}
                      </div>
                    )}
                    {editingVimeoId===code.id&&(
                      <div className="flex gap-1.5 mt-1.5 items-center">
                        <input type="text" value={vimeoIdInput} onChange={e=>setVimeoIdInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleSaveVimeoId(code.id);if(e.key==='Escape')setEditingVimeoId(null);}} placeholder="Paste Vimeo ID or URL" className="flex-1 px-2 py-1 rounded border-2 border-teal text-xs font-semibold focus:outline-none" autoFocus/>
                        <button onClick={()=>handleSaveVimeoId(code.id)} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0">Save</button>
                        <button onClick={()=>setEditingVimeoId(null)} className="text-xs font-bold text-gray-400 cursor-pointer bg-transparent border-none p-0">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )):(<p className="text-sm text-gray-400 text-center py-4">No saved codes yet.</p>)}
        </div>)}
      </div>

      {/* ═══ RECENT VIDEOS ═══ */}
      <div className="mb-6">
        <button onClick={()=>setShowVideos(!showVideos)} className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
          <Video className="w-5 h-5 text-teal"/><span className="text-lg font-bold text-navy flex-1">Recent Videos</span>
          <span className="text-xs font-bold text-gray-400">{videoJobs.length}</span>
          {showVideos && videoJobs.length>0 && <button onClick={e=>{e.stopPropagation();selectMode==='videos'?exitSelectMode():(() => {setSelectMode('videos');setSelectedIds(new Set());})();}} className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer border-none ${selectMode==='videos'?'text-red-500 bg-red-50':'text-gray-400 bg-gray-100 hover:text-navy'}`}>{selectMode==='videos'?'Cancel':'Select'}</button>}
          {showVideos?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
        </button>
        {showVideos&&(<div className="mt-3">
          <FolderBar section="videos" items={videoJobs} />
          {selectMode==='videos'&&<SelectBar section="videos" items={videoJobs} />}
          {filterByFolder(videoJobs, 'videos').length>0?(<div className="space-y-2">{filterByFolder(videoJobs, 'videos').map((job)=>{
            const date = job.completed_at ? new Date(job.completed_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '';
            return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div onClick={()=>selectMode==='videos'?toggleSelect(job.id):toggleItem('vid-'+job.id)} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                {selectMode==='videos'&&<div className="flex-shrink-0">{selectedIds.has(job.id)?<CheckSquare className="w-5 h-5 text-crimson"/>:<Square className="w-5 h-5 text-gray-300"/>}</div>}
                {job.thumbnail_url && <img src={job.thumbnail_url} alt="" className="w-20 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"/>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy truncate">{job.routine_label || 'Routine'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {job.file_size_mb && <span className="text-xs font-semibold text-gray-400">{job.file_size_mb.toFixed(1)} MB</span>}
                    <span className="text-xs font-semibold text-gray-400">{job.resolution || '720p'}</span>
                    <span className="text-xs font-semibold text-gray-400">{date}</span>
                  </div>
                </div>
                {job.vimeo_id && <span className="text-xs font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full">Vimeo ✓</span>}
                {codes.some(c => c.video_url === job.output_url || (job.vimeo_id && c.vimeo_id === job.vimeo_id)) && <span className="text-xs font-bold text-navy bg-navy/10 px-2 py-0.5 rounded-full">MV</span>}
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${openItemId==='vid-'+job.id?'rotate-90':''}`}/>
              </div>
              {openItemId==='vid-'+job.id&&(
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-2">
                  {/* Copy MV Embed Code */}
                  {(() => { const match = codes.find(c => c.video_url === job.output_url || (job.vimeo_id && c.vimeo_id === job.vimeo_id)); return match ? (
                    <button onClick={()=>doCopy(match.mv_code,'vid-'+job.id,'mvc')} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm text-navy border-2 border-navy bg-white hover:bg-navy/5 cursor-pointer min-h-[40px]">
                      {copiedId==='vid-'+job.id+'mvc' ? <><Check className="w-4 h-4 text-teal"/> Copied!</> : <><Code className="w-4 h-4"/> Copy MV Embed Code</>}
                    </button>
                  ) : null; })()}
                  {/* Copy Thumbnail URL */}
                  {job.thumbnail_url && (
                    <button onClick={()=>doCopy(job.thumbnail_url,'vid-'+job.id,'thumburl')} className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-bold text-xs text-orange-600 border border-orange-200 bg-white hover:bg-orange-50 cursor-pointer min-h-[36px]">
                      {copiedId==='vid-'+job.id+'thumburl' ? <><Check className="w-3.5 h-3.5 text-teal"/> Copied!</> : <><Image className="w-3.5 h-3.5"/> Copy Thumbnail URL</>}
                    </button>
                  )}
                  {/* Download MP4 */}
                  {job.output_url && (
                    <a href={job.output_url} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson no-underline min-h-[40px]">
                      <Download className="w-4 h-4"/> Download MP4
                    </a>
                  )}
                  {/* Upload / Re-upload to Vimeo */}
                  {job.output_url && (
                    <button onClick={async ()=>{
                      setVimeoUploading(job.id);
                      try {
                        const result = await uploadToVimeo({ videoUrl: job.output_url, title: job.routine_label || 'SFH Routine', thumbnailUrl: job.thumbnail_url || undefined });
                        await updateVideoJob(job.id, { vimeo_id: result.vimeoId, vimeo_url: result.vimeoLink });
                        setVideoJobs(p=>p.map(j=>j.id===job.id?{...j,vimeo_id:result.vimeoId,vimeo_url:result.vimeoLink}:j));
                      } catch(e){ alert('Upload failed: '+(e as Error).message); }
                      finally { setVimeoUploading(null); }
                    }} disabled={vimeoUploading===job.id} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm text-white bg-teal hover:bg-teal/90 cursor-pointer border-none min-h-[40px] disabled:opacity-60">
                      {vimeoUploading===job.id ? <><Loader2 className="w-4 h-4 animate-spin"/> Uploading...</> : <><Upload className="w-4 h-4"/> {job.vimeo_id ? 'Re-upload to Vimeo' : 'Upload to Vimeo'}</>}
                    </button>
                  )}
                  {/* Vimeo info */}
                  {job.vimeo_id && (
                    <div className="bg-teal/5 border border-teal/20 rounded-lg p-3">
                      <p className="text-xs font-bold text-teal mb-2">✓ Uploaded to Vimeo — ID: {job.vimeo_id}</p>
                      <div className="flex gap-2">
                        <button onClick={()=>doCopy(job.vimeo_id,'vid-'+job.id,'vimid')} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-navy cursor-pointer hover:bg-gray-50">{copiedId==='vid-'+job.id+'vimid'?<><Check className="w-3 h-3 text-teal"/>Copied</>:<><Copy className="w-3 h-3"/>Copy ID</>}</button>
                        <button onClick={()=>doCopy(`https://player.vimeo.com/video/${job.vimeo_id}`,'vid-'+job.id,'vimurl')} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-navy cursor-pointer hover:bg-gray-50">{copiedId==='vid-'+job.id+'vimurl'?<><Check className="w-3 h-3 text-teal"/>Copied</>:<><Copy className="w-3 h-3"/>Player URL</>}</button>
                        <a href={job.vimeo_url || `https://vimeo.com/${job.vimeo_id}`} target="_blank" rel="noopener" className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-navy no-underline hover:bg-gray-50"><ExternalLink className="w-3 h-3"/>View</a>
                      </div>
                    </div>
                  )}
                  {/* Remove MP4 from Storage (only when on Vimeo and MP4 still exists) */}
                  {job.vimeo_id && job.output_url && (
                    <button onClick={async ()=>{ if(!confirm('Remove MP4 from storage? Thumbnail and Vimeo link will be kept.'))return; try{await cleanupVideoStorage(job.id);setVideoJobs(p=>p.map(j=>j.id===job.id?{...j,output_url:null}:j));}catch(e){console.error(e);alert('Cleanup failed: '+(e as Error).message);} }} className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-bold text-xs text-orange-500 hover:bg-orange-50 cursor-pointer border border-orange-200 bg-white min-h-[36px]">
                      <Trash2 className="w-3.5 h-3.5"/> Remove MP4 from Storage (~{job.file_size_mb ? job.file_size_mb.toFixed(0) : '35'} MB)
                    </button>
                  )}
                  {/* Delete */}
                  <button onClick={async ()=>{ if(!confirm('Delete this video job?'))return; try{await deleteVideoJob(job.id);setVideoJobs(p=>p.filter(j=>j.id!==job.id));}catch(e){console.error(e);} }} className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-bold text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer border border-gray-200 bg-white min-h-[36px]">
                    <Trash2 className="w-3.5 h-3.5"/> Delete
                  </button>
                </div>
              )}
            </div>
          );})}
          </div>):(<p className="text-sm text-gray-400 text-center py-4">No completed videos yet.</p>)}
        </div>)}
      </div>
    </div>
  );
}
