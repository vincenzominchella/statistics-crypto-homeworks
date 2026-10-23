/**
 * Homework 3: Stochastic Penetration Dynamics Engine
 * Bernoulli and Rademacher IID Increments, Trajectory Generators,
 * Total (Sn), Average (Sn/n), and Normalized (Sn/sqrt(n)) Score Analytics,
 * Law of Large Numbers (LLN), and Central Limit Theorem (CLT) Solvers.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StochasticEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. PSEUDORANDOM GENERATOR & MOMENT UTILITIES
  // =========================================================================

  /**
   * Fast uniform random float in [0, 1)
   */
  function randomFloat() {
    return Math.random();
  }

  /**
   * Generates single i.i.d. increment X_i:
   * - 'bernoulli': X_i in {0, 1} with P(X_i = 1) = p
   * - 'rademacher': X_i in {-1, +1} with P(X_i = +1) = 1/2
   */
  function sampleIncrement(modelType, p = 0.5) {
    if (modelType === 'rademacher') {
      return randomFloat() < 0.5 ? 1 : -1;
    }
    // Default Bernoulli
    return randomFloat() < p ? 1 : 0;
  }

  /**
   * Standard Normal PDF phi(z)
   */
  function normalPdf(z, mean = 0, std = 1) {
    const invStd = 1 / std;
    const diff = (z - mean) * invStd;
    return (invStd / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * diff * diff);
  }

  /**
   * Standard Normal CDF Phi(z) approximation (Hart's Algorithm / Error Function)
   */
  function normalCdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014327 * Math.exp(-0.5 * z * z);
    const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z > 0 ? 1 - p : p;
  }

  /**
   * Rational approximation of the inverse Normal CDF (Probit function)
   */
  function normalQuantile(p) {
    if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
    // Beasley-Springer-Moro approximation
    const a = [
      0, 2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637
    ];
    const b = [
      0, -8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833
    ];
    const c = [
      0, 0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
      0.02764388103386354, 0.0038405729373609, 0.0003951804906778,
      0.0000321767881768, 0.0000002888167364, 0.0000003960315187
    ];

    const y = p - 0.5;
    if (Math.abs(y) < 0.42) {
      const r = y * y;
      return y * (((a[4] * r + a[3]) * r + a[2]) * r + a[1]) /
             ((((b[4] * r + b[3]) * r + b[2]) * r + b[1]) * r + 1);
    }
    const r = p < 0.5 ? p : 1 - p;
    const s = Math.log(-Math.log(r));
    let x = c[0];
    for (let i = 1; i < c.length; i++) {
      x += c[i] * Math.pow(s, i);
    }
    return p < 0.5 ? -x : x;
  }

  /**
   * Computes empirical descriptive statistics of an array
   */
  function computeSummaryStats(data) {
    const N = data.length;
    if (N === 0) return { mean: 0, variance: 0, std: 0, min: 0, max: 0, median: 0, skewness: 0, kurtosis: 0 };

    let sum = 0;
    let min = data[0];
    let max = data[0];

    for (let i = 0; i < N; i++) {
      const v = data[i];
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const mean = sum / N;

    let varSum = 0;
    let m3Sum = 0;
    let m4Sum = 0;

    for (let i = 0; i < N; i++) {
      const diff = data[i] - mean;
      const d2 = diff * diff;
      varSum += d2;
      m3Sum += d2 * diff;
      m4Sum += d2 * d2;
    }

    const variance = N > 1 ? varSum / (N - 1) : 0;
    const std = Math.sqrt(variance);
    const skewness = std > 0 ? (m3Sum / N) / Math.pow(std, 3) : 0;
    const kurtosis = std > 0 ? (m4Sum / N) / Math.pow(std, 4) - 3 : 0; // Excess kurtosis

    // Percentiles
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(N / 2)];
    const p10 = sorted[Math.floor(N * 0.10)];
    const p25 = sorted[Math.floor(N * 0.25)];
    const p75 = sorted[Math.floor(N * 0.75)];
    const p90 = sorted[Math.floor(N * 0.90)];

    return {
      mean, variance, std, min, max, median, skewness, kurtosis,
      p10, p25, p75, p90, count: N
    };
  }

  // =========================================================================
  // 2. STOCHASTIC SIMULATION CORE: TRAJECTORIES & ENVELOPES
  // =========================================================================

  /**
   * Simulates m independent sample trajectories over n steps.
   * Optimizes memory by saving full step-by-step paths for a subset of m
   * (for canvas rendering), while tracking summary stats and final distributions across all m.
   *
   * @param {Object} config
   * @param {number} config.n - Number of systems / steps (e.g. 50 to 5000)
   * @param {number} config.m - Number of attackers / trajectories (e.g. 20 to 1000)
   * @param {string} config.modelType - 'bernoulli' or 'rademacher'
   * @param {number} config.p - Probability parameter for Bernoulli (default 0.5)
   * @param {number} config.maxRenderPaths - Max individual trajectories to store (default 40)
   */
  function simulateEnsemble(config) {
    const startTime = performance.now();
    const n = Math.max(5, Math.floor(config.n || 100));
    const m = Math.max(2, Math.floor(config.m || 50));
    const modelType = config.modelType === 'rademacher' ? 'rademacher' : 'bernoulli';
    const p = modelType === 'rademacher' ? 0.5 : (config.p !== undefined ? config.p : 0.5);
    const maxRenderPaths = Math.min(m, config.maxRenderPaths || 35);

    // Theoretical single-step moments
    const theoreticalMu = modelType === 'rademacher' ? 0 : p;
    const theoreticalVar = modelType === 'rademacher' ? 1 : p * (1 - p);
    const theoreticalStd = Math.sqrt(theoreticalVar);

    // Arrays to store final endpoints at step n across all m paths
    const finalSn = new Float64Array(m);
    const finalAverage = new Float64Array(m);
    const finalNormalized = new Float64Array(m);

    // Data structures for visual trajectories (for the first maxRenderPaths)
    const sampleTrajectories = {
      total: [],      // S_k
      average: [],    // S_k / k
      normalized: []  // S_k / sqrt(k)
    };

    for (let j = 0; j < maxRenderPaths; j++) {
      sampleTrajectories.total.push(new Float32Array(n + 1));
      sampleTrajectories.average.push(new Float32Array(n + 1));
      sampleTrajectories.normalized.push(new Float32Array(n + 1));
      // Baseline at step 0
      sampleTrajectories.total[j][0] = 0;
      sampleTrajectories.average[j][0] = theoreticalMu;
      sampleTrajectories.normalized[j][0] = 0;
    }

    // Step-by-step moment tracking across all m paths (mean & variance envelope)
    // We downsample steps if n is very large to avoid excessive memory
    const envelopeStep = Math.max(1, Math.floor(n / 250));
    const envelopeSteps = [];
    const envelope = {
      meanTotal: [],
      varTotal: [],
      stdTotal: [],
      meanAvg: [],
      varAvg: [],
      stdAvg: [],
      meanNorm: [],
      varNorm: [],
      stdNorm: []
    };

    // Current state accumulator for each path: S_current[j]
    const currentSn = new Float64Array(m);

    // Step-by-step generation
    for (let step = 1; step <= n; step++) {
      const invStep = 1 / step;
      const invSqrtStep = 1 / Math.sqrt(step);

      for (let j = 0; j < m; j++) {
        const x_i = sampleIncrement(modelType, p);
        currentSn[j] += x_i;

        // Store visual path coordinates
        if (j < maxRenderPaths) {
          const s = currentSn[j];
          sampleTrajectories.total[j][step] = s;
          sampleTrajectories.average[j][step] = s * invStep;
          sampleTrajectories.normalized[j][step] = s * invSqrtStep;
        }
      }

      // Record envelope statistics at downsampled intervals or final step
      if (step % envelopeStep === 0 || step === n) {
        envelopeSteps.push(step);
        let sumS = 0;
        let sumS2 = 0;
        let sumAvg = 0;
        let sumAvg2 = 0;
        let sumNorm = 0;
        let sumNorm2 = 0;

        for (let j = 0; j < m; j++) {
          const s = currentSn[j];
          const avg = s * invStep;
          const norm = s * invSqrtStep;

          sumS += s;
          sumS2 += s * s;
          sumAvg += avg;
          sumAvg2 += avg * avg;
          sumNorm += norm;
          sumNorm2 += norm * norm;
        }

        const mS = sumS / m;
        const vS = Math.max(0, (sumS2 / m) - (mS * mS));

        const mAvg = sumAvg / m;
        const vAvg = Math.max(0, (sumAvg2 / m) - (mAvg * mAvg));

        const mNorm = sumNorm / m;
        const vNorm = Math.max(0, (sumNorm2 / m) - (mNorm * mNorm));

        envelope.meanTotal.push(mS);
        envelope.varTotal.push(vS);
        envelope.stdTotal.push(Math.sqrt(vS));

        envelope.meanAvg.push(mAvg);
        envelope.varAvg.push(vAvg);
        envelope.stdAvg.push(Math.sqrt(vAvg));

        envelope.meanNorm.push(mNorm);
        envelope.varNorm.push(vNorm);
        envelope.stdNorm.push(Math.sqrt(vNorm));
      }
    }

    // Populate final endpoint arrays for all m trajectories
    const invN = 1 / n;
    const invSqrtN = 1 / Math.sqrt(n);
    for (let j = 0; j < m; j++) {
      finalSn[j] = currentSn[j];
      finalAverage[j] = currentSn[j] * invN;
      finalNormalized[j] = currentSn[j] * invSqrtN;
    }

    // Summary statistics for final distributions
    const statsTotal = computeSummaryStats(finalSn);
    const statsAverage = computeSummaryStats(finalAverage);
    const statsNormalized = computeSummaryStats(finalNormalized);

    const elapsedMs = performance.now() - startTime;

    return {
      config: { n, m, modelType, p, maxRenderPaths },
      theoretical: {
        mu: theoreticalMu,
        variance: theoreticalVar,
        std: theoreticalStd,
        // Theoretical at step n:
        total: {
          mean: n * theoreticalMu,
          variance: n * theoreticalVar,
          std: Math.sqrt(n * theoreticalVar)
        },
        average: {
          mean: theoreticalMu,
          variance: theoreticalVar / n,
          std: Math.sqrt(theoreticalVar / n)
        },
        normalized: {
          mean: Math.sqrt(n) * theoreticalMu,
          variance: theoreticalVar,
          std: theoreticalStd
        }
      },
      stats: {
        total: statsTotal,
        average: statsAverage,
        normalized: statsNormalized
      },
      finalEndpoints: {
        total: finalSn,
        average: finalAverage,
        normalized: finalNormalized
      },
      trajectories: sampleTrajectories,
      envelope: {
        steps: envelopeSteps,
        ...envelope
      },
      elapsedMs
    };
  }

  // =========================================================================
  // 3. LAW OF LARGE NUMBERS & CENTRAL LIMIT THEOREM EVALUATORS
  // =========================================================================

  /**
   * Analyzes Law of Large Numbers (LLN) convergence:
   * Computes P(|S_n/n - mu| < epsilon) and Chebyshev upper bound.
   */
  function evaluateLlnConvergence(simulationResult, epsilon = 0.05) {
    const { finalEndpoints, theoretical, config } = simulationResult;
    const averages = finalEndpoints.average;
    const mu = theoretical.mu;
    const n = config.n;
    const m = config.m;
    const varSingle = theoretical.variance;

    let withinCount = 0;
    for (let i = 0; i < m; i++) {
      if (Math.abs(averages[i] - mu) < epsilon) {
        withinCount++;
      }
    }

    const empiricalProbWithin = withinCount / m;
    const empiricalProbOutside = 1 - empiricalProbWithin;

    // Chebyshev Bound: P(|X_bar - mu| >= eps) <= Var(X) / (n * eps^2)
    const chebyshevBound = Math.min(1.0, varSingle / (n * epsilon * epsilon));

    return {
      epsilon,
      mu,
      n,
      empiricalProbWithin,
      empiricalProbOutside,
      chebyshevBound,
      conformsToChebyshev: empiricalProbOutside <= chebyshevBound
    };
  }

  /**
   * Analyzes Central Limit Theorem (CLT) convergence on S_n / sqrt(n):
   * Generates histogram bins, theoretical Gaussian overlay, QQ-Plot, and KS test.
   */
  function evaluateCltNormality(simulationResult, numBins = 24) {
    const { finalEndpoints, theoretical, config } = simulationResult;
    const data = finalEndpoints.normalized;
    const N = data.length;
    const modelType = config.modelType;

    // For Rademacher: mean is 0, std is 1.
    // For Bernoulli: mean is sqrt(n)*p, std is sqrt(p(1-p)).
    const targetMean = theoretical.normalized.mean;
    const targetStd = theoretical.normalized.std;

    // Sort data for quantiles & empirical CDF
    const sorted = new Float64Array(data).sort();

    // 1. Histogram binning
    const minVal = sorted[0];
    const maxVal = sorted[N - 1];
    // Extend slightly to show tails
    const pad = Math.max(0.5, (maxVal - minVal) * 0.05);
    const rangeMin = minVal - pad;
    const rangeMax = maxVal + pad;
    const binWidth = (rangeMax - rangeMin) / numBins;

    const bins = [];
    for (let b = 0; b < numBins; b++) {
      const x0 = rangeMin + b * binWidth;
      const x1 = x0 + binWidth;
      const mid = 0.5 * (x0 + x1);
      bins.push({
        x0, x1, mid,
        count: 0,
        density: 0,
        theoreticalDensity: normalPdf(mid, targetMean, targetStd)
      });
    }

    for (let i = 0; i < N; i++) {
      const val = sorted[i];
      let bIdx = Math.floor((val - rangeMin) / binWidth);
      if (bIdx < 0) bIdx = 0;
      if (bIdx >= numBins) bIdx = numBins - 1;
      bins[bIdx].count++;
    }

    // Convert counts to probability density: density = count / (N * binWidth)
    for (let b = 0; b < numBins; b++) {
      bins[b].density = bins[b].count / (N * binWidth);
    }

    // 2. QQ-Plot Quantile Pairs (Empirical vs Theoretical Gaussian)
    const qqPoints = [];
    const qqStep = Math.max(1, Math.floor(N / 100)); // Sample ~100 points
    for (let i = 0; i < N; i += qqStep) {
      // Blom's plotting position: p_i = (i + 0.375) / (N + 0.25)
      const p = (i + 0.375) / (N + 0.25);
      const theoreticalQ = targetMean + targetStd * normalQuantile(p);
      const empiricalQ = sorted[i];
      qqPoints.push({
        theoretical: theoreticalQ,
        empirical: empiricalQ,
        p
      });
    }

    // 3. Kolmogorov-Smirnov Normality Statistic (D_n = sup |F_n(x) - Phi(x)|)
    let maxDiff = 0;
    for (let i = 0; i < N; i++) {
      const val = sorted[i];
      const empiricalCdf = (i + 1) / N;
      const standardizedZ = (val - targetMean) / targetStd;
      const theoreticalCdf = normalCdf(standardizedZ);
      const diff = Math.abs(empiricalCdf - theoreticalCdf);
      if (diff > maxDiff) maxDiff = diff;
    }

    // Berry-Esseen Bound for IID sum: sup |F_n - Phi| <= C * rho / (sigma^3 * sqrt(n))
    // For Rademacher: rho = E[|X|^3] = 1, sigma = 1, so bound is C / sqrt(n), C ~ 0.4748
    const berryEsseenC = 0.4748;
    const thirdMomentRho = modelType === 'rademacher' ? 1.0 : (Math.pow(1 - config.p, 3) * config.p + Math.pow(config.p, 3) * (1 - config.p));
    const berryEsseenBound = (berryEsseenC * thirdMomentRho) / (Math.pow(theoretical.std, 3) * Math.sqrt(config.n));

    return {
      bins,
      qqPoints,
      ksStatistic: maxDiff,
      berryEsseenBound,
      targetMean,
      targetStd,
      binWidth,
      rangeMin,
      rangeMax
    };
  }

  // =========================================================================
  // 4. CYBER SECURITY SCENARIO & ATTACKER ENSEMBLE METRICS
  // =========================================================================

  /**
   * Translates the mathematical process into operational cyber security metrics:
   * Systems = n (Defense-in-depth perimeter nodes)
   * Attackers = m (Adversary swarm / botnet agents)
   */
  function evaluateCyberSecurityMetrics(simulationResult, breachThreshold = null) {
    const { finalEndpoints, config, stats } = simulationResult;
    const n = config.n;
    const m = config.m;
    const totals = finalEndpoints.total;
    const averages = finalEndpoints.average;

    // Default threshold is half the systems or 0 for Rademacher
    const threshold = breachThreshold !== null ? breachThreshold : (config.modelType === 'rademacher' ? 0 : Math.floor(n * 0.5));

    let breachedCount = 0;
    let worstCasePenetration = -Infinity;
    let bestCaseDefense = Infinity;

    for (let i = 0; i < m; i++) {
      const score = totals[i];
      if (score >= threshold) breachedCount++;
      if (score > worstCasePenetration) worstCasePenetration = score;
      if (score < bestCaseDefense) bestCaseDefense = score;
    }

    const breachProbability = breachedCount / m;
    const averageBreachRate = stats.average.mean;

    return {
      systemsCount: n,
      attackersCount: m,
      breachThreshold: threshold,
      breachedAttackerCount: breachedCount,
      breachProbability,
      worstCaseScore: worstCasePenetration,
      bestCaseScore: bestCaseDefense,
      averageBreachRate,
      securityStatus: config.modelType === 'rademacher'
        ? (worstCasePenetration > Math.sqrt(n) * 2 ? 'High Breach Outlier Risk' : 'Symmetric Equilibrium')
        : (averageBreachRate > 0.6 ? 'Perimeter Severely Compromised' : averageBreachRate < 0.3 ? 'Hardened Defense' : 'Partial Compromise')
    };
  }

  // =========================================================================
  // PUBLIC EXPORT API
  // =========================================================================

  return {
    sampleIncrement,
    simulateEnsemble,
    computeSummaryStats,
    evaluateLlnConvergence,
    evaluateCltNormality,
    evaluateCyberSecurityMetrics,
    normalPdf,
    normalCdf,
    normalQuantile
  };
}));
