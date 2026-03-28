import { useState, useEffect, useMemo } from 'react';
import { getExercises, saveRoutine, createVideoJob, getVideoJob, generateRoutineVideo, supabase } from '../lib/supabase';
import type { Exercise } from '../lib/supabase';
import ExerciseCard from '../components/ExerciseCard';
import PlaylistItem from '../components/PlaylistItem';
import TemplateModal from '../components/TemplateModal';
import { Search, Download, Save, Trash2, Clock, ListChecks, X, Video, Loader2, CheckCircle2, XCircle, Play, FileText, Code } from 'lucide-react';
import VideoStoryboard from '../components/storyboard/VideoStoryboard';
import { parseTemplate, mergeTemplateWithDb, generateTemplateText } from '../lib/templateParser';
import type { TemplateMetadata } from '../lib/templateParser';
import { generateMVCode } from '../lib/mvCodeGenerator';

export default function Builder() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCodePrefix, setActiveCodePrefix] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Exercise[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState('');
  const [thumbnailBadge, setThumbnailBadge] = useState('');
  const [thumbnailTitle, setThumbnailTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMobilePlaylist, setShowMobilePlaylist] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoJobStatus, setVideoJobStatus] = useState<string | null>(null);
  const [videoOutputUrl, setVideoOutputUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<number | null>(null);
  const [videoCurrentStep, setVideoCurrentStep] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<'720p' | '1080p'>('720p');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showStoryboard, setShowStoryboard] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateText, setTemplateText] = useState('');
  const [templateData, setTemplateData] = useState<TemplateMetadata | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mvCopySuccess, setMvCopySuccess] = useState(false);

  const codePrefixes = useMemo(() => {
    const prefixMap = new Map<string, number>();
    exercises.forEach((ex) => {
      if (ex.code) {
        const prefix = ex.code.match(/^[A-Z]+/)?.[0] || '';
        if (prefix) prefixMap.set(prefix, (prefixMap.get(prefix) || 0) + 1);
      }
    });
    return Array.from(prefixMap.entries()).map(([prefix, count]) => ({ prefix, count })).sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [exercises]);

  useEffect(() => { async function load() { try { setExercises(await getExercises()); } catch (err) { console.error(err); } finally { setLoading(false); } } load(); }, []);

  const filtered = useMemo(() => {
    let result = exercises;
    if (activeCodePrefix) result = result.filter((ex) => ex.code?.startsWith(activeCodePrefix));
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter((ex) => ex.name.toLowerCase().includes(q) || (ex.code && ex.code.toLowerCase().includes(q)) || (ex.coaching_cue && ex.coaching_cue.toLowerCase().includes(q)) || (ex.category && ex.category.toLowerCase().includes(q)) || (ex.position_type && ex.position_type.toLowerCase().includes(q))); }
    return result;
  }, [exercises, search, activeCodePrefix]);

  const playlistIds = new Set(playlist.map((ex) => ex.id));
  function toggleExercise(exercise: Exercise) { if (playlistIds.has(exercise.id)) setPlaylist((prev) => prev.filter((ex) => ex.id !== exercise.id)); else setPlaylist((prev) => [...prev, exercise]); }
  function removeFromPlaylist(id: string) { setPlaylist((prev) => prev.filter((ex) => ex.id !== id)); }
  function moveItem(index: number, direction: number) { const n = [...playlist]; const ni = index + direction; if (ni < 0 || ni >= n.length) return; [n[index], n[ni]] = [n[ni], n[index]]; setPlaylist(n); }
  function clearPlaylist() { if (playlist.length > 0 && confirm('Clear all exercises?')) { setPlaylist([]); setRoutineName(''); } }
  function getTotalTime() { return playlist.reduce((s, ex) => s + (ex.duration_minutes || 1), 0); }

  async function loadTemplate(text: string) {
    const parsed = parseTemplate(text);
    if (!parsed.exercises.length) { alert('No exercises found.'); return; }
    setRoutineName(parsed.routineName);
    setTemplateData({ subtitle: parsed.subtitle, level: parsed.level, estimatedTime: parsed.estimatedTime, condition: parsed.condition, equipment: parsed.equipmentItems });
    const codes = parsed.exercises.map(e => e.code);
    const { data: dbExercises, error } = await supabase.from('exercises').select('*').in('code', codes);
    if (error || !dbExercises) { alert('Error: ' + (error?.message || 'Unknown')); return; }
    const { playlist: lp, notFound } = mergeTemplateWithDb(parsed, dbExercises);
    setPlaylist(lp);
    if (notFound.length > 0) alert('Not found: ' + notFound.join(', '));
    setShowTemplateModal(false); setTemplateText('');
  }

  function exportTemplate() {
    if (playlist.length === 0) return;
    const t = generateTemplateText(playlist, routineName, getTotalTime(), templateData);
    navigator.clipboard.writeText(t).then(() => alert('Template copied!')).catch(() => {
      const b = new Blob([t], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = (routineName || 'Template').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') + '.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
    });
  }

  function exportJSON() {
    if (playlist.length === 0) return;
    const data = { program_name: 'Senior Fitness Hub', label: routineName || 'Custom Routine', subtitle: templateData?.subtitle || '', level: templateData?.level || '', condition: templateData?.condition || '',
      equipment: templateData?.equipment?.length ? templateData.equipment : ['Exercise mat or firm surface', 'Sturdy chair without wheels', 'Comfortable, non-slip footwear'],
      exercises: playlist.map((ex) => ({ code: ex.code, name: ex.name, vimeo_id: ex.vimeo_id, download_url: ex.download_url, time_display: ex.time_display || `${ex.duration_minutes || 1} min`, duration_sec: Math.round((ex.duration_minutes || 1) * 60), coaching_cue: ex.coaching_cue, focus: ex.focus || '', bilateral: ex.bilateral === 'yes', start_side: ex.start_side || 'right', category: ex.category, position_type: ex.position_type, main_image_url: ex.main_image_url, left_image_url: ex.left_image_url, right_image_url: ex.right_image_url }))
    };
    const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = (routineName || 'Routine').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') + '.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
  }

  async function handleSave() {
    if (playlist.length === 0 || !routineName.trim()) return; setSaving(true);
    try { await saveRoutine({ name: routineName, exercise_ids: playlist.map((ex) => ex.id), total_exercises: playlist.length, estimated_minutes: getTotalTime() }); alert('Saved!'); }
    catch (err) { alert('Error: ' + (err as Error).message); } finally { setSaving(false); }
  }

  function handleGenerateVideo() { if (playlist.length === 0) return; setShowStoryboard(true); }
  function handleStoryboardApprove() { setShowStoryboard(false); setShowResolutionModal(true); }

  async function startVideoGeneration() {
    setShowResolutionModal(false);
    try {
      setVideoJobStatus('pending'); setVideoProgress(0); setVideoError(null); setVideoOutputUrl(null); setVideoCurrentStep('Initializing...');
      const job = await createVideoJob({ status: 'pending', routine_label: routineName || 'Custom Routine', exercise_ids: playlist.map((ex) => ex.id), resolution: selectedResolution });
      setVideoJobId(job.id);
      const overrides: Record<string, { focus?: string; start_side?: string; position_type?: string }> = {};
      for (const ex of playlist) { const o: any = {}; if (ex.focus) o.focus = ex.focus; if (ex.start_side) o.start_side = ex.start_side; if (ex.position_type) o.position_type = ex.position_type; if (Object.keys(o).length > 0) overrides[ex.id] = o; }
      await generateRoutineVideo({ jobId: job.id, routineName: routineName || 'Custom Routine', exerciseIds: playlist.map((ex) => ex.id), resolution: selectedResolution, totalDuration: `~${getTotalTime()} minutes`, equipment: templateData?.equipment, subtitle: templateData?.subtitle, level: templateData?.level, condition: templateData?.condition, thumbnailImageUrl: thumbnailImageUrl || undefined, thumbnailBadge: thumbnailBadge || undefined, thumbnailTitle: thumbnailTitle || undefined, exerciseOverrides: Object.keys(overrides).length > 0 ? overrides : undefined });
      startPolling(job.id);
    } catch (err) { setVideoError((err as Error).message); setVideoJobStatus('failed'); }
  }

  function startPolling(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const job = await getVideoJob(jobId); setVideoJobStatus(job.status); setVideoCurrentStep(job.current_step || 'Processing...');
        if (job.progress_percentage != null) setVideoProgress(job.progress_percentage);
        if (job.status === 'completed') { setVideoProgress(100); setVideoOutputUrl(job.output_url || null); setVideoDuration(job.duration_seconds || null); setVideoFileSize(job.file_size_mb || null); clearInterval(interval); }
        else if (job.status === 'failed') { setVideoError(job.error_message || 'Failed'); clearInterval(interval); }
      } catch (err) { setVideoError('Status check failed'); setVideoJobStatus('failed'); clearInterval(interval); }
    }, 3000);
  }

  function closeVideoModal() { setVideoJobId(null); setVideoJobStatus(null); setVideoProgress(0); setVideoError(null); setVideoOutputUrl(null); setShowVideoPlayer(false); setVideoDuration(null); setVideoFileSize(null); setVideoCurrentStep(null); }

  async function handleDownloadVideo() {
    if (!videoOutputUrl) return; setIsDownloading(true);
    try { const r = await fetch(videoOutputUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = (routineName || 'Video').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') + '.mp4'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); }
    catch (err) { window.open(videoOutputUrl, '_blank'); } finally { setIsDownloading(false); }
  }

  function handleBuildAnother() { closeVideoModal(); setPlaylist([]); setRoutineName(''); }

  function handleCopyMVCode() {
    if (playlist.length === 0) return;
    const mvCode = generateMVCode(playlist, routineName || 'Custom Routine', getTotalTime(), templateData);
    navigator.clipboard.writeText(mvCode).then(() => {
      setMvCopySuccess(true);
      setTimeout(() => setMvCopySuccess(false), 2500);
    }).catch(() => {
      const b = new Blob([mvCode], { type: 'text/html' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = (routineName || 'MV_Code').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') + '_mv.html';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
    });
  }

  if (loading) return (<div className="text-center py-20"><div className="animate-spin w-10 h-10 border-4 border-navy border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-gray-500 font-semibold">Loading exercise library...</p></div>);

  return (
    <div className="flex gap-6 relative">
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises by name, code, category, or position..." className="w-full pl-11 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold bg-white" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy cursor-pointer bg-transparent border-none"><X className="w-4 h-4" /></button>}
            </div>
            <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm border-2 border-crimson text-crimson bg-white hover:bg-crimson/5 cursor-pointer whitespace-nowrap min-h-[44px]"><FileText className="w-4 h-4" /> Load Template</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveCodePrefix(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border-2 transition-all ${!activeCodePrefix ? 'bg-navy text-white border-navy' : 'bg-white text-navy border-gray-200 hover:border-navy/30'}`}>All ({exercises.length})</button>
            {codePrefixes.map(({ prefix, count }) => (<button key={prefix} onClick={() => setActiveCodePrefix(activeCodePrefix === prefix ? null : prefix)} className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border-2 transition-all ${activeCodePrefix === prefix ? 'bg-crimson text-white border-crimson' : 'bg-white text-gray-600 border-gray-200 hover:border-crimson/30'}`}>{prefix} ({count})</button>))}
          </div>
        </div>
        <p className="text-sm text-gray-400 font-semibold mb-3">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}{search && ` matching "${search}"`}{activeCodePrefix && ` with prefix ${activeCodePrefix}`}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((ex) => (<ExerciseCard key={ex.id} exercise={ex} isSelected={playlistIds.has(ex.id)} onToggle={toggleExercise} />))}
        </div>
        {filtered.length === 0 && <div className="text-center py-12"><Search className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-400 font-semibold">No exercises found.</p></div>}
      </div>

      {playlist.length > 0 && <button onClick={() => setShowMobilePlaylist(!showMobilePlaylist)} className="lg:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-navy to-crimson text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-none"><ListChecks className="w-6 h-6" /><span className="absolute -top-1 -right-1 bg-crimson text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{playlist.length}</span></button>}

      <div className={`w-80 flex-shrink-0 ${showMobilePlaylist ? 'fixed inset-0 z-40 bg-cream p-4 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:p-0' : 'hidden lg:block'}`}>
        {showMobilePlaylist && <button onClick={() => setShowMobilePlaylist(false)} className="lg:hidden mb-3 text-navy font-bold text-sm cursor-pointer bg-transparent border-none">\u2190 Back</button>}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-navy m-0">Playlist</h3>
            {playlist.length > 0 && <button onClick={clearPlaylist} className="text-xs text-gray-400 hover:text-red-500 font-bold cursor-pointer bg-transparent border-none flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>}
          </div>
          {playlist.length === 0 ? (
            <div className="text-center py-8"><ListChecks className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 font-semibold text-sm">Click exercises to add them.</p></div>
          ) : (<>
            <input type="text" value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="Routine name" className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-semibold mb-2" />
            <input type="text" value={thumbnailImageUrl} onChange={(e) => setThumbnailImageUrl(e.target.value)} placeholder="Thumbnail overlay image URL (optional)" className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-semibold mb-2 text-gray-500" />
            <div className="flex gap-2 mb-3">
              <input type="text" value={thumbnailBadge} onChange={(e) => setThumbnailBadge(e.target.value)} placeholder="Badge: e.g. 5 MIN" className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-semibold text-gray-500" />
              <input type="text" value={thumbnailTitle} onChange={(e) => setThumbnailTitle(e.target.value)} placeholder="Title: e.g. WARM-UP" className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-xs font-semibold text-gray-500" />
            </div>
            <div className="flex items-center gap-4 mb-3 text-sm">
              <span className="flex items-center gap-1 font-semibold text-gray-500"><ListChecks className="w-4 h-4 text-teal" />{playlist.length}</span>
              <span className="flex items-center gap-1 font-semibold text-gray-500"><Clock className="w-4 h-4 text-teal" />~{getTotalTime()} min</span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4 pr-1">
              {playlist.map((ex, i) => (<PlaylistItem key={ex.id} exercise={ex} index={i} onRemove={removeFromPlaylist} onMoveUp={() => moveItem(i, -1)} onMoveDown={() => moveItem(i, 1)} isFirst={i === 0} isLast={i === playlist.length - 1} />))}
            </div>
            <div className="space-y-2">
              <button onClick={handleGenerateVideo} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-navy to-crimson hover:shadow-lg transition-all cursor-pointer border-none min-h-[44px]"><Video className="w-5 h-5" /> Generate Video</button>
              <button onClick={exportJSON} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 border-teal text-teal hover:bg-teal/5 transition-all cursor-pointer bg-white min-h-[44px]"><Download className="w-4 h-4" /> Export JSON</button>
              <button onClick={handleSave} disabled={saving || !routineName.trim()} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer border-2 min-h-[44px] ${!routineName.trim() ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-navy text-navy hover:bg-navy/5 bg-white'}`}><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save to Library'}</button>
              <button onClick={exportTemplate} disabled={playlist.length === 0} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer border-2 min-h-[44px] ${playlist.length === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-crimson text-crimson hover:bg-crimson/5 bg-white'}`}><FileText className="w-4 h-4" /> Export Template</button>
              <button onClick={handleCopyMVCode} disabled={playlist.length === 0} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer border-2 min-h-[44px] ${playlist.length === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-purple-700 text-purple-700 hover:bg-purple-50 bg-white'}`}><Code className="w-4 h-4" /> {mvCopySuccess ? 'Copied!' : 'Copy MV Code'}</button>
            </div>
          </>)}
        </div>
      </div>

      {showStoryboard && <VideoStoryboard playlist={playlist} routineName={routineName || 'Custom Routine'} totalDuration={`~${getTotalTime()} minutes`} equipment={templateData?.equipment} subtitle={templateData?.subtitle} level={templateData?.level} onApprove={handleStoryboardApprove} onClose={() => setShowStoryboard(false)} />}

      {videoJobId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {(videoJobStatus === 'pending' || videoJobStatus === 'processing') ? (
              <div className="p-6">
                <div className="bg-gradient-to-r from-navy to-crimson text-white p-4 rounded-t-xl -m-6 mb-6"><h2 className="text-xl font-bold m-0 font-petrona">Building Your Routine Video</h2></div>
                <h3 className="text-lg font-bold text-crimson m-0 mb-2 font-petrona">{routineName || 'Custom Routine'}</h3>
                <p className="text-sm text-gray-600 font-semibold mb-4">{playlist.length} exercises • ~{getTotalTime()} min</p>
                <div className="mb-4"><div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-crimson transition-all duration-500 rounded-full" style={{ width: `${videoProgress}%` }}></div></div><p className="text-center text-sm font-bold text-navy mt-2">{videoProgress}%</p></div>
                <div className="text-center"><div className="flex items-center justify-center gap-2 text-gray-500 mb-2"><Loader2 className="w-5 h-5 animate-spin text-crimson" /><p className="text-sm font-semibold">{videoCurrentStep || 'Processing...'}</p></div><p className="text-xs text-gray-400 font-semibold">This may take a few minutes...</p></div>
              </div>
            ) : videoJobStatus === 'completed' ? (
              <div className="p-6">
                <div className="text-center mb-6"><CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" /><h2 className="text-2xl font-bold text-navy m-0 mb-2 font-petrona">Video Ready!</h2><h3 className="text-lg font-bold text-crimson m-0 mb-2 font-petrona">{routineName}</h3><p className="text-sm text-gray-600 font-semibold">{videoDuration && `${Math.floor(videoDuration / 60)}:${String(videoDuration % 60).padStart(2, '0')}`}{videoFileSize && ` • ${videoFileSize.toFixed(1)} MB`}</p></div>
                {showVideoPlayer && videoOutputUrl && <div className="mb-4"><video src={videoOutputUrl} controls className="w-full rounded-lg" style={{ maxHeight: '300px' }} /></div>}
                <div className="space-y-2">
                  <button onClick={() => setShowVideoPlayer(!showVideoPlayer)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-navy border-2 border-navy hover:bg-navy/5 cursor-pointer bg-white min-h-[44px]"><Play className="w-5 h-5" /> {showVideoPlayer ? 'Hide' : 'Preview'}</button>
                  {videoOutputUrl && <button onClick={handleDownloadVideo} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-navy to-crimson hover:shadow-lg cursor-pointer border-none min-h-[44px] disabled:opacity-60">{isDownloading ? <><Loader2 className="w-5 h-5 animate-spin" /> Downloading...</> : <><Download className="w-5 h-5" /> Download MP4</>}</button>}
                  <button onClick={handleCopyMVCode} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 border-purple-700 text-purple-700 hover:bg-purple-50 cursor-pointer bg-white min-h-[44px]"><Code className="w-5 h-5" /> {mvCopySuccess ? 'Copied to Clipboard!' : 'Copy MV Code (Video + Tracker)'}</button>
                  <button onClick={handleBuildAnother} className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:text-navy cursor-pointer bg-transparent border-none min-h-[44px]">Build Another</button>
                </div>
              </div>
            ) : videoJobStatus === 'failed' ? (
              <div className="p-6">
                <div className="text-center mb-6"><XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" /><h2 className="text-2xl font-bold text-navy m-0 mb-2 font-petrona">Generation Failed</h2><p className="text-sm text-red-600 font-semibold">{videoError || 'An error occurred.'}</p></div>
                <div className="space-y-2"><button onClick={handleGenerateVideo} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-navy to-crimson hover:shadow-lg cursor-pointer border-none min-h-[44px]"><Video className="w-5 h-5" /> Try Again</button><button onClick={closeVideoModal} className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:text-navy cursor-pointer bg-transparent border-none min-h-[44px]">Close</button></div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showTemplateModal && <TemplateModal templateText={templateText} onTemplateTextChange={setTemplateText} onLoad={() => loadTemplate(templateText)} onClose={() => { setShowTemplateModal(false); setTemplateText(''); }} />}

      {showResolutionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-navy mb-2 font-petrona">Select Video Quality</h2>
            <p className="text-sm text-gray-600 mb-6 font-semibold">Choose resolution for your video</p>
            <div className="space-y-3 mb-6">
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedResolution === '720p' ? 'border-crimson bg-crimson/5' : 'border-gray-200'}`}><input type="radio" name="res" value="720p" checked={selectedResolution === '720p'} onChange={() => setSelectedResolution('720p')} className="w-5 h-5 cursor-pointer" /><div><div className="font-bold text-navy">720p HD</div><div className="text-sm text-gray-600">Faster, smaller file</div></div></label>
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedResolution === '1080p' ? 'border-crimson bg-crimson/5' : 'border-gray-200'}`}><input type="radio" name="res" value="1080p" checked={selectedResolution === '1080p'} onChange={() => setSelectedResolution('1080p')} className="w-5 h-5 cursor-pointer" /><div><div className="font-bold text-navy">1080p Full HD</div><div className="text-sm text-gray-600">Higher quality, larger file</div></div></label>
            </div>
            <div className="flex gap-3"><button onClick={() => setShowResolutionModal(false)} className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer bg-white">Cancel</button><button onClick={startVideoGeneration} className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-navy to-crimson hover:shadow-lg cursor-pointer border-none">Generate</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
