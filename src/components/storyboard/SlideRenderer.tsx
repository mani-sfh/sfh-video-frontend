import type { Exercise } from '../../lib/supabase';

function ProgressDots({ current, total }: { current: number; total: number }) {
  const dots = [];
  for (let i = 1; i <= total; i++) {
    if (i < current) dots.push('check');
    else if (i === current) dots.push('current');
    else dots.push('upcoming');
  }
  return (
    <div className="flex items-center gap-2 mb-4">
      {dots.map((type, i) => (
        <span
          key={i}
          className={`text-sm font-bold ${
            type === 'check' ? 'text-crimson' : type === 'current' ? 'text-white' : 'text-white/30'
          }`}
        >
          {type === 'check' ? '\u2713' : type === 'current' ? '\u25CF' : '\u25CB'}
        </span>
      ))}
      <span className="text-sm font-bold text-white/70 ml-2">
        Exercise {current} of {total}
      </span>
    </div>
  );
}

function SlideFrame({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      className={`aspect-video rounded-lg overflow-hidden flex flex-col items-center justify-center p-8 relative ${bg}`}
    >
      {children}
    </div>
  );
}

function SFHLogo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const textSize = size === 'lg' ? 'text-base' : 'text-sm';
  return (
    <p className={`${textSize} tracking-[4px] text-white/80 font-bold uppercase`}>
      SENIOR FITNESS <span className="text-pink-200">HUB</span>
    </p>
  );
}

function Tagline() {
  return (
    <p className="text-sm text-white/50 font-bold mt-4">
      Practice with purpose. Move with confidence. Live with independence.
    </p>
  );
}

export function TitleCardSlide({ routineName, exerciseCount, totalDuration, subtitle, level }: {
  routineName: string;
  exerciseCount: number;
  totalDuration: string;
  subtitle?: string;
  level?: string;
}) {
  return (
    <SlideFrame bg="bg-gradient-to-br from-navy to-crimson">
      <SFHLogo size="lg" />
      <div className="w-48 h-0.5 bg-white/30 my-5"></div>
      {level && (
        <span className="bg-white/15 border border-white/30 text-white text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wider mb-3">
          {level}
        </span>
      )}
      <h2 className="font-petrona text-white text-3xl font-bold text-center leading-tight mb-4">
        {routineName}
      </h2>
      {subtitle && (
        <p className="text-white/85 text-base font-bold font-quicksand mb-3 max-w-[80%] text-center">
          {subtitle}
        </p>
      )}
      <p className="text-white/90 text-base font-bold font-quicksand">
        {exerciseCount} Exercises &bull; {totalDuration}
      </p>
      <div className="w-48 h-0.5 bg-white/30 my-5"></div>
      <Tagline />
    </SlideFrame>
  );
}

export function TrackerReminderSlide() {
  return (
    <SlideFrame bg="bg-cream">
      <p className="text-5xl mb-4">📋</p>
      <h2 className="font-petrona text-navy text-2xl font-bold text-center mb-1">
        Haven't Downloaded Your
      </h2>
      <h2 className="font-petrona text-navy text-2xl font-bold text-center">
        Progress Tracker Yet?
      </h2>
      <div className="w-16 h-1 bg-crimson rounded mx-auto my-4"></div>
      <p className="text-crimson text-lg font-bold text-center mb-3 font-quicksand">
        ⏸ Pause the video now and download your tracker.
      </p>
      <p className="text-navy/70 text-sm font-bold text-center max-w-[80%] font-quicksand">
        Track each exercise as you complete it.
      </p>
    </SlideFrame>
  );
}

