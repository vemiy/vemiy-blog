---
title: 随机字符串生成器
date: 2026-04-17 00:00:00
comments: false
---

<div class="vemiy-tool vemiy-random-string" id="vemiyRandomString">
  <div class="vemiy-tool-sub vemiy-random-string-sub">安全 token / 临时密码 / 一次性凭证</div>
  <div class="vemiy-tool-section vemiy-random-string-section vemiy-random-string-basic">
    <label class="vemiy-tool-check"><input type="checkbox" id="vemiyOptUpper" checked> 大写 A-Z</label>
    <label class="vemiy-tool-check"><input type="checkbox" id="vemiyOptLower" checked> 小写 a-z</label>
    <label class="vemiy-tool-check"><input type="checkbox" id="vemiyOptNum" checked> 数字 0-9</label>
  </div>
  <div class="vemiy-tool-section vemiy-random-string-section vemiy-random-string-custom">
    <div class="vemiy-random-string-custom-item">
      <label class="vemiy-tool-check"><input type="checkbox" id="vemiyOptCustomSym" checked> 包含符号</label>
      <input type="text" class="vemiy-tool-input" id="vemiyCustomSymbols" value="!@#$%^&amp;*()-_=+">
    </div>
    <div class="vemiy-random-string-custom-item">
      <label class="vemiy-tool-check"><input type="checkbox" id="vemiyOptExclude"> 排除字符</label>
      <input type="text" class="vemiy-tool-input" id="vemiyExcludeChars" value="iIl1o0O">
    </div>
  </div>
  <div class="vemiy-tool-section vemiy-random-string-section vemiy-random-string-params">
    <div class="vemiy-random-string-param">
      <label for="vemiyStrLen">长度</label>
      <input type="number" class="vemiy-tool-input" id="vemiyStrLen" value="12" min="1" max="128">
    </div>
    <div class="vemiy-random-string-param">
      <label for="vemiyBatchCount">数量</label>
      <input type="number" class="vemiy-tool-input" id="vemiyBatchCount" value="10" min="1" max="200">
    </div>
    <div class="vemiy-random-string-actions">
      <button class="vemiy-tool-btn vemiy-tool-btn-secondary" id="vemiyResetBtn">重置设定</button>
      <button class="vemiy-tool-btn vemiy-tool-btn-primary" id="vemiyGenBtn">生成</button>
    </div>
  </div>
  <div class="vemiy-tool-section vemiy-random-string-section vemiy-random-string-output-wrap">
    <div class="vemiy-random-string-output-head">
      <div class="vemiy-random-string-output-title">生成结果（每行一个）</div>
      <div class="vemiy-tool-actions vemiy-random-string-output-actions">
        <button class="vemiy-tool-mini-btn" id="vemiyDownloadBtn">下载结果</button>
        <button class="vemiy-tool-mini-btn" id="vemiyCopyAllBtn">复制全部</button>
      </div>
    </div>
    <textarea class="vemiy-tool-input vemiy-random-string-output" id="vemiyBatchOutput" rows="12" readonly wrap="off" placeholder="点击「生成」按钮，结果将显示在此处..."></textarea>
  </div>
  <div class="vemiy-tool-foot">所有处理均在本地完成 - 数据不上传服务器</div>
</div>

<style>
  /* 随机字符串工具专属样式 */
  .vemiy-random-string-sub {
    margin-bottom: 1.5rem;
  }
  .vemiy-random-string-basic,
  .vemiy-random-string-custom {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 1.2rem;
  }
  .vemiy-random-string-custom-item {
    flex: 1;
    min-width: 240px;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .vemiy-random-string-custom-item .vemiy-tool-check {
    white-space: nowrap;
    flex-shrink: 0;
  }
  .vemiy-random-string-params {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  .vemiy-random-string-param {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    flex: 0 1 auto;
  }
  .vemiy-random-string-param label {
    font-weight: 500;
    white-space: nowrap;
  }
  .vemiy-random-string-param .vemiy-tool-input {
    width: 110px;
  }
  .vemiy-random-string-actions {
    display: flex;
    flex: 1 1 200px;
    gap: 0.8rem;
  }
  .vemiy-random-string-actions .vemiy-tool-btn {
    flex: 1;
  }
  .vemiy-random-string-actions .vemiy-tool-btn-primary {
    flex: 2;
  }
  .vemiy-random-string-output-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }
  .vemiy-random-string-output-title {
    font-size: 0.95rem;
    font-weight: 600;
    opacity: 0.9;
  }
  .vemiy-random-string-output {
    min-height: 320px;
    resize: vertical;
    white-space: pre;
    overflow-x: auto;
  }
  @media (max-width: 900px) {
    .vemiy-random-string-actions,
    .vemiy-random-string-output-head,
    .vemiy-random-string-output-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .vemiy-random-string-actions {
      flex-basis: auto;
    }
    .vemiy-random-string-param {
      flex-direction: column;
      align-items: stretch;
    }
    .vemiy-random-string-param .vemiy-tool-input {
      width: 100%;
    }
  }
</style>

<script>
  /* 随机字符串生成逻辑 */
  (() => {
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
  })();
</script>
