(function () {
  // 随机字符串生成：按字符集策略批量生成随机字符串，支持复制与下载
  function initRandomString() {
    const root = document.getElementById("vemiyRandomString");
    if (!root) return;
    if (root.dataset.toolInit === "true") return;
    root.dataset.toolInit = "true";

    const $ = id => document.getElementById(id);
    const D = { len: 12, cnt: 10, sym: '!@#$%^&*()-_=+', exc: 'iIl1o0O', minLen: 1, maxLen: 128, minCnt: 1, maxCnt: 200 };
    const els = {
      out: $('vemiyBatchOutput'), len: $('vemiyStrLen'), cnt: $('vemiyBatchCount'),
      up: $('vemiyOptUpper'), low: $('vemiyOptLower'), num: $('vemiyOptNum'),
      cus: $('vemiyOptCustomSym'), sym: $('vemiyCustomSymbols'),
      exc: $('vemiyOptExclude'), excChars: $('vemiyExcludeChars'),
      gen: $('vemiyGenBtn'), rst: $('vemiyResetBtn'), dl: $('vemiyDownloadBtn'), cp: $('vemiyCopyAllBtn')
    };
    const timers = new Map();
    let charset = '', dirty = true;

    const markDirty = () => dirty = true;
    const getCharset = () => {
      if (!dirty) return charset;
      let c = (els.up.checked ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '') +
              (els.low.checked ? 'abcdefghijklmnopqrstuvwxyz' : '') +
              (els.num.checked ? '0123456789' : '') +
              (els.cus.checked ? [...new Set(els.sym.value)].join('') : '');
      if (els.exc.checked && els.excChars.value) {
        const ex = new Set(els.excChars.value);
        c = [...c].filter(ch => !ex.has(ch)).join('');
      }
      charset = c || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      dirty = false;
      return charset;
    };

    const clampVal = (raw, min, max, fallback) => {
      if (raw === '' || raw === null) return { v: fallback, d: '' };
      const n = parseInt(raw, 10);
      if (isNaN(n)) return { v: fallback, d: String(fallback) };
      const cl = Math.min(max, Math.max(min, n));
      return { v: cl, d: String(cl) };
    };

    const flash = (btn, txt, err = false) => {
      if (!btn.dataset.def) btn.dataset.def = btn.textContent;
      clearTimeout(timers.get(btn));
      btn.textContent = txt;
      btn.style.backgroundColor = err ? '#aa2e2e' : '#2a5f8a';
      btn.style.color = '#fff';
      const t = setTimeout(() => {
        btn.textContent = btn.dataset.def;
        btn.style.backgroundColor = '';
        btn.style.color = '';
        timers.delete(btn);
      }, 1000);
      timers.set(btn, t);
    };

    const randIdx = (len) => {
      const max = Math.floor(256 / len) * len;
      const b = new Uint8Array(1);
      let r;
      do { crypto.getRandomValues(b); r = b[0]; } while (r >= max);
      return r % len;
    };

    const generate = () => {
      const lr = clampVal(els.len.value, D.minLen, D.maxLen, D.len);
      const cr = clampVal(els.cnt.value, D.minCnt, D.maxCnt, D.cnt);
      if (lr.d !== els.len.value) els.len.value = lr.d;
      if (cr.d !== els.cnt.value) els.cnt.value = cr.d;
      const ch = getCharset();
      const res = Array.from({ length: cr.v }, () => {
        let s = '';
        for (let i = 0; i < lr.v; i++) s += ch[randIdx(ch.length)];
        return s;
      });
      els.out.value = res.join('\n');
    };

    const reset = () => {
      els.up.checked = els.low.checked = els.num.checked = els.cus.checked = true;
      els.exc.checked = false;
      els.sym.value = D.sym;
      els.excChars.value = D.exc;
      els.len.value = D.len;
      els.cnt.value = D.cnt;
      markDirty();
      generate();
    };

    const copy = async () => {
      const txt = els.out.value.trim();
      if (!txt) return flash(els.cp, '无效内容', true);
      try { await navigator.clipboard.writeText(txt); flash(els.cp, '复制成功'); }
      catch {
        const ta = document.createElement('textarea');
        ta.value = txt; ta.style.cssText = 'position:fixed;top:-9999px';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        flash(els.cp, '复制成功');
      }
    };

    const download = () => {
      const txt = els.out.value.trim();
      if (!txt) return flash(els.dl, '无效内容', true);
      try {
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
        a.href = url; a.download = `random-strings-${stamp}.txt`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        flash(els.dl, '下载成功');
      } catch { flash(els.dl, '下载失败', true); }
    };

    const wheelBind = (el, min, max, fallback) => {
      el.addEventListener('wheel', e => {
        e.preventDefault();
        const raw = el.value;
        const cur = (raw === '' || isNaN(parseInt(raw, 10))) ? fallback : Math.min(max, Math.max(min, parseInt(raw, 10) || fallback));
        el.value = Math.min(max, Math.max(min, cur + (e.deltaY > 0 ? -1 : 1)));
        generate();
      }, { passive: false });
    };

    const blurGuard = (el, min, max, fallback) => {
      el.addEventListener('blur', () => {
        if (el.value === '' || isNaN(parseInt(el.value, 10))) { el.value = fallback; generate(); }
      });
    };

    [
      els.len, els.cnt, els.up, els.low, els.num, els.cus, els.sym, els.exc, els.excChars
    ].forEach(el => el.addEventListener('input', () => {
      if (el === els.sym || el === els.excChars || el === els.up || el === els.low || el === els.num || el === els.cus || el === els.exc) markDirty();
      generate();
    }));

    els.gen.addEventListener('click', generate);
    els.rst.addEventListener('click', reset);
    els.dl.addEventListener('click', download);
    els.cp.addEventListener('click', copy);

    wheelBind(els.len, D.minLen, D.maxLen, D.len);
    wheelBind(els.cnt, D.minCnt, D.maxCnt, D.cnt);
    blurGuard(els.len, D.minLen, D.maxLen, D.len);
    blurGuard(els.cnt, D.minCnt, D.maxCnt, D.cnt);

    markDirty();
    generate();
  }

  // 首屏加载与客户端路由切换后均执行初始化，函数内部保证幂等
  if (!window.__vemiyRandomStringBound) {
    window.__vemiyRandomStringBound = true;
    document.addEventListener("DOMContentLoaded", initRandomString);
    document.addEventListener("astro:page-load", initRandomString);
    document.addEventListener("pjax:complete", initRandomString);
  }
  initRandomString();
})();
