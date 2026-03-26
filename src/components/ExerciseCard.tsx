import { Plus, Check, Clock } from 'lucide-react';
import type { Exercise } from '../lib/supabase';

export default function ExerciseCard({ exercise, isSelected, onToggle }: {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: (exercise: Exercise) => void;
}) {
  return (
    <button
      onClick={() => onToggle(exercise)}
      className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
        isSelected
          ? 'border-crimson bg-crimson/5 shadow-md'
          : 'border-gray-200 bg-white hover:border-navy/30 hover:shadow-sm'
      }`}
    >
      {exercise.main_image_url ? (
        <div className="w-full h-28 bg-gray-100 overflow-hidden">
          <img src={exercise.main_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="w-full h-28 bg-gradient-to-br from-navy/10 to-crimson/10 flex items-center justify-center">
          <span className="text-3xl text-navy/20">🎬</span>
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-navy text-sm leading-tight truncate">{exercise.name}</p>
            {exercise.code && (
              <p className="text-xs text-crimson font-semibold mt-0.5">{exercise.code}</p>
            )}
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isSelected ? 'bg-crimson text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-semibold">
          <Clock className="w-3 h-3" />
          <span>{exercise.time_display || `~${exercise.duration_minutes || 1} min`}</span>
          {exercise.bilateral === 'yes' && (
            <span className="bg-teal/10 text-teal px-1.5 py-0.5 rounded text-[10px] font-bold">BILATERAL</span>
          )}
        </div>
        {exercise.coaching_cue && (
          <p className="text-xs text-gray-400 font-semibold mt-1.5 truncate">"{exercise.coaching_cue}"</p>
        )}
      </div>
    </button>
  );
}
