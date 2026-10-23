---
title: 节拍器
date: 2026-10-22 00:00:00
comments: false
---

<div class="vemiy-tool vemiy-metronome" id="vemiyMetronome">
<div class="vemiy-tool-head vemiy-metronome-head">
<button class="vemiy-tool-btn vemiy-tool-btn-primary vemiy-metronome-start" id="vemiyMetroStart" type="button">开始</button>
<div class="vemiy-metronome-bell">
<span class="vemiy-metronome-bell-label">重音</span>
<input class="vemiy-metronome-bell-range" type="range" id="vemiyMetroBell" min="0" max="4" step="1" value="0" aria-label="重音间隔">
<span class="vemiy-metronome-bell-value" id="vemiyMetroBellValue">无</span>
</div>
</div>
<div class="vemiy-metronome-stage">
<svg id="vemiyMetroSvg" class="vemiy-metronome-svg" viewBox="0 0 340 580" role="img" aria-label="机械节拍器" tabindex="0">
<path class="vemiy-metronome-body" d="M112 20 L228 20 L300 556 Q300 572 284 572 L56 572 Q40 572 40 556 Z" fill="#2e2e32" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"></path>
<path class="vemiy-metronome-plate" d="M118 108 L222 108 L284 552 L56 552 Z" fill="#26262a" stroke="rgba(255,255,255,0.06)" stroke-width="1"></path>
<text class="vemiy-metronome-bpm" id="vemiyMetroBpm" x="170" y="56" text-anchor="middle">120</text>
<text class="vemiy-metronome-bpm-unit" x="170" y="74" text-anchor="middle">BPM</text>
<text class="vemiy-metronome-name" id="vemiyMetroName" x="170" y="92" text-anchor="middle">Moderato</text>
<g class="vemiy-metronome-scale" id="vemiyMetroScale">
<line class="vemiy-metronome-tick" x1="165.0" y1="140.0" x2="156.0" y2="140.0"></line>
<text class="vemiy-metronome-mark" data-bpm="40" x="136.0" y="143.2" text-anchor="middle">40</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="144.5" x2="184.0" y2="144.5"></line>
<text class="vemiy-metronome-mark" data-bpm="42" x="204.0" y="147.7" text-anchor="middle">42</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="149.3" x2="156.0" y2="149.3"></line>
<text class="vemiy-metronome-mark" data-bpm="44" x="136.0" y="152.5" text-anchor="middle">44</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="154.1" x2="184.0" y2="154.1"></line>
<text class="vemiy-metronome-mark" data-bpm="46" x="204.0" y="157.3" text-anchor="middle">46</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="159.1" x2="156.0" y2="159.1"></line>
<text class="vemiy-metronome-mark" data-bpm="48" x="136.0" y="162.3" text-anchor="middle">48</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="164.3" x2="184.0" y2="164.3"></line>
<text class="vemiy-metronome-mark" data-bpm="50" x="204.0" y="167.5" text-anchor="middle">50</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="169.6" x2="156.0" y2="169.6"></line>
<text class="vemiy-metronome-mark" data-bpm="52" x="136.0" y="172.8" text-anchor="middle">52</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="175.0" x2="184.0" y2="175.0"></line>
<text class="vemiy-metronome-mark" data-bpm="54" x="204.0" y="178.2" text-anchor="middle">54</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="180.6" x2="156.0" y2="180.6"></line>
<text class="vemiy-metronome-mark" data-bpm="56" x="136.0" y="183.8" text-anchor="middle">56</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="186.4" x2="184.0" y2="186.4"></line>
<text class="vemiy-metronome-mark" data-bpm="58" x="204.0" y="189.6" text-anchor="middle">58</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="192.3" x2="156.0" y2="192.3"></line>
<text class="vemiy-metronome-mark" data-bpm="60" x="136.0" y="195.5" text-anchor="middle">60</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="198.3" x2="184.0" y2="198.3"></line>
<text class="vemiy-metronome-mark" data-bpm="63" x="204.0" y="201.5" text-anchor="middle">63</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="204.6" x2="156.0" y2="204.6"></line>
<text class="vemiy-metronome-mark" data-bpm="66" x="136.0" y="207.8" text-anchor="middle">66</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="211.0" x2="184.0" y2="211.0"></line>
<text class="vemiy-metronome-mark" data-bpm="69" x="204.0" y="214.2" text-anchor="middle">69</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="217.7" x2="156.0" y2="217.7"></line>
<text class="vemiy-metronome-mark" data-bpm="72" x="136.0" y="220.9" text-anchor="middle">72</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="224.6" x2="184.0" y2="224.6"></line>
<text class="vemiy-metronome-mark" data-bpm="76" x="204.0" y="227.8" text-anchor="middle">76</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="231.8" x2="156.0" y2="231.8"></line>
<text class="vemiy-metronome-mark" data-bpm="80" x="136.0" y="235.0" text-anchor="middle">80</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="239.2" x2="184.0" y2="239.2"></line>
<text class="vemiy-metronome-mark" data-bpm="84" x="204.0" y="242.4" text-anchor="middle">84</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="246.9" x2="156.0" y2="246.9"></line>
<text class="vemiy-metronome-mark" data-bpm="88" x="136.0" y="250.1" text-anchor="middle">88</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="254.8" x2="184.0" y2="254.8"></line>
<text class="vemiy-metronome-mark" data-bpm="92" x="204.0" y="258.0" text-anchor="middle">92</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="262.9" x2="156.0" y2="262.9"></line>
<text class="vemiy-metronome-mark" data-bpm="96" x="136.0" y="266.1" text-anchor="middle">96</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="271.4" x2="184.0" y2="271.4"></line>
<text class="vemiy-metronome-mark" data-bpm="100" x="204.0" y="274.6" text-anchor="middle">100</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="280.0" x2="156.0" y2="280.0"></line>
<text class="vemiy-metronome-mark" data-bpm="104" x="136.0" y="283.2" text-anchor="middle">104</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="288.9" x2="184.0" y2="288.9"></line>
<text class="vemiy-metronome-mark" data-bpm="108" x="204.0" y="292.1" text-anchor="middle">108</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="298.0" x2="156.0" y2="298.0"></line>
<text class="vemiy-metronome-mark" data-bpm="112" x="136.0" y="301.2" text-anchor="middle">112</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="307.4" x2="184.0" y2="307.4"></line>
<text class="vemiy-metronome-mark" data-bpm="116" x="204.0" y="310.6" text-anchor="middle">116</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="317.0" x2="156.0" y2="317.0"></line>
<text class="vemiy-metronome-mark" data-bpm="120" x="136.0" y="320.2" text-anchor="middle">120</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="326.8" x2="184.0" y2="326.8"></line>
<text class="vemiy-metronome-mark" data-bpm="126" x="204.0" y="330.0" text-anchor="middle">126</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="337.0" x2="156.0" y2="337.0"></line>
<text class="vemiy-metronome-mark" data-bpm="132" x="136.0" y="340.2" text-anchor="middle">132</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="347.6" x2="184.0" y2="347.6"></line>
<text class="vemiy-metronome-mark" data-bpm="138" x="204.0" y="350.8" text-anchor="middle">138</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="358.5" x2="156.0" y2="358.5"></line>
<text class="vemiy-metronome-mark" data-bpm="144" x="136.0" y="361.7" text-anchor="middle">144</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="369.7" x2="184.0" y2="369.7"></line>
<text class="vemiy-metronome-mark" data-bpm="152" x="204.0" y="372.9" text-anchor="middle">152</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="381.4" x2="156.0" y2="381.4"></line>
<text class="vemiy-metronome-mark" data-bpm="160" x="136.0" y="384.6" text-anchor="middle">160</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="393.5" x2="184.0" y2="393.5"></line>
<text class="vemiy-metronome-mark" data-bpm="168" x="204.0" y="396.7" text-anchor="middle">168</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="406.0" x2="156.0" y2="406.0"></line>
<text class="vemiy-metronome-mark" data-bpm="176" x="136.0" y="409.2" text-anchor="middle">176</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="418.9" x2="184.0" y2="418.9"></line>
<text class="vemiy-metronome-mark" data-bpm="184" x="204.0" y="422.1" text-anchor="middle">184</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="432.2" x2="156.0" y2="432.2"></line>
<text class="vemiy-metronome-mark" data-bpm="192" x="136.0" y="435.4" text-anchor="middle">192</text>
<line class="vemiy-metronome-tick" x1="175.0" y1="445.9" x2="184.0" y2="445.9"></line>
<text class="vemiy-metronome-mark" data-bpm="200" x="204.0" y="449.1" text-anchor="middle">200</text>
<line class="vemiy-metronome-tick" x1="165.0" y1="460.0" x2="156.0" y2="460.0"></line>
<text class="vemiy-metronome-mark" data-bpm="208" x="136.0" y="463.2" text-anchor="middle">208</text>
</g>
<g class="vemiy-metronome-pendulum" id="vemiyMetroPendulum">
<rect class="vemiy-metronome-rod" x="166" y="108" width="8" height="420" rx="3" fill="#d6d6db"></rect>
<rect class="vemiy-metronome-rod-shade" x="171" y="108" width="3" height="420" rx="1.5" fill="#a8a8ae"></rect>
<rect class="vemiy-metronome-weight" id="vemiyMetroWeight" x="151" y="248" width="38" height="30" rx="6" fill="#4a4a50" stroke="#131315" stroke-width="1.5"></rect>
<rect class="vemiy-metronome-weight-top" id="vemiyMetroWeightTop" x="151" y="248" width="38" height="8" rx="4" fill="#63636a"></rect>
<circle class="vemiy-metronome-grip" id="vemiyMetroGrip" cx="170" cy="263" r="4" fill="#49b1f5"></circle>
<circle class="vemiy-metronome-pivot" cx="170" cy="528" r="5" fill="#b8b8bc"></circle>
</g>
<circle class="vemiy-metronome-lamp-glow" id="vemiyMetroLamp" cx="170" cy="528" r="42" fill="rgba(73,177,245,0.16)"></circle>
<circle class="vemiy-metronome-lamp" id="vemiyMetroLampDot" cx="170" cy="528" r="6" fill="#3a3a3e"></circle>
</svg>
</div>
</div>

