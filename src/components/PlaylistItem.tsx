import { X, Clock } from 'lucide-react';
import type { Exercise } from '../lib/supabase';

export default function PlaylistItem({ exercise, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  exercise: Exercise;
  index: number;
  onRemove: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2.5 group hover:border-navy/30 transition-all">
      <div className="flex flex-col items-center gap-0.5">
        <button onClick={onMoveUp} disabled={isFirst}
          className={`text-xs px-1 py-0.5 rounded cursor-pointer border-none bg-transparent ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-navy hover:bg-navy/5'}`}>▲</button>
        <span className="text-xs font-bold text-gray-400 w-5 text-center">{index + 1}</span>
        <button onClick={onMoveDown} disabled={isLast}
          className={`text-xs px-1 py-0.5 rounded cursor-pointer border-none bg-transparent ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-navy hover:bg-navy/5'}`}>▼</button>
      </div>
      {exercise.main_image_url ? (
        <img src={exercise.main_image_url} alt="" className="w-12 h-8 object-cover rounded flex-shrink-0" />
      ) : (
        <div className="w-12 h-8 bg-navy/5 rounded flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-navy truncate">{exercise.name}</p>
          {exercise.focus && (
            <span className="w-2 h-2 rounded-full bg-crimson flex-shrink-0" title="Template override applied" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
          <Clock className="w-3 h-3" />
          {exercise.time_display || '~1 min'}
        </div>
      </div>
      <button onClick={() => onRemove(exercise.id)}
        className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
