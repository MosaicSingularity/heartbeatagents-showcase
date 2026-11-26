/* ══════════════════════════════════════════════════════════════
   data.js — sources, region copy, chapter scripts, sample data
   Sample data is synthetic and illustrative. Sources are real;
   each is tagged with its evidence tier and study model.
   ══════════════════════════════════════════════════════════════ */
window.GB = (function () {
  'use strict';

  /* ── sources ─────────────────────────────────────────────── */
  const CITATIONS = [
    {
      id: 'kaelberer2018', tier: 1, model: 'mouse',
      ref: 'Kaelberer MM, Buchanan KL, Klein ME, et al. A gut–brain neural circuit for nutrient sensory transduction. <em>Science</em>. 2018;361(6408):eaat5236.',
      url: 'https://www.science.org/doi/10.1126/science.aat5236',
      note: 'Synapse-forming enteroendocrine (neuropod) cells release glutamate onto vagal afferents within milliseconds — a fast, hard-wired route distinct from hormonal signalling.'
    },
    {
      id: 'yano2015', tier: 1, model: 'mouse + human samples',
      ref: 'Yano JM, Yu K, Donaldson GP, et al. Indigenous bacteria from the gut microbiota regulate host serotonin biosynthesis. <em>Cell</em>. 2015;161(2):264–276.',
      url: 'https://www.cell.com/cell/fulltext/S0092-8674(15)00248-2',
      note: 'Spore-forming commensals promote TPH1-dependent serotonin synthesis in colonic enterochromaffin cells, with measurable effects on motility and platelet serotonin.'
    },
    {
      id: 'liu2025', tier: 1, model: 'mouse · 2025',
      ref: 'Liu et al. (2025), analysed in: A neurobiotic sense curbs feeding. <em>Nature Reviews Gastroenterology &amp; Hepatology</em>. 2025.',
      url: 'https://www.nature.com/articles/s41575-025-01126-z',
      note: 'Colonic neuropod cells relay a microbial molecular pattern to the brain through a neuroepithelial circuit — 2025 work extending the fast vagal route to microbial sensing. The linked piece is commentary on the primary study, not the study itself.'
    },
    {
      id: 'nrm2024', tier: 1, model: 'review',
      ref: 'Microbiota–neuroepithelial signalling across the gut–brain axis. <em>Nature Reviews Microbiology</em>. 2024.',
      url: 'https://www.nature.com/articles/s41579-024-01136-9',
      note: 'Review of the epithelial and neuronal interfaces through which microbiota-derived molecules reach sensory neurons, including enterochromaffin and neuropod cells.'
    },
    {
      id: 'dantzer2008', tier: 1, model: 'review · human + animal',
      ref: 'Dantzer R, O’Connor JC, Freund GG, Johnson RW, Kelley KW. From inflammation to sickness and depression: when the immune system subjugates the brain. <em>Nature Reviews Neuroscience</em>. 2008;9:46–56.',
      url: 'https://www.nature.com/articles/nrn2297',
      note: 'The canonical account of how peripheral cytokines act on the brain to produce sickness behaviour, and how prolonged immune signalling is associated with depressive symptoms in vulnerable individuals.'
    },
    {
      id: 'erny2015', tier: 1, model: 'mouse',
      ref: 'Erny D, Hrabě de Angelis AL, Jaitin D, et al. Host microbiota constantly control maturation and function of microglia in the CNS. <em>Nature Neuroscience</em>. 2015;18:965–977.',
      url: 'https://www.nature.com/articles/nn.4030',
      note: 'Germ-free and antibiotic-treated mice show immature, functionally impaired microglia — the clearest demonstration that gut bacteria continuously shape the brain’s resident immune cells.'
    },
    {
      id: 'acetate2021', tier: 1, model: 'mouse',
      ref: 'Microbiota-derived acetate enables the metabolic fitness of the brain’s innate immune cells. <em>Cell Metabolism</em>. 2021.',
      url: 'https://www.sciencedirect.com/science/article/pii/S1550413121004885',
      note: 'A circulating SCFA reaches the brain and supports microglial metabolism — direct evidence that fermentation products cross into the CNS and act there.'
    },
    {
      id: 'scfa2012', tier: 2, model: 'in vitro · review',
      ref: 'Significance of short chain fatty acid transport by members of the monocarboxylate transporter family. <em>Neurochemical Research</em>. 2012.',
      url: 'https://link.springer.com/article/10.1007/s11064-012-0857-3',
      note: 'SCFA uptake into brain cells is substantially transporter-mediated, with monocarboxylate transporters (MCT1/MCT2) the main candidates. Tier 2: mechanistic review, largely in vitro.'
    },
    {
      id: 'mct1bbb2024', tier: 2, model: 'rat',
      ref: 'Fasting upregulates the monocarboxylate transporter MCT1 at the rat blood–brain barrier. 2024.',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11003008/',
      note: 'MCT1 expression at the barrier is regulated by metabolic state — the gate is adjustable, not fixed. Tier 2: animal, single-transporter focus.'
    },
    {
      id: 'scfa2025', tier: 2, model: 'rhesus macaque + mouse',
      ref: 'Short-chain fatty acids mediate gut microbiota–brain communication and support blood–brain barrier integrity. <em>Annals of the New York Academy of Sciences</em>. 2025.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/39998158/',
      note: 'SCFA supplementation improved barrier integrity in antibiotic-disrupted macaques and mice. Tier 2 by journal, but a primate dataset — useful for the circulatory arm.'
    },
    {
      id: 'cells2023', tier: 2, model: 'review',
      ref: 'Mechanisms of blood–brain barrier protection by microbiota-derived short-chain fatty acids. <em>Cells</em>. 2023;12(4):657.',
      url: 'https://www.mdpi.com/2073-4409/12/4/657',
      note: 'Review of the tight-junction and transporter mechanisms by which SCFAs influence barrier integrity. Tier 2: narrative review.'
    },
    {
      id: 'ijms2025', tier: 2, model: 'review',
      ref: 'Interaction of the vagus nerve and serotonin in the gut–brain axis. <em>International Journal of Molecular Sciences</em>. 2025;26(3):1160.',
      url: 'https://www.mdpi.com/1422-0067/26/3/1160',
      note: 'Review of gut-derived serotonin acting on vagal afferents alongside the fast synaptic route. Tier 2: review, useful for the paracrine branch.'
    }
  ];

  const byId = {};
  CITATIONS.forEach(c => { byId[c.id] = c; });

  /* ── regions ─────────────────────────────────────────────── */
  const REGIONS = {
    gut: {
      kicker: 'Region 01', title: 'Gut', sub: 'Enterochromaffin cells · neuropods · microbiota',
      latency: 'instant (synapse) → minutes (paracrine)',
      body: 'Most of the body’s serotonin is made here, in <strong>enterochromaffin cells</strong>, where <strong>TPH1</strong> is the rate-limiting enzyme. Spore-forming members of the microbiota move that production up and down — the first solid evidence that a microbe can tune a host neurotransmitter.\n\nA subset of enteroendocrine cells, called <strong>neuropods</strong>, skip the bloodstream entirely: they form genuine synapses with vagal afferents and release transmitter within milliseconds. Work published in 2025 extended this to microbial sensing — colonic neuropods relaying a bacterial molecular pattern to the brain through a neuroepithelial circuit.',
      refs: ['yano2015', 'kaelberer2018', 'liu2025'], deep: 'A'
    },
    vagus: {
      kicker: 'Region 02', title: 'Vagus nerve', sub: 'Nodose ganglion → brainstem',
      latency: '~0.1–0.3 s end to end',
      body: 'Roughly four in five vagal fibres carry information <em>upward</em>, from gut to brain — this is a sensory cable more than a motor one. Two signals ride it: fast synaptic glutamate from neuropods, and gut-derived serotonin acting on vagal afferents from the surrounding enterochromaffin cells.\n\nConduction is metres per second, so a signal leaving the colon reaches the brainstem in well under a second. That is the only route fast enough to track a single meal.',
      refs: ['kaelberer2018', 'ijms2025'], deep: 'A'
    },
    brain: {
      kicker: 'Region 03', title: 'Brain', sub: 'Nucleus of the solitary tract · hypothalamus · microglia',
      latency: 'receives all three, on three timescales',
      body: 'Everything above converges here. The <strong>nucleus of the solitary tract</strong> takes the fast vagal line. The hypothalamus and circumventricular organs see circulating metabolites and cytokines, where the barrier is deliberately thin. Microglia hold the slow inflammatory state.\n\nBecause the three arrive on timescales that differ by five orders of magnitude, the brain is never listening to one gut. It is listening to three versions of the same gut: the last meal, the last day, the last week.',
      refs: ['kaelberer2018', 'dantzer2008', 'erny2015'], deep: 'A'
    },
    liver: {
      kicker: 'Region 04', title: 'Liver & portal vein', sub: 'First-pass metabolism',
      latency: '~10–30 min after a meal',
      body: 'SCFAs made by fermentation in the colon are absorbed and reach the liver first, through the <strong>portal vein</strong>. The liver takes a large share — butyrate in particular is substantially metabolised by gut epithelium and liver before it reaches systemic blood, while acetate and propionate circulate more freely.\n\nThis is a filter, not a switch. What survives first pass is what the brain can later see.',
      refs: ['scfa2012', 'cells2023'], deep: 'B'
    },
    blood: {
      kicker: 'Region 05', title: 'Bloodstream & barrier', sub: 'MCT1 (SLC16A1) at the blood–brain barrier',
      latency: '~15–60 min to plasma · minutes across the barrier',
      body: 'Acetate, propionate and butyrate cross into the brain on <strong>monocarboxylate transporters</strong>; MCT1 at the barrier’s endothelial cells is the main gate, and its expression is itself adjustable — fasting upregulates it in rats.\n\nThe barrier is a managed interface rather than a wall, and SCFAs are among the signals it manages: germ-free and antibiotic-treated animals show a leakier barrier that SCFA supplementation partly restores, in mice and in macaques. Transport is fast; the concentration that arrives is what took the hour.',
      refs: ['scfa2012', 'mct1bbb2024', 'scfa2025', 'acetate2021'], deep: 'B'
    },
    immune: {
      kicker: 'Region 06', title: 'Immune & inflammatory', sub: 'Barrier · cytokines · microglia',
      latency: '~18–72 h',
      body: 'Slower and blunter. Stress and a low-fiber pattern are associated with a more permeable gut barrier; microbial products that slip across meet mast cells and immune cells in the lamina propria, which release cytokines such as <strong>IL-6</strong> and <strong>TNF-α</strong>.\n\nThose signals reach the brain neurally, through vagal afferents, and humorally through the barrier — and they shift microglial state. The microbiota is a continuous input to that system: germ-free mice show immature microglia, and acetate supports their metabolic fitness. This is the arm that carries the two-to-three-day delay.',
      refs: ['dantzer2008', 'erny2015', 'acetate2021'], deep: 'C'
    }
  };

  /* ── chapters ────────────────────────────────────────────── */
  const CHAPTERS = {
    A: {
      kicker: 'Deep dive 01', title: 'The Instant Wire',
      sub: 'Gut → brainstem in a fraction of a second. Neuropod synapse, EC-cell serotonin, vagal conduction.',
      clockLabel: 'ms', clockMax: 300,
      refs: ['kaelberer2018', 'yano2015', 'liu2025'],
      tags: ['Tier 1', 'mouse · in vivo', 'synapse + vagus'],
      stages: [
        { t0: 0, t1: 0.16, text: '<em>0–40 ms.</em> A meal arrives. Nutrients and microbial metabolites touch the apical surface of an enterochromaffin cell in the colon.' },
        { t0: 0.16, t1: 0.36, text: '<em>40–110 ms.</em> TPH1 — the rate-limiting enzyme — drives serotonin synthesis. Vesicles fill at the basolateral pole.' },
        { t0: 0.36, t1: 0.55, text: '<em>110–160 ms.</em> This cell is a neuropod: it has a real synapse, not a leak. Vesicles fuse and release transmitter into a ~20 nm cleft.' },
        { t0: 0.55, t1: 0.76, text: '<em>160–220 ms.</em> The vagal afferent terminal depolarises. No bloodstream, no hormone, no diffusion — a wire.' },
        { t0: 0.76, t1: 1, text: '<em>220–300 ms.</em> Action potentials run the vagus to the nodose ganglion and into the nucleus of the solitary tract. The gut has already spoken.' }
      ]
    },
    B: {
      kicker: 'Deep dive 02', title: 'The Slow Tide',
      sub: 'Fermentation → portal vein → liver → circulation → MCT1 at the blood–brain barrier.',
      clockLabel: 'min', clockMax: 60,
      refs: ['scfa2012', 'mct1bbb2024', 'scfa2025', 'cells2023', 'acetate2021'],
      tags: ['Tier 1 + Tier 2', 'mouse · rat · macaque', 'transport'],
      stages: [
        { t0: 0, t1: 0.18, text: '<em>0–10 min.</em> Bacteria ferment fiber in the colon. Acetate, propionate and butyrate accumulate in the lumen.' },
        { t0: 0.18, t1: 0.34, text: '<em>10–20 min.</em> Absorption across the epithelium into the portal vein. The liver gets first look.' },
        { t0: 0.34, t1: 0.5, text: '<em>20–35 min.</em> First pass. Much butyrate is consumed here; acetate and propionate pass into systemic blood.' },
        { t0: 0.5, t1: 0.66, text: '<em>35–50 min.</em> Circulation. The concentration that reaches the brain is decided by what survived.' },
        { t0: 0.66, t1: 0.86, text: '<em>50–58 min.</em> At the barrier, MCT1 on the endothelial cell moves monocarboxylates across — a transporter, not a pore.' },
        { t0: 0.86, t1: 1, text: '<em>58–60 min+.</em> Astrocytes take up acetate; neurons and microglia follow. Minutes of transport, an hour of build-up.' }
      ]
    },
    C: {
      kicker: 'Deep dive 03', title: 'The Long Echo',
      sub: 'Stress → barrier → cytokines → microglia → how a day feels. The two-to-three-day arm.',
      clockLabel: 'h', clockMax: 72,
      refs: ['dantzer2008', 'erny2015', 'acetate2021', 'liu2025'],
      tags: ['Tier 1', 'mouse · human', 'immune'],
      stages: [
        { t0: 0, t1: 0.14, text: '<em>Hour 0.</em> A stressful stretch. Sympathetic tone rises; mucus and tight junctions come under strain.' },
        { t0: 0.14, t1: 0.3, text: '<em>Hours 2–12.</em> Barrier permeability increases. Microbial products begin to cross.' },
        { t0: 0.3, t1: 0.46, text: '<em>Hours 12–24.</em> Mast cells and lamina-propria immune cells respond: IL-6, TNF-α.' },
        { t0: 0.46, t1: 0.62, text: '<em>Hours 24–36.</em> Cytokines travel neurally — vagal afferents — and humorally, to the brain.' },
        { t0: 0.62, t1: 0.8, text: '<em>Hours 36–60.</em> Microglia shift state, ramified toward reactive. This is the delay that feels like “why now?”.' },
        { t0: 0.8, t1: 1, text: '<em>Hours 60–72.</em> Behavioural output: fatigue, low mood, withdrawal. Sickness behaviour is a coordinated response, not a failure of will.' }
      ]
    }
  };

  /* ── synthetic 30-day sample ─────────────────────────────── */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function ema(arr, alpha) {
    const out = []; let prev = arr[0];
    for (let i = 0; i < arr.length; i++) { prev = prev + alpha * (arr[i] - prev); out.push(prev); }
    return out;
  }
  const norm = arr => {
    const lo = Math.min(...arr), hi = Math.max(...arr), d = hi - lo || 1;
    return arr.map(v => (v - lo) / d);
  };

  function buildDays() {
    const rnd = mulberry32(20251126);
    const SEG = [
      { n: 6, fiber: 18, ferm: 0.15, stress: 4.8, sleep: 7.2, label: 'baseline' },
      { n: 8, fiber: 31, ferm: 0.85, stress: 6.4, sleep: 7.0, label: 'fiber & fermented push' },
      { n: 6, fiber: 12, ferm: 0.10, stress: 8.2, sleep: 5.8, label: 'travel · low fiber, high load' },
      { n: 7, fiber: 27, ferm: 0.60, stress: 4.0, sleep: 7.9, label: 'recovery' },
      { n: 3, fiber: 25, ferm: 0.50, stress: 4.4, sleep: 7.7, label: 'settled' }
    ];
    const days = [];
    SEG.forEach(seg => {
      for (let i = 0; i < seg.n; i++) {
        days.push({
          fiber: Math.round(clamp(seg.fiber + (rnd() - 0.5) * 6, 6, 40)),
          ferm: clamp(seg.ferm + (rnd() - 0.5) * 0.34, 0, 1),
          stress: +clamp(seg.stress + (rnd() - 0.5) * 1.7, 1, 10).toFixed(1),
          sleep: +clamp(seg.sleep + (rnd() - 0.5) * 0.9, 4.5, 9.4).toFixed(1),
          label: seg.label
        });
      }
    });

    const fiberN = days.map(d => clamp((d.fiber - 10) / 24, 0, 1));
    const fermN = days.map(d => d.ferm);
    const stressN = days.map(d => clamp((d.stress - 2) / 7, 0, 1));
    const sleepN = days.map(d => clamp((d.sleep - 5) / 3.2, 0, 1));

    /* vagal: same-day. circulatory: one day behind. immune: three days behind. */
    const vagalRaw = days.map((_, i) => 0.58 * fiberN[i] + 0.22 * fermN[i] + 0.20 * sleepN[i]);
    const scfaSeed = days.map((_, i) => 0.80 * fiberN[i] + 0.20 * fermN[i]);
    const scfa = ema(scfaSeed, 0.55);
    const circRaw = days.map((_, i) => (i >= 1 ? scfa[i - 1] : scfa[0]));

    const inflSeed = days.map((_, i) => 0.60 * stressN[i] + 0.40 * (1 - fiberN[i]));
    const infl = ema(inflSeed, 0.45);
    const immuneRaw = days.map((_, i) => (i >= 3 ? infl[i - 3] : infl[0] * 0.92));

    const moodRaw = days.map((_, i) =>
      clamp(0.34 * vagalRaw[i] + 0.30 * (1 - immuneRaw[i]) + 0.30 * sleepN[i] + 0.06 * (rnd() - 0.5), 0, 1));

    const vagal = norm(vagalRaw), circ = norm(circRaw), immune = norm(immuneRaw);
    const mood = norm(moodRaw);

    days.forEach((d, i) => {
      d.i = i;
      d.vagal = vagal[i];
      d.circ = circ[i];
      d.immune = immune[i];
      d.moodN = mood[i];
      d.mood = +(1 + mood[i] * 4).toFixed(1);
      d.date = 'D' + String(i + 1).padStart(2, '0');
    });

    const argmax = a => a.indexOf(Math.max(...a));
    return { days, peaks: { vagal: argmax(vagal), circ: argmax(circ), immune: argmax(immune) } };
  }

  const SAMPLE = buildDays();

  return { CITATIONS, byId, REGIONS, CHAPTERS, SAMPLE };
})();
