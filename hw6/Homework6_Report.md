# Statistical Independence, Bivariate Contingency Analysis & Causal Inference

## Formal Mathematical Specification & Technical Report • Homework 6

---

### Executive Summary & Foundational Scope

This report provides a rigorous theoretical and computational investigation into **bivariate categorical analysis**, the mathematical foundations of **statistical independence**, the asymptotic derivation of **Pearson's Chi-Square ($\chi^2$) test of independence**, and the critical epistemological boundary separating **statistical association from causality**.

Given any bivariate dataset $(X, Y)$ observed over a sample of size $N$, we establish:
1. The **algebraic and measure-theoretic distinctions** between independence in probability theory and empirical independence in inferential statistics.
2. The programmatic construction of the **$r \times c$ contingency table**, deriving joint relative frequencies, marginal distributions, and directional conditional distributions ($f_{Y \mid X}$ and $f_{X \mid Y}$).
3. The derivation of **expected cell frequencies** $E_{ij} = \frac{R_i C_j}{N}$ under the null hypothesis of independence ($H_0$) via Maximum Likelihood Estimation (MLE) on constrained multinomial distributions.
4. The derivation of Pearson's test statistic $\chi^2 = \sum \frac{(O_{ij} - E_{ij})^2}{E_{ij}}$, proving why its asymptotic distribution has degrees of freedom $\nu = (r - 1)(c - 1)$, and implementing high-precision evaluation of the tail probability ($p$-value) using the regularized incomplete gamma function.
5. Standardized Haberman residuals, Cochran validity criteria, and normalized effect-size measures (Cramér's $V$, Pearson's Contingency Coefficient $C$, Tschuprow's $T$, and Odds Ratios for $2 \times 2$ designs).
6. A formal analysis of **Simpson's Paradox** and DAG-based causal identification, proving that observational statistical dependence cannot establish a causal link without interventional or counterfactual identification.

---

## 1. Theoretical Foundations: Independence in Probability vs. Statistics

The concept of independence is frequently conflated between its **deductive definition in probability theory** and its **inductive inferential role in empirical statistics**. Clarifying this distinction is vital for understanding categorical inference.

### 1.1 Independence in Probability Theory (Deductive Formulation)

In axiomatic probability theory based on the Kolmogorov probability space $(\Omega, \mathcal{F}, P)$:

#### Definition 1.1 (Independence of Events)
Two events $A, B \in \mathcal{F}$ are defined to be **independent** if and only if the probability of their intersection factors as the product of their individual probabilities:
$$P(A \cap B) = P(A) \cdot P(B)$$

If $P(B) > 0$, Bayes' theorem implies the equivalent conditional characterization:
$$P(A \mid B) = \frac{P(A \cap B)}{P(B)} = \frac{P(A) \cdot P(B)}{P(B)} = P(A)$$
Similarly, if $P(A) > 0$, then $P(B \mid A) = P(B)$. In probabilistic terms, conditioning on $B$ conveys zero informational gain regarding the occurrence of $A$.

#### Definition 1.2 (Independence of Random Variables)
Two discrete random variables $X: \Omega \to \mathcal{X} = \{A_1, \dots, A_r\}$ and $Y: \Omega \to \mathcal{Y} = \{B_1, \dots, B_c\}$ are independent if and only if their joint probability mass function (PMF) factorizes across all domain points $(A_i, B_j)$:
$$p_{X,Y}(A_i, B_j) = P(X = A_i \text{ and } Y = B_j) = P(X = A_i) \cdot P(Y = B_j) = p_X(A_i) \cdot p_Y(B_j) \quad \forall i, j$$

In terms of generated $\sigma$-algebras, $X \perp\!\!\!\perp Y$ if and only if $\sigma(X)$ and $\sigma(Y)$ are independent sub-$\sigma$-algebras of $\mathcal{F}$.

In probability theory, independence is an **assumed or derived structural axiom** of the probability measure $P$.

---

### 1.2 Independence in Statistics (Inductive & Inferential Formulation)

In empirical statistics, we do not have access to the true underlying probability measure $P$. Instead, we observe a finite sample of $N$ realizations:
$$\mathcal{D} = \{(x_1, y_1), (x_2, y_2), \dots, (x_N, y_N)\} \subset \mathcal{X} \times \mathcal{Y}$$

Let $O_{ij}$ denote the observed count of pairs with $X = A_i$ and $Y = B_j$. The empirical joint frequency is:
$$\hat{p}_{ij} = \frac{O_{ij}}{N}$$
and the empirical marginal frequencies are:
$$\hat{p}_{i\cdot} = \frac{R_i}{N} = \sum_{j=1}^c \frac{O_{ij}}{N}, \qquad \hat{p}_{\cdot j} = \frac{C_j}{N} = \sum_{i=1}^r \frac{O_{ij}}{N}$$

#### The Fundamental Empirical Reality
Even when the true population process is strictly independent ($p_{ij} = p_{i\cdot} p_{\cdot j}$), in any finite sample ($N < \infty$), stochastic sampling fluctuations guarantee that:
$$\hat{p}_{ij} \neq \hat{p}_{i\cdot} \cdot \hat{p}_{\cdot j} \quad \text{almost surely}$$

Consequently, empirical statistics cannot define independence by checking whether $\hat{p}_{ij} - \hat{p}_{i\cdot} \hat{p}_{\cdot j} = 0$. Rather, statistical independence is framed as a **null hypothesis testing problem**:
$$H_0: p_{ij} = p_{i\cdot} \cdot p_{\cdot j} \quad \forall (i, j) \quad \text{vs.} \quad H_1: \exists (i, j) \text{ s.t. } p_{ij} \neq p_{i\cdot} \cdot p_{\cdot j}$$

The objective is to quantify the probability ($p$-value) that the observed discrepancy $\sum |O_{ij} - E_{ij}|$ could have arisen purely from random sampling variance under the assumption that $H_0$ is true.

| Dimension | Probability Theory | Mathematical Statistics |
| :--- | :--- | :--- |
| **Epistemological Nature** | Deductive, exact, axiomatic | Inductive, empirical, asymptotic |
| **Object of Study** | Measure space $(\Omega, \mathcal{F}, P)$ | Observed dataset $\mathcal{D}_N$ |
| **Condition** | $P(A \cap B) = P(A)P(B)$ identically | $\chi^2$ distance compatible with sampling noise |
| **Decision Rule** | Binary algebraic property | Probabilistic confidence: $p\text{-value} \ge \alpha$ |

---

## 2. Programmatic Construction of the Bivariate Contingency Table

Let categorical variable $X$ have $r$ discrete categories $\{A_1, \dots, A_r\}$, and categorical variable $Y$ have $c$ discrete categories $\{B_1, \dots, B_c\}$.

### 2.1 The Observed Contingency Matrix $\mathbf{O}$

The cross-classification of $N$ bivariate observations produces the $r \times c$ contingency table:

$$\mathbf{O} = \begin{pmatrix}
O_{11} & O_{12} & \cdots & O_{1c} \\
O_{21} & O_{22} & \cdots & O_{2c} \\
\vdots & \vdots & \ddots & \vdots \\
O_{r1} & O_{r2} & \cdots & O_{rc}
\end{pmatrix}$$

where $O_{ij} = \sum_{k=1}^N \mathbb{I}(x_k = A_i \text{ and } y_k = B_j) \in \mathbb{N}_0$.

### 2.2 Marginal Totals and Relative Distributions

1. **Row Marginals (Marginal distribution of $X$):**
   $$R_i = O_{i\cdot} = \sum_{j=1}^c O_{ij}, \qquad f_X(A_i) = \hat{p}_{i\cdot} = \frac{R_i}{N}$$
   satisfying $\sum_{i=1}^r R_i = N$ and $\sum_{i=1}^r f_X(A_i) = 1$.

2. **Column Marginals (Marginal distribution of $Y$):**
   $$C_j = O_{\cdot j} = \sum_{i=1}^r O_{ij}, \qquad f_Y(B_j) = \hat{p}_{\cdot j} = \frac{C_j}{N}$$
   satisfying $\sum_{j=1}^c C_j = N$ and $\sum_{j=1}^c f_Y(B_j) = 1$.

3. **Joint Relative Frequencies:**
   $$f_{X,Y}(A_i, B_j) = \hat{p}_{ij} = \frac{O_{ij}}{N}$$

### 2.3 Directional Conditional Distributions

Statistical association is fundamentally directional when conditioned:

#### Row Conditional Profiles ($Y$ conditioned on $X = A_i$):
$$f_{Y \mid X}(B_j \mid A_i) = \frac{O_{ij}}{R_i} = \frac{\hat{p}_{ij}}{\hat{p}_{i\cdot}}$$
This represents the probability distribution of $Y$ within the sub-population exhibiting attribute $A_i$. Under independence, all rows must have identical conditional distributions equal to the column marginal:
$$H_0 \implies f_{Y \mid X}(B_j \mid A_i) = f_Y(B_j) = \frac{C_j}{N} \quad \forall i$$

#### Column Conditional Profiles ($X$ conditioned on $Y = B_j$):
$$f_{X \mid Y}(A_i \mid B_j) = \frac{O_{ij}}{C_j} = \frac{\hat{p}_{ij}}{\hat{p}_{\cdot j}}$$
Similarly, under independence:
$$H_0 \implies f_{X \mid Y}(A_i \mid B_j) = f_X(A_i) = \frac{R_i}{N} \quad \forall j$$

---

## 3. Derivation of Expected Frequencies Under Independence ($H_0$)

### 3.1 Maximum Likelihood Derivation

Consider the full multinomial model for the contingency table with cell probabilities $p_{ij}$, where $\sum_{i=1}^r \sum_{j=1}^c p_{ij} = 1$. The likelihood of observing the table $\mathbf{O}$ is:
$$L(\{p_{ij}\}) = \frac{N!}{\prod_{i=1}^r \prod_{j=1}^c O_{ij}!} \prod_{i=1}^r \prod_{j=1}^c p_{ij}^{O_{ij}}$$

Under the null hypothesis of independence $H_0$, the cell probabilities factorize as:
$$p_{ij} = u_i \cdot v_j$$
subject to the constraints:
$$\sum_{i=1}^r u_i = 1, \qquad \sum_{j=1}^c v_j = 1$$

The log-likelihood under $H_0$ is:
$$\ln L_0 = \ln(N!) - \sum_{i,j} \ln(O_{ij}!) + \sum_{i=1}^r \sum_{j=1}^c O_{ij} \left( \ln u_i + \ln v_j \right)$$
Using the marginal sums $R_i = \sum_j O_{ij}$ and $C_j = \sum_i O_{ij}$:
$$\ln L_0 = \text{const} + \sum_{i=1}^r R_i \ln u_i + \sum_{j=1}^c C_j \ln v_j$$

We formulate the Lagrangian with multipliers $\lambda$ and $\mu$:
$$\mathcal{L}(u, v, \lambda, \mu) = \sum_{i=1}^r R_i \ln u_i + \sum_{j=1}^c C_j \ln v_j - \lambda \left(\sum_{i=1}^r u_i - 1\right) - \mu \left(\sum_{j=1}^c v_j - 1\right)$$

Taking partial derivatives and equating to zero:
$$\frac{\partial \mathcal{L}}{\partial u_i} = \frac{R_i}{u_i} - \lambda = 0 \implies u_i = \frac{R_i}{\lambda}$$
Summing over all $i \in \{1, \dots, r\}$:
$$\sum_{i=1}^r u_i = \sum_{i=1}^r \frac{R_i}{\lambda} = \frac{N}{\lambda} = 1 \implies \lambda = N \implies \hat{u}_i = \frac{R_i}{N}$$
Similarly for $v_j$:
$$\frac{\partial \mathcal{L}}{\partial v_j} = \frac{C_j}{v_j} - \mu = 0 \implies \hat{v}_j = \frac{C_j}{N}$$

Thus, the Maximum Likelihood Estimate of the cell probability under $H_0$ is:
$$\hat{p}_{ij}^{(0)} = \hat{u}_i \hat{v}_j = \left(\frac{R_i}{N}\right) \left(\frac{C_j}{N}\right)$$

The **expected cell frequency** $E_{ij}$ is the expected count under this MLE probability:
$$\boxed{E_{ij} = N \cdot \hat{p}_{ij}^{(0)} = N \cdot \left(\frac{R_i}{N}\right) \left(\frac{C_j}{N}\right) = \frac{R_i \cdot C_j}{N}}$$

This proves that the expected frequency in cell $(i, j)$ under independence is strictly the product of the corresponding row marginal and column marginal divided by the grand sample total.

---

## 4. Pearson's Chi-Square Test Statistic & Asymptotic Distribution

### 4.1 Pearson's Test Statistic

Karl Pearson (1900) proposed measuring the discrepancy between observed frequencies $O_{ij}$ and expected frequencies $E_{ij}$ via the quadratic discrepancy:
$$\boxed{\chi^2 = \sum_{i=1}^r \sum_{j=1}^c \frac{(O_{ij} - E_{ij})^2}{E_{ij}}}$$

### 4.2 Proof of Degrees of Freedom: $\nu = (r - 1)(c - 1)$

To establish why $\chi^2$ asymptotically follows a central Chi-Square distribution with $(r-1)(c-1)$ degrees of freedom:

1. **Unconstrained Parameter Space:** The table contains $k = r \cdot c$ cells. The observed counts are constrained only by their grand sum $\sum_{i,j} O_{ij} = N$, which removes 1 degree of freedom:
   $$\text{dim}(\Omega) = r \cdot c - 1$$

2. **Null Hypothesis Parameter Space ($H_0$):** Under $H_0$, the cell probabilities are parameterized by the marginal probabilities $\{u_1, \dots, u_r\}$ and $\{v_1, \dots, v_c\}$.
   - Specifying $\{u_i\}$ requires estimating $r - 1$ independent parameters (since $\sum u_i = 1$).
   - Specifying $\{v_j\}$ requires estimating $c - 1$ independent parameters (since $\sum v_j = 1$).
   - Total independent parameters estimated under $H_0$:
     $$\text{dim}(\omega) = (r - 1) + (c - 1) = r + c - 2$$

3. **Asymptotic Degrees of Freedom:** By Fisher's theorem on the asymptotic distribution of generalized likelihood ratio tests and Pearson quadratic forms:
   $$\nu = \text{dim}(\Omega) - \text{dim}(\omega) = (r \cdot c - 1) - (r + c - 2) = r \cdot c - r - c + 1 = \boxed{(r - 1)(c - 1)}$$

---

### 4.3 High-Precision p-Value Computation

The cumulative distribution function of $\chi^2$ with $\nu$ degrees of freedom is:
$$F(\chi^2; \nu) = \frac{\gamma(\nu/2, \chi^2/2)}{\Gamma(\nu/2)}$$
The right-tail survival probability ($p$-value) is the **regularized upper incomplete gamma function**:
$$p = P(X \ge \chi^2) = Q(\nu/2, \chi^2/2) = \frac{\Gamma(\nu/2, \chi^2/2)}{\Gamma(\nu/2)} = 1 - P(\nu/2, \chi^2/2)$$

In our implementation ([independence_engine.js](file:///c:/Users/vince/Documents/Università/Magistrale/Statistic/hw6/independence_engine.js)), this is evaluated to 15 decimal digits using:
- **Lanczos approximation** for the log-gamma function $\ln \Gamma(a)$.
- **Series expansion** for $x < a + 1$:
  $$P(a, x) = \frac{x^a e^{-x}}{\Gamma(a)} \sum_{n=0}^\infty \frac{x^n}{\prod_{k=0}^n (a + k)}$$
- **Lentz's continuous fraction** for $x \ge a + 1$:
  $$Q(a, x) = \frac{e^{-x} x^a}{\Gamma(a)} \left( \frac{1}{x + \frac{1 - a}{1 + \frac{1}{x + \frac{2 - a}{1 + \dots}}}} \right)$$

---

## 5. Cell-Level Diagnostics & Effect Size Metrics

### 5.1 Standardized and Haberman Adjusted Residuals

While the omnibus $\chi^2$ test detects overall dependence, it does not identify which specific cells drive the deviation. We compute two standardized residuals:

1. **Pearson Residuals:**
   $$e_{ij} = \frac{O_{ij} - E_{ij}}{\sqrt{E_{ij}}}$$
   Note that $\sum_{i,j} e_{ij}^2 = \chi^2$.

2. **Haberman Adjusted Standardized Residuals (1973):**
   Accounting for the variance reduction induced by estimating marginals:
   $$\boxed{d_{ij} = \frac{O_{ij} - E_{ij}}{\sqrt{E_{ij} \left(1 - \frac{R_i}{N}\right) \left(1 - \frac{C_j}{N}\right)}}}$$
   Under $H_0$, $d_{ij}$ is asymptotically standard normal:
   $$d_{ij} \xrightarrow{d} \mathcal{N}(0, 1)$$
   - $|d_{ij}| > 1.96 \implies$ statistically significant deviation at $\alpha = 0.05$.
   - $|d_{ij}| > 2.58 \implies$ statistically significant deviation at $\alpha = 0.01$.
   - Positive $d_{ij}$ indicates an **over-represented** combination; negative $d_{ij}$ indicates an **under-represented** combination.

---

### 5.2 Cochran's Small-Sample Validity Rules

The continuous $\chi^2$ distribution is an asymptotic approximation to the discrete multinomial distribution. W. G. Cochran (1954) established the standard criteria for validity:
1. **Minimum Expectation Rule:** No cell may have $E_{ij} < 1.0$.
2. **Sparseness Rule:** No more than $20\%$ of cells may have $E_{ij} < 5.0$.

If either condition is violated, the asymptotic $p$-value can be severely anti-conservative, and exact permutation tests (e.g., Fisher-Freeman-Halton exact test) or category pooling must be utilized.

---

### 5.3 Normalized Effect Size Measures

The Chi-Square statistic scales linearly with sample size: doubling $N$ while keeping relative proportions fixed doubles $\chi^2$. Hence, $\chi^2$ measures **statistical evidence against $H_0$**, not the **strength of association**.

To assess association strength independently of $N$:

#### 1. Cramér's $V$
$$V = \sqrt{\frac{\chi^2}{N \cdot \min(r - 1, c - 1)}}$$
- Bounds: $0 \le V \le 1$.
- $V = 0 \iff$ complete statistical independence.
- $V = 1 \iff$ complete deterministic association.

#### 2. Pearson's Contingency Coefficient $C$
$$C = \sqrt{\frac{\chi^2}{\chi^2 + N}}, \qquad C_{\max} = \sqrt{\frac{\min(r, c) - 1}{\min(r, c)}}, \qquad C_{\text{norm}} = \frac{C}{C_{\max}}$$

#### 3. Tschuprow's $T$
$$T = \sqrt{\frac{\chi^2}{N \sqrt{(r - 1)(c - 1)}}}$$

#### 4. Odds Ratio (OR) and Relative Risk (RR) for $2 \times 2$ Tables
For binary classifications:
$$\text{OR} = \frac{O_{11} O_{22}}{O_{12} O_{21}}$$
The asymptotic $95\%$ Wald confidence interval for $\ln(\text{OR})$ is:
$$\text{SE}(\ln \text{OR}) = \sqrt{\frac{1}{O_{11}} + \frac{1}{O_{12}} + \frac{1}{O_{21}} + \frac{1}{O_{22}}}$$
$$\text{CI}_{95\%} = \exp\left( \ln(\text{OR}) \pm 1.96 \cdot \text{SE}(\ln \text{OR}) \right)$$

---

## 6. Distinguishing Statistical Association from Causality

The most critical conceptual insight in bivariate data analysis is that:
$$\boxed{\text{Statistical Dependence (Association)} \centernot\implies \text{Causality}}$$

A statistically significant result ($p < 0.001$) proves that $P(Y \mid X) \ne P(Y)$, but provides **zero evidence** that manipulating $X$ will cause a change in $Y$.

### 6.1 Reichenbach's Common Cause Principle

Whenever two variables $X$ and $Y$ are statistically dependent ($X \not\perp\!\!\!\perp Y$), probability theory dictates that at least one of three structural configurations must hold:
1. **Direct Causation ($X \to Y$):** $X$ causes $Y$.
2. **Reverse Causation ($Y \to X$):** $Y$ causes $X$.
3. **Confounding ($X \leftarrow Z \to Y$):** An unobserved common cause $Z$ drives both $X$ and $Y$.

$$\begin{array}{ccc}
\text{Direct Causation} & \text{Reverse Causation} & \text{Confounding (Spurious)} \\
X \longrightarrow Y & X \longleftarrow Y & X \longleftarrow Z \longrightarrow Y
\end{array}$$

#### Classic Example of Spurious Correlation:
- Variable $X$: Daily Ice Cream Sales in a coastal city.
- Variable $Y$: Daily Drowning Incidents.
A Chi-Square test yields $\chi^2 = 84.2$, $p < 10^{-19}$ (massive statistical dependence). However, eating ice cream does not cause drowning. The underlying confounder $Z$ is **Ambient Temperature**: hot summer weather increases both beach attendance (drowning risk) and ice cream consumption.

---

### 6.2 Simpson's Paradox: The Mathematical Proof of Causal Inversion

Simpson's paradox represents the most extreme hazard of confounding: **a statistical association observed in aggregate data can completely reverse its sign when conditioning on a confounder $Z$**.

#### Mathematical Condition for Simpson's Paradox
Let $X \in \{1, 2\}$ be treatment hospital, $Y \in \{0, 1\}$ be patient survival, and $Z \in \{1, 2\}$ be patient initial condition (Mild vs. Severe).

Simpson's paradox occurs when:
$$P(Y = 1 \mid X = 1, Z = z) > P(Y = 1 \mid X = 2, Z = z) \quad \forall z \in \{1, 2\}$$
yet in the marginal distribution:
$$P(Y = 1 \mid X = 1) < P(Y = 1 \mid X = 2)$$

#### Algebraic Proof via the Law of Total Probability:
$$P(Y = 1 \mid X = x) = \sum_{z=1}^2 P(Y = 1 \mid X = x, Z = z) \cdot P(Z = z \mid X = x)$$
The marginal probability is a **weighted average** of the stratum-specific conditional probabilities, where the weights are $w_x(z) = P(Z = z \mid X = x)$.

If treatment allocation is confounded—meaning patient severity dictates hospital assignment ($P(Z = 2 \mid X = 1) \gg P(Z = 2 \mid X = 2)$)—the heavier weight placed on the low-survival severe stratum for Hospital 1 will drag its marginal average down, even if Hospital 1 is strictly superior in every single patient stratum.

#### Numerical Demonstration from Preloaded Engine Benchmark:

1. **Stratum 1: Mild Patients ($Z = 1$)**
   - Hospital A: $\frac{590}{600} = \mathbf{98.3\%}$ survival
   - Hospital B: $\frac{870}{900} = \mathbf{96.7\%}$ survival
   - *Verdict:* Hospital A is superior.

2. **Stratum 2: Severe Patients ($Z = 2$)**
   - Hospital A: $\frac{320}{400} = \mathbf{80.0\%}$ survival
   - Hospital B: $\frac{70}{100} = \mathbf{70.0\%}$ survival
   - *Verdict:* Hospital A is superior.

3. **Aggregated (Marginal) Cohort ($N = 2000$)**
   - Hospital A: $\frac{910}{1000} = \mathbf{91.0\%}$ survival
   - Hospital B: $\frac{940}{1000} = \mathbf{94.0\%}$ survival
   - *Verdict:* Hospital B appears superior ($\chi^2 = 6.25, p = 0.012$)!

This proves conclusively that decisions based on marginal contingency tables can lead to catastrophic medical or engineering errors when confounding is ignored.

---

### 6.3 Judea Pearl’s Causal Hierarchy and the $do$-Calculus

To bridge statistical association and causation, Judea Pearl formulated the **Causal Hierarchy**:
1. **Layer 1: Association ($P(y \mid x)$):** What does seeing $X = x$ tell us about $Y$? (Answered by our Chi-Square test).
2. **Layer 2: Intervention ($P(y \mid do(X = x))$):** What will happen to $Y$ if we actively set $X = x$? (Answered by Randomized Controlled Trials).
3. **Layer 3: Counterfactuals ($P(y_x \mid x', y')$):** What would have happened if we had acted differently?

Statistical independence tests operate strictly on **Layer 1**. Establishing causal validity requires:
- **Randomized Controlled Trials (RCT):** Random assignment breaks all back-door paths ($Z \to X$), ensuring $P(y \mid do(x)) = P(y \mid x)$.
- **Back-Door Criterion / Causal Graphs:** Conditioning on all confounders $Z$ that block non-causal paths between $X$ and $Y$.

---

## 7. Numerical Verification & Suite Architecture

The computational engine developed for Homework 6 ([independence_engine.js](file:///c:/Users/vince/Documents/Università/Magistrale/Statistic/hw6/independence_engine.js)) provides:
- Exact arbitrary $r \times c$ table contingency aggregation.
- Real-time computation of marginals, conditionals, and expected counts.
- Exact $\chi^2$ asymptotic test with gamma $p$-values.
- Comprehensive effect-size extraction (Cramér's $V$, Contingency Coefficient, Odds Ratios).
- Mosaic visualizer representing conditional splits and residual deviations.
- Complete Simpson's Paradox decomposition across multi-layer strata.

### Summary Verification Table

| Dataset Benchmark | Dimension $r \times c$ | Sample $N$ | $\chi^2$ Statistic | $df$ | $p$-value | Cramér's $V$ | Statistical Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Cybersecurity Incidents** | $3 \times 3$ | 740 | 193.364 | 4 | $1.00 \times 10^{-40}$ | 0.3615 | **Reject $H_0$ (Strong Dependence)** |
| **Clinical Trial (Antiviral)** | $2 \times 2$ | 400 | 148.847 | 1 | $3.09 \times 10^{-34}$ | 0.6099 | **Reject $H_0$ (OR = 13.78, Extreme)** |
| **Academic Learning Modality** | $3 \times 2$ | 600 | 62.069 | 2 | $3.33 \times 10^{-14}$ | 0.3216 | **Reject $H_0$ (Moderate Association)** |
| **CSPRNG Bit Uniformity** | $2 \times 2$ | 10000 | 0.1296 | 1 | 0.7188 | 0.0036 | **Fail to Reject $H_0$ (Independent)** |
| **Simpson Pooled Hospital** | $2 \times 2$ | 2000 | 6.250 | 1 | 0.0124 | 0.0559 | **Reject $H_0$ (Spurious Reversal)** |
| **Simpson Stratum: Mild** | $2 \times 2$ | 1500 | 4.138 | 1 | 0.0419 | 0.0525 | **Hospital A Superior in Stratum** |
| **Simpson Stratum: Severe** | $2 \times 2$ | 500 | 4.267 | 1 | 0.0389 | 0.0924 | **Hospital A Superior in Stratum** |

---

### Concluding Remarks

1. **Statistical independence** is an asymptotic property evaluated through the lens of sampling variance. Finite sample empirical frequencies virtually never satisfy exact factorization.
2. **Pearson's $\chi^2$ test** provides an exact, asymptotically justified framework for testing independence, with degrees of freedom determined by the dimensionality reduction $(r-1)(c-1)$.
3. **Cramér's $V$ and effect sizes** must accompany every hypothesis test to decouple sample size $N$ from association strength.
4. **Association is not causation**: Simpson's paradox demonstrates that marginal statistical dependence can completely invert reality without causal adjustment and stratification.
