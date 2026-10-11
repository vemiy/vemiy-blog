---
title: 在线调音器
date: 2026-10-01 00:00:00
comments: false
---

<div class="vemiy-tool vemiy-tuner" id="vemiyTuner">
  <div class="vemiy-tool-head vemiy-tuner-head">
    <button class="vemiy-tool-btn vemiy-tuner-start" id="vemiyTunerStart">开启麦克风</button>
    <div class="vemiy-tool-sub vemiy-tuner-sub" id="vemiyTunerStatus">点击开启麦克风开始识别音高</div>
  </div>

  <div class="vemiy-tuner-dial" id="vemiyTunerDial">
    <div class="vemiy-tuner-note" id="vemiyTunerNote">--</div>
    <div class="vemiy-tuner-octave" id="vemiyTunerOctave"></div>
    <div class="vemiy-tuner-cents" id="vemiyTunerCents">--</div>
    <div class="vemiy-tuner-track">
      <div class="vemiy-tuner-center"></div>
      <div class="vemiy-tuner-needle" id="vemiyTunerNeedle"></div>
    </div>
    <div class="vemiy-tuner-scale">
      <span>-50</span><span>-25</span><span>0</span><span>+25</span><span>+50</span>
    </div>
    <div class="vemiy-tuner-freq" id="vemiyTunerFreq">-- Hz</div>
  </div>

  <div class="vemiy-tool-section">
    <h3 class="vemiy-tool-section-title">参考音</h3>
    <div class="vemiy-tuner-refs" id="vemiyTunerRefs"></div>
    <div class="vemiy-tool-row vemiy-tuner-refrow">
      <label class="vemiy-tool-range vemiy-tuner-a4">
        A4 基准
        <span id="vemiyTunerA4Val">440</span> Hz
        <input type="range" id="vemiyTunerA4" min="415" max="466" step="1" value="440">
      </label>
    </div>
  </div>

  <div class="vemiy-tool-foot vemiy-tuner-foot">所有处理均在本地完成 - 音频不上传服务器</div>
</div>

<style>
  /* 调音器专属样式 */
  .vemiy-tuner-start {
    flex-shrink: 0;
    background: #49b1f5;
    color: #fff;
  }
  .vemiy-tuner-start:hover {
    filter: brightness(0.88);
  }
  .vemiy-tuner-start.active {
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
  }
  .vemiy-tuner-dial {
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    background: rgba(30, 30, 30, 0.6);
    padding: 2rem 1.4rem 1.4rem;
    text-align: center;
    margin-bottom: 0.85rem;
  }
  .vemiy-tuner-note {
    font-size: 4.6rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.02em;
    transition: color 0.2s;
  }
  .vemiy-tuner-note.in-tune {
    color: #49d17a;
  }
  .vemiy-tuner-octave {
    font-size: 1.1rem;
    opacity: 0.6;
    margin-top: 0.2rem;
    min-height: 1.5rem;
  }
  .vemiy-tuner-cents {
    font-size: 1rem;
    font-weight: 600;
    margin-top: 0.5rem;
    min-height: 1.6rem;
    font-variant-numeric: tabular-nums;
  }
  .vemiy-tuner-track {
    position: relative;
    height: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    margin: 1.4rem auto 0.6rem;
    max-width: 460px;
  }
  .vemiy-tuner-center {
    position: absolute;
    left: 50%;
    top: -7px;
    width: 2px;
    height: 18px;
    background: rgba(255, 255, 255, 0.35);
    transform: translateX(-50%);
  }
  .vemiy-tuner-needle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #49b1f5;
    transform: translate(-50%, -50%);
    transition: left 0.1s linear, background 0.2s;
  }
  .vemiy-tuner-needle.in-tune {
    background: #49d17a;
  }
  .vemiy-tuner-scale {
    display: flex;
    justify-content: space-between;
    max-width: 460px;
    margin: 0 auto;
    font-size: 0.76rem;
    opacity: 0.5;
  }
  .vemiy-tuner-freq {
    margin-top: 1rem;
    font-size: 0.86rem;
    opacity: 0.65;
    font-variant-numeric: tabular-nums;
  }
  .vemiy-tuner-refs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .vemiy-tuner-ref {
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
    cursor: pointer;
    padding: 0.55rem 1.05rem;
    font-size: 0.86rem;
    font-weight: 600;
    transition: 0.2s;
  }
  .vemiy-tuner-ref:hover {
    background: rgba(255, 255, 255, 0.16);
  }
  .vemiy-tuner-ref.playing {
    background: #49b1f5;
    color: #fff;
  }
  .vemiy-tuner-refrow {
    margin-top: 0.9rem;
  }
  .vemiy-tuner-a4 {
    margin: 0;
    flex: 1;
    min-width: 220px;
  }
  @media (max-width: 640px) {
    .vemiy-tuner-note {
      font-size: 3.4rem;
    }
    .vemiy-tuner-dial {
      padding: 1.5rem 1rem 1.1rem;
    }
  }
</style>

<script>
  /* 音高检测与参考音发声 */
  (() => {
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
  })();
</script>