export function EquipmentSlide({ equipment }: { equipment?: string[] }) {
  const items = equipment || ['Exercise mat or firm surface', 'Sturdy chair without wheels', 'Wall space for support', 'Comfortable, non-slip footwear'];
  return (
    <SlideFrame bg="bg-navy">
      <h2 className="font-petrona text-white text-2xl font-bold mb-6">Equipment Needed</h2>
      <div className="border-l-4 border-crimson pl-5">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="text-white text-base font-bold font-quicksand flex items-center gap-3">
              <span className="text-crimson text-lg">•</span> {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute bottom-4">
        <SFHLogo />
      </div>
    </SlideFrame>
  );
}

export function LetsStartSlide() {
  return (
    <SlideFrame bg="bg-gradient-to-br from-navy to-crimson">
      <h2 className="font-petrona text-white text-4xl font-bold">
        Let's Get Started!
      </h2>
      <p className="text-white/80 text-base font-bold mt-3 font-quicksand">
        Follow along at your own pace.
      </p>
      <p className="text-white/60 text-5xl mt-6">▶</p>
    </SlideFrame>
  );
}

export function WatchLearnSlide({ exercise, exerciseNumber, totalExercises }: {
  exercise: Exercise;
  exerciseNumber: number;
  totalExercises: number;
}) {
  return (
    <SlideFrame bg="bg-white">
      <div className="absolute top-0 left-0 right-0 bg-navy py-2 px-4">
        <ProgressDots current={exerciseNumber} total={totalExercises} />
      </div>
      <div className="mt-6 flex flex-col items-center">
        <span className="bg-crimson text-white text-sm font-bold px-4 py-1.5 rounded-full mb-3 font-quicksand">
          Exercise {exerciseNumber} of {totalExercises}
        </span>
        <h2 className="font-petrona text-navy text-lg font-bold mb-2">Watch and Learn</h2>
        <h3 className="font-petrona text-navy text-xl font-bold mb-3 text-center">{exercise.name}</h3>
        <span className="bg-teal text-white text-sm font-bold px-4 py-1.5 rounded-full mb-3 font-quicksand">
          {exercise.time_display || `${exercise.duration_minutes} min`}
        </span>
        {exercise.coaching_cue && (
          <div className="border-l-4 border-crimson bg-crimson/5 px-3 py-2 rounded-r mt-3 max-w-[85%]">
            <p className="text-sm text-crimson font-bold text-center font-quicksand">
              Your cue: "{exercise.coaching_cue}"
            </p>
          </div>
        )}
        {exercise.focus && (
          <p className="text-sm text-gray-600 font-bold text-center max-w-[80%] mt-2 font-quicksand">
            {exercise.focus}
          </p>
        )}
      </div>
    </SlideFrame>
  );
}

export function VideoPlaySlide({ exercise }: { exercise: Exercise }) {
  const videoUrl = exercise.download_url || exercise.vimeo_id;
  return (
    <SlideFrame bg="bg-gray-900">
      <div className="absolute inset-0 flex items-center justify-center">
        {exercise.main_image_url && (
          <img src={exercise.main_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
            <div className="w-0 h-0 border-l-[18px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
          </div>
          <p className="text-white text-sm font-bold font-quicksand">{exercise.name}</p>
          <p className="text-white/60 text-sm font-bold mt-2 font-quicksand">
            {videoUrl ? 'Instruction Video' : 'NO VIDEO URL'}
          </p>
        </div>
      </div>
    </SlideFrame>
  );
}

export function YourTurnSlide({ exercise, exerciseNumber, totalExercises }: {
  exercise: Exercise;
  exerciseNumber: number;
  totalExercises: number;
}) {
  const isBilateral = exercise.bilateral === 'yes';
  const startSide = (exercise.start_side || 'right').toUpperCase();
  return (
    <SlideFrame bg="bg-gradient-to-br from-teal to-navy">
      <ProgressDots current={exerciseNumber} total={totalExercises} />
      <h2 className="font-petrona text-white text-2xl font-bold mb-3">Now It's Your Turn!</h2>
      <h3 className="font-petrona text-white text-lg font-bold mb-3 text-center">{exercise.name}</h3>
      <span className="bg-white/10 text-white text-sm font-bold px-4 py-1.5 rounded-lg mb-3 font-quicksand">
        {exercise.time_display || `${exercise.duration_minutes} min`}
      </span>
      {isBilateral && (
        <span className="bg-crimson text-white text-sm font-bold px-3 py-1 rounded-full mb-3 font-quicksand">
          Let's do it on the {startSide} side
        </span>
      )}
      {exercise.coaching_cue && (
        <p className="text-white/80 text-sm font-bold text-center max-w-[80%] mt-2 font-quicksand">
          "{exercise.coaching_cue}"
        </p>
      )}
    </SlideFrame>
  );
}

export function PracticeCountdownSlide({ exercise, side, exerciseNumber, totalExercises }: {
  exercise: Exercise;
  side?: 'RIGHT' | 'LEFT';
  exerciseNumber: number;
  totalExercises: number;
}) {
  const imageUrl = side === 'RIGHT'
    ? exercise.right_image_url
    : side === 'LEFT'
      ? exercise.left_image_url
      : exercise.main_image_url;

  const isBilateral = exercise.bilateral === 'yes';
  const duration = isBilateral
    ? (exercise.duration_minutes || 1) * 30
    : (exercise.duration_minutes || 1) * 60;

  return (
    <SlideFrame bg="bg-navy">
      <div className="absolute inset-0">
        {imageUrl && (
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain" />
        )}
        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-white/40 font-bold font-quicksand">NO IMAGE</span>
          </div>
        )}
      </div>
      <div className="absolute top-3 left-0 right-0 px-4">
        <ProgressDots current={exerciseNumber} total={totalExercises} />
      </div>
      {side && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-crimson text-white text-sm font-bold px-4 py-1.5 rounded-full font-quicksand">
          {side} SIDE
        </div>
      )}
      <div className="absolute top-3 right-4 bg-navy/80 text-white text-base font-bold px-3 py-1 rounded-lg font-quicksand">
        {duration}s
      </div>
      {exercise.coaching_cue && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-navy/90 text-white text-sm font-bold px-4 py-2 rounded-lg max-w-[85%] text-center font-quicksand">
          "{exercise.coaching_cue}"
        </div>
      )}
      <div className="absolute bottom-4 left-4">
        <p className="text-white/60 text-sm font-bold font-quicksand">{exercise.name}</p>
      </div>
    </SlideFrame>
  );
}

