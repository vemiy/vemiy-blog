(function () {
  // 图片取色：读取本地图片像素，点击任意位置提取 HEX 与 RGB 值
  function initImageColor() {
    const root = document.getElementById("vemiyImageColor");
    if (!root) return;
    if (root.dataset.toolInit === "true") return;
    root.dataset.toolInit = "true";

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
  }

  // 首屏加载与客户端路由切换后均执行初始化，函数内部保证幂等
  if (!window.__vemiyImageColorBound) {
    window.__vemiyImageColorBound = true;
    document.addEventListener("DOMContentLoaded", initImageColor);
    document.addEventListener("astro:page-load", initImageColor);
    document.addEventListener("pjax:complete", initImageColor);
  }
  initImageColor();
})();
