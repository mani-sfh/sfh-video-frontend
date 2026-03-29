import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMVCodes, deleteMVCode, updateMVCode, getThumbnailImages, saveThumbnailImage, deleteThumbnailImage, updateThumbnailImage, getSavedTemplates, deleteSavedTemplate, updateSavedTemplate, saveTemplate } from '../lib/supabase';
import type { MVCode, ThumbnailImage, SavedTemplate } from '../lib/supabase';
import { Code, Trash2, Clock, ListChecks, Copy, FileText, CheckCircle2, ChevronDown, ChevronUp, ChevronRight, ImagePlus, Image, Pencil, Check, X, GripVertical, Plus, Play } from 'lucide-react';

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

  const [showImages, setShowImages] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [editingVimeoId, setEditingVimeoId] = useState<string | null>(null);
  const [vimeoIdInput, setVimeoIdInput] = useState('');

  useEffect(() => { async function load() { try { const [c,i,t] = await Promise.all([getMVCodes(),getThumbnailImages(),getSavedTemplates()]); setCodes(c); setThumbImages(i); setTemplates(t); } catch(e){console.error(e);} finally{setLoading(false);} } load(); }, []);

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
          {showImages?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
        </button>
        {showImages&&(<div className="mt-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3"><div className="flex gap-2">
            <input type="text" value={newImgLabel} onChange={e=>setNewImgLabel(e.target.value)} placeholder="Label" className="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold"/>
            <input type="text" value={newImgUrl} onChange={e=>setNewImgUrl(e.target.value)} placeholder="Paste image URL" className="flex-[2] px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold text-gray-500"/>
            <button onClick={handleAddImage} disabled={savingImage||!newImgLabel.trim()||!newImgUrl.trim()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md cursor-pointer border-none disabled:opacity-50 whitespace-nowrap min-h-[44px]"><ImagePlus className="w-4 h-4"/>{savingImage?'...':'Save'}</button>
          </div></div>
          {thumbImages.length>0?(<div className="space-y-1">{thumbImages.map((img,idx)=>(
            <div key={img.id} draggable={editImgId!==img.id} onDragStart={()=>imgDrag.onDragStart(idx)} onDragEnter={()=>imgDrag.onDragEnter(idx)} onDragEnd={imgDrag.onDragEnd} onDragOver={e=>e.preventDefault()} className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${editImgId!==img.id?'cursor-grab active:cursor-grabbing':''} hover:shadow-sm transition-shadow`}>
              {/* Collapsed row */}
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={()=>editImgId!==img.id&&toggleItem('img-'+img.id)}>
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0"/>
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
          <div className="space-y-1">{templates.length>0?templates.map((t,idx)=>(
            <div key={t.id} draggable={editTplId!==t.id} onDragStart={()=>tplDrag.onDragStart(idx)} onDragEnter={()=>tplDrag.onDragEnter(idx)} onDragEnd={tplDrag.onDragEnd} onDragOver={e=>e.preventDefault()} className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${editTplId!==t.id?'cursor-grab active:cursor-grabbing':''} hover:shadow-sm transition-shadow`}>
              {editTplId===t.id?(
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
          {showCodes?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
        </button>
        {showCodes&&(<div className="mt-3 space-y-1">
          {codes.length>0?codes.map((code,idx)=>(
            <div key={code.id} draggable onDragStart={()=>codeDrag.onDragStart(idx)} onDragEnter={()=>codeDrag.onDragEnter(idx)} onDragEnd={codeDrag.onDragEnd} onDragOver={e=>e.preventDefault()} className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow">
              {/* Collapsed row */}
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={()=>toggleItem('code-'+code.id)}>
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0"/>
                <span className="font-bold text-navy text-sm flex-1 truncate">{code.routine_name}</span>
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
                  </div>
                  <div className="flex gap-3 flex-wrap items-center">
                    {code.video_url&&<button onClick={()=>doCopy(code.video_url!,code.id,'vid')} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0">{copiedId===code.id+'vid'?'✓':'Video URL'}</button>}
                    {code.thumbnail_image_url&&<button onClick={()=>doCopy(code.thumbnail_image_url!,code.id,'img')} className="text-xs font-bold text-purple-600 cursor-pointer bg-transparent border-none p-0">{copiedId===code.id+'img'?'✓':'Overlay URL'}</button>}
                    {code.generated_thumbnail_url&&<a href={code.generated_thumbnail_url} download target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-orange-600 no-underline">↓ Thumbnail PNG</a>}
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
    </div>
  );
}
