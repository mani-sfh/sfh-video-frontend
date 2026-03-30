import type { Exercise } from '../../lib/supabase';
import * as T from './screenTemplatesClient';

function SlideIframe({ html }: { html: string }) {
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-lg" style={{ position: 'relative' }}>
      <iframe
        srcDoc={html}
        style={{ width: 1280, height: 720, transform: 'scale(var(--scale))', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }}
        className="slide-iframe"
        title="Slide preview"
        sandbox="allow-same-origin"
      />
      <style>{`.slide-iframe { --scale: calc(100% / 1280 * var(--container-w, 1)); } @supports(aspect-ratio:16/9) { .aspect-video { container-type: inline-size; } .slide-iframe { --scale: calc(100cqi / 1280); } }`}</style>
    </div>
  );
}

// Wrapper that measures container and scales the iframe
function ScaledSlide({ html }: { html: string }) {
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-lg relative">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <iframe
          srcDoc={html}
          style={{ width: 1280, height: 720, border: 'none', pointerEvents: 'none', transformOrigin: 'top left' }}
          ref={(el) => {
            if (el) {
              const parent = el.parentElement;
              if (parent) {
                const scale = parent.clientWidth / 1280;
                el.style.transform = `scale(${scale})`;
              }
              const ro = new ResizeObserver(() => {
                if (parent) {
                  const scale = parent.clientWidth / 1280;
                  el.style.transform = `scale(${scale})`;
                }
              });
              if (parent) ro.observe(parent);
            }
          }}
          title="Slide preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

export function ThumbnailSlide({ routineName, totalDuration, overlayImageUrl, badgeText, titleText }: {
  routineName: string; totalDuration: string; overlayImageUrl?: string; badgeText?: string; titleText?: string;
}) {
  return <ScaledSlide html={T.thumbnail(routineName, totalDuration, overlayImageUrl, badgeText, titleText)} />;
}

export function TitleCardSlide({ routineName, exerciseCount, totalDuration, subtitle, level, condition }: {
  routineName: string; exerciseCount: number; totalDuration: string; subtitle?: string; level?: string; condition?: string;
}) {
  return <ScaledSlide html={T.titleCard(routineName, exerciseCount, totalDuration, subtitle, level, condition)} />;
}

export function TrackerReminderSlide() {
  return <ScaledSlide html={T.trackerReminder()} />;
}

export function EquipmentSlide({ equipment }: { equipment?: string[] }) {
  return <ScaledSlide html={T.equipment(equipment)} />;
}

export function LetsStartSlide() {
  return <ScaledSlide html={T.letsGo()} />;
}

export function WatchLearnSlide({ exercise, exerciseNumber, totalExercises }: { exercise: Exercise; exerciseNumber: number; totalExercises: number }) {
  return <ScaledSlide html={T.watchLearn(
    exerciseNumber, totalExercises, exercise.name,
    exercise.time_display || `${exercise.duration_minutes} min`,
    exercise.coaching_cue, exercise.tags, exercise.focus, exercise.position_type,
    exercise.main_image_url
  )} />;
}

export function VideoPlaySlide({ exercise }: { exercise: Exercise }) {
  return <ScaledSlide html={T.videoPlay(exercise.name, exercise.main_image_url)} />;
}

export function YourTurnSlide({ exercise, exerciseNumber, totalExercises }: { exercise: Exercise; exerciseNumber: number; totalExercises: number }) {
  const isBilateral = exercise.bilateral === 'yes';
  const startSide = (exercise.start_side || 'right').toUpperCase();
  return <ScaledSlide html={T.yourTurn(
    exerciseNumber, totalExercises, exercise.name,
    exercise.time_display || `${exercise.duration_minutes} min`,
    exercise.coaching_cue, isBilateral, startSide, exercise.tags, exercise.focus, exercise.position_type
  )} />;
}

export function PracticeCountdownSlide({ exercise, side, exerciseNumber, totalExercises }: { exercise: Exercise; side?: 'RIGHT' | 'LEFT'; exerciseNumber: number; totalExercises: number }) {
  const imageUrl = side === 'RIGHT' ? exercise.right_image_url : side === 'LEFT' ? exercise.left_image_url : exercise.main_image_url;
  return <ScaledSlide html={T.practiceFrame(
    exerciseNumber, totalExercises, exercise.name, imageUrl,
    exercise.coaching_cue, exercise.time_display || `${exercise.duration_minutes} min`, side
  )} />;
}

export function SwitchSidesSlide({ exerciseName, exerciseNumber, totalExercises, secondSide }: { exerciseName?: string; exerciseNumber: number; totalExercises: number; secondSide?: string }) {
  return <ScaledSlide html={T.switchSides(exerciseNumber, totalExercises, exerciseName || '', secondSide || 'LEFT')} />;
}

export function ExerciseCompleteSlide({ exerciseName, nextExerciseName, exerciseNumber, totalExercises, nextExercisePosition }: { exerciseName?: string; nextExerciseName?: string | null; exerciseNumber: number; totalExercises: number; nextExercisePosition?: string }) {
  return <ScaledSlide html={T.exerciseComplete(exerciseNumber, totalExercises, exerciseName || '', nextExerciseName || undefined, nextExercisePosition)} />;
}

export function OutroSlide({ routineName, exerciseCount, totalDuration, level, condition }: { routineName?: string; exerciseCount: number; totalDuration?: string; level?: string; condition?: string }) {
  return <ScaledSlide html={T.outro(routineName || 'Routine', exerciseCount, totalDuration || '', level, condition)} />;
}
