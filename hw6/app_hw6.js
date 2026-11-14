/**
 * ============================================================================
 * Application Controller - Homework 6
 * Bivariate Contingency Tables, Statistical Independence & Chi-Square Analysis
 * ============================================================================
 */

(function() {
  'use strict';

  // Helper to safely access IndependenceEngine
  function getEngine() {
    if (typeof window !== 'undefined') {
      if (window.IndependenceEngine && window.IndependenceEngine.analyzeContingencyTable) {
        return window.IndependenceEngine;
      }
      if (window.IndependenceEngine && window.IndependenceEngine.IndependenceEngine) {
        return window.IndependenceEngine.IndependenceEngine;
      }
    }
    return typeof IndependenceEngine !== 'undefined' ? IndependenceEngine : {};
  }

  // Application State
  const state = {
    datasetId: 'cybersecurity',
    matrix: [],
    rowLabels: [],
    colLabels: [],
    alpha: 0.05,
    viewMode: 'observed', // 'observed' | 'expected' | 'deviations' | 'row_pct' | 'col_pct' | 'chi2_cells' | 'std_residuals'
    analysis: null,
    isCustom: false
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
    elements.statSampleTotal = document.getElementById('stat-sample-total');
    elements.statSubDimensions = document.getElementById('stat-sub-dimensions');
    elements.statChiSquare = document.getElementById('stat-chi-square');
    elements.statSubDf = document.getElementById('stat-sub-df');
    elements.statPValue = document.getElementById('stat-p-value');
    elements.statSubCritical = document.getElementById('stat-sub-critical');
    elements.statVerdict = document.getElementById('stat-verdict');
    elements.statSubCramer = document.getElementById('stat-sub-cramer');

    // Controls
    elements.selectDataset = document.getElementById('select-dataset');
    elements.selectAlpha = document.getElementById('select-alpha');
    elements.datasetTitle = document.getElementById('dataset-title');
    elements.datasetDesc = document.getElementById('dataset-desc');
    elements.badgeHypothesisStatus = document.getElementById('badge-hypothesis-status');

    // View Mode Switcher Pills
    elements.pillBtns = document.querySelectorAll('.pill-btn');

    // Contingency Table
    elements.tableContainer = document.getElementById('contingency-table-container');

    // Visual Canvases
    elements.canvasMosaic = document.getElementById('canvas-mosaic');
    elements.canvasChiSquare = document.getElementById('canvas-chisquare');

    // Diagnostics & Effect Sizes
    elements.cochranBanner = document.getElementById('cochran-banner');
    elements.cochranText = document.getElementById('cochran-text');
    elements.metricCramerV = document.getElementById('metric-cramer-v');
    elements.metricContingencyC = document.getElementById('metric-contingency-c');
    elements.metricTschuprowT = document.getElementById('metric-tschuprow-t');
    elements.boxTwoByTwo = document.getElementById('box-two-by-two');
    elements.metricOddsRatio = document.getElementById('metric-odds-ratio');
    elements.metricRelativeRisk = document.getElementById('metric-relative-risk');

    // Simpson's Inspector Buttons
    elements.btnSimpsonAgg = document.getElementById('btn-simpson-agg');
    elements.btnSimpsonMild = document.getElementById('btn-simpson-mild');
    elements.btnSimpsonSevere = document.getElementById('btn-simpson-severe');

    // Custom Dataset Generator & Editor Controls
    elements.btnGenerateSynthetic = document.getElementById('btn-generate-synthetic');
    elements.sliderSynthN = document.getElementById('slider-synth-n');
    elements.sliderSynthDelta = document.getElementById('slider-synth-delta');
    elements.badgeSynthN = document.getElementById('badge-synth-n');
    elements.badgeSynthDelta = document.getElementById('badge-synth-delta');
    elements.btnToggleCustomEditor = document.getElementById('btn-toggle-custom-editor');
    elements.customEditorSection = document.getElementById('custom-editor-section');
    elements.textareaRawData = document.getElementById('textarea-raw-data');
    elements.btnParseRawData = document.getElementById('btn-parse-raw-data');
  }

  // =========================================================================
  // INITIALIZATION & EVENT LISTENERS
  // =========================================================================

  function init() {
    cacheDom();
    registerEventListeners();

    // Load initial dataset
    loadDataset('cybersecurity');

    // Pre-load report markdown in background
    loadReportMarkdown();
  }

  function registerEventListeners() {
    // Navigation Tabs
    if (elements.tabBtnLab && elements.tabBtnReport) {
      elements.tabBtnLab.addEventListener('click', () => switchTab('tab-lab'));
      elements.tabBtnReport.addEventListener('click', () => switchTab('tab-report'));
    }

    // Dataset Select
    if (elements.selectDataset) {
      elements.selectDataset.addEventListener('change', (e) => {
        loadDataset(e.target.value);
      });
    }

    // Significance Level Alpha Select
    if (elements.selectAlpha) {
      elements.selectAlpha.addEventListener('change', (e) => {
        state.alpha = parseFloat(e.target.value);
        runAnalysis();
      });
    }

    // View Mode Pills
    elements.pillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.pillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.getAttribute('data-mode');
        renderContingencyTable();
      });
    });

    // Simpson's Quick Buttons
    if (elements.btnSimpsonAgg) {
      elements.btnSimpsonAgg.addEventListener('click', () => loadDataset('simpson_aggregated'));
    }
    if (elements.btnSimpsonMild) {
      elements.btnSimpsonMild.addEventListener('click', () => loadDataset('simpson_mild'));
    }
    if (elements.btnSimpsonSevere) {
      elements.btnSimpsonSevere.addEventListener('click', () => loadDataset('simpson_severe'));
    }

    // Synthetic Generator Sliders
    if (elements.sliderSynthN) {
      elements.sliderSynthN.addEventListener('input', (e) => {
        elements.badgeSynthN.textContent = `N = ${e.target.value}`;
      });
    }
    if (elements.sliderSynthDelta) {
      elements.sliderSynthDelta.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value).toFixed(2);
        elements.badgeSynthDelta.textContent = `δ = ${val}`;
      });
    }

    if (elements.btnGenerateSynthetic) {
      elements.btnGenerateSynthetic.addEventListener('click', handleGenerateSynthetic);
    }

    // Custom Editor Toggle
    if (elements.btnToggleCustomEditor && elements.customEditorSection) {
      elements.btnToggleCustomEditor.addEventListener('click', () => {
        const isHidden = elements.customEditorSection.style.display === 'none';
        elements.customEditorSection.style.display = isHidden ? 'block' : 'none';
        elements.btnToggleCustomEditor.textContent = isHidden ? 'Hide Custom Editor' : 'Open Custom Editor';
      });
    }

    // Parse Raw Data Button
    if (elements.btnParseRawData) {
      elements.btnParseRawData.addEventListener('click', handleParseRawData);
    }

    // Responsive Canvas Resize
    window.addEventListener('resize', debounce(() => {
      drawMosaicCanvas();
      drawChiSquareCanvas();
    }, 150));
  }

  function switchTab(targetId) {
    if (targetId === 'tab-lab') {
      elements.tabBtnLab.classList.add('active');
      elements.tabBtnReport.classList.remove('active');
      elements.tabLab.classList.add('active');
      elements.tabReport.classList.remove('active');
      drawMosaicCanvas();
      drawChiSquareCanvas();
    } else {
      elements.tabBtnLab.classList.remove('active');
      elements.tabBtnReport.classList.add('active');
      elements.tabLab.classList.remove('active');
      elements.tabReport.classList.add('active');
    }
  }

  // =========================================================================
  // DATASET LOADING & SYNTHESIS
  // =========================================================================

  function loadDataset(id) {
    const Engine = getEngine();
    if (!Engine || !Engine.PRELOADED_DATASETS) return;

    const ds = Engine.PRELOADED_DATASETS[id];
    if (!ds) return;

    state.datasetId = id;
    state.isCustom = false;
    state.matrix = ds.matrix.map(row => [...row]);
    state.rowLabels = [...ds.rowLabels];
    state.colLabels = [...ds.colLabels];

    if (elements.selectDataset) elements.selectDataset.value = id;
    if (elements.datasetTitle) elements.datasetTitle.textContent = ds.title;
    if (elements.datasetDesc) elements.datasetDesc.textContent = ds.description;

    runAnalysis();
  }

  function handleGenerateSynthetic() {
    const Engine = getEngine();
    if (!Engine || !Engine.generateSyntheticDataset) return;

    const N = parseInt(elements.sliderSynthN.value, 10) || 1000;
    const delta = parseFloat(elements.sliderSynthDelta.value) || 0.4;

    const synth = Engine.generateSyntheticDataset(3, 3, N, delta);
    state.datasetId = 'custom_synthetic';
    state.isCustom = true;
    state.matrix = synth.matrix;
    state.rowLabels = synth.rowLabels;
    state.colLabels = synth.colLabels;

    if (elements.datasetTitle) elements.datasetTitle.textContent = `Synthetic Bivariate Simulation (N=${N}, δ=${delta.toFixed(2)})`;
    if (elements.datasetDesc) elements.datasetDesc.textContent = `Randomized multinomial sampling with controlled diagonal coupling parameter δ = ${delta.toFixed(2)}. δ=0 represents pure independence.`;

    runAnalysis();
  }

  function handleParseRawData() {
    const Engine = getEngine();
    if (!Engine || !Engine.parseDataInput) return;

    const text = elements.textareaRawData.value;
    try {
      const parsed = Engine.parseDataInput(text);
      state.datasetId = 'custom_imported';
      state.isCustom = true;
      state.matrix = parsed.matrix;
      state.rowLabels = parsed.rowLabels;
      state.colLabels = parsed.colLabels;

      if (elements.datasetTitle) elements.datasetTitle.textContent = `Custom User Dataset (${parsed.rowLabels.length}x${parsed.colLabels.length})`;
      if (elements.datasetDesc) elements.datasetDesc.textContent = `Imported from custom data matrix or raw paired observations.`;

      runAnalysis();
    } catch (err) {
      alert("Error parsing input data: " + err.message);
    }
  }

  // =========================================================================
  // ANALYSIS & RENDER DISPATCHER
  // =========================================================================

  function runAnalysis() {
    const Engine = getEngine();
    if (!Engine || !Engine.analyzeContingencyTable) return;

    try {
      state.analysis = Engine.analyzeContingencyTable(state.matrix, state.rowLabels, state.colLabels, state.alpha);
    } catch (err) {
      console.error("Contingency analysis error:", err);
      return;
    }

    renderStatCards();
    renderContingencyTable();
    renderDiagnosticsAndMetrics();
    drawMosaicCanvas();
    drawChiSquareCanvas();
  }

  // =========================================================================
  // TOP STAT METRIC CARDS
  // =========================================================================

  function renderStatCards() {
    const a = state.analysis;
    if (!a) return;

    // Stat 1: Total Sample Size & Grid Dimensions
    elements.statSampleTotal.textContent = a.total.toLocaleString();
    elements.statSubDimensions.textContent = `Grid: ${a.dimensions.r} rows × ${a.dimensions.c} cols (${a.dimensions.r * a.dimensions.c} cells)`;

    // Stat 2: Chi-Square & Degrees of Freedom
    elements.statChiSquare.textContent = a.chiSquare.toFixed(3);
    elements.statSubDf.textContent = `df = (${a.dimensions.r}-1)×(${a.dimensions.c}-1) = ${a.df}`;

    // Stat 3: p-value & Critical Value
    if (a.pValue < 1e-12) {
      elements.statPValue.textContent = '< 1.00e-12';
    } else if (a.pValue < 0.001) {
      elements.statPValue.textContent = a.pValue.toExponential(3);
    } else {
      elements.statPValue.textContent = a.pValue.toFixed(4);
    }
    elements.statSubCritical.textContent = `Critical χ²(α=${a.alpha}): ${a.criticalValue.toFixed(3)}`;

    // Stat 4: Verdict & Effect Size
    if (a.isSignificant) {
      elements.statVerdict.textContent = 'Dependent';
      elements.statVerdict.style.color = '#f43f5e';
      elements.badgeHypothesisStatus.className = 'card-badge badge-rose';
      elements.badgeHypothesisStatus.textContent = 'Reject H0 • Statistically Dependent';
    } else {
      elements.statVerdict.textContent = 'Independent';
      elements.statVerdict.style.color = '#10b981';
      elements.badgeHypothesisStatus.className = 'card-badge badge-emerald';
      elements.badgeHypothesisStatus.textContent = 'Fail to Reject H0 • Consistent with Independence';
    }
    elements.statSubCramer.textContent = `Cramér's V = ${a.effectSize.cramersV.toFixed(3)} (${a.effectSize.cramersVQualitative})`;
  }

  // =========================================================================
  // CONTINGENCY MATRIX TABLE RENDERER
  // =========================================================================

  function renderContingencyTable() {
    const a = state.analysis;
    if (!a) return;

    const mode = state.viewMode;
    const r = a.dimensions.r;
    const c = a.dimensions.c;

    let html = `<table class="contingency-table">`;

    // 1. Table Header: Column Labels
    html += `<thead><tr>`;
    html += `<th class="corner-header">X \\ Y</th>`;
    for (let j = 0; j < c; j++) {
      html += `<th>${escapeHtml(a.colLabels[j])}<br><span style="font-size:0.7rem; color:#64748b; font-weight:400;">C${j+1}</span></th>`;
    }
    html += `<th class="total-cell">Row Total (R<sub>i</sub>)<br><span style="font-size:0.7rem; color:#64748b; font-weight:400;">f<sub>X</sub>(x)</span></th>`;
    html += `</tr></thead>`;

    // 2. Table Body: Rows of Categories
    html += `<tbody>`;
    for (let i = 0; i < r; i++) {
      html += `<tr>`;
      html += `<th class="row-header">${escapeHtml(a.rowLabels[i])}<br><span style="font-size:0.7rem; color:#64748b; font-weight:400;">R${i+1}</span></th>`;

      for (let j = 0; j < c; j++) {
        const Oij = a.observed[i][j];
        const Eij = a.expected[i][j];
        const dev = a.rawDeviations[i][j];
        const pRes = a.pearsonResiduals[i][j];
        const stdRes = a.standardizedResiduals[i][j];
        const chi2Cell = a.chi2Contributions[i][j];
        const rowPct = a.rowConditionals[i][j] * 100;
        const colPct = a.colConditionals[i][j] * 100;

        // Determine Heatmap Shading based on Standardized Residual
        let shadeClass = 'shade-neutral';
        if (stdRes >= 3.0) shadeClass = 'shade-over-high';
        else if (stdRes >= 2.0) shadeClass = 'shade-over-med';
        else if (stdRes >= 1.0) shadeClass = 'shade-over-low';
        else if (stdRes <= -3.0) shadeClass = 'shade-under-high';
        else if (stdRes <= -2.0) shadeClass = 'shade-under-med';
        else if (stdRes <= -1.0) shadeClass = 'shade-under-low';

        // Select primary value and subtitle based on view mode
        let mainVal = '';
        let subVal = '';

        switch (mode) {
          case 'observed':
            mainVal = Oij.toLocaleString();
            subVal = `Exp: ${Eij.toFixed(1)}`;
            break;
          case 'expected':
            mainVal = Eij.toFixed(2);
            subVal = `Obs: ${Oij}`;
            break;
          case 'deviations':
            mainVal = (dev >= 0 ? '+' : '') + dev.toFixed(1);
            subVal = `std: ${stdRes.toFixed(2)}`;
            break;
          case 'row_pct':
            mainVal = `${rowPct.toFixed(1)}%`;
            subVal = `P(Y|X=${i+1})`;
            break;
          case 'col_pct':
            mainVal = `${colPct.toFixed(1)}%`;
            subVal = `P(X|Y=${j+1})`;
            break;
          case 'chi2_cells':
            mainVal = chi2Cell.toFixed(2);
            subVal = `${((chi2Cell / a.chiSquare) * 100).toFixed(1)}% of χ²`;
            break;
          case 'std_residuals':
            mainVal = (stdRes >= 0 ? '+' : '') + stdRes.toFixed(2);
            subVal = Math.abs(stdRes) > 1.96 ? 'p < 0.05*' : 'n.s.';
            break;
          default:
            mainVal = Oij.toString();
            subVal = `E: ${Eij.toFixed(1)}`;
        }

        html += `<td class="matrix-cell ${shadeClass}">
          <span>${mainVal}</span>
          <span class="cell-subtext">${subVal}</span>
        </td>`;
      }

      // Row Total Cell
      const Ri = a.rowTotals[i];
      const rowMargPct = (a.rowMarginals[i] * 100).toFixed(1);
      html += `<td class="total-cell">
        <span>${Ri.toLocaleString()}</span>
        <span class="cell-subtext">${rowMargPct}%</span>
      </td>`;

      html += `</tr>`;
    }
    html += `</tbody>`;

    // 3. Table Footer: Column Marginals & Grand Total
    html += `<tfoot><tr>`;
    html += `<th class="total-cell">Col Total (C<sub>j</sub>)<br><span style="font-size:0.7rem; color:#64748b; font-weight:400;">f<sub>Y</sub>(y)</span></th>`;
    for (let j = 0; j < c; j++) {
      const Cj = a.colTotals[j];
      const colMargPct = (a.colMarginals[j] * 100).toFixed(1);
      html += `<td class="total-cell">
        <span>${Cj.toLocaleString()}</span>
        <span class="cell-subtext">${colMargPct}%</span>
      </td>`;
    }
    html += `<td class="grand-total">
      <span>N = ${a.total.toLocaleString()}</span>
      <span class="cell-subtext">100.0%</span>
    </td>`;
    html += `</tr></tfoot>`;

    html += `</table>`;

    elements.tableContainer.innerHTML = html;
  }

  // =========================================================================
  // DIAGNOSTICS & EFFECT SIZES
  // =========================================================================

  function renderDiagnosticsAndMetrics() {
    const a = state.analysis;
    if (!a) return;

    // Cochran Banner
    if (a.cochran.valid) {
      elements.cochranBanner.className = 'callout-box success';
      elements.cochranText.innerHTML = `<strong>Cochran Rule Satisfied:</strong> All cells have expected frequency ≥ 1.0 (minimum is ${a.cochran.minExpected.toFixed(2)}), and ${a.cochran.pctUnder5.toFixed(1)}% of cells are &lt; 5.0 (limit is 20%). The asymptotic Chi-square distribution is highly reliable.`;
    } else {
      elements.cochranBanner.className = 'callout-box warning';
      elements.cochranText.innerHTML = `<strong>${a.cochran.message}</strong> Small expected frequencies may distort asymptotic $p$-values.`;
    }

    // Effect Size Metrics
    elements.metricCramerV.textContent = a.effectSize.cramersV.toFixed(3);
    elements.metricContingencyC.textContent = `${a.effectSize.contingencyCoeff.toFixed(3)} (Norm: ${a.effectSize.contingencyCoeffNorm.toFixed(2)})`;
    elements.metricTschuprowT.textContent = a.effectSize.tschuprowT.toFixed(3);

    // 2x2 Specialized Odds Ratio & Relative Risk
    if (a.dimensions.r === 2 && a.dimensions.c === 2 && a.effectSize.oddsRatio) {
      elements.boxTwoByTwo.style.display = 'block';
      const or = a.effectSize.oddsRatio;
      elements.metricOddsRatio.textContent = `${or.or.toFixed(2)} [95% CI: ${or.ciLower.toFixed(2)} - ${or.ciUpper.toFixed(2)}]`;

      if (a.effectSize.relativeRisk) {
        const rr = a.effectSize.relativeRisk;
        elements.metricRelativeRisk.textContent = `${rr.rr.toFixed(2)} [95% CI: ${rr.ciLower.toFixed(2)} - ${rr.ciUpper.toFixed(2)}]`;
      }
    } else {
      elements.boxTwoByTwo.style.display = 'none';
    }
  }

  // =========================================================================
  // CANVAS 1: MOSAIC PLOT (MARIMEKKO CHART)
  // =========================================================================

  function drawMosaicCanvas() {
    const canvas = elements.canvasMosaic;
    if (!canvas || !canvas.getContext || !state.analysis) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const a = state.analysis;
    const r = a.dimensions.r;
    const c = a.dimensions.c;

    const padLeft = 70;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 55;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Header label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Mosaic Plot: Column Widths = Marginal f_Y(y) | Tile Heights = Conditional f_{X|Y}(x|y)', padLeft, padTop - 14);

    // Color palette for rows (X categories)
    const rowColors = [
      '#38bdf8', // Cyan
      '#10b981', // Emerald
      '#a855f7', // Violet
      '#f59e0b', // Amber
      '#f43f5e'  // Rose
    ];

    let currentX = padLeft;

    for (let j = 0; j < c; j++) {
      const colMarg = a.colMarginals[j];
      const colW = colMarg * plotW;

      // Draw vertical partition for Column Y_j
      let currentY = padTop + plotH;

      for (let i = 0; i < r; i++) {
        const condProb = a.colConditionals[i][j]; // P(X=i | Y=j)
        const tileH = condProb * plotH;
        const tileY = currentY - tileH;

        // Base color with residual brightness modulation
        const baseColor = rowColors[i % rowColors.length];
        const stdRes = a.standardizedResiduals[i][j];

        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.75 + Math.min(0.25, Math.abs(stdRes) * 0.08);
        ctx.fillRect(currentX, tileY, colW, tileH);
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = '#070b14';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(currentX, tileY, colW, tileH);

        // Tile text if space permits
        if (colW > 45 && tileH > 24) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Fira Code, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${(condProb * 100).toFixed(0)}%`, currentX + colW / 2, tileY + tileH / 2 - 4);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '8px Inter, sans-serif';
          ctx.fillText(`O=${a.observed[i][j]}`, currentX + colW / 2, tileY + tileH / 2 + 8);
        }

        currentY -= tileH;
      }

      // Column Label at Bottom
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      const colName = a.colLabels[j].length > 12 ? a.colLabels[j].substring(0, 10) + '..' : a.colLabels[j];
      ctx.fillText(colName, currentX + colW / 2, padTop + plotH + 16);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.fillText(`(${(colMarg * 100).toFixed(1)}%)`, currentX + colW / 2, padTop + plotH + 28);

      currentX += colW;
    }

    // Left Y-Axis reference guide
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Y ticks
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'right';
    for (let p = 0; p <= 1.0; p += 0.25) {
      const yPos = padTop + plotH - p * plotH;
      ctx.fillText(`${(p * 100).toFixed(0)}%`, padLeft - 8, yPos + 3);
    }

    // Legend on Top Right for Rows (X categories)
    let legX = padLeft + plotW - 10;
    for (let i = r - 1; i >= 0; i--) {
      ctx.fillStyle = rowColors[i % rowColors.length];
      ctx.fillRect(legX - 10, padTop - 18, 8, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      const rName = a.rowLabels[i].length > 10 ? a.rowLabels[i].substring(0, 8) + '..' : a.rowLabels[i];
      ctx.fillText(rName, legX - 14, padTop - 11);
      legX -= (ctx.measureText(rName).width + 30);
    }
  }

  // =========================================================================
  // CANVAS 2: CHI-SQUARE PDF & REJECTION REGION
  // =========================================================================

  function drawChiSquareCanvas() {
    const canvas = elements.canvasChiSquare;
    if (!canvas || !canvas.getContext || !state.analysis) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const a = state.analysis;
    const df = a.df;
    const chiCalc = a.chiSquare;
    const chiCrit = a.criticalValue;

    const padLeft = 50;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 45;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const Engine = getEngine();
    if (!Engine || !Engine.chiSquarePdf) return;

    // Determine domain [0, xMax]
    const xMax = Math.max(16, chiCrit * 1.5, Math.min(60, chiCalc * 1.25));

    // Sample points along PDF
    const numPoints = 200;
    const points = [];
    let maxPdf = 0;

    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * xMax;
      const pdf = Engine.chiSquarePdf(x, df);
      if (pdf > maxPdf) maxPdf = pdf;
      points.push({ x, pdf });
    }

    if (maxPdf === 0) maxPdf = 0.5;
    const yTopScale = maxPdf * 1.15;

    function getX(x) {
      return padLeft + (x / xMax) * chartW;
    }

    function getY(pdf) {
      return padTop + chartH - (pdf / yTopScale) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let xTick = 0; xTick <= xMax; xTick += Math.ceil(xMax / 6)) {
      const tx = getX(xTick);
      ctx.beginPath();
      ctx.moveTo(tx, padTop);
      ctx.lineTo(tx, padTop + chartH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${xTick}`, tx, padTop + chartH + 14);
    }

    // 1. Shaded Critical Rejection Region [chiCrit, xMax]
    ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
    ctx.beginPath();
    ctx.moveTo(getX(chiCrit), padTop + chartH);
    for (let i = 0; i <= numPoints; i++) {
      if (points[i].x >= chiCrit) {
        ctx.lineTo(getX(points[i].x), getY(points[i].pdf));
      }
    }
    ctx.lineTo(padLeft + chartW, padTop + chartH);
    ctx.closePath();
    ctx.fill();

    // 2. Draw PDF Curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const px = getX(points[i].x);
      const py = getY(points[i].pdf);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 3. Vertical Critical Value Line
    const xCritPos = getX(chiCrit);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xCritPos, padTop);
    ctx.lineTo(xCritPos, padTop + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Critical χ²=${chiCrit.toFixed(2)} (α=${a.alpha})`, xCritPos, padTop - 6);

    // 4. Vertical Calculated Chi-Square Indicator
    if (chiCalc <= xMax) {
      const xCalcPos = getX(chiCalc);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(xCalcPos, padTop + 10);
      ctx.lineTo(xCalcPos, padTop + chartH);
      ctx.stroke();

      // Glowing dot
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.beginPath();
      ctx.arc(xCalcPos, padTop + chartH - 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(xCalcPos, padTop + chartH - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`χ² = ${chiCalc.toFixed(2)}`, xCalcPos, padTop + 6);
    } else {
      // Off-chart indicator
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`χ² = ${chiCalc.toFixed(1)} >> ${xMax} (Off-chart Right)`, padLeft + chartW, padTop + 20);
    }

    // Chart Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Theoretical Density: χ²(df=${df}) | Red Zone = Rejection Region (α=${a.alpha})`, padLeft, padTop + chartH + 34);
  }

  // =========================================================================
  // REPORT MARKDOWN LOADER & BULLETPROOF KATEX PIPELINE
  // =========================================================================

  function loadReportMarkdown() {
    fetch('Homework6_Report.md')
      .then(res => {
        if (!res.ok) throw new Error("Could not load Homework6_Report.md");
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
              rendered = katex.renderToString(math, { displayMode: true, throwOnError: false });
            } catch (err) {
              rendered = `<div class="katex-error">\\[${escapeHtml(math)}\\]</div>`;
            }
          } else {
            rendered = `<div class="math-display">\\[${escapeHtml(math)}\\]</div>`;
          }
          html = html.replace(id, rendered);
        });

        // Step 5: Render inline math with KaTeX directly
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

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

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

  // Boot Application
  window.addEventListener('DOMContentLoaded', init);
})();
