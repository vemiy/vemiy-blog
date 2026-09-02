---
title: 图片颜色提取器
date: 2026-04-17 00:00:00
comments: false
---

<div class="vemiy-tool vemiy-image-color" id="vemiyImageColor">
  <div class="vemiy-tool-head vemiy-image-color-head">
    <button class="vemiy-tool-btn vemiy-image-color-btn" id="vemiyUploadBtn">选择图片</button>
    <div class="vemiy-tool-sub vemiy-image-color-sub">上传图片 - 点击图片任意位置取色 - 支持拖拽上传</div>
    <input type="file" id="vemiyFileInput" class="vemiy-tool-file-input" accept="image/jpeg,image/png,image/webp">
  </div>
  <div class="vemiy-image-color-preview" id="vemiyPreviewArea">
    <div class="vemiy-image-color-placeholder">
      <div class="vemiy-image-color-placeholder-inner">
        <div id="vemiyEmptyTip">拖拽图片至此区域</div>
        <img id="vemiyPreviewImage" class="vemiy-image-color-img" alt="" draggable="false">
      </div>
    </div>
  </div>
  <div class="vemiy-image-color-bottom">
    <div class="vemiy-tool-section vemiy-image-color-block">
      <div class="vemiy-image-color-preview-block" id="vemiyColorPreview"></div>
    </div>
    <div class="vemiy-tool-section vemiy-image-color-block">
      <div class="vemiy-image-color-value-row">
        <label>HEX</label>
        <code id="vemiyHexValue">——</code>
        <button class="vemiy-tool-mini-btn vemiy-image-color-mini-btn" id="vemiyCopyHexBtn">复制</button>
      </div>
    </div>
    <div class="vemiy-tool-section vemiy-image-color-block">
      <div class="vemiy-image-color-value-row">
        <label>RGB</label>
        <code id="vemiyRgbValue">——</code>
        <button class="vemiy-tool-mini-btn vemiy-image-color-mini-btn" id="vemiyCopyRgbBtn">复制</button>
      </div>
    </div>
  </div>
  <div class="vemiy-tool-foot vemiy-image-color-foot">所有处理均在本地完成 - 图片不上传服务器</div>
</div>