export function SwitchSidesSlide({ exerciseName, exerciseNumber, totalExercises, secondSide }: {
  exerciseName?: string;
  exerciseNumber: number;
  totalExercises: number;
  secondSide?: string;
}) {
  const sideLabel = (secondSide || 'LEFT').toUpperCase();
  return (
    <SlideFrame bg="bg-gradient-to-br from-crimson to-navy">
      <ProgressDots current={exerciseNumber} total={totalExercises} />
      <p className="text-5xl text-white mb-4">↔</p>
      <h2 className="font-petrona text-white text-3xl font-bold mb-3">
        Switch Sides
      </h2>
      <span className="bg-white/15 text-white text-base font-bold px-5 py-1.5 rounded-full font-quicksand">
        Now: {sideLabel} SIDE
      </span>
      {exerciseName && (
        <p className="text-white/50 text-sm font-bold mt-3 font-quicksand">{exerciseName}</p>
      )}
    </SlideFrame>
  );
}

export function ExerciseCompleteSlide({ exerciseName, nextExerciseName, exerciseNumber, totalExercises }: {
  exerciseName?: string;
  nextExerciseName?: string | null;
  exerciseNumber: number;
  totalExercises: number;
}) {
  return (
    <SlideFrame bg="bg-cream">
      <div className="absolute top-0 left-0 right-0 bg-navy py-2 px-4">
        <ProgressDots current={exerciseNumber} total={totalExercises} />
      </div>
      <p className="text-4xl text-crimson mb-3">✓</p>
      <h2 className="font-petrona text-crimson text-2xl font-bold mb-2">Exercise {exerciseNumber} Complete!</h2>
      {exerciseName && (
        <p className="text-navy text-base font-bold font-quicksand mb-2">{exerciseName}</p>
      )}
      <div className="w-16 h-1 bg-crimson rounded mx-auto my-3"></div>
      {nextExerciseName ? (
        <div className="text-center">
          <p className="text-navy/60 text-sm font-bold font-quicksand">Next Up:</p>
          <p className="text-navy text-base font-intelligentbold font-quicksand mt-1">{nextExerciseName}</p>
        </div>
      ) : (
        <p className="text-crimson text-lg font-bold font-quicksand">🎉 Routine Complete!</p>
      )}
    </SlideFrame>
  );
}

export function OutroSlide({ routineName, exerciseCount, totalDuration, level }: {
  routineName?: string;
  exerciseCount: number;
  totalDuration?: string;
  level?: string;
}) {
  return (
    <SlideFrame bg="bg-gradient-to-br from-navy to-crimson">
      <p className="text-5xl mb-4">✓</p>
      <h2 className="font-petrona text-white text-3xl font-bold mb-3">Routine Complete!</h2>
      {level && (
        <span className="bg-white/15 border border-white/30 text-white text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wider mb-3">
          {level}
        </span>
      )}
      {routineName && (
        <p className="text-white/90 text-base font-bold font-quicksand mb-1">{routineName}</p>
      )}
      <p className="text-white text-base font-bold font-quicksand mb-1">
        {exerciseCount} exercises{totalDuration ? ` · ${totalDuration}` : ''}
      </p>
      <p className="text-white/80 text-sm font-bold font-quicksand mb-4">
        Great work today. Consistency builds confidence.
      </p>
      <div className="w-48 h-0.5 bg-white/30 my-4"></div>
      <SFHLogo />
      <Tagline />
    </SlideFrame>
  );
}
