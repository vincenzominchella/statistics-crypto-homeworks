/**
 * ============================================================================
 * Application Controller - Homework 5 Suite
 * Riemann vs. Lebesgue Integration & Normal CDF Numerical Methods
 * ============================================================================
 */

(function() {
  'use strict';

  // Application State
  const state = {
    funcId: 'sin',
    riemannN: 80,
    lebesgueM: 20,
    normalZ: 1.96,
    seriesK: 35,
    quadN: 500,
    riemannResult: null,
    lebesgueResult: null,
    nistResult: null
  };

  // DOM Elements Cache
  const elements = {};

  function cacheDom() {
    // Navigation Tabs
    elements.tabBtnLab = document.getElementById('tab-btn-lab');
    elements.tabBtnReport = document.getElementById('tab-btn-report');
    elements.tabLab = document.getElementById('tab-lab');
    elements.tabReport = document.getElementById('tab-report');
    elements.reportContainer = document.getElementById('report-rendered-markdown');

    // Stat Cards
    elements.statRiemannVal = document.getElementById('stat-riemann-val');
    elements.statLebesgueVal = document.getElementById('stat-lebesgue-val');
    elements.statNormalVal = document.getElementById('stat-normal-val');
    elements.statVerdict = document.getElementById('stat-verdict');
    elements.statSubRiemann = document.getElementById('stat-sub-riemann');
    elements.statSubLebesgue = document.getElementById('stat-sub-lebesgue');
    elements.statSubNormal = document.getElementById('stat-sub-normal');
    elements.statSubVerdict = document.getElementById('stat-sub-verdict');

    // Ex 1 Controls
    elements.selectFunction = document.getElementById('select-function');
    elements.sliderRiemannN = document.getElementById('slider-riemann-n');
    elements.badgeNPartitions = document.getElementById('badge-n-partitions');
    elements.sliderLebesgueM = document.getElementById('slider-lebesgue-m');
    elements.badgeMLayers = document.getElementById('badge-m-layers');
    elements.badgeIntegrability = document.getElementById('badge-integrability-status');
    elements.calloutFuncLatex = document.getElementById('callout-func-latex');
    elements.calloutExactLatex = document.getElementById('callout-exact-latex');

    // Ex 1 Pathology Box
    elements.pathologyBox = document.getElementById('pathology-explanation-box');
    elements.pathologyTitle = document.getElementById('pathology-title');
    elements.pathologyDesc = document.getElementById('pathology-desc');

    // Ex 1 Visual Canvases
    elements.canvasRiemann = document.getElementById('canvas-riemann');
    elements.canvasLebesgue = document.getElementById('canvas-lebesgue');
    elements.tbodyIntegrationResults = document.getElementById('tbody-integration-results');

    // Ex 2 Normal CDF Controls
    elements.sliderNormalZ = document.getElementById('slider-normal-z');
    elements.badgeZVal = document.getElementById('badge-z-val');
    elements.sliderSeriesK = document.getElementById('slider-series-k');
    elements.badgeKTerms = document.getElementById('badge-k-terms');
    elements.sliderQuadN = document.getElementById('slider-quad-n');
    elements.badgeQuadN = document.getElementById('badge-quad-n');
    elements.presetZBtns = document.querySelectorAll('.preset-z-btn');

    // Ex 2 Method Value Display Cards
    elements.valMethodSeries = document.getElementById('val-method-series');
    elements.valMethodSimpson = document.getElementById('val-method-simpson');
    elements.valMethodAS = document.getElementById('val-method-as');
    elements.valMethodErf = document.getElementById('val-method-erf');
    elements.errMethodSeries = document.getElementById('err-method-series');
    elements.errMethodSimpson = document.getElementById('err-method-simpson');
    elements.errMethodAS = document.getElementById('err-method-as');
    elements.errMethodErf = document.getElementById('err-method-erf');

    // Ex 2 Canvas & Table & Benchmark
    elements.canvasNormalConvergence = document.getElementById('canvas-normal-convergence');
    elements.tbodyNistBenchmark = document.getElementById('tbody-nist-benchmark');
    elements.btnRunBenchmark = document.getElementById('btn-run-benchmark');
    elements.labelBenchmarkStatus = document.getElementById('label-benchmark-status');
  }

  // =========================================================================
  // INITIALIZATION & EVENT DISPATCH
  // =========================================================================

  function init() {
    cacheDom();
    setupEventListeners();
    updateIntegrationLab();
    updateNormalCdfLab();
    renderNistBenchmarkTable();
    drawNormalConvergenceCanvas();
    loadReportMarkdown();

    // KaTeX render on page load
    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }

  function setupEventListeners() {
    // Tab switching
    elements.tabBtnLab.addEventListener('click', () => switchTab('tab-lab'));
    elements.tabBtnReport.addEventListener('click', () => switchTab('tab-report'));

    // Ex 1 Function Change
    elements.selectFunction.addEventListener('change', (e) => {
      state.funcId = e.target.value;
      updateIntegrationLab();
    });

    // Ex 1 Sliders
    elements.sliderRiemannN.addEventListener('input', (e) => {
      state.riemannN = parseInt(e.target.value, 10);
      elements.badgeNPartitions.textContent = `N = ${state.riemannN}`;
      debounceIntegrationLab();
    });

    elements.sliderLebesgueM.addEventListener('input', (e) => {
      state.lebesgueM = parseInt(e.target.value, 10);
      elements.badgeMLayers.textContent = `M = ${state.lebesgueM}`;
      debounceIntegrationLab();
    });

    // Ex 2 Normal CDF Sliders
    elements.sliderNormalZ.addEventListener('input', (e) => {
      state.normalZ = parseFloat(e.target.value);
      elements.badgeZVal.textContent = `z = ${state.normalZ.toFixed(3)}`;
      updateNormalCdfLab();
    });

    elements.sliderSeriesK.addEventListener('input', (e) => {
      state.seriesK = parseInt(e.target.value, 10);
      elements.badgeKTerms.textContent = `K = ${state.seriesK} terms`;
      updateNormalCdfLab();
    });

    elements.sliderQuadN.addEventListener('input', (e) => {
      state.quadN = parseInt(e.target.value, 10);
      elements.badgeQuadN.textContent = `N = ${state.quadN} steps`;
      updateNormalCdfLab();
    });

    // Quick Presets for Z
    elements.presetZBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const z = parseFloat(btn.getAttribute('data-z'));
        state.normalZ = z;
        elements.sliderNormalZ.value = z;
        elements.badgeZVal.textContent = `z = ${z.toFixed(3)}`;
        updateNormalCdfLab();
      });
    });

    // Execution Speed Benchmark
    elements.btnRunBenchmark.addEventListener('click', runBenchmarkSuite);

    // Window Resize
    window.addEventListener('resize', debounce(() => {
      drawRiemannCanvas();
      drawLebesgueCanvas();
      drawNormalConvergenceCanvas();
    }, 150));
  }

  function switchTab(targetId) {
    if (targetId === 'tab-lab') {
      elements.tabBtnLab.classList.add('active');
      elements.tabBtnReport.classList.remove('active');
      elements.tabLab.classList.add('active');
      elements.tabReport.classList.remove('active');
      drawRiemannCanvas();
      drawLebesgueCanvas();
      drawNormalConvergenceCanvas();
    } else {
      elements.tabBtnLab.classList.remove('active');
      elements.tabBtnReport.classList.add('active');
      elements.tabLab.classList.remove('active');
      elements.tabReport.classList.add('active');
    }
  }

  let integrationDebounceTimer = null;
  function debounceIntegrationLab() {
    clearTimeout(integrationDebounceTimer);
    integrationDebounceTimer = setTimeout(() => {
      updateIntegrationLab();
    }, 60);
  }

  function debounce(fn, ms) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function getEngine() {
    if (typeof window !== 'undefined') {
      if (window.IntegrationEngine && window.IntegrationEngine.TEST_FUNCTIONS) {
        return window.IntegrationEngine;
      }
      if (window.IntegrationEngine && window.IntegrationEngine.IntegrationEngine) {
        return window.IntegrationEngine.IntegrationEngine;
      }
    }
    return typeof IntegrationEngine !== 'undefined' ? IntegrationEngine : {};
  }

  // =========================================================================
  // EXERCISE 1 CONTROLLER: RIEMANN VS LEBESGUE
  // =========================================================================

  function updateIntegrationLab() {
    const Engine = getEngine();
    if (!Engine || !Engine.TEST_FUNCTIONS) return;

    const funcDef = Engine.TEST_FUNCTIONS[state.funcId];
    if (!funcDef) return;

    const [a, b] = funcDef.domain;

    // Call Engine
    state.riemannResult = Engine.computeRiemannIntegration(funcDef, a, b, state.riemannN);
    state.lebesgueResult = Engine.computeLebesgueIntegration(funcDef, a, b, state.lebesgueM, 20000);

    const r = state.riemannResult;
    const l = state.lebesgueResult;
    const exact = funcDef.exact;

    // Update Header Callout
    elements.calloutFuncLatex.textContent = `Function: ${funcDef.name} on [${a.toFixed(2)}, ${b.toFixed(2)}]`;
    elements.calloutExactLatex.textContent = `Exact Analytical Target: ${exact.toFixed(8)}`;

    // Update Stat Cards
    elements.statRiemannVal.textContent = r.methods.midpoint.value.toFixed(6);
    elements.statSubRiemann.textContent = `Exact: ${exact.toFixed(6)} • Abs Err: ${r.methods.midpoint.error.toExponential(2)}`;

    elements.statLebesgueVal.textContent = l.methods.midpoint.value.toFixed(6);
    elements.statSubLebesgue.textContent = `Range Slices M = ${l.M} • Abs Err: ${l.methods.midpoint.error.toExponential(2)}`;

    // Update Integrability Badges & Verdict
    if (funcDef.pathologyType === 'dirichlet') {
      elements.badgeIntegrability.textContent = 'Pathological: Riemann Fails (U=1, L=0), Lebesgue = 0';
      elements.badgeIntegrability.className = 'card-badge badge-rose';
      elements.statVerdict.textContent = 'Lebesgue Only';
      elements.statVerdict.style.color = '#f43f5e';
      elements.statSubVerdict.textContent = 'Dirichlet fails Riemann, Lebesgue = 0';

      elements.pathologyBox.style.display = 'block';
      elements.pathologyTitle.textContent = 'Dirichlet Function (Q vs R \\ Q) Analysis';
      elements.pathologyDesc.innerHTML = `
        <strong>Riemann Invalidation:</strong> In any subinterval [x<sub>i-1</sub>, x<sub>i</sub>], both rational and irrational numbers are dense. Thus sup f = 1 and inf f = 0, causing the Upper Darboux sum U = 1 and Lower Darboux sum L = 0. The Darboux gap U &minus; L = 1 never vanishes as N &rarr; &infin;, proving the Riemann integral does not exist.<br>
        <strong>Lebesgue Victory:</strong> The set of rationals Q &cap; [0, 1] is countable, and countable sets have Lebesgue measure zero: &mu;(Q) = 0. The set of irrationals has measure &mu;([0, 1] \\ Q) = 1. Hence, the Lebesgue integral &int; f d&mu; = 1 &bull; &mu;(Q) + 0 &bull; &mu;(R \\ Q) = 1 &bull; 0 + 0 &bull; 1 = 0 exactly.
      `;
    } else if (funcDef.pathologyType === 'thomae') {
      elements.badgeIntegrability.textContent = 'Thomae Popcorn: Both Converge to 0';
      elements.badgeIntegrability.className = 'card-badge badge-emerald';
      elements.statVerdict.textContent = 'Riemann & Lebesgue = 0';
      elements.statVerdict.style.color = '#34d399';
      elements.statSubVerdict.textContent = 'Discontinuities have measure zero';

      elements.pathologyBox.style.display = 'block';
      elements.pathologyTitle.textContent = 'Thomae’s Function (Popcorn / Ruler) Analysis';
      elements.pathologyDesc.innerHTML = `
        <strong>Measure of Discontinuities:</strong> Thomae's function is continuous at every irrational number and discontinuous at every rational number. For any &epsilon; &gt; 0, the set of points where f(x) &ge; &epsilon; is finite (only fractions with denominator q &le; 1/&epsilon;). Thus, the set of discontinuities is countable and has Lebesgue measure zero.<br>
        <strong>Riemann &amp; Lebesgue Equivalence:</strong> By Lebesgue's Integrability Criterion, a bounded function is Riemann integrable if and only if its discontinuity set has measure zero. Both Riemann and Lebesgue integrals converge to 0.
      `;
    } else if (funcDef.isImproper) {
      elements.badgeIntegrability.textContent = 'Improper Riemann vs. L¹ Lebesgue Integral';
      elements.badgeIntegrability.className = 'card-badge badge-amber';
      elements.statVerdict.textContent = 'L¹ Integrable (= 2)';
      elements.statVerdict.style.color = '#fbbf24';
      elements.statSubVerdict.textContent = 'Singularity at x = 0';

      elements.pathologyBox.style.display = 'block';
      elements.pathologyTitle.textContent = 'Unbounded Singular Function f(x) = 1/√x on (0, 1]';
      elements.pathologyDesc.innerHTML = `
        Standard Riemann partitions fail at x = 0 because the function is unbounded (f(0) = &infin;), requiring the improper Cauchy limit lim<sub>&epsilon;&rarr;0<sup>+</sup></sub> &int;<sub>&epsilon;</sub><sup>1</sup> x<sup>&minus;1/2</sup> dx = 2.<br>
        In Lebesgue theory, f is directly L¹-integrable via the layer-cake representation &int;<sub>0</sub><sup>&infin;</sup> &mu;({x : 1/&radic;x &ge; y}) dy = &int;<sub>0</sub><sup>1</sup> 1 dy + &int;<sub>1</sub><sup>&infin;</sup> (1/y<sup>2</sup>) dy = 1 + 1 = 2.
      `;
    } else {
      elements.badgeIntegrability.textContent = 'Riemann & Lebesgue Equivalent';
      elements.badgeIntegrability.className = 'card-badge badge-cyan';
      elements.statVerdict.textContent = 'Equivalence';
      elements.statVerdict.style.color = '#38bdf8';
      elements.statSubVerdict.textContent = 'Riemann = Lebesgue on C[a,b]';
      elements.pathologyBox.style.display = 'none';
    }

    // Populate Results Table
    renderIntegrationTable(r, l, funcDef);

    // Redraw Canvases
    drawRiemannCanvas();
    drawLebesgueCanvas();
  }

  function renderIntegrationTable(r, l, funcDef) {
    const exact = funcDef.exact;
    const fmt = (v) => Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(4) : v.toFixed(6);
    const fmtErr = (e) => e === 0 ? '0.00e+0' : e.toExponential(3);

    const rows = [
      {
        method: 'Riemann Midpoint Rule',
        strategy: `Domain Slicing N = ${r.N} subintervals`,
        value: fmt(r.methods.midpoint.value),
        exact: fmt(exact),
        err: fmtErr(r.methods.midpoint.error),
        rate: 'O(h²) ~ O(1/N²)',
        status: funcDef.pathologyType === 'dirichlet' ? 'Undefined' : 'Converged',
        badge: funcDef.pathologyType === 'dirichlet' ? 'badge-rose' : 'badge-cyan'
      },
      {
        method: 'Riemann Trapezoidal Rule',
        strategy: `Domain linear chords N = ${r.N}`,
        value: fmt(r.methods.trapezoid.value),
        exact: fmt(exact),
        err: fmtErr(r.methods.trapezoid.error),
        rate: 'O(h²) ~ O(1/N²)',
        status: funcDef.pathologyType === 'dirichlet' ? 'Undefined' : 'Converged',
        badge: funcDef.pathologyType === 'dirichlet' ? 'badge-rose' : 'badge-cyan'
      },
      {
        method: 'Riemann Simpson’s 1/3 Rule',
        strategy: `Quadratic parabolic arcs N = ${r.N}`,
        value: fmt(r.methods.simpson.value),
        exact: fmt(exact),
        err: fmtErr(r.methods.simpson.error),
        rate: 'O(h⁴) ~ O(1/N⁴)',
        status: funcDef.pathologyType === 'dirichlet' ? 'Undefined' : 'High Precision',
        badge: funcDef.pathologyType === 'dirichlet' ? 'badge-rose' : 'badge-emerald'
      },
      {
        method: 'Darboux Bounds (Upper &minus; Lower)',
        strategy: `Envelope Gap: U = ${r.darboux.upper.toFixed(4)}, L = ${r.darboux.lower.toFixed(4)}`,
        value: `Gap = ${r.darboux.gap.toFixed(5)}`,
        exact: '0.000000',
        err: r.darboux.gap.toExponential(3),
        rate: funcDef.pathologyType === 'dirichlet' ? 'Gap = 1.0 (DNE)' : 'Gap &rarr; 0 as N &rarr; &infin;',
        status: r.isIntegrable ? 'Integrable' : 'Non-Integrable',
        badge: r.isIntegrable ? 'badge-emerald' : 'badge-rose'
      },
      {
        method: 'Lebesgue Simple Function (Midpoint)',
        strategy: `Range Slicing M = ${l.M} horizontal layers`,
        value: fmt(l.methods.midpoint.value),
        exact: fmt(exact),
        err: fmtErr(l.methods.midpoint.error),
        rate: 'O(Δy) ~ O(1/M)',
        status: 'Strictly Converged',
        badge: 'badge-emerald'
      },
      {
        method: 'Lebesgue Lower Simple Sum',
        strategy: `Sum_j y_{j-1} * &mu;(E_j)`,
        value: fmt(l.methods.lower.value),
        exact: fmt(exact),
        err: fmtErr(l.methods.lower.error),
        rate: 'Monotone Lower Bound',
        status: 'Valid Lower Envelope',
        badge: 'badge-violet'
      },
      {
        method: 'Lebesgue Upper Simple Sum',
        strategy: `Sum_j y_j * &mu;(E_j)`,
        value: fmt(l.methods.upper.value),
        exact: fmt(exact),
        err: fmtErr(l.methods.upper.error),
        rate: 'Monotone Upper Bound',
        status: 'Valid Upper Envelope',
        badge: 'badge-violet'
      }
    ];

    elements.tbodyIntegrationResults.innerHTML = rows.map(r => `
      <tr>
        <td class="strong" style="color:#f1f5f9;">${r.method}</td>
        <td><code>${r.strategy}</code></td>
        <td style="color:#38bdf8; font-weight:700; font-family:var(--font-mono);">${r.value}</td>
        <td style="color:#cbd5e1; font-family:var(--font-mono);">${r.exact}</td>
        <td style="color:#a855f7; font-family:var(--font-mono);">${r.err}</td>
        <td style="color:#94a3b8; font-size:0.78rem;">${r.rate}</td>
        <td><span class="card-badge ${r.badge}">${r.status}</span></td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // CANVAS 1: RIEMANN DOMAIN PARTITIONING
  // =========================================================================

  function drawRiemannCanvas() {
    const canvas = elements.canvasRiemann;
    if (!canvas || !canvas.getContext || !state.riemannResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const r = state.riemannResult;
    const Engine = getEngine();
    const funcDef = Engine.TEST_FUNCTIONS ? Engine.TEST_FUNCTIONS[state.funcId] : null;
    if (!funcDef) return;
    const [a, b] = funcDef.domain;
    const fn = funcDef.fn;

    const padLeft = 45;
    const padRight = 20;
    const padTop = 25;
    const padBottom = 35;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Determine Y range
    let yMin = 0;
    let yMax = 1.0;
    for (let k = 0; k <= 200; k++) {
      const x = a + (k / 200) * (b - a);
      const y = fn(x);
      if (isFinite(y)) {
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
    yMax *= 1.15;
    if (yMin < 0) yMin *= 1.1;

    function getX(x) {
      return padLeft + ((x - a) / (b - a)) * chartW;
    }
    function getY(y) {
      return padTop + chartH - ((y - yMin) / (yMax - yMin)) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * (yMax - yMin);
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(2), padLeft - 6, y + 3);
    }

    // X Ticks
    for (let i = 0; i <= 4; i++) {
      const xVal = a + (i / 4) * (b - a);
      const x = getX(xVal);
      ctx.beginPath();
      ctx.moveTo(x, padTop + chartH);
      ctx.lineTo(x, padTop + chartH + 4);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(xVal.toFixed(2), x, h - 14);
    }

    const yZero = getY(0);

    // 1. Draw Riemann Vertical Rectangles (Midpoint)
    const slices = r.slices;
    for (let s of slices) {
      const x0 = getX(s.x0);
      const x1 = getX(s.x1);
      const barW = Math.max(1, x1 - x0);
      const barTop = getY(s.yMid);
      const topY = Math.min(barTop, yZero);
      const barHeight = Math.abs(yZero - barTop);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.fillRect(x0, topY, barW, barHeight);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, topY, barW, barHeight);

      // Midpoint evaluation dot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(getX(s.xMid), barTop, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Continuous Curve f(x)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 300; i++) {
      const x = a + (i / 300) * (b - a);
      const y = fn(x);
      if (isFinite(y) && y <= yMax * 1.5) {
        const px = getX(x);
        const py = getY(y);
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
    }
    ctx.stroke();

    // Zero axis line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padLeft, yZero);
    ctx.lineTo(padLeft + chartW, yZero);
    ctx.stroke();

    // Canvas Title / Legend
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Riemann Midpoint Sum = ${r.methods.midpoint.value.toFixed(5)} (N = ${r.N})`, padLeft + 10, padTop + 14);
  }

  // =========================================================================
  // CANVAS 2: LEBESGUE RANGE PARTITIONING & PREIMAGE MEASURES
  // =========================================================================

  function drawLebesgueCanvas() {
    const canvas = elements.canvasLebesgue;
    if (!canvas || !canvas.getContext || !state.lebesgueResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const l = state.lebesgueResult;
    const Engine = getEngine();
    const funcDef = Engine.TEST_FUNCTIONS ? Engine.TEST_FUNCTIONS[state.funcId] : null;
    if (!funcDef) return;
    const [a, b] = funcDef.domain;
    const fn = funcDef.fn;

    const padLeft = 45;
    const padRight = 20;
    const padTop = 25;
    const padBottom = 35;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const [yMin, yMax] = l.yRange;

    function getX(x) {
      return padLeft + ((x - a) / (b - a)) * chartW;
    }
    function getY(y) {
      return padTop + chartH - ((y - yMin) / (yMax - yMin)) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * (yMax - yMin);
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(2), padLeft - 6, y + 3);
    }

    // 1. Draw Horizontal Slices [y_j, y_{j+1}]
    const layers = l.layers;
    const palette = [
      'rgba(16, 185, 129, 0.16)',
      'rgba(168, 85, 247, 0.16)',
      'rgba(56, 189, 248, 0.16)',
      'rgba(245, 158, 11, 0.16)'
    ];
    const borderPalette = [
      'rgba(16, 185, 129, 0.5)',
      'rgba(168, 85, 247, 0.5)',
      'rgba(56, 189, 248, 0.5)',
      'rgba(245, 158, 11, 0.5)'
    ];

    for (let layer of layers) {
      const yTop = getY(layer.y1);
      const yBot = getY(layer.y0);
      const layerH = Math.max(1, yBot - yTop);
      const colIdx = layer.j % palette.length;

      ctx.fillStyle = palette[colIdx];
      ctx.fillRect(padLeft, yTop, chartW, layerH);

      ctx.strokeStyle = borderPalette[colIdx];
      ctx.lineWidth = 0.8;
      ctx.strokeRect(padLeft, yTop, chartW, layerH);

      // 2. Draw Preimage Projection Segments along the bottom domain axis
      const preimages = layer.samplePreimages || [];
      ctx.fillStyle = borderPalette[colIdx];
      for (let pxVal of preimages) {
        const px = getX(pxVal);
        ctx.fillRect(px - 1, padTop + chartH + 2, 2, 4);
      }
    }

    // 3. Draw Continuous Curve f(x)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 300; i++) {
      const x = a + (i / 300) * (b - a);
      const y = fn(x);
      if (isFinite(y) && y <= yMax * 1.5) {
        const px = getX(x);
        const py = getY(y);
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
    }
    ctx.stroke();

    // Preimage axis line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + chartH);
    ctx.lineTo(padLeft + chartW, padTop + chartH);
    ctx.stroke();

    // Canvas Title / Legend
    ctx.fillStyle = '#34d399';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lebesgue Simple Sum = ${l.methods.midpoint.value.toFixed(5)} (M = ${l.M} range slices)`, padLeft + 10, padTop + 14);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Domain Preimages E_j colored on baseline`, padLeft + chartW - 10, padTop + chartH - 8);
  }

  // =========================================================================
  // EXERCISE 2 CONTROLLER: NORMAL CDF Φ(z)
  // =========================================================================

  function updateNormalCdfLab() {
    const Engine = getEngine();
    if (!Engine || !Engine.phiPowerSeries) return;

    const z = state.normalZ;
    const K = state.seriesK;
    const N = state.quadN;

    const seriesRes = Engine.phiPowerSeries(z, K);
    const quadRes = Engine.phiQuadrature(z, N);
    const asVal = Engine.phiAbramowitzStegun(z);
    const erfVal = Engine.phiErfAnalytical(z);

    // Update 4 Cards
    elements.valMethodSeries.textContent = seriesRes.value.toFixed(8);
    elements.valMethodSimpson.textContent = quadRes.simpson.toFixed(8);
    elements.valMethodAS.textContent = asVal.toFixed(8);
    elements.valMethodErf.textContent = erfVal.toFixed(8);

    // Compute error relative to high-precision erf / NIST reference
    const trueRef = erfVal; // Analytical baseline
    const errSeries = Math.abs(seriesRes.value - trueRef);
    const errSimpson = Math.abs(quadRes.simpson - trueRef);
    const errAS = Math.abs(asVal - trueRef);

    elements.errMethodSeries.textContent = `Abs Err: ${errSeries === 0 ? '< 1e-16' : errSeries.toExponential(2)} • (K = ${K})`;
    elements.errMethodSimpson.textContent = `Abs Err: ${errSimpson === 0 ? '< 1e-16' : errSimpson.toExponential(2)} • (N = ${N})`;
    elements.errMethodAS.textContent = `Abs Err: ${errAS.toExponential(2)} • Rational Fit`;
    elements.errMethodErf.textContent = `Φ(${z.toFixed(2)}) = 0.5 · [1 + erf(${z.toFixed(2)}/√2)]`;

    // Update Deck Stat
    elements.statNormalVal.textContent = erfVal.toFixed(6);
    elements.statSubNormal.textContent = `z = ${z.toFixed(2)} • High-precision reference`;
  }

  function renderNistBenchmarkTable() {
    const Engine = getEngine();
    if (!Engine || !Engine.runNistEvaluationSuite) return;

    const nistResults = Engine.runNistEvaluationSuite(40, 500);
    state.nistResult = nistResults;

    const fmt = (v) => (v !== undefined && v !== null && !isNaN(v)) ? Number(v).toFixed(8) : '0.00000000';
    const fmtErr = (e) => (e === 0 || !e || isNaN(e)) ? '0.00e+0' : Number(e).toExponential(2);

    elements.tbodyNistBenchmark.innerHTML = nistResults.map(entry => {
      return `
        <tr>
          <td class="strong" style="color:#38bdf8; font-family:var(--font-mono);">z = ${entry.z.toFixed(3)}</td>
          <td style="color:#cbd5e1; font-size:0.78rem;">${entry.label}</td>
          <td style="color:#34d399; font-weight:700; font-family:var(--font-mono);">${fmt(entry.trueVal)}</td>
          <td style="font-family:var(--font-mono); color:#cbd5e1;">${fmt(entry.series.value)}</td>
          <td style="font-family:var(--font-mono); color:#cbd5e1;">${fmt(entry.simpson.value)}</td>
          <td style="font-family:var(--font-mono); color:#cbd5e1;">${fmt(entry.abramowitzStegun.value)}</td>
          <td style="color:#a855f7; font-family:var(--font-mono); font-size:0.8rem;">${fmtErr(entry.series.absError)}</td>
          <td style="color:#38bdf8; font-family:var(--font-mono); font-size:0.8rem;">${fmtErr(entry.simpson.absError)}</td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // CANVAS 3: ERROR DECAY & CONVERGENCE LOG-LOG
  // =========================================================================

  function drawNormalConvergenceCanvas() {
    const canvas = elements.canvasNormalConvergence;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 55;
    const padRight = 20;
    const padTop = 25;
    const padBottom = 35;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const Engine = getEngine();
    if (!Engine || !Engine.phiPowerSeries) return;
    const z = 1.96;
    const trueVal = 0.975; // Analytical target for z = 1.95996...

    // Series error vs K (K from 2 to 40)
    const seriesPoints = [];
    for (let k = 2; k <= 35; k += 2) {
      const val = Engine.phiPowerSeries(z, k).value;
      const err = Math.max(1e-16, Math.abs(val - trueVal));
      seriesPoints.push({ k, logErr: Math.log10(err) });
    }

    // Simpson error vs N (N from 10 to 500)
    const simpsonPoints = [];
    for (let n = 10; n <= 400; n += 20) {
      const val = Engine.phiQuadrature(z, n).simpson;
      const err = Math.max(1e-16, Math.abs(val - trueVal));
      simpsonPoints.push({ n, logErr: Math.log10(err) });
    }

    const minLogErr = -16;
    const maxLogErr = 0;

    function getY(logErr) {
      const clamped = Math.max(minLogErr, Math.min(maxLogErr, logErr));
      return padTop + chartH - ((clamped - minLogErr) / (maxLogErr - minLogErr)) * chartH;
    }

    // Grid lines for powers of 10
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let p = minLogErr; p <= maxLogErr; p += 2) {
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`10^${p}`, padLeft - 6, y + 3);
    }

    // Reference Line: Machine Precision 10^-16
    const yMach = getY(-16);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, yMach);
    ctx.lineTo(padLeft + chartW, yMach);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('IEEE 754 Machine Precision Floor (10^-16)', padLeft + 10, yMach - 6);

    // 1. Draw Series Error Curve (Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < seriesPoints.length; i++) {
      const x = padLeft + (i / (seriesPoints.length - 1)) * chartW;
      const y = getY(seriesPoints[i].logErr);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < seriesPoints.length; i++) {
      const x = padLeft + (i / (seriesPoints.length - 1)) * chartW;
      const y = getY(seriesPoints[i].logErr);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Simpson Error Curve (Emerald)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < simpsonPoints.length; i++) {
      const x = padLeft + (i / (simpsonPoints.length - 1)) * chartW;
      const y = getY(simpsonPoints[i].logErr);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    for (let i = 0; i < simpsonPoints.length; i++) {
      const x = padLeft + (i / (simpsonPoints.length - 1)) * chartW;
      const y = getY(simpsonPoints[i].logErr);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legend
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 10, padTop + 10, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Power Series Error vs K', padLeft + 25, padTop + 13);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(padLeft + 180, padTop + 10, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Simpson Quadrature Error vs N', padLeft + 195, padTop + 13);
  }

  // =========================================================================
  // EXECUTION SPEED BENCHMARK RUNNER
  // =========================================================================

  function runBenchmarkSuite() {
    const Engine = getEngine();
    if (!Engine || !Engine.benchmarkExecutionSpeed) return;

    elements.labelBenchmarkStatus.textContent = 'Running 100,000 evaluations...';
    elements.btnRunBenchmark.disabled = true;

    setTimeout(() => {
      const bench = Engine.benchmarkExecutionSpeed(100000);
      elements.btnRunBenchmark.disabled = false;
      elements.labelBenchmarkStatus.innerHTML = `
        <span style="color:#38bdf8;">Series: ${Math.round(bench.series.opsPerSec).toLocaleString()} ops/s</span> &bull;
        <span style="color:#10b981;">Simpson: ${Math.round(bench.simpson.opsPerSec).toLocaleString()} ops/s</span> &bull;
        <span style="color:#fbbf24;">A&S: ${Math.round(bench.abramowitzStegun.opsPerSec).toLocaleString()} ops/s</span> &bull;
        <span style="color:#a855f7;">Erf: ${Math.round(bench.erfAnalytical.opsPerSec).toLocaleString()} ops/s</span>
      `;
    }, 40);
  }

  // =========================================================================
  // REPORT MARKDOWN LOADER & BULLETPROOF KATEX PIPELINE
  // =========================================================================

  function loadReportMarkdown() {
    fetch('Homework5_Report.md')
      .then(res => {
        if (!res.ok) throw new Error("Could not load Homework5_Report.md");
        return res.text();
      })
      .then(md => {
        // Step 1: Extract and protect display math $$ ... $$
        const displayMath = [];
        let cleanMd = md.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
          const id = `@@DISPLAYMATH${displayMath.length}@@`;
          displayMath.push(math.trim());
          return `\n\n${id}\n\n`;
        });

        // Step 2: Extract and protect inline math $ ... $
        const inlineMath = [];
        cleanMd = cleanMd.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, math) => {
          const id = `@@INLINEMATH${inlineMath.length}@@`;
          inlineMath.push(math.trim());
          return `${prefix}${id}`;
        });

        // Step 3: Run marked parser on protected markdown
        let html = (typeof marked !== 'undefined') ? marked.parse(cleanMd) : `<pre>${cleanMd}</pre>`;

        // Step 4: Render display math with KaTeX directly
        displayMath.forEach((math, i) => {
          const id = `@@DISPLAYMATH${i}@@`;
          let rendered;
          if (typeof katex !== 'undefined') {
            try {
              rendered = `<div class="katex-display" style="margin:16px 0; overflow-x:auto;">${katex.renderToString(math, { displayMode: true, throwOnError: false })}</div>`;
            } catch (err) {
              rendered = `<div class="katex-display" style="margin:16px 0;">$$${math}$$</div>`;
            }
          } else {
            rendered = `<div class="katex-display" style="margin:16px 0;">$$${math}$$</div>`;
          }
          const pRegex = new RegExp(`<p>\\s*${id}\\s*<\\/p>`, 'g');
          if (pRegex.test(html)) {
            html = html.replace(pRegex, rendered);
          } else {
            html = html.replaceAll(id, rendered);
          }
        });

        // Step 5: Render inline math with KaTeX directly
        inlineMath.forEach((math, i) => {
          const id = `@@INLINEMATH${i}@@`;
          let rendered;
          if (typeof katex !== 'undefined') {
            try {
              rendered = katex.renderToString(math, { displayMode: false, throwOnError: false });
            } catch (err) {
              rendered = `$${math}$`;
            }
          } else {
            rendered = `$${math}$`;
          }
          html = html.replaceAll(id, rendered);
        });

        elements.reportContainer.innerHTML = html;

        // Step 6: Final safety pass with renderMathInElement
        if (typeof renderMathInElement !== 'undefined') {
          renderMathInElement(elements.reportContainer, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });
        }
      })
      .catch(err => {
        console.warn("Report markdown fetch fallback:", err);
        elements.reportContainer.innerHTML = `
          <p style="color:#94a3b8;">
            Please ensure <code>Homework5_Report.md</code> is placed alongside <code>index.html</code>.
          </p>
        `;
      });
  }

  // Auto boot
  window.addEventListener('DOMContentLoaded', init);
})();

