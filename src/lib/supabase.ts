import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const railwayUrl = import.meta.env.VITE_RAILWAY_URL || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Exercise {
  id: string;
  code: string;
  name: string;
  vimeo_id: string;
  download_url: string;
  vimeo_download_url_720?: string;
  vimeo_download_url_1080?: string;
  local_video_url?: string;
  bilateral: string;
  duration_minutes: number;
  time_display: string;
  coaching_cue: string;
  full_instruction: string;
  category: string;
  position_type: string;
  main_image_url: string;
  left_image_url: string;
  right_image_url: string;
  tags?: string[];
  friendly_name?: string;
  focus?: string;
  start_side?: string;
  created_at?: string;
}

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('code, name');
  if (error) throw error;
  return data || [];
}

export async function saveRoutine(routine: {
  name: string;
  exercise_ids: string[];
  total_exercises: number;
  estimated_minutes: number;
}) {
  const { data, error } = await supabase
    .from('saved_routines')
    .insert(routine)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSavedRoutines() {
  const { data, error } = await supabase
    .from('saved_routines')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteSavedRoutine(id: string) {
  const { error } = await supabase
    .from('saved_routines')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getExercisesByIds(ids: string[]): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  const map = new Map((data || []).map((ex: Exercise) => [ex.id, ex]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Exercise[];
}

export async function createVideoJob(jobData: {
  status: string;
  routine_label: string;
  exercise_ids: string[];
  resolution: string;
}) {
  const { data, error } = await supabase
    .from('video_jobs')
    .insert(jobData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getVideoJob(jobId: string) {
  const { data, error } = await supabase
    .from('video_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  if (error) throw error;
  return data;
}

export async function generateRoutineVideo(params: {
  jobId: string;
  routineName: string;
  exerciseIds: string[];
  resolution: string;
  totalDuration: string;
  equipment?: string[];
  subtitle?: string;
  level?: string;
  condition?: string;
  thumbnailImageUrl?: string;
  thumbnailBadge?: string;
  thumbnailTitle?: string;
  exerciseOverrides?: Record<string, { focus?: string; start_side?: string; position_type?: string }>;
}) {
  if (!railwayUrl) {
    throw new Error('Railway URL not configured. Set VITE_RAILWAY_URL in environment variables.');
  }

  // Fetch full exercise data for the IDs
  const exercises = await getExercisesByIds(params.exerciseIds);

  // Apply overrides
  const exercisesWithOverrides = exercises.map((ex) => {
    const override = params.exerciseOverrides?.[ex.id];
    return {
      ...ex,
      focus: override?.focus || ex.focus || '',
      start_side: override?.start_side || ex.start_side || 'right',
      position_type: override?.position_type || ex.position_type || '',
    };
  });

  const response = await fetch(`${railwayUrl}/api/video/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: params.jobId,
      routineName: params.routineName,
      exercises: exercisesWithOverrides,
      resolution: params.resolution,
      totalDuration: params.totalDuration,
      equipment: params.equipment,
      subtitle: params.subtitle,
      level: params.level,
      condition: params.condition,
      thumbnailImageUrl: params.thumbnailImageUrl,
      thumbnailBadge: params.thumbnailBadge,
      thumbnailTitle: params.thumbnailTitle,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Railway error: ${response.status} — ${text}`);
  }

  return response.json();
}

// ── MV Codes Storage ──

export interface MVCode {
  id: string;
  routine_name: string;
  exercise_count: number;
  duration_minutes: number;
  mv_code: string;
  template_text?: string;
  thumbnail_image_url?: string;
  thumbnail_badge?: string;
  thumbnail_title?: string;
  video_url?: string;
  generated_thumbnail_url?: string;
  created_at: string;
}

export async function saveMVCode(data: {
  routine_name: string;
  exercise_count: number;
  duration_minutes: number;
  mv_code: string;
  template_text?: string;
  thumbnail_image_url?: string;
  thumbnail_badge?: string;
  thumbnail_title?: string;
  video_url?: string;
  generated_thumbnail_url?: string;
}) {
  const { data: result, error } = await supabase
    .from('mv_codes')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getMVCodes(): Promise<MVCode[]> {
  const { data, error } = await supabase
    .from('mv_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteMVCode(id: string) {
  const { error } = await supabase
    .from('mv_codes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Thumbnail Image Library ──

export interface ThumbnailImage {
  id: string;
  label: string;
  image_url: string;
  created_at: string;
}

export async function saveThumbnailImage(data: { label: string; image_url: string }) {
  const { data: result, error } = await supabase
    .from('thumbnail_images')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getThumbnailImages(): Promise<ThumbnailImage[]> {
  const { data, error } = await supabase
    .from('thumbnail_images')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteThumbnailImage(id: string) {
  const { error } = await supabase
    .from('thumbnail_images')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Saved Templates ──

export interface SavedTemplate {
  id: string;
  label: string;
  template_text: string;
  exercise_count?: number;
  created_at: string;
}

export async function saveTemplate(data: { label: string; template_text: string; exercise_count?: number }) {
  const { data: result, error } = await supabase
    .from('saved_templates')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getSavedTemplates(): Promise<SavedTemplate[]> {
  const { data, error } = await supabase
    .from('saved_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteSavedTemplate(id: string) {
  const { error } = await supabase
    .from('saved_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