<style>
  /* 图片取色工具专属样式 */
  .vemiy-image-color-btn {
    flex-shrink: 0;
    background: #49b1f5;
    color: #fff;
  }
  .vemiy-image-color-btn:hover {
    filter: brightness(0.88);
  }
  .vemiy-image-color-preview {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    background: rgba(30, 30, 30, 0.6);
    min-height: 620px;
    padding: 0.8rem;
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: 0.85rem;
  }
  .vemiy-image-color-preview.drag-over {
    border-color: #49b1f5;
    background: rgba(73, 177, 245, 0.08);
  }
  .vemiy-image-color-placeholder {
    border-radius: 14px;
    min-height: 580px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.4rem 1rem;
    opacity: 0.68;
  }
  .vemiy-image-color-placeholder-inner {
    width: 100%;
  }
  .vemiy-image-color-img {
    display: none;
    max-width: 100%;
    max-height: 620px;
    width: auto;
    height: auto;
    border-radius: 14px;
    cursor: none;
    filter: none !important;
    margin: 0 auto;
    user-select: none;
    -webkit-user-drag: none;
  }
  .vemiy-image-color-bottom {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.75rem;
    align-items: stretch;
  }
  .vemiy-image-color-block {
    border-radius: 14px;
    padding: 0.55rem 0.65rem;
    margin-bottom: 0;
  }
  .vemiy-image-color-preview-block {
    width: 100%;
    height: 44px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.08);
  }
  .vemiy-image-color-value-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 44px;
  }
  .vemiy-image-color-value-row label {
    width: 38px;
    flex-shrink: 0;
    font-size: 0.86rem;
    font-weight: 600;
  }
  .vemiy-image-color-value-row code {
    flex: 1;
    min-width: 0;
    padding: 0.28rem 0.68rem;
    border-radius: 999px;
    font-family: Consolas, "SF Mono", monospace;
    font-size: 0.78rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.05);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vemiy-image-color-foot {
    margin-top: 0.8rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  @media (max-width: 980px) {
    .vemiy-image-color-preview {
      min-height: 420px;
    }
    .vemiy-image-color-placeholder {
      min-height: 380px;
    }
    .vemiy-image-color-img {
      max-height: 420px;
    }
    .vemiy-image-color-bottom {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 640px) {
    .vemiy-image-color-value-row {
      flex-wrap: wrap;
    }
  }
  /* 取色放大镜 */
  .vemiy-color-lens {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 9999;
    width: 176px;
    height: 176px;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    overflow: hidden;
    background: #141414;
    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.35);
    transform: translate(-50%, -50%);
    display: none;
    pointer-events: none;
  }
  .vemiy-color-lens.show {
    display: block;
  }
  .vemiy-color-lens canvas {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: pixelated;
  }
  .vemiy-color-lens-badge {
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(13, 13, 18, 0.85);
    color: #fff;
    font-family: Consolas, "SF Mono", monospace;
    font-size: 11px;
    line-height: 1.5;
    white-space: nowrap;
  }
</style>

<script>
  /* 图片取色逻辑 */
  (() => {
    const $ = id => document.getElementById(id);
    const els = {
      fileInput: $('vemiyFileInput'),
      uploadBtn: $('vemiyUploadBtn'),
      previewArea: $('vemiyPreviewArea'),
      previewImage: $('vemiyPreviewImage'),
      emptyTip: $('vemiyEmptyTip'),
      colorPreview: $('vemiyColorPreview'),
      hexValue: $('vemiyHexValue'),
      rgbValue: $('vemiyRgbValue'),
      copyHexBtn: $('vemiyCopyHexBtn'),
      copyRgbBtn: $('vemiyCopyRgbBtn')
    };
    let sourceCanvas = null;
    let sourceCtx = null;
    const timers = new WeakMap();
    const placeholder = document.querySelector('.vemiy-image-color-placeholder');

    function flashButton(button, text, isError = false) {
      if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
      clearTimeout(timers.get(button));
      button.textContent = text;
      button.style.backgroundColor = isError ? '#aa2e2e' : '#2a5f8a';
      button.style.color = '#fff';
      const t = setTimeout(() => {
        button.textContent = button.dataset.defaultText;
        button.style.backgroundColor = '';
        button.style.color = '';
        timers.delete(button);
      }, 1000);
      timers.set(button, t);
    }

    function setColor(r, g, b) {
      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      els.hexValue.textContent = hex;
      els.rgbValue.textContent = `rgb(${r},${g},${b})`;
      els.colorPreview.style.backgroundColor = hex;
    }

    function toSource(e) {
      const rect = els.previewImage.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const x = Math.max(0, Math.min(sourceCanvas.width - 1, Math.floor((e.clientX - rect.left) * sourceCanvas.width / rect.width)));
      const y = Math.max(0, Math.min(sourceCanvas.height - 1, Math.floor((e.clientY - rect.top) * sourceCanvas.height / rect.height)));
      return { x, y };
    }

    function pickColor(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!sourceCanvas || !sourceCtx || !els.previewImage.src) return;
      const pos = toSource(e);
      if (!pos) return;
      const pixel = sourceCtx.getImageData(pos.x, pos.y, 1, 1).data;
      setColor(pixel[0], pixel[1], pixel[2]);
    }

    /* 取色放大镜 */
    const LENS_CELLS = 11;
    const LENS_ZOOM = 16;
    const LENS_SIZE = LENS_CELLS * LENS_ZOOM;
    const oldLens = document.getElementById('vemiyColorLens');
    if (oldLens) oldLens.remove();
    const lens = document.createElement('div');
    lens.id = 'vemiyColorLens';
    lens.className = 'vemiy-color-lens';
    lens.setAttribute('aria-hidden', 'true');
    const lensCanvas = document.createElement('canvas');
    lensCanvas.id = 'vemiyLensCanvas';
    const lensBadge = document.createElement('div');
    lensBadge.id = 'vemiyLensBadge';
    lensBadge.className = 'vemiy-color-lens-badge';
    lensBadge.textContent = '——';
    lens.appendChild(lensCanvas);
    lens.appendChild(lensBadge);
    document.body.appendChild(lens);
    const dpr = window.devicePixelRatio || 1;
    lensCanvas.width = LENS_SIZE * dpr;
    lensCanvas.height = LENS_SIZE * dpr;
    const lensCtx = lensCanvas.getContext('2d');
    lensCtx.scale(dpr, dpr);
    lensCtx.imageSmoothingEnabled = false;

    function drawLens(e, pos) {
      const ctx = lensCtx;
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, LENS_SIZE, LENS_SIZE);
      const x0 = pos.x - Math.floor(LENS_CELLS / 2);
      const y0 = pos.y - Math.floor(LENS_CELLS / 2);
      ctx.drawImage(sourceCanvas, x0, y0, LENS_CELLS, LENS_CELLS, 0, 0, LENS_SIZE, LENS_SIZE);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      for (let i = 1; i < LENS_CELLS; i++) {
        const p = i * LENS_ZOOM + 0.5;
        ctx.moveTo(p, 0);
        ctx.lineTo(p, LENS_SIZE);
        ctx.moveTo(0, p);
        ctx.lineTo(LENS_SIZE, p);
      }
      ctx.stroke();
      const c = Math.floor(LENS_CELLS / 2) * LENS_ZOOM;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.strokeRect(c + 1.5, c + 1.5, LENS_ZOOM - 3, LENS_ZOOM - 3);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(c + 1.5, c + 1.5, LENS_ZOOM - 3, LENS_ZOOM - 3);
      const px = sourceCtx.getImageData(pos.x, pos.y, 1, 1).data;
      lensBadge.textContent = '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      const half = 90;
      lens.style.left = Math.min(Math.max(e.clientX, half), window.innerWidth - half) + 'px';
      lens.style.top = Math.min(Math.max(e.clientY, half), window.innerHeight - half) + 'px';
    }

    els.previewImage.addEventListener('mousemove', e => {
      if (!sourceCanvas || !sourceCtx || !els.previewImage.src) return;
      const pos = toSource(e);
      if (!pos) return;
      lens.classList.add('show');
      drawLens(e, pos);
    });
    els.previewImage.addEventListener('mouseleave', () => lens.classList.remove('show'));

    function showImage(src) {
      const img = new Image();
      img.onload = () => {
        sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = img.naturalWidth;
        sourceCanvas.height = img.naturalHeight;
        sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
        sourceCtx.drawImage(img, 0, 0);
        els.previewImage.src = src;
        els.previewImage.style.display = 'block';
        els.emptyTip.style.display = 'none';
        placeholder.style.opacity = '1';
        const first = sourceCtx.getImageData(0, 0, 1, 1).data;
        setColor(first[0], first[1], first[2]);
      };
      img.src = src;
    }

    function loadImage(file) {
      if (!file || !file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => showImage(e.target.result);
      reader.readAsDataURL(file);
    }

    function copyText(text, button) {
      if (!text || text === '——') {
        flashButton(button, '无颜色', true);
        return;
      }
      navigator.clipboard.writeText(text)
        .then(() => flashButton(button, '已复制'))
        .catch(() => flashButton(button, '失败', true));
    }

    els.uploadBtn.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) loadImage(file);
    });
    els.previewImage.addEventListener('mousedown', e => e.stopPropagation());
    els.previewImage.addEventListener('click', pickColor);
    els.previewImage.addEventListener('dragstart', e => e.preventDefault());
    ['dragenter', 'dragover'].forEach(name => {
      els.previewArea.addEventListener(name, e => {
        e.preventDefault();
        e.stopPropagation();
        els.previewArea.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(name => {
      els.previewArea.addEventListener(name, e => {
        e.preventDefault();
        e.stopPropagation();
        els.previewArea.classList.remove('drag-over');
      });
    });
    els.previewArea.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (!files || !files.length) return;
      const file = files[0];
      if (file.type.startsWith('image/')) {
        loadImage(file);
      } else {
        alert('请拖拽图片文件');
      }
    });
    els.copyHexBtn.addEventListener('click', () => copyText(els.hexValue.textContent, els.copyHexBtn));
    els.copyRgbBtn.addEventListener('click', () => copyText(els.rgbValue.textContent, els.copyRgbBtn));
    els.colorPreview.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
  })();
</script>
