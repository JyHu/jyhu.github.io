/* ============================================================
   Main UI: app list render, icon interaction, reveal animations
   ============================================================ */
'use strict';

function renderList() {
    const el = document.getElementById('appList');
    if (!el) return;
    el.innerHTML = APPS.map(function (a, i) {
        const nm = typeof a.name === 'string' ? a.name : a.name[currentLang] || a.name.en;
        const num = String(i + 1).padStart(2, '0');
        return '<article class="work reveal">' +
            '<div class="work-num">' + num + '</div>' +
            '<div class="work-body">' +
            '<h3>' + nm + '</h3>' +
            '<p class="work-tag">' + a.tag[currentLang] + '</p>' +
            '<p class="work-desc">' + a.desc[currentLang] + '</p>' +
            '<a class="work-link" href="' + a.url + '" target="_blank" rel="noopener">' + t('learn') + ' <span class="arr">→</span></a>' +
            '</div>' +
            '</article>';
    }).join('');
    observe();
}

/* ---------- Reveal on scroll ---------- */

let revealObserver = null;

function observe() {
    const els = document.querySelectorAll('.reveal:not(.visible)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
        els.forEach(function (el) { el.classList.add('visible'); });
        return;
    }
    if (!revealObserver) {
        revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
    }
    els.forEach(function (el) { revealObserver.observe(el); });
}

/* ---------- Icon interaction: quiet scroll into apps ---------- */

function initIcon() {
    const icon = document.getElementById('iconBlock');
    if (!icon) return;
    icon.addEventListener('click', function () {
        icon.classList.add('engaged');
        document.getElementById('apps').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const hint = document.getElementById('scrollHint');
    if (hint) {
        hint.addEventListener('click', function () {
            document.getElementById('apps').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

/* ---------- Boot ---------- */

function boot() {
    renderList();
    initIcon();
    document.getElementById('year').textContent = new Date().getFullYear();
    registerLangHook(renderList);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
