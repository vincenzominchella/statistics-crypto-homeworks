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
| **Portal Hub** | `/` | [https://vincenzominchella.github.io/statistics-crypto-homeworks/](https://vincenzominchella.github.io/statistics-crypto-homeworks/) |

---

## 🌟 Highlights & Project Contents

### 1. Root Hub Portal (`index.html`, `style.css`)
- Central landing page with luxury interactive cards linking directly to `./hw1/` and `./hw2/`.
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
  - **Technical Deep Dive:** Sponge vs Merkle-Damgård, resistance to length extension attacks, and Ethereum Keccak-256 vs NIST SHA3-256 padding difference (`0x01` vs `0x06`).
- **Academic Paper (`hw2/Homework2_Report.md`)**: Complete, formal technical report with KaTeX-rendered equations.

---

## 🚀 How to Run Locally

### Option A: Open Directly in Browser
Open `index.html` (portal), `hw1/index.html` (Module 1), or `hw2/index.html` (Module 2) directly in any modern browser (Chrome, Edge, Firefox, Safari).

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
├── app.js                       # Shared/root coordinator
├── hw1_ecc.js                   # Root mirror
├── hw2_wallet.js                # Root mirror
├── bip39_wordlist.js            # Root mirror
├── Homework1_Report.md          # Root mirror
├── Homework2_Report.md          # Root mirror
└── README.md                    # Project documentation and summary
```

---

## 🧪 Verification & Test Vectors

You can verify the calculations at any time using Node.js:

```bash
# Test Homework 2 pipeline against official Ethereum test vector:
node -e "
global.window = global;
require('./hw2/bip39_wordlist.js');
require('./hw2/hw2_wallet.js');
const pipe = new window.EthereumWalletPipeline();
pipe.deriveFullPipeline('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')
  .then(res => {
    console.log('Derived Address:', res.checksummedAddress);
    console.log('Expected Address:', '0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
    console.log('Match:', res.checksummedAddress === '0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });
"
```

Output:
```
Derived Address: 0x9858EfFD232B4033E47d90003D41EC34EcaEda94
Expected Address: 0x9858EfFD232B4033E47d90003D41EC34EcaEda94
Match: true
```
