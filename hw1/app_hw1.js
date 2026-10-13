/**
 * Homework 1: Public-Key Cryptography & Scalar Multiplication
 * Controller and Application Logic
 */

(function () {
  'use strict';

  // --- HW1 Application State ---
  const state = {
    curve: new window.ToyEllipticCurve(17, 0, 7),
    basePoint: { x: 1, y: 5 },
    k: 6,
    history: [],
    currentStepIndex: 0,
    isPlaying: false,
    playTimer: null,
    speedMs: 800,
    discreteVis: null,
    statsEngine: null
  };

  // --- Initialization on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initHW1();
    initReportViewer();
  });

  // --- Tab Navigation ---
  function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(target);
        if (targetContent) {
          targetContent.classList.add('active');
          if (target === 'tab-hw1') {
            requestAnimationFrame(() => {
              if (state.discreteVis) state.discreteVis.resize();
              runStatisticalAnalysis();
            });
          } else if (target === 'tab-report') {
            const container = document.getElementById('reportMarkdownContent');
            if (container) renderMath(container);
          }
        }
      });
    });
  }

  // --- HW1 Interactive Laboratory ---
  function initHW1() {
    const curve = state.curve;
    state.statsEngine = new window.ECCStatisticalEngine(curve, state.basePoint);

    const discCanvas = document.getElementById('discreteCanvas');
    if (discCanvas) {
      state.discreteVis = new window.DiscreteGridVisualizer(discCanvas, curve);
    }

    window.addEventListener('resize', () => {
      if (state.discreteVis) state.discreteVis.resize();
      runStatisticalAnalysis();
    });

    // Populate Base Point Selector
    const basePtSelect = document.getElementById('basePointSelect');
    if (basePtSelect) {
      const allPoints = curve.findAllPoints();
      basePtSelect.innerHTML = '';
      allPoints.forEach(pt => {
        const opt = document.createElement('option');
        opt.value = `${pt.x},${pt.y}`;
        opt.textContent = `(${pt.x}, ${pt.y})${pt.x === 1 && pt.y === 5 ? ' — Standard Generator G' : ''}`;
        if (pt.x === 1 && pt.y === 5) opt.selected = true;
        basePtSelect.appendChild(opt);
      });

      basePtSelect.addEventListener('change', e => {
        const parts = e.target.value.split(',').map(Number);
        state.basePoint = { x: parts[0], y: parts[1] };
        state.statsEngine = new window.ECCStatisticalEngine(curve, state.basePoint);
        updateHW1Calculation();
        updateGroupOrderTable();
        runStatisticalAnalysis();
      });
    }

    // Scalar Slider & Input
    const kSlider = document.getElementById('kSlider');
    const kValDisplay = document.getElementById('kValDisplay');

    if (kSlider) {
      kSlider.addEventListener('input', e => {
        state.k = parseInt(e.target.value, 10);
        if (kValDisplay) kValDisplay.textContent = state.k;
        updateHW1Calculation();
      });
    }

    // Playback Controls
    const resetBtn = document.getElementById('resetAnimBtn');
    const stepBackBtn = document.getElementById('stepBackBtn');
    const playBtn = document.getElementById('playAnimBtn');
    const stepFwdBtn = document.getElementById('stepFwdBtn');
    const speedSlider = document.getElementById('animSpeedSlider');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (state.isPlaying) {
          pauseHW1Animation();
        } else {
          playHW1Animation();
        }
      });
    }

    if (stepFwdBtn) {
      stepFwdBtn.addEventListener('click', () => {
        pauseHW1Animation();
        if (state.currentStepIndex < state.history.length - 1) {
          state.currentStepIndex++;
          renderCurrentHW1Step();
        }
      });
    }

    if (stepBackBtn) {
      stepBackBtn.addEventListener('click', () => {
        pauseHW1Animation();
        if (state.currentStepIndex > 0) {
          state.currentStepIndex--;
          renderCurrentHW1Step();
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        pauseHW1Animation();
        state.currentStepIndex = 0;
        renderCurrentHW1Step();
      });
    }

    if (speedSlider) {
      speedSlider.addEventListener('input', e => {
        state.speedMs = 2100 - parseInt(e.target.value, 10);
        if (state.isPlaying) {
          pauseHW1Animation();
          playHW1Animation();
        }
      });
    }

    // Initial run
    requestAnimationFrame(() => {
      if (state.discreteVis) state.discreteVis.resize();
    });
    updateHW1Calculation();
    updateGroupOrderTable();
    runStatisticalAnalysis();
  }

  function updateHW1Calculation() {
    pauseHW1Animation();
    const curve = state.curve;
    const G = state.basePoint;
    const k = state.k;

    // Generate naive addition history
    state.history = curve.scalarMultiplyHistory(k, G);
    state.currentStepIndex = state.history.length - 1;

    // Display Public Key
    const finalStep = state.history[state.history.length - 1];
    const pubKeyDisplay = document.getElementById('toyPublicKeyDisplay');
    if (pubKeyDisplay) {
      if (finalStep && finalStep.point) {
        pubKeyDisplay.textContent = `Q = ${k}G = (${finalStep.point.x}, ${finalStep.point.y})`;
        pubKeyDisplay.className = 'metric-tile-val text-emerald';
      } else {
        pubKeyDisplay.textContent = `Q = ${k}G = 𝒪 (Point at Infinity)`;
        pubKeyDisplay.className = 'metric-tile-val text-rose';
      }
    }

    // Populate Step Table
    const tableBody = document.getElementById('stepTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      state.history.forEach((step, idx) => {
        const row = document.createElement('tr');
        row.id = `step-row-${idx}`;
        if (idx === state.currentStepIndex) row.classList.add('highlight');

        const ptStr = step.point ? `(${step.point.x}, ${step.point.y})` : '𝒪 (Infinity)';
        const slopeStr = step.slope !== null ? step.slope.toString() : '-';
        const opStr = idx === 0 ? 'Base point G' : (step.prevPoint && step.prevPoint.x === G.x && step.prevPoint.y === G.y ? 'Point Doubling' : 'Point Addition');

        row.innerHTML = `
          <td><strong>${step.label}</strong></td>
          <td>${opStr}</td>
          <td>${slopeStr}</td>
          <td><strong>${ptStr}</strong></td>
        `;

        row.addEventListener('click', () => {
          pauseHW1Animation();
          state.currentStepIndex = idx;
          renderCurrentHW1Step();
        });

        tableBody.appendChild(row);
      });
    }

    // Render Current Step on Canvas
    renderCurrentHW1Step();

    // Double-and-Add Algorithm Steps
    const daResult = curve.scalarMultiplyDoubleAndAdd(k, G);
    const daTableBody = document.getElementById('daTableBody');
    if (daTableBody) {
      daTableBody.innerHTML = '';
      daResult.steps.forEach(st => {
        const row = document.createElement('tr');
        const resStr = st.result ? `(${st.result.x}, ${st.result.y})` : (st.type === 'INIT' ? '-' : '𝒪');
        const badgeClass = st.type === 'DOUBLE' ? 'badge-amber' : (st.type === 'ADD' ? 'badge-cyan' : 'badge-emerald');
        row.innerHTML = `
          <td><span class="card-badge ${badgeClass}" style="font-size:0.7rem;">${st.type}</span></td>
          <td>${st.description}</td>
          <td><strong>${resStr}</strong></td>
        `;
        daTableBody.appendChild(row);
      });
    }

    // Complexity comparison tile
    const naiveOps = k - 1;
    const binary = k.toString(2);
    const daOps = (binary.length - 1) + (binary.split('1').length - 2);
    setText('complexityComparisonVal', `${naiveOps} vs ${Math.max(0, daOps)} ops`);
    setText('complexitySubtitle', `Naive Addition: ${naiveOps} additions | Double-and-Add: ${Math.max(0, daOps)} point operations`);
  }

  function renderCurrentHW1Step() {
    if (!state.history.length) return;
    const stepData = state.history[state.currentStepIndex];
    if (!stepData) return;

    // Highlight row in table
    state.history.forEach((_, idx) => {
      const row = document.getElementById(`step-row-${idx}`);
      if (row) {
        if (idx === state.currentStepIndex) {
          row.classList.add('highlight');
          row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          row.classList.remove('highlight');
        }
      }
    });

    // Update Step Indicator in Canvas Header
    setText('currentStepIndicator', `Step: ${stepData.label}`);

    // Render Canvas
    if (state.discreteVis) {
      state.discreteVis.render(stepData);
    }
  }

  function playHW1Animation() {
    state.isPlaying = true;
    const playBtn = document.getElementById('playAnimBtn');
    if (playBtn) playBtn.innerHTML = '&#10074;&#10074; Pause';

    if (state.currentStepIndex >= state.history.length - 1) {
      state.currentStepIndex = 0;
    }

    function tick() {
      if (!state.isPlaying) return;
      if (state.currentStepIndex < state.history.length - 1) {
        state.currentStepIndex++;
        renderCurrentHW1Step();
        state.playTimer = setTimeout(tick, state.speedMs);
      } else {
        pauseHW1Animation();
      }
    }

    state.playTimer = setTimeout(tick, state.speedMs);
  }

  function pauseHW1Animation() {
    state.isPlaying = false;
    if (state.playTimer) clearTimeout(state.playTimer);
    const playBtn = document.getElementById('playAnimBtn');
    if (playBtn) playBtn.innerHTML = '&#9658; Play';
  }

  function updateGroupOrderTable() {
    const curve = state.curve;
    const G = state.basePoint;
    const allPts = curve.findAllPoints();
    const totalOrder = allPts.length + 1; // including point at infinity

    setText('groupOrderVal', `${totalOrder} elements`);
    setText('groupOrderHasse', `Hasse bound: |18 - (17+1)| = 0 <= 2*sqrt(17) ~= 8.25`);

    // Group elements classification table
    const tableBody = document.getElementById('groupPointsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    allPts.forEach(pt => {
      const order = curve.findPointOrder(pt);
      const isGenerator = (pt.x === G.x && pt.y === G.y);
      const row = document.createElement('tr');
      if (isGenerator) row.classList.add('highlight');

      row.innerHTML = `
        <td><strong>(${pt.x}, ${pt.y})</strong> ${isGenerator ? '<span class="card-badge badge-cyan" style="font-size:0.65rem;">G</span>' : ''}</td>
        <td>${order !== null ? order : '&infin;'}</td>
        <td>${order === totalOrder ? 'Generator of E(F17)' : (order === 9 ? 'Subgroup Order 9' : (order === 3 ? 'Subgroup Order 3' : 'Cyclic'))}</td>
        <td>${(pt.y * pt.y) % 17}</td>
      `;
      tableBody.appendChild(row);
    });

    // Infinity element row
    const infRow = document.createElement('tr');
    infRow.innerHTML = `
      <td><strong>𝒪 (Infinity)</strong></td>
      <td>1</td>
      <td>Neutral Identity Element</td>
      <td>-</td>
    `;
    tableBody.appendChild(infRow);
  }

  function runStatisticalAnalysis() {
    if (!state.statsEngine) return;
    const stats = state.statsEngine.computeFullStatistics();

    // Update KPI Tiles
    setText('statSampleSize', `${stats.sampleSize} points`);
    setText('statShannonX', `${stats.entropy.entropyX.toFixed(3)} bits`);
    setText('statShannonY', `${stats.entropy.entropyY.toFixed(3)} bits`);
    setText('statMaxEntropy', `Max: ${stats.entropy.maxEntropy.toFixed(3)} bits`);
    setText('statChiSquareX', `X: \u03c7\u00b2 = ${stats.chiSquare.chiSquareX.toFixed(2)}`);
    setText('statChiSquareY', `Y: \u03c7\u00b2 = ${stats.chiSquare.chiSquareY.toFixed(2)}`);
    setText('statChiPVal', stats.chiSquare.uniformRejected ? 'Non-uniform (p < 0.05)' : 'Consistent with Uniform');
    setText('statSACVal', `${stats.sac.averageSACPercent.toFixed(1)}%`);
    setText('statCorrelationVal', `r = ${stats.correlation.pearsonR.toFixed(3)}`);

    // Render Charts
    renderMarginalDistribution(stats.marginal);
    renderShannonBitEntropy(stats.entropy);
    renderSACAvalancheTest(stats.sac);
    renderCorrelationMetrics(stats.correlation);
  }

  function renderMarginalDistribution(marginal) {
    const canvasX = document.getElementById('histCanvasX');
    const canvasY = document.getElementById('histCanvasY');
    if (!canvasX || !canvasY) return;

    drawHistogram(canvasX, marginal.freqX, marginal.labelsX, '#38bdf8', 'X-Coordinate Frequency');
    drawHistogram(canvasY, marginal.freqY, marginal.labelsY, '#ec4899', 'Y-Coordinate Frequency (Quadratic Residues)');
  }

  function drawHistogram(canvas, frequencies, labels, color, title) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText(title, 12, 16);

    const maxVal = Math.max(...frequencies, 1);
    const paddingBottom = 24;
    const paddingTop = 26;
    const paddingLeft = 14;
    const paddingRight = 14;
    const plotW = width - paddingLeft - paddingRight;
    const plotH = height - paddingTop - paddingBottom;
    const n = frequencies.length;
    const barW = Math.max(2, (plotW / n) - 2);

    for (let i = 0; i < n; i++) {
      const val = frequencies[i];
      const barH = (val / maxVal) * plotH;
      const x = paddingLeft + i * (plotW / n);
      const y = height - paddingBottom - barH;

      ctx.fillStyle = val > 0 ? color : '#1e293b';
      ctx.fillRect(x, y, barW, barH);

      if (i % 2 === 0 || n <= 10) {
        ctx.fillStyle = '#475569';
        ctx.font = '9px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barW / 2, height - 6);
      }
    }
    ctx.textAlign = 'start';
  }

  function renderShannonBitEntropy(entropy) {
    const canvas = document.getElementById('entropyCanvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText('Bit Frequency per Coordinate Position', 12, 16);

    const bitFreqX = entropy.bitFrequenciesX || [0.5, 0.5, 0.5, 0.5, 0.5];
    const bitFreqY = entropy.bitFrequenciesY || [0.5, 0.5, 0.5, 0.5, 0.5];

    const paddingX = 40;
    const barHeight = 16;
    const startY = 32;

    bitFreqX.forEach((p, idx) => {
      const y = startY + idx * (barHeight + 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(`Bit ${idx}:`, 10, y + 12);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(paddingX, y, width - paddingX - 60, barHeight);

      const fillW = Math.max(0, (width - paddingX - 60) * p);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(paddingX, y, fillW, barHeight);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(`${(p * 100).toFixed(0)}%`, width - 50, y + 12);
    });
  }

  function renderSACAvalancheTest(sac) {
    const canvas = document.getElementById('sacCanvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText('Strict Avalanche Criterion (Bit Flips vs 50% Ideal)', 12, 16);

    const flips = sac.flipsByBit || [50, 48, 52, 49, 51];
    const n = flips.length;
    const paddingLeft = 30;
    const plotW = width - paddingLeft - 20;
    const barW = plotW / n - 8;

    // Ideal 50% line
    const idealY = height - 20 - (50 / 100) * (height - 50);
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, idealY);
    ctx.lineTo(width - 20, idealY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '9px "Inter", sans-serif';
    ctx.fillText('Ideal 50%', width - 58, idealY - 4);

    flips.forEach((pct, idx) => {
      const x = paddingLeft + idx * (plotW / n);
      const h = (pct / 100) * (height - 50);
      const y = height - 20 - h;

      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x, y, barW, h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`b${idx}`, x + barW / 2, height - 6);
    });
    ctx.textAlign = 'start';
  }

  function renderCorrelationMetrics(corr) {
    setText('pearsonRDisplay', corr.pearsonR.toFixed(3));
    setText('spearmanRhoDisplay', corr.spearmanRho.toFixed(3));
  }

  // --- Formal Report Viewer & KaTeX Renderer ---
  function initReportViewer() {
    const container = document.getElementById('reportMarkdownContent');
    if (!container) return;

    container.innerHTML = `
      <h1>Module 1: Public-Key Cryptography & Scalar Multiplication in Ethereum</h1>
      <p><strong>Specification:</strong> SECP256K1 & Finite Field Arithmetic &bull; <strong>Topic:</strong> Public-Key Cryptography</p>
      
      <h2>1. Mathematical Foundations: The Toy Elliptic Curve</h2>
      <p>In this project, we implement and statistically explore the Weierstrass elliptic curve over the finite prime field $\\mathbb{F}_{17}$:</p>
      <div class="math-box">
        <p><strong>Curve Equation:</strong> $y^2 \\equiv x^3 + 7 \\pmod{17}$</p>
        <p><strong>Field:</strong> $\\mathbb{F}_{17} = \\{0, 1, 2, \\dots, 16\\}$</p>
        <p><strong>Base Point:</strong> $G = (1, 5)$</p>
        <p><strong>Private Key:</strong> $k = 6$</p>
      </div>

      <p>Verifying that $G=(1,5)$ lies on the curve:</p>
      <div class="math-box">
        $$\\begin{aligned}
          \\text{LHS} &= 5^2 = 25 \\equiv 8 \\pmod{17} \\\\[6pt]
          \\text{RHS} &= 1^3 + 7 = 8 \\equiv 8 \\pmod{17} \\\\[6pt]
          \\text{LHS} &\\equiv \\text{RHS} \\implies G(1, 5) \\in E(\\mathbb{F}_{17})
        \\end{aligned}$$
      </div>

      <h2>2. Group Law & Point Arithmetic over Finite Fields</h2>
      <p>The set of points $E(\\mathbb{F}_{17})$ along with the point at infinity $\\mathcal{O}$ forms an abelian group under the chord-and-tangent addition rule:</p>
      <ul>
        <li><strong>Identity Element:</strong> $P + \\mathcal{O} = P$ for all $P$.</li>
        <li><strong>Inverse:</strong> For $P = (x, y)$, $-P = (x, -y \\pmod{17}) = (x, 17 - y)$.</li>
        <li><strong>Point Doubling ($P = Q$):</strong>
          $$m \\equiv \\frac{3x_1^2 + a}{2y_1} \\pmod{17}$$
        </li>
        <li><strong>Point Addition ($P \\ne Q$):</strong>
          $$m \\equiv \\frac{y_2 - y_1}{x_2 - x_1} \\pmod{17}$$
        </li>
        <li><strong>Result Coordinates:</strong>
          $$x_3 \\equiv m^2 - x_1 - x_2 \\pmod{17}$$
          $$y_3 \\equiv m(x_1 - x_3) - y_1 \\pmod{17}$$
        </li>
      </ul>

      <h2>3. Step-by-Step Scalar Multiplication ($k = 6$)</h2>
      <p>Computing $1G, 2G, \\dots, 6G$:</p>
      <ul>
        <li>$1G = (1, 5)$</li>
        <li>$2G = G + G = (2, 10)$ &mdash; [Doubling: $m \\equiv (3\\cdot 1^2)/(2\cdot 5) \\equiv 3\\cdot 10^{-1} \\equiv 3\\cdot 12 \\equiv 2 \\pmod{17}$]</li>
        <li>$3G = 2G + G = (5, 9)$</li>
        <li>$4G = 3G + G = (12, 1)$</li>
        <li>$5G = 4G + G = (12, 16)$</li>
        <li><strong>$6G = 5G + G = (5, 8)$ &mdash; TOY PUBLIC KEY $Q = (5, 8)$</strong></li>
      </ul>

      <h2>4. Group Structure & Order Analysis</h2>
      <p>By exhaustive enumeration of $\\mathbb{F}_{17} \\times \\mathbb{F}_{17}$, the curve contains exactly <strong>17 affine points</strong> plus $\\mathcal{O}$, yielding total group order $|E(\\mathbb{F}_{17})| = 18$. By Hasse's Theorem, $|18 - (17 + 1)| = 0 \\le 2\\sqrt{17} \\approx 8.246$.</p>
      <p>The base point $G=(1,5)$ has order <strong>9</strong>, generating the cyclic subgroup:</p>
      <div class="math-box">
        $$\\langle G \\rangle = \\{ (1,5), (2,10), (5,9), (12,1), (12,16), (5,8), (2,7), (1,12), \\mathcal{O} \\}$$
      </div>

      <h2>5. Statistical Exploration Findings</h2>
      <p>Our statistical evaluation reveals fundamental cryptographic properties:</p>
      <ul>
        <li><strong>Non-Uniform Marginal Frequencies:</strong> The $y$ coordinates are restricted to quadratic residues modulo 17. Exactly $(17-1)/2 = 8$ quadratic residues exist in $\\mathbb{F}_{17}^*$, meaning half of all field values can never appear as $y$-coordinates! This proves why ECC scalar multiplication is NOT a uniform pseudorandom function.</li>
        <li><strong>Strict Avalanche Criterion (SAC):</strong> Flipping 1 bit of $k$ does not achieve the ideal 50% diffusion expected from hash functions because scalar multiplication preserves algebraic linearity: $(k + \\Delta)G = kG + \\Delta G$.</li>
        <li><strong>One-Way Function vs Hash Function:</strong> Scalar multiplication is a <em>trapdoor-free one-way function</em> based on the hardness of the Elliptic Curve Discrete Logarithm Problem (ECDLP). However, it lacks collision resistance and domain compression, making it unsuitable as a general-purpose hash function.</li>
      </ul>
    `;

    renderMath(container);
  }

  function renderMath(el) {
    if (!el) return;
    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
        return;
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window.renderMathInElement === 'function') {
        clearInterval(interval);
        try {
          window.renderMathInElement(el, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {}
      } else if (attempts > 12) {
        clearInterval(interval);
      }
    }, 150);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

})();
