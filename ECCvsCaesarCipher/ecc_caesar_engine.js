/**
 * ECCvsCaesarCipher - Cryptographic & Cryptanalysis Engine
 * SECP256K1 Pure BigInt Group Arithmetic, Toy Asymmetric Scheme,
 * Caesar Cipher, Statistical Frequency Cryptanalysis, and
 * Baby-Step Giant-Step (BSGS) ECDLP Attack Suite.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ECCvsCaesarEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // =========================================================================
  // 1. SECP256K1 CURVE CONSTANTS & AFFINE POINT ARITHMETIC (Pure BigInt)
  // =========================================================================

  const SECP256K1 = {
    // Prime field modulus p = 2^256 - 2^32 - 977
    p: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn,
    // Order of the base point G
    n: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n,
    // Weierstrass coefficients y^2 = x^3 + ax + b
    a: 0n,
    b: 7n,
    // Generator Base Point G coordinates
    Gx: 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n,
    Gy: 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n
  };

  const G_POINT = { x: SECP256K1.Gx, y: SECP256K1.Gy };

  /**
   * Modular inverse using Extended Euclidean Algorithm: a^-1 mod m
   */
  function modInv(a, m) {
    let [m0, y, x] = [m, 0n, 1n];
    let aMod = ((a % m) + m) % m;
    while (aMod > 1n) {
      if (m0 === 0n) throw new Error("Modular inverse does not exist");
      const q = aMod / m0;
      let t = m0;
      m0 = aMod % m0;
      aMod = t;
      t = y;
      y = x - q * y;
      x = t;
    }
    if (x < 0n) x += m;
    return x;
  }

  /**
   * Affine Point Addition on secp256k1: P1 + P2
   */
  function pointAdd(p1, p2) {
    if (!p1) return p2;
    if (!p2) return p1;

    const { x: x1, y: y1 } = p1;
    const { x: x2, y: y2 } = p2;

    // Check if points are additive inverses: P + (-P) = O
    if (x1 === x2 && (y1 + y2) % SECP256K1.p === 0n) {
      return null; // Point at infinity
    }

    let lambda;
    if (x1 === x2 && y1 === y2) {
      // Point doubling: lambda = (3 * x1^2 + a) / (2 * y1)
      if (y1 === 0n) return null;
      const num = (3n * x1 * x1 + SECP256K1.a) % SECP256K1.p;
      const den = (2n * y1) % SECP256K1.p;
      lambda = (num * modInv(den, SECP256K1.p)) % SECP256K1.p;
    } else {
      // Point addition: lambda = (y2 - y1) / (x2 - x1)
      let dy = (y2 - y1) % SECP256K1.p;
      if (dy < 0n) dy += SECP256K1.p;
      let dx = (x2 - x1) % SECP256K1.p;
      if (dx < 0n) dx += SECP256K1.p;
      lambda = (dy * modInv(dx, SECP256K1.p)) % SECP256K1.p;
    }

    // x3 = lambda^2 - x1 - x2 (mod p)
    let x3 = (lambda * lambda - x1 - x2) % SECP256K1.p;
    if (x3 < 0n) x3 += SECP256K1.p;

    // y3 = lambda * (x1 - x3) - y1 (mod p)
    let y3 = (lambda * (x1 - x3) - y1) % SECP256K1.p;
    if (y3 < 0n) y3 += SECP256K1.p;

    return { x: x3, y: y3 };
  }

  /**
   * Point Negation: -P = (x, -y mod p)
   */
  function pointNeg(pt) {
    if (!pt) return null;
    const negY = (SECP256K1.p - (pt.y % SECP256K1.p)) % SECP256K1.p;
    return { x: pt.x, y: negY };
  }

  /**
   * Point Subtraction: P1 - P2 = P1 + (-P2)
   */
  function pointSub(p1, p2) {
    return pointAdd(p1, pointNeg(p2));
  }

  /**
   * Scalar Point Multiplication: k * P via Double-and-Add algorithm
   */
  function pointMul(k, pt) {
    if (!pt || k === 0n) return null;
    let scalar = BigInt(k) % SECP256K1.n;
    if (scalar < 0n) scalar += SECP256K1.n;
    if (scalar === 0n) return null;

    let res = null;
    let cur = { x: pt.x, y: pt.y };

    while (scalar > 0n) {
      if (scalar & 1n) {
        res = pointAdd(res, cur);
      }
      cur = pointAdd(cur, cur);
      scalar >>= 1n;
    }
    return res;
  }

  /**
   * Serialize point to compressed hex format: 02/03 + 64-char hex X
   */
  function serializePoint(pt) {
    if (!pt) return 'INF';
    const prefix = pt.y % 2n === 0n ? '02' : '03';
    return prefix + pt.x.toString(16).padStart(64, '0');
  }

  // =========================================================================
  // 2. CAESAR CIPHER IMPLEMENTATION (Symmetric Classic Primitive)
  // =========================================================================

  /**
   * Clean string keeping only standard A-Z characters uppercase
   */
  function normalizeText(text) {
    return (text || '').toUpperCase().replace(/[^A-Z]/g, '');
  }

  /**
   * Encrypt text using Caesar shift k: C = (P + k) mod 26
   */
  function caesarEncrypt(plaintext, shift) {
    const k = ((shift % 26) + 26) % 26;
    let ciphertext = '';
    for (let i = 0; i < plaintext.length; i++) {
      const code = plaintext.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        ciphertext += String.fromCharCode(65 + ((code - 65 + k) % 26));
      } else if (code >= 97 && code <= 122) {
        ciphertext += String.fromCharCode(97 + ((code - 97 + k) % 26));
      } else {
        ciphertext += plaintext[i];
      }
    }
    return ciphertext;
  }

  /**
   * Decrypt text using Caesar shift k: P = (C - k) mod 26
   */
  function caesarDecrypt(ciphertext, shift) {
    return caesarEncrypt(ciphertext, (26 - (shift % 26)) % 26);
  }

  // =========================================================================
  // 3. TOY ECC ASYMMETRIC SCHEME (secp256k1 with Restricted Key Space)
  // =========================================================================

  /**
   * Generates a Keystream array of modular shifts [k0, k1, ...] in [0..25]
   * deterministically from a 256-bit BigInt shared secret coordinate S_x.
   * Emulates a robust Key Derivation Function (KDF).
   */
  function deriveKeystream(sharedSecretX, length) {
    const keystream = [];
    let state = sharedSecretX;
    // Linear Congruential Generator + Bit Mixing seeded by S_x
    const mul = 6364136223846793005n;
    const inc = 1442695040888963407n;
    const mask64 = 0xFFFFFFFFFFFFFFFFn;

    for (let i = 0; i < length; i++) {
      state = ((state * mul) + inc) & mask64;
      // Mix high and low bits to avoid short-cycle artifacts
      const mixed = Number(((state >> 32n) ^ (state & 0xFFFFFFFFn)) % 26n);
      keystream.push((mixed + 26) % 26);
    }
    return keystream;
  }

  /**
   * Toy ECC Keypair Generation:
   * Private key d chosen uniformly in restricted range [1, maxKeyRange]
   * Public key Q = d * G
   */
  function toyEccKeygen(maxKeyRange = 65535, fixedD = null) {
    const range = Math.max(16, maxKeyRange);
    let d;
    if (fixedD !== null && fixedD !== undefined) {
      d = BigInt(Math.max(1, Math.min(range, fixedD)));
    } else {
      d = BigInt(Math.floor(Math.random() * (range - 1)) + 1);
    }
    const Q = pointMul(d, G_POINT);
    return {
      privateKey: d,
      publicKey: Q,
      maxKeyRange: range,
      serializedPub: serializePoint(Q)
    };
  }

  /**
   * Toy ECC Encryption (Diffie-Hellman / ElGamal Style Hybrid Masking):
   * 1. Bob picks ephemeral scalar r in [1, maxKeyRange]
   * 2. Bob computes ephemeral public commitment R = r * G
   * 3. Bob computes shared secret point S = r * Q_Alice
   * 4. Keystream K derived from S_x
   * 5. Plaintext M masked: C_i = (M_i + K_i) mod 26 (Direct Caesar-comparable mask!)
   */
  function toyEccEncrypt(plaintext, alicePublicKey, maxKeyRange = 65535, fixedR = null) {
    if (!alicePublicKey) throw new Error("Alice public key required");
    const range = Math.max(16, maxKeyRange);
    let r;
    if (fixedR !== null && fixedR !== undefined) {
      r = BigInt(Math.max(1, Math.min(range, fixedR)));
    } else {
      r = BigInt(Math.floor(Math.random() * (range - 1)) + 1);
    }

    // Ephemeral Point R = r * G
    const R = pointMul(r, G_POINT);

    // Shared Secret Point S = r * Q_Alice = r * (d_A * G)
    const S = pointMul(r, alicePublicKey);
    if (!S) throw new Error("Degenerate shared secret (Point at infinity)");

    // Keystream derivation
    const cleanMsg = normalizeText(plaintext);
    const keystream = deriveKeystream(S.x, cleanMsg.length);

    let ciphertext = '';
    for (let i = 0; i < cleanMsg.length; i++) {
      const pVal = cleanMsg.charCodeAt(i) - 65;
      const cVal = (pVal + keystream[i]) % 26;
      ciphertext += String.fromCharCode(65 + cVal);
    }

    return {
      ephemeralScalar: r,
      ephemeralPoint: R,
      sharedSecretPoint: S,
      sharedSecretX: S.x.toString(16),
      keystream: keystream,
      plaintextClean: cleanMsg,
      ciphertext: ciphertext,
      serializedR: serializePoint(R)
    };
  }

  /**
   * Toy ECC Decryption:
   * 1. Alice receives (R, C)
   * 2. Computes shared secret point S = d_Alice * R = d_Alice * (r * G) = S
   * 3. Derives the identical keystream K from S_x
   * 4. Unmasks: M_i = (C_i - K_i) mod 26
   */
  function toyEccDecrypt(ciphertext, ephemeralPointR, alicePrivateKey) {
    if (!ephemeralPointR) throw new Error("Ephemeral point R required");
    if (!alicePrivateKey) throw new Error("Alice private key required");

    // Shared Secret Point S = d_A * R
    const S = pointMul(alicePrivateKey, ephemeralPointR);
    if (!S) throw new Error("Invalid ephemeral point or key");

    const cleanCipher = normalizeText(ciphertext);
    const keystream = deriveKeystream(S.x, cleanCipher.length);

    let decrypted = '';
    for (let i = 0; i < cleanCipher.length; i++) {
      const cVal = cleanCipher.charCodeAt(i) - 65;
      const pVal = ((cVal - keystream[i]) % 26 + 26) % 26;
      decrypted += String.fromCharCode(65 + pVal);
    }

    return {
      sharedSecretPoint: S,
      sharedSecretX: S.x.toString(16),
      keystream: keystream,
      decryptedText: decrypted
    };
  }

  // =========================================================================
  // 4. STATISTICAL CRYPTANALYSIS OF THE CAESAR CIPHER
  // =========================================================================

  // Standard Expected English Letter Frequencies (normalized sum = 1.0)
  const ENGLISH_FREQ = {
    A: 0.08167, B: 0.01492, C: 0.02782, D: 0.04253, E: 0.12702,
    F: 0.02228, G: 0.02015, H: 0.06094, I: 0.06966, J: 0.00153,
    K: 0.00772, L: 0.04025, M: 0.02406, N: 0.06749, O: 0.07507,
    P: 0.01929, Q: 0.00095, R: 0.05987, S: 0.06327, T: 0.09056,
    U: 0.02758, V: 0.00978, W: 0.02360, X: 0.00150, Y: 0.01974,
    Z: 0.00074
  };

  // Common English Top Bigrams with empirical weightings
  const TOP_BIGRAMS = new Set([
    'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ED', 'ON', 'ES', 'ST',
    'EN', 'AT', 'TO', 'NT', 'HA', 'ND', 'OU', 'EA', 'NG', 'AS',
    'OR', 'TI', 'IS', 'ET', 'IT', 'AR', 'TE', 'SE', 'HI', 'OF'
  ]);

  /**
   * Computes letter frequency counts and relative probabilities from text
   */
  function computeFrequencies(text) {
    const clean = normalizeText(text);
    const counts = {};
    for (let c = 65; c <= 90; c++) {
      counts[String.fromCharCode(c)] = 0;
    }
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      counts[ch] = (counts[ch] || 0) + 1;
    }
    const N = clean.length;
    const rel = {};
    for (const ch in counts) {
      rel[ch] = N > 0 ? counts[ch] / N : 0;
    }
    return { counts, rel, total: N, cleanText: clean };
  }

  /**
   * Calculates the Index of Coincidence (IoC):
   * IC = sum(n_i * (n_i - 1)) / (N * (N - 1))
   * Expected: ~0.0667 for English text, ~0.0385 for random uniform text.
   */
  function computeIndexCoincidence(text) {
    const { counts, total: N } = computeFrequencies(text);
    if (N <= 1) return 0;
    let sum = 0;
    for (const ch in counts) {
      const n = counts[ch];
      sum += n * (n - 1);
    }
    return sum / (N * (N - 1));
  }

  /**
   * Computes Bigram match score for candidate plaintext
   */
  function computeBigramScore(text) {
    const clean = normalizeText(text);
    if (clean.length < 2) return 0;
    let matches = 0;
    for (let i = 0; i < clean.length - 1; i++) {
      const bg = clean.slice(i, i + 2);
      if (TOP_BIGRAMS.has(bg)) matches++;
    }
    return matches / (clean.length - 1);
  }

  /**
   * Chi-Square Goodness-of-Fit test for each candidate shift s in [0..25]:
   * Decrypt ciphertext with shift s: P_s = Caesar(C, s).
   * chi^2(s) = sum_{c='A'..'Z'} [ (Observed_c(s) - Expected_c)^2 / Expected_c ]
   * where Expected_c = N * ENGLISH_FREQ[c].
   * The candidate shift minimizing chi^2(s) is the most probable encryption key.
   */
  function analyzeCaesarChiSquare(ciphertext) {
    const clean = normalizeText(ciphertext);
    const N = clean.length;
    if (N === 0) return { bestKey: 0, scores: [] };

    const scores = [];

    for (let s = 0; s < 26; s++) {
      // Decrypt candidate with shift s
      const candidate = caesarDecrypt(clean, s);
      const { counts } = computeFrequencies(candidate);

      let chi2 = 0;
      let dotProduct = 0;

      for (let c = 65; c <= 90; c++) {
        const ch = String.fromCharCode(c);
        const observed = counts[ch];
        const expected = N * ENGLISH_FREQ[ch];
        const diff = observed - expected;
        chi2 += (diff * diff) / expected;

        // Dot-product correlation metric: sum(freq_obs * freq_eng)
        dotProduct += (observed / N) * ENGLISH_FREQ[ch];
      }

      const bigramScore = computeBigramScore(candidate);

      scores.push({
        shiftKey: s,
        chiSquare: chi2,
        dotProduct: dotProduct,
        bigramScore: bigramScore,
        candidateText: candidate.slice(0, 48) + (candidate.length > 48 ? '...' : '')
      });
    }

    // Rank candidate keys: smallest chiSquare is best
    scores.sort((a, b) => a.chiSquare - b.chiSquare);
    const bestKey = scores[0].shiftKey;

    return {
      bestKey: bestKey,
      bestCandidate: caesarDecrypt(clean, bestKey),
      scores: scores, // Sorted by chi2 ascending
      ioc: computeIndexCoincidence(clean)
    };
  }

  /**
   * Automated Multi-Length Benchmark Runner:
   * Tests statistical cryptanalysis accuracy across lengths N in [5, 10, 20, 50, 100, 200, 500]
   * Runs multiple random keys and segments from sample text.
   */
  function runLengthBenchmark(sampleCorpus, lengths = [5, 10, 15, 25, 50, 100, 200, 500], trialsPerLength = 30) {
    let cleanCorpus = normalizeText(sampleCorpus);
    const maxLen = Math.max(...lengths);
    if (cleanCorpus.length === 0) {
      throw new Error("Corpus cannot be empty");
    }
    // Automatically cycle-repeat text to ensure robust random sampling window
    while (cleanCorpus.length < maxLen + 200) {
      cleanCorpus += cleanCorpus;
    }

    const results = [];

    for (const len of lengths) {
      let correctChi2 = 0;
      let correctDot = 0;
      let correctBigram = 0;
      let avgChi2 = 0;

      for (let t = 0; t < trialsPerLength; t++) {
        // Random slice from corpus of length len
        const maxStart = cleanCorpus.length - len;
        const start = Math.floor(Math.random() * maxStart);
        const slice = cleanCorpus.slice(start, start + len);

        // Pick random secret shift key k in [1..25]
        const trueKey = Math.floor(Math.random() * 25) + 1;
        const cipher = caesarEncrypt(slice, trueKey);

        const analysis = analyzeCaesarChiSquare(cipher);

        // Best key by Chi2
        if (analysis.bestKey === trueKey) correctChi2++;

        // Best key by Dot Product
        const byDot = [...analysis.scores].sort((a, b) => b.dotProduct - a.dotProduct);
        if (byDot[0].shiftKey === trueKey) correctDot++;

        // Best key by Bigram
        const byBigram = [...analysis.scores].sort((a, b) => b.bigramScore - a.bigramScore);
        if (byBigram[0].shiftKey === trueKey) correctBigram++;

        avgChi2 += analysis.scores.find(s => s.shiftKey === trueKey).chiSquare;
      }

      results.push({
        length: len,
        accuracyChi2: (correctChi2 / trialsPerLength) * 100,
        accuracyDotProduct: (correctDot / trialsPerLength) * 100,
        accuracyBigram: (correctBigram / trialsPerLength) * 100,
        trials: trialsPerLength,
        avgTrueKeyChi2: avgChi2 / trialsPerLength
      });
    }

    return results;
  }

  // =========================================================================
  // 5. TOY ECC CRYPTANALYSIS (Restricted Key Space ECDLP Attacks)
  // =========================================================================

  /**
   * Baby-Step Giant-Step (BSGS) Algorithm for Elliptic Curve Discrete Logarithm:
   * Given Q = d * G, where 1 <= d <= maxKeyRange.
   *
   * Let m = ceil(sqrt(maxKeyRange)).
   * Any d can be written as: d = i * m + j, where 0 <= j < m, 0 <= i <= m.
   * Equation: Q = (i * m + j) * G  <=>  Q - j * G = i * (m * G).
   *
   * 1. Baby Steps:
   *    Compute and store in Hash Table:
   *    Baby_j = Q - j * G  for j = 0, 1, ..., m-1.
   *
   * 2. Giant Steps:
   *    Compute P = m * G.
   *    For i = 0, 1, ..., m:
   *      Giant_i = i * P
   *      Check if Giant_i exists in Baby Step Hash Table.
   *      If match with key for j: d = i * m + j.
   *
   * Complexity: O(sqrt(maxKeyRange)) additions and O(sqrt(maxKeyRange)) space!
   * For maxKeyRange = 65,535: m = 256. Requires only 256 + 256 = 512 operations!
   */
  function solveEcdlpBSGS(targetPointQ, maxKeyRange = 65535) {
    const startTime = performance.now();
    const range = Math.max(16, maxKeyRange);
    const m = Math.ceil(Math.sqrt(range));

    let pointOps = 0;

    // Fast coordinate string hash for point lookup
    function ptKey(pt) {
      if (!pt) return 'INF';
      return pt.x.toString(16) + '_' + (pt.y % 2n);
    }

    // 1. BABY STEPS: Compute Q - j * G
    // Precompute lookup table
    const babyTable = new Map();
    let currentBaby = targetPointQ; // j = 0: Q - 0*G = Q

    babyTable.set(ptKey(currentBaby), 0);

    // Step vector: -G
    const negG = pointNeg(G_POINT);

    for (let j = 1; j < m; j++) {
      currentBaby = pointAdd(currentBaby, negG);
      pointOps++;
      if (currentBaby) {
        babyTable.set(ptKey(currentBaby), j);
      }
    }

    // 2. GIANT STEPS: Compute P = m * G, then test i * P
    const giantStepPoint = pointMul(BigInt(m), G_POINT);
    pointOps += Math.floor(Math.log2(m)) * 2; // Cost of scalar multiplication

    let currentGiant = null; // i = 0: 0 * P = Infinity
    let recoveredScalar = null;
    let matchedI = null;
    let matchedJ = null;

    for (let i = 0; i <= m + 1; i++) {
      const key = ptKey(currentGiant);
      if (babyTable.has(key)) {
        matchedJ = babyTable.get(key);
        matchedI = i;
        recoveredScalar = BigInt(i * m + matchedJ);
        break;
      }
      currentGiant = pointAdd(currentGiant, giantStepPoint);
      pointOps++;
    }

    const elapsedMs = performance.now() - startTime;

    return {
      method: 'Baby-Step Giant-Step (BSGS)',
      success: recoveredScalar !== null,
      recoveredScalar: recoveredScalar,
      m: m,
      matchedI: matchedI,
      matchedJ: matchedJ,
      pointOps: pointOps,
      elapsedMs: elapsedMs,
      tableSize: babyTable.size,
      theoreticalOps: 2 * m
    };
  }

  /**
   * Exhaustive Search (Brute-Force) ECDLP Attack:
   * Linearly tests k = 1, 2, ... until k * G == Q.
   * Complexity: O(maxKeyRange) operations.
   */
  function solveEcdlpBruteForce(targetPointQ, maxKeyRange = 65535, maxTimeoutMs = 5000) {
    const startTime = performance.now();
    const range = Math.max(16, maxKeyRange);
    let cur = null;
    let pointOps = 0;
    let recoveredScalar = null;

    const targetX = targetPointQ.x;
    const targetY = targetPointQ.y;

    for (let k = 1; k <= range; k++) {
      cur = pointAdd(cur, G_POINT);
      pointOps++;

      if (cur && cur.x === targetX && cur.y === targetY) {
        recoveredScalar = BigInt(k);
        break;
      }

      if (k % 500 === 0 && (performance.now() - startTime) > maxTimeoutMs) {
        return {
          method: 'Exhaustive Search (Brute-Force)',
          success: false,
          timedOut: true,
          recoveredScalar: null,
          pointOps: pointOps,
          elapsedMs: performance.now() - startTime
        };
      }
    }

    const elapsedMs = performance.now() - startTime;

    return {
      method: 'Exhaustive Search (Brute-Force)',
      success: recoveredScalar !== null,
      timedOut: false,
      recoveredScalar: recoveredScalar,
      pointOps: pointOps,
      elapsedMs: elapsedMs,
      theoreticalOps: range / 2
    };
  }

  // =========================================================================
  // PUBLIC EXPORT API
  // =========================================================================

  return {
    SECP256K1,
    G_POINT,
    normalizeText,
    pointAdd,
    pointMul,
    pointSub,
    pointNeg,
    serializePoint,

    // Caesar
    caesarEncrypt,
    caesarDecrypt,
    computeFrequencies,
    computeIndexCoincidence,
    computeBigramScore,
    analyzeCaesarChiSquare,
    runLengthBenchmark,
    ENGLISH_FREQ,

    // Toy ECC
    toyEccKeygen,
    toyEccEncrypt,
    toyEccDecrypt,
    deriveKeystream,

    // Cryptanalysis of Toy ECC
    solveEcdlpBSGS,
    solveEcdlpBruteForce
  };
}));
