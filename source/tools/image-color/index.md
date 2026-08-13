---
title: 图片颜色提取器
date: 2026-04-17 00:00:00
comments: false
---

<div class="vimy-image-color" id="vimyImageColor">
  <div class="vimy-image-color-head">
    <button class="vimy-image-color-btn" id="vimyUploadBtn">选择图片</button>
    <div class="vimy-image-color-sub">上传图片 - 点击图片任意位置取色 - 支持拖拽上传</div>
    <input type="file" id="vimyFileInput" class="vimy-image-color-file-input" accept="image/jpeg,image/png,image/webp">
  </div>
  <div class="vimy-image-color-preview" id="vimyPreviewArea">
    <div class="vimy-image-color-placeholder">
      <div class="vimy-image-color-placeholder-inner">
        <div id="vimyEmptyTip">拖拽图片至此区域</div>
        <img id="vimyPreviewImage" class="vimy-image-color-img" alt="" draggable="false">
      </div>
    </div>
  </div>
  <div class="vimy-image-color-bottom">
    <div class="vimy-image-color-block">
      <div class="vimy-image-color-preview-block" id="vimyColorPreview"></div>
    </div>
    <div class="vimy-image-color-block">
      <div class="vimy-image-color-value-row">
        <label>HEX</label>
        <code id="vimyHexValue">——</code>
        <button class="vimy-image-color-mini-btn" id="vimyCopyHexBtn">复制</button>
      </div>
    </div>
    <div class="vimy-image-color-block">
      <div class="vimy-image-color-value-row">
        <label>RGB</label>
        <code id="vimyRgbValue">——</code>
        <button class="vimy-image-color-mini-btn" id="vimyCopyRgbBtn">复制</button>
      </div>
    </div>
  </div>
  <div class="vimy-image-color-foot">所有处理均在本地完成 - 图片不上传服务器</div>
</div>

<style>
  /* 图片取色工具样式（适配暗色玻璃主题） */
  .vimy-image-color {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0.5rem 0 1rem;
  }
  .vimy-image-color * {
    box-sizing: border-box;
  }
  .vimy-image-color-head {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .vimy-image-color-sub {
    font-size: 0.95rem;
    line-height: 1.8;
    opacity: 0.75;
  }
  .vimy-image-color-btn,
  .vimy-image-color-mini-btn {
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: 0.2s;
    color: inherit;
  }
  .vimy-image-color-btn {
    padding: 0.78rem 1.25rem;
    font-size: 0.95rem;
    font-weight: 600;
    background: #49b1f5;
    color: #fff;
    flex-shrink: 0;
  }
  .vimy-image-color-btn:hover {
    filter: brightness(0.88);
  }
  .vimy-image-color-mini-btn {
    min-width: 64px;
    height: 24px;
    padding: 0 0.72rem;
    font-size: 0.72rem;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.1);
  }
  .vimy-image-color-mini-btn:hover {
    background: rgba(255, 255, 255, 0.16);
  }
  .vimy-image-color-file-input {
    display: none;
  }
  .vimy-image-color-preview {
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
  .vimy-image-color-preview.drag-over {
    border-color: #49b1f5;
    background: rgba(73, 177, 245, 0.08);
  }
  .vimy-image-color-placeholder {
    border-radius: 14px;
    min-height: 580px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.4rem 1rem;
    opacity: 0.68;
  }
  .vimy-image-color-placeholder-inner {
    width: 100%;
  }
  .vimy-image-color-drag-tip {
    font-size: 0.78rem;
    margin-top: 0.45rem;
    opacity: 0.72;
  }
  .vimy-image-color-img {
    display: none;
    max-width: 100%;
    max-height: 620px;
    width: auto;
    height: auto;
    border-radius: 14px;
    cursor: crosshair;
    margin: 0 auto;
    user-select: none;
    -webkit-user-drag: none;
  }
  .vimy-image-color-bottom {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.75rem;
    align-items: stretch;
  }
  .vimy-image-color-block {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    background: rgba(30, 30, 30, 0.6);
    padding: 0.55rem 0.65rem;
  }
  .vimy-image-color-preview-block {
    width: 100%;
    height: 44px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.08);
  }
  .vimy-image-color-value-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 44px;
  }
  .vimy-image-color-value-row label {
    width: 38px;
    flex-shrink: 0;
    font-size: 0.86rem;
    font-weight: 600;
  }
  .vimy-image-color-value-row code {
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
  .vimy-image-color-foot {
    font-size: 0.76rem;
    opacity: 0.62;
    text-align: center;
    margin-top: 0.8rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  @media (max-width: 980px) {
    .vimy-image-color-preview {
      min-height: 420px;
    }
    .vimy-image-color-placeholder {
      min-height: 380px;
    }
    .vimy-image-color-img {
      max-height: 420px;
    }
    .vimy-image-color-bottom {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 640px) {
    .vimy-image-color-head {
      align-items: stretch;
    }
    .vimy-image-color-btn,
    .vimy-image-color-mini-btn {
      width: 100%;
    }
    .vimy-image-color-value-row {
      flex-wrap: wrap;
    }
  }
</style>

<script>
  /* 图片取色逻辑 */
  (() => {
    const $ = id => document.getElementById(id);
    const els = {
      fileInput: $('vimyFileInput'),
      uploadBtn: $('vimyUploadBtn'),
      previewArea: $('vimyPreviewArea'),
      previewImage: $('vimyPreviewImage'),
      emptyTip: $('vimyEmptyTip'),
      colorPreview: $('vimyColorPreview'),
      hexValue: $('vimyHexValue'),
      rgbValue: $('vimyRgbValue'),
      copyHexBtn: $('vimyCopyHexBtn'),
      copyRgbBtn: $('vimyCopyRgbBtn')
    };
    let sourceCanvas = null;
    let sourceCtx = null;
    const timers = new WeakMap();

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

    function pickColor(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!sourceCanvas || !sourceCtx || !els.previewImage.src) return;
      const rect = els.previewImage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(sourceCanvas.width - 1, Math.round((e.clientX - rect.left) * sourceCanvas.width / rect.width)));
      const y = Math.max(0, Math.min(sourceCanvas.height - 1, Math.round((e.clientY - rect.top) * sourceCanvas.height / rect.height)));
      const pixel = sourceCtx.getImageData(x, y, 1, 1).data;
      setColor(pixel[0], pixel[1], pixel[2]);
    }

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
