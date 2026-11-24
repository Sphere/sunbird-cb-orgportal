# FRAC Studio demo video

Records a client demo of FRAC Studio from the running app and turns it into a captioned MP4 of about 3 minutes:

1. **Part 1, Create a FRAC** (`record.mjs`): brief → job research → competencies, with an instruction typed for the
   AI → roles and activities → level ladders → expert check → Fix all findings → Excel download → History.
2. **Part 2, Review a FRAC** (`record-review.mjs`): upload an existing FRAC workbook (by default the one Part 1
   downloaded), add context, read the graded report, then My FRACs.
3. **Edit** (`edit.mjs`): cuts both recordings into captioned segments, squeezes each AI run to 10 seconds with an
   "AI agent working · N× speed" badge, adds title cards, and writes `out/FRAC-Studio-demo.mp4`.

This folder is a separate tool with its own `package.json`. It is not part of the portal build, lint, tests or Sonar.

## Before you record

- The portal runs locally (`npm run start:mdo-dev`, port 3000) with a valid session cookie in
  `proxy/localhost.proxy.json`, and the logged-in user has the `FRAC_AI_ADMIN` role.
- The FRAC Studio service runs with a real AI provider, reachable through the portal's dev proxy.
- Google Chrome is installed (the scripts drive it through Playwright), and `ffmpeg` with `drawtext` is on the PATH
  (`brew install ffmpeg`).
- **Cost:** Part 1 makes real AI calls, about $2–4 and 10–15 minutes. Part 2 is one expert review.
- Each run creates a new FRAC and a review under the logged-in user; delete them from My FRACs afterwards if you like.

## Run

```bash
cd tools/frac-studio-demo
npm install
npm run demo          # record Part 1, then Part 2, then build the video
```

Or one at a time: `npm run record`, `npm run record:review`, `npm run edit`. `npm run edit` can be re-run on its own
to change captions, speeds or length without recording again.

Output in `out/` (ignored by git): `FRAC-Studio-demo.mp4`, the raw recordings, `marks.json` / `review-marks.json`
(caption timeline), screenshots of each step in `shots/` and `review-shots/`, and the downloaded FRAC workbook.

## Settings

| Variable | Default | Used by |
|---|---|---|
| `PORTAL_URL` | `http://localhost:3000` | both recordings |
| `DEMO_CADRE`, `DEMO_STATE` | `ASHA`, `Karnataka` | brief, review context, intro card |
| `DEMO_SCOPE` | an ASHA scope sentence | brief, "What should this FRAC cover?" |
| `DEMO_INSTRUCTION` | "Include a digital literacy competency…" | the instruction typed on the Competencies tab |
| `DEMO_REVIEW_NOTES` | a district-team note | review context |
| `REVIEW_FILE` | the workbook Part 1 downloaded | the FRAC Part 2 reviews |
| `DEMO_FONT`, `DEMO_FONT_BOLD` | macOS Arial | caption fonts |

Length, the seconds each AI run gets, and the card length are constants at the top of `edit.mjs` (`TARGET`,
`WAIT_LEN`, `CARD`). Captions are the `mark(...)` labels in the two recording scripts.

## If a recording stops

Each script logs its steps and saves `out/shots/zz-failure.png` (or `out/review-shots/zz-failure.png`) when a step
fails. The usual causes are an expired proxy cookie (the portal shows the login page) or the service not running.
