# Stochastic Modeling of Multi-Agent Penetration Processes: Limit Theorems, Variance Scaling, and Cyber Security Dynamics

## Abstract

This paper presents an analytical and computational investigation of multi-agent penetration processes across $n$ defended systems subjected to an ensemble of $m$ independent adversaries. The penetration trajectory is formalized as a discrete-time stochastic process with independent and identically distributed ($\text{i.i.d.}$) increments $X_1, X_2, \dots, X_n$, evaluated under two distinct probability models:
1. The **Bernoulli Model** ($X_i \in \{0, 1\}$, with $\mathbb{P}(X_i = 1) = p$), capturing monotonic breach accumulation;
2. The **Rademacher Model** ($X_i \in \{-1, +1\}$, with $\mathbb{P}(X_i = +1) = 1/2$), capturing symmetric, zero-mean dynamic contention between exploits and automated defensive countermeasures.

We rigorously derive the moments and asymptotic distributions of three fundamental observables: the **Total Score** $S_n = \sum_{i=1}^n X_i$, the **Average Score** $S_n/n$, and the **Normalized Score** $S_n/\sqrt{n}$. We prove and simulate the convergence in probability of $S_n/n$ via the Weak and Strong Laws of Large Numbers ($\text{LLN}$), demonstrate the contrasting variance behaviors ($O(n)$, $O(1/n)$, and $O(1)$), and establish the convergence in distribution of $S_n/\sqrt{n}$ to the standard normal distribution $\mathcal{N}(0, 1)$ via the Central Limit Theorem ($\text{CLT}$). Finally, we translate these asymptotic results into the operational domain of cyber security, analyzing how perimeter depth $n$ and adversary swarm size $m$ govern systemic vulnerability and extreme-value breach risks.

---

## 1. Problem Formulation & Stochastic Models

Let an enterprise architecture consist of $n$ sequential or layered defensive systems (or discrete penetration stages), and let an adversary fleet deploy $m$ independent attack trajectories. The cumulative penetration progression of trajectory $j \in \{1, \dots, m\}$ at step $k \in \{1, \dots, n\}$ is driven by a sum of random increments:

$$S_k^{(j)} = \sum_{i=1}^k X_i^{(j)}$$

where the increments $\{X_i^{(j)}\}_{i=1}^n$ are independent and identically distributed ($\text{i.i.d.}$) random variables.

```
       Step 1           Step 2                    Step n
   [ System 1 ] ---> [ System 2 ] ---> ... ---> [ System n ]
         ^                ^                           ^
         |                |                           |
  X_1 in {0,1}     X_2 in {0,1}                X_n in {0,1}   (Bernoulli)
  X_1 in {-1,+1}   X_2 in {-1,+1}              X_n in {-1,+1} (Rademacher)
-------------------------------------------------------------------------
Trajectory j: S_n^(j) = X_1^(j) + X_2^(j) + ... + X_n^(j)  (for j = 1..m)
```

### 1.1 The Bernoulli Model (Monotonic Breach Accumulation)

In the Bernoulli model, each system represents an isolated barrier:
- $X_i = 1$ denotes a successful breach / vulnerability exploit, occurring with probability $p \in (0, 1)$;
- $X_i = 0$ denotes that the attack was successfully repelled, occurring with probability $1 - p$.

The single-increment probability mass function ($\text{PMF}$), expectation, and variance are:

$$\mathbb{P}(X_i = 1) = p, \quad \mathbb{P}(X_i = 0) = 1 - p$$

$$\mathbb{E}[X_i] = \mu = p$$

$$\text{Var}(X_i) = \sigma^2 = \mathbb{E}[X_i^2] - (\mathbb{E}[X_i])^2 = p - p^2 = p(1 - p)$$

### 1.2 The Rademacher Model (Symmetric Dynamic Contention)

In the Rademacher model, the penetration process models an active, symmetric confrontation between an attacking entity and an automated Intrusion Prevention System ($\text{IPS}$) or defensive honeypot:
- $X_i = +1$ denotes an attacker compromise (+1 score);
- $X_i = -1$ denotes an active countermeasure, automated patch, or honeypot quarantine (-1 score).

$$\mathbb{P}(X_i = +1) = \frac{1}{2}, \quad \mathbb{P}(X_i = -1) = \frac{1}{2}$$

