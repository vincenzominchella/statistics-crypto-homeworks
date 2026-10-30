# Welford’s Recurrence, Sampling Distributions & Statistical Inference in Multi-Agent Penetration Testing

## Abstract

This paper investigates the algebraic derivation, numerical stability, and statistical inference properties of online recurrence algorithms for sample moments, with application to multi-agent cyber security penetration testing. We first derive **Welford's recurrence formulas** (1962) for the running sum of squared deviations ($SS_k$) and the sample variance ($s_k^2$), demonstrating how they generalize Donald Knuth’s recurrence for the sample mean while eliminating the catastrophic floating-point cancellation inherent to the textbook naive algorithm. We show that the core recurrence logic requires exactly **3 lines of code**. 

We then extend the penetration testing framework by modeling $m$ independent adversaries attacking $n$ sequential systems, where each penetration attempt receives an exploit severity score $X \in [0, 10]$ drawn from a fixed probability distribution with theoretical mean $\mu$ and variance $\sigma^2$. Using Welford's algorithm online across all $m$ trajectories, we analyze the **sampling distribution of the mean** $\bar{x}_n$ and the **sampling distribution of the variance** $s_n^2$. We prove the exact unbiasedness of both estimators ($\mathbb{E}[\bar{x}_n] = \mu$ and $\mathbb{E}[s_n^2] = \sigma^2$), verify how the grand averages $\bar{M}_n$ and $\bar{V}_n$ converge to their theoretical counterparts, and evaluate how increasing system depth $n$ collapses the estimator variability as $O(1/n)$. Finally, we discuss why these finite-sample properties form the mathematical bedrock of inferential statistics, hypothesis testing, and quantitative risk auditing in defensive cybersecurity operations.

---

## 1. Exercise 1 — Derivation of Welford’s Recurrence Formulas

### 1.1 The Numerical Precision Problem in Variance Estimation

In elementary textbooks, the population variance $\sigma^2$ and sample variance $s^2$ of a dataset $\{x_1, \dots, x_n\}$ are often written in the "one-pass" algebraic shortcut:

$$s_n^2 = \frac{1}{n-1} \left( \sum_{i=1}^n x_i^2 - \frac{1}{n} \left(\sum_{i=1}^n x_i\right)^2 \right)$$

While mathematically equivalent to the definition in exact real arithmetic, this formulation is **catastrophically unstable** in finite-precision floating-point arithmetic (IEEE 754). When the data points $x_i$ possess a large magnitude (or a large constant offset $C \gg 1$) combined with a relatively small variance, the two terms:

$$\sum_{i=1}^n x_i^2 \quad \text{and} \quad \frac{1}{n}\left(\sum_{i=1}^n x_i\right)^2$$

are two nearly identical, very large numbers. Subtracting them leads to severe **loss of significance** (subtractive cancellation), routinely yielding wildly inaccurate, zero, or even physically impossible *negative* sample variances. 

Furthermore, traditional two-pass algorithms require buffering the entire sequence of observations in memory to compute the mean first, violating the $O(1)$ space constraints required by real-time streaming telemetry and online stochastic simulation.

---

### 1.2 Knuth’s Formulation for the Running Mean

In 1962, B. P. Welford published a single-pass, numerically stable recurrence algorithm, later popularized by Donald E. Knuth in *The Art of Computer Programming* (1969).

Let $\bar{x}_k$ denote the arithmetic sample mean of the first $k$ observations:

$$\bar{x}_k = \frac{1}{k}\sum_{i=1}^k x_i$$

Isolating the final observation $x_k$:

$$\bar{x}_k = \frac{1}{k}\left(\sum_{i=1}^{k-1} x_i + x_k\right) = \frac{(k-1)\bar{x}_{k-1} + x_k}{k}$$

Rewriting $(k-1)\bar{x}_{k-1}$ as $k\bar{x}_{k-1} - \bar{x}_{k-1}$:

$$\bar{x}_k = \frac{k\bar{x}_{k-1} - \bar{x}_{k-1} + x_k}{k} = \bar{x}_{k-1} + \frac{x_k - \bar{x}_{k-1}}{k}$$

This is Knuth's classic recurrence for the running mean. The quantity $\delta_k = x_k - \bar{x}_{k-1}$ represents the innovation (the deviation of the new point from the previous mean).

---

### 1.3 Step-by-Step Derivation of Welford's Sum of Squares ($M_{2,k}$)

