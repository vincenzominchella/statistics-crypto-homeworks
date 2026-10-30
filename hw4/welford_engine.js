/**
 * ============================================================================
 * WelfordEngine - Welford's Recurrence & Sampling Distributions Engine
 * Pure ES6 Mathematical & Stochastic Architecture
 * ============================================================================
 * 
 * Features:
 *  1. Exact 3-line Welford Recurrence Algorithm for Running Mean & Variance
 *  2. Numerical Stability & Catastrophic Cancellation Stress-Testing
 *  3. Parametric Probability Distributions over [0, 10] (Binomial, Uniform, CVSS, Beta-Binomial)
 *  4. Multi-Agent Hacker Penetration Simulation (m hackers x n systems)
 *  5. Sampling Distributions of Mean (x̄) and Sample Variance (s²)
 *  6. Asymptotic Variability Scaling & Multi-Horizon Decay Laws (O(1/n))
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WelfordEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // =========================================================================
  // 1. WELFORD'S RECURRENCE ACCUMULATOR & 3-LINE CORE
  // =========================================================================

  /**
   * Core 3-line Welford Step as requested in Exercise 1:
   * Given previous mean, M2 (sum of squared deviations), step count k, and new observation x:
   * Returns updated { mean, M2 }.
   */
  function welfordCoreStep(mean, M2, k, x) {
    const delta = x - mean;
    mean += delta / k;
    M2 += delta * (x - mean);
    return { mean, M2 };
  }

  /**
   * Stateful Welford Accumulator maintaining running count, mean, and M2.
   * Memory complexity: O(1). Time complexity per update: O(1).
   */
  class WelfordAccumulator {
    constructor() {
      this.reset();
    }

    reset() {
      this.count = 0;
      this.mean = 0.0;
      this.M2 = 0.0; // Sum of squared deviations: SS_k = \sum (x_i - mean_k)^2
    }

    /**
     * Ingests a new data point x using Welford's 3-line algorithm
     */
    update(x) {
      this.count++;
      const delta = x - this.mean;
      this.mean += delta / this.count;
      this.M2 += delta * (x - this.mean);
    }

    get sumOfSquares() {
      return this.M2;
    }

    // Sample variance with Bessel's correction (unbiased estimator)
    get sampleVariance() {
      return this.count > 1 ? this.M2 / (this.count - 1) : 0.0;
    }

    // Population variance (divided by n)
    get populationVariance() {
      return this.count > 0 ? this.M2 / this.count : 0.0;
    }

    get sampleStd() {
      return Math.sqrt(this.sampleVariance);
    }

    get populationStd() {
      return Math.sqrt(this.populationVariance);
    }

    get standardError() {
      return this.count > 0 ? this.sampleStd / Math.sqrt(this.count) : 0.0;
    }
  }

  // =========================================================================
  // 2. NUMERICAL STABILITY & CATASTROPHIC CANCELLATION BENCHMARK
  // =========================================================================

  /**
   * Computes sample variance using the textbook "naive" formula:
   * Var = ( \sum x_i^2 - (\sum x_i)^2 / N ) / (N - 1)
   * This formula is susceptible to catastrophic loss of significance.
   */
  function naiveSampleVariance(data) {
    const N = data.length;
    if (N < 2) return 0;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const v = data[i];
      sum += v;
      sumSq += v * v;
    }
    const numerator = sumSq - (sum * sum) / N;
    return numerator / (N - 1);
  }

  /**
   * Compares Welford's algorithm against the Naive formula when values
   * are offset by a huge constant C (e.g. 10^9). Demonstrates how naive
   * variance collapses to 0 or negative numbers due to floating point cancellation.
   */
  function runCatastrophicCancellationTest(offset = 1e9, sampleSize = 100) {
    const baseValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const unshiftedData = [];
    const shiftedData = [];
    const welford = new WelfordAccumulator();

    for (let i = 0; i < sampleSize; i++) {
      const base = baseValues[i % baseValues.length];
      unshiftedData.push(base);
      const val = base + offset;
      shiftedData.push(val);
      welford.update(val);
    }

    // Exact variance of unshifted data (ground truth)
    let sum = 0;
    for (let i = 0; i < sampleSize; i++) sum += unshiftedData[i];
    const mean = sum / sampleSize;
    let sumSqDiff = 0;
    for (let i = 0; i < sampleSize; i++) {
      const d = unshiftedData[i] - mean;
      sumSqDiff += d * d;
    }
    const trueVar = sumSqDiff / (sampleSize - 1);

    const naiveVar = naiveSampleVariance(shiftedData);
    const welfordVar = welford.sampleVariance;

    return {
      offset,
      sampleSize,
      trueVariance: trueVar,
      naiveVariance: naiveVar,
      welfordVariance: welfordVar,
      naiveError: Math.abs(naiveVar - trueVar),
      welfordError: Math.abs(welfordVar - trueVar),
      naiveFailed: isNaN(naiveVar) || naiveVar < 0 || Math.abs(naiveVar - trueVar) > 1e-4
    };
  }

  // =========================================================================
  // 3. PROBABILITY DISTRIBUTIONS ON [0, 10] FOR HACKER SCORES
  // =========================================================================

  /**
   * Predefined discrete probability distributions on {0, 1, 2, ..., 10}.
   * Each attempt receives an integer or fractional breach score in [0, 10].
   */
  const DISTRIBUTIONS = {
    // 1. Binomial Distribution Bin(10, p)
    binomial: {
      id: 'binomial',
      name: 'Binomial Score Distribution Bin(10, p)',
      description: 'Sum of 10 independent sub-vulnerability exploits with individual breach probability p.',
      params: { p: 0.40 },
      getMoments(params = { p: 0.40 }) {
        const p = Math.max(0.01, Math.min(0.99, params.p ?? 0.40));
        const n = 10;
        const mu = n * p;
        const variance = n * p * (1 - p);
        const std = Math.sqrt(variance);
        // Central moments for variability of variance
        const mu3 = n * p * (1 - p) * (1 - 2 * p);
        const mu4 = variance * (1 + 3 * (n - 2) * p * (1 - p));
        const kurtosis = mu4 / (variance * variance);
        return { mu, variance, std, mu3, mu4, kurtosis, p, n };
      },
      sample(params = { p: 0.40 }) {
        const p = params.p ?? 0.40;
        let successes = 0;
        for (let i = 0; i < 10; i++) {
          if (Math.random() < p) successes++;
        }
        return successes;
      },
      getProbabilities(params = { p: 0.40 }) {
        const p = params.p ?? 0.40;
        const probs = new Float64Array(11);
        function comb(n, k) {
          if (k < 0 || k > n) return 0;
          let c = 1;
          for (let i = 1; i <= k; i++) c = (c * (n - i + 1)) / i;
          return c;
        }
        for (let k = 0; k <= 10; k++) {
          probs[k] = comb(10, k) * Math.pow(p, k) * Math.pow(1 - p, 10 - k);
        }
        return probs;
      }
    },

    // 2. Discrete Uniform Distribution on {0, 1, ..., 10}
    uniform: {
      id: 'uniform',
      name: 'Discrete Uniform Distribution U{0, 10}',
      description: 'Equiprobable score across all 11 severity tiers (0 to 10), representing uncalibrated random penetration testing.',
      params: {},
      getMoments() {
        const a = 0;
        const b = 10;
        const N = b - a + 1; // 11
        const mu = (a + b) / 2; // 5.0
        const variance = (N * N - 1) / 12; // (121 - 1) / 12 = 120 / 12 = 10.0
        const std = Math.sqrt(variance);
        // Discrete uniform kurtosis: 1.8 - 1.2/(N^2 - 1) * ...
        // Compute 4th central moment directly:
        let m4 = 0;
        for (let x = 0; x <= 10; x++) {
          m4 += Math.pow(x - mu, 4);
        }
        const mu4 = m4 / N; // (sum of (x-5)^4)/11 = (2*(5^4 + 4^4 + 3^4 + 2^4 + 1^4))/11 = 2*(625+256+81+16+1)/11 = 1958/11 = 178
        const kurtosis = mu4 / (variance * variance); // 178 / 100 = 1.78
        return { mu, variance, std, mu3: 0, mu4, kurtosis };
      },
      sample() {
        return Math.floor(Math.random() * 11);
      },
      getProbabilities() {
        const probs = new Float64Array(11);
        probs.fill(1 / 11);
        return probs;
      }
    },

    // 3. Realistic CVSS Multi-Modal Threat Distribution
    cvss: {
      id: 'cvss',
      name: 'CVSS Threat Profile (Multi-Modal Cyber Risk)',
      description: 'Emulates real-world enterprise CVE telemetry: heavy mass on 0 (blocked/resisted), distinct peaks at 5.0 (medium risk) and 8.5 (critical RCE).',
      params: {},
      // Custom probability mass function over {0, 1, 2, ..., 10}
      weights: [0.30, 0.05, 0.05, 0.08, 0.10, 0.14, 0.08, 0.07, 0.06, 0.05, 0.02],
      getMoments() {
        const w = this.weights;
        let mu = 0;
        for (let x = 0; x <= 10; x++) mu += x * w[x];
        let variance = 0;
        let mu3 = 0;
        let mu4 = 0;
        for (let x = 0; x <= 10; x++) {
          const diff = x - mu;
          const d2 = diff * diff;
          variance += d2 * w[x];
          mu3 += d2 * diff * w[x];
          mu4 += d2 * d2 * w[x];
        }
        const std = Math.sqrt(variance);
        const kurtosis = mu4 / (variance * variance);
        return { mu, variance, std, mu3, mu4, kurtosis };
      },
      sample() {
        const r = Math.random();
        let cumulative = 0;
        for (let x = 0; x <= 10; x++) {
          cumulative += this.weights[x];
          if (r <= cumulative) return x;
        }
        return 10;
      },
      getProbabilities() {
        return new Float64Array(this.weights);
      }
    },

    // 4. Critical Severity Skewed Distribution (APT / Exploit Kit)
    apt: {
      id: 'apt',
      name: 'APT Critical Exploit Profile (Right-Skewed High-Risk)',
      description: 'Models advanced adversaries with 0-day exploits consistently penetrating high layers (mass concentrated on 7-10).',
      params: {},
      weights: [0.03, 0.02, 0.03, 0.04, 0.06, 0.08, 0.12, 0.18, 0.22, 0.16, 0.06],
      getMoments() {
        const w = this.weights;
        let mu = 0;
        for (let x = 0; x <= 10; x++) mu += x * w[x];
        let variance = 0;
        let mu3 = 0;
        let mu4 = 0;
        for (let x = 0; x <= 10; x++) {
          const diff = x - mu;
          const d2 = diff * diff;
          variance += d2 * w[x];
          mu3 += d2 * diff * w[x];
          mu4 += d2 * d2 * w[x];
        }
        const std = Math.sqrt(variance);
        const kurtosis = mu4 / (variance * variance);
        return { mu, variance, std, mu3, mu4, kurtosis };
      },
      sample() {
        const r = Math.random();
        let cumulative = 0;
        for (let x = 0; x <= 10; x++) {
          cumulative += this.weights[x];
          if (r <= cumulative) return x;
        }
        return 10;
      },
      getProbabilities() {
        return new Float64Array(this.weights);
      }
    }
  };

  // =========================================================================
  // 4. STATISTICAL SUMMARIES & HISTOGRAM ENGINE
  // =========================================================================

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
    const kurtosis = std > 0 ? (m4Sum / N) / Math.pow(std, 4) - 3 : 0;

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

  function createHistogramBins(data, numBins = 24, explicitMin = null, explicitMax = null) {
    const N = data.length;
    if (N === 0) return { bins: [], counts: [], binWidth: 0, min: 0, max: 0 };

    let min = explicitMin !== null ? explicitMin : Infinity;
    let max = explicitMax !== null ? explicitMax : -Infinity;

    if (explicitMin === null || explicitMax === null) {
      for (let i = 0; i < N; i++) {
        if (data[i] < min) min = data[i];
        if (data[i] > max) max = data[i];
      }
    }

    if (min === max) {
      min -= 0.5;
      max += 0.5;
    }

    const padding = (max - min) * 0.05;
    min -= padding;
    max += padding;

    const binWidth = (max - min) / numBins;
    const counts = new Array(numBins).fill(0);
    const binCenters = new Array(numBins);

    for (let b = 0; b < numBins; b++) {
      binCenters[b] = min + (b + 0.5) * binWidth;
    }

    for (let i = 0; i < N; i++) {
      const val = data[i];
      let binIdx = Math.floor((val - min) / binWidth);
      if (binIdx < 0) binIdx = 0;
      if (binIdx >= numBins) binIdx = numBins - 1;
      counts[binIdx]++;
    }

    const densities = counts.map(c => c / (N * binWidth));

    return {
      binCenters,
      counts,
      densities,
      binWidth,
      min,
      max,
      totalCount: N
    };
  }

  function normalPdf(x, mean, std) {
    if (std <= 0) return 0;
    const z = (x - mean) / std;
    return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  }

  // =========================================================================
  // 5. EXERCISE 2: MULTI-AGENT HACKER PENETRATION SIMULATOR
  // =========================================================================

  /**
   * Simulates m independent hackers penetrating n systems.
   * For each hacker:
   *  - Generates scores X_1, ..., X_n from chosen distribution
   *  - Updates sample mean and sample variance online using Welford's recurrence
   * Across the ensemble:
   *  - Computes grand average of sampling means M̄_n
   *  - Computes grand average of sampling variances V̄_n
   *  - Evaluates empirical variability vs theoretical O(1/n) laws
   */
  function simulateHackerEnsemble(config) {
    const startTime = performance.now();
    const n = Math.max(2, Math.floor(config.n || 100)); // systems
    const m = Math.max(2, Math.floor(config.m || 200)); // hackers
    const distType = config.distType || 'binomial';
    const dist = DISTRIBUTIONS[distType] || DISTRIBUTIONS.binomial;
    const distParams = config.distParams || dist.params;
    const maxRenderPaths = Math.min(m, config.maxRenderPaths || 30);

    const theoretical = dist.getMoments(distParams);

    // Arrays to store final endpoints at system n across all m hackers
    const finalSampleMeans = new Float64Array(m);
    const finalSampleVars = new Float64Array(m);
    const finalRawScores = new Float64Array(m); // Score at final system n

    // Trajectories for visual rendering
    const sampleTrajectories = {
      scores: [],   // X_k
      means: [],    // x̄_k
      vars: []      // s_k^2
    };

    for (let j = 0; j < maxRenderPaths; j++) {
      sampleTrajectories.scores.push(new Float32Array(n + 1));
      sampleTrajectories.means.push(new Float32Array(n + 1));
      sampleTrajectories.vars.push(new Float32Array(n + 1));
    }

    // Step-by-step moment tracking across all m hackers (envelope)
    const envelopeStep = Math.max(1, Math.floor(n / 200));
    const envelopeSteps = [];
    const envelope = {
      grandMean: [],       // M̄_k
      grandVar: [],        // V̄_k
      varOfMeans: [],      // Var(x̄_k) across hackers
      varOfVars: []        // Var(s_k^2) across hackers
    };

    // State accumulators for all m hackers (Welford accumulators in parallel Float64Arrays)
    const runningCounts = new Int32Array(m);
    const runningMeans = new Float64Array(m);
    const runningM2 = new Float64Array(m);

    // Step-by-step penetration progression through systems k = 1 to n
    for (let step = 1; step <= n; step++) {
      let sumMeansAtK = 0;
      let sumVarsAtK = 0;

      for (let j = 0; j < m; j++) {
        // Draw score X_step from distribution
        const score = dist.sample(distParams);

        // --- WELFORD'S 3-LINE CORE UPDATE ---
        runningCounts[j]++;
        const delta = score - runningMeans[j];
        runningMeans[j] += delta / runningCounts[j];
        runningM2[j] += delta * (score - runningMeans[j]);
        // ------------------------------------

        const currentMean = runningMeans[j];
        const currentVar = runningCounts[j] > 1 ? runningM2[j] / (runningCounts[j] - 1) : 0;

        sumMeansAtK += currentMean;
        sumVarsAtK += currentVar;

        // Store visual trajectories for rendering subset
        if (j < maxRenderPaths) {
          sampleTrajectories.scores[j][step] = score;
          sampleTrajectories.means[j][step] = currentMean;
          sampleTrajectories.vars[j][step] = currentVar;
        }

        // Capture final step endpoints
        if (step === n) {
          finalSampleMeans[j] = currentMean;
          finalSampleVars[j] = currentVar;
          finalRawScores[j] = score;
        }
      }

      // Record ensemble envelopes
      if (step % envelopeStep === 0 || step === n) {
        envelopeSteps.push(step);
        const grandM = sumMeansAtK / m;
        const grandV = sumVarsAtK / m;

        // Compute variance of means and variance of sample variances at step k
        let varM = 0;
        let varV = 0;
        for (let j = 0; j < m; j++) {
          const mDiff = runningMeans[j] - grandM;
          varM += mDiff * mDiff;
          const currentVar = runningCounts[j] > 1 ? runningM2[j] / (runningCounts[j] - 1) : 0;
          const vDiff = currentVar - grandV;
          varV += vDiff * vDiff;
        }

        envelope.grandMean.push(grandM);
        envelope.grandVar.push(grandV);
        envelope.varOfMeans.push(varM / (m - 1));
        envelope.varOfVars.push(varV / (m - 1));
      }
    }

    // Comprehensive statistical summary of final sampling distributions
    const statsMeans = computeSummaryStats(finalSampleMeans);
    const statsVars = computeSummaryStats(finalSampleVars);

    // Grand averages across m hackers
    const grandAverageMean = statsMeans.mean;
    const grandAverageVariance = statsVars.mean;

    // Empirical variances of the estimators
    const empiricalVarOfMeans = statsMeans.variance;
    const empiricalVarOfVars = statsVars.variance;

    // Theoretical benchmarks:
    // Var(x̄_n) = sigma^2 / n
    const theoreticalVarOfMeans = theoretical.variance / n;
    // Var(s_n^2) = (1/n) * ( mu_4 - ((n-3)/(n-1)) * sigma^4 )
    const theoreticalVarOfVars = n > 1 
      ? (1 / n) * (theoretical.mu4 - ((n - 3) / (n - 1)) * Math.pow(theoretical.variance, 2))
      : 0;

    // Bias evaluations (Estimator Unbiasedness)
    const biasOfMean = grandAverageMean - theoretical.mu;
    const biasOfVariance = grandAverageVariance - theoretical.variance;
    const relativeErrorMean = Math.abs(biasOfMean) / (theoretical.mu || 1);
    const relativeErrorVar = Math.abs(biasOfVariance) / (theoretical.variance || 1);

    // Histograms of sampling distributions
    const histMeans = createHistogramBins(finalSampleMeans, 24);
    const histVars = createHistogramBins(finalSampleVars, 24);

    const elapsedMs = performance.now() - startTime;

    return {
      config: { n, m, distType, distParams, maxRenderPaths },
      theoretical: {
        ...theoretical,
        varOfMeans: theoreticalVarOfMeans,
        stdOfMeans: Math.sqrt(theoreticalVarOfMeans),
        varOfVars: theoreticalVarOfVars,
        stdOfVars: Math.sqrt(Math.max(0, theoreticalVarOfVars))
      },
      results: {
        grandAverageMean,
        grandAverageVariance,
        empiricalVarOfMeans,
        empiricalStdOfMeans: Math.sqrt(empiricalVarOfMeans),
        empiricalVarOfVars,
        empiricalStdOfVars: Math.sqrt(empiricalVarOfVars),
        biasOfMean,
        biasOfVariance,
        relativeErrorMean,
        relativeErrorVar,
        isMeanUnbiased: Math.abs(biasOfMean) < 0.15,
        isVarUnbiased: Math.abs(biasOfVariance) < 0.25
      },
      stats: {
        means: statsMeans,
        vars: statsVars
      },
      histograms: {
        means: histMeans,
        vars: histVars
      },
      trajectories: sampleTrajectories,
      envelope: {
        steps: envelopeSteps,
        ...envelope
      },
      finalEndpoints: {
        means: finalSampleMeans,
        vars: finalSampleVars,
        rawScores: finalRawScores
      },
      elapsedMs
    };
  }

  // =========================================================================
  // 6. MULTI-HORIZON VARIABILITY SWEEP: HOW INCREASING n AFFECTS VARIABILITY
  // =========================================================================

  /**
   * Sweeps across a range of system counts n = [5, 10, 25, 50, 100, 200, 500, 1000]
   * to directly demonstrate how increasing n drives the variance of both the
   * sample mean and sample variance to zero as O(1/n).
   */
  function evaluateMultiHorizonSweep(m = 150, distType = 'binomial', distParams = { p: 0.40 }) {
    const horizons = [5, 10, 20, 50, 100, 200, 500, 1000];
    const dist = DISTRIBUTIONS[distType] || DISTRIBUTIONS.binomial;
    const th = dist.getMoments(distParams);

    const sweepResults = [];

    for (let n of horizons) {
      // Simulate m hackers for horizon n
      const sampleMeans = new Float64Array(m);
      const sampleVars = new Float64Array(m);

      for (let j = 0; j < m; j++) {
        let count = 0;
        let mean = 0;
        let M2 = 0;
        for (let step = 1; step <= n; step++) {
          const x = dist.sample(distParams);
          count++;
          const d = x - mean;
          mean += d / count;
          M2 += d * (x - mean);
        }
        sampleMeans[j] = mean;
        sampleVars[j] = count > 1 ? M2 / (count - 1) : 0;
      }

      const statsM = computeSummaryStats(sampleMeans);
      const statsV = computeSummaryStats(sampleVars);

      const thVarM = th.variance / n;
      const thVarV = n > 1 
        ? (1 / n) * (th.mu4 - ((n - 3) / (n - 1)) * Math.pow(th.variance, 2))
        : 0;

      sweepResults.push({
        n,
        empiricalVarM: statsM.variance,
        theoreticalVarM: thVarM,
        empiricalStdM: Math.sqrt(statsM.variance),
        theoreticalStdM: Math.sqrt(thVarM),

        empiricalVarV: statsV.variance,
        theoreticalVarV: thVarV,
        empiricalStdV: Math.sqrt(statsV.variance),
        theoreticalStdV: Math.sqrt(Math.max(0, thVarV)),

        grandMean: statsM.mean,
        grandVar: statsV.mean
      });
    }

    return {
      distType,
      theoretical: th,
      m,
      sweep: sweepResults
    };
  }

  // =========================================================================
  // PUBLIC EXPORT API
  // =========================================================================

  return {
    welfordCoreStep,
    WelfordAccumulator,
    naiveSampleVariance,
    runCatastrophicCancellationTest,
    DISTRIBUTIONS,
    computeSummaryStats,
    createHistogramBins,
    normalPdf,
    simulateHackerEnsemble,
    evaluateMultiHorizonSweep
  };
});
