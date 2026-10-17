# Release acceptance — 2026-10-17

Live site: https://openkrillion.com

This release implements the home scene and complete classic seven-round flow. It includes three-second previews, 25-second server answer windows, rejection/correction, six rarity scores, depth animation, synthesized audio, surfacing, results, review, sharing, practice, settings, wardrobe, and a local logbook. No iframe is used.

## Verified

- Existing GitHub and Cloudflare accounts; domain active in the owner's Cloudflare zone.
- Dedicated remote D1, local SQLite D1 emulation, private R2 snapshots, and an allowlisted public R2 OG asset.
- Production reference snapshot for 2026-10-17, dive 94: seven prompts and 4,108 prepared answers. Changes upstream may change this count.
- Ten passing Node/SQLite integration checks, including expired server windows, ownership, duplicate scoring, pause, DST, reference validation, and docs/SEO invariants.
- Independent installation/build/test in the sanitized public checkout.
- Desktop 1440×1000 and mobile 390×844 browser flow. Seven-round production practice game completed with 505 points; 390×480 input dock remains within the viewport. Production pause/resume returns HTTP 200.
- All four public text documents return UTF-8 text for GET and HEAD; full text composes the other three. Five AI links have localized English/Chinese questions, matching canonical document references, and safe native-link attributes.
- Expandable guide: 1,982 English words. Full initial homepage HTML: 2,485 words, exact `krillion` token 112 times, 4.51% density under the build's declared tokenizer. No user-agent-dependent content.
- Canonical/title/description/keywords/H1, VideoGame schema, OG 1200×630, favicon, apple icon, robots and sitemap. `www` redirects to the apex with 301. Unknown paths and private snapshot media paths return 404.
- Plausible at analytics.howtosurvive.ai received a real pageview; GA4 and Clarity displayed a current visitor. Game event payloads exclude typed answers; Clarity input masking is enabled.
- Google domain ownership verified by DNS TXT. Sitemap status **Success**, three discovered pages.
- Bing site ownership verified by meta tag. Sitemap submitted; initial status **Processing**. Submission is not a guarantee of indexing or ranking.

## Deliberate boundaries

This is an independent implementation. Art and audio were recreated; they are not the original site's files. Pixel-perfect equivalence, original population statistics, complete historical question archives, themed packs, accounts, and paid features are not claimed. Runtime public reference data retains its original rights; MIT covers this implementation and its own procedural assets. If reference synchronization is unavailable for a new day, the sample bank is clearly labeled.

The original site-style footer remains available, with the additional AI documentation module in the expandable guide. Long explanatory content is user-accessible while the initial view remains the game.
