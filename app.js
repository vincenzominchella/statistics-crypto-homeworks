/**
 * Interactive Application Controller
 * Modular Arithmetic & Cryptographic Key Derivation Suite
 */

(function () {
  'use strict';

  // --- Global Application State ---
  const state = {
    hw1: {
      curve: new window.ToyEllipticCurve(17, 0, 7),
      basePoint: { x: 1, y: 5 },
      k: 6,
      history: [],
      currentStepIndex: 0,
      isPlaying: false,
      playTimer: null,
      speedMs: 800,
      discreteVis: null,
      continuousVis: null,
      statsEngine: null
    },
    hw2: {
      pipeline: new window.EthereumWalletPipeline(),
      currentResult: null,
      defaultMnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      derivationPath: "m/44'/60'/0'/0/0"
    }
  };

  // --- Initialization on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initHW1();
    initHW2();
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
              if (state.hw1.discreteVis) state.hw1.discreteVis.resize();
              if (state.hw1.continuousVis) state.hw1.continuousVis.resize();
              runStatisticalAnalysis();
            });
          }
        }
      });
    });
  }

  // =========================================================================
  // HOMEWORK 1: TOY ECC CONTROLLER
  // =========================================================================
  function initHW1() {
    const curve = state.hw1.curve;
    state.hw1.statsEngine = new window.ECCStatisticalEngine(curve, state.hw1.basePoint);

    // Canvases
    const discCanvas = document.getElementById('discreteCanvas');
    const contCanvas = document.getElementById('continuousCanvas');

    if (discCanvas) {
      state.hw1.discreteVis = new window.DiscreteGridVisualizer(discCanvas, curve);
    }
    if (contCanvas) {
      state.hw1.continuousVis = new window.ContinuousCurveVisualizer(contCanvas);
    }

    window.addEventListener('resize', () => {
      if (state.hw1.discreteVis) state.hw1.discreteVis.resize();
      if (state.hw1.continuousVis) state.hw1.continuousVis.resize();
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
        opt.textContent = `(${pt.x}, ${pt.y}) [Order: ${curve.computePointOrder(pt)}]`;
        if (pt.x === 1 && pt.y === 5) opt.selected = true;
        basePtSelect.appendChild(opt);
      });

      basePtSelect.addEventListener('change', () => {
        const [x, y] = basePtSelect.value.split(',').map(Number);
        state.hw1.basePoint = { x, y };
        state.hw1.statsEngine = new window.ECCStatisticalEngine(curve, state.hw1.basePoint);
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
      state.hw1.k = val;
      if (kSlider) kSlider.value = val;
      if (kInput) kInput.value = val;
      if (kValDisplay) kValDisplay.textContent = val;
      updateHW1Calculation();
    }

    if (kSlider) kSlider.addEventListener('input', e => setK(e.target.value));
    if (kInput) kInput.addEventListener('change', e => setK(e.target.value));

    // Playback buttons
    const playBtn = document.getElementById('playAnimBtn');
    const stepFwdBtn = document.getElementById('stepFwdBtn');
    const stepBackBtn = document.getElementById('stepBackBtn');
    const resetBtn = document.getElementById('resetAnimBtn');
    const speedSlider = document.getElementById('animSpeedSlider');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (state.hw1.isPlaying) {
          pauseHW1Animation();
        } else {
          playHW1Animation();
        }
      });
    }

    if (stepFwdBtn) {
      stepFwdBtn.addEventListener('click', () => {
        pauseHW1Animation();
        if (state.hw1.currentStepIndex < state.hw1.history.length - 1) {
          state.hw1.currentStepIndex++;
          renderCurrentHW1Step();
        }
      });
    }

    if (stepBackBtn) {
      stepBackBtn.addEventListener('click', () => {
        pauseHW1Animation();
        if (state.hw1.currentStepIndex > 0) {
          state.hw1.currentStepIndex--;
          renderCurrentHW1Step();
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        pauseHW1Animation();
        state.hw1.currentStepIndex = 0;
        renderCurrentHW1Step();
      });
    }

    if (speedSlider) {
      speedSlider.addEventListener('input', e => {
        state.hw1.speedMs = 2100 - parseInt(e.target.value, 10); // inverted: right = faster
        if (state.hw1.isPlaying) {
          pauseHW1Animation();
          playHW1Animation();
        }
      });
    }

    // Continuous Real Curve Sweep Toggle
    const contAnimBtn = document.getElementById('toggleContAnimBtn');
    if (contAnimBtn) {
      contAnimBtn.addEventListener('click', () => {
        if (state.hw1.continuousVis) {
          const isRunning = state.hw1.continuousVis.toggleAutoSweep();
          contAnimBtn.innerHTML = isRunning ? '&#10074;&#10074; Pause Sweep' : '&#9658; Auto-Sweep';
        }
      });
    }

    // Initial run
    requestAnimationFrame(() => {
      if (state.hw1.discreteVis) state.hw1.discreteVis.resize();
      if (state.hw1.continuousVis) state.hw1.continuousVis.resize();
    });
    updateHW1Calculation();
    updateGroupOrderTable();
    runStatisticalAnalysis();
  }

  function updateHW1Calculation() {
    pauseHW1Animation();
    const curve = state.hw1.curve;
    const G = state.hw1.basePoint;
    const k = state.hw1.k;

    // Generate naive addition history
    state.hw1.history = curve.scalarMultiplyHistory(k, G);
    state.hw1.currentStepIndex = state.hw1.history.length - 1;

    // Display Public Key
    const finalStep = state.hw1.history[state.hw1.history.length - 1];
    const pubKeyDisplay = document.getElementById('toyPublicKeyDisplay');
    if (pubKeyDisplay) {
      if (finalStep && finalStep.point) {
        pubKeyDisplay.textContent = `Q = ${k}G = (${finalStep.point.x}, ${finalStep.point.y})`;
        pubKeyDisplay.className = 'metric-tile-val text-emerald';
      } else {
        pubKeyDisplay.textContent = `Q = ${k}G = \ud835\udcde (Point at Infinity)`;
        pubKeyDisplay.className = 'metric-tile-val text-rose';
      }
    }

    // Populate Step Table
    const tableBody = document.getElementById('stepTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      state.hw1.history.forEach((step, idx) => {
        const row = document.createElement('tr');
        row.id = `step-row-${idx}`;
        if (idx === state.hw1.currentStepIndex) row.classList.add('highlight');

        const ptStr = step.point ? `(${step.point.x}, ${step.point.y})` : '\ud835\udcde (Infinity)';
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
          state.hw1.currentStepIndex = idx;
          renderCurrentHW1Step();
        });

        tableBody.appendChild(row);
      });
    }

    // Populate Double-and-Add view
    const doubleAndAddContainer = document.getElementById('doubleAndAddSteps');
    if (doubleAndAddContainer) {
      const daa = curve.scalarMultiplyDoubleAndAdd(k, G);
      doubleAndAddContainer.innerHTML = '';
      daa.steps.forEach(st => {
        const item = document.createElement('div');
        item.className = 'math-box';
        item.style.marginBottom = '6px';
        const resStr = st.result ? `(${st.result.x}, ${st.result.y})` : (st.type === 'INIT' ? `binary: ${st.binary}` : '\ud835\udcde');
        item.innerHTML = `<strong>${st.type}</strong>: ${st.description} &rarr; <code>${resStr}</code>`;
        doubleAndAddContainer.appendChild(item);
      });
    }

    // Re-render canvases and statistics
    renderCurrentHW1Step();
    runStatisticalAnalysis();
  }

  function renderCurrentHW1Step() {
    const idx = state.hw1.currentStepIndex;
    const stepData = state.hw1.history[idx];

    // Highlight row in table
    const allRows = document.querySelectorAll('#stepTableBody tr');
    allRows.forEach(r => r.classList.remove('highlight'));
    const targetRow = document.getElementById(`step-row-${idx}`);
    if (targetRow) {
      targetRow.classList.add('highlight');
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Update step badge in controls
    const stepBadge = document.getElementById('animStepBadge');
    if (stepBadge && stepData) {
      stepBadge.textContent = `Step ${idx + 1} / ${state.hw1.history.length} (${stepData.label})`;
    }

    // Render Canvas
    if (state.hw1.discreteVis) {
      state.hw1.discreteVis.render(stepData);
    }
    if (state.hw1.continuousVis) {
      state.hw1.continuousVis.render();
    }
  }

  function playHW1Animation() {
    state.hw1.isPlaying = true;
    const playBtn = document.getElementById('playAnimBtn');
    if (playBtn) playBtn.innerHTML = '&#10074;&#10074; Pause';

    if (state.hw1.continuousVis) {
      state.hw1.continuousVis.startAutoSweep();
      const contBtn = document.getElementById('toggleContAnimBtn');
      if (contBtn) contBtn.innerHTML = '&#10074;&#10074; Pause Sweep';
    }

    if (state.hw1.currentStepIndex >= state.hw1.history.length - 1) {
      state.hw1.currentStepIndex = 0;
    }

    function tick() {
      if (!state.hw1.isPlaying) return;
      if (state.hw1.currentStepIndex < state.hw1.history.length - 1) {
        state.hw1.currentStepIndex++;
        renderCurrentHW1Step();
        state.hw1.playTimer = setTimeout(tick, state.hw1.speedMs);
      } else {
        pauseHW1Animation();
      }
    }

    state.hw1.playTimer = setTimeout(tick, state.hw1.speedMs);
  }

  function pauseHW1Animation() {
    state.hw1.isPlaying = false;
    if (state.hw1.playTimer) clearTimeout(state.hw1.playTimer);
    const playBtn = document.getElementById('playAnimBtn');
    if (playBtn) playBtn.innerHTML = '&#9658; Play';

    if (state.hw1.continuousVis) {
      state.hw1.continuousVis.stopAutoSweep();
      const contBtn = document.getElementById('toggleContAnimBtn');
      if (contBtn) contBtn.innerHTML = '&#9658; Auto-Sweep';
    }
  }

  function updateGroupOrderTable() {
    const curve = state.hw1.curve;
    const all = curve.computeAllPointOrders();
    const table = document.getElementById('groupOrdersTableBody');
    if (!table) return;

    table.innerHTML = '';
    // Sort by order descending
    all.sort((a, b) => b.order - a.order);

    all.forEach(item => {
      const row = document.createElement('tr');
      const isGen = item.order === 18;
      const isBaseSubgroup = [1, 5].includes(item.point.x) || [2, 10, 7].includes(item.point.x);
      row.innerHTML = `
        <td>(${item.point.x}, ${item.point.y})</td>
        <td><strong>${item.order}</strong></td>
        <td>${isGen ? '<span class="card-badge badge-emerald">Generator of E(F17)</span>' : (item.order === 9 ? '<span class="card-badge badge-cyan">Order 9 (G subgroup)</span>' : (item.order === 2 ? '<span class="card-badge badge-rose">Order 2 (y=0)</span>' : '<span class="card-badge badge-amber">Subgroup element</span>'))}</td>
      `;
      table.appendChild(row);
    });
  }

  // --- Statistical Exploration Lab Charts & Metrics ---
  function runStatisticalAnalysis() {
    const stats = state.hw1.statsEngine.analyzeSubgroupMultiples();
    const data = stats.subgroupStats;

    // Set Metric Tiles
    setText('statSampleSize', `${data.sampleSize} points`);
    setText('statMeanX', data.meanX.toFixed(2));
    setText('statMeanY', data.meanY.toFixed(2));
    setText('statVarX', data.varX.toFixed(2));
    setText('statEntropyX', `${data.entropyX.toFixed(3)} / ${data.maxEntropy.toFixed(3)} bits`);
    setText('statChiSquare', `\u03c7\u00b2 = ${data.chiSquareX.toFixed(2)} (df=${data.degreesOfFreedom})`);
    setText('statCorrKX', `r(k, x) = ${data.corrKX.toFixed(3)}`);
    setText('statCorrKY', `r(k, y) = ${data.corrKY.toFixed(3)}`);

    const sac = data.sacResults;
    setText('statSAC', `${(sac.flipRatio * 100).toFixed(1)}% bit flips`);

    // Draw Marginal Bar Charts
    drawHistogram('chartHistX', data.xCounts, 'X Coordinates (mod 17)', '#38bdf8');
    drawHistogram('chartHistY', data.yCounts, 'Y Coordinates (mod 17)', '#ec4899');
    drawBitBarChart('chartBits', data.bitCountsX, data.bitCountsY, data.sampleSize);
  }

  function drawHistogram(canvasId, counts, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0) ? rect.width : (canvas.parentElement ? canvas.parentElement.clientWidth : 350);
    const h = (rect.height > 0) ? rect.height : 150;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const p = counts.length;
    const pad = 28;
    const maxVal = Math.max(...counts, 3);
    const barW = (w - pad * 2) / p;

    // Draw bars
    for (let i = 0; i < p; i++) {
      const barH = (counts[i] / maxVal) * (h - pad * 2);
      const bx = pad + i * barW;
      const by = h - pad - barH;

      ctx.fillStyle = counts[i] > 0 ? color : '#1e293b';
      ctx.fillRect(bx + 2, by, Math.max(barW - 4, 1), barH);

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(i.toString(), bx + barW / 2, h - pad + 14);

      if (counts[i] > 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(counts[i].toString(), bx + barW / 2, by - 4);
      }
    }

    // Expected line
    const expH = (1 / maxVal) * (h - pad * 2);
    ctx.strokeStyle = '#f59e0b88';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pad, h - pad - expH);
    ctx.lineTo(w - pad, h - pad - expH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawBitBarChart(canvasId, bitsX, bitsY, total) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0) ? rect.width : (canvas.parentElement ? canvas.parentElement.clientWidth : 350);
    const h = (rect.height > 0) ? rect.height : 140;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const pad = 35;
    const numBits = bitsX.length;
    const groupW = (w - pad * 2) / numBits;

    for (let b = 0; b < numBits; b++) {
      const pctX = (bitsX[b] / total) * 100;
      const pctY = (bitsY[b] / total) * 100;

      const gx = pad + b * groupW;
      const hX = (pctX / 100) * (h - pad * 2);
      const hY = (pctY / 100) * (h - pad * 2);

      // Bar X
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(gx + 4, h - pad - hX, Math.max(groupW / 2 - 6, 2), hX);

      // Bar Y
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(gx + groupW / 2 + 2, h - pad - hY, Math.max(groupW / 2 - 6, 2), hY);

      // Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Bit ${b}`, gx + groupW / 2, h - pad + 16);
    }

    // 50% ideal line
    const midY = h - pad - (0.5 * (h - pad * 2));
    ctx.strokeStyle = '#10b98188';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad, midY);
    ctx.lineTo(w - pad, midY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#10b981';
    ctx.font = '9px sans-serif';
    ctx.fillText('50% Ideal Balance', w - pad - 45, midY - 4);
  }


  // =========================================================================
  // HOMEWORK 2: ETHEREUM WALLET PIPELINE CONTROLLER
  // =========================================================================
  function initHW2() {
    const pipeline = state.hw2.pipeline;

    const mnemonicInput = document.getElementById('mnemonicInput');
    const passphraseInput = document.getElementById('passphraseInput');
    const pathInput = document.getElementById('pathInput');
    const deriveBtn = document.getElementById('deriveBtn');
    const random12Btn = document.getElementById('genRandom12Btn');
    const random24Btn = document.getElementById('genRandom24Btn');
    const loadTestVectorBtn = document.getElementById('loadTestVectorBtn');

    function setMnemonicMode(selectedBtn) {
      [random12Btn, random24Btn, loadTestVectorBtn].forEach(b => {
        if (!b) return;
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-secondary');
      });
      if (selectedBtn) {
        selectedBtn.classList.remove('btn-secondary');
        selectedBtn.classList.add('btn-primary', 'active');
      }
    }

    if (mnemonicInput) mnemonicInput.value = state.hw2.defaultMnemonic;
    if (pathInput) pathInput.value = state.hw2.derivationPath;
    setMnemonicMode(loadTestVectorBtn);

    if (random12Btn) {
      random12Btn.addEventListener('click', () => {
        setMnemonicMode(random12Btn);
        const res = pipeline.bip39.generateMnemonic(128);
        if (mnemonicInput) mnemonicInput.value = res.mnemonic;
        triggerDerivation(false);
      });
    }

    if (random24Btn) {
      random24Btn.addEventListener('click', () => {
        setMnemonicMode(random24Btn);
        const res = pipeline.bip39.generateMnemonic(256);
        if (mnemonicInput) mnemonicInput.value = res.mnemonic;
        triggerDerivation(false);
      });
    }

    if (loadTestVectorBtn) {
      loadTestVectorBtn.addEventListener('click', () => {
        setMnemonicMode(loadTestVectorBtn);
        if (mnemonicInput) mnemonicInput.value = state.hw2.defaultMnemonic;
        if (passphraseInput) passphraseInput.value = '';
        if (pathInput) pathInput.value = "m/44'/60'/0'/0/0";
        triggerDerivation(false);
      });
    }

    if (mnemonicInput) {
      mnemonicInput.addEventListener('input', () => {
        if (mnemonicInput.value.trim() === state.hw2.defaultMnemonic) {
          setMnemonicMode(loadTestVectorBtn);
        } else {
          setMnemonicMode(null);
        }
      });
    }

    if (deriveBtn) {
      deriveBtn.addEventListener('click', () => triggerDerivation(false));
    }

    // Live Avalanche test button
    const testAvalancheBtn = document.getElementById('testAvalancheBtn');
    if (testAvalancheBtn) {
      testAvalancheBtn.addEventListener('click', runWalletAvalancheExperiment);
    }

    // Run initial derivation without animation
    triggerDerivation(true);
  }

  async function triggerDerivation(isInitial = false) {
    const pipeline = state.hw2.pipeline;
    const mnemonicInput = document.getElementById('mnemonicInput');
    const passphraseInput = document.getElementById('passphraseInput');
    const pathInput = document.getElementById('pathInput');
    const deriveBtn = document.getElementById('deriveBtn');
    const statusMsg = document.getElementById('derivationStatusMsg');

    const mnemonic = (mnemonicInput ? mnemonicInput.value : state.hw2.defaultMnemonic).trim();
    const passphrase = (passphraseInput ? passphraseInput.value : '').trim();
    const path = (pathInput ? pathInput.value : "m/44'/60'/0'/0/0").trim();

    if (!isInitial && deriveBtn) {
      deriveBtn.disabled = true;
      deriveBtn.classList.add('is-loading');
      deriveBtn.innerHTML = '<span class="btn-spinner"></span> Computing Pipeline (BIP-39 &rarr; BIP-32 &rarr; secp256k1 &rarr; Keccak-256)...';
      if (statusMsg) {
        statusMsg.style.display = 'none';
        statusMsg.className = 'derivation-status';
      }
      await new Promise(r => setTimeout(r, 60));
    }

    try {
      const result = await pipeline.deriveFullPipeline(mnemonic, passphrase, path);
      state.hw2.currentResult = result;
      renderPipelineResults(result);

      if (!isInitial) {
        const nodes = document.querySelectorAll('.pipeline-node');
        nodes.forEach((node, idx) => {
          setTimeout(() => {
            node.classList.remove('pulse-highlight');
            void node.offsetWidth;
            node.classList.add('pulse-highlight');
          }, idx * 45);
        });

        if (deriveBtn) {
          deriveBtn.classList.remove('is-loading');
          deriveBtn.classList.add('is-success');
          deriveBtn.innerHTML = '&#10003; Full Pipeline Executed Successfully!';
          setTimeout(() => {
            deriveBtn.disabled = false;
            deriveBtn.classList.remove('is-success');
            deriveBtn.innerHTML = 'Execute Full Cryptographic Pipeline &rarr;';
          }, 1800);
        }

        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.className = 'derivation-status success';
          statusMsg.innerHTML = `<strong>&#10003; Pipeline Executed:</strong> Derived Ethereum Address <code>${result.checksummedAddress}</code> (EIP-55 Checksum Verified).`;
        }
      }
    } catch (err) {
      if (!isInitial && deriveBtn) {
        deriveBtn.disabled = false;
        deriveBtn.classList.remove('is-loading');
        deriveBtn.innerHTML = 'Execute Full Cryptographic Pipeline &rarr;';
      }
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'derivation-status error';
        statusMsg.innerHTML = `<strong>&#9888; Derivation Error:</strong> ${err.message}`;
      } else {
        alert('Derivation Error: ' + err.message);
      }
    }
  }

  function renderPipelineResults(res) {
    // 1. Mnemonic words chips
    const wordsContainer = document.getElementById('mnemonicChips');
    if (wordsContainer) {
      wordsContainer.innerHTML = '';
      res.mnemonic.split(/\s+/).forEach((w, idx) => {
        const chip = document.createElement('span');
        chip.className = 'meta-tag';
        chip.innerHTML = `<span style="color:#64748b">${idx + 1}.</span> <strong>${w}</strong>`;
        wordsContainer.appendChild(chip);
      });
    }

    // 2. Binary Seed
    setText('seedHexDisplay', res.seedHex);
    setText('masterSecretDisplay', res.masterSecretHex);
    setText('masterChainDisplay', res.masterChainCodeHex);
    setText('derivedPrivKeyDisplay', res.derivedPrivateKey);
    setText('secpPubUncompressedDisplay', res.publicKeyUncompressed);
    setText('secpPubCompressedDisplay', res.publicKeyCompressed);
    setText('keccakHashDisplay', res.keccak256Hash);
    setText('rawAddressDisplay', res.rawAddress);
    setText('checksumAddressDisplay', res.checksummedAddress);

    // EIP-55 Character-by-character Inspector
    const eipContainer = document.getElementById('eip55InspectorGrid');
    if (eipContainer && res.eip55Breakdown) {
      eipContainer.innerHTML = '';
      res.eip55Breakdown.forEach(item => {
        const el = document.createElement('div');
        const isDigit = item.char >= '0' && item.char <= '9';
        const cls = isDigit ? 'digit' : (item.isUpper ? 'upper' : 'lower');
        el.className = `eip55-char ${cls}`;
        el.innerHTML = `
          <div class="letter">${item.resultChar}</div>
          <div class="hash-val">${item.hashNibble.toString(16)}</div>
        `;
        el.title = isDigit ? `Digit '${item.char}' (unchanged)` : `Hash nibble = 0x${item.hashNibble.toString(16)} (${item.hashNibble} ${item.hashNibble >= 8 ? '>= 8 -> UPPERCASE' : '< 8 -> lowercase'})`;
        eipContainer.appendChild(el);
      });
    }

    // Bind copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.dataset.copyTarget;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          navigator.clipboard.writeText(targetEl.textContent.trim());
          const origText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = origText; }, 1500);
        }
      };
    });
  }

  async function runWalletAvalancheExperiment() {
    const pipeline = state.hw2.pipeline;
    const baseMnemonic = document.getElementById('mnemonicInput').value.trim();
    const words = baseMnemonic.split(/\s+/);
    if (words.length !== 12 && words.length !== 24) return;

    // Flip 1 word to another valid BIP-39 word (e.g. change last word or 1st word)
    const modifiedWords = [...words];
    const originalWord = modifiedWords[0];
    modifiedWords[0] = originalWord === 'abandon' ? 'ability' : 'abandon';
    const modifiedMnemonic = modifiedWords.join(' ');

    setText('avalancheModMnemonic', modifiedMnemonic);

    const diff = await pipeline.measureAvalanche(baseMnemonic, modifiedMnemonic);

    setText('avSeedDiff', `${diff.seedDiff.diffBits} / ${diff.seedDiff.totalBits} bits (${(diff.seedDiff.ratio * 100).toFixed(1)}%)`);
    setText('avPrivDiff', `${diff.privKeyDiff.diffBits} / ${diff.privKeyDiff.totalBits} bits (${(diff.privKeyDiff.ratio * 100).toFixed(1)}%)`);
    setText('avPubDiff', `${diff.pubKeyDiff.diffBits} / ${diff.pubKeyDiff.totalBits} bits (${(diff.pubKeyDiff.ratio * 100).toFixed(1)}%)`);
    setText('avHashDiff', `${diff.hashDiff.diffBits} / ${diff.hashDiff.totalBits} bits (${(diff.hashDiff.ratio * 100).toFixed(1)}%)`);
    setText('avAddrDiff', `${diff.addressDiff.diffBits} / ${diff.addressDiff.totalBits} bits (${(diff.addressDiff.ratio * 100).toFixed(1)}%)`);
  }

  // =========================================================================
  // ACADEMIC REPORT VIEWER
  // =========================================================================
  function initReportViewer() {
    const hw1TabBtn = document.getElementById('viewHw1ReportBtn');
    const hw2TabBtn = document.getElementById('viewHw2ReportBtn');
    const reportContent = document.getElementById('reportMarkdownContent');

    if (hw1TabBtn && hw2TabBtn && reportContent) {
      hw1TabBtn.addEventListener('click', () => {
        hw1TabBtn.classList.add('active');
        hw2TabBtn.classList.remove('active');
        loadReportContent('hw1');
      });

      hw2TabBtn.addEventListener('click', () => {
        hw2TabBtn.classList.add('active');
        hw1TabBtn.classList.remove('active');
        loadReportContent('hw2');
      });

      // Default load HW1 report
      loadReportContent('hw1');
    }
  }

  function loadReportContent(reportType) {
    const container = document.getElementById('reportMarkdownContent');
    if (!container) return;

    if (reportType === 'hw1') {
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
          <li>$2G = G + G = (2, 10)$ &mdash; [Doubling: $m \\equiv (3\\cdot 1^2)/(2\\cdot 5) \\equiv 3\\cdot 10^{-1} \\equiv 3\\cdot 12 \\equiv 2 \\pmod{17}$]</li>
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
    } else {
      container.innerHTML = `
        <h1>Module 2: From Wallet Seed to Ethereum Address</h1>
        <p><strong>Specification:</strong> BIP-32/39/44, SECP256K1, Keccak-256 &bull; <strong>Topic:</strong> Key Derivation Pipeline</p>

        <h2>1. The Cryptographic Pipeline Architecture</h2>
        <p>Ethereum addresses are generated through a multi-stage deterministic pipeline:</p>
        <pre><code>[Entropy (128-256 bits)] 
    &darr; SHA-256 Checksum + Wordlist mapping (BIP-39)
[Mnemonic Sentence (12-24 words)]
    &darr; PBKDF2 (HMAC-SHA512, 2048 rounds, salt="mnemonic"+passphrase)
[512-bit Binary Seed]
    &darr; HMAC-SHA512("Bitcoin seed", Seed) (BIP-32)
[Master Private Key (IL) + Master Chain Code (IR)]
    &darr; CKDpriv along path m / 44' / 60' / 0' / 0 / 0 (BIP-44)
[Derived 256-bit Private Key k]
    &darr; secp256k1 Point Multiplication Q = k &middot; G
[Uncompressed Public Key (65 bytes: 04 || X || Y)]
    &darr; Keccak-256(X || Y) [64-byte payload without 0x04]
[32-byte Keccak-256 Hash Digest]
    &darr; Slice last 20 bytes (least significant 160 bits)
[Raw 20-byte Ethereum Address]
    &darr; EIP-55 Mixed-Case Capitalization via Keccak-256(lowercase_address)
[Final Checksummed Address (0x...)]</code></pre>

        <h2>2. Distinct Cryptographic Primitives & Roles</h2>
        <table class="matrix-table" style="margin: 20px 0;">
          <thead>
            <tr>
              <th>Primitive Category</th>
              <th>Specific Algorithm in Pipeline</th>
              <th>Mathematical Role & Guarantee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Key Generation vs Derivation</td>
              <td>CSPRNG (Generation) &rarr; BIP-32/BIP-44 (Derivation)</td>
              <td>Entropy creation vs deterministic hierarchical key tree expansion.</td>
            </tr>
            <tr>
              <td>Public-Key Cryptography</td>
              <td>secp256k1 (Koblitz curve over $\\mathbb{F}_p$)</td>
              <td>Asymmetric trapdoor one-way function enabling ECDSA digital signatures.</td>
            </tr>
            <tr>
              <td>Cryptographic Hashing</td>
              <td>Keccak-256 & SHA-512</td>
              <td>Collision-resistant, pre-image resistant fixed-size digest creation.</td>
            </tr>
            <tr>
              <td>Error-Detection Checksums</td>
              <td>BIP-39 (SHA-256 bits) & EIP-55 (Keccak nibbles)</td>
              <td>Typographical and transmission error detection (human usability).</td>
            </tr>
            <tr>
              <td>Encoding</td>
              <td>Hexadecimal & ASCII</td>
              <td>Reversible representation without cryptographic keys.</td>
            </tr>
          </tbody>
        </table>

        <h2>3. Historical Context & The Keccak-256 vs SHA-3 Divergence</h2>
        <p>Ethereum uses <strong>Keccak-256</strong>, which differs from NIST's standardized <strong>SHA3-256 (FIPS 202)</strong>. The Keccak team submitted the sponge construction with padding <code>0x01 ... 0x80</code>. When NIST finalized FIPS 202 in August 2015, they introduced a 2-bit domain separation suffix (<code>01</code>), changing the padding byte to <code>0x06</code>. Ethereum had already launched its genesis block in July 2015 with Keccak-256, choosing to preserve consensus stability rather than change hash functions.</p>

        <h2>4. Why Ethereum Uses a Multi-Primitive Architecture</h2>
        <ul>
          <li><strong>Separation of Concerns:</strong> Different primitives solve fundamentally different mathematical problems: asymmetric signing requires abelian group structure (secp256k1), while address generation requires irreversible compression (Keccak-256).</li>
          <li><strong>Storage Optimization & Quantum Defense:</strong> Compressing 64-byte public keys to 20-byte addresses saves massive state storage in the Merkle Patricia Trie and protects public keys from quantum Shor's algorithm attacks until the account broadcasts its first signed transaction!</li>
          <li><strong>Defense in Depth:</strong> If a vulnerability is found in SHA-512 or BIP-32, the secp256k1 signature scheme and Keccak-256 address hashing remain independently secure.</li>
        </ul>
      `;
    }
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
        applyMathFallback(el);
      }
    }, 150);
  }

  function applyMathFallback(el) {
    if (!el) return;
    el.innerHTML = el.innerHTML
      .replace(/\\\(y\^2 \\equiv x\^3 \+ 7 \\pmod\{17\}\\\)/g, '<em>y</em><sup>2</sup> ≡ <em>x</em><sup>3</sup> + 7 (mod 17)')
      .replace(/\\\(\\mathbb\{F\}_\{17\} = \\\{0, 1, 2, \\dots, 16\\\}\\\)/g, '𝔽<sub>17</sub> = {0, 1, 2, …, 16}')
      .replace(/\\\(G = \(1, 5\)\\\)/g, '<em>G</em> = (1, 5)')
      .replace(/\\\(k = 6\\\)/g, '<em>k</em> = 6')
      .replace(/\\\(\\mathbb\{F\}_\{17\}\\\)/g, '𝔽<sub>17</sub>')
      .replace(/\\\(\\mathbb\{F\}_p\\\)/g, '𝔽<sub>p</sub>')
      .replace(/\\\(\\mathcal\{O\}\\\)/g, '𝒪')
      .replace(/\\equiv/g, '≡')
      .replace(/\\pmod\{(\d+)\}/g, '(mod $1)')
      .replace(/\\implies/g, '⟹')
      .replace(/\\in/g, '∈')
      .replace(/\\cdot/g, '·')
      .replace(/\\times/g, '×')
      .replace(/\\le/g, '≤')
      .replace(/\\([a-zA-Z]+)/g, '$1');
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

})();
