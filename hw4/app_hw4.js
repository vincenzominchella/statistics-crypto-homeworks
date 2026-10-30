/**
 * ============================================================================
 * Application Controller - Homework 4 Suite
 * Welford's Recurrence, Sampling Distributions & Statistical Inference
 * ============================================================================
 */

(function() {
  'use strict';

  // Application State
  const state = {
    n: 100,
    m: 200,
    distType: 'binomial',
    p: 0.40,
    viewMode: 'means', // 'means', 'vars', 'scores', 'synced'
    cancelOffsetExp: 9, // 10^9
    simResult: null,
    sweepResult: null
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
    elements.statGrandMean = document.getElementById('stat-grand-mean');
    elements.statGrandVar = document.getElementById('stat-grand-var');
    elements.statVarMean = document.getElementById('stat-var-mean');
    elements.statVarVar = document.getElementById('stat-var-var');
    elements.statSubMean = document.getElementById('stat-sub-mean');
    elements.statSubVar = document.getElementById('stat-sub-var');
    elements.statSubVarMean = document.getElementById('stat-sub-var-mean');
    elements.statSubVarVar = document.getElementById('stat-sub-var-var');

    // Ex 1 Cancellation Stress-Tester
    elements.sliderCancelOffset = document.getElementById('slider-cancel-offset');
    elements.badgeOffsetVal = document.getElementById('badge-offset-val');
    elements.badgeCancelStatus = document.getElementById('badge-cancel-status');
    elements.tbodyCancelResults = document.getElementById('tbody-cancel-results');

    // Ex 2 Controls
    elements.radioDists = document.querySelectorAll('input[name="radio-dist"]');
    elements.radioLabels = {
      binomial: document.getElementById('label-dist-binomial'),
      uniform: document.getElementById('label-dist-uniform'),
      cvss: document.getElementById('label-dist-cvss'),
      apt: document.getElementById('label-dist-apt')
    };
    elements.sliderN = document.getElementById('slider-n');
    elements.badgeNVal = document.getElementById('badge-n-val');
    elements.sliderM = document.getElementById('slider-m');
    elements.badgeMVal = document.getElementById('badge-m-val');
    elements.groupParamP = document.getElementById('group-param-p');
    elements.sliderP = document.getElementById('slider-p');
    elements.badgePVal = document.getElementById('badge-p-val');
    elements.btnRunSimulation = document.getElementById('btn-run-simulation');
    elements.simTheoreticalSummary = document.getElementById('sim-theoretical-summary');

    // Presets
    elements.btnPresetSmall = document.getElementById('btn-preset-small');
    elements.btnPresetStandard = document.getElementById('btn-preset-standard');
    elements.btnPresetDeep = document.getElementById('btn-preset-deep');
    elements.btnPresetAsymptote = document.getElementById('btn-preset-asymptote');

    // Trajectory Tabs & Containers
    elements.viewTabBtns = document.querySelectorAll('.view-tab-btn[data-view]');
    elements.containerSingleCanvas = document.getElementById('container-single-canvas');
    elements.containerSyncedCanvas = document.getElementById('container-synced-canvas');
    elements.badgeRenderedPaths = document.getElementById('badge-rendered-paths');

    // Canvases
    elements.canvasTrajectories = document.getElementById('canvas-trajectories');
    elements.canvasSyncMeans = document.getElementById('canvas-sync-means');
    elements.canvasSyncVars = document.getElementById('canvas-sync-vars');
    elements.canvasSyncScores = document.getElementById('canvas-sync-scores');
    elements.canvasHistMeans = document.getElementById('canvas-hist-means');
    elements.canvasHistVars = document.getElementById('canvas-hist-vars');
    elements.canvasHorizonSweep = document.getElementById('canvas-horizon-sweep');

    // Badges & Table
    elements.badgeUnbiasedMean = document.getElementById('badge-unbiased-mean');
    elements.badgeUnbiasedVar = document.getElementById('badge-unbiased-var');
    elements.tbodyEstimatorsVerification = document.getElementById('tbody-estimators-verification');
  }

  // =========================================================================
  // INITIALIZATION & EVENT DISPATCH
  // =========================================================================

  function init() {
    cacheDom();
    setupEventListeners();
    updateCancellationLab();
    runFullSimulation();
    loadReportMarkdown();

    // KaTeX render for page
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
    // Navigation Tabs
    elements.tabBtnLab.addEventListener('click', () => switchTab('tab-lab'));
    elements.tabBtnReport.addEventListener('click', () => switchTab('tab-report'));

    // Ex 1 Cancellation Slider
    elements.sliderCancelOffset.addEventListener('input', (e) => {
      state.cancelOffsetExp = parseInt(e.target.value, 10);
      const offsetVal = Math.pow(10, state.cancelOffsetExp);
      elements.badgeOffsetVal.textContent = state.cancelOffsetExp === 0
        ? 'C = 0 (Unshifted)'
        : `C = 10^${state.cancelOffsetExp} (${offsetVal.toLocaleString()})`;
      updateCancellationLab();
    });

    // Ex 2 Distribution Radios
    elements.radioDists.forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.distType = e.target.value;
        Object.keys(elements.radioLabels).forEach(k => {
          if (elements.radioLabels[k]) {
            elements.radioLabels[k].classList.toggle('selected', k === state.distType);
          }
        });
        if (state.distType === 'binomial') {
          elements.groupParamP.style.display = 'block';
        } else {
          elements.groupParamP.style.display = 'none';
        }
        runFullSimulation();
      });
    });

    // Sliders
    elements.sliderN.addEventListener('input', (e) => {
      state.n = parseInt(e.target.value, 10);
      elements.badgeNVal.textContent = `n = ${state.n}`;
      debounceSim();
    });

    elements.sliderM.addEventListener('input', (e) => {
      state.m = parseInt(e.target.value, 10);
      elements.badgeMVal.textContent = `m = ${state.m}`;
      debounceSim();
    });

    elements.sliderP.addEventListener('input', (e) => {
      state.p = parseFloat(e.target.value);
      elements.badgePVal.textContent = `p = ${state.p.toFixed(2)}`;
      debounceSim();
    });

    elements.btnRunSimulation.addEventListener('click', () => {
      runFullSimulation();
    });

    // Presets
    elements.btnPresetSmall.addEventListener('click', () => applyPreset(25, 50, 'binomial', 0.40));
    elements.btnPresetStandard.addEventListener('click', () => applyPreset(100, 200, 'binomial', 0.40));
    elements.btnPresetDeep.addEventListener('click', () => applyPreset(500, 500, 'cvss', 0.40));
    elements.btnPresetAsymptote.addEventListener('click', () => applyPreset(1200, 800, 'uniform', 0.40));

    // Trajectory View Tabs
    elements.viewTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.viewTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.getAttribute('data-view');
        updateTrajectoryView();
      });
    });

    // Window Resize Handler
    window.addEventListener('resize', debounce(() => {
      renderAllCanvases();
    }, 150));
  }

  function switchTab(targetId) {
    if (targetId === 'tab-lab') {
      elements.tabBtnLab.classList.add('active');
      elements.tabBtnReport.classList.remove('active');
      elements.tabLab.classList.add('active');
      elements.tabReport.classList.remove('active');
      renderAllCanvases();
    } else {
      elements.tabBtnLab.classList.remove('active');
      elements.tabBtnReport.classList.add('active');
      elements.tabLab.classList.remove('active');
      elements.tabReport.classList.add('active');
    }
  }

  function applyPreset(n, m, distType, p) {
    state.n = n;
    state.m = m;
    state.distType = distType;
    state.p = p;

    elements.sliderN.value = n;
    elements.badgeNVal.textContent = `n = ${n}`;
    elements.sliderM.value = m;
    elements.badgeMVal.textContent = `m = ${m}`;
    elements.sliderP.value = p;
    elements.badgePVal.textContent = `p = ${p.toFixed(2)}`;

    elements.radioDists.forEach(r => {
      r.checked = r.value === distType;
    });
    Object.keys(elements.radioLabels).forEach(k => {
      if (elements.radioLabels[k]) {
        elements.radioLabels[k].classList.toggle('selected', k === distType);
      }
    });
    elements.groupParamP.style.display = distType === 'binomial' ? 'block' : 'none';

    runFullSimulation();
  }

  let simDebounceTimer = null;
  function debounceSim() {
    clearTimeout(simDebounceTimer);
    simDebounceTimer = setTimeout(() => {
      runFullSimulation();
    }, 120);
  }

  function debounce(fn, ms) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // =========================================================================
  // EXERCISE 1: NUMERICAL STABILITY & CANCELLATION BENCHMARK
  // =========================================================================

  function updateCancellationLab() {
    const offset = Math.pow(10, state.cancelOffsetExp);
    const test = WelfordEngine.runCatastrophicCancellationTest(offset, 100);

    const naiveFailed = test.naiveFailed;
    elements.badgeCancelStatus.textContent = naiveFailed ? 'Cancellation Failure in Naive Formula' : 'Both Formulations Stable';
    elements.badgeCancelStatus.className = naiveFailed ? 'card-badge badge-rose' : 'card-badge badge-emerald';

    const fmt = (v) => Math.abs(v) > 1e6 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(5) : v.toFixed(6);

    elements.tbodyCancelResults.innerHTML = `
      <tr>
        <td class="strong" style="color:#cbd5e1;">Ground Truth Analytic</td>
        <td><code>${fmt(test.trueVariance)}</code></td>
        <td style="color:#94a3b8;">0.000000</td>
        <td><span class="card-badge badge-cyan">Exact Ground Truth</span></td>
      </tr>
      <tr>
        <td class="strong" style="color:#34d399;">Welford's Algorithm (3-Line)</td>
        <td style="color:#34d399; font-weight:700;"><code>${fmt(test.welfordVariance)}</code></td>
        <td style="color:#34d399;">${fmt(test.welfordError)}</td>
        <td><span class="card-badge badge-emerald">Optimal 64-bit Stability</span></td>
      </tr>
      <tr>
        <td class="strong" style="color:#f43f5e;">Textbook Naive Formula</td>
        <td style="color:#f43f5e; font-weight:700;"><code>${fmt(test.naiveVariance)}</code></td>
        <td style="color:#f43f5e;">${fmt(test.naiveError)}</td>
        <td>
          <span class="card-badge ${naiveFailed ? 'badge-rose' : 'badge-amber'}">
            ${naiveFailed ? (test.naiveVariance < 0 ? 'Catastrophic Negative Var!' : 'Loss of Precision') : 'Accurate at Low Offset'}
          </span>
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // EXERCISE 2: STOCHASTIC SIMULATION & METRIC UPDATES
  // =========================================================================

  function runFullSimulation() {
    const distParams = state.distType === 'binomial' ? { p: state.p } : {};
    
    // Simulate multi-hacker ensemble
    state.simResult = WelfordEngine.simulateHackerEnsemble({
      n: state.n,
      m: state.m,
      distType: state.distType,
      distParams,
      maxRenderPaths: 30
    });

    // Compute multi-horizon sweep
    state.sweepResult = WelfordEngine.evaluateMultiHorizonSweep(
      Math.min(state.m, 200),
      state.distType,
      distParams
    );

    updateStatCards();
    updateEstimatorsTable();
    renderAllCanvases();
  }

  function updateStatCards() {
    const sim = state.simResult;
    if (!sim) return;

    const { results, theoretical, config } = sim;

    elements.statGrandMean.textContent = results.grandAverageMean.toFixed(3);
    elements.statGrandVar.textContent = results.grandAverageVariance.toFixed(3);
    elements.statVarMean.textContent = results.empiricalVarOfMeans.toFixed(4);
    elements.statVarVar.textContent = results.empiricalVarOfVars.toFixed(4);

    elements.statSubMean.textContent = `Theoretical μ = ${theoretical.mu.toFixed(2)} • Bias Δ = ${Math.abs(results.biasOfMean).toFixed(4)}`;
    elements.statSubVar.textContent = `Theoretical σ² = ${theoretical.variance.toFixed(2)} • Bias Δ = ${Math.abs(results.biasOfVariance).toFixed(4)}`;
    elements.statSubVarMean.textContent = `Th: σ²/n = ${(theoretical.varOfMeans).toFixed(4)} (SE: ${Math.sqrt(theoretical.varOfMeans).toFixed(3)})`;
    elements.statSubVarVar.textContent = `Th: Var(s²) = ${(theoretical.varOfVars).toFixed(4)} • O(1/n)`;

    elements.badgeRenderedPaths.textContent = `Rendered: ${Math.min(config.m, 30)} / ${config.m} Paths`;
    elements.simTheoreticalSummary.textContent = 
      `Theoretical: μ = ${theoretical.mu.toFixed(2)} • σ² = ${theoretical.variance.toFixed(2)} • σ = ${theoretical.std.toFixed(2)} • Systems n = ${config.n} • Hackers m = ${config.m}`;

    elements.badgeUnbiasedMean.textContent = `M̄_n = ${results.grandAverageMean.toFixed(3)} ≈ μ (Unbiased)`;
    elements.badgeUnbiasedVar.textContent = `V̄_n = ${results.grandAverageVariance.toFixed(3)} ≈ σ² (Unbiased)`;
  }

  function updateEstimatorsTable() {
    const sim = state.simResult;
    if (!sim) return;

    const { results, theoretical, config } = sim;

    const rows = [
      {
        name: 'Sampling Mean (x̄_n)',
        def: 'x̄_n = (1/n) ∑ X_i',
        target: `μ = ${theoretical.mu.toFixed(3)}`,
        grand: results.grandAverageMean.toFixed(4),
        bias: `${results.biasOfMean >= 0 ? '+' : ''}${results.biasOfMean.toFixed(4)} (${(results.relativeErrorMean * 100).toFixed(2)}%)`,
        empVar: results.empiricalVarOfMeans.toFixed(5),
        thLaw: `σ²/n = ${theoretical.varOfMeans.toFixed(5)}`,
        verdict: results.isMeanUnbiased ? 'Unbiased Estimator' : 'Close Asymptotic Alignment',
        verdictBadge: 'badge-emerald'
      },
      {
        name: 'Sampling Variance (s_n²)',
        def: 's_n² = M_2,n / (n - 1)',
        target: `σ² = ${theoretical.variance.toFixed(3)}`,
        grand: results.grandAverageVariance.toFixed(4),
        bias: `${results.biasOfVariance >= 0 ? '+' : ''}${results.biasOfVariance.toFixed(4)} (${(results.relativeErrorVar * 100).toFixed(2)}%)`,
        empVar: results.empiricalVarOfVars.toFixed(5),
        thLaw: `(1/n)[μ₄ - ((n-3)/(n-1))σ⁴] = ${theoretical.varOfVars.toFixed(5)}`,
        verdict: results.isVarUnbiased ? 'Unbiased Estimator (Bessel n-1)' : 'Close Asymptotic Alignment',
        verdictBadge: 'badge-emerald'
      }
    ];

    elements.tbodyEstimatorsVerification.innerHTML = rows.map(r => `
      <tr>
        <td class="strong">${r.name}</td>
        <td><code>${r.def}</code></td>
        <td style="color:#cbd5e1;">${r.target}</td>
        <td style="color:#38bdf8; font-weight:700;">${r.grand}</td>
        <td style="color:#a855f7; font-family:var(--font-mono);">${r.bias}</td>
        <td style="color:#34d399; font-weight:600;">${r.empVar}</td>
        <td style="color:#94a3b8; font-family:var(--font-mono); font-size:0.75rem;">${r.thLaw}</td>
        <td><span class="card-badge ${r.verdictBadge}">${r.verdict}</span></td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // CANVAS RENDERING SUITE
  // =========================================================================

  function renderAllCanvases() {
    updateTrajectoryView();
    drawHistogramMeans();
    drawHistogramVars();
    drawHorizonSweep();
  }

  function updateTrajectoryView() {
    if (state.viewMode === 'synced') {
      elements.containerSingleCanvas.style.display = 'none';
      elements.containerSyncedCanvas.style.display = 'grid';
      drawTrajectoriesCanvas(elements.canvasSyncMeans, 'means', true);
      drawTrajectoriesCanvas(elements.canvasSyncVars, 'vars', true);
      drawTrajectoriesCanvas(elements.canvasSyncScores, 'scores', true);
    } else {
      elements.containerSingleCanvas.style.display = 'block';
      elements.containerSyncedCanvas.style.display = 'none';
      drawTrajectoriesCanvas(elements.canvasTrajectories, state.viewMode, false);
    }
  }

  /**
   * Multi-trajectory canvas renderer for Means, Variances, or Raw Scores
   */
  function drawTrajectoriesCanvas(canvas, mode, isCompact = false) {
    if (!canvas || !canvas.getContext || !state.simResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { trajectories, theoretical, config } = state.simResult;
    const n = config.n;
    const paths = trajectories[mode];
    const numPaths = paths.length;

    const padLeft = isCompact ? 36 : 56;
    const padRight = isCompact ? 16 : 24;
    const padTop = isCompact ? 22 : 28;
    const padBottom = isCompact ? 28 : 36;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Y Axis Range
    let minY = 0;
    let maxY = 10;

    if (mode === 'means') {
      minY = Math.max(0, theoretical.mu - 2.8 * (theoretical.std || 1));
      maxY = Math.min(10, theoretical.mu + 2.8 * (theoretical.std || 1));
    } else if (mode === 'vars') {
      minY = 0;
      maxY = Math.max(theoretical.variance * 2.2, 5);
    } else { // scores
      minY = 0;
      maxY = 10;
    }

    function getX(k) {
      return padLeft + (k / n) * chartW;
    }
    function getY(v) {
      return padTop + chartH - ((v - minY) / (maxY - minY || 1)) * chartH;
    }

    // Grid Lines & Y Ticks
    const yTicks = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= yTicks; i++) {
      const val = minY + (i / yTicks) * (maxY - minY);
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = isCompact ? '9px Fira Code, monospace' : '10px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), padLeft - 6, y + 3);
    }

    // X Ticks
    const xTicks = isCompact ? 3 : 5;
    for (let i = 0; i <= xTicks; i++) {
      const step = Math.floor((i / xTicks) * n);
      const x = getX(step);
      ctx.beginPath();
      ctx.moveTo(x, padTop + chartH);
      ctx.lineTo(x, padTop + chartH + 4);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = isCompact ? '9px Fira Code, monospace' : '10px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`k=${step}`, x, h - (isCompact ? 8 : 12));
    }

    // Draw Theoretical Confidence Envelope Bands (for means: mu +- 2*sigma/sqrt(k))
    if (mode === 'means') {
      const envSteps = state.simResult.envelope.steps;
      if (envSteps.length > 1) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.beginPath();
        for (let i = 0; i < envSteps.length; i++) {
          const k = envSteps[i];
          const se = theoretical.std / Math.sqrt(k);
          const top = Math.min(maxY, theoretical.mu + 2 * se);
          const x = getX(k);
          const yTop = getY(top);
          if (i === 0) ctx.moveTo(x, yTop);
          else ctx.lineTo(x, yTop);
        }
        for (let i = envSteps.length - 1; i >= 0; i--) {
          const k = envSteps[i];
          const se = theoretical.std / Math.sqrt(k);
          const bot = Math.max(minY, theoretical.mu - 2 * se);
          const x = getX(k);
          const yBot = getY(bot);
          ctx.lineTo(x, yBot);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw Individual Paths
    const pathPalette = [
      'rgba(56, 189, 248, 0.40)',
      'rgba(168, 85, 247, 0.40)',
      'rgba(16, 185, 129, 0.40)',
      'rgba(245, 158, 11, 0.40)',
      'rgba(244, 63, 94, 0.40)'
    ];

    ctx.lineWidth = isCompact ? 1 : 1.2;
    for (let j = 0; j < numPaths; j++) {
      ctx.strokeStyle = pathPalette[j % pathPalette.length];
      const pData = paths[j];
      ctx.beginPath();
      const startK = mode === 'vars' ? 2 : 1;
      for (let k = startK; k <= n; k++) {
        const x = getX(k);
        const y = getY(pData[k]);
        if (k === startK) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Theoretical Target Horizontal Line
    const targetVal = mode === 'means' ? theoretical.mu : (mode === 'vars' ? theoretical.variance : theoretical.mu);
    const targetY = getY(targetVal);

    ctx.strokeStyle = mode === 'vars' ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(padLeft, targetY);
    ctx.lineTo(padLeft + chartW, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    if (!isCompact) {
      ctx.fillStyle = mode === 'vars' ? '#10b981' : '#38bdf8';
      ctx.fillRect(padLeft + 10, padTop - 14, 12, 3);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(mode === 'means' ? `Theoretical Mean μ = ${theoretical.mu.toFixed(2)}` : (mode === 'vars' ? `Theoretical Variance σ² = ${theoretical.variance.toFixed(2)}` : `Mean μ = ${theoretical.mu.toFixed(2)}`), padLeft + 26, padTop - 11);
    }
  }

  /**
   * Density Histogram for Sampling Means x̄_n
   */
  function drawHistogramMeans() {
    const canvas = elements.canvasHistMeans;
    if (!canvas || !canvas.getContext || !state.simResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { histograms, theoretical, results } = state.simResult;
    const hist = histograms.means;

    const padLeft = 48;
    const padRight = 20;
    const padTop = 26;
    const padBottom = 34;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const maxDensity = Math.max(...hist.densities, WelfordEngine.normalPdf(theoretical.mu, theoretical.mu, theoretical.stdOfMeans) * 1.15);

    function getX(val) {
      return padLeft + ((val - hist.min) / (hist.max - hist.min || 1)) * chartW;
    }
    function getY(density) {
      return padTop + chartH - (density / maxDensity) * chartH;
    }

    // Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (i / 3) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();
    }

    // Histogram Bars
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;

    for (let b = 0; b < hist.binCenters.length; b++) {
      const center = hist.binCenters[b];
      const density = hist.densities[b];
      const xLeft = getX(center - hist.binWidth / 2);
      const xRight = getX(center + hist.binWidth / 2);
      const barW = Math.max(1, xRight - xLeft - 1);
      const y = getY(density);
      const barH = padTop + chartH - y;

      ctx.fillRect(xLeft, y, barW, barH);
      ctx.strokeRect(xLeft, y, barW, barH);
    }

    // Overlaid Theoretical Normal Bell Curve N(mu, sigma^2/n)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const val = hist.min + (i / steps) * (hist.max - hist.min);
      const density = WelfordEngine.normalPdf(val, theoretical.mu, theoretical.stdOfMeans);
      const x = getX(val);
      const y = getY(density);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Vertical line for Grand Mean M̄_n
    const grandX = getX(results.grandAverageMean);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(grandX, padTop);
    ctx.lineTo(grandX, padTop + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // X Axis Labels
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const val = hist.min + (i / numTicks) * (hist.max - hist.min);
      const x = getX(val);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(2), x, h - 10);
    }

    // Legend
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 10, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Empirical Means', padLeft + 24, padTop - 11);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(padLeft + 130, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Theoretical N(μ, σ²/n)`, padLeft + 144, padTop - 11);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(padLeft + 280, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Grand Mean M̄_n = ${results.grandAverageMean.toFixed(2)}`, padLeft + 294, padTop - 11);
  }

  /**
   * Density Histogram for Sampling Variances s_n^2
   */
  function drawHistogramVars() {
    const canvas = elements.canvasHistVars;
    if (!canvas || !canvas.getContext || !state.simResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { histograms, theoretical, results } = state.simResult;
    const hist = histograms.vars;

    const padLeft = 48;
    const padRight = 20;
    const padTop = 26;
    const padBottom = 34;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const maxDensity = Math.max(...hist.densities) * 1.15;

    function getX(val) {
      return padLeft + ((val - hist.min) / (hist.max - hist.min || 1)) * chartW;
    }
    function getY(density) {
      return padTop + chartH - (density / maxDensity) * chartH;
    }

    // Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (i / 3) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();
    }

    // Histogram Bars
    ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.2;

    for (let b = 0; b < hist.binCenters.length; b++) {
      const center = hist.binCenters[b];
      const density = hist.densities[b];
      const xLeft = getX(center - hist.binWidth / 2);
      const xRight = getX(center + hist.binWidth / 2);
      const barW = Math.max(1, xRight - xLeft - 1);
      const y = getY(density);
      const barH = padTop + chartH - y;

      ctx.fillRect(xLeft, y, barW, barH);
      ctx.strokeRect(xLeft, y, barW, barH);
    }

    // Target Theoretical Variance line
    const thX = getX(theoretical.variance);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(thX, padTop);
    ctx.lineTo(thX, padTop + chartH);
    ctx.stroke();

    // Grand Average Variance line
    const grandX = getX(results.grandAverageVariance);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(grandX, padTop);
    ctx.lineTo(grandX, padTop + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // X Axis Labels
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const val = hist.min + (i / numTicks) * (hist.max - hist.min);
      const x = getX(val);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(2), x, h - 10);
    }

    // Legend
    ctx.fillStyle = '#34d399';
    ctx.fillRect(padLeft + 10, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Sample Variances s²', padLeft + 24, padTop - 11);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(padLeft + 160, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Target σ² = ${theoretical.variance.toFixed(2)}`, padLeft + 174, padTop - 11);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 290, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Grand V̄_n = ${results.grandAverageVariance.toFixed(2)}`, padLeft + 304, padTop - 11);
  }

  /**
   * Multi-Horizon Sweep Canvas: How increasing n collapses estimator variability
   */
  function drawHorizonSweep() {
    const canvas = elements.canvasHorizonSweep;
    if (!canvas || !canvas.getContext || !state.sweepResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const sweep = state.sweepResult.sweep;
    const maxN = sweep[sweep.length - 1].n;

    const padLeft = 48;
    const padRight = 20;
    const padTop = 26;
    const padBottom = 34;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const maxVar = Math.max(
      ...sweep.map(s => s.empiricalVarM),
      ...sweep.map(s => s.empiricalVarV),
      ...sweep.map(s => s.theoreticalVarM),
      ...sweep.map(s => s.theoreticalVarV)
    ) * 1.08;

    function getX(n) {
      return padLeft + (Math.log10(n) / Math.log10(maxN)) * chartW;
    }
    function getY(v) {
      return padTop + chartH - (v / (maxVar || 1)) * chartH;
    }

    // Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = (maxVar * i) / 4;
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(3), padLeft - 6, y + 3);
    }

    // X Ticks (Log scale labels)
    for (let s of sweep) {
      const x = getX(s.n);
      ctx.beginPath();
      ctx.moveTo(x, padTop + chartH);
      ctx.lineTo(x, padTop + chartH + 4);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.n.toString(), x, h - 10);
    }

    // 1. Theoretical Var(x̄_n) = sigma^2 / n (Cyan Dashed)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < sweep.length; i++) {
      const x = getX(sweep[i].n);
      const y = getY(sweep[i].theoreticalVarM);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Empirical Var(x̄_n) (Cyan Solid + Dots)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < sweep.length; i++) {
      const x = getX(sweep[i].n);
      const y = getY(sweep[i].empiricalVarM);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    for (let s of sweep) {
      ctx.beginPath();
      ctx.arc(getX(s.n), getY(s.empiricalVarM), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Theoretical Var(s_n^2) (Purple Dashed)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < sweep.length; i++) {
      const x = getX(sweep[i].n);
      const y = getY(sweep[i].theoreticalVarV);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Empirical Var(s_n^2) (Purple Solid + Dots)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < sweep.length; i++) {
      const x = getX(sweep[i].n);
      const y = getY(sweep[i].empiricalVarV);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    for (let s of sweep) {
      ctx.beginPath();
      ctx.arc(getX(s.n), getY(s.empiricalVarV), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legend
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 10, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Var(x̄_n) ~ σ²/n', padLeft + 24, padTop - 11);

    ctx.fillStyle = '#c084fc';
    ctx.fillRect(padLeft + 140, padTop - 14, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Var(s_n²) ~ O(1/n)', padLeft + 154, padTop - 11);
  }

  // =========================================================================
  // REPORT MARKDOWN LOADER & KATEX RENDERER
  // =========================================================================

  function loadReportMarkdown() {
    fetch('Homework4_Report.md')
      .then(res => {
        if (!res.ok) throw new Error("Could not load Homework4_Report.md");
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
            Please ensure <code>Homework4_Report.md</code> is placed alongside <code>index.html</code>.
          </p>
        `;
      });
  }

  // Auto boot
  window.addEventListener('DOMContentLoaded', init);
})();

