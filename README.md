# Elliptic Curve & Cryptographic Key Derivation Suite
## Interactive Engineering Toolkit: Modular ECC & Ethereum Key Derivation

This repository contains the complete, production-grade implementation, interactive visualization application, and technical specifications for Elliptic Curve Cryptography ($y^2 \equiv x^3 + 7 \pmod{17}$, SECP256K1) and the Full Ethereum Wallet Derivation Pipeline.

---

## 🌟 Highlights & Project Contents

1. **Interactive Web Application (`index.html`, `style.css`, `app.js`, `hw1_ecc.js`, `hw2_wallet.js`, `bip39_wordlist.js`)**:
   - Zero external npm or build dependencies: pure native HTML5, modern vanilla CSS3 (dark luxury academic theme with glassmorphism), and ECMAScript with `BigInt`, Web Canvas, and WebCrypto APIs.
   - Works immediately offline by opening `index.html` in any modern web browser or via a local static server.

2. **Homework 1: Toy ECC ($y^2 \equiv x^3 + 7 \pmod{17}$) & SECP256K1 Explorer**:
   - **Scalar Multiplication:** Generates public key $Q = kG$ for base point $G = (1, 5)$ and private key $k = 6$, yielding $Q = (5, 8)$.
   - **Visual Animation (Plot of the Toy Curve):**
     - Step-by-step interactive playback with play/pause, step forward/backward, reset, and speed slider.
     - **Discrete Torus Grid ($\\mathbb{F}_{17} \\times \\mathbb{F}_{17}$):** showing modular wraparound lines, point doubling chords, and vertical reflection across  = (17 - y) \\pmod{17}.\n   - **Double-and-Add vs Naive Addition:** Step-by-step complexity comparison ($O(\log k)$ vs $O(k)$).
   - **Group Theory Inspector:** Classifies all 18 points of $E(\mathbb{F}_{17})$, orders of all elements, and the order-9 cyclic subgroup $\langle G \rangle$.
   - **Statistical Exploration Lab:**
     - Marginal distributions of $X$ and $Y$ coordinates with live canvas histograms.
     - Quadratic residuosity and why $y$ coordinates cannot be uniformly distributed.
     - Bit frequency and balance across coordinates (Shannon entropy $H(X)$ vs $\log_2(17)$).
     - Goodness-of-Fit Pearson's $\chi^2$ test against discrete uniform distribution $U\{0, 16\}$.
     - Input-Output correlation (Pearson $r$ and Spearman $\rho$).
     - Strict Avalanche Criterion (SAC) measurement.
     - Theoretical discussion: One-Way Function (OWF) based on ECDLP vs Cryptographic Hash Function.
   - **Blockchain Research:** Modern applications of cryptography and statistics in Bitcoin (Schnorr/Taproot, Poisson mining arrivals), Ethereum (Keccak-256, BLS12-381, RANDAO/VDF), Monero/Zcash (zk-SNARKs, Bulletproofs), and Solana/Polkadot (Proof of History, VRF).

3. **Homework 2: From Wallet Seed to Ethereum Address**:
   - **Live Cryptographic Pipeline:** Real live derivation from BIP-39 mnemonic (12 or 24 words) $\to$ PBKDF2 HMAC-SHA512 (2048 rounds) $\to$ BIP-32 root node $\to$ BIP-44 path (`m/44'/60'/0'/0/0`) $\to$ secp256k1 point multiplication $\to$ Keccak-256 sponge hash $\to$ raw 20-byte address $\to$ EIP-55 mixed-case checksum encoding.
   - Verified against MetaMask and standard Ian Coleman reference test vectors (`abandon abandon ... about` $\to$ `0x9858EfFD232B4033E47d90003D41EC34EcaEda94`).
   - **Interactive EIP-55 Inspector:** Tile grid visualizing letter capitalization based on Keccak nibbles $\ge 8$.
   - **Live Avalanche Lab:** Measure bit diffusion when flipping 1 word or 1 bit in mnemonic.
   - **Conceptual Matrix:** Precise theoretical distinctions between Key Generation vs Key Derivation, Public-Key Cryptography, Hashing, Checksums, and Encoding.
   - **Historical Timeline:** Interactive chronological trajectory from RSA (1977) to EIP-55 (2016).
   - **Technical Deep Dive:** Merkle-Damgård vs Sponge construction, length extension attacks, and why Ethereum's Keccak-256 differs from NIST SHA3-256 (padding `0x01` vs `0x06`).
   - **System Design Rationale:** Why Ethereum uses a multi-primitive architecture instead of a single algorithm.

4. **Standalone Comprehensive Academic Reports**:
   - `Homework1_Report.md`: Full 15-page equivalent formal paper for Homework 1.
   - `Homework2_Report.md`: Full 15-page equivalent formal paper for Homework 2.

---

## 🚀 How to Run the Web Application

### Option A: Open Directly in Browser
Simply double-click or open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari, Brave).

### Option B: Run via Local HTTP Server (e.g., Python / Node)
From the project directory:

```bash
# Using Python
python -m http.server 8000

# Or using Node
npx serve .
```

Then open `http://localhost:8000` in your browser.

---

## 📁 Repository Directory Structure

```
├── index.html              # Main application web dashboard
├── style.css               # Luxury dark academic theme stylesheet
├── app.js                  # Application coordinator and UI controller
├── hw1_ecc.js              # ECC finite field math, animation & statistical engine
├── hw2_wallet.js           # BIP-39, BIP-32, secp256k1, Keccak-256 & EIP-55 pipeline
├── bip39_wordlist.js       # Standard 2048-word English dictionary
├── Homework1_Report.md     # Full academic submission paper for Homework 1
├── Homework2_Report.md     # Full academic submission paper for Homework 2
└── README.md               # Project documentation and summary
```

---

## 🧪 Verification & Test Vectors

You can verify the calculations at any time using Node.js:

```bash
# Test Homework 2 pipeline against official Ethereum test vector:
node -e "
global.window = global;
require('./bip39_wordlist.js');
require('./hw2_wallet.js');
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
