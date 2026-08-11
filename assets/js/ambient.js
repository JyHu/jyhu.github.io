/* ============================================================
   Ambient layer — faint shapes drifting linearly across the
   page, breathing gently.

   Decorative only:
   - fixed behind the page (z-index: -1) -> no layout impact
   - pointer-events: none                -> never blocks clicks
   - container is aria-hidden            -> invisible to a11y
   - respects prefers-reduced-motion     -> no motion, no layer

   Motion: each shape drifts at a constant velocity (linear,
   no teleports), bounces off viewport edges, rotates slowly,
   and breathes (opacity + scale pulse on its own phase/period).
   Colors come from CSS variables (--amb-c1..3) so they adapt
   to light/dark automatically. Pauses when the tab is hidden.
   ============================================================ */
'use strict';

(function () {
    var COUNT = 12;       // number of shapes
    var EDGE = 20;        // min distance from viewport edges
    var SPEED_MIN = 14;   // drift speed (px/s)
    var SPEED_MAX = 34;
    var ROT_MAX = 6;      // rotation (deg/s)
    var BREATH_MIN = 4000;  // breath cycle (ms)
    var BREATH_MAX = 8500;
    var BREATH_OP = 0.45;   // opacity swing around base
    var BREATH_SC = 0.10;   // scale swing around 1

    // Shape mix — color blocks dominate, rings/lines are rare accents.
    var TYPES = ['block', 'block', 'blob', 'diamond', 'dot', 'ring', 'line'];
    var FILLS = ['var(--amb-c1)', 'var(--amb-c2)', 'var(--amb-c3)'];
    var OUTLINES = ['var(--amb-c1)', 'var(--amb-c2)'];

    var layer = document.getElementById('ambient');
    if (!layer) return;

    var reduced = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    var items = [];
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var rafId = null;
    var lastTs = null;

    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

    /* Create one shape. */
    function spawn() {
        var type = pick(TYPES);
        var el = document.createElement('i');
        el.className = 'amb-' + type;

        var w, h;
        if (type === 'line') {
            w = rand(26, 70);
            h = rand(1.5, 2.5);
            el.style.background = pick(FILLS);
        } else if (type === 'ring') {
            w = h = rand(18, 44);
            el.style.background = 'none';
            el.style.border = '1.5px solid ' + pick(OUTLINES);
        } else {
            w = h = rand(12, 38);
            el.style.background = pick(FILLS);
        }
        el.style.width = w + 'px';
        el.style.height = h + 'px';
        layer.appendChild(el);

        var angle = rand(0, Math.PI * 2);
        var speed = rand(SPEED_MIN, SPEED_MAX);
        var item = {
            el: el, w: w, h: h,
            x: rand(EDGE, Math.max(EDGE + 1, vw - w - EDGE)),
            y: rand(EDGE, Math.max(EDGE + 1, vh - h - EDGE)),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rot: type === 'diamond' ? 45 : rand(-20, 20),
            rotSpeed: rand(-ROT_MAX, ROT_MAX),
            breathPhase: rand(0, Math.PI * 2),
            breathPeriod: rand(BREATH_MIN, BREATH_MAX),
            baseOp: (type === 'ring' || type === 'line') ? 1.15 : 1.0
        };
        items.push(item);
        paint(item, 0);
    }

    /* Write current transform + opacity for one shape. */
    function paint(item, ts) {
        var s = Math.sin(ts / item.breathPeriod * Math.PI * 2 + item.breathPhase);
        item.el.style.opacity = (item.baseOp * (1 + BREATH_OP * s)).toFixed(3);
        item.el.style.transform =
            'translate(' + item.x.toFixed(1) + 'px, ' + item.y.toFixed(1) + 'px) ' +
            'rotate(' + item.rot.toFixed(1) + 'deg) scale(' + (1 + BREATH_SC * s).toFixed(3) + ')';
    }

    function frame(ts) {
        if (lastTs == null) lastTs = ts;
        var dt = Math.min(ts - lastTs, 100); // clamp: tab was hidden
        lastTs = ts;

        items.forEach(function (it) {
            it.x += it.vx * dt / 1000;
            it.y += it.vy * dt / 1000;
            if (it.x < EDGE) { it.x = EDGE; it.vx = Math.abs(it.vx); }
            else if (it.x > vw - it.w - EDGE) { it.x = vw - it.w - EDGE; it.vx = -Math.abs(it.vx); }
            if (it.y < EDGE) { it.y = EDGE; it.vy = Math.abs(it.vy); }
            else if (it.y > vh - it.h - EDGE) { it.y = vh - it.h - EDGE; it.vy = -Math.abs(it.vy); }
            it.rot += it.rotSpeed * dt / 1000;
            paint(it, ts);
        });
        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (rafId != null || !items.length) return;
        lastTs = null;
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
    }

    /* Keep shapes inside the viewport after a resize. */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            vw = window.innerWidth;
            vh = window.innerHeight;
            items.forEach(function (it) {
                it.x = Math.min(Math.max(it.x, EDGE), Math.max(EDGE, vw - it.w - EDGE));
                it.y = Math.min(Math.max(it.y, EDGE), Math.max(EDGE, vh - it.h - EDGE));
            });
        }, 200);
    });

    /* Pause when the tab is hidden. */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stop();
        } else if (!reduced || !reduced.matches) {
            start();
        }
    });

    /* Follow OS-level motion preference changes. */
    if (reduced && reduced.addEventListener) {
        reduced.addEventListener('change', function () {
            if (reduced.matches) {
                stop();
                layer.style.display = 'none';
            } else {
                if (!items.length) {
                    for (var i = 0; i < COUNT; i++) spawn();
                }
                layer.style.display = '';
                start();
            }
        });
    }

    /* Boot */
    if (!reduced || !reduced.matches) {
        for (var i = 0; i < COUNT; i++) spawn();
        start();
    } else {
        layer.style.display = 'none';
    }
})();
