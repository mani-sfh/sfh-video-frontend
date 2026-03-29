import { useState, useEffect, useRef } from 'react';
import { getMVCodes, deleteMVCode, getThumbnailImages, saveThumbnailImage, deleteThumbnailImage, updateThumbnailImage, getSavedTemplates, deleteSavedTemplate, updateSavedTemplate, saveTemplate } from '../lib/supabase';
import type { MVCode, ThumbnailImage, SavedTemplate } from '../lib/supabase';
import { Code, Trash2, Clock, ListChecks, Copy, FileText, CheckCircle2, ChevronDown, ChevronUp, ImagePlus, Image, Pencil, Check, X, GripVertical, Plus } from 'lucide-react';

export default function SavedCodes() {
  const [codes, setCodes] = useState<MVCode[]>([]);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [thumbImages, setThumbImages] = useState<ThumbnailImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<'mv' | 'template' | null>(null);

  // Image add
  const [newImgLabel, setNewImgLabel] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [savingImage, setSavingImage] = useState(false);

  // Image edit
  const [editImgId, setEditImgId] = useState<string | null>(null);
  const [editImgLabel, setEditImgLabel] = useState('');
  const [editImgUrl, setEditImgUrl] = useState('');

  // Template add
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTplLabel, setNewTplLabel] = useState('');
  const [newTplText, setNewTplText] = useState('');
  const [newTplThumb, setNewTplThumb] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Template edit
  const [editTplId, setEditTplId] = useState<string | null>(null);
  const [editTplLabel, setEditTplLabel] = useState('');
  const [editTplText, setEditTplText] = useState('');
  const [editTplThumb, setEditTplThumb] = useState('');

  // Drag state for images
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Accordions
  const [showImages, setShowImages] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showCodes, setShowCodes] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [c, i, t] = await Promise.all([getMVCodes(), getThumbnailImages(), getSavedTemplates()]);
        setCodes(c); setThumbImages(i); setTemplates(t);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function doCopy(text: string, id: string, type: string) {
    navigator.clipboard.writeText(text).then(() => { setCopiedId(id + type); setTimeout(() => setCopiedId(null), 2000); }).catch(() => {});
  }

  // ── IMAGE HANDLERS ──
  async function handleAddImage() {
    if (!newImgLabel.trim() || !newImgUrl.trim()) return;
    setSavingImage(true);
    try {
      const maxOrder = thumbImages.reduce((max, img) => Math.max(max, img.sort_order || 0), 0);
      const saved = await saveThumbnailImage({ label: newImgLabel.trim(), image_url: newImgUrl.trim(), sort_order: maxOrder + 1 });
      setThumbImages(prev => [...prev, saved]);
      setNewImgLabel(''); setNewImgUrl('');
    } catch (err) { console.error(err); }
    finally { setSavingImage(false); }
  }

  async function handleDeleteImage(id: string) {
    if (!confirm('Delete this image?')) return;
    try { await deleteThumbnailImage(id); setThumbImages(prev => prev.filter(i => i.id !== id)); } catch (err) { console.error(err); }
  }

  function startEditImage(img: ThumbnailImage) {
    setEditImgId(img.id); setEditImgLabel(img.label); setEditImgUrl(img.image_url);
  }

  async function saveEditImage() {
    if (!editImgId || !editImgLabel.trim() || !editImgUrl.trim()) return;
    try {
      await updateThumbnailImage(editImgId, { label: editImgLabel.trim(), image_url: editImgUrl.trim() });
      setThumbImages(prev => prev.map(i => i.id === editImgId ? { ...i, label: editImgLabel.trim(), image_url: editImgUrl.trim() } : i));
      setEditImgId(null);
    } catch (err) { console.error(err); }
  }

  // Drag and drop
  function handleDragStart(index: number) { dragItem.current = index; }
  function handleDragEnter(index: number) { dragOverItem.current = index; }
  async function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      dragItem.current = null; dragOverItem.current = null; return;
    }
    const updated = [...thumbImages];
    const dragged = updated.splice(dragItem.current, 1)[0];
    updated.splice(dragOverItem.current, 0, dragged);
    setThumbImages(updated);
    dragItem.current = null; dragOverItem.current = null;
    // Persist order
    for (let i = 0; i < updated.length; i++) {
      try { await updateThumbnailImage(updated[i].id, { sort_order: i }); } catch (e) {}
    }
  }

  // ── TEMPLATE HANDLERS ──
  async function handleAddTemplate() {
    if (!newTplLabel.trim() || !newTplText.trim()) return;
    setSavingTemplate(true);
    try {
      const saved = await saveTemplate({ label: newTplLabel.trim(), template_text: newTplText.trim(), thumbnail_image_url: newTplThumb.trim() || undefined });
      setTemplates(prev => [saved, ...prev]);
      setNewTplLabel(''); setNewTplText(''); setNewTplThumb(''); setShowAddTemplate(false);
    } catch (err) { console.error(err); }
    finally { setSavingTemplate(false); }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return;
    try { await deleteSavedTemplate(id); setTemplates(prev => prev.filter(t => t.id !== id)); } catch (err) { console.error(err); }
  }

  function startEditTemplate(t: SavedTemplate) {
    setEditTplId(t.id); setEditTplLabel(t.label); setEditTplText(t.template_text); setEditTplThumb(t.thumbnail_image_url || '');
  }

  async function saveEditTemplate() {
    if (!editTplId || !editTplLabel.trim()) return;
    try {
      await updateSavedTemplate(editTplId, { label: editTplLabel.trim(), template_text: editTplText, thumbnail_image_url: editTplThumb.trim() || undefined });
      setTemplates(prev => prev.map(t => t.id === editTplId ? { ...t, label: editTplLabel.trim(), template_text: editTplText, thumbnail_image_url: editTplThumb.trim() || undefined } : t));
      setEditTplId(null);
    } catch (err) { console.error(err); }
  }

  async function handleDeleteCode(id: string) {
    if (!confirm('Delete this saved code?')) return;
    try { await deleteMVCode(id); setCodes(prev => prev.filter(c => c.id !== id)); } catch (err) { console.error(err); }
  }

  function toggleExpand(id: string, type: 'mv' | 'template') {
    if (expandedId === id && expandedType === type) { setExpandedId(null); setExpandedType(null); }
    else { setExpandedId(id); setExpandedType(type); }
  }

  if (loading) return (
    <div className="text-center py-20">
      <div className="animate-spin w-10 h-10 border-4 border-navy border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-500 font-semibold">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">

      {/* ═══ ACCORDION 1: Thumbnail Image Library ═══ */}
      <div className="mb-6">
        <button onClick={() => setShowImages(!showImages)} className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
          <Image className="w-5 h-5 text-purple-700" />
          <span className="text-lg font-bold text-navy flex-1">Thumbnail Image Library</span>
          <span className="text-xs font-bold text-gray-400">{thumbImages.length} images</span>
          {showImages ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showImages && (
          <div className="mt-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <div className="flex gap-2">
                <input type="text" value={newImgLabel} onChange={e => setNewImgLabel(e.target.value)} placeholder="Label: e.g. Module 1 Warm-Up" className="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold" />
                <input type="text" value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)} placeholder="Paste image URL" className="flex-[2] px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold text-gray-500" />
                <button onClick={handleAddImage} disabled={savingImage || !newImgLabel.trim() || !newImgUrl.trim()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md cursor-pointer border-none disabled:opacity-50 whitespace-nowrap min-h-[44px]">
                  <ImagePlus className="w-4 h-4" /> {savingImage ? '...' : 'Save'}
                </button>
              </div>
            </div>
            {thumbImages.length > 0 ? (
              <div className="space-y-2">
                {thumbImages.map((img, idx) => (
                  <div key={img.id} draggable onDragStart={() => handleDragStart(idx)} onDragEnter={() => handleDragEnter(idx)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                    className="bg-white rounded-xl border border-gray-200 p-3 flex gap-3 items-center cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <img src={img.image_url} alt={img.label} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      {editImgId === img.id ? (
                        <div className="space-y-1.5">
                          <input type="text" value={editImgLabel} onChange={e => setEditImgLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEditImage(); if (e.key === 'Escape') setEditImgId(null); }} className="w-full px-2 py-1 rounded border-2 border-navy text-sm font-semibold focus:outline-none" autoFocus />
                          <input type="text" value={editImgUrl} onChange={e => setEditImgUrl(e.target.value)} className="w-full px-2 py-1 rounded border-2 border-gray-200 text-xs text-gray-500 font-semibold focus:outline-none focus:border-navy" />
                          <div className="flex gap-2">
                            <button onClick={saveEditImage} className="text-xs font-bold text-teal cursor-pointer bg-transparent border-none p-0 flex items-center gap-0.5"><Check className="w-3 h-3" /> Save</button>
                            <button onClick={() => setEditImgId(null)} className="text-xs font-bold text-gray-400 cursor-pointer bg-transparent border-none p-0 flex items-center gap-0.5"><X className="w-3 h-3" /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-navy text-sm truncate">{img.label}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{img.image_url}</p>
                          <div className="flex gap-3 mt-1">
                            <button onClick={() => doCopy(img.image_url, 'img-' + img.id, '')} className="text-xs font-bold text-teal hover:text-teal/80 cursor-pointer bg-transparent border-none p-0">
                              {copiedId === 'img-' + img.id ? '✓ Copied!' : 'Copy URL'}
                            </button>
                            <button onClick={() => startEditImage(img)} className="text-xs font-bold text-gray-400 hover:text-navy cursor-pointer bg-transparent border-none p-0 flex items-center gap-0.5"><Pencil className="w-3 h-3" /> Edit</button>
                            <button onClick={() => handleDeleteImage(img.id)} className="text-xs font-bold text-gray-300 hover:text-red-500 cursor-pointer bg-transparent border-none p-0">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No images saved yet.</p>
            )}
          </div>
        )}
      </div>

      {/* ═══ ACCORDION 2: Saved Templates ═══ */}
      <div className="mb-6">
        <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
          <FileText className="w-5 h-5 text-crimson" />
          <span className="text-lg font-bold text-navy flex-1">Saved Templates</span>
          <span className="text-xs font-bold text-gray-400">{templates.length} templates</span>
          {showTemplates ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showTemplates && (
          <div className="mt-3">
            {/* Add template button / form */}
            {!showAddTemplate ? (
              <button onClick={() => setShowAddTemplate(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm border-2 border-dashed border-crimson/30 text-crimson hover:bg-crimson/5 cursor-pointer bg-white w-full justify-center mb-3 min-h-[44px]">
                <Plus className="w-4 h-4" /> Add Template Manually
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 space-y-2">
                <input type="text" value={newTplLabel} onChange={e => setNewTplLabel(e.target.value)} placeholder="Template name: e.g. Module 1: STEP Into Warm-Up" className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold" />
                <input type="text" value={newTplThumb} onChange={e => setNewTplThumb(e.target.value)} placeholder="Thumbnail image URL (optional)" className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-semibold text-gray-500" />
                <textarea value={newTplText} onChange={e => setNewTplText(e.target.value)} placeholder="Paste template text..." className="w-full min-h-[200px] px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-mono bg-gray-50" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowAddTemplate(false); setNewTplLabel(''); setNewTplText(''); setNewTplThumb(''); }} className="px-4 py-2 rounded-lg font-bold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer bg-white min-h-[40px]">Cancel</button>
                  <button onClick={handleAddTemplate} disabled={savingTemplate || !newTplLabel.trim() || !newTplText.trim()} className="px-4 py-2 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md cursor-pointer border-none disabled:opacity-50 min-h-[40px]">{savingTemplate ? 'Saving...' : 'Save Template'}</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {templates.length > 0 ? templates.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {editTplId === t.id ? (
                    /* ── EDIT MODE ── */
                    <div className="p-4 space-y-2">
                      <input type="text" value={editTplLabel} onChange={e => setEditTplLabel(e.target.value)} className="w-full px-3 py-2 rounded-lg border-2 border-navy text-sm font-bold focus:outline-none" />
                      <input type="text" value={editTplThumb} onChange={e => setEditTplThumb(e.target.value)} placeholder="Thumbnail image URL (optional)" className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-semibold text-gray-500" />
                      <textarea value={editTplText} onChange={e => setEditTplText(e.target.value)} className="w-full min-h-[200px] px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-mono bg-gray-50" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditTplId(null)} className="px-4 py-2 rounded-lg font-bold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer bg-white min-h-[40px]">Cancel</button>
                        <button onClick={saveEditTemplate} className="px-4 py-2 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md cursor-pointer border-none min-h-[40px]">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    /* ── VIEW MODE ── */
                    <>
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex gap-3 min-w-0 flex-1">
                          {t.thumbnail_image_url && (
                            <img src={t.thumbnail_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-navy truncate">{t.label}</h3>
                            <p className="text-xs text-gray-400 mt-1">
                              {t.exercise_count ? `${t.exercise_count} exercises · ` : ''}
                              Saved {new Date(t.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => doCopy(t.template_text, t.id, 'tpl')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm border-2 border-crimson text-crimson hover:bg-crimson/5 cursor-pointer bg-white min-h-[40px]">
                            {copiedId === t.id + 'tpl' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                          </button>
                          <button onClick={() => startEditTemplate(t)} className="px-2 py-2 rounded-lg border-2 border-gray-200 hover:border-navy bg-white cursor-pointer min-h-[40px]">
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </button>
                          <button onClick={() => toggleExpand(t.id, 'template')} className="px-2 py-2 rounded-lg border-2 border-gray-200 hover:border-navy bg-white cursor-pointer min-h-[40px]">
                            {expandedId === t.id && expandedType === 'template' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </button>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {expandedId === t.id && expandedType === 'template' && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-64 overflow-y-auto font-mono">{t.template_text.substring(0, 3000)}{t.template_text.length > 3000 ? '\n\n... (truncated)' : ''}</pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No templates saved yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ ACCORDION 3: Saved MV Codes ═══ */}
      <div className="mb-6">
        <button onClick={() => setShowCodes(!showCodes)} className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
          <Code className="w-5 h-5 text-purple-700" />
          <span className="text-lg font-bold text-navy flex-1">Saved MV Codes</span>
          <span className="text-xs font-bold text-gray-400">{codes.length} codes</span>
          {showCodes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showCodes && (
          <div className="mt-3 space-y-3">
            {codes.length > 0 ? codes.map(code => (
              <div key={code.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-navy truncate">{code.routine_name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-gray-500"><ListChecks className="w-4 h-4 text-teal" />{code.exercise_count} exercises</span>
                      <span className="flex items-center gap-1 font-semibold text-gray-500"><Clock className="w-4 h-4 text-teal" />~{code.duration_minutes} min</span>
                      {code.thumbnail_badge && <span className="text-xs font-bold text-white bg-orange-600 px-2 py-0.5 rounded">{code.thumbnail_badge}</span>}
                      {code.thumbnail_title && <span className="text-xs font-bold text-purple-700">{code.thumbnail_title}</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Saved {new Date(code.created_at).toLocaleDateString()} at {new Date(code.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {code.video_url && <button onClick={() => doCopy(code.video_url!, code.id, 'vid')} className="text-xs font-bold text-teal hover:text-teal/80 cursor-pointer bg-transparent border-none p-0">{copiedId === code.id + 'vid' ? '✓ Copied!' : 'Copy Video URL'}</button>}
                      {code.thumbnail_image_url && <button onClick={() => doCopy(code.thumbnail_image_url!, code.id, 'img')} className="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer bg-transparent border-none p-0">{copiedId === code.id + 'img' ? '✓ Copied!' : 'Copy Overlay URL'}</button>}
                      {code.generated_thumbnail_url && <a href={code.generated_thumbnail_url} download target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-orange-600 hover:text-orange-800 no-underline">↓ Thumbnail PNG</a>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => doCopy(code.mv_code, code.id, 'mv')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md cursor-pointer border-none min-h-[44px]">
                      {copiedId === code.id + 'mv' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> MV Code</>}
                    </button>
                    {code.template_text && <button onClick={() => doCopy(code.template_text!, code.id, 'tpl')} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-sm border-2 border-crimson text-crimson hover:bg-crimson/5 cursor-pointer bg-white min-h-[44px]">{copiedId === code.id + 'tpl' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><FileText className="w-4 h-4" /> Template</>}</button>}
                    <button onClick={() => handleDeleteCode(code.id)} className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-5 py-2">
                  <button onClick={() => toggleExpand(code.id, 'mv')} className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer bg-transparent border-none flex items-center gap-1">
                    {expandedId === code.id && expandedType === 'mv' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Preview MV Code
                  </button>
                </div>
                {expandedId === code.id && expandedType === 'mv' && (
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-64 overflow-y-auto font-mono">{code.mv_code.substring(0, 2000)}{code.mv_code.length > 2000 ? '\n\n... (truncated)' : ''}</pre>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">No saved codes yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
