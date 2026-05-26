/* ============================================================
   THE BROADCAST — GSAP scroll orchestration
   ============================================================
   Each scene is its own ScrollTrigger-pinned timeline. As the user
   scrolls into a scene, the broadcast lower-third updates with the
   scene caption and a real-time clock starts counting up.

   A single persistent rink SVG sits behind every scene, panning
   slowly from top → bottom of the rink as the user scrolls the
   full page.

   MOBILE: Pinned ScrollTrigger sections do not perform well on mobile.
   Phase 2 will detect window.innerWidth < 768 and replace each pinned
   scene with a static, scroll-into-view fade variant.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ============================================================
// MOBILE SWITCH
// ============================================================
// Pinned/scrubbed ScrollTriggers stutter on phones and the fixed-pixel
// SVG stages don't survive scaling to a 390px viewport. On mobile we
// skip every pinned timeline and run a lighter path: each scene flows
// as a normal stacked section, fades in on scroll, and still fires the
// broadcast caption/scoreboard. A few cheap non-pinned beats (the
// warmup puck-drop, replay-badge blink) are kept on both.
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ============================================================
// BROADCAST CHROME — lower-third + scoreboard helpers
// ============================================================
const lowerThirdEl   = document.querySelector('[data-lower-third]');
const lowerThirdLabel = lowerThirdEl?.querySelector('.lt-label');
const lowerThirdText  = lowerThirdEl?.querySelector('.lt-text');
const lowerThirdStory = lowerThirdEl?.querySelector('[data-lt-story]');
const scoreboardEl    = document.querySelector('.scoreboard');
const periodEl        = document.querySelector('[data-period]');
const clockEl         = document.querySelector('[data-clock]');
const penaltyEl       = document.querySelector('[data-penalty]');

// ---------- Real-time game clock ----------
// When a scene activates, we record the seed (mm:ss) and the wall-clock
// timestamp the seed was set. The display is recomputed every 1s.
// `countdown: true` makes the clock tick DOWN from the seed (and stop at 0).
let clockState = { seedSeconds: 0, startedAt: 0, period: 'PERIOD 1', countdown: false };
let penaltyState = null;  // { seedSeconds, startedAt } or null
let clockTimer = null;

function formatClock(totalSeconds) {
    const clamped = Math.max(0, totalSeconds);
    const m = Math.floor(clamped / 60);
    const s = Math.floor(clamped % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function tickClock() {
    if (!clockEl) return;
    const elapsed = (Date.now() - clockState.startedAt) / 1000;
    const value = clockState.countdown
        ? clockState.seedSeconds - elapsed
        : clockState.seedSeconds + elapsed;
    clockEl.textContent = formatClock(value);

    if (penaltyEl && penaltyState) {
        const pElapsed = (Date.now() - penaltyState.startedAt) / 1000;
        const pValue = Math.max(0, penaltyState.seedSeconds - pElapsed);
        penaltyEl.textContent = 'PEN ' + formatClock(pValue);
    }
}

function startSceneClock(period, seedSeconds, countdown = false, penalty = null) {
    clockState = { seedSeconds, startedAt: Date.now(), period, countdown };
    penaltyState = penalty ? { seedSeconds: penalty, startedAt: Date.now() } : null;
    if (periodEl) periodEl.textContent = period;
    if (penaltyEl) {
        if (penalty) {
            penaltyEl.style.display = '';
            penaltyEl.textContent = 'PEN ' + formatClock(penalty);
        } else {
            penaltyEl.style.display = 'none';
        }
    }
    tickClock();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tickClock, 1000);
}

function showScoreboard() {
    scoreboardEl?.classList.add('visible');
}

function setLowerThird(label, text, story = '') {
    if (!lowerThirdEl) return;
    lowerThirdEl.classList.add('visible');
    if (lowerThirdLabel) lowerThirdLabel.textContent = label;
    if (lowerThirdText)  lowerThirdText.textContent  = text;
    if (lowerThirdStory) lowerThirdStory.textContent = story;
}

function hideLowerThird() {
    lowerThirdEl?.classList.remove('visible');
}

// CSS opacity transition duration for the broadcast chrome (must match
// the `transition` on .lower-third / .scoreboard in styles.css).
const CHROME_FADE_MS = 400;

// Tracks which scene the chrome currently shows, so re-entering the same
// scene (e.g. tiny scroll jitter) doesn't trigger a needless fade cycle.
let activeSceneKey = null;
let chromeFadeTimer = null;

// Fade the lower-third + scoreboard OUT, swap their content while hidden,
// then fade them back IN. `key` dedupes repeat activations of one scene.
function activateScene({ label, text, story = '', period, seedSeconds, countdown = false, penalty = null }) {
    const key = `${label}|${text}`;
    if (key === activeSceneKey) return;
    activeSceneKey = key;

    const apply = () => {
        setLowerThird(label, text, story);
        showScoreboard();
        startSceneClock(period, seedSeconds, countdown, penalty);
    };

    if (chromeFadeTimer) clearTimeout(chromeFadeTimer);

    // First scene of the session: nothing visible yet, just fade in.
    if (!lowerThirdEl?.classList.contains('visible') &&
        !scoreboardEl?.classList.contains('visible')) {
        apply();
        return;
    }

    // Fade out, then swap content + fade back in after the transition.
    hideLowerThird();
    scoreboardEl?.classList.remove('visible');
    chromeFadeTimer = setTimeout(apply, CHROME_FADE_MS);
}

// Warmup uses the scoreboard ONLY (no lower-third caption box).
function activateWarmup() {
    activeSceneKey = null;   // so re-entering the first scene re-fades
    if (chromeFadeTimer) clearTimeout(chromeFadeTimer);
    hideLowerThird();
    showScoreboard();
    startSceneClock('WARMUP', 1200, true);   // 20:00 counting down
}

// ---------- Per-scene narrative copy ----------
// Shown in the lower-third story line; the box grows upward as text lengthens.
const SCENE_STORY = {
    rookie:
        'Grew up in Edmonton, Alberta during an oil bust — and found a love of '
        + 'flying, both on the ice and through PC flight simulators like Paul '
        + "Bowman's Red Baron and Memphis Belle.",
    focusPuller:
        'When oil prices dipped in 2008, I left a safety-training job to chase the '
        + 'film industry in the studios and rainforests of BC. The magic of film '
        + 'was even more wondrous from the inside. A passion for technology and '
        + 'art led me to the camera department — 3D rigs, underwater housings, '
        + 'helicopter drones — and up to a regular Focus Puller on TV series like '
        + 'The Flash and Impastor.',
    startups:
        'A move to a new city and a growing interest in computers led me to start '
        + 'a few websites. First came eSnail.ca, for travellers who want their '
        + 'mail to follow them online; then LayoverBox, for people who can’t '
        + 'be home to receive parcels. These projects let me step into the role '
        + 'of entrepreneur alongside the Vancouver tech startup scene.',
    currentVentures:
        'eSnail.ca funded and bought time to invest in other startups, including '
        + 'an expansion into the United States. That experience let me take on '
        + 'large, complex contracts as a full-stack developer and settle into '
        + 'steady work across a diverse range of projects.',
    wrioter:
        'Wrioter is a passion project — an online application for planning large '
        + 'novels. It is built to stay flexible and quick to change as a writer '
        + 'reorganizes their story, while keeping a complex narrative in view. '
        + 'Mindmaps and beat cards work in sync with chapters and text snippets, '
        + 'so writers can approach the same text from multiple perspectives.',
    highlights:
        'I am always interested in figuring out how things work. The world is a '
        + 'fascinating place — lately I am curious about flying RC drones with '
        + 'autonomous navigation software, the fluidity of woodworking, and the '
        + 'satisfying whirr of human-made wonders.',
};

// ============================================================
// COPY-EMAIL — bind to both navbar icon and CTA button
// ============================================================
const EMAIL = 'applications@mail.stephandouglasduval.com';

function bindCopyEmail(el) {
    if (!el) return;
    el.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await navigator.clipboard.writeText(EMAIL);
            el.classList.add('copied');
            setTimeout(() => el.classList.remove('copied'), 1500);
        } catch (err) {
            console.warn('Clipboard write failed:', err);
        }
    });
}

bindCopyEmail(document.getElementById('copyEmail'));

// ============================================================
// PERSISTENT RINK — pans vertically across Scenes 2–6.
//
// Why earlier attempts failed: every scene uses `pin: true`, which
// injects pin-spacer elements that grow the page height. An
// `endTrigger`/`end:'bottom bottom'` for the rink is measured against
// element positions that SHIFT as those pins are created — so the rink
// finished its pan around Scene 3 (the only part measured correctly).
//
// Fix: drive the rink off an EXPLICIT pixel scroll length equal to the
// sum of every Scene 2–6 pin distance. A fixed number can't be thrown
// off by pin-spacer ordering or refresh races.
// ============================================================

// Pinned scroll length of each scene (must match the `end:'+='` values
// on the scene timelines below).
const SCENE_PIN_LENGTHS = {
    faceoff:    1500,
    longShift:  3500,
    breakaway:  2000,
    ticTacToe:  4000,
    telestrator: 4000,
};
// Total Scene 2–6 scroll span. Each pinned scene also consumes one
// viewport height before its pin releases, so add 5 × innerHeight.
function rinkSpanPx() {
    const pinTotal = Object.values(SCENE_PIN_LENGTHS).reduce((a, b) => a + b, 0);
    return pinTotal + window.innerHeight * 5;
}

const persistentRinkEl = document.querySelector('.persistent-rink');
const persistentRink   = document.querySelector('.js-persistent-rink');

function setupPersistentRink() {
    if (!persistentRink || !persistentRinkEl) return;
    const rinkHeight = persistentRink.getBoundingClientRect().height;
    const viewportHeight = window.innerHeight;
    // Top of the rink visible at the start of the span, bottom of the
    // rink visible at the end. Translate from 0 to -(rinkHeight - vh).
    const panDistance = Math.max(0, rinkHeight - viewportHeight);
    const span = rinkSpanPx();

    // Vertical pan — explicit pixel span, immune to pin-spacer races.
    gsap.fromTo(persistentRink,
        { y: 0 },
        {
            y: -panDistance,
            ease: 'none',
            scrollTrigger: {
                trigger: '#faceoff',
                start: 'top top',
                end: `+=${span}`,
                scrub: 1.2,
                invalidateOnRefresh: true,   // recompute panDistance on resize/refresh
            },
        }
    );

    // Show the rink only while Scenes 2–6 are on screen.
    ScrollTrigger.create({
        trigger: '#faceoff',
        start: 'top bottom',
        end: `+=${span + viewportHeight}`,
        onToggle: (self) => {
            persistentRinkEl.classList.toggle('rink-visible', self.isActive);
        },
    });
}

if (isMobile) {
    // On mobile the rink is position:absolute and spans the full page —
    // no GSAP pan needed. Just make it visible immediately.
    persistentRinkEl?.classList.add('rink-visible');
} else {
    if (persistentRink?.complete) {
        setupPersistentRink();
    } else if (persistentRink) {
        persistentRink.addEventListener('load', setupPersistentRink);
    }
}

// ============================================================
// PUCK ANCHOR SYSTEM
// ============================================================
// Every puck on the site is an <image class="js-puck" data-puck="SCENE">.
// This single config places each puck's RESTING (initial) position.
//   - For grouped travellers (long-shift, breakaway) the x/y are
//     relative to the player <g> they live inside.
//   - For standalone pucks (warmup, tic-tac-toe, goal, telestrator)
//     the x/y are absolute SVG-viewBox coordinates.
//   - x/y are the TOP-LEFT of the puck box; w/h are its render size.
// To nudge a puck for a scene, edit ONLY the numbers below.
//
// PUCK_BIG = the dramatic warmup puck. PUCK_W/H = the "20%" puck used
// in every gameplay scene.
// ============================================================
const PUCK_BIG_W = 60;   // warmup puck (the hero puck-drop)
const PUCK_BIG_H = 52;
const PUCK_W = 10;       // gameplay puck — 20% of the original 50
const PUCK_H = 8.6;      // gameplay puck — 20% of the original 43

const PUCK_ANCHORS = {
    warmup:        { x: 570, y: -60, w: PUCK_BIG_W, h: PUCK_BIG_H },  // off-screen, drops in
    'long-shift':  { x: -5,  y: 50,  w: PUCK_W, h: PUCK_H },  // relative to .shift-traveller group
    breakaway:     { x: 55,  y: 0,   w: PUCK_W, h: PUCK_H },  // relative to .breakaway-traveller group
    'tic-tac-toe': { x: 315, y: 225, w: PUCK_W, h: PUCK_H },  // at player 1 (centre 320,230)
    telestrator:   { x: 795, y: 445, w: PUCK_W, h: PUCK_H },  // frozen play, in the slot
    goal:          { x: 795, y: 696, w: PUCK_W, h: PUCK_H },  // shooter's stick (centre 800,700)
};

// Apply the resting anchor + size to every puck on load.
function placePucks() {
    document.querySelectorAll('.js-puck').forEach((puck) => {
        const key = puck.dataset.puck;
        const a = PUCK_ANCHORS[key];
        if (!a) return;
        puck.setAttribute('x', a.x);
        puck.setAttribute('y', a.y);
        puck.setAttribute('width', a.w);
        puck.setAttribute('height', a.h);
    });
}
placePucks();

// ============================================================
// SCENE 1: WARMUP — puck-drop intro (NOT scroll-driven)
// Scoreboard shows "WARMUP 20:00" counting down; no lower-third box.
// ============================================================
// --- TEMP DEBUG: trace every change to the warmup-overlay element ---
(() => {
    const ov = document.querySelector('.warmup-overlay');
    if (!ov) { console.log('[DEBUG] .warmup-overlay NOT FOUND'); return; }
    const cs = getComputedStyle(ov);
    console.log('[DEBUG] at main.js start — inline:', ov.getAttribute('style'),
                '| computed opacity:', cs.opacity, '| display:', cs.display);
    new MutationObserver((muts) => {
        muts.forEach(m => {
            console.log('[DEBUG] overlay style changed ->', ov.getAttribute('style'),
                        '| computed opacity:', getComputedStyle(ov).opacity);
        });
    }).observe(ov, { attributes: true, attributeFilter: ['style', 'class'] });
})();
// --- END TEMP DEBUG ---

// Force the overlay hidden before the timeline is built, so it can't
// flash at full opacity during page load / timeline construction.
gsap.set('.warmup-overlay', { opacity: 0, y: 12 });

// paused: true — the timeline must NOT autoplay on creation. It is
// started once below from the window 'load' handler, AFTER images are
// ready and ScrollTrigger.refresh() has run. Autoplaying here caused a
// double-play flash: the intro ran early, then refresh() jolted it.
const warmupIntro = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });

// Puck starts at PUCK_ANCHORS.warmup.y (-60) and drops onto the
// centre-ice spot (cy 400 → top-left y = 400 - half the puck box).
warmupIntro
    .to('.warmup-rink', { opacity: 0.45, duration: 0.6 }, 0)
    .to('.warmup-puck', {
        y: (400 - PUCK_BIG_H / 2) - PUCK_ANCHORS.warmup.y,
        duration: 0.55,
        ease: 'bounce.out',
    }, 0.2)
    .to('.warmup-spot', { opacity: 0.9, duration: 0.4 }, 0.6)
    .to('.warmup-puck', {
        scale: 0.92,
        transformOrigin: '50% 50%',
        duration: 0.08,
        yoyo: true,
        repeat: 1,
    }, '>')
    // immediateRender:false — don't let GSAP paint this tween's state
    // until the playhead actually reaches it.
    .to('.warmup-overlay',
        { opacity: 1, y: 0, duration: 0.5, immediateRender: false },
        '-=0.2');

// Activate the warmup scoreboard (countdown clock, no caption box).
activateWarmup();

ScrollTrigger.create({
    trigger: '#warmup',
    start: 'top top',
    end: 'bottom top',
    onEnterBack: () => activateWarmup(),
});

// ============================================================
// SCENE 2: FACE-OFF (PILOT) — iris expand + players lean in
// ============================================================
if (!isMobile) {
gsap.timeline({
    scrollTrigger: {
        trigger: '#faceoff',
        start: 'top top',
        end: '+=1500',
        pin: true,
        scrub: 1,
        onEnter:     () => activateScene({ label: '1980s', text: 'ROOKIE', story: SCENE_STORY.rookie, period: 'PERIOD 1', seedSeconds: 1200, countdown: true }),
        onEnterBack: () => activateScene({ label: '1980s', text: 'ROOKIE', story: SCENE_STORY.rookie, period: 'PERIOD 1', seedSeconds: 1200, countdown: true }),
    },
})
    .fromTo('.faceoff-clip-circle',
        { attr: { r: 0 } },
        { attr: { r: 220 }, duration: 0.6, ease: 'power2.out' },
        0
    )
    .from('.faceoff-player-left',  { x: -80, opacity: 0, duration: 0.35 }, 0)
    .from('.faceoff-player-right', { x:  80, opacity: 0, duration: 0.35 }, 0)
    .to({}, { duration: 0.5 });
}

// ============================================================
// SCENE 3: LONG SHIFT (CAREER) — boards-path traveller + year markers
// Desktop only — the boards motion path doesn't survive mobile scaling.
// ============================================================
if (!isMobile) {
const shiftTl = gsap.timeline({
    scrollTrigger: {
        trigger: '#long-shift',
        start: 'top top',
        end: '+=3500',
        pin: true,
        scrub: 1,
        onEnter:     () => activateScene({ label: 'FILM CAREER', text: 'FOCUS PULLER - 18 SEASONS', story: SCENE_STORY.focusPuller, period: 'PERIOD 1', seedSeconds: 884, countdown: true }),  // 14:44
        onEnterBack: () => activateScene({ label: 'FILM CAREER', text: 'FOCUS PULLER - 18 SEASONS', story: SCENE_STORY.focusPuller, period: 'PERIOD 1', seedSeconds: 884, countdown: true }),
    },
});

shiftTl.to('.shift-traveller', {
    motionPath: {
        path: '#boards-path',
        align: '#boards-path',
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
    },
    ease: 'none',
    duration: 1,
}, 0);

// FILM photo cards pop in as the traveller passes each one:
// top row left→centre→right, then bottom row right→centre→left.
// data-order (1..7) gives the reveal sequence; the timeline
// positions below track the player along the boards path.
const filmCards = gsap.utils.toArray('.year-marker')
    .sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));

// Reveal moments (timeline 0..1) tuned to the player's path progress.
// Last card finishes at 0.86 + 0.14 = 1.0 so the pin has no dead-air tail.
const filmRevealAt = [0.06, 0.18, 0.30, 0.44, 0.58, 0.72, 0.86];

filmCards.forEach((el, i) => {
    shiftTl.fromTo(el,
        { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' },
        { opacity: 1, scale: 1, duration: 0.14, ease: 'back.out(1.6)' },
        filmRevealAt[i]
    );
});
}

// ============================================================
// SCENE 4: BREAKAWAY — diagonal sprint + callouts
// Desktop only — the diagonal motion path and absolute callouts
// don't survive mobile scaling.
// ============================================================
if (!isMobile) {
// Snap the traveller onto the path start immediately so it never flashes
// at its raw SVG coordinates before the scroll animation initializes.
gsap.set('.breakaway-traveller', {
    motionPath: {
        path: '#breakaway-path',
        align: '#breakaway-path',
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
        start: 0,
        end: 0,
    },
});

gsap.timeline({
    scrollTrigger: {
        trigger: '#breakaway',
        start: 'top top',
        end: '+=2000',
        pin: true,
        scrub: 1,
        onEnter:     () => activateScene({ label: 'BREAKAWAY', text: 'STARTUPS', story: SCENE_STORY.startups, period: 'PERIOD 2', seedSeconds: 1200, countdown: true }),
        onEnterBack: () => activateScene({ label: 'BREAKAWAY', text: 'STARTUPS', story: SCENE_STORY.startups, period: 'PERIOD 2', seedSeconds: 1200, countdown: true }),
    },
})
    .to('.breakaway-traveller', {
        motionPath: {
            path: '#breakaway-path',
            align: '#breakaway-path',
            alignOrigin: [0.5, 0.5],
            autoRotate: false,
        },
        ease: 'none',
        duration: 1,
    }, 0)
    .fromTo('.callout[data-callout="1"]',
        { opacity: 0, scale: 0.85, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.6)' },
        0.3
    )
    .fromTo('.callout[data-callout="2"]',
        { opacity: 0, scale: 0.85, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.6)' },
        0.7
    );

// Subtle handheld camera shake — independent of scroll
gsap.to('.scene-breakaway', {
    x: 2,
    repeat: -1,
    yoyo: true,
    duration: 0.12,
    ease: 'sine.inOut',
});
}

// ============================================================
// SCENE 5: TIC-TAC-TOE — the passing-play carousel
// Desktop only — the passing lanes and absolute project cards
// don't survive mobile scaling.
// ============================================================
if (!isMobile) {
const tttTl = gsap.timeline({
    scrollTrigger: {
        trigger: '#tic-tac-toe',
        start: 'top top',
        end: '+=4000',
        pin: true,
        scrub: 1,
        onEnter:     () => activateScene({ label: 'PASSING PLAY', text: 'CURRENT VENTURES', story: SCENE_STORY.currentVentures, period: 'PERIOD 3', seedSeconds: 1200, countdown: true }),
        onEnterBack: () => activateScene({ label: 'PASSING PLAY', text: 'CURRENT VENTURES', story: SCENE_STORY.currentVentures, period: 'PERIOD 3', seedSeconds: 1200, countdown: true }),
    },
});

tttTl.fromTo('.proj-card[data-card="1"]',
    { opacity: 0, scale: 0, rotateY: -90, transformOrigin: 'center center' },
    { opacity: 1, scale: 1, rotateY: 0, duration: 0.2, ease: 'back.out(1.7)' },
    0
);

// Lane endpoints are player CENTRES; the puck <image> is positioned by
// its top-left corner, so we offset by half the puck box (see PUCK_W/H).
const passes = [
    { lane: 1, toX: 1280, toY: 230, card: 2 },
    { lane: 2, toX: 800,  toY: 410, card: 3 },
    { lane: 3, toX: 320,  toY: 630, card: 4 },
    { lane: 4, toX: 1280, toY: 630, card: 5 },
];

// Lanes are drawn statically (no draw-on animation). The puck moves
// to the next player immediately at each pass step.
passes.forEach((p, i) => {
    const start = 0.2 + i * 0.18;
    tttTl.to('.ttt-puck',
        { attr: { x: p.toX - PUCK_W / 2, y: p.toY - PUCK_H / 2 }, duration: 0.12, ease: 'power2.in' },
        start
    );
    tttTl.fromTo(`.proj-card[data-card="${p.card}"]`,
        { opacity: 0, scale: 0, rotateY: -90, transformOrigin: 'center center' },
        { opacity: 1, scale: 1, rotateY: 0, duration: 0.18, ease: 'back.out(1.7)' },
        start + 0.1
    );
});
}

// ============================================================
// SCENE 6: TELESTRATOR (REPLAY) — Wrioter deep dive
// Chalk marks draw on the frozen play, then 7 tech-stack topic
// cards reveal; the 2 "detailed" topics expand their sub-items.
// Desktop only — the 3-column grid + frozen-play SVG fall back to
// a stacked card list on mobile.
// ============================================================
if (!isMobile) {
const teleTl = gsap.timeline({
    scrollTrigger: {
        trigger: '#telestrator',
        start: 'top top',
        end: '+=4000',
        pin: true,
        scrub: 1,
        onEnter:     () => activateScene({ label: 'REPLAY', text: 'WRIOTER - DEEP DIVE', story: SCENE_STORY.wrioter, period: 'PERIOD 3', seedSeconds: 693, countdown: true }),  // 11:33
        onEnterBack: () => activateScene({ label: 'REPLAY', text: 'WRIOTER - DEEP DIVE', story: SCENE_STORY.wrioter, period: 'PERIOD 3', seedSeconds: 693, countdown: true }),
    },
});

// Chalk highlight draws onto the frozen play.
teleTl
    .to('[data-mark="1"]', { strokeDashoffset: 0, duration: 0.25, ease: 'power2.out' }, 0)
    .to('[data-mark="2"]', { strokeDashoffset: 0, duration: 0.25, ease: 'power2.out' }, 0.15)
    .to('[data-mark="3"]', { strokeDashoffset: 0, duration: 0.25, ease: 'power2.out' }, 0.25)
    .from('.tele-heading', { opacity: 0, y: -20, duration: 0.2 }, 0.3);

// Topic cards reveal in sequence (9 of them).
gsap.utils.toArray('.tele-topic').forEach((card, i) => {
    teleTl.fromTo(card,
        { opacity: 0, y: 30, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(1.5)' },
        0.34 + i * 0.07
    );
});

// The 2 detailed topics expand their sub-items (animated subheadings).
gsap.utils.toArray('.tele-topic.detailed').forEach((card, ci) => {
    const subs = card.querySelectorAll('.tele-subs li');
    subs.forEach((li, si) => {
        teleTl.fromTo(li,
            { opacity: 0, x: -16 },
            { opacity: 1, x: 0, duration: 0.14, ease: 'power2.out' },
            0.5 + ci * 0.14 + si * 0.06
        );
    });
});

// Chalk tremor — independent of scroll.
gsap.to('.telestrator-marks', {
    x: '+=1.2',
    y: '+=0.8',
    duration: 0.08,
    repeat: -1,
    yoyo: true,
});
}

// ============================================================
// SCENE 7: REPLAY REEL (HIGHLIGHTS) — PiP staggered reveal
// Desktop only — on mobile the PiP grid stacks and fades in via
// the shared mobile observer below.
// ============================================================
if (!isMobile) {
gsap.timeline({
    scrollTrigger: {
        trigger: '#replay-reel',
        start: 'top top',
        end: '+=2500',
        pin: true,
        scrub: 1,
        onEnter:     () => activateScene({ label: 'HIGHLIGHTS', text: 'LOVE & MECHANICAL SPONTANEITY', story: SCENE_STORY.highlights, period: 'PERIOD 3', seedSeconds: 350, countdown: true, penalty: 180 }),  // 5:50, penalty 3:00
        onEnterBack: () => activateScene({ label: 'HIGHLIGHTS', text: 'LOVE & MECHANICAL SPONTANEITY', story: SCENE_STORY.highlights, period: 'PERIOD 3', seedSeconds: 350, countdown: true, penalty: 180 }),
    },
})
    .from('.pip[data-pip="1"]', { opacity: 0, scale: 0.6, y: 30, duration: 0.3, ease: 'back.out(1.4)' }, 0)
    .from('.pip[data-pip="2"]', { opacity: 0, scale: 0.6, y: 30, duration: 0.3, ease: 'back.out(1.4)' }, 0.18)
    .from('.pip[data-pip="3"]', { opacity: 0, scale: 0.6, y: 30, duration: 0.3, ease: 'back.out(1.4)' }, 0.36)
    .from('.pip[data-pip="4"]', { opacity: 0, scale: 0.6, y: 30, duration: 0.3, ease: 'back.out(1.4)' }, 0.54);
}

// ============================================================
// SCENE 8: GOAL — slap shot + CTA reveal
// Desktop only — on mobile the net SVG sits static and the CTA
// flows in normally via the shared mobile observer below.
// ============================================================
if (!isMobile) {
gsap.timeline({
    scrollTrigger: {
        trigger: '#goal',
        start: 'top top',
        end: '+=2000',
        pin: true,
        scrub: 1,
        onEnter:     () => activateScene({ label: 'GOAL', text: 'CONTACT', period: 'OT', seedSeconds: 1200, countdown: true }),
        onEnterBack: () => activateScene({ label: 'GOAL', text: 'CONTACT', period: 'OT', seedSeconds: 1200, countdown: true }),
    },
})
    // Puck is hidden until just before the shot — it pops in, then
    // immediately rockets up into the net. No wind-up beforehand.
    .to('.goal-puck', { opacity: 1, duration: 0.04 }, 0.10)
    // Slap shot into the top corner of the net. Puck <image> is positioned
    // by top-left, so subtract half the puck box from the centre coords.
    .to('.goal-puck', { attr: { x: 860 - PUCK_W / 2, y: 200 - PUCK_H / 2 }, duration: 0.2, ease: 'power4.out' }, 0.14)
    // Goal light is invisible until the puck scores, then flickers red.
    .to('.goal-light', { opacity: 1, duration: 0.06, yoyo: true, repeat: 7 }, 0.32)
    // Net reacts to the goal with a quick ripple-pulse.
    .to('.net-icon', { scale: 1.06, transformOrigin: '50% 50%', duration: 0.1, yoyo: true, repeat: 1 }, 0.32)
    // CTA fades in and rises into place. Final rest position set by CSS.
    .fromTo('.goal-cta',
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' },
        0.2
    );
}

// ============================================================
// LOWER-THIRD MINIMIZE — tap the whole caption box to toggle
// ============================================================
// State persists across scene changes within the session.
if (lowerThirdEl) {
    const toggle = () => lowerThirdEl.classList.toggle('minimized');
    lowerThirdEl.addEventListener('click', toggle);
    lowerThirdEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });
}

// ============================================================
// MOBILE SCENE PATH — non-pinned caption + fade-in
// ============================================================
// On mobile every scene flows as a normal stacked section. A single
// ScrollTrigger per scene fires the broadcast caption/scoreboard and
// adds `.in-view` so CSS can fade the section up. No pinning, no scrub.
if (isMobile) {
    const MOBILE_SCENES = {
        faceoff:       { label: '1980s',       text: 'ROOKIE',                       story: SCENE_STORY.rookie,          period: 'PERIOD 1', seedSeconds: 1200, countdown: true },
        'long-shift':  { label: 'FILM CAREER', text: 'FOCUS PULLER - 18 SEASONS',     story: SCENE_STORY.focusPuller,     period: 'PERIOD 1', seedSeconds: 884,  countdown: true },
        breakaway:     { label: 'BREAKAWAY',   text: 'STARTUPS',                      story: SCENE_STORY.startups,        period: 'PERIOD 2', seedSeconds: 1200, countdown: true },
        'tic-tac-toe': { label: 'PASSING PLAY',text: 'CURRENT VENTURES',              story: SCENE_STORY.currentVentures, period: 'PERIOD 3', seedSeconds: 1200, countdown: true },
        telestrator:   { label: 'REPLAY',      text: 'WRIOTER - DEEP DIVE',           story: SCENE_STORY.wrioter,         period: 'PERIOD 3', seedSeconds: 693,  countdown: true },
        'replay-reel': { label: 'HIGHLIGHTS',  text: 'LOVE & MECHANICAL SPONTANEITY', story: SCENE_STORY.highlights,      period: 'PERIOD 3', seedSeconds: 350,  countdown: true, penalty: 180 },
        goal:          { label: 'GOAL',        text: 'CONTACT',                       period: 'OT',       seedSeconds: 1200, countdown: true },
    };

    Object.entries(MOBILE_SCENES).forEach(([id, cfg]) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Fade the section up as it enters from the bottom.
        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            onEnter:     () => el.classList.add('in-view'),
            onEnterBack: () => el.classList.add('in-view'),
        });

        // Caption/scoreboard track whichever scene enters the bottom third
        // of the viewport — fires when the scene's top edge crosses 67% down.
        ScrollTrigger.create({
            trigger: el,
            start: 'top 67%',
            end: 'bottom 67%',
            onEnter:     () => activateScene(cfg),
            onEnterBack: () => activateScene(cfg),
        });
    });
}

// ============================================================
// Refresh ScrollTrigger once everything is wired up, then play the
// warmup intro. Order matters: refresh() first so layout is settled,
// then start the intro so it runs exactly once with no jolt.
// ============================================================
window.addEventListener('load', () => {
    ScrollTrigger.refresh();
    warmupIntro.play(0);
});
