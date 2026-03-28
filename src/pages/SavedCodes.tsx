import { useState, useEffect } from 'react';
import { getMVCodes, deleteMVCode } from '../lib/supabase';
import type { MVCode } from '../lib/supabase';
import { Code, Trash2, Clock, ListChecks, Copy, FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function SavedCodes() {
  const [codes, setCodes] = useState<MVCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<'mv' | 'template' | null>(null);

  useEffect(() => {
    async function load() {
      try { setCodes(await getMVCodes()); }
      catch (err) { console.error(err); }
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

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved code?')) return;
    try {
      await deleteMVCode(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) { console.error(err); }
  }

  function toggleExpand(id: string, type: 'mv' | 'template') {
    if (expandedId === id && expandedType === type) {
      setExpandedId(null);
      setExpandedType(null);
    } else {
      setExpandedId(id);
      setExpandedType(type);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-navy border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 font-semibold">Loading saved codes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-navy mb-2">Saved MV Codes</h2>
      <p className="text-gray-500 font-semibold mb-6">Every MV embed code you generate is saved here. Copy anytime.</p>
      {codes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Code className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">No saved codes yet.</p>
          <p className="text-gray-400 text-sm mt-1">Click "Copy MV Code" in the Builder to save one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => (
            <div key={code.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-navy truncate">{code.routine_name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-gray-500">
                      <ListChecks className="w-4 h-4 text-teal" />{code.exercise_count} exercises
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-gray-500">
                      <Clock className="w-4 h-4 text-teal" />~{code.duration_minutes} min
                    </span>
                    {code.thumbnail_badge && (
                      <span className="text-xs font-bold text-white bg-orange-600 px-2 py-0.5 rounded">{code.thumbnail_badge}</span>
                    )}
                    {code.thumbnail_title && (
                      <span className="text-xs font-bold text-purple-700">{code.thumbnail_title}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    Saved {new Date(code.created_at).toLocaleDateString()} at {new Date(code.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {code.video_url && (
                    <a href={code.video_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-teal hover:underline mt-1 inline-block">Video URL</a>
                  )}
                  {code.thumbnail_image_url && (
                    <a href={code.thumbnail_image_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-purple-600 hover:underline mt-1 inline-block ml-3">Thumbnail Image</a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(code.mv_code, code.id, 'mv')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md transition-all cursor-pointer border-none min-h-[44px]"
                  >
                    {copiedId === code.id + 'mv' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> MV Code</>}
                  </button>
                  {code.template_text && (
                    <button
                      onClick={() => handleCopy(code.template_text!, code.id, 'tpl')}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-sm border-2 border-crimson text-crimson hover:bg-crimson/5 transition-all cursor-pointer bg-white min-h-[44px]"
                    >
                      {copiedId === code.id + 'tpl' ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><FileText className="w-4 h-4" /> Template</>}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview toggles */}
              <div className="border-t border-gray-100 px-5 py-2 flex gap-3">
                <button
                  onClick={() => toggleExpand(code.id, 'mv')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer bg-transparent border-none flex items-center gap-1"
                >
                  {expandedId === code.id && expandedType === 'mv' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Preview MV Code
                </button>
                {code.template_text && (
                  <button
                    onClick={() => toggleExpand(code.id, 'template')}
                    className="text-xs font-bold text-crimson hover:text-crimson/80 cursor-pointer bg-transparent border-none flex items-center gap-1"
                  >
                    {expandedId === code.id && expandedType === 'template' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Preview Template
                  </button>
                )}
              </div>

              {/* Expanded preview */}
              {expandedId === code.id && expandedType === 'mv' && (
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-64 overflow-y-auto font-mono">{code.mv_code.substring(0, 2000)}{code.mv_code.length > 2000 ? '\n\n... (truncated preview)' : ''}</pre>
                </div>
              )}
              {expandedId === code.id && expandedType === 'template' && code.template_text && (
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-h-64 overflow-y-auto font-mono">{code.template_text.substring(0, 2000)}{code.template_text.length > 2000 ? '\n\n... (truncated preview)' : ''}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