<style>
  /* 节拍器专属样式 */
  .vemiy-metronome-head {
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }
  .vemiy-metronome-start {
    min-width: 96px;
    height: 42px;
  }
  .vemiy-metronome-start.is-playing {
    background: #ff7242;
  }
  .vemiy-metronome-bell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 1.25rem;
    height: 42px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    background: rgba(30, 30, 30, 0.6);
  }
  .vemiy-metronome-bell-label {
    font-size: 0.95rem;
    font-weight: 600;
    opacity: 0.8;
    white-space: nowrap;
  }
  .vemiy-metronome-bell-range {
    width: 160px;
    height: 6px;
    margin: 0;
    padding: 0;
    appearance: none;
    -webkit-appearance: none;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    cursor: ew-resize;
  }
  .vemiy-metronome-bell-range::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #49b1f5;
    border: none;
    cursor: ew-resize;
  }
  .vemiy-metronome-bell-range::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #49b1f5;
    border: none;
    cursor: ew-resize;
  }
  .vemiy-metronome-bell-value {
    font-size: 0.95rem;
    font-weight: 600;
    opacity: 0.9;
    min-width: 2.8rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .vemiy-metronome-stage {
    display: flex;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    background: rgba(30, 30, 30, 0.6);
    padding: 1.25rem 1rem;
    margin-bottom: 0.85rem;
  }
  .vemiy-metronome-svg {
    width: 400px;
    max-width: 100%;
    height: auto;
    display: block;
    cursor: grab;
    touch-action: none;
    outline: none;
    overflow: visible;
  }
  .vemiy-metronome-svg:active {
    cursor: grabbing;
  }
  .vemiy-metronome-svg:focus-visible {
    filter: drop-shadow(0 0 8px rgba(73, 177, 245, 0.5));
  }
  .vemiy-metronome-weight {
    cursor: ns-resize;
  }
  .vemiy-metronome-tick {
    stroke: rgba(255, 255, 255, 0.26);
    stroke-width: 1;
  }
  .vemiy-metronome-mark {
    fill: rgba(255, 255, 255, 0.62);
    font-size: 9px;
    font-family: Consolas, Monaco, "Courier New", monospace;
    cursor: pointer;
    user-select: none;
  }
  .vemiy-metronome-mark:hover {
    fill: #49b1f5;
  }
  .vemiy-metronome-bpm {
    fill: #e9e9ec;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: 0.02em;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-variant-numeric: tabular-nums;
  }
  .vemiy-metronome-bpm-unit {
    fill: rgba(255, 255, 255, 0.5);
    font-size: 8.5px;
    letter-spacing: 0.3em;
    font-family: Consolas, Monaco, "Courier New", monospace;
  }
  .vemiy-metronome-name {
    fill: rgba(255, 255, 255, 0.55);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    font-family: Consolas, Monaco, "Courier New", monospace;
  }
  .vemiy-metronome-lamp-glow {
    opacity: 0;
    transition: opacity 0.1s linear;
    pointer-events: none;
  }
  .vemiy-metronome-lamp-glow.is-on {
    opacity: 1;
  }
  @media (max-width: 640px) {
    .vemiy-metronome-head {
      gap: 0.6rem;
    }
    .vemiy-metronome-bell-range {
      width: 72px;
    }
  }
</style>