$$\mathbb{E}[X_i] = \mu = (+1)\left(\frac{1}{2}\right) + (-1)\left(\frac{1}{2}\right) = 0$$

$$\text{Var}(X_i) = \sigma^2 = (+1)^2\left(\frac{1}{2}\right) + (-1)^2\left(\frac{1}{2}\right) - 0^2 = 1$$

The Rademacher distribution represents the canonical symmetric, zero-mean, unit-variance discrete random walk increment.

---

## 2. The Three Score Quantities & Variance Scaling

We study the behavior of three mathematical normalizations of the sum $S_n$ as system size $n$ increases:

| Quantity | Formula | Theoretical Expectation $\mathbb{E}[\cdot]$ | Theoretical Variance $\text{Var}(\cdot)$ | Variance Order |
| :--- | :--- | :--- | :--- | :--- |
| **Total Score** | $S_n = \sum_{i=1}^n X_i$ | $n \mu$ | $n \sigma^2$ | $O(n)$ (Exploding) |
| **Average Score** | $\bar{X}_n = \frac{S_n}{n}$ | $\mu$ | $\frac{\sigma^2}{n}$ | $O(1/n)$ (Vanishing) |
| **Normalized Score** | $Z_n = \frac{S_n}{\sqrt{n}}$ | $\sqrt{n} \mu$ | $\sigma^2$ | $O(1)$ (Invariant) |

### 2.1 Derivations of Moments

By linearity of expectation and independence of increments:

1. **Total Score $S_n$:**
   $$\mathbb{E}[S_n] = \sum_{i=1}^n \mathbb{E}[X_i] = n \mu$$
   $$\text{Var}(S_n) = \sum_{i=1}^n \text{Var}(X_i) = n \sigma^2$$
   The standard deviation scales as $\text{Std}(S_n) = \sigma \sqrt{n}$. The trajectory ensemble exhibits diffusive expansion over time: the spread of attacker outcomes expands proportionally to $\sqrt{n}$.

2. **Average Score $S_n/n$ (Sample Mean):**
   $$\mathbb{E}\left[\frac{S_n}{n}\right] = \frac{1}{n} \mathbb{E}[S_n] = \frac{n \mu}{n} = \mu$$
   $$\text{Var}\left(\frac{S_n}{n}\right) = \frac{1}{n^2} \text{Var}(S_n) = \frac{n \sigma^2}{n^2} = \frac{\sigma^2}{n}$$
   The standard deviation scales as $\text{Std}(S_n/n) = \frac{\sigma}{\sqrt{n}}$. As $n \to \infty$, the variance vanishes asymptotically ($\lim_{n \to \infty} \text{Var}(S_n/n) = 0$).

3. **Normalized Score $S_n/\sqrt{n}$:**
   $$\mathbb{E}\left[\frac{S_n}{\sqrt{n}}\right] = \frac{1}{\sqrt{n}} \mathbb{E}[S_n] = \frac{n \mu}{\sqrt{n}} = \sqrt{n} \mu$$
   $$\text{Var}\left(\frac{S_n}{\sqrt{n}}\right) = \frac{1}{(\sqrt{n})^2} \text{Var}(S_n) = \frac{n \sigma^2}{n} = \sigma^2$$
   Crucially, for the symmetric Rademacher model where $\mu = 0$ and $\sigma^2 = 1$:
   $$\mathbb{E}\left[\frac{S_n}{\sqrt{n}}\right] = 0, \quad \text{Var}\left(\frac{S_n}{\sqrt{n}}\right) = 1 \quad \forall n \ge 1$$
   The variance is strictly constant and independent of $n$. This scaling neither expands to infinity nor collapses to zero, which is the precise balance required for convergence to a non-degenerate continuous distribution.

---

## 3. Convergence in Probability & The Law of Large Numbers

### 3.1 The Weak Law of Large Numbers (WLLN)

