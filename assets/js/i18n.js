/* ============================================================
   i18n + theme state (vanilla JS, no dependencies)
   Language priority: URL ?language= → localStorage → "en"
   Theme: "auto" (follow system) → "light" → "dark"
   ============================================================ */
'use strict';

const I18N = {
    en: {
        "explore": "explore →",
        "tagline": "Apps I wish existed.",
        "appsTitle": "Apps",
        "learn": "Learn more",
        "theme.auto": "Auto",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "lang.title": "Switch to 中文",
        "meta.title": "Jos Hu",
        "meta.desc": "Jos Hu — Apps I wish existed."
    },
    zh: {
        "explore": "探索 →",
        "tagline": "做那些我希望存在的应用。",
        "appsTitle": "应用",
        "learn": "了解更多",
        "theme.auto": "自动",
        "theme.light": "浅色",
        "theme.dark": "深色",
        "lang.title": "切换到英文",
        "meta.title": "Jos Hu",
        "meta.desc": "Jos Hu — 做那些我希望存在的应用。"
    }
};

const LANG_KEY = 'jh-lang';
const THEME_KEY = 'jh-theme';
const THEME_ORDER = ['auto', 'light', 'dark'];

let currentLang = 'en';
let themeOpt = 'auto';
const mql = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;
const langChangeHooks = [];

function t(key) {
    const dict = I18N[currentLang] || I18N.en;
    return dict[key] !== undefined ? dict[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
}

function registerLangHook(fn) {
    langChangeHooks.push(fn);
}

/* ---------- Language ---------- */

function detectLang() {
    try {
        const url = new URLSearchParams(location.search).get('language');
        if (url !== null) {
            const v = url.toLowerCase();
            if (v === 'en' || v === 'zh') {
                localStorage.setItem(LANG_KEY, v);
                return v;
            }
            return 'en';
        }
        return localStorage.getItem(LANG_KEY) || 'en';
    } catch (e) {
        return 'en';
    }
}

function applyI18n() {
    document.documentElement.lang = currentLang === 'zh' ? 'zh-Hans' : 'en';
    document.title = t('meta.title');
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('meta.desc'));
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.innerHTML = t(el.dataset.i18n);
    });
    const lb = document.getElementById('langBtn');
    if (lb) {
        lb.textContent = currentLang === 'en' ? 'EN' : '中文';
        lb.setAttribute('title', t('lang.title'));
        lb.setAttribute('aria-label', t('lang.title'));
    }
    applyTheme();
}

function setLang(lang, persist) {
    currentLang = lang === 'zh' ? 'zh' : 'en';
    if (persist !== false) {
        try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) { /* ignore */ }
    }
    // Keep the ?language= URL param in sync so the URL never contradicts
    // the displayed language (and refreshes stay in the same language).
    try {
        const url = new URL(location.href);
        if (url.searchParams.get('language') !== currentLang) {
            url.searchParams.set('language', currentLang);
            history.replaceState(null, '', url);
        }
    } catch (e) { /* ignore */ }
    applyI18n();
    langChangeHooks.forEach(function (fn) { fn(); });
}

/* ---------- Theme ---------- */

function effectiveTheme() {
    if (themeOpt === 'auto') {
        return mql && mql.matches ? 'dark' : 'light';
    }
    return themeOpt;
}

const THEME_ICONS = { auto: '◐', light: '☀', dark: '☾' };

function applyTheme() {
    const eff = effectiveTheme();
    document.documentElement.dataset.theme = eff;
    document.documentElement.style.colorScheme = eff;
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', eff === 'dark' ? '#0E0E0E' : '#F7F7F5');
    const tb = document.getElementById('themeBtn');
    if (tb) {
        tb.textContent = THEME_ICONS[themeOpt];
        const label = t('theme.' + themeOpt);
        tb.setAttribute('title', label);
        tb.setAttribute('aria-label', label);
    }
}

function setTheme(opt) {
    if (THEME_ORDER.indexOf(opt) < 0) opt = 'auto';
    themeOpt = opt;
    try { localStorage.setItem(THEME_KEY, themeOpt); } catch (e) { /* ignore */ }
    applyTheme();
}

function initTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        themeOpt = THEME_ORDER.indexOf(saved) >= 0 ? saved : 'auto';
    } catch (e) {
        themeOpt = 'auto';
    }
    if (mql && mql.addEventListener) {
        mql.addEventListener('change', function () {
            if (themeOpt === 'auto') applyTheme();
        });
    }
    applyTheme();
}

/* ---------- Boot ---------- */

function initSite() {
    currentLang = detectLang();
    initTheme();
    applyI18n();
    const lb = document.getElementById('langBtn');
    if (lb) {
        lb.addEventListener('click', function () {
            setLang(currentLang === 'en' ? 'zh' : 'en');
        });
    }
    const tb = document.getElementById('themeBtn');
    if (tb) {
        tb.addEventListener('click', function () {
            const i = THEME_ORDER.indexOf(themeOpt);
            setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite);
} else {
    initSite();
}
