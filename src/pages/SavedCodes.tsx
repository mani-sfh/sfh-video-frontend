import { useState, useEffect } from 'react';
import { getMVCodes, deleteMVCode, getThumbnailImages, saveThumbnailImage, deleteThumbnailImage, getSavedTemplates, deleteSavedTemplate } from '../lib/supabase';
import type { MVCode, ThumbnailImage, SavedTemplate } from '../lib/supabase';
import { Code, Trash2, Clock, ListChecks, Copy, FileText, CheckCircle2, ChevronDown, ChevronUp, ImagePlus, Image } from 'lucide-react';

export default function SavedCodes() {
  const [codes, setCodes] = useState<MVCode[]>([]);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [thumbImages, setThumbImages] = useState<ThumbnailImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<'mv' | 'template' | null>(null);

  // Image Library state
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [savingImage, setSavingImage] = useState(false);

  // Accordion state
  const [showImages, setShowImages] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showCodes, setShowCodes] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [codesData, imagesData, templatesData] = await Promise.all([
          getMVCodes(), getThumbnailImages(), getSavedTemplates()
        ]);
        setCodes(codesData);
        setThumbImages(imagesData);
        setTemplates(templatesData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function handleCopy(text: string, id: string, type: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id + type);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      const b = new Blob([text], { type: 'text/html' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `mv_code_${id}.html`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
    });
  }

  async function handleDeleteCode(id: string) {
    if (!confirm('Delete this saved code?')) return;
    try { await deleteMVCode(id); setCodes((prev) => prev.filter((c) => c.id !== id)); } catch (err) { console.error(err); }
  }

  async function handleAddImage() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    setSavingImage(true);
    try {
      const saved = await saveThumbnailImage({ label: newLabel.trim(), image_url: newUrl.trim() });
      setThumbImages((prev) => [saved, ...prev]);
      setNewLabel(''); setNewUrl('');
    } catch (err) { console.error(err); }
    finally { setSavingImage(false); }
  }

  async function handleDeleteImage(id: string) {
    if (!confirm('Delete this image?')) return;
    try { await deleteThumbnailImage(id); setThumbImages((prev) => prev.filter((img) => img.id !== id)); } catch (err) { console.error(err); }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return;
    try { await deleteSavedTemplate(id); setTemplates((prev) => prev.filter((t) => t.id !== id)); } catch (err) { console.error(err); }
  }

  function toggleExpand(id: string, type: 'mv' | 'template') {
    if (expandedId === id && expandedType === type) { setExpandedId(null); setExpandedType(null); }
    else { setExpandedId(id); setExpandedType(type); }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-navy border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 font-semibold">Loading...</p>
      </div>
    );
  }

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
                <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label: e.g. Module 1 Warm-Up" className="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold" />
                <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Paste OpenArt image URL" className="flex-[2] px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold text-gray-500" />
                <button onClick={handleAddImage} disabled={savingImage || !newLabel.trim() || !newUrl.trim()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md transition-all cursor-pointer border-none disabled:opacity-50 whitespace-nowrap min-h-[44px]">
                  <ImagePlus className="w-4 h-4" /> {savingImage ? '...' : 'Save'}
                </button>
              </div>
            </div>
            {thumbImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {thumbImages.map((img) => (
                  <div key={img.id} className="bg-white rounded-xl border border-gray-200 p-3 flex gap-3">
                    <img src={img.image_url} alt={img.label} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy text-sm truncate">{img.label}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{img.image_url}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { navigator.clipboard.writeText(img.image_url); setCopiedId('img-' + img.id); setTimeout(() => setCopiedId(null), 2000); }} className="text-xs font-bold text-teal hover:text-teal/80 cursor-pointer bg-transparent border-none p-0">
                          {copiedId === 'img-' + img.id ? '✓ Copied!' : 'Copy URL'}
                        </button>
                        <button onClick={() => handleDeleteImage(img.id)} className="text-xs font-bold text-gray-300 hover:text-red-500 cursor-pointer bg-transparent border-none p-0">Delete</button>
                      </div>
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
          <div className="mt-3 space-y-3">
            {templates.length > 0 ? templates.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-navy truncate">{t.label}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {t.exercise_count ? `${t.exercise_count} exercises · ` : ''}
                      Saved {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleCopy(t.template_text, t.id, 'tpl')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm border-2 border-crimson text-crimson hover:bg-crimson/5 transition-all cursor-pointer bg-white min-h-[40px]">
                      {copiedId === t.id + 'tpl' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                    </button>
                    <button onClick={() => toggleExpand(t.id, 'template')} className="px-2 py-2 rounded-lg border-2 border-gray-200 hover:border-navy bg-white cursor-pointer min-h-[40px]">
                      {expandedId === t.id && expandedType === 'template' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedId === t.id && expandedType === 'template' && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-64 overflow-y-auto font-mono">{t.template_text.substring(0, 3000)}{t.template_text.length > 3000 ? '\n\n... (truncated preview)' : ''}</pre>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">No templates saved yet. Click "Export Template" in the Builder to save one.</p>
            )}
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
            {codes.length > 0 ? codes.map((code) => (
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
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      Saved {new Date(code.created_at).toLocaleDateString()} at {new Date(code.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {code.video_url && (
                        <button onClick={() => { navigator.clipboard.writeText(code.video_url!); setCopiedId(code.id + 'vid'); setTimeout(() => setCopiedId(null), 2000); }} className="text-xs font-bold text-teal hover:text-teal/80 cursor-pointer bg-transparent border-none p-0">
                          {copiedId === code.id + 'vid' ? '✓ URL Copied!' : 'Copy Video URL'}
                        </button>
                      )}
                      {code.thumbnail_image_url && (
                        <button onClick={() => { navigator.clipboard.writeText(code.thumbnail_image_url!); setCopiedId(code.id + 'img'); setTimeout(() => setCopiedId(null), 2000); }} className="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer bg-transparent border-none p-0">
                          {copiedId === code.id + 'img' ? '✓ URL Copied!' : 'Copy Overlay URL'}
                        </button>
                      )}
                      {code.generated_thumbnail_url && (
                        <a href={code.generated_thumbnail_url} download target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-orange-600 hover:text-orange-800 no-underline">
                          ↓ Download Thumbnail PNG
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleCopy(code.mv_code, code.id, 'mv')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md transition-all cursor-pointer border-none min-h-[44px]">
                      {copiedId === code.id + 'mv' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> MV Code</>}
                    </button>
                    {code.template_text && (
                      <button onClick={() => handleCopy(code.template_text!, code.id, 'tpl')} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-sm border-2 border-crimson text-crimson hover:bg-crimson/5 transition-all cursor-pointer bg-white min-h-[44px]">
                        {copiedId === code.id + 'tpl' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><FileText className="w-4 h-4" /> Template</>}
                      </button>
                    )}
                    <button onClick={() => handleDeleteCode(code.id)} className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-5 py-2 flex gap-3">
                  <button onClick={() => toggleExpand(code.id, 'mv')} className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer bg-transparent border-none flex items-center gap-1">
                    {expandedId === code.id && expandedType === 'mv' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Preview MV Code
                  </button>
                </div>
                {expandedId === code.id && expandedType === 'mv' && (
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-64 overflow-y-auto font-mono">{code.mv_code.substring(0, 2000)}{code.mv_code.length > 2000 ? '\n\n... (truncated preview)' : ''}</pre>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">No saved codes yet. Click "Copy MV Code" in the Builder to save one.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