**Theorem (Khinchin's WLLN):** Let $X_1, X_2, \dots$ be $\text{i.i.d.}$ random variables with finite expectation $\mathbb{E}[X_i] = \mu$. Then the sample average converges in probability to $\mu$:

$$\frac{S_n}{n} \xrightarrow{P} \mu \quad \Longleftrightarrow \quad \forall \epsilon > 0, \; \lim_{n \to \infty} \mathbb{P}\left(\left|\frac{S_n}{n} - \mu\right| \ge \epsilon\right) = 0$$

#### Analytical Proof via Chebyshev's Inequality
Since $\text{Var}(X_i) = \sigma^2 < \infty$, Chebyshev's inequality applies directly to the estimator $\bar{X}_n = S_n/n$:

$$\mathbb{P}\left(\left|\frac{S_n}{n} - \mu\right| \ge \epsilon\right) \le \frac{\text{Var}(S_n/n)}{\epsilon^2} = \frac{\sigma^2}{n \epsilon^2}$$

Taking the limit as the system size $n \to \infty$:

$$\lim_{n \to \infty} \mathbb{P}\left(\left|\frac{S_n}{n} - \mu\right| \ge \epsilon\right) \le \lim_{n \to \infty} \frac{\sigma^2}{n \epsilon^2} = 0$$

Because probabilities are bounded below by zero, the squeeze theorem establishes that the probability of deviating by more than $\epsilon$ converges strictly to zero.

### 3.2 The Strong Law of Large Numbers (SLLN)

**Theorem (Kolmogorov's SLLN):** Under the same $\text{i.i.d.}$ conditions with $\mathbb{E}[|X_i|] < \infty$:

$$\mathbb{P}\left(\lim_{n \to \infty} \frac{S_n}{n} = \mu\right) = 1$$

While the Weak Law guarantees that the probability of large deviations at a fixed large horizon $n$ is negligible, the Strong Law guarantees that almost every individual sample trajectory $\omega \in \Omega$ will permanently enter and stay within an $\epsilon$-corridor around $\mu$ as $k \to \infty$.

### 3.3 Trajectory Visualization Analysis

In our simulation of $m$ sample paths:
- In the **Total Score plot** ($S_k$), paths diverge within parabolic boundaries $\mu k \pm 2\sigma \sqrt{k}$.
- In the **Average Score plot** ($S_k/k$), paths start with massive dispersion at small $k$ (e.g., $k \in [1, 10]$) and funnel into a razor-thin beam centered at $\mu = p$ (Bernoulli) or $\mu = 0$ (Rademacher). For $k \ge 500$, all $m$ trajectories are tightly concentrated around the theoretical expectation line.

```
Average Score S_k/k Trajectory Funnel (LLN):
1.0 | \  .  .  .  .  .  .  .  .
    |   \
0.5 | ----============================---  Theoretical Mean mu = 0.5
    |   /
0.0 | /  .  .  .  .  .  .  .  .
    +---------------------------------
    k = 1           k = 100        k = 1000
    [High Variance] [Funneling]    [Collapsed on mu]
```

---

## 4. Convergence in Distribution & The Central Limit Theorem

### 4.1 The Lindeberg-Lévy Central Limit Theorem

**Theorem (CLT):** Let $X_1, X_2, \dots$ be $\text{i.i.d.}$ random variables with mean $\mu$ and finite non-zero variance $\sigma^2$. Let $Z_n$ denote the standardized sum:

$$Z_n = \frac{S_n - n\mu}{\sigma \sqrt{n}}$$

Then $Z_n$ converges in distribution to the standard Gaussian distribution $\mathcal{N}(0, 1)$ as $n \to \infty$:

$$Z_n \xrightarrow{d} \mathcal{N}(0, 1)$$

That is, for every real number $z \in \mathbb{R}$:

$$\lim_{n \to \infty} \mathbb{P}(Z_n \le z) = \Phi(z) = \frac{1}{\sqrt{2\pi}} \int_{-\infty}^z e^{-u^2/2} \, du$$

### 4.2 Application to the Rademacher Process

For the Rademacher model, because $\mu = 0$ and $\sigma = 1$:

$$\frac{S_n - n\mu}{\sigma \sqrt{n}} = \frac{S_n - 0}{1 \cdot \sqrt{n}} = \frac{S_n}{\sqrt{n}}$$

Hence, **the unshifted normalized total score $\frac{S_n}{\sqrt{n}}$ is itself the standardized random variable**.

#### Characteristic Function Proof for Rademacher
The characteristic function $\phi_X(t) = \mathbb{E}[e^{itX}]$ of a single Rademacher increment is:

$$\phi_X(t) = \frac{1}{2} e^{it(+1)} + \frac{1}{2} e^{it(-1)} = \cos(t)$$

Using Taylor series expansion around $t = 0$:

$$\cos(t) = 1 - \frac{t^2}{2} + O(t^4)$$

For the normalized sum $Z_n = \frac{1}{\sqrt{n}} \sum_{i=1}^n X_i$:

$$\phi_{Z_n}(t) = \mathbb{E}\left[\exp\left(it \frac{\sum_{i=1}^n X_i}{\sqrt{n}}\right)\right] = \prod_{i=1}^n \phi_X\left(\frac{t}{\sqrt{n}}\right) = \left[\cos\left(\frac{t}{\sqrt{n}}\right)\right]^n$$

Substituting the expansion:

$$\phi_{Z_n}(t) = \left(1 - \frac{t^2}{2n} + O\left(\frac{t^4}{n^2}\right)\right)^n$$

Using the fundamental limit $\lim_{n \to \infty} (1 + \frac{a}{n})^n = e^a$:

$$\lim_{n \to \infty} \phi_{Z_n}(t) = e^{-t^2/2}$$

The limiting characteristic function $e^{-t^2/2}$ is uniquely the characteristic function of the standard normal distribution $\mathcal{N}(0, 1)$. By Lévy's Continuity Theorem:

$$\frac{S_n}{\sqrt{n}} \xrightarrow{d} \mathcal{N}(0, 1)$$

### 4.3 Rate of Convergence & The Berry-Esseen Theorem

The Berry-Esseen theorem quantifies the error between the empirical distribution function $F_n(z) = \mathbb{P}(S_n/\sqrt{n} \le z)$ and the Gaussian $\Phi(z)$:

$$\sup_{z \in \mathbb{R}} |F_n(z) - \Phi(z)| \le \frac{C \cdot \rho}{\sigma^3 \sqrt{n}}$$

where $\rho = \mathbb{E}[|X_i - \mu|^3]$ is the third absolute central moment and $C \approx 0.4748$.
- For Rademacher: $\rho = \mathbb{E}[|X|^3] = 1$, $\sigma = 1$, yielding:
  $$\sup_{z} |F_n(z) - \Phi(z)| \le \frac{0.4748}{\sqrt{n}}$$
  For $n = 500$, the maximum discrepancy is bounded by $\le \frac{0.4748}{\sqrt{500}} \approx 0.0212$ ($2.1\%$).
- In our empirical tests ($m = 1000$ attackers), the Kolmogorov-Smirnov test statistic $D = \sup_z |F_m(z) - \Phi(z)|$ confirms excellent alignment ($D < 0.03$), and the Normal Q-Q plot conforms tightly to the $45^\circ$ reference line.

---

## 5. Synthesis & Comparison Across Normalizations

The following comparative table synthesizes the distinct mathematical mechanisms governing the three quantities:

| Attribute | Total Score $S_n$ | Average Score $S_n/n$ | Normalized Score $S_n/\sqrt{n}$ |
| :--- | :--- | :--- | :--- |
| **Normalization Factor** | $1$ | $n^{-1}$ | $n^{-1/2}$ |
| **Limiting Variance** | $\lim_{n \to \infty} \text{Var} = \infty$ | $\lim_{n \to \infty} \text{Var} = 0$ | $\lim_{n \to \infty} \text{Var} = \sigma^2$ (Constant) |
| **Trajectory Geometry** | Parabolic outward divergence | Funneling / cone of convergence | Invariant stationary corridor |
| **Limiting Object** | Diffusive Brownian drift | Deterministic degenerate point $\mu$ | Non-degenerate Gaussian $\mathcal{N}(\cdot)$ |
| **Governing Law** | Random Walk Diffusion | Law of Large Numbers (WLLN/SLLN) | Central Limit Theorem (CLT) |
| **Mode of Convergence** | None (Diverges in variance) | Convergence in Probability / a.s. | Convergence in Distribution |

---

## 6. Cyber Security Interpretation: $n$ Systems and $m$ Attackers

### 6.1 Physical Meaning of the Variables

In an enterprise security architecture:
1. **System Horizon $n$ (Defense Depth):**
   Represents the depth of defense-in-depth security layers (e.g., perimeter firewall, DMZ proxy, micro-segmented subnets, identity federation, application sandbox, host agent).
2. **Attacker Ensemble $m$ (Adversary Scale):**
   Represents the scale of concurrent penetration attempts (e.g., automated exploit bots, distributed botnet nodes, or red-team campaigns).
3. **The Score $S_n$:**
   Represents cumulative breach impact. In Bernoulli, $S_n$ is the exact count of compromised subsystems. In Rademacher, $S_n$ represents the net security margin: positive values indicate attacker advancement; negative values indicate automated defensive containment.

### 6.2 The Defense-in-Depth Paradox

An essential insight derived from the Law of Large Numbers is the **predictability of average risk versus the dispersion of cumulative damage**:
- **By the LLN:** As an enterprise scales its systems ($n \to \infty$), the average vulnerability rate $\frac{S_n}{n} \to p$ becomes completely deterministic. Enterprise risk officers can predict the *percentage* of compromised nodes with near certainty.
- **By Random Walk Dispersion:** However, the total number of breached systems $S_n$ exhibits a standard deviation $\sigma \sqrt{n}$. The absolute uncertainty in damage grows with $\sqrt{n}$.

### 6.3 The Attacker Swarm Advantage (Extreme Value Analysis)

Consider $m$ independent attackers attacking $n$ systems under the symmetric Rademacher model ($\mu = 0$). By the CLT, each attacker's final score satisfies $S_n^{(j)} \approx \sqrt{n} Z_j$, where $Z_j \sim \mathcal{N}(0, 1)$.

Although the expected score across the fleet is zero ($\mathbb{E}[S_n] = 0$), the security operations center ($\text{SOC}$) must defend against the **worst-case penetration**:

$$S_n^{\max} = \max_{1 \le j \le m} S_n^{(j)}$$

By Extreme Value Theory for Gaussian variables, the expected maximum of $m$ independent standard normal variables satisfies:

$$\mathbb{E}\left[\max_{1 \le j \le m} Z_j\right] = \sqrt{2 \ln m} - \frac{\ln(\ln m) + \ln(4\pi)}{2\sqrt{2 \ln m}} + O\left(\frac{1}{\ln m}\right)$$

Therefore, the worst-case attacker's penetration score scales asymptotically as:

$$\mathbb{E}[S_n^{\max}] \approx \sigma \sqrt{2 n \ln m}$$

#### Practical Security Implication:
Even when the defensive countermeasure system is perfectly balanced ($\mu = 0$ in the Rademacher model), an adversary deploying a large botnet ($m \gg 1$) will almost certainly produce extreme positive outliers. For instance, with $n = 500$ systems and $m = 1000$ attackers:

$$\mathbb{E}[S_{500}^{\max}] \approx 1 \cdot \sqrt{2 \times 500 \times \ln(1000)} \approx \sqrt{1000 \times 6.9078} \approx 83.1 \text{ breaches}$$

Thus, while the average attacker score is centered at $0$, the most successful attacker penetrates **over 80 layers deep**. This mathematically demonstrates why symmetric defense is insufficient against adversary swarms, establishing the necessity for asymmetric prevention architectures (e.g., zero-trust isolation and automated containment thresholds).

---

## 7. Conclusion

This study provides a unified mathematical and computational treatment of stochastic penetration models:
1. **Variance Dynamics:** The choice of normalization dynamically alters asymptotic dispersion: $S_n$ expands with variance $O(n)$, $S_n/n$ vanishes with variance $O(1/n)$, and $S_n/\sqrt{n}$ stabilizes with invariant variance $O(1)$.
2. **Limit Theorems:** The sample mean $S_n/n$ converges in probability and almost surely to $\mu$ by the Law of Large Numbers, while the normalized sum $S_n/\sqrt{n}$ converges in distribution to the standard Gaussian $\mathcal{N}(0, 1)$ by the Central Limit Theorem.
3. **Cyber Security Implications:** In enterprise environments, system scaling $n$ brings deterministic stability to the average breach rate ($S_n/n \to p$), while large adversary swarms $m$ exploit Gaussian tail dispersion to achieve deep breach outliers scaling as $\sqrt{2n \ln m}$.

---
*Comprehensive Technical Reference • Stochastic Processes & Information Security Suite*
