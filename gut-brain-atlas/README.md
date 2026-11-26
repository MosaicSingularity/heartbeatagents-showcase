# The Gut–Brain Atlas

An interactive anatomical body map of the gut–brain axis — three signaling pathways animated at their real *relative* speeds, on a body you can tap, over a month of sample data you can scrub.

## What's inside

**Three pathways, three speeds.** The map is not a diagram with moving dots — the timings are the point. Each route runs on its own clock so the difference between them reads instantly:

| Pathway | Mechanism shown | Timescale on the map |
|---|---|---|
| **Vagal** | EC-cell serotonin via TPH1, plus neuropod / neuroendocrine signaling | milliseconds → minutes (the instant wire) |
| **Circulatory** | SCFAs crossing the blood–brain barrier via MCT transporters | minutes → hours (the slow tide) |
| **Immune / inflammatory** | Cytokine signaling, barrier and inflammatory tone | hours → days (the long echo) |

**Tap any region to zoom.** Six tappable hotspots (gut, brain, blood, vagal trunk, and more). Tapping pushes a 2× zoom into that region and opens its local mechanism — latency, cell types, and the specific citations for that tissue.

**Scrub 30 days.** A single timeline scrubber drives diet quality, fiber, perceived stress and mood across a month of sample data. As you scrub, the pathway meters brighten and dim, and the body tints with inflammatory load — so the **1–3 day lag** between a dietary change and the downstream effect becomes visible as a body time-lapse rather than a sentence you have to believe.

**Three deep dives.** Each route launches a full-screen animated chapter on demand:

- **The Instant Wire** (0–40 ms) — a meal arrives; the signal is already traveling
- **The Slow Tide** (0 → 60 min) — metabolites crossing into circulation and the BBB
- **The Long Echo** (0 → 72 h) — the inflammatory tail, hours after the meal is gone

**"Make It Yours."** The closing transition reframes the whole piece from *a* body to *your* body: connect wearables, log gut and mood in ~30 seconds, and over time the model reflects your own signals, your own lags, your own patterns instead of the sample data.

## Run it

No build step, no dependencies, no server.

```bash
open index.html                       # macOS
# or:  python3 -m http.server 8080    → http://localhost:8080
```

## Files

```
index.html      markup: the body map SVG, panels, chapter canvas
styles.css      the whole visual system
data.js         the 30-day sample dataset + per-region mechanism content
app.js          particle engine, chart, zoom/pan, chapter animations
```

## Scientific grounding — and its limits

Every claim in the app is written as **correlation language** ("associated with", "co-occurring", "tracked alongside"), never as causation, and the copy is deliberately elegant rather than clinical. There is no dosage, no protocol, and no treatment advice anywhere in it — this is an explanatory visualization, not a medical device, and it says so.

The twelve references surfaced in the app's **Evidence** panel are the intended sources. **Note honestly: the reference list has not yet been audited line-by-line for tier and for claim-by-claim accuracy.** Before this is used in a published or client-facing context, that pass should happen — confirming each source is Tier 1 peer-reviewed work and that every statement stays inside what the cited study actually supports. Treat the citation set as a draft until then.
