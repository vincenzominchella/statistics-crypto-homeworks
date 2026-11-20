/**
 * ============================================================================
 * Modes of Convergence & Bayesian Statistical Inference Engine
 * Homework 7 • Foundations of Probability Theory & Statistics
 * ============================================================================
 */

(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.ConvergenceBayesEngine = api;
  }
  if (typeof self !== 'undefined') {
    self.ConvergenceBayesEngine = api;
  }
  if (root) {
    root.ConvergenceBayesEngine = api;
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // =========================================================================
  // SPECIAL MATHEMATICAL FUNCTIONS: GAMMA, BETA, NORMAL & INVERSES
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
   * Beta Probability Density Function: f(x; a, b) = x^(a-1) (1-x)^(b-1) / B(a, b)
   */
  function betaPdf(x, a, b) {
    if (x <= 0 || x >= 1) return 0;
    if (a <= 0 || b <= 0) return 0;
    const lBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lBeta);
  }

  /**
   * Continued fraction for Incomplete Beta I_x(a, b)
   */
  function betacf(a, b, x) {
    const maxIt = 120;
    const eps = 1e-15;
    const qab = a + b;
    const qap = a + 1.0;
    const qam = a - 1.0;
    let c = 1.0;
    let d = 1.0 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1.0 / d;
    let h = d;
    for (let m = 1; m <= maxIt; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1.0 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1.0 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1.0 / d;
      h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1.0 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1.0 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1.0 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1.0) < eps) break;
    }
    return h;
  }

  /**
   * Regularized Incomplete Beta Function I_x(a, b) = B(x; a, b) / B(a, b)
   */
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
    const bt = Math.exp(a * Math.log(x) + b * Math.log(1.0 - x) - lBeta);
    if (x < (a + 1.0) / (a + b + 2.0)) {
      return bt * betacf(a, b, x) / a;
    } else {
      return 1.0 - bt * betacf(b, a, 1.0 - x) / b;
    }
  }

  /**
   * Quantile function for Beta distribution: x such that I_x(a, b) = p
   */
  function betaQuantile(p, a, b) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let low = 0, high = 1, x = a / (a + b);
    for (let iter = 0; iter < 45; iter++) {
      const cdf = ibeta(x, a, b);
      const err = cdf - p;
      if (Math.abs(err) < 1e-10) break;
      if (err > 0) high = x;
      else low = x;
      x = 0.5 * (low + high);
    }
    return x;
  }

  /**
   * Normal Probability Density Function
   */
  function normalPdf(x, mu = 0, sigma = 1) {
    if (sigma <= 0) return 0;
    const z = (x - mu) / sigma;
    return (1.0 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  }

  /**
   * Normal Cumulative Distribution Function via error function
   */
  function normalCdf(x, mu = 0, sigma = 1) {
    if (sigma <= 0) return x >= mu ? 1 : 0;
    const z = (x - mu) / (sigma * Math.SQRT2);
    // Erf approximation (Abramowitz & Stegun / Winitzki)
    const sign = z < 0 ? -1 : 1;
    const absZ = Math.abs(z);
    const a = 0.147;
    const term1 = 4.0 / Math.PI + a * absZ * absZ;
    const term2 = 1.0 + a * absZ * absZ;
    const inner = -absZ * absZ * (term1 / term2);
    const erf = sign * Math.sqrt(1.0 - Math.exp(inner));
    return 0.5 * (1.0 + erf);
  }

  // =========================================================================
  // PART 1: MODES OF CONVERGENCE SIMULATION ENGINE
  // =========================================================================

  /**
   * Simulates stochastic trajectories to compare the 4 convergence modes:
   * 1. Almost Sure (a.s.)
   * 2. In Probability (P)
   * 3. Mean-Square (L^2)
   * 4. In Distribution (d)
   */
  function simulateConvergenceScenario(scenarioId, nSteps = 300, numPaths = 30, epsilon = 0.15) {
    const steps = Math.max(10, Math.min(1000, nSteps));
    const paths = Math.max(5, Math.min(100, numPaths));

    const results = {
      scenarioId,
      steps,
      paths,
      epsilon,
      trajectories: [],
      errorProbabilities: [], // P(|X_n - X| > epsilon)
      meanSquareErrors: [],  // E[(X_n - X)^2]
      maxPathDeviations: [], // sup_{k >= n} |X_k - X| for a.s. check
      envelopeUpper: [],
      envelopeLower: []
    };

    // Pre-allocate trajectory storage
    for (let p = 0; p < paths; p++) {
      results.trajectories.push(new Float64Array(steps));
    }

    if (scenarioId === 'standard_lln_clt') {
      // Scenario A: Standard IID Random Walk (LLN & CLT)
      // Increments X_i in {-1, +1} (Rademacher: mu = 0, sigma^2 = 1)
      const mu = 0;
      const sigma = 1;

      for (let p = 0; p < paths; p++) {
        let runningSum = 0;
        const traj = results.trajectories[p];
        for (let k = 1; k <= steps; k++) {
          const inc = Math.random() < 0.5 ? -1 : 1;
          runningSum += inc;
          traj[k - 1] = runningSum / k; // Sample mean S_k / k
        }
      }

      // Compute statistics across steps
      for (let k = 1; k <= steps; k++) {
        let countViolations = 0;
        let sumSquaredErr = 0;

        for (let p = 0; p < paths; p++) {
          const val = results.trajectories[p][k - 1];
          const diff = Math.abs(val - mu);
          if (diff > epsilon) countViolations++;
          sumSquaredErr += diff * diff;
        }

        results.errorProbabilities.push(countViolations / paths);
        results.meanSquareErrors.push(sumSquaredErr / paths);

        // Theoretical envelope bounds: +- sigma / sqrt(k) and +- 2*sigma / sqrt(k)
        results.envelopeUpper.push(mu + 2.0 * sigma / Math.sqrt(k));
        results.envelopeLower.push(mu - 2.0 * sigma / Math.sqrt(k));
      }

    } else if (scenarioId === 'sliding_indicator') {
      // Scenario B: Sliding Indicator (Typing Monkey / Lebesgue Steps)
      // Demonstrates: Convergence in Probability (P) WITHOUT Almost Sure Convergence (a.s.)
      // X_n = 1 on interval [j/2^k, (j+1)/2^k], n = 2^k + j. Target X = 0.
      const omegas = new Float64Array(paths);
      for (let p = 0; p < paths; p++) omegas[p] = Math.random();

      for (let n = 1; n <= steps; n++) {
        // Decompose n into k and j: 2^k <= n < 2^(k+1)
        const k = Math.floor(Math.log2(n));
        const twoK = Math.pow(2, k);
        const j = n - twoK;
        const left = j / twoK;
        const right = (j + 1) / twoK;

        let countViolations = 0;
        let sumSquaredErr = 0;

        for (let p = 0; p < paths; p++) {
          const w = omegas[p];
          const val = (w >= left && w < right) ? 1.0 : 0.0;
          results.trajectories[p][n - 1] = val;
          if (val > epsilon) countViolations++;
          sumSquaredErr += val * val;
        }

        results.errorProbabilities.push(1.0 / twoK); // Theoretical P(X_n != 0) = 2^(-k) -> 0
        results.meanSquareErrors.push(1.0 / twoK);  // E[X_n^2] = 2^(-k) -> 0
        results.envelopeUpper.push(1.0);
        results.envelopeLower.push(0.0);
      }

    } else if (scenarioId === 'escaping_spike') {
      // Scenario C: Escaping Spike / Heavy Tail
      // Demonstrates: Convergence Almost Surely (a.s.) and in Probability (P)
      // WITHOUT Mean-Square (L^2) Convergence!
      // P(X_n = n) = 1/n^2, P(X_n = 0) = 1 - 1/n^2.
      // E[X_n^2] = n^2 * (1/n^2) = 1 (or with spike = n^(3/2), E[X_n^2] = n -> infinity).
      for (let p = 0; p < paths; p++) {
        const traj = results.trajectories[p];
        for (let n = 1; n <= steps; n++) {
          const prob = 1.0 / (n * n);
          const val = Math.random() < prob ? Math.pow(n, 1.2) : 0.0;
          traj[n - 1] = val;
        }
      }

      for (let n = 1; n <= steps; n++) {
        let countViolations = 0;
        let sumSquaredErr = 0;

        for (let p = 0; p < paths; p++) {
          const val = results.trajectories[p][n - 1];
          if (val > epsilon) countViolations++;
          sumSquaredErr += val * val;
        }

        // P(|X_n| > eps) = 1/n^2 -> 0 rapidly
        results.errorProbabilities.push(1.0 / (n * n));
        // Theoretical E[X_n^2] = (n^1.2)^2 * (1/n^2) = n^0.4 -> DIVERGES to infinity!
        results.meanSquareErrors.push(Math.pow(n, 0.4));
        results.envelopeUpper.push(1.0 / Math.sqrt(n));
        results.envelopeLower.push(0.0);
      }

    } else if (scenarioId === 'sign_flip') {
      // Scenario D: Sign Flip (Symmetric Variable Inversion)
      // Demonstrates: Convergence in Distribution (d) WITHOUT Convergence in Probability (P)
      // Let X ~ Rademacher (+-1). Let X_n = -X for all n.
      // Law of X_n is identical to X (F_X_n = F_X), but |X_n - X| = 2|X| = 2 constantly!
      for (let p = 0; p < paths; p++) {
        const targetX = Math.random() < 0.5 ? -1 : 1;
        const traj = results.trajectories[p];
        for (let n = 1; n <= steps; n++) {
          traj[n - 1] = -targetX; // Constant sign inversion
        }
      }

      for (let n = 1; n <= steps; n++) {
        results.errorProbabilities.push(1.0); // P(|X_n - X| > eps) = 1.0 for all n!
        results.meanSquareErrors.push(4.0);    // E[(X_n - X)^2] = E[(2X)^2] = 4.0
        results.envelopeUpper.push(1.0);
        results.envelopeLower.push(-1.0);
      }
    }

    return results;
  }

  /**
   * Analysis of the Sqrt(N) Scaling Law & Additivity of Variance
   * Compares Independent increments (Var = n*sigma^2) vs Positively Correlated increments.
   */
  function analyzeSqrtNScaling(maxN = 1000, numTrials = 2000, correlation = 0.0) {
    const Ns = [10, 25, 50, 100, 200, 400, 800, 1000];
    const scalingData = [];

    const sigma = 1.0;
    const mu = 0.0;

    Ns.forEach(n => {
      let sumSnSq = 0;
      let sumMeanSq = 0;
      let sumStdScoreSq = 0;
      const stdScores = [];

      for (let t = 0; t < numTrials; t++) {
        let S = 0;
        let prev = Math.random() < 0.5 ? -1 : 1;

        for (let i = 0; i < n; i++) {
          let inc;
          if (correlation > 0 && i > 0) {
            inc = Math.random() < correlation ? prev : (Math.random() < 0.5 ? -1 : 1);
          } else {
            inc = Math.random() < 0.5 ? -1 : 1;
          }
          S += inc;
          prev = inc;
        }

        const sampleMean = S / n;
        const stdScore = (S - n * mu) / (sigma * Math.sqrt(n));

        sumSnSq += S * S;
        sumMeanSq += sampleMean * sampleMean;
        sumStdScoreSq += stdScore * stdScore;
        if (t < 500) stdScores.push(stdScore);
      }

      const varSn = sumSnSq / numTrials;
      const varMean = sumMeanSq / numTrials;
      const varStdScore = sumStdScoreSq / numTrials;

      scalingData.push({
        n,
        sqrtN: Math.sqrt(n),
        varSn,
        sdSn: Math.sqrt(varSn),
        varMean,
        sdMean: Math.sqrt(varMean),
        varStdScore,
        sdStdScore: Math.sqrt(varStdScore),
        theoreticalSdSn: sigma * Math.sqrt(n),
        theoreticalSdMean: sigma / Math.sqrt(n),
        sampleStdScores: stdScores
      });
    });

    return scalingData;
  }

  // =========================================================================
  // PART 2: BAYESIAN INFERENCE & CONDITIONAL PROBABILITY ENGINE
  // =========================================================================

  /**
   * Beta-Binomial Conjugate Model:
   * Prior: Theta ~ Beta(alpha0, beta0)
   * Likelihood: k successes in n trials ~ Binomial(n, Theta)
   * Posterior: Theta | k ~ Beta(alpha0 + k, beta0 + n - k)
   */
  function computeBetaBinomial(alpha0 = 2, beta0 = 2, successes = 14, trials = 20) {
    const k = Math.max(0, Math.min(trials, successes));
    const n = Math.max(1, trials);
    const a0 = Math.max(0.1, alpha0);
    const b0 = Math.max(0.1, beta0);

    const a1 = a0 + k;
    const b1 = b0 + (n - k);

    // Prior summary
    const priorMean = a0 / (a0 + b0);
    const priorVar = (a0 * b0) / (Math.pow(a0 + b0, 2) * (a0 + b0 + 1));
    const priorMode = (a0 > 1 && b0 > 1) ? (a0 - 1) / (a0 + b0 - 2) : priorMean;
    const priorCiLower = betaQuantile(0.025, a0, b0);
    const priorCiUpper = betaQuantile(0.975, a0, b0);

    // Posterior summary
    const postMean = a1 / (a1 + b1);
    const postVar = (a1 * b1) / (Math.pow(a1 + b1, 2) * (a1 + b1 + 1));
    const postMode = (a1 > 1 && b1 > 1) ? (a1 - 1) / (a1 + b1 - 2) : postMean;
    const postCiLower = betaQuantile(0.025, a1, b1);
    const postCiUpper = betaQuantile(0.975, a1, b1);

    // Maximum Likelihood Estimate (Frequentist point estimate)
    const mle = k / n;

    // Discretized curves for plotting [0, 1]
    const numPoints = 150;
    const thetaVals = [];
    const priorCurve = [];
    const likelihoodCurve = [];
    const postCurve = [];

    // Scale factor for binomial likelihood to match density area
    // Binomial PMF: n! / (k!(n-k)!) * theta^k * (1-theta)^(n-k)
    // Beta(k+1, n-k+1) has exactly the same functional shape!
    for (let i = 0; i <= numPoints; i++) {
      const theta = i / numPoints;
      thetaVals.push(theta);
      priorCurve.push(betaPdf(theta, a0, b0));
      // Likelihood plotted as Beta(k+1, n-k+1) normalized density
      likelihoodCurve.push(betaPdf(theta, k + 1, n - k + 1));
      postCurve.push(betaPdf(theta, a1, b1));
    }

    return {
      model: 'Beta-Binomial',
      parameters: { alpha0: a0, beta0: b0, successes: k, trials: n, alpha1: a1, beta1: b1 },
      prior: { mean: priorMean, mode: priorMode, variance: priorVar, ci: [priorCiLower, priorCiUpper] },
      likelihood: { mle, successes: k, trials: n },
      posterior: { mean: postMean, mode: postMode, variance: postVar, ci: [postCiLower, postCiUpper] },
      curves: { thetaVals, priorCurve, likelihoodCurve, postCurve }
    };
  }

  /**
   * Normal-Normal Conjugate Model (Known Variance sigma^2):
   * Prior: Mu ~ N(mu0, sigma0^2)
   * Likelihood: x_bar | Mu ~ N(Mu, sigma^2 / n)
   * Posterior: Mu | x_bar ~ N(mu1, sigma1^2)
   * where 1/sigma1^2 = 1/sigma0^2 + n/sigma^2 (Precision Additivity!)
   */
  function computeNormalNormal(mu0 = 100, sigma0 = 15, sampleMean = 112, knownSigma = 15, n = 25) {
    const tau0 = 1.0 / (sigma0 * sigma0); // Prior precision
    const tauData = n / (knownSigma * knownSigma); // Data precision
    const tau1 = tau0 + tauData; // Posterior precision
    const sigma1 = Math.sqrt(1.0 / tau1);

    // Posterior mean is the precision-weighted average:
    const mu1 = (tau0 * mu0 + tauData * sampleMean) / tau1;

    // Weight proportions
    const priorWeight = tau0 / tau1;
    const dataWeight = tauData / tau1;

    const zCrit = 1.959963984540;
    const postCi = [mu1 - zCrit * sigma1, mu1 + zCrit * sigma1];
    const priorCi = [mu0 - zCrit * sigma0, mu0 + zCrit * sigma0];

    // Range for plotting
    const minX = Math.min(mu0 - 3.5 * sigma0, sampleMean - 3.5 * (knownSigma / Math.sqrt(n)));
    const maxX = Math.max(mu0 + 3.5 * sigma0, sampleMean + 3.5 * (knownSigma / Math.sqrt(n)));

    const numPoints = 160;
    const xVals = [];
    const priorCurve = [];
    const likelihoodCurve = [];
    const postCurve = [];

    const seData = knownSigma / Math.sqrt(n);

    for (let i = 0; i <= numPoints; i++) {
      const x = minX + (i / numPoints) * (maxX - minX);
      xVals.push(x);
      priorCurve.push(normalPdf(x, mu0, sigma0));
      likelihoodCurve.push(normalPdf(x, sampleMean, seData));
      postCurve.push(normalPdf(x, mu1, sigma1));
    }

    return {
      model: 'Normal-Normal',
      parameters: { mu0, sigma0, sampleMean, knownSigma, n, mu1, sigma1 },
      weights: { priorWeight, dataWeight, tau0, tauData, tau1 },
      prior: { mean: mu0, sd: sigma0, ci: priorCi },
      likelihood: { mean: sampleMean, se: seData },
      posterior: { mean: mu1, sd: sigma1, ci: postCi },
      curves: { xVals, priorCurve, likelihoodCurve, postCurve }
    };
  }

  /**
   * Medical Diagnostic Test / Base Rate Fallacy Updater
   * Computes P(Disease | Test Positive) and full 2x2 joint contingency structure.
   */
  function computeMedicalScreening(prevalence = 0.01, sensitivity = 0.95, specificity = 0.95, population = 100000) {
    const prev = Math.max(0.0001, Math.min(0.5, prevalence));
    const sens = Math.max(0.5, Math.min(0.999, sensitivity));
    const spec = Math.max(0.5, Math.min(0.999, specificity));

    // Probabilities
    const pD = prev;
    const pD_not = 1.0 - prev;

    const pPosGivenD = sens;
    const pNegGivenD = 1.0 - sens;

    const pNegGivenD_not = spec;
    const pPosGivenD_not = 1.0 - spec; // False positive rate

    // Joint probabilities
    const pPosAndD = pPosGivenD * pD; // True positives
    const pPosAndD_not = pPosGivenD_not * pD_not; // False positives
    const pNegAndD = pNegGivenD * pD; // False negatives
    const pNegAndD_not = pNegGivenD_not * pD_not; // True negatives

    // Marginal probability of testing positive P(+)
    const pPos = pPosAndD + pPosAndD_not;
    const pNeg = pNegAndD + pNegAndD_not;

    // Posterior Probability via Bayes Theorem: P(D | +) = (P(+|D)*P(D)) / P(+)
    const ppv = pPosAndD / pPos; // Positive Predictive Value
    const npv = pNegAndD_not / pNeg; // Negative Predictive Value

    // Frequency tree across the population
    const countD = Math.round(population * pD);
    const countD_not = population - countD;
    const truePos = Math.round(countD * sens);
    const falseNeg = countD - truePos;
    const falsePos = Math.round(countD_not * (1 - spec));
    const trueNeg = countD_not - falsePos;

    return {
      prevalence: prev,
      sensitivity: sens,
      specificity: spec,
      pPositive: pPos,
      ppv, // P(Disease | Positive Test)
      npv, // P(Healthy | Negative Test)
      falsePositiveRate: pPosGivenD_not,
      falseDiscoveryRate: 1.0 - ppv,
      populationCounts: {
        population,
        countD,
        countD_not,
        truePos,
        falsePos,
        falseNeg,
        trueNeg,
        totalPos: truePos + falsePos,
        totalNeg: falseNeg + trueNeg
      }
    };
  }

  /**
   * Sequential Bayesian Updating Simulator
   * Simulates receiving data points 1 by 1, demonstrating posterior concentration.
   */
  function simulateSequentialBayes(trueTheta = 0.7, priorAlpha = 2, priorBeta = 2, totalSteps = 100) {
    const history = [];
    let curA = priorAlpha;
    let curB = priorBeta;

    // Snapshot at steps 0, 1, 5, 20, 50, 100
    const checkpoints = [0, 1, 5, 20, 50, totalSteps];

    for (let s = 0; s <= totalSteps; s++) {
      if (checkpoints.includes(s)) {
        const curve = [];
        for (let i = 0; i <= 100; i++) {
          curve.push(betaPdf(i / 100, curA, curB));
        }
        history.push({
          step: s,
          alpha: curA,
          beta: curB,
          mean: curA / (curA + curB),
          sd: Math.sqrt((curA * curB) / (Math.pow(curA + curB, 2) * (curA + curB + 1))),
          curve
        });
      }

      // Generate next Bernoulli trial
      const obs = Math.random() < trueTheta ? 1 : 0;
      if (obs === 1) curA++;
      else curB++;
    }

    return { trueTheta, history };
  }

  // Export Engine API
  return {
    logGamma,
    betaPdf,
    betaQuantile,
    normalPdf,
    normalCdf,
    simulateConvergenceScenario,
    analyzeSqrtNScaling,
    computeBetaBinomial,
    computeNormalNormal,
    computeMedicalScreening,
    simulateSequentialBayes
  };

});
