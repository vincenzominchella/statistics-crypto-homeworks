/**
 * ============================================================================
 * Statistical Independence & Bivariate Contingency Analysis Engine
 * Homework 6 • Foundations of Statistics & Probability
 * ============================================================================
 */

(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.IndependenceEngine = api;
  }
  if (typeof self !== 'undefined') {
    self.IndependenceEngine = api;
  }
  if (root) {
    root.IndependenceEngine = api;
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // =========================================================================
  // SPECIAL MATHEMATICAL FUNCTIONS: GAMMA & CHI-SQUARE DISTRIBUTIONS
  // =========================================================================

  /**
   * Lanczos approximation for ln(Gamma(z))
   * Accurate to 15 decimal digits for Re(z) > 0.
   */
  function logGamma(z) {
    const cof = [
      76.18009172947146,
      -86.50532032941677,
      24.01409824083091,
      -1.231739572450155,
      0.1208650973866179e-2,
      -0.5395239384953e-5
    ];
    let x = z, y = z;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }

  /**
   * Series expansion for Lower Incomplete Gamma P(a, x) = gamma(a, x) / Gamma(a)
   */
  function gammaSeries(a, x) {
    if (x <= 0) return 0;
    const gln = logGamma(a);
    let ap = a;
    let del = 1.0 / a;
    let sum = del;
    for (let n = 1; n <= 300; n++) {
      ++ap;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }

  /**
   * Continued fraction for Upper Incomplete Gamma Q(a, x) = Gamma(a, x) / Gamma(a)
   */
  function gammaContinuedFraction(a, x) {
    const gln = logGamma(a);
    let b = x + 1.0 - a;
    let c = 1.0 / 1e-30;
    let d = 1.0 / b;
    let h = d;
    for (let i = 1; i <= 300; i++) {
      const an = -i * (i - a);
      b += 2.0;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1.0 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1.0) < 1e-15) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }

  /**
   * Regularized Upper Incomplete Gamma Q(a, x) = 1 - P(a, x)
   */
  function regularizedGammaQ(a, x) {
    if (x < 0.0 || a <= 0.0) return 0;
    if (x === 0.0) return 1.0;
    if (x < a + 1.0) {
      return Math.max(0.0, Math.min(1.0, 1.0 - gammaSeries(a, x)));
    } else {
      return Math.max(0.0, Math.min(1.0, gammaContinuedFraction(a, x)));
    }
  }

  /**
   * Chi-Square Probability Density Function (PDF)
   * f(x; k) = (1 / (2^(k/2) * Gamma(k/2))) * x^(k/2 - 1) * exp(-x/2)
   */
  function chiSquarePdf(x, df) {
    if (x <= 0 || df <= 0) return 0;
    const a = df / 2.0;
    const logVal = -x / 2.0 + (a - 1.0) * Math.log(x) - a * Math.log(2.0) - logGamma(a);
    return Math.exp(logVal);
  }

  /**
   * Chi-Square Right-Tail p-value: P(X >= chi2) with df degrees of freedom
   */
  function chiSquarePValue(chi2, df) {
    if (chi2 <= 0 || df <= 0) return 1.0;
    return regularizedGammaQ(df / 2.0, chi2 / 2.0);
  }

  /**
   * Exact Critical Value chi2Crit(df, alpha) such that P(X >= chi2Crit) = alpha
   * Uses Wilson-Hilferty transformation followed by Newton-Raphson refinement.
   */
  function chiSquareCriticalValue(df, alpha = 0.05) {
    if (df <= 0) return 0;
    const zMap = {
      0.10: 1.281551565545,
      0.05: 1.644853626951,
      0.025: 1.959963984540,
      0.01: 2.326347874041,
      0.001: 3.090232306168
    };
    const z = zMap[alpha] || 1.644853626951;
    let x = df * Math.pow(1.0 - 2.0 / (9.0 * df) + z * Math.sqrt(2.0 / (9.0 * df)), 3);

    for (let iter = 0; iter < 12; iter++) {
      const p = chiSquarePValue(x, df);
      const diff = p - alpha;
      if (Math.abs(diff) < 1e-12) break;
      const pdf = chiSquarePdf(x, df);
      if (pdf <= 1e-18) break;
      x = x + diff / pdf;
      if (x <= 0) x = 0.001;
    }
    return Math.max(0.001, x);
  }

  // =========================================================================
  // PRELOADED BENCHMARK DATASETS
  // =========================================================================

  const PRELOADED_DATASETS = {
    cybersecurity: {
      id: 'cybersecurity',
      title: 'Cybersecurity: Attack Vector vs. Breach Severity',
      description: 'Empirical cross-classification of 740 enterprise security incidents categorizing initial attack vector against resulting breach severity.',
      rowVar: 'Initial Attack Vector (X)',
      colVar: 'Breach Severity (Y)',
      rowLabels: ['Phishing / Social Eng.', 'Zero-Day / Exploit', 'Insider Threat'],
      colLabels: ['Low Impact', 'Data Exfiltration', 'Full System Takeover'],
      matrix: [
        [180, 95, 25],
        [40, 110, 130],
        [30, 85, 45]
      ],
      expectedVerdict: 'Strong Statistical Dependence (Rejection of H0, p < 0.001)',
      domainNotes: 'Zero-day exploits heavily favor severe system compromise, while phishing primarily leads to low impact or credentials exfiltration.'
    },

    clinical: {
      id: 'clinical',
      title: 'Clinical Trial: Antiviral Therapy vs. Viral Elimination',
      description: 'Randomized 2x2 clinical study evaluating the therapeutic outcome of a novel protease inhibitor vs standard placebo.',
      rowVar: 'Treatment Arm (X)',
      colVar: 'Clinical Outcome at Day 14 (Y)',
      rowLabels: ['Placebo Control', 'Novel Antiviral (400mg)'],
      colLabels: ['Persistent Infection', 'Complete Viral Clearance'],
      matrix: [
        [160, 40],
        [45, 155]
      ],
      expectedVerdict: 'Highly Significant Association (Odds Ratio = 13.78, p < 0.001)',
      domainNotes: '2x2 contingency table demonstrating significant therapeutic efficacy, with substantial Odds Ratio and Relative Risk differentials.'
    },

    academic: {
      id: 'academic',
      title: 'Academic Research: Learning Modality vs. Exam Grade',
      description: 'Survey across 600 university students comparing primary study methodology with final examination performance.',
      rowVar: 'Study Methodology (X)',
      colVar: 'Exam Grade Bracket (Y)',
      rowLabels: ['Solo Cramming', 'Active Group Study', 'AI Interactive Tutoring'],
      colLabels: ['Standard Pass (C-B)', 'Excellence (A-A+)'],
      matrix: [
        [150, 50],
        [110, 90],
        [60, 140]
      ],
      expectedVerdict: 'Significant Positive Shift (Cramér\'s V = 0.32, p < 0.001)',
      domainNotes: 'AI tutoring and active study correlate with high academic excellence compared to solo passive memorization.'
    },

    prng: {
      id: 'prng',
      title: 'Cryptographic PRNG: Bit Transition Uniformity (H0 Baseline)',
      description: 'Verification of statistical independence in sequential bits produced by a cryptographically secure pseudo-random number generator (CSPRNG).',
      rowVar: 'Bit State at Step t (X)',
      colVar: 'Bit State at Step t+1 (Y)',
      rowLabels: ['Bit = 0', 'Bit = 1'],
      colLabels: ['Bit = 0', 'Bit = 1'],
      matrix: [
        [2512, 2488],
        [2494, 2506]
      ],
      expectedVerdict: 'Consistent with Statistical Independence (H0 Not Rejected, p = 0.76)',
      domainNotes: 'Textbook baseline of empirical independence: observed counts closely mirror expected frequencies with negligible chi-square residuals.'
    },

    simpson_aggregated: {
      id: 'simpson_aggregated',
      title: 'Simpson\'s Paradox: Hospital Treatment Success (Aggregated)',
      description: 'Pooled comparison of survival outcomes between Hospital A (Research Center) and Hospital B (Community Clinic).',
      rowVar: 'Treatment Hospital (X)',
      colVar: 'Patient Outcome (Y)',
      rowLabels: ['Hospital A (Specialized)', 'Hospital B (Community)'],
      colLabels: ['Died', 'Survived'],
      matrix: [
        [90, 910],
        [60, 940]
      ],
      expectedVerdict: 'Apparent Disadvantage for Hospital A (Survival: 91.0% vs 94.0%)',
      domainNotes: 'Marginally, Hospital B appears superior. However, Hospital A treats the vast majority of critical/severe patients (confounding by severity).'
    },

    simpson_mild: {
      id: 'simpson_mild',
      title: 'Simpson\'s Sub-Group: Mild Patient Condition (Stratum Z=1)',
      description: 'Outcome stratified exclusively on patients admitted in Mild Condition.',
      rowVar: 'Treatment Hospital (X)',
      colVar: 'Patient Outcome (Y)',
      rowLabels: ['Hospital A (Mild)', 'Hospital B (Mild)'],
      colLabels: ['Died', 'Survived'],
      matrix: [
        [10, 590],
        [30, 870]
      ],
      expectedVerdict: 'Hospital A Outperforms Hospital B (Survival: 98.3% vs 96.7%)',
      domainNotes: 'Conditioning on Mild condition, Hospital A achieves higher survival rate (98.3% vs 96.7%).'
    },

    simpson_severe: {
      id: 'simpson_severe',
      title: 'Simpson\'s Sub-Group: Severe Patient Condition (Stratum Z=2)',
      description: 'Outcome stratified exclusively on patients admitted in Severe Condition.',
      rowVar: 'Treatment Hospital (X)',
      colVar: 'Patient Outcome (Y)',
      rowLabels: ['Hospital A (Severe)', 'Hospital B (Severe)'],
      colLabels: ['Died', 'Survived'],
      matrix: [
        [80, 320],
        [30, 70]
      ],
      expectedVerdict: 'Hospital A Outperforms Hospital B (Survival: 80.0% vs 70.0%)',
      domainNotes: 'Conditioning on Severe condition, Hospital A again achieves higher survival rate (80.0% vs 70.0%), proving complete causal reversal!'
    }
  };

  // =========================================================================
  // CORE ENGINE: BIVARIATE CONTINGENCY TABLE & INDEPENDENCE ANALYSIS
  // =========================================================================

  /**
   * Exhaustive statistical analysis of an r x c contingency table.
   *
   * @param {number[][]} matrix - 2D array of observed non-negative counts O_{ij}
   * @param {string[]} rowLabels - Names of categories for variable X
   * @param {string[]} colLabels - Names of categories for variable Y
   * @param {number} alpha - Significance level for hypothesis testing (default 0.05)
   * @returns {Object} Complete analytical, inferential, and effect-size breakdown
   */
  function analyzeContingencyTable(matrix, rowLabels = [], colLabels = [], alpha = 0.05) {
    const r = matrix.length;
    if (r === 0) throw new Error("Matrix must have at least 1 row.");
    const c = matrix[0].length;
    if (c === 0) throw new Error("Matrix must have at least 1 column.");

    // Fill default labels if absent
    const rows = rowLabels.length === r ? [...rowLabels] : Array.from({ length: r }, (_, i) => `Row ${i + 1}`);
    const cols = colLabels.length === c ? [...colLabels] : Array.from({ length: c }, (_, j) => `Col ${j + 1}`);

    // Compute Row Marginals R_i, Column Marginals C_j, Grand Total N
    const rowTotals = new Array(r).fill(0);
    const colTotals = new Array(c).fill(0);
    let N = 0;

    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        const val = Number(matrix[i][j]) || 0;
        rowTotals[i] += val;
        colTotals[j] += val;
        N += val;
      }
    }

    if (N === 0) {
      throw new Error("Contingency table cannot have grand total N = 0.");
    }

    // 1. Joint and Marginal Frequencies
    const jointFrequencies = [];
    const rowMarginals = rowTotals.map(R => R / N);
    const colMarginals = colTotals.map(C => C / N);

    // 2. Conditional Distributions
    const rowConditionals = []; // P(Y = j | X = i)
    const colConditionals = []; // P(X = i | Y = j)

    // 3. Expected Frequencies Under Independence: E_ij = (R_i * C_j) / N
    const expected = [];
    const rawDeviations = []; // O_ij - E_ij
    const pearsonResiduals = []; // (O_ij - E_ij) / sqrt(E_ij)
    const standardizedResiduals = []; // Haberman adjusted residuals
    const chi2Contributions = []; // (O_ij - E_ij)^2 / E_ij

    let chiSquare = 0;
    let minExpected = Infinity;
    let cellsUnder5 = 0;
    let cellsUnder1 = 0;

    for (let i = 0; i < r; i++) {
      jointFrequencies[i] = [];
      rowConditionals[i] = [];
      expected[i] = [];
      rawDeviations[i] = [];
      pearsonResiduals[i] = [];
      standardizedResiduals[i] = [];
      chi2Contributions[i] = [];

      const Ri = rowTotals[i];

      for (let j = 0; j < c; j++) {
        const Cj = colTotals[j];
        const Oij = Number(matrix[i][j]) || 0;

        // Joint & Conditionals
        jointFrequencies[i][j] = Oij / N;
        rowConditionals[i][j] = Ri > 0 ? Oij / Ri : 0;

        // Expected count
        const Eij = (Ri * Cj) / N;
        expected[i][j] = Eij;

        if (Eij < minExpected) minExpected = Eij;
        if (Eij < 5.0) cellsUnder5++;
        if (Eij < 1.0) cellsUnder1++;

        // Deviations and Chi-Square
        const dev = Oij - Eij;
        rawDeviations[i][j] = dev;

        if (Eij > 0) {
          const pRes = dev / Math.sqrt(Eij);
          pearsonResiduals[i][j] = pRes;

          const denomStd = Math.sqrt(Eij * (1.0 - Ri / N) * (1.0 - Cj / N));
          standardizedResiduals[i][j] = denomStd > 1e-12 ? dev / denomStd : pRes;

          const cellChi2 = (dev * dev) / Eij;
          chi2Contributions[i][j] = cellChi2;
          chiSquare += cellChi2;
        } else {
          pearsonResiduals[i][j] = 0;
          standardizedResiduals[i][j] = 0;
          chi2Contributions[i][j] = 0;
        }
      }
    }

    // Column conditionals P(X = i | Y = j)
    for (let i = 0; i < r; i++) {
      colConditionals[i] = [];
      for (let j = 0; j < c; j++) {
        const Cj = colTotals[j];
        colConditionals[i][j] = Cj > 0 ? (Number(matrix[i][j]) || 0) / Cj : 0;
      }
    }

    // Degrees of Freedom: df = (r - 1) * (c - 1)
    const df = Math.max(1, (r - 1) * (c - 1));

    // Exact p-value and critical value
    const pValue = chiSquarePValue(chiSquare, df);
    const criticalValue = chiSquareCriticalValue(df, alpha);
    const isSignificant = chiSquare >= criticalValue; // Rejection of H0
    const isIndependent = !isSignificant;

    // Cochran's Validity Rules:
    // 1. None of the expected counts < 1.0
    // 2. At most 20% of expected counts < 5.0
    const totalCells = r * c;
    const pctUnder5 = (cellsUnder5 / totalCells) * 100;
    const cochranValid = cellsUnder1 === 0 && pctUnder5 <= 20.0;
    let cochranMessage = "Cochran conditions fully satisfied for Pearson asymptotic approximation.";
    if (!cochranValid) {
      if (cellsUnder1 > 0) {
        cochranMessage = `Warning: ${cellsUnder1} cell(s) have expected frequency < 1.0. Asymptotic Chi-square approximation may be inaccurate; consider exact Fisher test.`;
      } else {
        cochranMessage = `Warning: ${pctUnder5.toFixed(1)}% of cells have expected frequency < 5.0 (limit is 20%). Test power may be compromised.`;
      }
    }

    // Association and Effect Size Metrics
    const minDim = Math.min(r - 1, c - 1);
    const cramersV = minDim > 0 ? Math.sqrt(chiSquare / (N * minDim)) : 0;

    let cramersVQualitative = "Negligible";
    if (cramersV >= 0.50) cramersVQualitative = "Very Strong";
    else if (cramersV >= 0.35) cramersVQualitative = "Strong";
    else if (cramersV >= 0.20) cramersVQualitative = "Moderate";
    else if (cramersV >= 0.10) cramersVQualitative = "Weak";

    // Pearson Contingency Coefficient C = sqrt(chi2 / (chi2 + N))
    const contingencyCoeff = Math.sqrt(chiSquare / (chiSquare + N));
    const kMin = Math.min(r, c);
    const maxC = kMin > 1 ? Math.sqrt((kMin - 1) / kMin) : 1;
    const contingencyCoeffNorm = maxC > 0 ? contingencyCoeff / maxC : 0;

    // Tschuprow's T = sqrt(chi2 / (N * sqrt((r-1)(c-1))))
    const tschuprowT = Math.sqrt(chiSquare / (N * Math.sqrt((r - 1) * (c - 1))));

    // 2x2 Specialized Metrics: Phi, Odds Ratio, Relative Risk
    let phi = null;
    let oddsRatio = null;
    let relativeRisk = null;

    if (r === 2 && c === 2) {
      phi = Math.sqrt(chiSquare / N);

      const a = Number(matrix[0][0]) || 0;
      const b = Number(matrix[0][1]) || 0;
      const cVal = Number(matrix[1][0]) || 0;
      const d = Number(matrix[1][1]) || 0;

      // Odds Ratio: (a * d) / (b * c)
      if (b * cVal > 0) {
        const or = (a * d) / (b * cVal);
        const seLnOr = Math.sqrt(1 / (a || 0.5) + 1 / (b || 0.5) + 1 / (cVal || 0.5) + 1 / (d || 0.5));
        const lnOr = Math.log(or);
        const zCrit = 1.959963984540;
        oddsRatio = {
          or,
          ciLower: Math.exp(lnOr - zCrit * seLnOr),
          ciUpper: Math.exp(lnOr + zCrit * seLnOr)
        };
      }

      // Relative Risk (Risk of Event Col 1 given Row 0 vs Row 1)
      const p1 = (a + b) > 0 ? a / (a + b) : 0;
      const p2 = (cVal + d) > 0 ? cVal / (cVal + d) : 0;
      if (p2 > 0) {
        const rr = p1 / p2;
        const seLnRr = Math.sqrt((1 - p1) / (a || 0.5) + (1 - p2) / (cVal || 0.5));
        const lnRr = Math.log(rr);
        const zCrit = 1.959963984540;
        relativeRisk = {
          rr,
          ciLower: Math.exp(lnRr - zCrit * seLnRr),
          ciUpper: Math.exp(lnRr + zCrit * seLnRr)
        };
      }
    }

    return {
      dimensions: { r, c },
      observed: matrix,
      rowLabels: rows,
      colLabels: cols,
      rowTotals,
      colTotals,
      total: N,
      jointFrequencies,
      rowMarginals,
      colMarginals,
      rowConditionals,
      colConditionals,
      expected,
      rawDeviations,
      pearsonResiduals,
      standardizedResiduals,
      chi2Contributions,
      chiSquare,
      df,
      alpha,
      pValue,
      criticalValue,
      isSignificant,
      isIndependent,
      verdict: isSignificant
        ? `Reject H0: Statistically Dependent (chi2 = ${chiSquare.toFixed(3)} >= ${criticalValue.toFixed(3)}, p = ${pValue < 1e-4 ? pValue.toExponential(2) : pValue.toFixed(4)})`
        : `Fail to Reject H0: Consistent with Independence (chi2 = ${chiSquare.toFixed(3)} < ${criticalValue.toFixed(3)}, p = ${pValue.toFixed(4)})`,
      cochran: {
        valid: cochranValid,
        minExpected,
        cellsUnder5,
        cellsUnder1,
        pctUnder5,
        message: cochranMessage
      },
      effectSize: {
        cramersV,
        cramersVQualitative,
        contingencyCoeff,
        contingencyCoeffNorm,
        tschuprowT,
        phi,
        oddsRatio,
        relativeRisk
      }
    };
  }

  // =========================================================================
  // SYNTHETIC BIVARIATE DATASET GENERATOR
  // =========================================================================

  /**
   * Generates a synthetic contingency table with controlled sample size N,
   * grid dimensions r x c, and association parameter delta in [0, 1].
   * delta = 0 yields perfect independent multinomial sampling.
   * delta > 0 introduces diagonal coupling / categorical correlation.
   */
  function generateSyntheticDataset(r = 3, c = 3, N = 1000, delta = 0.4, rowLabels = [], colLabels = []) {
    const rows = rowLabels.length === r ? [...rowLabels] : Array.from({ length: r }, (_, i) => `Cat X${i + 1}`);
    const cols = colLabels.length === c ? [...colLabels] : Array.from({ length: c }, (_, j) => `Cat Y${j + 1}`);

    // Generate arbitrary non-uniform baseline marginals
    const pX = [];
    let sumX = 0;
    for (let i = 0; i < r; i++) {
      const w = 1.0 + (i + 1) * 0.4;
      pX.push(w);
      sumX += w;
    }
    for (let i = 0; i < r; i++) pX[i] /= sumX;

    const pY = [];
    let sumY = 0;
    for (let j = 0; j < c; j++) {
      const w = 1.0 + (c - j) * 0.35;
      pY.push(w);
      sumY += w;
    }
    for (let j = 0; j < c; j++) pY[j] /= sumY;

    // Joint probability matrix: mix between independent product pX[i]*pY[j]
    // and correlated diagonal association
    const jointP = [];
    let totalProb = 0;

    for (let i = 0; i < r; i++) {
      jointP[i] = [];
      for (let j = 0; j < c; j++) {
        const indep = pX[i] * pY[j];
        // Diagonal coupling factor: highest when i/r ~ j/c
        const normDist = Math.abs(i / (r - 1 || 1) - j / (c - 1 || 1));
        const correlated = Math.exp(-3.0 * normDist * normDist);
        const pCell = (1.0 - delta) * indep + delta * (correlated * Math.min(pX[i], pY[j]));
        jointP[i][j] = pCell;
        totalProb += pCell;
      }
    }

    // Normalize joint probabilities
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        jointP[i][j] /= totalProb;
      }
    }

    // Sample N discrete observations via cumulative multinomial simulation
    const flatProb = [];
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        flatProb.push({ i, j, p: jointP[i][j] });
      }
    }

    const counts = Array.from({ length: r }, () => new Array(c).fill(0));
    for (let k = 0; k < N; k++) {
      const u = Math.random();
      let cum = 0;
      for (let idx = 0; idx < flatProb.length; idx++) {
        cum += flatProb[idx].p;
        if (u <= cum || idx === flatProb.length - 1) {
          counts[flatProb[idx].i][flatProb[idx].j]++;
          break;
        }
      }
    }

    return {
      matrix: counts,
      rowLabels: rows,
      colLabels: cols,
      trueDelta: delta,
      targetN: N
    };
  }

  /**
   * Parse CSV / TSV text containing paired observations into a contingency table
   * Supports two formats:
   * 1. Raw pairs: "X, Y" per row
   * 2. Matrix table format: first row = column headers, first col = row header
   */
  function parseDataInput(rawText) {
    if (!rawText || !rawText.trim()) throw new Error("Input data is empty.");
    const lines = rawText.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) throw new Error("At least 2 lines required.");

    // Detect delimiter
    const sampleLine = lines[0];
    const delimiter = sampleLine.includes('\t') ? '\t' : (sampleLine.includes(';') ? ';' : ',');

    // Check if it's already an r x c matrix table
    const headerCols = lines[0].split(delimiter).map(s => s.trim().replace(/^["']|["']$/g, ''));
    let isMatrix = false;

    if (headerCols.length >= 3 && lines.length >= 3) {
      // Check if subsequent lines have numeric columns
      const row2 = lines[1].split(delimiter).map(s => s.trim());
      if (row2.length === headerCols.length) {
        const numericCount = row2.slice(1).filter(v => !isNaN(parseFloat(v))).length;
        if (numericCount === headerCols.length - 1) {
          isMatrix = true;
        }
      }
    }

    if (isMatrix) {
      const colLabels = headerCols.slice(1);
      const rowLabels = [];
      const matrix = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(s => s.trim().replace(/^["']|["']$/g, ''));
        rowLabels.push(parts[0]);
        matrix.push(parts.slice(1).map(v => Math.max(0, parseInt(v, 10) || 0)));
      }
      return { matrix, rowLabels, colLabels };
    }

    // Otherwise parse as raw paired observations: X, Y
    const xFreq = {};
    const yFreq = {};
    const pairFreq = {};

    for (let i = 0; i < lines.length; i++) {
      // Skip header if line 0 contains header names like "X, Y" or "Var1, Var2"
      if (i === 0 && (lines[0].toLowerCase().includes('var') || lines[0].toLowerCase().includes('x,y'))) {
        continue;
      }
      const parts = lines[i].split(delimiter).map(s => s.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        const x = parts[0];
        const y = parts[1];
        xFreq[x] = (xFreq[x] || 0) + 1;
        yFreq[y] = (yFreq[y] || 0) + 1;
        const key = `${x}:::${y}`;
        pairFreq[key] = (pairFreq[key] || 0) + 1;
      }
    }

    const rowLabels = Object.keys(xFreq);
    const colLabels = Object.keys(yFreq);
    if (rowLabels.length < 2 || colLabels.length < 2) {
      throw new Error("Parsed data must contain at least 2 distinct categories for both X and Y.");
    }

    const matrix = [];
    for (let i = 0; i < rowLabels.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < colLabels.length; j++) {
        const key = `${rowLabels[i]}:::${colLabels[j]}`;
        matrix[i][j] = pairFreq[key] || 0;
      }
    }

    return { matrix, rowLabels, colLabels };
  }

  // Export API
  return {
    PRELOADED_DATASETS,
    analyzeContingencyTable,
    generateSyntheticDataset,
    parseDataInput,
    chiSquarePdf,
    chiSquarePValue,
    chiSquareCriticalValue,
    logGamma
  };

});
