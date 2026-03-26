import { useState, useEffect } from 'react';
import { getSavedRoutines, deleteSavedRoutine, getExercisesByIds } from '../lib/supabase';
import type { Exercise } from '../lib/supabase';
import { Download, Trash2, Clock, ListChecks, BookmarkCheck } from 'lucide-react';

export default function SavedRoutines() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try { setRoutines(await getSavedRoutines()); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleExport(routine: any) {
    setExporting(routine.id);
    try {
      const exercises = await getExercisesByIds(routine.exercise_ids);
      const data = {
        program_name: 'Senior Fitness Hub',
        label: routine.name,
        equipment: ['Exercise mat or firm surface', 'Sturdy chair without wheels', 'Comfortable, non-slip footwear'],
        exercises: exercises.map((ex: Exercise) => ({
          code: ex.code, name: ex.name, vimeo_id: ex.vimeo_id, download_url: ex.download_url,
          time_display: ex.time_display || `~${ex.duration_minutes || 1} min`,
          coaching_cue: ex.coaching_cue, duration_min: ex.duration_minutes || 1,
          bilateral: ex.bilateral === 'yes', category: ex.category,
          main_image_url: ex.main_image_url, left_image_url: ex.left_image_url, right_image_url: ex.right_image_url,
        })),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = routine.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExporting(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved routine?')) return;
    try {
      await deleteSavedRoutine(id);
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (err) { console.error(err); }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-navy border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 font-semibold">Loading saved routines...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-navy mb-2">Saved Routines</h2>
      <p className="text-gray-500 font-semibold mb-6">Re-export any saved routine as JSON.</p>
      {routines.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookmarkCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold">No saved routines yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-navy truncate">{routine.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="flex items-center gap-1 font-semibold text-gray-500"><ListChecks className="w-4 h-4 text-teal" />{routine.total_exercises} exercises</span>
                  <span className="flex items-center gap-1 font-semibold text-gray-500"><Clock className="w-4 h-4 text-teal" />~{routine.estimated_minutes} min</span>
                </div>
                <p className="text-xs text-gray-400 font-semibold mt-1">Saved {new Date(routine.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleExport(routine)} disabled={exporting === routine.id}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-navy to-crimson hover:shadow-md transition-all cursor-pointer border-none">
                  <Download className="w-4 h-4" />{exporting === routine.id ? '...' : 'Export'}
                </button>
                <button onClick={() => handleDelete(routine.id)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
