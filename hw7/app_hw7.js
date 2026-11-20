/**
 * ============================================================================
 * Application Controller - Homework 7
 * Modes of Convergence & Bayesian Statistical Inference Suite
 * ============================================================================
 */

(function() {
  'use strict';

  function getEngine() {
    if (typeof window !== 'undefined') {
      if (window.ConvergenceBayesEngine && window.ConvergenceBayesEngine.simulateConvergenceScenario) {
        return window.ConvergenceBayesEngine;
      }
      if (window.ConvergenceBayesEngine && window.ConvergenceBayesEngine.ConvergenceBayesEngine) {
        return window.ConvergenceBayesEngine.ConvergenceBayesEngine;
      }
    }
    return typeof ConvergenceBayesEngine !== 'undefined' ? ConvergenceBayesEngine : {};
  }

  // Application State
  const state = {
    // Module 1: Convergence Modes
    convScenario: 'standard_lln_clt',
    convN: 300,
    convEps: 0.15,
    numPaths: 25,
    convData: null,

    // Module 2: Bayesian Inference
    bayesModel: 'beta_binomial',
    // Beta-Binomial
    bbAlpha0: 2,
    bbBeta0: 2,
    bbSuccesses: 14,
    bbTrials: 20,
    // Normal-Normal
    nnMu0: 100,
    nnSigma0: 15,
    nnSampleMean: 112,
    nnKnownSigma: 15,
    nnSampleSize: 25,
    // Medical Screening
    medPrevalence: 0.005,
    medSensitivity: 0.98,
    medSpecificity: 0.95,

    bayesData: null,
    sequentialData: null
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
    elements.statSampleMean = document.getElementById('stat-sample-mean');
    elements.statSubLln = document.getElementById('stat-sub-lln');
    elements.statStdError = document.getElementById('stat-std-error');
    elements.statSubClt = document.getElementById('stat-sub-clt');
    elements.statPostMean = document.getElementById('stat-post-mean');
    elements.statSubBayesCi = document.getElementById('stat-sub-bayes-ci');
    elements.statInfoGain = document.getElementById('stat-info-gain');
    elements.statSubInfo = document.getElementById('stat-sub-info');

    // Module 1 Controls
    elements.selectConvScenario = document.getElementById('select-convergence-scenario');
    elements.badgeScenarioStatus = document.getElementById('badge-scenario-status');
    elements.sliderConvN = document.getElementById('slider-conv-n');
    elements.badgeConvN = document.getElementById('badge-conv-n');
    elements.sliderConvEps = document.getElementById('slider-conv-eps');
    elements.badgeConvEps = document.getElementById('badge-conv-eps');
    elements.convCalloutTitle = document.getElementById('conv-callout-title');
    elements.convCalloutDesc = document.getElementById('conv-callout-desc');

    // Module 1 Canvases
    elements.canvasTrajectories = document.getElementById('canvas-trajectories');
    elements.canvasConvergenceMetrics = document.getElementById('canvas-convergence-metrics');

    // Module 2 Controls
    elements.selectBayesModel = document.getElementById('select-bayes-model');
    elements.badgeBayesModel = document.getElementById('badge-bayes-model');
    elements.groupParamA = document.getElementById('group-param-a');
    elements.groupParamB = document.getElementById('group-param-b');
    elements.labelParamA = document.getElementById('label-param-a');
    elements.badgeParamA = document.getElementById('badge-param-a');
    elements.sliderParamA = document.getElementById('slider-param-a');
    elements.labelParamB = document.getElementById('label-param-b');
    elements.badgeParamB = document.getElementById('badge-param-b');
    elements.sliderParamB = document.getElementById('slider-param-b');
    elements.bayesCalloutTitle = document.getElementById('bayes-callout-title');
    elements.bayesCalloutDesc = document.getElementById('bayes-callout-desc');

    // Module 2 Canvases & Tables
    elements.canvasBayesTriad = document.getElementById('canvas-bayes-triad');
    elements.canvasBayesSequential = document.getElementById('canvas-bayes-sequential');
    elements.bayesTableContainer = document.getElementById('bayes-table-container');
  }

  // =========================================================================
  // INITIALIZATION & EVENT LISTENERS
  // =========================================================================

  function init() {
    cacheDom();
    registerEventListeners();

    // Run initial simulations
    runConvergenceSimulation();
    runBayesianCalculation();

    // Pre-load report markdown
    loadReportMarkdown();
  }

  function registerEventListeners() {
    // Tab switching
    if (elements.tabBtnLab && elements.tabBtnReport) {
      elements.tabBtnLab.addEventListener('click', () => switchTab('tab-lab'));
      elements.tabBtnReport.addEventListener('click', () => switchTab('tab-report'));
    }

    // Module 1: Scenario Select
    if (elements.selectConvScenario) {
      elements.selectConvScenario.addEventListener('change', (e) => {
        state.convScenario = e.target.value;
        updateConvergenceScenarioCallout();
        runConvergenceSimulation();
      });
    }

    // Module 1: Sliders
    if (elements.sliderConvN) {
      elements.sliderConvN.addEventListener('input', (e) => {
        state.convN = parseInt(e.target.value, 10);
        elements.badgeConvN.textContent = `n = ${state.convN}`;
        runConvergenceSimulation();
      });
    }

    if (elements.sliderConvEps) {
      elements.sliderConvEps.addEventListener('input', (e) => {
        state.convEps = parseFloat(e.target.value);
        elements.badgeConvEps.textContent = `\u03B5 = ${state.convEps.toFixed(2)}`;
        runConvergenceSimulation();
      });
    }

    // Module 2: Model Select
    if (elements.selectBayesModel) {
      elements.selectBayesModel.addEventListener('change', (e) => {
        state.bayesModel = e.target.value;
        configureBayesSliders();
        runBayesianCalculation();
      });
    }

    // Module 2: Sliders
    if (elements.sliderParamA) {
      elements.sliderParamA.addEventListener('input', (e) => {
        handleParamAChange(parseFloat(e.target.value));
        runBayesianCalculation();
      });
    }

    if (elements.sliderParamB) {
      elements.sliderParamB.addEventListener('input', (e) => {
        handleParamBChange(parseFloat(e.target.value));
        runBayesianCalculation();
      });
    }

    // Window Resize
    window.addEventListener('resize', debounce(() => {
      drawTrajectoriesCanvas();
      drawConvergenceMetricsCanvas();
      drawBayesTriadCanvas();
      drawBayesSequentialCanvas();
    }, 150));
  }

  function switchTab(targetId) {
    if (targetId === 'tab-lab') {
      elements.tabBtnLab.classList.add('active');
      elements.tabBtnReport.classList.remove('active');
      elements.tabLab.classList.add('active');
      elements.tabReport.classList.remove('active');
      drawTrajectoriesCanvas();
      drawConvergenceMetricsCanvas();
      drawBayesTriadCanvas();
      drawBayesSequentialCanvas();
    } else {
      elements.tabBtnLab.classList.remove('active');
      elements.tabBtnReport.classList.add('active');
      elements.tabLab.classList.remove('active');
      elements.tabReport.classList.add('active');
    }
  }

  // =========================================================================
  // MODULE 1 CONTROLLER: CONVERGENCE MODES & SQRT(N)
  // =========================================================================

  function updateConvergenceScenarioCallout() {
    const sc = state.convScenario;
    if (sc === 'standard_lln_clt') {
      elements.badgeScenarioStatus.textContent = 'LLN & CLT Standard Walk';
      elements.badgeScenarioStatus.className = 'card-badge badge-cyan';
      elements.convCalloutTitle.textContent = 'Standard IID Random Walk (LLN Almost Sure & CLT in Distribution)';
      elements.convCalloutDesc.textContent = 'Increments X_i in {-1, +1} with P = 0.5. Demonstrates almost sure convergence of sample mean to mu = 0, with variance decay sigma^2/n = 1/n and fluctuation envelope bounds +-2*sigma/sqrt(n).';
    } else if (sc === 'sliding_indicator') {
      elements.badgeScenarioStatus.textContent = 'P without Almost Sure (a.s.)';
      elements.badgeScenarioStatus.className = 'card-badge badge-amber';
      elements.convCalloutTitle.textContent = 'Sliding Indicator / Typing Monkey (Convergence in Probability without a.s.)';
      elements.convCalloutDesc.textContent = 'X_n = 1 on interval [j/2^k, (j+1)/2^k] for n = 2^k + j. P(|X_n| > eps) = 1/2^k -> 0 (converges in probability), but for every omega, X_n hits 1 infinitely often, so limsup X_n = 1 != 0 (fails almost sure convergence everywhere!).';
    } else if (sc === 'escaping_spike') {
      elements.badgeScenarioStatus.textContent = 'a.s. & P without L² (Mean-Square)';
      elements.badgeScenarioStatus.className = 'card-badge badge-rose';
      elements.convCalloutTitle.textContent = 'Escaping Spike / Heavy Tail (Almost Sure & Probability without L² Convergence)';
      elements.convCalloutDesc.textContent = 'P(X_n = n^1.2) = 1/n^2, P(X_n = 0) = 1 - 1/n^2. By Borel-Cantelli, X_n -> 0 almost surely and in probability. However, E[X_n^2] = (n^1.2)^2 / n^2 = n^0.4 -> DIVERGES to infinity! Mean-square error blows up.';
    } else if (sc === 'sign_flip') {
      elements.badgeScenarioStatus.textContent = 'In Distribution (d) without P';
      elements.badgeScenarioStatus.className = 'card-badge badge-violet';
      elements.convCalloutTitle.textContent = 'Symmetric Sign Inversion (Convergence in Distribution without Probability)';
      elements.convCalloutDesc.textContent = 'Let X ~ Rademacher(+-1). Define X_n = -X for all n. F_{X_n} = F_X identically (converges in distribution), but |X_n - X| = 2|X| = 2 constantly, so P(|X_n - X| > 1) = 1.0 (zero convergence in probability!).';
    }
  }

  function runConvergenceSimulation() {
    const Engine = getEngine();
    if (!Engine || !Engine.simulateConvergenceScenario) return;

    state.convData = Engine.simulateConvergenceScenario(
      state.convScenario,
      state.convN,
      state.numPaths,
      state.convEps
    );

    renderConvergenceStatCards();
    drawTrajectoriesCanvas();
    drawConvergenceMetricsCanvas();
  }

  function renderConvergenceStatCards() {
    const d = state.convData;
    if (!d || d.trajectories.length === 0) return;

    const lastStep = d.steps - 1;
    let finalMean = 0;
    for (let p = 0; p < d.paths; p++) {
      finalMean += d.trajectories[p][lastStep];
    }
    finalMean /= d.paths;

    elements.statSampleMean.textContent = finalMean.toFixed(4);
    const env = d.envelopeUpper[lastStep] || 0;
    elements.statSubLln.textContent = `Target \u03BC = 0.0 \u2022 Bound \u00B12\u03C3/\u221An: \u00B1${env.toFixed(3)}`;

    const se = 1.0 / Math.sqrt(d.steps);
    elements.statStdError.textContent = se.toFixed(4);
    elements.statSubClt.textContent = `\u03C3/\u221An with n = ${d.steps} \u2022 Scale \u221An = ${Math.sqrt(d.steps).toFixed(2)}`;
  }

  // =========================================================================
  // MODULE 2 CONTROLLER: BAYESIAN INFERENCE
  // =========================================================================

  function configureBayesSliders() {
    const m = state.bayesModel;

    if (m === 'beta_binomial') {
      elements.badgeBayesModel.textContent = 'Beta-Binomial Model';
      elements.badgeBayesModel.className = 'card-badge badge-emerald';
      elements.bayesCalloutTitle.textContent = 'Beta-Binomial Conjugacy (Rate & Proportion Estimation)';
      elements.bayesCalloutDesc.textContent = 'Prior \u03B8 ~ Beta(\u03B1\u2080, \u03B2\u2080) synthesized with Binomial likelihood (k successes in n trials). Posterior \u03B8|k ~ Beta(\u03B1\u2080 + k, \u03B2\u2080 + n - k). Demonstrates pseudo-count interpretation and convex weighting.';

      elements.labelParamA.textContent = 'Prior Pseudo-Counts (\u03B1\u2080, \u03B2\u2080)';
      elements.sliderParamA.min = '0.5';
      elements.sliderParamA.max = '20';
      elements.sliderParamA.step = '0.5';
      elements.sliderParamA.value = state.bbAlpha0;
      elements.badgeParamA.textContent = `\u03B1\u2080 = ${state.bbAlpha0}, \u03B2\u2080 = ${state.bbBeta0}`;

      elements.labelParamB.textContent = 'Observed Successes (k in n trials)';
      elements.sliderParamB.min = '0';
      elements.sliderParamB.max = '50';
      elements.sliderParamB.step = '1';
      elements.sliderParamB.value = state.bbSuccesses;
      elements.badgeParamB.textContent = `k = ${state.bbSuccesses} / n = ${state.bbTrials}`;

    } else if (m === 'normal_normal') {
      elements.badgeBayesModel.textContent = 'Normal-Normal Model';
      elements.badgeBayesModel.className = 'card-badge badge-cyan';
      elements.bayesCalloutTitle.textContent = 'Normal-Normal Conjugacy (Location & Precision Additivity)';
      elements.bayesCalloutDesc.textContent = 'Prior \u03BC ~ N(\u03BC\u2080, \u03C3\u2080²) updated with sample mean x\u0304 from n observations. Posterior precision is strictly additive: 1/\u03C3\u2081² = 1/\u03C3\u2080² + n/\u03C3². Posterior mean is precision-weighted.';

      elements.labelParamA.textContent = 'Prior Mean (\u03BC\u2080) [Base 100]';
      elements.sliderParamA.min = '70';
      elements.sliderParamA.max = '130';
      elements.sliderParamA.step = '1';
      elements.sliderParamA.value = state.nnMu0;
      elements.badgeParamA.textContent = `\u03BC\u2080 = ${state.nnMu0}, \u03C3\u2080 = ${state.nnSigma0}`;

      elements.labelParamB.textContent = 'Sample Mean (x\u0304) [n = 25]';
      elements.sliderParamB.min = '80';
      elements.sliderParamB.max = '130';
      elements.sliderParamB.step = '1';
      elements.sliderParamB.value = state.nnSampleMean;
      elements.badgeParamB.textContent = `x\u0304 = ${state.nnSampleMean}, n = ${state.nnSampleSize}`;

    } else if (m === 'medical_screening') {
      elements.badgeBayesModel.textContent = 'Medical Diagnostic Model';
      elements.badgeBayesModel.className = 'card-badge badge-amber';
      elements.bayesCalloutTitle.textContent = 'Medical Diagnostic Screening & The Base Rate Fallacy';
      elements.bayesCalloutDesc.textContent = 'Conditioning on positive test result (+) when disease prevalence P(D) is rare. Proves why a 98% sensitive test can still mean < 10% probability of true disease due to the overwhelming false positive pool.';

      elements.labelParamA.textContent = 'Prevalence / Prior P(D)';
      elements.sliderParamA.min = '0.001';
      elements.sliderParamA.max = '0.10';
      elements.sliderParamA.step = '0.001';
      elements.sliderParamA.value = state.medPrevalence;
      elements.badgeParamA.textContent = `P(D) = ${(state.medPrevalence * 100).toFixed(2)}%`;

      elements.labelParamB.textContent = 'Sensitivity P(+|D) / Specificity';
      elements.sliderParamB.min = '0.70';
      elements.sliderParamB.max = '0.99';
      elements.sliderParamB.step = '0.01';
      elements.sliderParamB.value = state.medSensitivity;
      elements.badgeParamB.textContent = `Sens = ${(state.medSensitivity * 100).toFixed(0)}%, Spec = 95%`;
    }
  }

  function handleParamAChange(val) {
    const m = state.bayesModel;
    if (m === 'beta_binomial') {
      state.bbAlpha0 = val;
      state.bbBeta0 = val; // symmetric prior slider
      elements.badgeParamA.textContent = `\u03B1\u2080 = ${val}, \u03B2\u2080 = ${val}`;
    } else if (m === 'normal_normal') {
      state.nnMu0 = val;
      elements.badgeParamA.textContent = `\u03BC\u2080 = ${val}, \u03C3\u2080 = ${state.nnSigma0}`;
    } else if (m === 'medical_screening') {
      state.medPrevalence = val;
      elements.badgeParamA.textContent = `P(D) = ${(val * 100).toFixed(2)}%`;
    }
  }

  function handleParamBChange(val) {
    const m = state.bayesModel;
    if (m === 'beta_binomial') {
      state.bbSuccesses = val;
      state.bbTrials = Math.max(val, state.bbTrials);
      elements.badgeParamB.textContent = `k = ${val} / n = ${state.bbTrials}`;
    } else if (m === 'normal_normal') {
      state.nnSampleMean = val;
      elements.badgeParamB.textContent = `x\u0304 = ${val}, n = ${state.nnSampleSize}`;
    } else if (m === 'medical_screening') {
      state.medSensitivity = val;
      elements.badgeParamB.textContent = `Sens = ${(val * 100).toFixed(0)}%, Spec = 95%`;
    }
  }

  function runBayesianCalculation() {
    const Engine = getEngine();
    if (!Engine) return;

    const m = state.bayesModel;

    if (m === 'beta_binomial') {
      state.bayesData = Engine.computeBetaBinomial(
        state.bbAlpha0,
        state.bbBeta0,
        state.bbSuccesses,
        state.bbTrials
      );
      state.sequentialData = Engine.simulateSequentialBayes(0.7, state.bbAlpha0, state.bbBeta0, 100);

      // Stat cards update
      const post = state.bayesData.posterior;
      elements.statPostMean.textContent = post.mean.toFixed(4);
      elements.statSubBayesCi.textContent = `95% CI: [${post.ci[0].toFixed(3)}, ${post.ci[1].toFixed(3)}]`;

      const priorVar = state.bayesData.prior.variance;
      const postVar = post.variance;
      const gain = priorVar / postVar;
      elements.statInfoGain.textContent = `${gain.toFixed(1)}\u00D7`;
      elements.statSubInfo.textContent = 'Precision gain: Var(\u03B8_prior) / Var(\u03B8_post)';

    } else if (m === 'normal_normal') {
      state.bayesData = Engine.computeNormalNormal(
        state.nnMu0,
        state.nnSigma0,
        state.nnSampleMean,
        state.nnKnownSigma,
        state.nnSampleSize
      );
      state.sequentialData = null;

      const post = state.bayesData.posterior;
      elements.statPostMean.textContent = post.mean.toFixed(2);
      elements.statSubBayesCi.textContent = `95% CI: [${post.ci[0].toFixed(1)}, ${post.ci[1].toFixed(1)}]`;

      const gain = state.bayesData.weights.tau1 / state.bayesData.weights.tau0;
      elements.statInfoGain.textContent = `${gain.toFixed(1)}\u00D7`;
      elements.statSubInfo.textContent = `Data weight: ${(state.bayesData.weights.dataWeight * 100).toFixed(0)}%`;

    } else if (m === 'medical_screening') {
      state.bayesData = Engine.computeMedicalScreening(
        state.medPrevalence,
        state.medSensitivity,
        state.medSpecificity
      );
      state.sequentialData = null;

      elements.statPostMean.textContent = `${(state.bayesData.ppv * 100).toFixed(2)}%`;
      elements.statSubBayesCi.textContent = `P(D|+) Positive Predictive Value`;

      const ratio = state.bayesData.ppv / state.bayesData.prevalence;
      elements.statInfoGain.textContent = `${ratio.toFixed(1)}\u00D7`;
      elements.statSubInfo.textContent = `Prevalence multiplier P(D|+) / P(D)`;
    }

    drawBayesTriadCanvas();
    drawBayesSequentialCanvas();
    renderBayesTable();
  }

  // =========================================================================
  // CANVAS 1A: TRAJECTORIES & ENVELOPE BOUNDS
  // =========================================================================

  function drawTrajectoriesCanvas() {
    const canvas = elements.canvasTrajectories;
    if (!canvas || !canvas.getContext || !state.convData) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const d = state.convData;
    const padLeft = 55;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 40;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Y bounds
    let minY = -1.5;
    let maxY = 1.5;
    if (d.scenarioId === 'escaping_spike') {
      minY = -0.5;
      maxY = 5.0;
    } else if (d.scenarioId === 'sliding_indicator') {
      minY = -0.2;
      maxY = 1.2;
    }

    function getX(stepIdx) {
      return padLeft + (stepIdx / (d.steps - 1)) * chartW;
    }

    function getY(val) {
      const clamped = Math.max(minY, Math.min(maxY, val));
      return padTop + chartH - ((clamped - minY) / (maxY - minY)) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const yTicks = d.scenarioId === 'escaping_spike' ? [0, 1, 2, 3, 4] : [-1, -0.5, 0, 0.5, 1];
    yTicks.forEach(yt => {
      const yPos = getY(yt);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(padLeft + chartW, yPos);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(yt.toFixed(1), padLeft - 6, yPos + 3);
    });

    // Zero Reference Line
    const yZero = getY(0);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padLeft, yZero);
    ctx.lineTo(padLeft + chartW, yZero);
    ctx.stroke();
    ctx.setLineDash([]);

    // 1. Draw Sample Paths
    const palette = ['#38bdf8', '#10b981', '#a855f7', '#f59e0b', '#34d399', '#60a5fa'];
    ctx.lineWidth = 1.1;

    for (let p = 0; p < d.paths; p++) {
      ctx.strokeStyle = palette[p % palette.length];
      ctx.globalAlpha = p === 0 ? 0.95 : 0.35;
      if (p === 0) ctx.lineWidth = 2.0;
      else ctx.lineWidth = 1.0;

      ctx.beginPath();
      const traj = d.trajectories[p];
      for (let k = 0; k < d.steps; k++) {
        const x = getX(k);
        const y = getY(traj[k]);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // 2. Draw Theoretical Fluctuation Envelope Bounds (if applicable)
    if (d.envelopeUpper.length > 0 && d.scenarioId === 'standard_lln_clt') {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);

      // Upper bound
      ctx.beginPath();
      for (let k = 0; k < d.steps; k++) {
        const x = getX(k);
        const y = getY(d.envelopeUpper[k]);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lower bound
      ctx.beginPath();
      for (let k = 0; k < d.steps; k++) {
        const x = getX(k);
        const y = getY(d.envelopeLower[k]);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('+2\u03C3/\u221An Envelope', padLeft + chartW - 10, getY(d.envelopeUpper[d.steps - 1]) - 6);
    }

    // Header Label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Trajectories (M = ${d.paths}) | Sequence Steps: n = ${d.steps}`, padLeft, padTop - 12);
  }

  // =========================================================================
  // CANVAS 1B: CONVERGENCE METRICS DECAY
  // =========================================================================

  function drawConvergenceMetricsCanvas() {
    const canvas = elements.canvasConvergenceMetrics;
    if (!canvas || !canvas.getContext || !state.convData) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const d = state.convData;
    const padLeft = 55;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 40;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Log-log or linear decay depending on scenario
    let maxVal = 1.2;
    if (d.scenarioId === 'escaping_spike') {
      maxVal = Math.max(5.0, Math.max(...d.meanSquareErrors));
    }

    function getX(idx) {
      return padLeft + (idx / (d.steps - 1)) * chartW;
    }

    function getY(val) {
      const clamped = Math.max(0, Math.min(maxVal, val));
      return padTop + chartH - (clamped / maxVal) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let p = 0; p <= 1.0; p += 0.25) {
      const yVal = p * maxVal;
      const yPos = getY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(padLeft + chartW, yPos);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(2), padLeft - 6, yPos + 3);
    }

    // 1. Draw Error Probability Curve P(|X_n - X| > eps) (Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let k = 0; k < d.steps; k++) {
      const x = getX(k);
      const y = getY(d.errorProbabilities[k]);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Draw Mean Square Error Curve E[(X_n - X)^2] (Emerald)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let k = 0; k < d.steps; k++) {
      const x = getX(k);
      const y = getY(d.meanSquareErrors[k]);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Legend on top
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 10, padTop + 8, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`P(|X_n - X| > ${d.epsilon}) (Probability Mode)`, padLeft + 25, padTop + 11);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(padLeft + 230, padTop + 8, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('E[(X_n - X)²] (L² Mean-Square Mode)', padLeft + 245, padTop + 11);
  }

  // =========================================================================
  // CANVAS 2A: BAYESIAN TRIAD DENSITY CURVES
  // =========================================================================

  function drawBayesTriadCanvas() {
    const canvas = elements.canvasBayesTriad;
    if (!canvas || !canvas.getContext || !state.bayesData) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const m = state.bayesModel;
    if (m === 'medical_screening') {
      drawMedicalScreeningTree(ctx, w, h);
      return;
    }

    const b = state.bayesData;
    const padLeft = 55;
    const padRight = 25;
    const padTop = 32;
    const padBottom = 42;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Find max density across curves
    const maxDensity = Math.max(
      Math.max(...b.curves.priorCurve),
      Math.max(...b.curves.likelihoodCurve),
      Math.max(...b.curves.postCurve)
    ) * 1.15;

    const numPoints = b.curves.thetaVals ? b.curves.thetaVals.length : b.curves.xVals.length;
    const xCoords = b.curves.thetaVals || b.curves.xVals;
    const minX = xCoords[0];
    const maxX = xCoords[numPoints - 1];

    function getX(val) {
      return padLeft + ((val - minX) / (maxX - minX)) * chartW;
    }

    function getY(pdf) {
      const clamped = Math.max(0, Math.min(maxDensity, pdf));
      return padTop + chartH - (clamped / maxDensity) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let p = 0; p <= 1.0; p += 0.25) {
      const yVal = p * maxDensity;
      const yPos = getY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(padLeft + chartW, yPos);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), padLeft - 6, yPos + 3);
    }

    // 1. Draw Prior Curve (Dashed Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const px = getX(xCoords[i]);
      const py = getY(b.curves.priorCurve[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Normalized Likelihood Curve (Solid Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const px = getX(xCoords[i]);
      const py = getY(b.curves.likelihoodCurve[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 3. Draw Posterior Curve (Solid Emerald with Subtle Area Fill)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.moveTo(getX(xCoords[0]), padTop + chartH);
    for (let i = 0; i < numPoints; i++) {
      ctx.lineTo(getX(xCoords[i]), getY(b.curves.postCurve[i]));
    }
    ctx.lineTo(getX(xCoords[numPoints - 1]), padTop + chartH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const px = getX(xCoords[i]);
      const py = getY(b.curves.postCurve[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Vertical indicator for posterior mean
    const postMeanX = getX(b.posterior.mean);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(postMeanX, padTop);
    ctx.lineTo(postMeanX, padTop + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 10, padTop + 6, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Prior P(\u03B8)', padLeft + 25, padTop + 9);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(padLeft + 120, padTop + 6, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Likelihood L(\u03B8; x)', padLeft + 135, padTop + 9);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(padLeft + 260, padTop + 6, 10, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Posterior P(\u03B8|x)', padLeft + 275, padTop + 9);
  }

  function drawMedicalScreeningTree(ctx, w, h) {
    const b = state.bayesData;
    const c = b.populationCounts;

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Diagnostic Natural Frequency Tree (Base Population = ${c.population.toLocaleString()})`, w / 2, 24);

    // Box 1: Diseased vs Healthy
    const boxW = 180;
    const boxH = 65;

    // Diseased branch (Left)
    ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
    ctx.strokeStyle = '#f43f5e';
    ctx.fillRect(60, 60, boxW, boxH);
    ctx.strokeRect(60, 60, boxW, boxH);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`Diseased: ${c.countD} (${(b.prevalence * 100).toFixed(2)}%)`, 60 + boxW / 2, 85);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText(`+ Test: ${c.truePos} | - Test: ${c.falseNeg}`, 60 + boxW / 2, 105);

    // Healthy branch (Right)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = '#38bdf8';
    ctx.fillRect(w - 60 - boxW, 60, boxW, boxH);
    ctx.strokeRect(w - 60 - boxW, 60, boxW, boxH);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`Healthy: ${c.countD_not.toLocaleString()}`, w - 60 - boxW / 2, 85);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText(`+ Test: ${c.falsePos} | - Test: ${c.trueNeg.toLocaleString()}`, w - 60 - boxW / 2, 105);

    // Summary Result Box (Center Bottom)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.fillRect(w / 2 - 190, 160, 380, 110);
    ctx.strokeRect(w / 2 - 190, 160, 380, 110);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`Positive Predictive Value (PPV): ${(b.ppv * 100).toFixed(2)}%`, w / 2, 190);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`Total Positive Tests: ${c.totalPos} (True: ${c.truePos} vs False: ${c.falsePos})`, w / 2, 215);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`P(Disease | Positive) = ${c.truePos} / (${c.truePos} + ${c.falsePos}) = ${(b.ppv * 100).toFixed(2)}%`, w / 2, 240);
  }

  // =========================================================================
  // CANVAS 2B: SEQUENTIAL LEARNING DYNAMICS
  // =========================================================================

  function drawBayesSequentialCanvas() {
    const canvas = elements.canvasBayesSequential;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padLeft = 55;
    const padRight = 25;
    const padTop = 32;
    const padBottom = 42;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    if (!state.sequentialData || state.bayesModel !== 'beta_binomial') {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sequential dynamics available for Beta-Binomial paradigm.', w / 2, h / 2);
      return;
    }

    const seq = state.sequentialData;
    const trueTheta = seq.trueTheta;

    // Find max density among history curves
    let maxDensity = 0;
    seq.history.forEach(item => {
      const m = Math.max(...item.curve);
      if (m > maxDensity) maxDensity = m;
    });
    maxDensity *= 1.15;

    function getX(theta) {
      return padLeft + theta * chartW;
    }

    function getY(pdf) {
      const clamped = Math.max(0, Math.min(maxDensity, pdf));
      return padTop + chartH - (clamped / maxDensity) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let p = 0; p <= 1.0; p += 0.2) {
      const tx = getX(p);
      ctx.beginPath();
      ctx.moveTo(tx, padTop);
      ctx.lineTo(tx, padTop + chartH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.toFixed(1), tx, padTop + chartH + 13);
    }

    // Draw sequential curves
    const palette = ['#64748b', '#818cf8', '#a855f7', '#38bdf8', '#34d399', '#10b981'];

    seq.history.forEach((item, idx) => {
      ctx.strokeStyle = palette[idx % palette.length];
      ctx.lineWidth = idx === seq.history.length - 1 ? 2.5 : 1.3;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const theta = i / 100;
        const px = getX(theta);
        const py = getY(item.curve[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    // True theta vertical reference line
    const xTrue = getX(trueTheta);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xTrue, padTop);
    ctx.lineTo(xTrue, padTop + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`True \u03B8 = ${trueTheta.toFixed(2)}`, xTrue, padTop - 6);

    // Header Legend
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Posterior Density Progression: n = 0 \u2192 1 \u2192 5 \u2192 20 \u2192 50 \u2192 100', padLeft, padTop - 12);
  }

  // =========================================================================
  // QUANTITATIVE SYNTHESIS TABLE
  // =========================================================================

  function renderBayesTable() {
    const m = state.bayesModel;
    const b = state.bayesData;
    if (!b) return;

    let html = `<div class="data-table-wrapper"><table class="data-table">`;

    if (m === 'beta_binomial') {
      html += `<thead><tr>
        <th>Inferential Component</th>
        <th>Distribution Formula</th>
        <th>Expected Value (Mean)</th>
        <th>Mode</th>
        <th>Variance</th>
        <th>95% Credible Interval</th>
      </tr></thead><tbody>
      <tr>
        <td style="color:#38bdf8; font-weight:700;">Prior P(\u03B8)</td>
        <td>Beta(\u03B1\u2080=${b.parameters.alpha0}, \u03B2\u2080=${b.parameters.beta0})</td>
        <td>${b.prior.mean.toFixed(4)}</td>
        <td>${b.prior.mode.toFixed(4)}</td>
        <td>${b.prior.variance.toExponential(3)}</td>
        <td>[${b.prior.ci[0].toFixed(3)}, ${b.prior.ci[1].toFixed(3)}]</td>
      </tr>
      <tr>
        <td style="color:#f59e0b; font-weight:700;">Likelihood L(\u03B8; k)</td>
        <td>Binomial(n=${b.parameters.trials}, k=${b.parameters.successes})</td>
        <td>${b.likelihood.mle.toFixed(4)} (MLE)</td>
        <td>${b.likelihood.mle.toFixed(4)}</td>
        <td>${(b.likelihood.mle * (1 - b.likelihood.mle) / b.parameters.trials).toExponential(3)}</td>
        <td>Frequentist Wald SE</td>
      </tr>
      <tr style="background:rgba(16, 185, 129, 0.1);">
        <td style="color:#10b981; font-weight:800;">Posterior P(\u03B8|k)</td>
        <td>Beta(\u03B1\u2081=${b.parameters.alpha1}, \u03B2\u2081=${b.parameters.beta1})</td>
        <td style="font-weight:700; color:#34d399;">${b.posterior.mean.toFixed(4)}</td>
        <td>${b.posterior.mode.toFixed(4)}</td>
        <td>${b.posterior.variance.toExponential(3)}</td>
        <td style="color:#34d399; font-weight:700;">[${b.posterior.ci[0].toFixed(3)}, ${b.posterior.ci[1].toFixed(3)}]</td>
      </tr>
      </tbody>`;

    } else if (m === 'normal_normal') {
      html += `<thead><tr>
        <th>Inferential Component</th>
        <th>Distribution Formula</th>
        <th>Mean (\u03BC)</th>
        <th>Std Dev (\u03C3)</th>
        <th>Precision (\u03C4 = 1/\u03C3²)</th>
        <th>Precision Weight</th>
      </tr></thead><tbody>
      <tr>
        <td style="color:#38bdf8; font-weight:700;">Prior P(\u03BC)</td>
        <td>N(\u03BC\u2080=${b.parameters.mu0}, \u03C3\u2080=${b.parameters.sigma0})</td>
        <td>${b.prior.mean.toFixed(2)}</td>
        <td>${b.prior.sd.toFixed(2)}</td>
        <td>${b.weights.tau0.toFixed(4)}</td>
        <td>${(b.weights.priorWeight * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td style="color:#f59e0b; font-weight:700;">Likelihood L(\u03BC; x\u0304)</td>
        <td>N(x\u0304=${b.parameters.sampleMean}, \u03C3/\u221An=${b.likelihood.se.toFixed(2)})</td>
        <td>${b.likelihood.mean.toFixed(2)}</td>
        <td>${b.likelihood.se.toFixed(2)}</td>
        <td>${b.weights.tauData.toFixed(4)}</td>
        <td>${(b.weights.dataWeight * 100).toFixed(1)}%</td>
      </tr>
      <tr style="background:rgba(16, 185, 129, 0.1);">
        <td style="color:#10b981; font-weight:800;">Posterior P(\u03BC|x\u0304)</td>
        <td>N(\u03BC\u2081=${b.parameters.mu1.toFixed(2)}, \u03C3\u2081=${b.parameters.sigma1.toFixed(2)})</td>
        <td style="font-weight:700; color:#34d399;">${b.posterior.mean.toFixed(2)}</td>
        <td>${b.posterior.sd.toFixed(2)}</td>
        <td style="font-weight:700; color:#34d399;">${b.weights.tau1.toFixed(4)} (Additive!)</td>
        <td>100.0%</td>
      </tr>
      </tbody>`;

    } else if (m === 'medical_screening') {
      const c = b.populationCounts;
      html += `<thead><tr>
        <th>Condition Status</th>
        <th>Test Positive (+)</th>
        <th>Test Negative (-)</th>
        <th>Sub-Population Total</th>
      </tr></thead><tbody>
      <tr>
        <td style="color:#f43f5e; font-weight:700;">True Diseased (D)</td>
        <td style="color:#34d399; font-weight:700;">True Positives: ${c.truePos.toLocaleString()}</td>
        <td style="color:#f43f5e;">False Negatives: ${c.falseNeg.toLocaleString()}</td>
        <td style="font-weight:700;">${c.countD.toLocaleString()} (${(b.prevalence * 100).toFixed(2)}%)</td>
      </tr>
      <tr>
        <td style="color:#38bdf8; font-weight:700;">True Healthy (D&#7506;)</td>
        <td style="color:#f43f5e; font-weight:700;">False Positives: ${c.falsePos.toLocaleString()}</td>
        <td style="color:#34d399;">True Negatives: ${c.trueNeg.toLocaleString()}</td>
        <td style="font-weight:700;">${c.countD_not.toLocaleString()}</td>
      </tr>
      <tr style="background:rgba(30, 41, 59, 0.6);">
        <td style="font-weight:800; color:#cbd5e1;">Test Aggregate</td>
        <td style="color:#f59e0b; font-weight:800;">Total Positive: ${c.totalPos.toLocaleString()}</td>
        <td style="font-weight:800;">Total Negative: ${c.totalNeg.toLocaleString()}</td>
        <td style="font-weight:800; color:#38bdf8;">N = ${c.population.toLocaleString()}</td>
      </tr>
      </tbody>`;
    }

    html += `</table></div>`;
    elements.bayesTableContainer.innerHTML = html;
  }

  // =========================================================================
  // REPORT MARKDOWN LOADER & BULLETPROOF KATEX PIPELINE
  // =========================================================================

  function loadReportMarkdown() {
    fetch('Homework7_Report.md')
      .then(res => {
        if (!res.ok) throw new Error("Could not load Homework7_Report.md");
        return res.text();
      })
      .then(md => {
        const displayMath = [];
        let cleanMd = md.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
          const id = `@@DISPLAYMATH${displayMath.length}@@`;
          displayMath.push(math.trim());
          return `\n\n${id}\n\n`;
        });

        const inlineMath = [];
        cleanMd = cleanMd.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, math) => {
          const id = `@@INLINEMATH${inlineMath.length}@@`;
          inlineMath.push(math.trim());
          return `${prefix}${id}`;
        });

        let html = (typeof marked !== 'undefined') ? marked.parse(cleanMd) : `<pre>${cleanMd}</pre>`;

        displayMath.forEach((math, i) => {
          const id = `@@DISPLAYMATH${i}@@`;
          let rendered;
          if (typeof katex !== 'undefined') {
            try {
              rendered = katex.renderToString(math, { displayMode: true, throwOnError: false });
            } catch (err) {
              rendered = `<div class="katex-error">\\[${escapeHtml(math)}\\]</div>`;
            }
          } else {
            rendered = `<div class="math-display">\\[${escapeHtml(math)}\\]</div>`;
          }
          html = html.replace(id, rendered);
        });

        inlineMath.forEach((math, i) => {
          const id = `@@INLINEMATH${i}@@`;
          let rendered;
          if (typeof katex !== 'undefined') {
            try {
              rendered = katex.renderToString(math, { displayMode: false, throwOnError: false });
            } catch (err) {
              rendered = `<span class="katex-error">\\(${escapeHtml(math)}\\)</span>`;
            }
          } else {
            rendered = `<span class="math-inline">\\(${escapeHtml(math)}\\)</span>`;
          }
          html = html.replace(id, rendered);
        });

        if (elements.reportContainer) {
          elements.reportContainer.innerHTML = html;
        }
      })
      .catch(err => {
        console.warn("Report markdown fetch fallback:", err);
      });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function debounce(fn, ms) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  window.addEventListener('DOMContentLoaded', init);
})();
