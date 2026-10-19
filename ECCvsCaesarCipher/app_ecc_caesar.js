/**
 * ECCvsCaesarCipher - Interactive UI Coordinator & Visualization Suite
 * Handles real-time reactivity, canvas charting, live cryptanalytic attacks,
 * benchmark simulations, and KaTeX-enhanced formal report rendering.
 */

(function () {
  'use strict';

  // Benchmark corpus text (multi-sentence English excerpt)
  const BENCHMARK_CORPUS = `
    CRYPTOGRAPHY IS THE STUDY AND PRACTICE OF TECHNIQUES FOR SECURE COMMUNICATION
    IN THE PRESENCE OF THIRD PARTIES CALLED ADVERSARIES. MODERN CRYPTOGRAPHY INTERSECTS
    MATHEMATICS, COMPUTER SCIENCE, ELECTRICAL ENGINEERING, COMMUNICATION SCIENCE,
    AND PHYSICS. CORE PRINCIPLES INCLUDE CONFIDENTIALITY, DATA INTEGRITY,
    AUTHENTICATION, AND NON-REPUDIATION. ASYMMETRIC CRYPTOGRAPHY USES A PAIR OF
    CONNECTED KEYS: A PUBLIC KEY TO ENCRYPT AND A PRIVATE KEY TO DECRYPT.
    ELLIPTIC CURVE CRYPTOGRAPHY OFFERS EQUIVALENT SECURITY TO RSA WITH SIGNIFICANTLY
    SMALLER KEY SIZES, MAKING COMPUTATION EFFICIENT FOR MODERN HARDWARE.
    INFORMATION THEORY PROVIDES THE FUNDAMENTAL LIMITS OF DATA COMPRESSION AND
    TRANSMISSION. CLAUDE SHANNON DEFINED THE UNICITY DISTANCE AS THE AMOUNT OF
    CIPHERTEXT REQUIRED TO UNIQUELY DETERMINE THE KEY USED IN ENCRYPTION.
    CLASSICAL SUBSTITUTION CIPHERS SUCH AS THE CAESAR CIPHER PRESERVE FREQUENCY
    PROPERTIES OF NATURAL LANGUAGES, ENABLING STATISTICAL RECOVERY VIA CHI-SQUARE
    TESTS AND INDEX OF COINCIDENCE CALCULATIONS.
  `.replace(/\s+/g, ' ').trim();

  // Application State
  const state = {
    plaintext: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
    caesarShift: 7,
    eccKeyRange: 65535,
    eccAliceKeypair: null,
    eccBobEphemeral: null,
    eccEncryptionResult: null,
    caesarResult: null,
    benchmarkResults: null
  };

  // DOM Elements cache
  const elements = {};

  function cacheDom() {
    elements.tabBtnLab = document.getElementById('tab-btn-lab');
    elements.tabBtnReport = document.getElementById('tab-btn-report');
    elements.tabLab = document.getElementById('tab-lab');
    elements.tabReport = document.getElementById('tab-report');
    elements.reportContainer = document.getElementById('report-rendered-markdown');

    elements.inputPlaintext = document.getElementById('input-plaintext');
    elements.labelCharCount = document.getElementById('label-char-count');
    elements.btnQuickBrown = document.getElementById('btn-load-quickbrown');
    elements.btnGettysburg = document.getElementById('btn-load-gettysburg');
    elements.btnShort = document.getElementById('btn-load-short');

    // Caesar elements
    elements.sliderCaesarShift = document.getElementById('slider-caesar-shift');
    elements.caesarShiftBadge = document.getElementById('caesar-shift-badge');
    elements.btnCaesarRandomKey = document.getElementById('btn-caesar-random-key');
    elements.caesarCiphertextBox = document.getElementById('caesar-ciphertext-box');
    elements.caesarDecryptedBox = document.getElementById('caesar-decrypted-box');
    elements.lblShiftDisplay = document.getElementById('lbl-shift-display');
    elements.badgeCaesarAttackResult = document.getElementById('badge-caesar-attack-result');
    elements.badgeCaesarIoc = document.getElementById('badge-caesar-ioc');
    elements.tbodyCaesarCandidates = document.getElementById('tbody-caesar-candidates');

    // Canvas elements
    elements.canvasFreqChart = document.getElementById('canvas-freq-chart');
    elements.canvasChi2Chart = document.getElementById('canvas-chi2-chart');
    elements.canvasBenchmarkChart = document.getElementById('canvas-benchmark-chart');
    elements.btnRunBenchmark = document.getElementById('btn-run-benchmark');
    elements.tbodyBenchmarkResults = document.getElementById('tbody-benchmark-results');

    // ECC elements
    elements.selectEccRange = document.getElementById('select-ecc-range');
    elements.btnEccRegenKeys = document.getElementById('btn-ecc-regen-keys');
    elements.statToyKeyspace = document.getElementById('stat-toy-keyspace');
    elements.eccAlicePriv = document.getElementById('ecc-alice-priv');
    elements.eccAlicePub = document.getElementById('ecc-alice-pub');
    elements.eccBobR = document.getElementById('ecc-bob-r');
    elements.eccBobRPoint = document.getElementById('ecc-bob-r-point');
    elements.eccSharedSecret = document.getElementById('ecc-shared-secret');
    elements.eccCiphertextBox = document.getElementById('ecc-ciphertext-box');
    elements.eccDecryptedBox = document.getElementById('ecc-decrypted-box');

    // Attack elements
    elements.attackTargetPubBox = document.getElementById('attack-target-pub-box');
    elements.btnLaunchEccAttack = document.getElementById('btn-launch-ecc-attack');
    elements.badgeAttackStatus = document.getElementById('badge-attack-status');
    elements.attackConsoleOutput = document.getElementById('attack-console-output');
    elements.attackRecoveredPlaintext = document.getElementById('attack-recovered-plaintext');
    elements.badgeRecoveryMatch = document.getElementById('badge-recovery-match');
  }

  // =========================================================================
  // INITIALIZATION & TAB SWITCHING
  // =========================================================================

  function init() {
    cacheDom();
    setupEventListeners();
    generateEccKeypair();
    runPipeline();
    loadReportMarkdown();
  }

  function setupEventListeners() {
    // Tab switching
    elements.tabBtnLab.addEventListener('click', () => switchTab('tab-lab'));
    elements.tabBtnReport.addEventListener('click', () => switchTab('tab-report'));

    // Text inputs
    elements.inputPlaintext.addEventListener('input', (e) => {
      state.plaintext = e.target.value;
      runPipeline();
    });

    elements.btnQuickBrown.addEventListener('click', () => {
      state.plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
      elements.inputPlaintext.value = state.plaintext;
      runPipeline();
    });

    elements.btnGettysburg.addEventListener('click', () => {
      state.plaintext = 'FOUR SCORE AND SEVEN YEARS AGO OUR FATHERS BROUGHT FORTH ON THIS CONTINENT A NEW NATION CONCEIVED IN LIBERTY AND DEDICATED TO THE PROPOSITION THAT ALL MEN ARE CREATED EQUAL';
      elements.inputPlaintext.value = state.plaintext;
      runPipeline();
    });

    elements.btnShort.addEventListener('click', () => {
      state.plaintext = 'SECRETATTACK';
      elements.inputPlaintext.value = state.plaintext;
      runPipeline();
    });

    // Caesar controls
    elements.sliderCaesarShift.addEventListener('input', (e) => {
      state.caesarShift = parseInt(e.target.value, 10);
      elements.caesarShiftBadge.textContent = `k = ${state.caesarShift}`;
      elements.lblShiftDisplay.textContent = `k = ${state.caesarShift}`;
      runPipeline();
    });

    elements.btnCaesarRandomKey.addEventListener('click', () => {
      state.caesarShift = Math.floor(Math.random() * 25) + 1;
      elements.sliderCaesarShift.value = state.caesarShift;
      elements.caesarShiftBadge.textContent = `k = ${state.caesarShift}`;
      elements.lblShiftDisplay.textContent = `k = ${state.caesarShift}`;
      runPipeline();
    });

    // ECC controls
    elements.selectEccRange.addEventListener('change', (e) => {
      state.eccKeyRange = parseInt(e.target.value, 10);
      elements.statToyKeyspace.textContent = state.eccKeyRange.toLocaleString();
      generateEccKeypair();
      runPipeline();
    });

    elements.btnEccRegenKeys.addEventListener('click', () => {
      generateEccKeypair();
      runPipeline();
    });

    // Benchmark button
    elements.btnRunBenchmark.addEventListener('click', runBenchmarkSimulation);

    // ECC Attack button
    elements.btnLaunchEccAttack.addEventListener('click', executeEccAttack);
  }

  function switchTab(targetId) {
    if (targetId === 'tab-lab') {
      elements.tabBtnLab.classList.add('active');
      elements.tabBtnReport.classList.remove('active');
      elements.tabLab.style.display = 'block';
      elements.tabReport.style.display = 'none';
      // Redraw charts after unhiding tab
      drawFrequencyChart();
      drawChiSquareChart();
      if (state.benchmarkResults) drawBenchmarkChart(state.benchmarkResults);
    } else {
      elements.tabBtnLab.classList.remove('active');
      elements.tabBtnReport.classList.add('active');
      elements.tabLab.style.display = 'none';
      elements.tabReport.style.display = 'block';
    }
  }

  // =========================================================================
  // CORE PIPELINE EXECUTION
  // =========================================================================

  function generateEccKeypair() {
    state.eccAliceKeypair = ECCvsCaesarEngine.toyEccKeygen(state.eccKeyRange);
    elements.eccAlicePriv.textContent = state.eccAliceKeypair.privateKey.toString();
    elements.eccAlicePub.textContent = state.eccAliceKeypair.serializedPub;
    elements.attackTargetPubBox.textContent = `Q_A = ${state.eccAliceKeypair.serializedPub}`;
  }

  function runPipeline() {
    const cleanMsg = ECCvsCaesarEngine.normalizeText(state.plaintext);
    elements.labelCharCount.textContent = `Length: ${cleanMsg.length} characters (A-Z only)`;

    // 1. Caesar Cipher
    const caesarCipher = ECCvsCaesarEngine.caesarEncrypt(cleanMsg, state.caesarShift);
    const caesarDecrypted = ECCvsCaesarEngine.caesarDecrypt(caesarCipher, state.caesarShift);
    state.caesarResult = { ciphertext: caesarCipher, decrypted: caesarDecrypted };

    elements.caesarCiphertextBox.textContent = caesarCipher || '(empty)';
    elements.caesarDecryptedBox.textContent = caesarDecrypted || '(empty)';

    // 2. Toy ECC Scheme
    const eccEnc = ECCvsCaesarEngine.toyEccEncrypt(cleanMsg, state.eccAliceKeypair.publicKey, state.eccKeyRange);
    const eccDec = ECCvsCaesarEngine.toyEccDecrypt(eccEnc.ciphertext, eccEnc.ephemeralPoint, state.eccAliceKeypair.privateKey);
    state.eccEncryptionResult = eccEnc;

    elements.eccBobR.textContent = eccEnc.ephemeralScalar.toString();
    elements.eccBobRPoint.textContent = eccEnc.serializedR;
    elements.eccSharedSecret.textContent = '0x' + eccEnc.sharedSecretX;
    elements.eccCiphertextBox.textContent = `(R, "${eccEnc.ciphertext}")`;
    elements.eccDecryptedBox.textContent = eccDec.decryptedText || '(empty)';

    // 3. Caesar Statistical Cryptanalysis
    const caesarAttack = ECCvsCaesarEngine.analyzeCaesarChiSquare(caesarCipher);
    elements.badgeCaesarAttackResult.textContent = `Recovered Key: k* = ${caesarAttack.bestKey}`;
    elements.badgeCaesarIoc.textContent = `IoC = ${caesarAttack.ioc.toFixed(4)}`;

    if (caesarAttack.bestKey === state.caesarShift) {
      elements.badgeCaesarAttackResult.className = 'card-badge badge-emerald';
      elements.badgeCaesarAttackResult.textContent += ' (CORRECT)';
    } else {
      elements.badgeCaesarAttackResult.className = 'card-badge badge-rose';
      elements.badgeCaesarAttackResult.textContent += ' (MISMATCH)';
    }

    renderCaesarCandidateTable(caesarAttack.scores);

    // 4. Update Charts
    drawFrequencyChart();
    drawChiSquareChart(caesarAttack.scores, caesarAttack.bestKey);
  }

  // =========================================================================
  // CAESAR CRYPTANALYSIS VISUALIZATIONS & CHARTS
  // =========================================================================

  function renderCaesarCandidateTable(scores) {
    const top5 = scores.slice(0, 5);
    elements.tbodyCaesarCandidates.innerHTML = top5.map((s, idx) => {
      const isBest = idx === 0;
      const isTrueKey = s.shiftKey === state.caesarShift;
      const rowStyle = isTrueKey ? 'background:rgba(16,185,129,0.08);' : '';
      const keyBadge = isTrueKey ? '<span class="card-badge badge-emerald" style="margin-left:6px;">True Key</span>' : '';

      return `
        <tr style="${rowStyle}">
          <td class="strong">#${idx + 1}</td>
          <td><span class="val-highlight">k = ${s.shiftKey}</span>${keyBadge}</td>
          <td>${s.chiSquare.toFixed(2)}</td>
          <td>${(s.dotProduct * 100).toFixed(2)}%</td>
          <td>${(s.bigramScore * 100).toFixed(1)}%</td>
          <td style="font-family:var(--font-mono); font-size:0.8rem; color:${isBest ? '#34d399' : '#94a3b8'};">
            ${s.candidateText}
          </td>
        </tr>
      `;
    }).join('');
  }

  function drawFrequencyChart() {
    const canvas = elements.canvasFreqChart;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const cleanPlain = ECCvsCaesarEngine.normalizeText(state.plaintext);
    const cleanCipher = state.caesarResult ? state.caesarResult.ciphertext : '';

    const plainFreq = ECCvsCaesarEngine.computeFrequencies(cleanPlain).rel;
    const cipherFreq = ECCvsCaesarEngine.computeFrequencies(cleanCipher).rel;
    const engFreq = ECCvsCaesarEngine.ENGLISH_FREQ;

    const padLeft = 36;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 30;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Y Axis max
    const maxVal = 0.16;

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let p = 0; p <= 0.15; p += 0.05) {
      const y = padTop + chartH - (p / maxVal) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${(p * 100).toFixed(0)}%`, padLeft - 6, y + 3);
    }

    const barGroupW = chartW / 26;
    const barW = Math.max(2, (barGroupW - 4) / 2);

    for (let i = 0; i < 26; i++) {
      const ch = String.fromCharCode(65 + i);
      const xGroup = padLeft + i * barGroupW + 2;

      // Plaintext Bar (Cyan)
      const pVal = plainFreq[ch] || 0;
      const pHeight = (pVal / maxVal) * chartH;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(xGroup, padTop + chartH - pHeight, barW, pHeight);

      // Ciphertext Bar (Amber)
      const cVal = cipherFreq[ch] || 0;
      const cHeight = (cVal / maxVal) * chartH;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(xGroup + barW + 1, padTop + chartH - cHeight, barW, cHeight);

      // English Expected Marker (White tick)
      const eVal = engFreq[ch] || 0;
      const eY = padTop + chartH - (eVal / maxVal) * chartH;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(xGroup - 1, eY - 1, barGroupW - 2, 2);

      // Letter X Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ch, xGroup + barGroupW / 2 - 1, h - 10);
    }
  }

  function drawChiSquareChart(scores, bestKey) {
    const canvas = elements.canvasChi2Chart;
    if (!canvas || !canvas.getContext || !scores) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const padLeft = 40;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 30;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Sort by shift 0..25 to display natural spectrum
    const byShift = [...scores].sort((a, b) => a.shiftKey - b.shiftKey);
    const maxChi = Math.max(...byShift.map(s => s.chiSquare), 10);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let step = 0; step <= 4; step++) {
      const val = (maxChi * step) / 4;
      const y = padTop + chartH - (step / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), padLeft - 6, y + 3);
    }

    const barW = chartW / 26;

    for (let i = 0; i < 26; i++) {
      const s = byShift[i];
      const x = padLeft + i * barW + 2;
      const bH = (s.chiSquare / maxChi) * chartH;
      const y = padTop + chartH - bH;

      if (s.shiftKey === bestKey) {
        ctx.fillStyle = '#34d399'; // Global minimum
      } else if (s.shiftKey === state.caesarShift) {
        ctx.fillStyle = '#38bdf8'; // True key
      } else {
        ctx.fillStyle = '#334155';
      }

      ctx.fillRect(x, y, barW - 4, bH);

      // Label
      ctx.fillStyle = s.shiftKey === bestKey ? '#34d399' : '#94a3b8';
      ctx.font = '10px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.shiftKey.toString(), x + (barW - 4) / 2, h - 10);
    }
  }

  // =========================================================================
  // MULTI-LENGTH BENCHMARK SIMULATOR
  // =========================================================================

  function runBenchmarkSimulation() {
    elements.btnRunBenchmark.disabled = true;
    elements.btnRunBenchmark.innerHTML = '<span>&hellip;</span> Simulating Monte Carlo Trials...';

    setTimeout(() => {
      try {
        const lengths = [5, 10, 15, 25, 50, 100, 200, 500];
        const results = ECCvsCaesarEngine.runLengthBenchmark(BENCHMARK_CORPUS, lengths, 50);
        state.benchmarkResults = results;

        renderBenchmarkTable(results);
        drawBenchmarkChart(results);
      } catch (err) {
        console.error("Benchmark error:", err);
      } finally {
        elements.btnRunBenchmark.disabled = false;
        elements.btnRunBenchmark.innerHTML = '<span>&blacktriangleright;</span> Run Live Benchmark Simulation';
      }
    }, 50);
  }

  function renderBenchmarkTable(results) {
    elements.tbodyBenchmarkResults.innerHTML = results.map(r => `
      <tr>
        <td class="strong">N = ${r.length}</td>
        <td>
          <span class="card-badge ${r.accuracyChi2 >= 90 ? 'badge-emerald' : r.accuracyChi2 >= 50 ? 'badge-amber' : 'badge-rose'}">
            ${r.accuracyChi2.toFixed(1)}%
          </span>
        </td>
        <td>${r.accuracyDotProduct.toFixed(1)}%</td>
        <td>${r.accuracyBigram.toFixed(1)}%</td>
        <td style="font-family:var(--font-mono);">${r.avgTrueKeyChi2.toFixed(2)}</td>
      </tr>
    `).join('');
  }

  function drawBenchmarkChart(results) {
    const canvas = elements.canvasBenchmarkChart;
    if (!canvas || !canvas.getContext || !results) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const padLeft = 44;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 34;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    // Y Axis: 0% to 100%
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = padTop + chartH - (pct / 100) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, padLeft - 6, y + 3);
    }

    // Plot Chi-Square Accuracy Curve (Emerald)
    function getX(idx) {
      return padLeft + (idx / (results.length - 1)) * chartW;
    }
    function getY(acc) {
      return padTop + chartH - (acc / 100) * chartH;
    }

    // Line 1: Chi-Square (Emerald)
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    results.forEach((r, idx) => {
      const x = getX(idx);
      const y = getY(r.accuracyChi2);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Line 2: Dot Product (Cyan dashed)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    results.forEach((r, idx) => {
      const x = getX(idx);
      const y = getY(r.accuracyDotProduct);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Data points & X axis labels
    results.forEach((r, idx) => {
      const x = getX(idx);
      const y = getY(r.accuracyChi2);

      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`N=${r.length}`, x, h - 12);
    });

    // Legend
    ctx.fillStyle = '#34d399';
    ctx.fillRect(padLeft + 10, padTop - 14, 12, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Chi-Square (χ²)', padLeft + 26, padTop - 11);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padLeft + 120, padTop - 14, 12, 3);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Dot Product Correlation', padLeft + 136, padTop - 11);
  }

  // =========================================================================
  // TOY ECC CRYPTANALYSIS (LIVE BSGS & BRUTE-FORCE ECDLP ATTACK)
  // =========================================================================

  function logConsole(msg, type = 'normal') {
    const now = new Date();
    const timeStr = `[${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}]`;
    const line = document.createElement('div');
    line.className = 'log-entry';

    let colorClass = '';
    if (type === 'success') colorClass = 'log-success';
    else if (type === 'highlight') colorClass = 'log-highlight';
    else if (type === 'warn') colorClass = 'log-warn';

    line.innerHTML = `<span class="log-time">${timeStr}</span><span class="${colorClass}">${msg}</span>`;
    elements.attackConsoleOutput.appendChild(line);
    elements.attackConsoleOutput.scrollTop = elements.attackConsoleOutput.scrollHeight;
  }

  function executeEccAttack() {
    const selectedMethod = document.querySelector('input[name="radio-ecc-attack-method"]:checked').value;
    const targetQ = state.eccAliceKeypair.publicKey;
    const range = state.eccKeyRange;

    elements.attackConsoleOutput.innerHTML = '';
    elements.badgeAttackStatus.textContent = 'Attacking...';
    elements.badgeAttackStatus.className = 'card-badge badge-amber';
    elements.btnLaunchEccAttack.disabled = true;

    logConsole(`Target Intercepted: Q_A = ${state.eccAliceKeypair.serializedPub.slice(0, 20)}...`, 'highlight');
    logConsole(`Known Key Space Bound: K_max = ${range.toLocaleString()} (${Math.ceil(Math.log2(range))} bits)`);

    setTimeout(() => {
      if (selectedMethod === 'bsgs') {
        runBsgsAttack(targetQ, range);
      } else {
        runBruteForceAttack(targetQ, range);
      }
    }, 40);
  }

  function runBsgsAttack(targetQ, range) {
    const m = Math.ceil(Math.sqrt(range));
    logConsole(`[BSGS Phase 1] Step bound m = ceil(sqrt(${range})) = ${m}`, 'highlight');
    logConsole(`Precomputing baby steps table: Q - j*G for j in [0 .. ${m - 1}]...`);

    const result = ECCvsCaesarEngine.solveEcdlpBSGS(targetQ, range);

    logConsole(`[BSGS Phase 1 Complete] Table populated with ${result.tableSize} baby points.`);
    logConsole(`[BSGS Phase 2] Testing giant steps i*(m*G) against hash table...`);

    if (result.success) {
      logConsole(`>>> COLLISION DETECTED! at i = ${result.matchedI}, j = ${result.matchedJ}`, 'success');
      logConsole(`Derived Private Scalar: d = ${result.matchedI} * ${m} + ${result.matchedJ} = ${result.recoveredScalar}`, 'success');
      logConsole(`ECDLP Solved in ${result.elapsedMs.toFixed(2)} ms! Total EC additions: ${result.pointOps}`, 'success');

      finishAttackSuccess(result.recoveredScalar);
    } else {
      logConsole(`Attack finished without collision. Key not in bound.`, 'warn');
      finishAttackFail();
    }
  }

  function runBruteForceAttack(targetQ, range) {
    logConsole(`[Brute-Force] Testing linear scalar additions 1*G, 2*G, ... up to ${range}...`, 'warn');

    const result = ECCvsCaesarEngine.solveEcdlpBruteForce(targetQ, range, 5000);

    if (result.success) {
      logConsole(`>>> MATCH FOUND at k = ${result.recoveredScalar}!`, 'success');
      logConsole(`Scalar recovered in ${result.elapsedMs.toFixed(2)} ms across ${result.pointOps} point operations.`, 'success');
      finishAttackSuccess(result.recoveredScalar);
    } else if (result.timedOut) {
      logConsole(`Attack exceeded 5000ms safety timeout after ${result.pointOps} operations.`, 'warn');
      finishAttackFail();
    } else {
      logConsole(`Scalar not found within range.`, 'warn');
      finishAttackFail();
    }
  }

  function finishAttackSuccess(recoveredScalar) {
    elements.badgeAttackStatus.textContent = 'Attack Succeeded';
    elements.badgeAttackStatus.className = 'card-badge badge-emerald';
    elements.btnLaunchEccAttack.disabled = false;

    // Use recovered key to decrypt intercepted ciphertext!
    const interceptedCiphertext = state.eccEncryptionResult.ciphertext;
    const interceptedR = state.eccEncryptionResult.ephemeralPoint;

    logConsole(`[Adversary Exploit] Computing S = d_recovered * R to decrypt intercepted ciphertext...`, 'highlight');

    const decrypted = ECCvsCaesarEngine.toyEccDecrypt(interceptedCiphertext, interceptedR, recoveredScalar);

    logConsole(`[Adversary Exploit] Shared secret recovered: 0x${decrypted.sharedSecretX.slice(0, 16)}...`, 'success');
    logConsole(`[Adversary Exploit] Extracted Plaintext: "${decrypted.decryptedText}"`, 'success');

    elements.attackRecoveredPlaintext.textContent = decrypted.decryptedText;
    elements.badgeRecoveryMatch.style.display = 'inline-block';
  }

  function finishAttackFail() {
    elements.badgeAttackStatus.textContent = 'Failed';
    elements.badgeAttackStatus.className = 'card-badge badge-rose';
    elements.btnLaunchEccAttack.disabled = false;
  }

  // =========================================================================
  // REPORT MARKDOWN LOADER & KATEX RENDERER
  // =========================================================================

  function loadReportMarkdown() {
    fetch('Homework_Report.md')
      .then(res => {
        if (!res.ok) throw new Error("Could not load Homework_Report.md");
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
            Please ensure <code>Homework_Report.md</code> is placed alongside <code>index.html</code>.
          </p>
        `;
      });
  }

  // Auto boot
  window.addEventListener('DOMContentLoaded', init);

})();