We seek a recurrence relation for the sum of squared deviations from the mean:

$$M_{2,k} \equiv SS_k = \sum_{i=1}^k (x_i - \bar{x}_k)^2$$

Consider the difference $M_{2,k} - M_{2,k-1}$:

$$M_{2,k} = \sum_{i=1}^k (x_i - \bar{x}_k)^2 = \sum_{i=1}^{k-1} (x_i - \bar{x}_k)^2 + (x_k - \bar{x}_k)^2$$

Using the identity $x_i - \bar{x}_k = (x_i - \bar{x}_{k-1}) - (\bar{x}_k - \bar{x}_{k-1})$, we expand the first summation:

$$\sum_{i=1}^{k-1} (x_i - \bar{x}_k)^2 = \sum_{i=1}^{k-1} \left[ (x_i - \bar{x}_{k-1}) - (\bar{x}_k - \bar{x}_{k-1}) \right]^2$$

Expanding the square:

$$= \sum_{i=1}^{k-1} (x_i - \bar{x}_{k-1})^2 - 2(\bar{x}_k - \bar{x}_{k-1})\sum_{i=1}^{k-1}(x_i - \bar{x}_{k-1}) + \sum_{i=1}^{k-1}(\bar{x}_k - \bar{x}_{k-1})^2$$

By definition of the arithmetic mean $\bar{x}_{k-1}$, the sum of deviations about the mean is identically zero:

$$\sum_{i=1}^{k-1}(x_i - \bar{x}_{k-1}) \equiv 0$$

Therefore, the cross-product term vanishes completely:

$$\sum_{i=1}^{k-1} (x_i - \bar{x}_k)^2 = M_{2,k-1} + (k-1)(\bar{x}_k - \bar{x}_{k-1})^2$$

From Knuth's recurrence, recall that:

$$\bar{x}_k - \bar{x}_{k-1} = \frac{x_k - \bar{x}_{k-1}}{k}$$

Substituting this expression:

$$\sum_{i=1}^{k-1} (x_i - \bar{x}_k)^2 = M_{2,k-1} + (k-1)\left(\frac{x_k - \bar{x}_{k-1}}{k}\right)^2 = M_{2,k-1} + \frac{k-1}{k^2}(x_k - \bar{x}_{k-1})^2$$

Now consider the remaining $k$-th term $(x_k - \bar{x}_k)^2$:

$$x_k - \bar{x}_k = x_k - \left(\bar{x}_{k-1} + \frac{x_k - \bar{x}_{k-1}}{k}\right) = (x_k - \bar{x}_{k-1})\left(1 - \frac{1}{k}\right) = \frac{k-1}{k}(x_k - \bar{x}_{k-1})$$

Squaring this term gives:

$$(x_k - \bar{x}_k)^2 = \frac{(k-1)^2}{k^2}(x_k - \bar{x}_{k-1})^2$$

Adding the two components together:

$$M_{2,k} = M_{2,k-1} + \frac{k-1}{k^2}(x_k - \bar{x}_{k-1})^2 + \frac{(k-1)^2}{k^2}(x_k - \bar{x}_{k-1})^2$$

Factoring out $\frac{k-1}{k^2}(x_k - \bar{x}_{k-1})^2$:

$$M_{2,k} = M_{2,k-1} + \frac{k-1}{k^2}\left[ 1 + (k - 1) \right](x_k - \bar{x}_{k-1})^2$$

Since $1 + (k - 1) = k$, the coefficient simplifies as $\frac{k-1}{k^2}\cdot k = \frac{k-1}{k}$:

$$M_{2,k} = M_{2,k-1} + \frac{k-1}{k}(x_k - \bar{x}_{k-1})^2$$

Finally, substituting back $x_k - \bar{x}_k = \frac{k-1}{k}(x_k - \bar{x}_{k-1})$, we obtain Welford's celebrated symmetric form:

$$M_{2,k} = M_{2,k-1} + (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)$$

The sample variance $s_k^2$ with Bessel's correction factor ($k-1$) is therefore computed directly at any stage:

$$s_k^2 = \frac{M_{2,k}}{k - 1} \quad (k \ge 2)$$

---

### 1.4 The 3-Line Algorithmic Implementation

Because the term $(x_k - \bar{x}_k)$ uses the *updated* mean $\bar{x}_k$ while $(x_k - \bar{x}_{k-1})$ uses the *prior* mean, the algorithm can be expressed in exactly **3 lines of code**:

