/**
 * Homework 3: Interactive UI Coordinator & Canvas Visualization Suite
 * Stochastic Process Trajectories, Moment Envelopes, LLN Convergence,
 * CLT Histogram & QQ-Plot, Cyber Security Metrics, and KaTeX Report Loader.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    n: 500,
    m: 200,
    modelType: 'rademacher', // 'rademacher' or 'bernoulli'
    p: 0.50,
    viewMode: 'total',       // 'total', 'average', 'normalized', 'synced'
    epsilon: 0.05,
    simResult: null,
    cltResult: null,
    llnResult: null,
    secResult: null
  };

  // DOM Elements cache
  const elements = {};

  function cacheDom() {
    elements.tabBtnLab = document.getElementById('tab-btn-lab');
    elements.tabBtnReport = document.getElementById('tab-btn-report');
    elements.tabLab = document.getElementById('tab-lab');
    elements.tabReport = document.getElementById('tab-report');
    elements.reportContainer = document.getElementById('report-rendered-markdown');

    // Controls
    elements.radioModelTypes = document.querySelectorAll('input[name="radio-model-type"]');
    elements.bernoulliPGroup = document.getElementById('bernoulli-p-group');
    elements.sliderP = document.getElementById('slider-p');
    elements.badgePVal = document.getElementById('badge-p-val');
    elements.sliderN = document.getElementById('slider-n');
    elements.badgeNVal = document.getElementById('badge-n-val');
    elements.sliderM = document.getElementById('slider-m');
    elements.badgeMVal = document.getElementById('badge-m-val');
    elements.sliderEpsilon = document.getElementById('slider-epsilon');
    elements.badgeEpsilonVal = document.getElementById('badge-epsilon-val');
    elements.btnRunSimulation = document.getElementById('btn-run-simulation');

    // Presets
    elements.btnPresetSmall = document.getElementById('btn-preset-small');
    elements.btnPresetRademacher = document.getElementById('btn-preset-rademacher');
    elements.btnPresetClt = document.getElementById('btn-preset-clt');
    elements.btnPresetDeep = document.getElementById('btn-preset-deep');

    // View Tabs & Containers
    elements.viewTabBtns = document.querySelectorAll('.view-tab-btn');
    elements.containerSingleCanvas = document.getElementById('container-single-canvas');
    elements.containerSyncedCanvas = document.getElementById('container-synced-canvas');

    // Canvases
    elements.canvasTrajectories = document.getElementById('canvas-trajectories');
    elements.canvasSyncTotal = document.getElementById('canvas-sync-total');
    elements.canvasSyncAvg = document.getElementById('canvas-sync-avg');
    elements.canvasSyncNorm = document.getElementById('canvas-sync-norm');
    elements.canvasCltHistogram = document.getElementById('canvas-clt-histogram');
    elements.canvasQqPlot = document.getElementById('canvas-qq-plot');
    elements.canvasLlnVarianceDecay = document.getElementById('canvas-lln-variance-decay');

    // Stats & Badges
    elements.statVarTotal = document.getElementById('stat-var-total');
    elements.statVarAvg = document.getElementById('stat-var-avg');
    elements.statVarNorm = document.getElementById('stat-var-norm');
    elements.simTheoreticalSummary = document.getElementById('sim-theoretical-summary');
    elements.badgeRenderedPaths = document.getElementById('badge-rendered-paths');
    elements.badgeCltKs = document.getElementById('badge-clt-ks');
    elements.badgeCltBe = document.getElementById('badge-clt-be');
    elements.badgeLlnProb = document.getElementById('badge-lln-prob');
    elements.tbodyMomentsComparison = document.getElementById('tbody-moments-comparison');

    // Security stat cards
    elements.secStatN = document.getElementById('sec-stat-n');
    elements.secStatM = document.getElementById('sec-stat-m');
    elements.secStatWorst = document.getElementById('sec-stat-worst');
    elements.secStatAvg = document.getElementById('sec-stat-avg');
    elements.badgeSecurityStatus = document.getElementById('badge-security-status');
  }

  // =========================================================================
  // INITIALIZATION & EVENT LISTENERS
  // =========================================================================

  function init() {
    cacheDom();
    setupEventListeners();
    runFullSimulation();
    loadReportMarkdown();
  }

  function setupEventListeners() {
    // Navigation Tabs
    elements.tabBtnLab.addEventListener('click', () => switchTab('tab-lab'));
    elements.tabBtnReport.addEventListener('click', () => switchTab('tab-report'));

    // Model Type Radios
    elements.radioModelTypes.forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.modelType = e.target.value;
        if (state.modelType === 'bernoulli') {
          elements.bernoulliPGroup.style.display = 'block';
        } else {
          elements.bernoulliPGroup.style.display = 'none';
        }
        runFullSimulation();
      });
    });

    // Sliders
    elements.sliderP.addEventListener('input', (e) => {
      state.p = parseFloat(e.target.value);
      elements.badgePVal.textContent = `p = ${state.p.toFixed(2)}`;
      runFullSimulation();
    });

    elements.sliderN.addEventListener('input', (e) => {
      state.n = parseInt(e.target.value, 10);
      elements.badgeNVal.textContent = `n = ${state.n}`;
      runFullSimulation();
    });

    elements.sliderM.addEventListener('input', (e) => {
      state.m = parseInt(e.target.value, 10);
      elements.badgeMVal.textContent = `m = ${state.m}`;
      runFullSimulation();
    });

    elements.sliderEpsilon.addEventListener('input', (e) => {
      state.epsilon = parseFloat(e.target.value);
      elements.badgeEpsilonVal.textContent = `ε = ${state.epsilon.toFixed(2)}`;
      updateLlnSection();
    });

    // Presets
    elements.btnPresetSmall.addEventListener('click', () => {
      setPreset(50, 30, 'rademacher', 0.5);
    });
    elements.btnPresetRademacher.addEventListener('click', () => {
      setPreset(500, 200, 'rademacher', 0.5);
    });
    elements.btnPresetClt.addEventListener('click', () => {
      setPreset(1000, 500, 'rademacher', 0.5);
    });
    elements.btnPresetDeep.addEventListener('click', () => {
      setPreset(2500, 1000, 'bernoulli', 0.4);
    });

    // Re-simulate button
    elements.btnRunSimulation.addEventListener('click', () => {
      runFullSimulation();
    });

    // Trajectory View Tabs
    elements.viewTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.viewTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.getAttribute('data-view');
        updateTrajectoryView();
      });
    });

    // Resize handler for Canvas responsiveness
    window.addEventListener('resize', debounce(() => {
      renderAllCanvases();
    }, 150));
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function setPreset(n, m, modelType, p) {
    state.n = n;
    state.m = m;
    state.modelType = modelType;
    state.p = p;

    elements.sliderN.value = n;
    elements.badgeNVal.textContent = `n = ${n}`;
    elements.sliderM.value = m;
    elements.badgeMVal.textContent = `m = ${m}`;
    elements.sliderP.value = p;
    elements.badgePVal.textContent = `p = ${p.toFixed(2)}`;

    elements.radioModelTypes.forEach(r => {
      r.checked = r.value === modelType;
    });
    elements.bernoulliPGroup.style.display = modelType === 'bernoulli' ? 'block' : 'none';

    runFullSimulation();
  }

  function switchTab(targetId) {
    if (targetId === 'tab-lab') {
      elements.tabBtnLab.classList.add('active');
      elements.tabBtnReport.classList.remove('active');
      elements.tabLab.style.display = 'block';
      elements.tabReport.style.display = 'none';
      renderAllCanvases();
    } else {
      elements.tabBtnLab.classList.remove('active');
      elements.tabBtnReport.classList.add('active');
      elements.tabLab.style.display = 'none';
      elements.tabReport.style.display = 'block';
    }
  }

  // =========================================================================
  // CORE SIMULATION PIPELINE
  // =========================================================================

  function runFullSimulation() {
    // 1. Run Ensemble Simulation
    state.simResult = StochasticEngine.simulateEnsemble({
      n: state.n,
      m: state.m,
      modelType: state.modelType,
      p: state.p,
      maxRenderPaths: 35
    });

    // 2. Evaluate CLT Normality
    state.cltResult = StochasticEngine.evaluateCltNormality(state.simResult, 24);

    // 3. Evaluate LLN Convergence
    state.llnResult = StochasticEngine.evaluateLlnConvergence(state.simResult, state.epsilon);

    // 4. Evaluate Cyber Security Metrics
    state.secResult = StochasticEngine.evaluateCyberSecurityMetrics(state.simResult);

    // Update UI components
    updateSummaryStats();
    updateMomentsTable();
    updateLlnSection();
    updateCyberSecuritySection();
    renderAllCanvases();
  }

  function updateSummaryStats() {
    const { theoretical, config, stats } = state.simResult;
    const isRademacher = config.modelType === 'rademacher';

    elements.statVarTotal.textContent = `${stats.total.variance.toFixed(1)}`;
    elements.statVarAvg.textContent = `${stats.average.variance.toFixed(5)}`;
    elements.statVarNorm.textContent = `${stats.normalized.variance.toFixed(3)}`;

    const modelLabel = isRademacher ? 'Rademacher {-1, +1}' : `Bernoulli {0, 1} (p=${config.p.toFixed(2)})`;
    elements.simTheoreticalSummary.innerHTML = `
      Model: <span class="val-success">${modelLabel}</span> &bull; 
      &mu; = ${theoretical.mu.toFixed(2)} &bull; 
      &sigma;&sup2; = ${theoretical.variance.toFixed(2)} &bull; 
      &sigma; = ${theoretical.std.toFixed(2)} &bull;
      Horizon n = ${config.n} &bull; Attackers m = ${config.m}
    `;

    elements.badgeRenderedPaths.textContent = `Rendered: ${Math.min(config.m, 35)} / ${config.m} Paths`;
  }

  function updateMomentsTable() {
    const { theoretical, stats, config } = state.simResult;
    const n = config.n;

    const rows = [
      {
        name: 'Total Score',
        symbol: 'S<sub>n</sub> = &sum; X<sub>i</sub>',
        thMean: theoretical.total.mean.toFixed(2),
        empMean: stats.total.mean.toFixed(2),
        thVar: theoretical.total.variance.toFixed(1),
        empVar: stats.total.variance.toFixed(1),
        scaling: 'O(n) &bull; &sigma; &sim; &radic;n',
        law: 'Diffusive Random Walk'
      },
      {
        name: 'Average Score',
        symbol: 'S<sub>n</sub>/n = (1/n)&sum; X<sub>i</sub>',
        thMean: theoretical.average.mean.toFixed(3),
        empMean: stats.average.mean.toFixed(3),
        thVar: theoretical.average.variance.toFixed(5),
        empVar: stats.average.variance.toFixed(5),
        scaling: 'O(1/n) &rarr; 0',
        law: '<span class="card-badge badge-cyan">Law of Large Numbers (LLN)</span>'
      },
      {
        name: 'Normalized Score',
        symbol: 'S<sub>n</sub>/&radic;n = (1/&radic;n)&sum; X<sub>i</sub>',
        thMean: theoretical.normalized.mean.toFixed(2),
        empMean: stats.normalized.mean.toFixed(2),
        thVar: theoretical.normalized.variance.toFixed(3),
        empVar: stats.normalized.variance.toFixed(3),
        scaling: 'O(1) &equiv; &sigma;&sup2; (Invariant)',
        law: '<span class="card-badge badge-emerald">Central Limit Theorem (CLT)</span>'
      }
    ];

    elements.tbodyMomentsComparison.innerHTML = rows.map(r => `
      <tr>
        <td class="strong">${r.name}</td>
        <td><code>${r.symbol}</code></td>
        <td>${r.thMean}</td>
        <td style="color:#38bdf8; font-weight:600;">${r.empMean}</td>
        <td>${r.thVar}</td>
        <td style="color:#34d399; font-weight:600;">${r.empVar}</td>
        <td><span class="card-badge badge-amber">${r.scaling}</span></td>
        <td>${r.law}</td>
      </tr>
    `).join('');
  }

  function updateLlnSection() {
    state.llnResult = StochasticEngine.evaluateLlnConvergence(state.simResult, state.epsilon);
    const { empiricalProbWithin, chebyshevBound, epsilon, mu, n } = state.llnResult;

    elements.badgeLlnProb.textContent = `P(|S_n/n - ${mu.toFixed(2)}| < ${epsilon.toFixed(2)}) = ${(empiricalProbWithin * 100).toFixed(1)}%`;
    elements.badgeLlnProb.className = empiricalProbWithin > 0.85 ? 'card-badge badge-emerald' : 'card-badge badge-amber';

    drawLlnDecayChart();
  }

  function updateCyberSecuritySection() {
    const sec = state.secResult;
    elements.secStatN.textContent = sec.systemsCount;
    elements.secStatM.textContent = sec.attackersCount;
    elements.secStatWorst.textContent = (sec.worstCaseScore >= 0 ? '+' : '') + sec.worstCaseScore.toFixed(0);
    elements.secStatAvg.textContent = sec.averageBreachRate.toFixed(3);
    elements.badgeSecurityStatus.textContent = sec.securityStatus;

    if (sec.securityStatus.includes('Severely') || sec.securityStatus.includes('Risk')) {
      elements.badgeSecurityStatus.className = 'card-badge badge-rose';
    } else if (sec.securityStatus.includes('Hardened')) {
      elements.badgeSecurityStatus.className = 'card-badge badge-emerald';
    } else {
      elements.badgeSecurityStatus.className = 'card-badge badge-amber';
    }
  }

  // =========================================================================
  // CANVAS CHART RENDERING SUITE
  // =========================================================================

  function renderAllCanvases() {
    updateTrajectoryView();
    drawCltHistogram();
    drawQqPlot();
    drawLlnDecayChart();
  }

  function updateTrajectoryView() {
    if (state.viewMode === 'synced') {
      elements.containerSingleCanvas.style.display = 'none';
      elements.containerSyncedCanvas.style.display = 'grid';
      drawTrajectoriesCanvas(elements.canvasSyncTotal, 'total', true);
      drawTrajectoriesCanvas(elements.canvasSyncAvg, 'average', true);
      drawTrajectoriesCanvas(elements.canvasSyncNorm, 'normalized', true);
    } else {
      elements.containerSingleCanvas.style.display = 'block';
      elements.containerSyncedCanvas.style.display = 'none';
      drawTrajectoriesCanvas(elements.canvasTrajectories, state.viewMode, false);
    }
  }

  /**
   * Draws multi-path trajectories, theoretical expectation, and envelope bands
   */
  function drawTrajectoriesCanvas(canvas, mode, isCompact = false) {
    if (!canvas || !canvas.getContext || !state.simResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { trajectories, envelope, theoretical, config, stats } = state.simResult;
    const n = config.n;
    const paths = trajectories[mode];
    const numPaths = paths.length;

    const padLeft = isCompact ? 36 : 56;
    const padRight = isCompact ? 16 : 24;
    const padTop = isCompact ? 20 : 28;
    const padBottom = isCompact ? 28 : 36;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Determine Y range
    let minY = Infinity;
    let maxY = -Infinity;

    if (mode === 'total') {
      const stdMax = Math.sqrt(n * theoretical.variance);
      minY = Math.min(stats.total.min, theoretical.total.mean - 2.8 * stdMax);
      maxY = Math.max(stats.total.max, theoretical.total.mean + 2.8 * stdMax);
    } else if (mode === 'average') {
      minY = Math.min(stats.average.min, theoretical.mu - 0.4);
      maxY = Math.max(stats.average.max, theoretical.mu + 0.4);
      if (config.modelType === 'rademacher') {
        minY = Math.min(minY, -0.6);
        maxY = Math.max(maxY, 0.6);
      } else {
        minY = Math.max(0, minY);
        maxY = Math.min(1, maxY);
      }
    } else { // normalized
      const stdNorm = theoretical.std;
      minY = Math.min(stats.normalized.min, theoretical.normalized.mean - 3.2 * stdNorm);
      maxY = Math.max(stats.normalized.max, theoretical.normalized.mean + 3.2 * stdNorm);
    }

    // Coordinate converters
    function getX(step) {
      return padLeft + (step / n) * chartW;
    }
    function getY(val) {
      return padTop + chartH - ((val - minY) / (maxY - minY)) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const yTicks = 5;
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
      ctx.fillText(mode === 'average' ? val.toFixed(2) : val.toFixed(1), padLeft - 6, y + 3);
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

    // Draw Theoretical Confidence Envelope Bands (+- 1sigma and +- 2sigma)
    const envSteps = envelope.steps;
    if (envSteps.length > 1) {
      // Shaded 2-sigma region
      ctx.fillStyle = mode === 'average' ? 'rgba(56, 189, 248, 0.08)' : mode === 'normalized' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)';
      ctx.beginPath();
      for (let i = 0; i < envSteps.length; i++) {
        const k = envSteps[i];
        let thMean, thSigma;
        if (mode === 'total') {
          thMean = k * theoretical.mu;
          thSigma = Math.sqrt(k * theoretical.variance);
        } else if (mode === 'average') {
          thMean = theoretical.mu;
          thSigma = Math.sqrt(theoretical.variance / k);
        } else {
          thMean = Math.sqrt(k) * theoretical.mu;
          thSigma = theoretical.std;
        }
        const x = getX(k);
        const yTop = getY(thMean + 2 * thSigma);
        if (i === 0) ctx.moveTo(x, yTop);
        else ctx.lineTo(x, yTop);
      }
      for (let i = envSteps.length - 1; i >= 0; i--) {
        const k = envSteps[i];
        let thMean, thSigma;
        if (mode === 'total') {
          thMean = k * theoretical.mu;
          thSigma = Math.sqrt(k * theoretical.variance);
        } else if (mode === 'average') {
          thMean = theoretical.mu;
          thSigma = Math.sqrt(theoretical.variance / k);
        } else {
          thMean = Math.sqrt(k) * theoretical.mu;
          thSigma = theoretical.std;
        }
        const x = getX(k);
        const yBot = getY(thMean - 2 * thSigma);
        ctx.lineTo(x, yBot);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw individual sample paths
    const pathPalette = [
      'rgba(56, 189, 248, 0.35)',
      'rgba(168, 85, 247, 0.35)',
      'rgba(245, 158, 11, 0.35)',
      'rgba(16, 185, 129, 0.35)',
      'rgba(244, 63, 94, 0.35)'
    ];

    ctx.lineWidth = isCompact ? 1 : 1.2;
    for (let j = 0; j < numPaths; j++) {
      ctx.strokeStyle = pathPalette[j % pathPalette.length];
      const pData = paths[j];
      ctx.beginPath();
      for (let k = 0; k <= n; k++) {
        const x = getX(k);
        const y = getY(pData[k]);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Theoretical Mean Line (Dashed White)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    for (let k = 1; k <= n; k += Math.max(1, Math.floor(n / 100))) {
      let thMean = 0;
      if (mode === 'total') thMean = k * theoretical.mu;
      else if (mode === 'average') thMean = theoretical.mu;
      else thMean = Math.sqrt(k) * theoretical.mu;
      const x = getX(k);
      const y = getY(thMean);
      if (k === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Empirical Ensemble Mean Path (Solid Bright Line)
    const empMeanColor = mode === 'average' ? '#38bdf8' : mode === 'normalized' ? '#34d399' : '#fbbf24';
    ctx.strokeStyle = empMeanColor;
    ctx.lineWidth = isCompact ? 2 : 2.5;
    ctx.beginPath();
    for (let i = 0; i < envSteps.length; i++) {
      const k = envSteps[i];
      let empMean = 0;
      if (mode === 'total') empMean = envelope.meanTotal[i];
      else if (mode === 'average') empMean = envelope.meanAvg[i];
      else empMean = envelope.meanNorm[i];
      const x = getX(k);
      const y = getY(empMean);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Chart Title / Mode Label
    ctx.fillStyle = '#f1f5f9';
    ctx.font = isCompact ? 'bold 11px Outfit, sans-serif' : 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'left';
    const titleText = mode === 'total'
      ? 'Total Score S_k (Variance Grows as O(k))'
      : mode === 'average'
      ? 'Average Score S_k/k (Variance Collapses as O(1/k) -> LLN)'
      : 'Normalized Score S_k/√k (Invariant Variance O(1) -> CLT)';
    ctx.fillText(titleText, padLeft + 8, padTop - (isCompact ? 6 : 10));
  }

  /**
   * Draws the CLT Histogram of S_n / sqrt(n) with Gaussian curve overlay
   */
  function drawCltHistogram() {
    const canvas = elements.canvasCltHistogram;
    if (!canvas || !canvas.getContext || !state.cltResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { bins, targetMean, targetStd, ksStatistic, berryEsseenBound } = state.cltResult;
    const N = state.simResult.config.m;

    elements.badgeCltKs.textContent = `KS Stat: D = ${ksStatistic.toFixed(4)}`;
    elements.badgeCltBe.textContent = `Berry-Esseen: ≤ ${berryEsseenBound.toFixed(4)}`;

    const padLeft = 44;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 34;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const maxDensity = Math.max(
      ...bins.map(b => Math.max(b.density, b.theoreticalDensity)),
      0.45
    );

    const minX = bins[0].x0;
    const maxX = bins[bins.length - 1].x1;

    function getX(val) {
      return padLeft + ((val - minX) / (maxX - minX)) * chartW;
    }
    function getY(density) {
      return padTop + chartH - (density / maxDensity) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let p = 0; p <= maxDensity; p += 0.1) {
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(p.toFixed(2), padLeft - 6, y + 3);
    }

    // Draw Histogram Bins (Emerald)
    bins.forEach(b => {
      const x0 = getX(b.x0);
      const x1 = getX(b.x1);
      const bW = Math.max(1, x1 - x0 - 1);
      const bH = (b.density / maxDensity) * chartH;
      const y = padTop + chartH - bH;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
      ctx.fillRect(x0, y, bW, bH);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, y, bW, bH);
    });

    // Draw Continuous Theoretical Gaussian Curve phi(z) (Rose)
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const curveSteps = 120;
    for (let i = 0; i <= curveSteps; i++) {
      const val = minX + (i / curveSteps) * (maxX - minX);
      const density = StochasticEngine.normalPdf(val, targetMean, targetStd);
      const x = getX(val);
      const y = getY(density);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // X Labels
    for (let z = Math.ceil(minX); z <= Math.floor(maxX); z++) {
      const x = getX(z);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`z=${z}`, x, h - 10);
    }
  }

  /**
   * Draws Normal Q-Q Plot
   */
  function drawQqPlot() {
    const canvas = elements.canvasQqPlot;
    if (!canvas || !canvas.getContext || !state.cltResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { qqPoints, targetMean, targetStd } = state.cltResult;
    const padLeft = 44;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 34;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    let minCoord = -3.5;
    let maxCoord = 3.5;

    function getX(th) {
      return padLeft + ((th - minCoord) / (maxCoord - minCoord)) * chartW;
    }
    function getY(emp) {
      return padTop + chartH - ((emp - minCoord) / (maxCoord - minCoord)) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let c = -3; c <= 3; c++) {
      const x = getX(c);
      const y = getY(c);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + chartH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(c.toString(), padLeft - 6, y + 3);
      ctx.textAlign = 'center';
      ctx.fillText(c.toString(), x, h - 10);
    }

    // 45-degree Reference Line (y = x)
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(getX(minCoord), getY(minCoord));
    ctx.lineTo(getX(maxCoord), getY(maxCoord));
    ctx.stroke();

    // Plot Points (Cyan dots)
    ctx.fillStyle = '#38bdf8';
    qqPoints.forEach(pt => {
      const x = getX(pt.theoretical);
      const y = getY(pt.empirical);
      if (x >= padLeft && x <= padLeft + chartW && y >= padTop && y <= padTop + chartH) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Legend
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(padLeft + 10, padTop - 14, 12, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Normal Reference Line (y = x)', padLeft + 26, padTop - 11);
  }

  /**
   * Draws Law of Large Numbers Variance Decay Curve: Var(S_k / k) = sigma^2 / k
   */
  function drawLlnDecayChart() {
    const canvas = elements.canvasLlnVarianceDecay;
    if (!canvas || !canvas.getContext || !state.simResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { envelope, theoretical, config } = state.simResult;
    const n = config.n;
    const steps = envelope.steps;
    const empVar = envelope.varAvg;

    const padLeft = 50;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 34;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const maxVar = Math.max(theoretical.variance, ...empVar);

    function getX(k) {
      return padLeft + (k / n) * chartW;
    }
    function getY(v) {
      return padTop + chartH - (v / maxVar) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let step = 0; step <= 4; step++) {
      const val = (maxVar * step) / 4;
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

    // Theoretical Decay Curve: sigma^2 / k (Cyan dashed)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let k = 1; k <= n; k += Math.max(1, Math.floor(n / 100))) {
      const v = theoretical.variance / k;
      const x = getX(k);
      const y = getY(v);
      if (k === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Empirical Decay Curve from Ensemble (Amber solid)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < steps.length; i++) {
      const x = getX(steps[i]);
      const y = getY(empVar[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Legend
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 10, padTop - 14, 12, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Theoretical Var: σ²/k', padLeft + 26, padTop - 11);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(padLeft + 160, padTop - 14, 12, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Empirical Sample Var', padLeft + 176, padTop - 11);
  }

  // =========================================================================
  // REPORT MARKDOWN LOADER & KATEX RENDERER
  // =========================================================================

  function loadReportMarkdown() {
    fetch('Homework3_Report.md')
      .then(res => {
        if (!res.ok) throw new Error("Could not load Homework3_Report.md");
        return res.text();
      })
      .then(md => {
        if (typeof marked !== 'undefined') {
          elements.reportContainer.innerHTML = marked.parse(md);
        } else {
          elements.reportContainer.innerHTML = `<pre>${md}</pre>`;
        }

        // Render KaTeX formulas
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
        console.warn("Report markdown fetch failed, falling back to static prompt:", err);
        elements.reportContainer.innerHTML = `
          <p style="color:#94a3b8;">
            Please ensure <code>Homework3_Report.md</code> is placed alongside <code>index.html</code>.
          </p>
        `;
      });
  }

  // Auto boot
  window.addEventListener('DOMContentLoaded', init);

})();
