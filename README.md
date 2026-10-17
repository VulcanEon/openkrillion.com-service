# OpenKrillion 🦐

An independent, open-source daily rare-answer trivia game. Play at **[openkrillion.com](https://openkrillion.com)**.

Seven prompts, 25 seconds each. Familiar answers float; rare answers descend. This release includes the home scene, all seven rounds, answer correction and rejection, six rarity tiers, animated descent, synthesized audio, surfacing, results, answer review, sharing, practice, settings, dive buddies, and a browser logbook.

**Source:** [openkrillion.com-service](https://github.com/VulcanEon/openkrillion.com-service). Application code and original procedural assets are MIT licensed. This project is independent of, and not affiliated with, [krillion.io](https://krillion.io). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the separate treatment of reference data, fonts, and provider icons.

## Run locally

Use Node.js 24 or newer and npm. No cloud account, API key, AI model, or production database is needed for the sample game.

```sh
git clone https://github.com/VulcanEon/openkrillion.com-service.git
cd openkrillion.com-service
npm ci
npm run build
npm run db:local
npm run dev
```

Open `http://localhost:3051`. Wrangler runs a local Worker, SQLite-backed D1, and local R2 emulation. Their data stays in the ignored `.wrangler/` folder. The zero database identifier in `wrangler.jsonc` is deliberately a placeholder; local development works with it.

The included independent sample bank is small and visibly labeled. Production can synchronize the current reference day's publicly exposed prompts and prepared answer tiers; these snapshots and production player records are **not** distributed with this repository. No player answers are sent to the reference service. If the reference is unavailable for a new day, a labeled sample bank keeps the game playable. This dependency can be disabled with `REFERENCE_SYNC=false`.

## Architecture

```text
Browser: canvas ocean + HTML game + Web Audio
                 |
                 v
Cloudflare Worker: server timing, matching, scoring, ownership
       |                       |
       v                       v
 D1 / local SQLite        private R2
 puzzles, runs, answers    snapshots + public asset namespace
```

The server owns the score and round deadline. The essential `ok_player` cookie is HttpOnly, SameSite=Lax, and Secure over HTTPS. Answers are hidden until the dive is completed. Daily results and practice are separate; population comparisons use this service's completed daily dives, not the original game's player statistics. A small timed-submission network grace period does not allow late manual requests to revive a round.

`src/config.mjs` holds public product facts. The Worker renders `/llms.txt`, `/pricing.md`, `/models.md`, and `/llms-full.txt` from those same facts; `npm run build` also generates matching checked-in documentation snapshots. There are no AI models, paid plans, credits, subscriptions, account login, or multiplayer in this release.

The homepage includes a native, accessible expandable guide with over 1,500 English words. Its content is delivered in the initial HTML to every visitor. English and Chinese help/AI prompts are available through `?lang=en` and `?lang=zh`; game questions and the long reference guide currently remain English. Five local brand icons open public product questions in ChatGPT, Claude, Perplexity, Google AI Mode, and Grok. Opening a provider link does not guarantee its answer or a citation.

## Deploy your own copy

1. Run `npx wrangler login` in your own Cloudflare account.
2. Create resources: `npx wrangler d1 create YOUR_DATABASE` and `npx wrangler r2 bucket create YOUR_BUCKET`.
3. Copy `wrangler.jsonc` to the ignored `wrangler.production.jsonc`. Set a unique Worker name, your database ID/name, bucket name, account ID, and `SITE_URL`. Set `LOCAL_DEVELOPMENT=false`.
4. Add your custom domain, or a zone route such as `example.com/*` when that host already has proxied DNS records. Keep a `www` redirect if used. Set `workers_dev` as desired.
5. Update `src/config.mjs`, canonical URLs in `src/worker.mjs`, and public brand/guide copy for your own domain. The supplied code describes the deployed OpenKrillion site.
6. Optional runtime variables: `GA4_ID`, `CLARITY_ID`, `BING_VERIFY`, `GSC_VERIFY`. The supplied production Plausible public script URL is in `src/config.mjs`; replace it with your own site's script. Analytics only load on the configured production hostname, are disabled for automated browser runs, and never receive raw answers through custom events.
7. Apply migrations and publish:

```sh
npm run db:remote
npm run deploy
```

To enable reference synchronization, set `REFERENCE_SYNC=true`; the first request for a new day can synchronize and cache its validated snapshot. Optional cron entries `5 4 * * *` and `5 5 * * *` cover New York midnight in both DST seasons. The date validator prevents mixing prompts and answer lists from different days.

For an optional authenticated manual refresh, set `ADMIN_TOKEN` using `npx wrangler secret put ADMIN_TOKEN --config wrangler.production.jsonc`, then POST `/api/admin/sync` with its Bearer token. This endpoint is unavailable when the secret is unset. Never commit tokens, `.dev.vars`, production binding configuration, SQLite files, or bucket dumps.

The R2 bucket remains private. Only objects under `assets/` can be served through `/media/assets/...`; puzzle snapshots are not exposed by that route. The build supplies static OG/favicon assets. If using R2 for a share image, upload `public/assets/og.png` to your bucket's `assets/og.png` key with `Content-Type: image/png`.

## Validation

```sh
npm test
npm run build
npm run check
node scripts/browser-audit.mjs http://localhost:3051 output/playwright/audit
npm run test:audio
npm run test:mobile
npm run test:art
```

The art audit samples five depth zones and all six outcome effects on desktop and mobile. Companion SVGs are generated from original pixel geometry in `scripts/pixel-art.mjs`; scenery is drawn and cached by `public/seascape.mjs`, without downloading any reference artwork at build or runtime. The mobile flow audit runs all seven rounds at 390×844 and checks a long question at 390×480 before restoring the viewport. The audio audit renders synthesized cues through OfflineAudioContext, checks envelopes, clipping, mute and countdown timing, and writes WAV samples under ignored `output/audio/`. The visual fidelity pass and remaining differences are recorded in [docs/fidelity-audit.md](docs/fidelity-audit.md).

The unit/integration suite runs against an in-memory SQLite D1 adapter, including seven-round server scoring, duplicate protection, ownership, CSRF checks, deadline expiry, pause/resume, reference validation, DST rollover, and the documentation/SEO contract. Browser validation uses installed Google Chrome (`channel: chrome`) and covers desktop/mobile, correction/rejection, seven rounds, results/review/share, reload, Chinese AI prompts, and a short mobile viewport. Install Chrome or change the browser channel for your environment. Production browser audits use practice mode to avoid contaminating daily population statistics.

Run artifacts are generated under ignored `output/`. `render_game_to_text()` exposes readable UI state; `advanceTime(ms)` is available only in local development for animation checks. Production timers use server deadlines.

## Project scope and fidelity

This is a working reconstruction of the classic seven-question experience, not the original source code. The ocean, boat, pixel buddies, UI, and sounds are independently implemented. Animation curves, sounds, art details, aliases, and changing reference data may differ. Archive/themed packs, original player distributions, and paid features are outside this release. A title or screenshot similarity is not a claim of pixel-perfect equivalence.

Contributions and bug reports are welcome through this repository. Please avoid including credentials or private player data in issues.