```javascript
// Welford's 3-Line Core Update:
const delta = x - mean;
mean += delta / k;
M2 += delta * (x - mean);
```

#### Memory and Computational Complexity:
- **Time Complexity per update:** $\mathcal{O}(1)$ (one addition, one subtraction, one division, two multiplications).
- **Space Complexity:** $\mathcal{O}(1)$ auxiliary storage (only `count`, `mean`, and `M2` are persisted).
- **Condition Number:** Extremely well-conditioned. Errors in variance do not accumulate proportionally to the magnitude of the data offset $C$.

---

## 2. Exercise 2 — Multi-Agent Penetration Testing Model

### 2.1 Model Architecture & Score Distributions on $[0, 10]$

Let an enterprise defense architecture consist of $n$ defensive layers (or systems). An attacker ensemble consisting of $m$ independent threat actors penetrates these systems sequentially.

For each hacker $j \in \{1, \dots, m\}$ and each target system $k \in \{1, \dots, n\}$, the breach attempt results in an exploit score $X_k^{(j)} \in [0, 10]$. The random variables $\{X_k^{(j)}\}$ are independent and identically distributed ($\text{i.i.d.}$) draws from a fixed discrete probability distribution:

$$\mathbb{P}(X = x) = p_x, \quad x \in \{0, 1, \dots, 10\}$$

The suite supports four distinct realistic probability models:
1. **Binomial Score Distribution $\text{Bin}(10, p)$**:
   $$\mu = 10p, \quad \sigma^2 = 10p(1 - p)$$
2. **Discrete Uniform Distribution $\mathcal{U}\{0, 10\}$**:
   $$\mu = 5.0, \quad \sigma^2 = \frac{(10 - 0 + 1)^2 - 1}{12} = \frac{120}{12} = 10.0$$
3. **CVSS Cyber Threat Profile**:
   A realistic multi-modal enterprise profile with $30\%$ mass on $0$ (attack prevented), low-level probe mass ($2 \le x \le 4$), medium breach peak at $5.0$, and remote code execution (RCE) peak at $8.5$.
4. **APT Exploit Kit Profile**:
   A right-skewed advanced persistent threat distribution concentrating mass on severe breach ratings ($7 \le x \le 10$).

Each hacker $j$ continuously maintains their sample mean $\bar{x}_k^{(j)}$ and sample variance $s_k^{2(j)}$ online via Welford’s recurrence across all $k = 1, \dots, n$.

---

## 3. Sampling Distributions & Estimator Unbiasedness

### 3.1 Unbiasedness of the Sample Mean

For each hacker $j$, the sample mean at system horizon $n$ is:

$$\bar{x}_n^{(j)} = \frac{1}{n} \sum_{i=1}^n X_i^{(j)}$$

Taking the mathematical expectation across the probability space:

$$\mathbb{E}[\bar{x}_n] = \mathbb{E}\left[ \frac{1}{n}\sum_{i=1}^n X_i \right] = \frac{1}{n}\sum_{i=1}^n \mathbb{E}[X_i] = \frac{1}{n}\sum_{i=1}^n \mu = \mu$$

Thus, the sample mean $\bar{x}_n$ is an **unbiased estimator** of the population mean $\mu$:

$$\text{Bias}(\bar{x}_n) = \mathbb{E}[\bar{x}_n] - \mu = 0$$

Across the ensemble of $m$ independent hackers, the grand average of sample means is:

$$\bar{M}_n = \frac{1}{m} \sum_{j=1}^m \bar{x}_n^{(j)}$$

By the Weak Law of Large Numbers, as $m \to \infty$:

$$\bar{M}_n \xrightarrow{\mathbb{P}} \mathbb{E}[\bar{x}_n] = \mu$$

---

### 3.2 Unbiasedness of the Sample Variance (Proof of Bessel’s Correction)

The sample variance computed by Welford's algorithm uses Bessel's correction denominator $n - 1$:

$$s_n^2 = \frac{1}{n - 1} \sum_{i=1}^n (X_i - \bar{x}_n)^2$$

To prove that $\mathbb{E}[s_n^2] = \sigma^2$, consider the algebraic expansion:

$$\sum_{i=1}^n (X_i - \bar{x}_n)^2 = \sum_{i=1}^n \left[(X_i - \mu) - (\bar{x}_n - \mu)\right]^2$$

