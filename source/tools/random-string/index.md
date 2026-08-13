---
title: 随机字符串生成器
date: 2026-04-17 00:00:00
comments: false
---

<div class="vimy-random-string" id="vimyRandomString">
  <div class="vimy-random-string-sub">安全 token / 临时密码 / 一次性凭证</div>
  <div class="vimy-random-string-section vimy-random-string-basic">
    <label><input type="checkbox" id="vimyOptUpper" checked> 大写 A-Z</label>
    <label><input type="checkbox" id="vimyOptLower" checked> 小写 a-z</label>
    <label><input type="checkbox" id="vimyOptNum" checked> 数字 0-9</label>
  </div>
  <div class="vimy-random-string-section vimy-random-string-custom">
    <div class="vimy-random-string-custom-item">
      <label><input type="checkbox" id="vimyOptCustomSym" checked> 包含符号</label>
      <input type="text" id="vimyCustomSymbols" value="!@#$%^&amp;*()-_=+">
    </div>
    <div class="vimy-random-string-custom-item">
      <label><input type="checkbox" id="vimyOptExclude"> 排除字符</label>
      <input type="text" id="vimyExcludeChars" value="iIl1o0O">
    </div>
  </div>
  <div class="vimy-random-string-section vimy-random-string-params">
    <div class="vimy-random-string-param">
      <label for="vimyStrLen">长度</label>
      <input type="number" id="vimyStrLen" value="12" min="1" max="128">
    </div>
    <div class="vimy-random-string-param">
      <label for="vimyBatchCount">数量</label>
      <input type="number" id="vimyBatchCount" value="10" min="1" max="200">
    </div>
    <div class="vimy-random-string-actions">
      <button class="vimy-random-string-btn vimy-random-string-btn-secondary" id="vimyResetBtn">重置设定</button>
      <button class="vimy-random-string-btn vimy-random-string-btn-primary" id="vimyGenBtn">生成</button>
    </div>
  </div>
  <div class="vimy-random-string-output-wrap">
    <div class="vimy-random-string-output-head">
      <div class="vimy-random-string-output-title">生成结果（每行一个）</div>
      <div class="vimy-random-string-output-actions">
        <button class="vimy-random-string-mini-btn" id="vimyDownloadBtn">下载结果</button>
        <button class="vimy-random-string-mini-btn" id="vimyCopyAllBtn">复制全部</button>
      </div>
    </div>
    <textarea class="vimy-random-string-output" id="vimyBatchOutput" rows="12" readonly wrap="off" placeholder="点击「生成」按钮，结果将显示在此处..."></textarea>
  </div>
  <div class="vimy-random-string-foot">所有处理均在本地完成 - 数据不上传服务器</div>
</div>

<style>
  /* 随机字符串工具样式（适配暗色玻璃主题） */
  .vimy-random-string {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0.5rem 0 1rem;
  }
  .vimy-random-string * {
    box-sizing: border-box;
  }
  .vimy-random-string-sub {
    font-size: 0.95rem;
    line-height: 1.8;
    opacity: 0.75;
    margin-bottom: 1.5rem;
  }
  .vimy-random-string-section {
    margin-bottom: 1rem;
  }
  .vimy-random-string-basic,
  .vimy-random-string-custom,
  .vimy-random-string-params,
  .vimy-random-string-output-wrap {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1rem;
    background: rgba(30, 30, 30, 0.6);
  }
  .vimy-random-string-basic,
  .vimy-random-string-custom {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 1.2rem;
  }
  .vimy-random-string label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.92rem;
    cursor: pointer;
    user-select: none;
  }
  .vimy-random-string input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #49b1f5;
    flex-shrink: 0;
    cursor: pointer;
  }
  .vimy-random-string-custom-item {
    flex: 1;
    min-width: 240px;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .vimy-random-string-custom-item label {
    white-space: nowrap;
    flex-shrink: 0;
  }
  .vimy-random-string input[type="text"],
  .vimy-random-string input[type="number"],
  .vimy-random-string textarea {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    color: inherit;
    outline: none;
    transition: 0.2s;
    font-family: Consolas, Monaco, "Courier New", monospace;
  }
  .vimy-random-string input[type="text"]:focus,
  .vimy-random-string input[type="number"]:focus,
  .vimy-random-string textarea:focus {
    border-color: #49b1f5;
    box-shadow: 0 0 0 3px rgba(73, 177, 245, 0.12);
  }
  .vimy-random-string input[type="text"] {
    padding: 0.58rem 0.8rem;
    font-size: 0.85rem;
  }
  .vimy-random-string-params {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  .vimy-random-string-param {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    flex: 1 1 140px;
  }
  .vimy-random-string-param label {
    font-weight: 500;
    white-space: nowrap;
  }
  .vimy-random-string-param input {
    width: 100%;
    padding: 0.58rem 0.7rem;
    text-align: center;
    font-weight: 500;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .vimy-random-string-param input::-webkit-inner-spin-button,
  .vimy-random-string-param input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .vimy-random-string-actions {
    display: flex;
    flex: 1 1 200px;
    gap: 0.8rem;
  }
  .vimy-random-string-btn {
    flex: 1;
    border: none;
    border-radius: 999px;
    padding: 0.82rem 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: 0.2s;
    white-space: nowrap;
  }
  .vimy-random-string-btn-primary {
    flex: 1;
    background: #49b1f5;
    color: #fff;
  }
  .vimy-random-string-btn-primary:hover {
    filter: brightness(0.88);
  }
  .vimy-random-string-btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
  }
  .vimy-random-string-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.16);
  }
  .vimy-random-string-output-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }
  .vimy-random-string-output-title {
    font-size: 0.95rem;
    font-weight: 600;
    opacity: 0.9;
  }
  .vimy-random-string-output-actions {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
  }
  .vimy-random-string-mini-btn {
    border: none;
    border-radius: 999px;
    padding: 0.45rem 1rem;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: 0.2s;
    min-width: 112px;
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
  }
  .vimy-random-string-mini-btn:hover {
    background: rgba(255, 255, 255, 0.16);
  }
  .vimy-random-string-output {
    min-height: 320px;
    resize: vertical;
    padding: 1rem;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 0.88rem;
    line-height: 1.45;
    white-space: pre;
    overflow-x: auto;
  }
  .vimy-random-string-foot {
    margin-top: 0.85rem;
    font-size: 0.82rem;
    opacity: 0.62;
    text-align: center;
  }
  @media (max-width: 900px) {
    .vimy-random-string-actions,
    .vimy-random-string-output-head,
    .vimy-random-string-output-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .vimy-random-string-actions {
      flex-basis: auto;
    }
    .vimy-random-string-btn,
    .vimy-random-string-mini-btn {
      width: 100%;
    }
    .vimy-random-string-param {
      flex-direction: column;
      align-items: stretch;
    }
    .vimy-random-string-param input {
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
      out: $('vimyBatchOutput'), len: $('vimyStrLen'), cnt: $('vimyBatchCount'),
      up: $('vimyOptUpper'), low: $('vimyOptLower'), num: $('vimyOptNum'),
      cus: $('vimyOptCustomSym'), sym: $('vimyCustomSymbols'),
      exc: $('vimyOptExclude'), excChars: $('vimyExcludeChars'),
      gen: $('vimyGenBtn'), rst: $('vimyResetBtn'), dl: $('vimyDownloadBtn'), cp: $('vimyCopyAllBtn')
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
