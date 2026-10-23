(function () {
  'use strict';

  var VemiyTools = {};

  function initToolsSearch() {
    const page = document.querySelector('.vemiy-tools-page');
    if (!page || page.dataset.searchBound === 'true') return;

    const input = page.querySelector('#vemiyToolsSearch');
    const list = page.querySelector('#vemiyToolsList');
    const empty = page.querySelector('#vemiyToolsEmpty');
    const items = Array.from(list.querySelectorAll('.vemiy-tools-item'));

    input.addEventListener('input', function () {
      const keyword = input.value.trim().toLowerCase();
      let visible = 0;

      items.forEach(item => {
        const matched = !keyword || item.textContent.toLowerCase().includes(keyword);
        item.style.display = matched ? 'flex' : 'none';
        if (matched) visible++;
      });

      empty.style.display = visible ? 'none' : 'block';
    });

    page.dataset.searchBound = 'true';
  }

  initToolsSearch();

  VemiyTools.initToolsSearch = initToolsSearch;

  var MIN_BPM = 40;
  var MAX_BPM = 208;
  var PIVOT_X = 170;
  var PIVOT_Y = 528;
  var SCALE_SLOW_Y = 140;
  var SCALE_FAST_Y = 460;
  var AMP_DEG = 5.2;
  var WHEEL_WIDTH = 42;
  var MARK_EXPONENT = 0.705;
  var LOOKAHEAD = 0.15;
  var TICKER_MS = 25;

  var CLICK_FREQ_NORMAL = 900;
  var CLICK_FREQ_ACCENT = 1050;
  var CLICK_GAIN_NORMAL = 0.82;
  var CLICK_GAIN_ACCENT = 1;
  var CLICK_ATTACK = 0.003;
  var CLICK_HOLD = 0.012;
  var CLICK_DECAY = 0.048;
  var CLICK_DURATION = 0.052;

  var BELL_FREQ = 1800;
  var BELL_GAIN = 0.65;
  var BELL_ATTACK = 0.004;
  var BELL_HOLD = 0.01;
  var BELL_DECAY = 0.15;
  var BELL_DURATION = 0.17;

  var MARKS = [
    40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 76, 80,
    84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 126, 132, 138, 144, 152,
    160, 168, 176, 184, 192, 200, 208
  ];

  var MASTER_VOLUME = 0.95;
  var engine = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function buildMarkPositions() {
    var weights = [];
    var total = 0;
    var index;
    var mid;

    for (index = 0; index < MARKS.length - 1; index++) {
      mid = (MARKS[index] + MARKS[index + 1]) / 2;
      weights.push(Math.pow(mid, MARK_EXPONENT));
      total += weights[weights.length - 1];
    }

    var span = SCALE_FAST_Y - SCALE_SLOW_Y;
    var positions = [SCALE_SLOW_Y];
    var acc = 0;

    for (index = 0; index < weights.length; index++) {
      acc += weights[index];
      positions.push(SCALE_SLOW_Y + acc / total * span);
    }

    return positions;
  }

  var MARK_POSITIONS = buildMarkPositions();

  function tempoToY(bpm) {
    var value = clamp(bpm, MIN_BPM, MAX_BPM);
    var index = 0;

    while (index < MARKS.length - 2 && value > MARKS[index + 1]) {
      index++;
    }

    var low = MARKS[index];
    var high = MARKS[index + 1];
    var ratio = (value - low) / (high - low);

    return MARK_POSITIONS[index] + ratio * (MARK_POSITIONS[index + 1] - MARK_POSITIONS[index]);
  }

  function yToTempo(y) {
    var value = clamp(y, SCALE_SLOW_Y, SCALE_FAST_Y);
    var index = 0;

    while (index < MARK_POSITIONS.length - 2 && value > MARK_POSITIONS[index + 1]) {
      index++;
    }

    var low = MARK_POSITIONS[index];
    var high = MARK_POSITIONS[index + 1];
    var ratio = high === low ? 0 : (value - low) / (high - low);

    return Math.round(MARKS[index] + ratio * (MARKS[index + 1] - MARKS[index]));
  }

  function tempoNameOf(value) {
    if (value < 60) return 'Largo';
    if (value < 66) return 'Larghetto';
    if (value < 76) return 'Adagio';
    if (value < 108) return 'Andante';
    if (value <= 120) return 'Moderato';
    if (value < 156) return 'Allegro';
    if (value < 176) return 'Vivace';
    return 'Presto';
  }

  function createEngine(root) {
    var svg = root.querySelector('#vemiyMetroSvg');
    var pendulum = root.querySelector('#vemiyMetroPendulum');
    var weight = root.querySelector('#vemiyMetroWeight');
    var grip = root.querySelector('#vemiyMetroGrip');
    var lamp = root.querySelector('#vemiyMetroLamp');
    var lampDot = root.querySelector('#vemiyMetroLampDot');
    var weightTop = root.querySelector('#vemiyMetroWeightTop');
    var bpmText = root.querySelector('#vemiyMetroBpm');
    var tempoName = root.querySelector('#vemiyMetroName');
    var startBtn = root.querySelector('#vemiyMetroStart');
    var bellInput = root.querySelector('#vemiyMetroBell');
    var bellValue = root.querySelector('#vemiyMetroBellValue');

    var ctx = null;
    var master = null;
    var bpm = 120;
    var bellBeats = 0;
    var playing = false;

    var ticker = 0;
    var rafId = 0;
    var nextBeatTime = 0;
    var beatIndex = 0;
    var perfAnchor = 0;

    var dragging = false;
    var dragId = null;

    var BELL_STEPS = [0, 2, 3, 4, 6];

    function beatInterval() {
      return 60 / bpm;
    }

    function ensureContext() {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return false;
      if (!ctx) {
        ctx = new Ctor();
        master = ctx.createGain();
        master.gain.value = MASTER_VOLUME;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      return true;
    }

    function click(at, accent) {
      if (!ctx || !master) return;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(accent ? CLICK_FREQ_ACCENT : CLICK_FREQ_NORMAL, at);

      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(accent ? CLICK_GAIN_ACCENT : CLICK_GAIN_NORMAL, at + CLICK_ATTACK);
      gain.gain.setValueAtTime(accent ? CLICK_GAIN_ACCENT : CLICK_GAIN_NORMAL, at + CLICK_HOLD);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + CLICK_DECAY);

      osc.connect(gain);
      gain.connect(master);
      osc.start(at);
      osc.stop(at + CLICK_DURATION);
    }

    function bell(at) {
      if (!ctx || !master) return;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(BELL_FREQ, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(BELL_GAIN, at + BELL_ATTACK);
      gain.gain.setValueAtTime(BELL_GAIN, at + BELL_HOLD);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + BELL_DECAY);
      osc.connect(gain);
      gain.connect(master);
      osc.start(at);
      osc.stop(at + BELL_DURATION);
    }

    function scheduler() {
      if (!ctx || !playing) return;
      while (nextBeatTime < ctx.currentTime + LOOKAHEAD) {
        var accent = bellBeats > 0 && beatIndex % bellBeats === 0;
        click(nextBeatTime, accent);
        if (accent) bell(nextBeatTime);
        nextBeatTime += beatInterval();
        beatIndex++;
      }
    }

    function phaseAt(seconds) {
      return (seconds - perfAnchor) / beatInterval();
    }

    function angleAt(seconds) {
      return AMP_DEG * Math.cos(Math.PI * phaseAt(seconds));
    }

    function renderPendulum() {
      var seconds = performance.now() / 1000;
      var angle = playing ? angleAt(seconds) : 0;
      pendulum.setAttribute('transform', 'rotate(' + (-angle).toFixed(3) + ' ' + PIVOT_X + ' ' + PIVOT_Y + ')');

      var on = false;
      if (playing) {
        var phase = phaseAt(seconds);
        on = phase - Math.floor(phase) < 0.12;
      }
      if (lamp) lamp.classList.toggle('is-on', on);
      if (lampDot) lampDot.setAttribute('fill', on ? '#49b1f5' : '#3a3a3e');
    }

    function animate() {
      renderPendulum();
      rafId = window.requestAnimationFrame(animate);
    }

    function paintTempo() {
      bpmText.textContent = String(bpm);
      tempoName.textContent = tempoNameOf(bpm);
      var y = tempoToY(bpm);
      weight.setAttribute('y', (y - 15).toFixed(2));
      if (weightTop) weightTop.setAttribute('y', (y - 15).toFixed(2));
      grip.setAttribute('cy', y.toFixed(2));
    }

    function setTempo(value, fromDrag) {
      var next = clamp(Math.round(value), MIN_BPM, MAX_BPM);

      if (next !== bpm) {
        if (playing && ctx) {
          var nowPerf = performance.now() / 1000;
          var oldInterval = beatInterval();
          var phase = (nowPerf - perfAnchor) / oldInterval;
          var fraction = phase - Math.floor(phase);
          var remaining = nextBeatTime - ctx.currentTime;

          bpm = next;
          var interval = beatInterval();
          perfAnchor = nowPerf - fraction * interval;
          nextBeatTime = ctx.currentTime + Math.max(0.02, remaining * (interval / oldInterval));
        } else {
          bpm = next;
        }
        paintTempo();
      } else if (!fromDrag) {
        paintTempo();
      }
    }

    function start() {
      if (!ensureContext()) return;
      playing = true;
      beatIndex = 0;

      var lead = 0.08;
      perfAnchor = performance.now() / 1000 + lead;
      nextBeatTime = ctx.currentTime + lead;

      scheduler();
      ticker = window.setInterval(scheduler, TICKER_MS);
      animate();

      startBtn.textContent = '停止';
      startBtn.classList.add('is-playing');
    }

    function stop() {
      playing = false;
      window.clearInterval(ticker);
      window.cancelAnimationFrame(rafId);
      ticker = 0;
      rafId = 0;
      renderPendulum();
      startBtn.textContent = '开始';
      startBtn.classList.remove('is-playing');
    }

    function togglePlay() {
      if (playing) {
        stop();
      } else {
        start();
      }
    }

    function toSvgPoint(evt) {
      var pt = svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      var ctm = svg.getScreenCTM();
      return ctm ? pt.matrixTransform(ctm.inverse()) : pt;
    }

    function toLocal(point) {
      if (!playing) return point;
      var rad = -angleAt(performance.now() / 1000) * Math.PI / 180;
      var sin = Math.sin(rad);
      var cos = Math.cos(rad);
      var dx = point.x - PIVOT_X;
      var dy = point.y - PIVOT_Y;
      return {
        x: PIVOT_X + dx * cos + dy * sin,
        y: PIVOT_Y - dx * sin + dy * cos
      };
    }

    function onPointerDown(evt) {
      var mark = evt.target.closest('.vemiy-metronome-mark');
      if (mark) {
        setTempo(Number(mark.getAttribute('data-bpm')));
        return;
      }

      var local = toLocal(toSvgPoint(evt));
      if (Math.abs(local.x - PIVOT_X) > 34) return;

      dragging = true;
      dragId = evt.pointerId;
      svg.setPointerCapture(evt.pointerId);
      setTempo(yToTempo(local.y), true);
    }

    function onPointerMove(evt) {
      if (!dragging || evt.pointerId !== dragId) return;
      setTempo(yToTempo(toLocal(toSvgPoint(evt)).y), true);
    }

    function onPointerUp(evt) {
      if (!dragging || evt.pointerId !== dragId) return;
      dragging = false;
      if (svg.hasPointerCapture(evt.pointerId)) {
        svg.releasePointerCapture(evt.pointerId);
      }
      dragId = null;
    }

    function onWheel(evt) {
      var local = toLocal(toSvgPoint(evt));
      if (local.x < PIVOT_X - WHEEL_WIDTH || local.x > PIVOT_X + WHEEL_WIDTH) return;
      if (local.y < SCALE_SLOW_Y || local.y > PIVOT_Y) return;

      evt.preventDefault();
      setTempo(bpm + (evt.deltaY < 0 ? 1 : -1));
    }

    function onBellInput() {
      if (!bellInput) return;
      var index = Number(bellInput.value);
      bellBeats = BELL_STEPS[index] || 0;
      paintBell();
    }

    function paintBell() {
      var index = BELL_STEPS.indexOf(bellBeats);
      if (index < 0) index = 0;
      if (bellInput) bellInput.value = String(index);
      if (bellValue) bellValue.textContent = bellBeats === 0 ? '无' : bellBeats + ' 拍';
    }

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp);
    svg.addEventListener('pointercancel', onPointerUp);
    svg.addEventListener('wheel', onWheel, { passive: false });
    startBtn.addEventListener('click', togglePlay);
    if (bellInput) bellInput.addEventListener('input', onBellInput);

    paintTempo();
    renderPendulum();
    paintBell();

    return {
      destroy: function () {
        stop();
        svg.removeEventListener('pointerdown', onPointerDown);
        svg.removeEventListener('pointermove', onPointerMove);
        svg.removeEventListener('pointerup', onPointerUp);
        svg.removeEventListener('pointercancel', onPointerUp);
        svg.removeEventListener('wheel', onWheel);
        startBtn.removeEventListener('click', togglePlay);
        if (bellInput) bellInput.removeEventListener('input', onBellInput);
        if (ctx && ctx.state !== 'closed') {
          ctx.close();
        }
        ctx = null;
        master = null;
      }
    };
  }

  function initMetronome() {
    var root = document.getElementById('vemiyMetronome');

    if (!root) {
      if (engine) {
        engine.destroy();
        engine = null;
      }
      return;
    }

    if (engine) {
      engine.destroy();
      engine = null;
    }

    engine = createEngine(root);
  }

  initMetronome();

  VemiyTools.initMetronome = initMetronome;

  document.addEventListener('pjax:complete', function () {
    VemiyTools.initToolsSearch();
    VemiyTools.initMetronome();
  });
})();