$$= \sum_{i=1}^n (X_i - \mu)^2 - 2(\bar{x}_n - \mu)\sum_{i=1}^n (X_i - \mu) + n(\bar{x}_n - \mu)^2$$

Since $\sum_{i=1}^n (X_i - \mu) = n(\bar{x}_n - \mu)$, this simplifies to:

$$\sum_{i=1}^n (X_i - \bar{x}_n)^2 = \sum_{i=1}^n (X_i - \mu)^2 - n(\bar{x}_n - \mu)^2$$

Taking expectations on both sides:

$$\mathbb{E}\left[ \sum_{i=1}^n (X_i - \bar{x}_n)^2 \right] = \sum_{i=1}^n \mathbb{E}[(X_i - \mu)^2] - n\mathbb{E}[(\bar{x}_n - \mu)^2]$$

By definition, $\mathbb{E}[(X_i - \mu)^2] = \text{Var}(X_i) = \sigma^2$, and $\mathbb{E}[(\bar{x}_n - \mu)^2] = \text{Var}(\bar{x}_n) = \frac{\sigma^2}{n}$. Therefore:

$$\mathbb{E}\left[ \sum_{i=1}^n (X_i - \bar{x}_n)^2 \right] = n\sigma^2 - n\left(\frac{\sigma^2}{n}\right) = (n - 1)\sigma^2$$

Dividing by $n - 1$:

$$\mathbb{E}[s_n^2] = \mathbb{E}\left[ \frac{1}{n - 1} \sum_{i=1}^n (X_i - \bar{x}_n)^2 \right] = \frac{(n - 1)\sigma^2}{n - 1} = \sigma^2$$

This proves that Welford’s sample variance is an **exact unbiased estimator** of $\sigma^2$ for any sample size $n \ge 2$. 

Across $m$ hackers, the grand average of sample variances:

$$\bar{V}_n = \frac{1}{m} \sum_{j=1}^m s_n^{2(j)}$$

converges in probability to the population variance $\sigma^2$ as $m \to \infty$.

---

## 4. Asymptotic Variability as a Function of System Count $n$

### 4.1 Variability of the Sampling Mean $\text{Var}(\bar{x}_n)$

The variance of the sample mean among independent hackers quantifies the uncertainty in an individual hacker's score average:

$$\text{Var}(\bar{x}_n) = \text{Var}\left( \frac{1}{n}\sum_{i=1}^n X_i \right) = \frac{1}{n^2}\sum_{i=1}^n \text{Var}(X_i) = \frac{n\sigma^2}{n^2} = \frac{\sigma^2}{n}$$

The standard deviation of the sampling mean—known as the **Standard Error ($SE$)**—is:

$$SE(\bar{x}_n) = \frac{\sigma}{\sqrt{n}}$$

As the number of systems attempted $n$ increases:
- $\text{Var}(\bar{x}_n) \to 0$ hyperbolically at rate $\mathcal{O}(1/n)$.
- The sampling distribution of $\bar{x}_n$ funnels sharply around the true mean $\mu$.
- By the Central Limit Theorem, $\sqrt{n}(\bar{x}_n - \mu) \xrightarrow{d} \mathcal{N}(0, \sigma^2)$, meaning the histogram of $\bar{x}_n$ across the $m$ hackers matches a Gaussian bell curve regardless of whether the score distribution is bimodal or discrete.

---

### 4.2 Variability of the Sample Variance $\text{Var}(s_n^2)$

How does increasing $n$ affect the variability of the sample variance $s_n^2$ across hackers?

Using the classical sampling moment theory for $\text{i.i.d.}$ random variables with finite 4th central moment $\mu_4 = \mathbb{E}[(X - \mu)^4]$ and kurtosis $\kappa = \mu_4 / \sigma^4$:

$$\text{Var}(s_n^2) = \frac{1}{n}\left( \mu_4 - \frac{n - 3}{n - 1}\sigma^4 \right)$$

For large $n$ ($\frac{n-3}{n-1} \approx 1$):

$$\text{Var}(s_n^2) \approx \frac{\mu_4 - \sigma^4}{n} = \frac{\sigma^4(\kappa - 1)}{n} = \mathcal{O}\left(\frac{1}{n}\right)$$

