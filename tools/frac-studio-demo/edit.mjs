// Builds the FRAC Studio demo video from the two recordings (record.mjs, record-review.mjs): cuts them into captioned
// segments ("show" parts near real speed, AI "wait" parts squeezed to WAIT_LEN seconds with a speed badge), adds title
// cards, then joins and compresses them to out/FRAC-Studio-demo.mp4 of at most TARGET seconds. Needs ffmpeg with
// drawtext (Homebrew's has it). See README.md.
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';

const TARGET = 230;          // seconds, under 4 minutes with the cards
const WAIT_LEN = 10;         // each AI wait becomes this many seconds
const CARD = 4;              // intro and outro card length
// macOS system fonts; set DEMO_FONT / DEMO_FONT_BOLD to a .ttf elsewhere
const FONT = process.env.DEMO_FONT ?? '/System/Library/Fonts/Supplemental/Arial.ttf';
const BOLD = process.env.DEMO_FONT_BOLD ?? '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
const PLACE = `${process.env.DEMO_CADRE ?? 'ASHA'}, ${process.env.DEMO_STATE ?? 'Karnataka'}`;
const W = 1440, H = 900, FPS = 30;
process.chdir(fileURLToPath(new URL('./out/', import.meta.url)));

// The parts in order: the Creator recording, then the Reviewer and My FRACs recording
const PARTS = [
  { dir: 'video', marks: 'marks.json', card: ['Part 1: Create a FRAC', 'The AI agent builds it step by step; the team steers and edits'] },
  { dir: 'review-video', marks: 'review-marks.json', card: ['Part 2: Review a FRAC', 'Upload an existing FRAC and get a graded expert review'] },
];
const probe = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
rmSync('seg', { recursive: true, force: true });
mkdirSync('seg');

// Segments between consecutive marks of each part; each part's last mark ("end") closes its list
const segs = [];
for (const part of PARTS) {
  const raw = `${part.dir}/${readdirSync(part.dir).find((f) => f.endsWith('.webm'))}`;
  const marks = JSON.parse(readFileSync(part.marks, 'utf8'));
  const duration = probe(raw);
  segs.push({ card: part.card });
  for (let i = 0; i < marks.length - 1; i++) {
    const start = marks[i].t, end = Math.min(marks[i + 1].t, duration);
    if (end - start > 0.5) segs.push({ ...marks[i], raw, start, end, len: end - start });
  }
}
const clips = segs.filter((s) => !s.card);
const waits = clips.filter((s) => s.kind === 'wait');
const shows = clips.filter((s) => s.kind !== 'wait');
const cards = segs.length - clips.length + 2;
const showTotal = shows.reduce((n, s) => n + s.len, 0);
const room = TARGET - cards * CARD - waits.length * WAIT_LEN;
const showSpeed = Math.max(1, showTotal / room);
console.log(`${shows.length} show (${showTotal.toFixed(0)}s), ${waits.length} waits, ${cards} cards; show speed ${showSpeed.toFixed(2)}x`);

const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '27', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-an'];
const ff = (args) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
const list = [];

function card(name, title, sub) {
  writeFileSync(`seg/${name}-t.txt`, title);
  writeFileSync(`seg/${name}-s.txt`, sub);
  ff(['-f', 'lavfi', '-i', `color=c=0x1c5d95:s=${W}x${H}:d=${CARD}:r=${FPS}`, '-vf',
    `drawtext=fontfile='${BOLD}':textfile=seg/${name}-t.txt:fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h/2)-70,` +
    `drawtext=fontfile='${FONT}':textfile=seg/${name}-s.txt:fontcolor=white@0.9:fontsize=30:x=(w-text_w)/2:y=(h/2)+20,` +
    'fade=t=in:st=0:d=0.5,fade=t=out:st=3.5:d=0.5', ...enc, `seg/${name}.mp4`]);
  list.push(`seg/${name}.mp4`);
}

card('00-intro', 'FRAC Studio', `Create and review FRAC dictionaries with an AI agent  |  ${PLACE}`);
segs.forEach((s, i) => {
  const name = `s${String(i + 1).padStart(2, '0')}`;
  if (s.card) {
    card(name, s.card[0], s.card[1]);
    return;
  }
  const isWait = s.kind === 'wait';
  const out = isWait ? Math.min(WAIT_LEN, s.len) : s.len / showSpeed;
  const speed = s.len / out;
  writeFileSync(`seg/${name}.txt`, s.label);
  const badge = isWait ? `AI agent working  |  ${Math.round(speed)}x speed` : '';
  writeFileSync(`seg/${name}-b.txt`, badge);
  const vf = [
    `setpts=(PTS-STARTPTS)/${speed.toFixed(4)}`, `fps=${FPS}`,
    `drawbox=x=0:y=ih-92:w=iw:h=92:color=black@0.62:t=fill`,
    `drawtext=fontfile='${FONT}':textfile=seg/${name}.txt:fontcolor=white:fontsize=30:x=40:y=h-62`,
    ...(isWait ? [`drawbox=x=iw-470:y=24:w=440:h=52:color=0x1c5d95@0.92:t=fill`,
      `drawtext=fontfile='${BOLD}':textfile=seg/${name}-b.txt:fontcolor=white:fontsize=24:x=w-450:y=40`] : []),
  ].join(',');
  ff(['-ss', s.start.toFixed(3), '-t', s.len.toFixed(3), '-i', s.raw, '-vf', vf, '-t', out.toFixed(3), ...enc, `seg/${name}.mp4`]);
  list.push(`seg/${name}.mp4`);
});
card('99-outro', 'FRAC Studio', 'Create: brief > research > competencies > roles > ladders > expert check > Excel   |   Review: upload > graded report');

writeFileSync('seg/list.txt', list.map((f) => `file '${f.replace('seg/', '')}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', 'seg/list.txt', '-c', 'copy', '-movflags', '+faststart', 'FRAC-Studio-demo.mp4']);
const final = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'FRAC-Studio-demo.mp4']).toString());
const size = Number(execFileSync('stat', ['-f', '%z', 'FRAC-Studio-demo.mp4']).toString()) / 1e6;
console.log(`FRAC-Studio-demo.mp4: ${final.toFixed(0)}s, ${size.toFixed(1)} MB`);
