import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Exercise } from '../lib/supabase';
import VideoStoryboard from '../components/storyboard/VideoStoryboard';
import { Loader2 } from 'lucide-react';

export default function StoryboardPreview() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadSample() {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .in('code', ['A1', 'A2', 'A3'])
        .order('code');
      if (error) console.error(error);
      else setExercises(data || []);
      setLoading(false);
    }
    loadSample();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-semibold">No exercises found for A1, A2, A3</p>
      </div>
    );
  }

  return (
    <VideoStoryboard
      playlist={exercises}
      routineName="Breathing Foundations Program"
      totalDuration={`~${exercises.reduce((s, e) => s + (e.duration_minutes || 1), 0)} minutes`}
      onApprove={() => { alert('Approved!'); navigate('/'); }}
      onClose={() => navigate('/')}
    />
  );
}