This demonstrates that:
1. **Increasing $n$ suppresses the spread of sample variances:** An individual hacker attacking 10 systems will compute a highly volatile sample variance; an individual hacker attacking 500 systems computes a sample variance virtually identical to the true variance $\sigma^2$.
2. **Kurtosis effect:** Distributions with heavy exploit tails (such as the CVSS profile with high $\mu_4$) exhibit higher finite-sample variance variability for small $n$, but still collapse to zero as $1/n$.

---

## 5. Why These Results are Essential in Inferential Statistics

In empirical science and cybersecurity operations, practitioners **never possess omniscient knowledge** of the true population parameters $\mu$ and $\sigma^2$. A security auditor or defender only observes a finite sample: the trajectory of $n$ penetration tests conducted by one red team.

The mathematical findings derived in this homework provide the foundation of inferential statistics:

1. **Unbiased Point Estimation Without Parameter Knowledge:**
   Because $\bar{x}_n$ and $s_n^2$ are proven to be unbiased estimators, the auditor can estimate the true mean exploit severity $\mu$ and true defensive heterogeneity $\sigma^2$ without systematic under-estimation or over-estimation.
2. **Confidence Interval Construction ($t$-Distribution):**
   When the true population variance $\sigma^2$ is unknown, we substitute Welford’s unbiased sample variance $s_n^2$ to construct exact confidence intervals for systemic vulnerability:
   $$\bar{x}_n \pm t_{\alpha/2, \, n-1} \cdot \frac{s_n}{\sqrt{n}}$$
   Because $\text{Var}(\bar{x}_n) = \sigma^2/n$, the width of the confidence interval shrinks as $1/\sqrt{n}$, enabling auditors to guarantee risk bounds within arbitrary tolerances.
3. **Hypothesis Testing (Evaluating Defensive Mitigations):**
   Suppose an automated IPS patch is deployed. To test whether the patch statistically reduced vulnerability severity below threshold $\mu_0$, analysts compute the Student's $t$ statistic:
   $$t = \frac{\bar{x}_n - \mu_0}{s_n / \sqrt{n}}$$
   Welford's algorithm guarantees that $s_n$ is computed in real time in streaming fashion without storing past events or suffering precision collapse.

---

## 6. Physical Cybersecurity Interpretation

| Statistical Quantity | Mathematical Formalism | Cybersecurity Physical Interpretation | Impact as Systems $n \to \infty$ | Impact as Hackers $m \to \infty$ |
| :--- | :--- | :--- | :--- | :--- |
| **Score $X_i$** | $X \in [0, 10]$ with mean $\mu$, var $\sigma^2$ | Exploit severity achieved at defensive layer $i$ (CVSS rating). | Audits depth of defensive perimeter. | Exposes system to diverse adversary attack toolchains. |
| **Sampling Mean $\bar{x}_n$** | $\frac{1}{n}\sum_{i=1}^n X_i$ via Welford | Overall average exploit depth achieved by a single attacker. | Variance decays as $\sigma^2/n$; converges to true mean $\mu$. | Distribution across hackers forms Gaussian bell curve $\mathcal{N}(\mu, \sigma^2/n)$. |
| **Sample Variance $s_n^2$** | $\frac{M_{2,n}}{n-1}$ via Welford | Defensive posture consistency (low variance = uniform defense; high variance = Swiss-cheese holes). | Estimate uncertainty decays as $\mathcal{O}(1/n)$; auditor learns true defense variance. | Grand average $\bar{V}_n$ converges precisely to $\sigma^2$. |
| **Unbiasedness** | $\mathbb{E}[\bar{x}_n]=\mu$, $\mathbb{E}[s_n^2]=\sigma^2$ | Guarantee that finite penetration testing provides valid risk bounds. | Allows tight confidence intervals for compliance audits. | Combining independent penetration teams reveals ground truth. |

---

## 7. Conclusions

1. **Welford’s Recurrence** provides an optimal, single-pass, $\mathcal{O}(1)$-memory algorithm for running mean and sum of squares that completely avoids catastrophic cancellation errors on shifted floating-point data.
2. The core algorithm requires only **3 lines of logic**, making it ideally suited for edge sensors, embedded telemetry, and high-throughput network monitoring.
3. In multi-agent penetration testing, the **sampling mean** and **sample variance** are empirically verified to be strictly unbiased estimators ($\bar{M}_n \to \mu$ and $\bar{V}_n \to \sigma^2$).
4. Increasing the number of systems attempted $n$ collapses the variability of both estimators according to the theoretical $\mathcal{O}(1/n)$ decay law, validating the fundamental premise of statistical sampling in risk analysis.

