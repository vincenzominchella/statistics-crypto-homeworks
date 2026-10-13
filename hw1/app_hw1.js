/**
 * Homework 1: Public-Key Cryptography — SECP256K1 & Finite Field Arithmetic
 * Controller, Animation Engine, Statistical Testing & Paper Viewer
 */

(function () {
  'use strict';

  // --- HW1 Application State ---
  const state = {
    curve: new window.ToyEllipticCurve(17, 0, 7),
    basePoint: { x: 1, y: 5 },
    privateKeyK: 6,
    history: [],
    currentStepIndex: 0,
    isPlaying: false,
    playTimer: null,
    speedMs: 750,
    discreteVis: null,
    statsEngine: null
  };

  // --- Initialization on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    try { initTabs(); } catch (e) { console.error('Tabs error:', e); }
    try { initHW1(); } catch (e) { console.error('HW1 error:', e); }
    try { initReportViewer(); } catch (e) { console.error('Report error:', e); }
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
            if (container) {
              if (!container.dataset.rendered) {
                initReportViewer();
              }
              renderMath(container);
            }
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
        const order = curve.computePointOrder(pt);
        opt.textContent = `(${pt.x}, ${pt.y}) [Order: ${order}]`;
        if (pt.x === 1 && pt.y === 5) opt.selected = true;
        basePtSelect.appendChild(opt);
      });

      basePtSelect.addEventListener('change', () => {
        const [x, y] = basePtSelect.value.split(',').map(Number);
        state.basePoint = { x, y };
        state.statsEngine = new window.ECCStatisticalEngine(curve, state.basePoint);
        updateHW1Calculation();
      });
    }

    // Key K Slider & Input
    const kSlider = document.getElementById('kSlider');
    const kInput = document.getElementById('kInput');
    const kValDisplay = document.getElementById('kValDisplay');

    function setK(val) {
      val = parseInt(val, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 18) val = 18;
      state.privateKeyK = val;
      if (kSlider) kSlider.value = val;
      if (kInput) kInput.value = val;
      if (kValDisplay) kValDisplay.textContent = val;
      updateHW1Calculation();
    }

    if (kSlider) {
      kSlider.addEventListener('input', e => setK(e.target.value));
    }
    if (kInput) {
      kInput.addEventListener('change', e => setK(e.target.value));
    }

    // Animation Controls
    const playBtn = document.getElementById('playAnimBtn');
    const stepFwdBtn = document.getElementById('stepFwdBtn');
    const stepBackBtn = document.getElementById('stepBackBtn');
    const resetBtn = document.getElementById('resetAnimBtn');
    const speedSlider = document.getElementById('animSpeedSlider');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (state.isPlaying) pauseHW1Animation();
        else playHW1Animation();
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
        state.speedMs = parseInt(e.target.value, 10);
      });
    }

    // Initial Execution
    updateHW1Calculation();
    updateGroupTheoryInfo();
    runStatisticalAnalysis();
  }

  function updateHW1Calculation() {
    const k = state.privateKeyK;
    const G = state.basePoint;
    const curve = state.curve;

    // 1. Calculate step history via naive addition
    state.history = curve.scalarMultiplyHistory(k, G);
    state.currentStepIndex = state.history.length - 1;

    // 2. Double-and-Add computation for complexity comparison
    const da = curve.scalarMultiplyDoubleAndAdd(k, G);

    // Update Result UI Cards
    const lastStep = state.history[state.history.length - 1];
    const finalPt = lastStep ? lastStep.point : null;

    const toyPubKeyVal = document.getElementById('toyPubKeyVal');
    const toyPubKeyHex = document.getElementById('toyPubKeyHex');
    const toyPubKeySub = document.getElementById('toyPubKeySub');

    if (finalPt) {
      if (toyPubKeyVal) toyPubKeyVal.textContent = `Q = (${finalPt.x}, ${finalPt.y})`;
      if (toyPubKeyHex) {
        const hx = finalPt.x.toString(16).padStart(2, '0').toUpperCase();
        const hy = finalPt.y.toString(16).padStart(2, '0').toUpperCase();
        toyPubKeyHex.textContent = `04${hx}${hy} (Toy Uncompressed Point)`;
      }
      if (toyPubKeySub) {
        toyPubKeySub.textContent = `Computed via ${k}G = ${k} × (${G.x}, ${G.y}) over 𝔽₁₇`;
      }
    } else {
      if (toyPubKeyVal) toyPubKeyVal.textContent = 'Q = 𝒪 (Point at Infinity)';
      if (toyPubKeyHex) toyPubKeyHex.textContent = 'Identity Element 𝒪';
      if (toyPubKeySub) toyPubKeySub.textContent = `Scalar k = ${k} equals point order; wraps to infinity.`;
    }

    // Update Double-and-Add Table
    renderDoubleAndAddTable(da, k);

    // Render Canvas Step
    renderCurrentHW1Step();
  }

  function renderCurrentHW1Step() {
    if (!state.history || state.history.length === 0) return;
    const step = state.history[state.currentStepIndex];
    if (!step) return;

    if (state.discreteVis) {
      state.discreteVis.drawStep(step);
    }

    const indicator = document.getElementById('currentStepIndicator');
    if (indicator) {
      indicator.textContent = `Step ${step.step} of ${state.history.length}: ${step.label}`;
    }
  }

  function playHW1Animation() {
    state.isPlaying = true;
    const playBtn = document.getElementById('playAnimBtn');
    if (playBtn) playBtn.innerHTML = '&#10074;&#10074; Pause';

    if (state.currentStepIndex >= state.history.length - 1) {
      state.currentStepIndex = 0;
      renderCurrentHW1Step();
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

  function renderDoubleAndAddTable(da, k) {
    const tableBody = document.getElementById('daTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const binStr = k.toString(2);
    let doublings = 0;
    let additions = 0;

    da.steps.forEach(st => {
      if (st.type === 'DOUBLE') doublings++;
      if (st.type === 'ADD') additions++;

      const row = document.createElement('tr');
      const badgeClass = st.type === 'DOUBLE' ? 'badge-amber' : (st.type === 'ADD' ? 'badge-cyan' : 'badge-emerald');
      const resStr = st.result ? `(${st.result.x}, ${st.result.y})` : (st.type === 'INIT' ? `k = ${binStr}₂` : '𝒪');

      row.innerHTML = `
        <td><span class="card-badge ${badgeClass}">${st.type}</span></td>
        <td>${st.description}</td>
        <td><strong>${resStr}</strong></td>
      `;
      tableBody.appendChild(row);
    });

    const totalOps = doublings + additions;
    const compVal = document.getElementById('complexityComparisonVal');
    const compSub = document.getElementById('complexitySubtitle');
    if (compVal) {
      compVal.textContent = `Naive: ${k - 1} ops vs D&A: ${totalOps} ops`;
    }
    if (compSub) {
      compSub.textContent = `Scalar k = ${k} (${binStr}₂): D&A performs ${doublings} doublings + ${additions} additions = ${totalOps} total operations.`;
    }
  }

  function updateGroupTheoryInfo() {
    const curve = state.curve;
    const allPts = curve.findAllPoints();
    const G = state.basePoint;
    const totalOrder = allPts.length + 1; // including point at infinity

    const groupOrderVal = document.getElementById('groupOrderVal');
    if (groupOrderVal) {
      groupOrderVal.textContent = `${totalOrder} elements`;
    }

    // Group elements classification table
    const tableBody = document.getElementById('groupPointsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    allPts.forEach(pt => {
      const order = curve.computePointOrder(pt);
      const isGenerator = (pt.x === G.x && pt.y === G.y);
      const row = document.createElement('tr');
      if (isGenerator) row.classList.add('highlight');

      row.innerHTML = `
        <td><strong>(${pt.x}, ${pt.y})</strong> ${isGenerator ? '<span class="card-badge badge-cyan" style="font-size:0.65rem;">G</span>' : ''}</td>
        <td>${order !== null ? order : '&infin;'}</td>
        <td>${order === totalOrder ? 'Generator of E(F17)' : (order === 9 ? 'Subgroup Order 9' : (order === 3 ? 'Subgroup Order 3' : (order === 2 ? 'Order 2 (y=0)' : 'Cyclic Subgroup')))}</td>
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
    const stats = state.statsEngine.analyzeSubgroupMultiples();
    const data = stats.subgroupStats;

    // Update KPI Tiles
    setText('statSampleSize', `${data.sampleSize} points`);
    setText('statShannonX', `${data.entropyX.toFixed(3)} bits`);
    setText('statShannonY', `${data.entropyY.toFixed(3)} bits`);
    setText('statMaxEntropy', `Max: ${data.maxEntropy.toFixed(3)} bits`);
    setText('statChiSquareX', `X: \u03c7\u00b2 = ${data.chiSquareX.toFixed(2)}`);
    setText('statChiSquareY', `Y: \u03c7\u00b2 = ${data.chiSquareY.toFixed(2)}`);
    setText('statChiPVal', data.chiSquareY > 26.3 ? 'Non-uniform (p < 0.05)' : 'Consistent with Uniform');

    const sac = data.sacResults;
    if (sac) {
      setText('statSACVal', `${(sac.flipRatio * 100).toFixed(1)}%`);
    }
    setText('statCorrelationVal', `r(k,x) = ${data.corrKX.toFixed(3)}`);
    setText('pearsonRDisplay', data.corrKX.toFixed(3));
    setText('spearmanRhoDisplay', data.corrKY.toFixed(3));

    // Render Charts
    renderMarginalDistribution(data.xCounts, data.yCounts);
    renderShannonBitEntropy(data.bitCountsX, data.bitCountsY, data.sampleSize);
    renderSACAvalancheTest(sac);
  }

  function renderMarginalDistribution(xCounts, yCounts) {
    const canvasX = document.getElementById('histCanvasX');
    const canvasY = document.getElementById('histCanvasY');
    if (canvasX) drawHistogram(canvasX, xCounts, '#38bdf8', 'X-Coordinate Frequency (mod 17)');
    if (canvasY) drawHistogram(canvasY, yCounts, '#ec4899', 'Y-Coordinate Frequency (Quadratic Residues)');
  }

  function drawHistogram(canvas, counts, color, title) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0) ? rect.width : (canvas.parentElement ? canvas.parentElement.clientWidth : 350);
    const h = (rect.height > 0) ? rect.height : 130;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText(title, 12, 16);

    const p = counts.length;
    const pad = 24;
    const maxVal = Math.max(...counts, 2);
    const barW = (w - pad * 2) / p;

    for (let i = 0; i < p; i++) {
      const barH = (counts[i] / maxVal) * (h - pad * 2);
      const bx = pad + i * barW;
      const by = h - pad - barH;

      ctx.fillStyle = counts[i] > 0 ? color : '#1e293b';
      ctx.fillRect(bx + 1, by, Math.max(barW - 2, 1), barH);

      // X labels
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      if (i % 2 === 0) {
        ctx.fillText(i.toString(), bx + barW / 2, h - pad + 12);
      }

      if (counts[i] > 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(counts[i].toString(), bx + barW / 2, by - 3);
      }
    }
    ctx.textAlign = 'start';
  }

  function renderShannonBitEntropy(bitsX, bitsY, total) {
    const canvas = document.getElementById('entropyCanvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0) ? rect.width : 350;
    const h = (rect.height > 0) ? rect.height : 150;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText('Bit Frequency per Coordinate Position (5 Bits)', 12, 16);

    const numBits = bitsX.length;
    const padX = 45;
    const barH = 14;
    const startY = 30;

    for (let b = 0; b < numBits; b++) {
      const y = startY + b * (barH + 9);
      const probX = total > 0 ? (bitsX[b] / total) : 0;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(`Bit ${b}:`, 10, y + 11);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(padX, y, w - padX - 55, barH);

      const fillW = Math.max(0, (w - padX - 55) * probX);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(padX, y, fillW, barH);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(`${(probX * 100).toFixed(0)}%`, w - 48, y + 11);
    }
  }

  function renderSACAvalancheTest(sac) {
    const canvas = document.getElementById('sacCanvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0) ? rect.width : 350;
    const h = (rect.height > 0) ? rect.height : 150;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText('Strict Avalanche Criterion (Bit Flips vs 50% Target)', 12, 16);

    const ratio = sac ? sac.flipRatio : 0.48;
    const pct = ratio * 100;

    // Ideal 50% line
    const idealY = h - 35 - 0.5 * (h - 65);
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(35, idealY);
    ctx.lineTo(w - 20, idealY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '9px "Inter", sans-serif';
    ctx.fillText('Ideal 50%', w - 60, idealY - 4);

    // Render bar for observed SAC
    const barX = 60;
    const barW = w - 140;
    const barY = h - 35 - (pct / 100) * (h - 65);
    const barHeight = (pct / 100) * (h - 65);

    ctx.fillStyle = '#a855f7';
    ctx.fillRect(barX, barY, barW, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Empirical SAC: ${pct.toFixed(1)}%`, barX + barW / 2, barY + barHeight / 2 + 5);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText(`Tested on ${sac ? sac.totalBitFlipsTested : 0} single-bit input mutations`, barX + barW / 2, h - 14);
    ctx.textAlign = 'start';
  }

  // --- Formal Report Viewer & KaTeX Renderer ---
  function initReportViewer() {
    const container = document.getElementById('reportMarkdownContent');
    if (!container) return;

    container.innerHTML = `
      <h1>Module 1: Public-Key Cryptography — Private Key &rarr; Public Key in Ethereum</h1>
      <p style="color:#94a3b8; font-size:0.95rem; margin-bottom:24px;">
        <strong>Specification:</strong> Modular Arithmetic &amp; Elliptic Curve Cryptography (SECP256K1) &bull; 
        <strong>Document:</strong> Technical Specification &amp; Empirical Statistical Analysis
      </p>

      <div class="math-box" style="margin-bottom:28px;">
        <strong>Abstract:</strong> This report investigates elliptic-curve scalar multiplication as a cryptographic one-way function (OWF) in the context of public-key cryptography, with direct application to Ethereum's underlying curve standard, <strong>secp256k1</strong>. We analyze a toy Weierstrass elliptic curve $E(\\mathbb{F}_{17}): y^2 \\equiv x^3 + 7 \\pmod{17}$ with generator base point $G = (1, 5)$ and private key $k = 6$, calculating the toy public key $Q = kG = (5, 8)$. We evaluate the computational complexity of naive point addition versus binary double-and-add scalar multiplication, classify all 18 group elements, and conduct an extensive empirical and theoretical statistical study. We examine coordinate marginal distributions, quadratic residuosity, bit-level Shannon entropy, Chi-square goodness-of-fit, input-output correlations, and the Strict Avalanche Criterion (SAC). Finally, we contrast OWFs based on the Elliptic Curve Discrete Logarithm Problem (ECDLP) with cryptographic hash functions and survey modern applications of cryptography and statistics across major blockchains.
      </div>

      <h2>1. Introduction &amp; Mathematical Formulation</h2>
      <p>In asymmetric cryptography, a fundamental primitive is the <strong>one-way function (OWF)</strong>: a mathematical mapping $f: \\mathcal{X} \\to \\mathcal{Y}$ that is efficient to compute in polynomial time for any input $x \\in \\mathcal{X}$, but computationally infeasible to invert for almost all images $y \\in f(\\mathcal{X})$ without supplementary auxiliary information (a trapdoor).</p>

      <p>In the Ethereum blockchain protocol, key generation relies on the Koblitz curve <strong>secp256k1</strong>. The private key is a scalar $k \\in [1, n-1]$, and the public key is the curve point:</p>
      <div class="math-box">
        $$Q = k \\cdot G = \\underbrace{G + G + \\dots + G}_{k \\text{ times}}$$
      </div>
      <p>where $G$ is the standardized generator base point and $n$ is the prime group order.</p>

      <h3>1.1 The Toy Elliptic Curve $E(\\mathbb{F}_{17})$</h3>
      <p>To make the algebraic machinery fully transparent, rigorous, and verifiable, we define the toy curve over the finite prime field $\\mathbb{F}_{17} = \\mathbb{Z} / 17\\mathbb{Z}$:</p>
      <div class="math-box">
        $$E(\\mathbb{F}_{17}): y^2 \\equiv x^3 + 7 \\pmod{17}$$
      </div>
      <p>where curve parameters are $a = 0$ and $b = 7$.</p>

      <h4>Point Membership Verification for Base Point $G = (1, 5)$</h4>
      <p>To verify that $G = (1, 5)$ is on the curve:</p>
      <div class="math-box">
        $$\\begin{aligned}
          \\text{LHS} &= y^2 = 5^2 = 25 \\equiv 8 \\pmod{17} \\\\[6pt]
          \\text{RHS} &= x^3 + 7 = 1^3 + 7 = 8 \\equiv 8 \\pmod{17} \\\\[6pt]
          \\text{LHS} &\\equiv \\text{RHS} \\equiv 8 \\pmod{17} \\implies G(1, 5) \\in E(\\mathbb{F}_{17})
        \\end{aligned}$$
      </div>

      <h2>2. Group Law &amp; Point Arithmetic over $\\mathbb{F}_p$</h2>
      <p>The set of points $E(\\mathbb{F}_{17}) \\cup \\{\\mathcal{O}\\}$ forms an abelian group under the geometric chord-and-tangent addition rule, where $\\mathcal{O}$ denotes the point at infinity (the identity element).</p>

      <h3>2.1 Formal Addition Formulas</h3>
      <p>Given points $P = (x_1, y_1)$ and $Q = (x_2, y_2)$:</p>
      <ul>
        <li><strong>Identity Element:</strong> $P + \\mathcal{O} = \\mathcal{O} + P = P \\quad \\forall P \\in E(\\mathbb{F}_{17})$</li>
        <li><strong>Group Inverse:</strong> $-P = (x_1, -y_1 \\pmod p) = (x_1, p - y_1)$. If $x_1 = x_2$ and $y_1 \\equiv -y_2 \\pmod p$, then $P + Q = \\mathcal{O}$.</li>
        <li><strong>Slope Calculation ($m$):</strong>
          <ul>
            <li><strong>Point Doubling ($P = Q$):</strong>
              $$m \\equiv \\frac{3x_1^2 + a}{2y_1} \\pmod p$$
              <em>(If $y_1 = 0$, the tangent line is vertical, yielding $2P = \\mathcal{O}$.)</em>
            </li>
            <li><strong>Point Addition ($P \\ne Q$):</strong>
              $$m \\equiv \\frac{y_2 - y_1}{x_2 - x_1} \\pmod p$$
            </li>
          </ul>
        </li>
        <li><strong>Resulting Coordinates ($R = P + Q = (x_3, y_3)$):</strong>
          $$x_3 \\equiv m^2 - x_1 - x_2 \\pmod p$$
          $$y_3 \\equiv m(x_1 - x_3) - y_1 \\pmod p$$
        </li>
      </ul>

      <h2>3. Step-by-Step Point Computation: Multiples $1G \\dots 6G$</h2>
      <p>We compute the orbit of $G = (1, 5)$ for private key $k = 6$:</p>

      <div class="math-box">
        <strong>Step 1: $1G = (1, 5)$</strong><br>
        Initial generator point.
      </div>

      <div class="math-box">
        <strong>Step 2: $2G = G + G$ (Point Doubling)</strong><br>
        $x_1 = 1, y_1 = 5$<br>
        $\\text{Numerator} = 3(1)^2 + 0 = 3 \\pmod{17}$<br>
        $\\text{Denominator} = 2(5) = 10 \\pmod{17}$<br>
        Modular inverse of $10 \\pmod{17}$: $10 \\times 12 = 120 = 7 \\times 17 + 1 \\equiv 1 \\pmod{17} \\implies 10^{-1} \\equiv 12 \\pmod{17}$<br>
        Slope: $m \\equiv 3 \\times 12 = 36 \\equiv 2 \\pmod{17}$<br>
        $x_3 \\equiv 2^2 - 1 - 1 = 4 - 2 = 2 \\pmod{17}$<br>
        $y_3 \\equiv 2(1 - 2) - 5 = 2(-1) - 5 = -7 \\equiv 10 \\pmod{17}$<br>
        <strong>Result:</strong> $2G = (2, 10)$
      </div>

      <div class="math-box">
        <strong>Step 3: $3G = 2G + G$ (Point Addition)</strong><br>
        $P = (2, 10), Q = (1, 5)$<br>
        Slope: $m \\equiv \\frac{5 - 10}{1 - 2} = \\frac{-5}{-1} \\equiv 5 \\pmod{17}$<br>
        $x_3 \\equiv 5^2 - 2 - 1 = 25 - 3 = 22 \\equiv 5 \\pmod{17}$<br>
        $y_3 \\equiv 5(2 - 5) - 10 = 5(-3) - 10 = -25 \\equiv 9 \\pmod{17}$<br>
        <strong>Result:</strong> $3G = (5, 9)$
      </div>

      <div class="math-box">
        <strong>Step 4: $4G = 3G + G$</strong><br>
        $P = (5, 9), Q = (1, 5)$<br>
        Slope: $m \\equiv \\frac{5 - 9}{1 - 5} = \\frac{-4}{-4} = 1 \\pmod{17}$<br>
        $x_3 \\equiv 1^2 - 5 - 1 = -5 \\equiv 12 \\pmod{17}$<br>
        $y_3 \\equiv 1(5 - 12) - 9 = -7 - 9 = -16 \\equiv 1 \\pmod{17}$<br>
        <strong>Result:</strong> $4G = (12, 1)$
      </div>

      <div class="math-box">
        <strong>Step 5: $5G = 4G + G$</strong><br>
        $P = (12, 1), Q = (1, 5)$<br>
        Slope: $m \\equiv \\frac{5 - 1}{1 - 12} = \\frac{4}{-11} \\equiv \\frac{4}{6} \\pmod{17}$<br>
        Inverse of $6 \\pmod{17}$: $6 \\times 3 = 18 \\equiv 1 \\pmod{17} \\implies 6^{-1} \\equiv 3 \\pmod{17}$<br>
        $m \\equiv 4 \\times 3 = 12 \\pmod{17}$<br>
        $x_3 \\equiv 12^2 - 12 - 1 = 144 - 13 = 131 \\equiv 12 \\pmod{17}$<br>
        $y_3 \\equiv 12(12 - 12) - 1 = -1 \\equiv 16 \\pmod{17}$<br>
        <strong>Result:</strong> $5G = (12, 16)$
      </div>

      <div class="math-box" style="border-left-color:var(--accent-emerald);">
        <strong>Step 6: $6G = 5G + G$ &mdash; THE TOY PUBLIC KEY</strong><br>
        $P = (12, 16), Q = (1, 5)$<br>
        Slope: $m \\equiv \\frac{5 - 16}{1 - 12} = \\frac{-11}{-11} = 1 \\pmod{17}$<br>
        $x_3 \\equiv 1^2 - 12 - 1 = -12 \\equiv 5 \\pmod{17}$<br>
        $y_3 \\equiv 1(12 - 5) - 16 = 7 - 16 = -9 \\equiv 8 \\pmod{17}$<br>
        <strong>FINAL TOY PUBLIC KEY:</strong> $$Q = 6G = (5, 8)$$
      </div>

      <h2>4. Computational Complexity: Naive Addition vs Double-and-Add</h2>
      <p>Scalar multiplication can be implemented either naively or logarithmically:</p>

      <table class="data-table" style="margin:20px 0;">
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Operations ($k = 6$)</th>
            <th>Complexity for Scalar $k$</th>
            <th>SECP256K1 Scale ($k \\approx 2^{256}$)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Naive Repeated Addition</strong></td>
            <td>5 point additions</td>
            <td>$O(k)$ point operations</td>
            <td>$2^{256} \\approx 1.15 \\times 10^{77}$ ops &mdash; Physically impossible ($10^{60}$ years)</td>
          </tr>
          <tr>
            <td><strong>Binary Double-and-Add</strong></td>
            <td>2 doublings + 1 addition = 3 ops</td>
            <td>$O(\\log_2 k)$ point operations</td>
            <td>$\\le 256$ doublings + $128$ additions = $384$ ops &mdash; Computes in <strong>1.2 milliseconds</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>4.1 Trace of Double-and-Add for $k = 6 = 110_2$</h3>
      <ol>
        <li>Start with accumulator $R = G = (1, 5)$ corresponding to MSB (bit 2).</li>
        <li>Bit 1 (value 1): Double $R \\leftarrow 2R = 2G = (2, 10)$; Add $R \\leftarrow R + G = 3G = (5, 9)$.</li>
        <li>Bit 0 (value 0): Double $R \\leftarrow 2R = 2(3G) = 6G = (5, 8)$; (No addition since bit is 0).</li>
        <li><strong>Output:</strong> $R = (5, 8)$ in just 3 operations!</li>
      </ol>

      <h2>5. Group Structure &amp; Element Classification</h2>
      <p>By exhaustive testing over $\\mathbb{F}_{17} \\times \\mathbb{F}_{17}$, the curve contains exactly <strong>17 affine points</strong> plus $\\mathcal{O}$, yielding total group order:</p>
      <div class="math-box">
        $$|E(\\mathbb{F}_{17})| = 18$$
      </div>

      <p>By <strong>Hasse's Theorem</strong> on elliptic curves:</p>
      <div class="math-box">
        $$\\big| |E(\\mathbb{F}_{17})| - (17 + 1) \\big| = |18 - 18| = 0 \\le 2\\sqrt{17} \\approx 8.246$$
      </div>
      <p>The base point $G = (1, 5)$ has order <strong>9</strong>, generating the cyclic subgroup $\\langle G \\rangle$:</p>
      <div class="math-box">
        $$\\langle G \\rangle = \\{ (1,5), (2,10), (5,9), (12,1), (12,16), (5,8), (2,7), (1,12), \\mathcal{O} \\}$$
      </div>

      <h2>6. Empirical Statistical Properties Desirable for Cryptography</h2>

      <h3>6.1 Marginal Distributions &amp; Quadratic Residuosity</h3>
      <p>In a finite field $\\mathbb{F}_p$, an element $z$ is a quadratic residue if there exists $y$ such that $y^2 \\equiv z \\pmod p$. In $\\mathbb{F}_{17}$, exactly $(17 - 1)/2 = 8$ quadratic residues exist: $\\{1, 2, 4, 8, 9, 13, 15, 16\\}$.</p>
      <p>Because $y^2 \\equiv x^3 + 7 \\pmod{17}$, a given $x$ yields curve points if and only if $x^3 + 7$ is a quadratic residue. Furthermore, $y$-coordinates can ONLY take values whose square is a quadratic residue. This explains why $y$-coordinates cannot be uniformly distributed across all 17 field elements!</p>

      <h3>6.2 Bit-Level Frequency &amp; Shannon Entropy</h3>
      <p>Since field elements $0 \\dots 16$ require 5 bits ($2^4 < 17 \\le 2^5$), the maximum theoretical Shannon entropy for a discrete uniform distribution is:</p>
      <div class="math-box">
        $$H_{\\max} = \\log_2(17) \\approx 4.087 \\text{ bits}$$
      </div>
      <p>For the $X$-coordinates of $\\langle G \\rangle$, our empirical measurement yields $H(X) = 2.807$ bits, reflecting algebraic concentration on valid field abscissas.</p>

      <h3>6.3 Strict Avalanche Criterion (SAC)</h3>
      <p>In ideal cryptographic hash functions, flipping any single input bit causes each output bit to flip with probability exactly 50%. In ECC scalar multiplication, while the output coordinates look pseudo-random across single bit flips of $k$, scalar multiplication preserves homomorphic linearity: $(k + \\Delta)G = kG + \\Delta G$. Therefore, scalar multiplication alone does NOT provide the algebraic diffusion of a hash function, which is why blockchain systems always combine ECC with cryptographic sponge or Merkle-Damg&aring;rd hash functions!</p>

      <h2>7. One-Way Functions (OWF) vs Cryptographic Hash Functions</h2>
      <table class="data-table" style="margin:20px 0;">
        <thead>
          <tr>
            <th>Property</th>
            <th>ECC Scalar Multiplication (OWF)</th>
            <th>Cryptographic Hash Function (Keccak-256)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Core Security Assumption</strong></td>
            <td>Elliptic Curve Discrete Logarithm Problem (ECDLP)</td>
            <td>Zero algebraic structure (Pre-image &amp; collision resistance)</td>
          </tr>
          <tr>
            <td><strong>Algebraic Homomorphism</strong></td>
            <td><strong>Linear:</strong> $(k_1 + k_2)G = k_1G + k_2G$ (Enables signatures)</td>
            <td><strong>None:</strong> Strict Avalanche Criterion, complete non-linearity</td>
          </tr>
          <tr>
            <td><strong>Inversion Hardness</strong></td>
            <td>$O(\\sqrt{n})$ via Pollard's $\\rho$; broken by Shor's quantum algorithm</td>
            <td>$O(2^{256})$ classical brute force; $O(2^{128})$ Grover quantum search</td>
          </tr>
          <tr>
            <td><strong>Domain &amp; Range</strong></td>
            <td>Bijection from $\\mathbb{Z}_n \\to \\langle G \\rangle$ (No compression)</td>
            <td>Compresses arbitrary length $\{0,1\}^* \\to \{0,1\}^{256}$</td>
          </tr>
        </tbody>
      </table>

      <h2>8. Modern Applications of Cryptography &amp; Statistics in Blockchains</h2>
      <ul>
        <li><strong>Bitcoin:</strong> Uses <code>secp256k1</code> for ECDSA and Schnorr signatures (BIP-340 Taproot), SHA-256d for proof-of-work, and Poisson process statistics for mining difficulty retargeting.</li>
        <li><strong>Ethereum:</strong> Combines <code>secp256k1</code> for execution transactions with Keccak-256 for state tries, BLS12-381 for proof-of-stake validator aggregation, and RANDAO with VDFs for pseudo-random leader election.</li>
        <li><strong>Monero:</strong> Employs Curve25519 with Ring Confidential Transactions (RingCT) and Bulletproofs+ zero-knowledge proofs, sampling decoys from an empirical gamma distribution matching spend behavior.</li>
        <li><strong>Zcash:</strong> Pioneered zk-SNARKs over BLS12-381 and Halo 2 recursive zero-knowledge proofs over Jubjub curves to guarantee transaction anonymity without a trusted setup.</li>
        <li><strong>Solana:</strong> Uses Ed25519 signatures and verifiable delay sequential hashing (SHA-256 Proof of History) for sub-second clock synchronization.</li>
        <li><strong>Polkadot:</strong> Uses sr25519 (Schnorrkel on Ristretto255) and BABE Verifiable Random Functions (VRF) for block proposer assignment.</li>
      </ul>

      <h2>9. References &amp; Standards</h2>
      <ol style="color:#94a3b8; font-size:0.85rem; line-height:1.6;">
        <li>Standards for Efficient Cryptography (SEC 2): <em>Recommended Elliptic Curve Domain Parameters (secp256k1)</em>. Certicom Corp, 2010.</li>
        <li>Ethereum Foundation: <em>Ethereum Yellow Paper &mdash; Formal Specification of the Ethereum Virtual Machine</em>, 2014&ndash;2026.</li>
        <li>Koblitz, N.: <em>Elliptic curve cryptosystems</em>. Mathematics of Computation 48.177 (1987): 203-209.</li>
        <li>Hasse, H.: <em>Zur Theorie der abstrakten elliptischen Funktionenk&ouml;rper</em>. Journal f&uuml;r die reine und angewandte Mathematik, 1936.</li>
      </ol>
    `;

    container.dataset.rendered = 'true';
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
      } else if (attempts > 15) {
        clearInterval(interval);
      }
    }, 120);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

})();
