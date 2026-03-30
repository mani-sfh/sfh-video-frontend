import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Exercise } from '../../lib/supabase';
import {
  ThumbnailSlide, TitleCardSlide, TrackerReminderSlide, EquipmentSlide, LetsStartSlide,
  WatchLearnSlide, VideoPlaySlide, YourTurnSlide, PracticeCountdownSlide,
  SwitchSidesSlide, ExerciseCompleteSlide, OutroSlide
} from './SlideRenderer';

interface VideoStoryboardProps {
  playlist: Exercise[];
  routineName: string;
  totalDuration: string;
  equipment?: string[];
  subtitle?: string;
  level?: string;
  condition?: string;
  thumbnailImageUrl?: string;
  thumbnailBadge?: string;
  thumbnailTitle?: string;
  onApprove: () => void;
  onClose: () => void;
}

interface SlideItem {
  label: string;
  duration: string;
  render: () => JSX.Element;
}

export default function VideoStoryboard({ playlist, routineName, totalDuration, equipment, subtitle, level, condition, thumbnailImageUrl, thumbnailBadge, thumbnailTitle, onApprove, onClose }: VideoStoryboardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: SlideItem[] = [];

  // Thumbnail (first frame)
  slides.push({
    label: 'Thumbnail',
    duration: '2s',
    render: () => <ThumbnailSlide routineName={routineName} totalDuration={totalDuration} overlayImageUrl={thumbnailImageUrl} badgeText={thumbnailBadge} titleText={thumbnailTitle} />
  });

  // Intro slides (durations match server videoGenerator.js)
  slides.push({
    label: 'Title Card',
    duration: '6s',
    render: () => <TitleCardSlide routineName={routineName} exerciseCount={playlist.length} totalDuration={totalDuration} subtitle={subtitle} level={level} condition={condition} />
  });
  slides.push({
    label: 'Tracker Reminder',
    duration: '7s',
    render: () => <TrackerReminderSlide />
  });
  slides.push({
    label: 'Equipment',
    duration: '6s',
    render: () => <EquipmentSlide equipment={equipment} />
  });
  slides.push({
    label: "Let's Start",
    duration: '6s',
    render: () => <LetsStartSlide />
  });

  // Exercise slides
  for (let i = 0; i < playlist.length; i++) {
    const ex = playlist[i];
    const num = i + 1;
    const total = playlist.length;
    const isBilateral = ex.bilateral === 'yes';
    const startSide = (ex.start_side || 'right').toUpperCase();
    const secondSide = startSide === 'RIGHT' ? 'LEFT' : 'RIGHT';
    const nextEx = i < playlist.length - 1 ? playlist[i + 1] : null;

    slides.push({
      label: `Ex ${num}: Watch`,
      duration: '6s',
      render: () => <WatchLearnSlide exercise={ex} exerciseNumber={num} totalExercises={total} />
    });
    slides.push({
      label: `Ex ${num}: Video`,
      duration: 'video',
      render: () => <VideoPlaySlide exercise={ex} />
    });
    slides.push({
      label: `Ex ${num}: Your Turn`,
      duration: isBilateral ? '6s' : '5s',
      render: () => <YourTurnSlide exercise={ex} exerciseNumber={num} totalExercises={total} />
    });

    if (isBilateral) {
      slides.push({
        label: `Ex ${num}: ${startSide}`,
        duration: `${(ex.duration_minutes || 1) * 30}s`,
        render: () => <PracticeCountdownSlide exercise={ex} side={startSide as 'RIGHT' | 'LEFT'} exerciseNumber={num} totalExercises={total} />
      });
      slides.push({
        label: `Ex ${num}: Switch`,
        duration: '6s',
        render: () => <SwitchSidesSlide exerciseName={ex.name} exerciseNumber={num} totalExercises={total} secondSide={secondSide} />
      });
      slides.push({
        label: `Ex ${num}: ${secondSide}`,
        duration: `${(ex.duration_minutes || 1) * 30}s`,
        render: () => <PracticeCountdownSlide exercise={ex} side={secondSide as 'RIGHT' | 'LEFT'} exerciseNumber={num} totalExercises={total} />
      });
    } else {
      slides.push({
        label: `Ex ${num}: Practice`,
        duration: `${(ex.duration_minutes || 1) * 60}s`,
        render: () => <PracticeCountdownSlide exercise={ex} exerciseNumber={num} totalExercises={total} />
      });
    }

    const isLast = !nextEx;
    slides.push({
      label: `Ex ${num}: Complete`,
      duration: isLast ? '5s' : '4s',
      render: () => <ExerciseCompleteSlide exerciseName={ex.name} nextExerciseName={nextEx?.name} exerciseNumber={num} totalExercises={total} nextExercisePosition={nextEx?.position_type} />
    });
  }

  // Outro
  slides.push({
    label: 'Outro',
    duration: '9s',
    render: () => <OutroSlide routineName={routineName} exerciseCount={playlist.length} totalDuration={totalDuration} level={level} condition={condition} />
  });

  function goTo(index: number) {
    if (index >= 0 && index < slides.length) setCurrentSlide(index);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Header */}
      <div className="bg-navy px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-petrona text-white text-lg font-bold m-0">Storyboard Preview</h2>
          <p className="text-white/60 text-sm font-bold m-0">{routineName} — {slides.length} slides</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onApprove}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-teal to-teal/80 hover:shadow-lg cursor-pointer border-none min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            Approve &amp; Generate
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            {slides[currentSlide].render()}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => goTo(currentSlide - 1)}
              disabled={currentSlide === 0}
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-none ${
                currentSlide === 0 ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-white/70 text-sm font-bold">
              {currentSlide + 1} / {slides.length} — {slides[currentSlide].label} ({slides[currentSlide].duration})
            </p>
            <button
              onClick={() => goTo(currentSlide + 1)}
              disabled={currentSlide === slides.length - 1}
              className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-none ${
                currentSlide === slides.length - 1 ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide list */}
        <div className="w-64 bg-navy/50 border-l border-white/10 overflow-y-auto p-3">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 px-2">All Slides</p>
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm font-bold cursor-pointer border-none transition-all ${
                i === currentSlide
                  ? 'bg-crimson/30 text-white'
                  : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-white/40 mr-2">{i + 1}.</span>
              {slide.label}
              <span className="text-white/30 ml-1 text-xs">({slide.duration})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
