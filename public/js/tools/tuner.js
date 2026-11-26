(function () {
  // 在线调音器：麦克风音高识别、音分偏差显示与参考音发声
  // 上一实例的停止函数挂在 window 上，脚本重复执行时可先停机再重建
  const toolState = window.__vemiyTuner || (window.__vemiyTuner = { stop: null });

  function initTuner() {
    const root = document.getElementById("vemiyTuner");
    if (!root) return;
    if (root.dataset.toolInit === "true") return;
    if (toolState.stop) toolState.stop();
    toolState.stop = null;
    root.dataset.toolInit = "true";

    const $ = id => document.getElementById(id);
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const MIN_FREQ = 50;
    const MAX_FREQ = 2000;
    const IN_TUNE_CENTS = 5;
    const REF_DURATION = 1.2;

    const els = {
      start: $('vemiyTunerStart'),
      status: $('vemiyTunerStatus'),
      note: $('vemiyTunerNote'),
      octave: $('vemiyTunerOctave'),
      cents: $('vemiyTunerCents'),
      needle: $('vemiyTunerNeedle'),
      freq: $('vemiyTunerFreq'),
      refs: $('vemiyTunerRefs'),
      a4: $('vemiyTunerA4'),
      a4Val: $('vemiyTunerA4Val')
    };

    const state = {
      running: false,
      stream: null,
      audioCtx: null,
      analyser: null,
      buf: null,
      raf: 0,
      a4: 440,
      refCtx: null,
      refOsc: null,
      refGain: null,
      refNote: null,
      refTimer: 0
    };

    /* 参考音基准频率 */
    function noteFreq(midi, a4) {
      return a4 * Math.pow(2, (midi - 69) / 12);
    }

    /* YIN 算法求基频 */
    function detectPitch(buf, sampleRate) {
      const size = buf.length;

      let rms = 0;
      for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / size);
      if (rms < 0.008) return -1;

      const maxLag = Math.min(size - 1, Math.floor(sampleRate / MIN_FREQ));
      const minLag = Math.max(2, Math.floor(sampleRate / MAX_FREQ));
      const W = size - maxLag;
      if (W < maxLag) return -1;

      /* 差分函数 */
      const d = new Float32Array(maxLag + 1);
      for (let tau = 1; tau <= maxLag; tau++) {
        let sum = 0;
        for (let j = 0; j < W; j++) {
          const diff = buf[j] - buf[j + tau];
          sum += diff * diff;
        }
        d[tau] = sum;
      }

      /* 累计均值归一化差分 */
      const cmnd = new Float32Array(maxLag + 1);
      cmnd[0] = 1;
      let running = 0;
      for (let tau = 1; tau <= maxLag; tau++) {
        running += d[tau];
        cmnd[tau] = running > 0 ? (d[tau] * tau) / running : 1;
      }

      /* 取首个低于阈值的局部极小 */
      const THRESHOLD = 0.15;
      let tauEst = -1;
      for (let tau = minLag; tau < maxLag; tau++) {
        if (cmnd[tau] < THRESHOLD) {
          while (tau + 1 < maxLag && cmnd[tau + 1] < cmnd[tau]) tau++;
          tauEst = tau;
          break;
        }
      }

      if (tauEst === -1) {
        let minVal = Infinity;
        for (let tau = minLag; tau <= maxLag; tau++) {
          if (cmnd[tau] < minVal) { minVal = cmnd[tau]; tauEst = tau; }
        }
        if (minVal > 0.25) return -1;
      }

      /* 抛物线插值提高频率分辨率 */
      const x0 = cmnd[tauEst - 1];
      const x1 = cmnd[tauEst];
      const x2 = cmnd[tauEst + 1];
      const a = (x0 + x2 - 2 * x1) / 2;
      const b = (x2 - x0) / 2;
      let t0 = tauEst;
      if (a > 0) {
        const shift = -b / (2 * a);
        if (shift > -1 && shift < 1) t0 = tauEst + shift;
      }

      const freq = sampleRate / t0;
      if (freq < MIN_FREQ || freq > MAX_FREQ) return -1;

      return freq;
    }

    function freqToNote(freq, a4) {
      const midiF = 69 + 12 * Math.log2(freq / a4);
      const midi = Math.round(midiF);
      const cents = Math.round((midiF - midi) * 100);
      return {
        name: NOTE_NAMES[((midi % 12) + 12) % 12],
        octave: Math.floor(midi / 12) - 1,
        cents,
        midi
      };
    }

    function updatePitch(freq) {
      if (freq < 0) return;
      const info = freqToNote(freq, state.a4);
      const inTune = Math.abs(info.cents) <= IN_TUNE_CENTS;
      els.note.textContent = info.name;
      els.note.classList.toggle('in-tune', inTune);
      els.octave.textContent = '第 ' + info.octave + ' 八度';
      els.cents.textContent = (info.cents > 0 ? '+' : '') + info.cents + ' 音分';
      els.freq.textContent = freq.toFixed(1) + ' Hz';
      const pct = Math.max(-50, Math.min(50, info.cents)) / 50;
      els.needle.style.left = (50 + pct * 48) + '%';
      els.needle.classList.toggle('in-tune', inTune);
    }

    function resetDisplay() {
      els.note.textContent = '--';
      els.note.classList.remove('in-tune');
      els.octave.textContent = '';
      els.cents.textContent = '--';
      els.freq.textContent = '-- Hz';
      els.needle.style.left = '50%';
      els.needle.classList.remove('in-tune');
    }

    function loop() {
      if (!state.running) return;
      state.analyser.getFloatTimeDomainData(state.buf);
      updatePitch(detectPitch(state.buf, state.audioCtx.sampleRate));
      state.raf = requestAnimationFrame(loop);
    }

    async function start() {
      try {
        state.stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
      } catch (err) {
        els.status.textContent = '无法访问麦克风，请检查浏览器权限设置';
        return;
      }
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = state.audioCtx.createMediaStreamSource(state.stream);
      state.analyser = state.audioCtx.createAnalyser();
      state.analyser.fftSize = 2048;
      state.buf = new Float32Array(state.analyser.fftSize);
      source.connect(state.analyser);
      state.running = true;
      els.start.textContent = '停止识别';
      els.start.classList.add('active');
      els.status.textContent = '正在识别，请弹奏一个音';
      loop();
    }

    function stop() {
      state.running = false;
      cancelAnimationFrame(state.raf);
      if (state.stream) {
        state.stream.getTracks().forEach(t => t.stop());
        state.stream = null;
      }
      if (state.audioCtx) {
        state.audioCtx.close();
        state.audioCtx = null;
      }
      els.start.textContent = '开启麦克风';
      els.start.classList.remove('active');
      els.status.textContent = '点击开启麦克风开始识别音高';
      resetDisplay();
    }

    function stopRef() {
      clearTimeout(state.refTimer);
      state.refTimer = 0;
      if (state.refOsc) {
        try {
          state.refOsc.stop();
        } catch (e) {
          /* 已停止 */
        }
        state.refOsc.disconnect();
        state.refOsc = null;
      }
      if (state.refCtx) {
        state.refCtx.close();
        state.refCtx = null;
      }
      const prev = els.refs.querySelector('.playing');
      if (prev) prev.classList.remove('playing');
      state.refNote = null;
    }

    function playRef(note, octave, btn) {
      stopRef();
      state.refCtx = new (window.AudioContext || window.webkitAudioContext)();
      const midi = (octave + 1) * 12 + NOTE_NAMES.indexOf(note);
      const osc = state.refCtx.createOscillator();
      const gain = state.refCtx.createGain();
      const now = state.refCtx.currentTime;
      osc.type = 'sine';
      osc.frequency.value = noteFreq(midi, state.a4);
      /* 起音与收尾淡入淡出 */
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.setValueAtTime(0.18, now + REF_DURATION - 0.08);
      gain.gain.linearRampToValueAtTime(0, now + REF_DURATION);
      osc.connect(gain).connect(state.refCtx.destination);
      osc.start();
      osc.stop(now + REF_DURATION);
      state.refOsc = osc;
      state.refGain = gain;
      state.refNote = note;
      btn.classList.add('playing');
      state.refTimer = setTimeout(stopRef, REF_DURATION * 1000);
    }

    function buildRefs() {
      const list = [3, 4, 5];
      list.forEach(octave => {
        NOTE_NAMES.forEach(note => {
          const btn = document.createElement('button');
          btn.className = 'vemiy-tuner-ref';
          btn.textContent = note + octave;
          btn.addEventListener('click', () => playRef(note, octave, btn));
          els.refs.appendChild(btn);
        });
      });
    }

    els.start.addEventListener('click', () => {
      if (state.running) stop();
      else start();
    });
    els.a4.addEventListener('input', () => {
      state.a4 = parseInt(els.a4.value, 10);
      els.a4Val.textContent = state.a4;
    });

    buildRefs();

    toolState.stop = stop;
  }

  // 首屏加载与客户端路由切换后均执行初始化，函数内部保证幂等
  if (!window.__vemiyTunerBound) {
    window.__vemiyTunerBound = true;
    document.addEventListener("DOMContentLoaded", initTuner);
    document.addEventListener("astro:page-load", initTuner);
    document.addEventListener("pjax:complete", initTuner);
  }
  initTuner();
})();
