# Elliptic Curve & Cryptographic Key Derivation Suite
## Interactive Engineering Toolkit: Modular ECC & Ethereum Key Derivation

This repository contains the complete implementation, interactive visualization laboratories, and technical specifications for Elliptic Curve Cryptography ($y^2 \equiv x^3 + 7 \pmod{17}$, SECP256K1) and the Full Ethereum Wallet Derivation Pipeline.

---

## 🌐 Live GitHub Pages Deployments

The project is organized into an entry hub portal with two completely decoupled submodules:

| Module | Directory | Direct Live Deployment Link |
|---|---|---|
| **Homework 1** | `hw1/` | [https://vincenzominchella.github.io/statistics-crypto-homeworks/hw1/](https://vincenzominchella.github.io/statistics-crypto-homeworks/hw1/) |
| **Homework 2** | `hw2/` | [https://vincenzominchella.github.io/statistics-crypto-homeworks/hw2/](https://vincenzominchella.github.io/statistics-crypto-homeworks/hw2/) |
| **ECC vs Caesar** | `ECCvsCaesarCipher/` | [https://vincenzominchella.github.io/statistics-crypto-homeworks/ECCvsCaesarCipher/](https://vincenzominchella.github.io/statistics-crypto-homeworks/ECCvsCaesarCipher/) |
| **Homework 3** | `hw3/` | [https://vincenzominchella.github.io/statistics-crypto-homeworks/hw3/](https://vincenzominchella.github.io/statistics-crypto-homeworks/hw3/) |
| **Portal Hub** | `/` | [https://vincenzominchella.github.io/statistics-crypto-homeworks/](https://vincenzominchella.github.io/statistics-crypto-homeworks/) |

---

## 🌟 Highlights & Project Contents

### 1. Root Hub Portal (`index.html`, `style.css`)
- Central landing page with luxury interactive cards linking directly to `./hw1/`, `./hw2/`, `./ECCvsCaesarCipher/`, and `./hw3/`.
- Pure native client-side web application with responsive glassmorphism dark aesthetic.

### 2. Homework 1 Standalone Submodule (`hw1/`)
- **Interactive Web App & Visualizer (`hw1/index.html`, `hw1/app_hw1.js`, `hw1/hw1_ecc.js`)**:
  - **Scalar Multiplication:** Computes public key $Q = kG$ on Weierstrass toy curve $E(\mathbb{F}_{17}): y^2 \equiv x^3 + 7 \pmod{17}$ with base generator $G = (1, 5)$ and private key $k = 6$, yielding public key $Q = (5, 8)$.
  - **Finite Field Grid Visualizer:** Step-by-step playback with play/pause, step-by-step stepping, chord lines, tangent slopes, and modular vertical reflection across $y \equiv -y \pmod{17}$.
  - **Double-and-Add vs Naive Addition:** Step-by-step complexity comparison demonstrating logarithmic $O(\log k)$ performance.
  - **Group Theory Inspector:** Full 18-point classification, element orders, and generator orbits.
  - **Empirical Statistics:** Marginal coordinate histograms, quadratic residuosity verification, Shannon bit entropy $H(X)$, Pearson's $\chi^2$ goodness-of-fit test, and Strict Avalanche Criterion (SAC) bit diffusion.
  - **Blockchain Research:** Modern survey of cryptographic primitives and statistical methods across Bitcoin, Ethereum, Monero, Zcash, Solana, and Polkadot.
- **Academic Paper (`hw1/Homework1_Report.md`)**: Complete, formal technical report with KaTeX-rendered equations.

### 3. Homework 2 Standalone Submodule (`hw2/`)
- **Interactive Web App & Derivation Pipeline (`hw2/index.html`, `hw2/app_hw2.js`, `hw2/hw2_wallet.js`, `hw2/bip39_wordlist.js`)**:
  - **8-Stage Live Pipeline:** Pure native client-side execution from BIP-39 mnemonic (12 or 24 words) $\to$ PBKDF2 HMAC-SHA512 (2048 iterations) $\to$ BIP-32 root node $\to$ BIP-44 path (`m/44'/60'/0'/0/0`) $\to$ secp256k1 point multiplication $\to$ Keccak-256 sponge hash $\to$ raw 20-byte address $\to$ EIP-55 mixed-case checksum encoding.
  - Verified against MetaMask and standard Ian Coleman reference test vectors (`abandon abandon ... about` $\to$ `0x9858EfFD232B4033E47d90003D41EC34EcaEda94`).
  - **Interactive EIP-55 Inspector:** Live character tile grid highlighting capitalization decisions based on Keccak nibbles $\ge 8$.
  - **Live Pipeline Avalanche Lab:** Bit-diffusion and Hamming distance measurement when mutating 1 word or 1 bit in mnemonic.
  - **Conceptual Matrix:** Mathematical distinctions between Key Generation vs Key Derivation, Public-Key Cryptography, Hashing, Checksums, and Encoding.
  - **Historical Timeline:** Interactive chronological trajectory from RSA (1977) to EIP-55 (2016).
- **Academic Paper (`hw2/Homework2_Report.md`)**: Complete, formal technical report with KaTeX-rendered equations.

### 4. ECC vs Caesar Cipher Standalone Submodule (`ECCvsCaesarCipher/`)
- **Interactive Web App & Cryptanalysis Lab (`ECCvsCaesarCipher/index.html`, `ECCvsCaesarCipher/app_ecc_caesar.js`, `ECCvsCaesarCipher/ecc_caesar_engine.js`)**:
  - **Toy secp256k1 Asymmetric Scheme:** Alice keypair $(d_A, Q_A)$, Bob ephemeral keypair $(r, R)$, Diffie-Hellman shared secret point $S = r Q_A = d_A R$, keystream derivation $K = \text{KDF}(S_x)$, and character masking.
  - **Symmetric Caesar Cipher:** Modular shift $C_i = (M_i + k) \pmod{26}$ with key space $|\mathcal{K}| = 26$ and 100% frequency preservation.
  - **Caesar Statistical Cryptanalysis:** Live Pearson $\chi^2$ Goodness-of-Fit test across all 26 shifts, Dot-Product correlation, and Index of Coincidence (IoC).
  - **Multi-Length Benchmark Simulation:** Monte Carlo accuracy testing across variable lengths ($N \in [5..500]$), demonstrating empirical convergence to Shannon's unicity distance.
  - **Algebraic ECDLP Cryptanalysis (BSGS):** Shanks' Baby-Step Giant-Step algorithm recovering private key $d_A$ in $O(\sqrt{K_{\max}})$ operations ($< 15$ ms) and directly decrypting the message.
  - **Thermodynamic Feasibility Analysis:** Physical and informational proof of why generic discrete logarithm attacks require $O(2^{128})$ operations on 256-bit curves, making them impervious to classical cryptanalysis.
- **Academic Paper (`ECCvsCaesarCipher/Homework_Report.md`)**: Peer-review grade formal specification with proofs, formulas, and protocol security analysis.

### 5. Homework 3 Standalone Submodule (`hw3/`)
- **Interactive Web App & Stochastic Simulation Suite (`hw3/index.html`, `hw3/app_hw3.js`, `hw3/stochastic_engine.js`)**:
  - **Multi-Agent Penetration Dynamics:** Models $n$ sequential systems and $m$ attackers using IID increment processes (Bernoulli $X_i \in \{0, 1\}$ and symmetric Rademacher $X_i \in \{-1, +1\}$).
  - **Three Score Quantities:** Total score $S_n$, Average score $S_n/n$, and Normalized score $S_n/\sqrt{n}$.
  - **Interactive Trajectory Visualizer:** Live multi-path rendering with theoretical $\pm 1\sigma, \pm 2\sigma$ envelope bands and 3-pane synchronized scaling comparator.
  - **Law of Large Numbers (LLN):** Real-time convergence in probability of $S_n/n \to \mu$ with tolerance margin $\epsilon$ and Chebyshev variance decay $\sigma^2/n$.
  - **Central Limit Theorem (CLT):** Histogram density fitting against continuous Gaussian curve $\phi(z) = \frac{1}{\sqrt{2\pi}} e^{-z^2/2}$, Kolmogorov-Smirnov goodness-of-fit, and Normal Q-Q plots.
  - **Cyber Security Scenario Analysis:** Translates mathematical moments into defense-in-depth metrics and extreme-value attacker swarm breach risks ($\max_j S_n^{(j)} \sim \sqrt{2n \ln m}$).
- **Academic Paper (`hw3/Homework3_Report.md`)**: Peer-review grade formal specification with characteristic function proofs, Berry-Esseen bounds, and cyber security interpretations.

---

## 🚀 How to Run Locally

### Option A: Open Directly in Browser
Open `index.html` (portal), `hw1/index.html` (Module 1), `hw2/index.html` (Module 2), `ECCvsCaesarCipher/index.html` (Module 3), or `hw3/index.html` (Module 4) directly in any modern browser.

### Option B: Run via Local HTTP Server
From the project root:

```bash
# Using Python
python -m http.server 8000

# Or using Node
npx serve .
```

Then navigate to:
- `http://localhost:8000/` (Landing portal)
- `http://localhost:8000/hw1/` (Homework 1 standalone)
- `http://localhost:8000/hw2/` (Homework 2 standalone)
- `http://localhost:8000/ECCvsCaesarCipher/` (ECC vs Caesar Cipher standalone)
- `http://localhost:8000/hw3/` (Homework 3 standalone)

---

## 📁 Repository Directory Structure

```
├── index.html                   # Central landing portal with navigation cards
├── style.css                    # Design system & dark theme stylesheet
├── hw1/                         # Standalone Module 1: ECC & Statistics
│   ├── index.html               # Dedicated Homework 1 page (Lab + Report)
│   ├── app_hw1.js               # UI coordinator & markdown renderer for HW1
│   ├── hw1_ecc.js               # ECC math engine & statistical testing suite
│   ├── style.css                # Scoped stylesheet for HW1
│   └── Homework1_Report.md      # Full academic report for Homework 1
├── hw2/                         # Standalone Module 2: HD Wallet Derivation
│   ├── index.html               # Dedicated Homework 2 page (Pipeline + Report)
│   ├── app_hw2.js               # UI coordinator & reactive state for HW2
│   ├── hw2_wallet.js            # BIP-39/32/44, secp256k1 & Keccak-256 engine
│   ├── bip39_wordlist.js        # Standard 2048-word English dictionary
│   ├── style.css                # Scoped stylesheet for HW2
│   └── Homework2_Report.md      # Full academic report for Homework 2
├── ECCvsCaesarCipher/           # Standalone Module 3: ECC vs Caesar Cryptanalysis
│   ├── index.html               # Dedicated page (Lab + Formal Report)
│   ├── app_ecc_caesar.js        # UI coordinator, canvas charts & attack telemetry
│   ├── ecc_caesar_engine.js     # Pure BigInt secp256k1 math, Caesar & BSGS engine
│   ├── style.css                # Scoped stylesheet for Module 3
│   └── Homework_Report.md       # Peer-review formal paper with KaTeX formulas
├── hw3/                         # Standalone Module 4: Stochastic Penetration & Limit Theorems
│   ├── index.html               # Dedicated Homework 3 page (Lab + Formal Report)
│   ├── app_hw3.js               # UI coordinator, Canvas multi-path & CLT renderers
│   ├── stochastic_engine.js     # Bernoulli, Rademacher, LLN, CLT & moments engine
│   ├── style.css                # Scoped stylesheet for HW3
│   └── Homework3_Report.md      # Full academic report with KaTeX proofs
└── README.md                    # Project documentation and summary
```

---

## 🧪 Verification & Test Vectors

You can verify all modules using Node.js:

```bash
# Test ECC vs Caesar Cipher and BSGS attack:
node -e "
const Engine = require('./ECCvsCaesarCipher/ecc_caesar_engine.js');
const alice = Engine.toyEccKeygen(65535, 12345);
const enc = Engine.toyEccEncrypt('ATTACKATDAWN', alice.publicKey, 65535, 9999);
const dec = Engine.toyEccDecrypt(enc.ciphertext, enc.ephemeralPoint, alice.privateKey);
console.log('ECC Decrypted matches:', dec.decryptedText === 'ATTACKATDAWN');
const bsgs = Engine.solveEcdlpBSGS(alice.publicKey, 65535);
console.log('BSGS Recovered Key:', bsgs.recoveredScalar.toString(), 'Match:', bsgs.recoveredScalar === alice.privateKey);
"
```
