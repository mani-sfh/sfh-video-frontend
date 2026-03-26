import type { Exercise } from './supabase';

export interface TemplateMetadata {
  subtitle: string;
  level: string;
  estimatedTime: string;
  condition: string;
  equipment: string[];
}

interface ParsedExercise {
  code: string;
  name?: string;
  vimeo_id?: string;
  download_url?: string;
  bilateral?: string;
  time_display?: string;
  duration_sec?: number;
  coaching_cue?: string;
  focus?: string;
  main_image_url?: string;
  left_image_url?: string;
  right_image_url?: string;
  start_side?: string;
}

interface ParsedTemplate {
  routineName: string;
  subtitle: string;
  level: string;
  estimatedTime: string;
  condition: string;
  equipmentItems: string[];
  exercises: ParsedExercise[];
}

export function parseTemplate(text: string): ParsedTemplate {
  const lines = text.split('\n').map((l) => l.trim());

  let routineName = '';
  let subtitle = '';
  let level = '';
  let estimatedTime = '';
  let condition = '';
  const equipmentItems: string[] = [];

  for (const line of lines) {
    if (line.startsWith('ROUTINE NAME:')) routineName = line.replace('ROUTINE NAME:', '').trim();
    if (line.startsWith('SUBTITLE:')) subtitle = line.replace('SUBTITLE:', '').trim();
    if (line.startsWith('LEVEL:')) level = line.replace('LEVEL:', '').trim();
    if (line.startsWith('ESTIMATED TIME:')) estimatedTime = line.replace('ESTIMATED TIME:', '').trim();
    if (line.startsWith('CONDITION:')) condition = line.replace('CONDITION:', '').trim();
  }

  let inEquipment = false;
  for (const line of lines) {
    if (line === 'EQUIPMENT:') {
      inEquipment = true;
      continue;
    }
    if (line.startsWith('=====')) {
      if (inEquipment) inEquipment = false;
      continue;
    }
    if (inEquipment && line.startsWith('- ')) {
      equipmentItems.push(line.replace('- ', '').trim());
    }
  }

  const exercises: ParsedExercise[] = [];
  let current: ParsedExercise | null = null;

  for (const line of lines) {
    const exMatch = line.match(/^\d+\.\s*CODE:\s*(.+)/);
    if (exMatch) {
      if (current) exercises.push(current);
      current = { code: exMatch[1].trim() };
      continue;
    }
    if (current) {
      if (line.startsWith('NAME:')) current.name = line.replace('NAME:', '').trim();
      if (line.startsWith('VIMEO ID:')) current.vimeo_id = line.replace('VIMEO ID:', '').trim();
      if (line.startsWith('DOWNLOAD URL:')) current.download_url = line.replace('DOWNLOAD URL:', '').trim();
      if (line.startsWith('BILATERAL:')) current.bilateral = line.replace('BILATERAL:', '').trim();
      if (line.startsWith('TIMING:')) current.time_display = line.replace('TIMING:', '').trim();
      if (line.startsWith('DURATION SEC:')) current.duration_sec = parseInt(line.replace('DURATION SEC:', '').trim()) || 60;
      if (line.startsWith('COACHING CUE:')) current.coaching_cue = line.replace('COACHING CUE:', '').trim();
      if (line.startsWith('FOCUS:')) current.focus = line.replace('FOCUS:', '').trim();
      if (line.startsWith('MAIN IMAGE URL:')) current.main_image_url = line.replace('MAIN IMAGE URL:', '').trim();
      if (line.startsWith('LEFT IMAGE URL:')) current.left_image_url = line.replace('LEFT IMAGE URL:', '').trim();
      if (line.startsWith('RIGHT IMAGE URL:')) current.right_image_url = line.replace('RIGHT IMAGE URL:', '').trim();
      if (line.startsWith('START SIDE:')) current.start_side = line.replace('START SIDE:', '').trim();
    }
  }
  if (current) exercises.push(current);

  return { routineName, subtitle, level, estimatedTime, condition, equipmentItems, exercises };
}

export function mergeTemplateWithDb(
  parsed: ParsedTemplate,
  dbExercises: Exercise[]
): { playlist: Exercise[]; notFound: string[] } {
  const dbMap = new Map(dbExercises.map((ex) => [ex.code, ex]));
  const playlist: Exercise[] = [];
  const notFound: string[] = [];

  for (const templateEx of parsed.exercises) {
    const dbEx = dbMap.get(templateEx.code);
    if (!dbEx) {
      notFound.push(templateEx.code);
      continue;
    }

    playlist.push({
      ...dbEx,
      name: templateEx.name || dbEx.name,
      coaching_cue: templateEx.coaching_cue || dbEx.coaching_cue,
      time_display: templateEx.time_display || dbEx.time_display,
      duration_minutes: templateEx.duration_sec ? templateEx.duration_sec / 60 : dbEx.duration_minutes,
      focus: templateEx.focus || '',
      start_side: templateEx.start_side || 'right',
      main_image_url: templateEx.main_image_url || dbEx.main_image_url,
      left_image_url: templateEx.left_image_url || dbEx.left_image_url,
      right_image_url: templateEx.right_image_url || dbEx.right_image_url,
      download_url: templateEx.download_url || dbEx.download_url,
      vimeo_id: templateEx.vimeo_id || dbEx.vimeo_id,
    });
  }

  return { playlist, notFound };
}

export function generateTemplateText(
  playlist: Exercise[],
  routineName: string,
  totalTime: number,
  templateData: TemplateMetadata | null
): string {
  let template = `================================================================================
                    ROUTINE VIDEO TEMPLATE
================================================================================
ROUTINE NAME: ${routineName || ''}
SUBTITLE: ${templateData?.subtitle || ''}
LEVEL: ${templateData?.level || ''}
ESTIMATED TIME: ~${totalTime} minutes
CONDITION: ${templateData?.condition || ''}
================================================================================
                         EQUIPMENT
================================================================================
EQUIPMENT:\n`;

  const equip = templateData?.equipment?.length
    ? templateData.equipment
    : ['Exercise mat or firm surface', 'Sturdy chair without wheels', 'Comfortable, non-slip footwear'];
  equip.forEach((item) => {
    template += `- ${item}\n`;
  });

  template += `================================================================================
                         EXERCISES
================================================================================\n\n`;

  playlist.forEach((ex, i) => {
    template += `${i + 1}. CODE: ${ex.code || ''}
   NAME: ${ex.name || ''}
   VIMEO ID: ${ex.vimeo_id || ''}
   DOWNLOAD URL: ${ex.download_url || ''}
   BILATERAL: ${ex.bilateral || 'no'}
   TIMING: ${ex.time_display || ''}
   DURATION SEC: ${Math.round((ex.duration_minutes || 1) * 60)}
   COACHING CUE: ${ex.coaching_cue || ''}
   FOCUS: ${ex.focus || ''}
   MAIN IMAGE URL: ${ex.main_image_url || ''}
   LEFT IMAGE URL: ${ex.left_image_url || ''}
   RIGHT IMAGE URL: ${ex.right_image_url || ''}
   START SIDE: ${ex.start_side || ''}\n\n`;
  });

  template += `================================================================================
                       END OF TEMPLATE
================================================================================`;

  return template;
}
