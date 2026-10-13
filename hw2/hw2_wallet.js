/**
 * Module 2: From Wallet Seed to Ethereum Address
 * BIP-39, BIP-32, BIP-44, SECP256K1, Keccak-256, EIP-55
 * Domain: Applied Cryptography & Key Derivation
 */

(function (window) {
  'use strict';

  // --- Cryptographic Helper Constants & Pure JS Implementations ---

  // 1. SHA-256 Implementation for BIP-39 Checksum
  function rotr32(n, b) {
    return (n >>> b) | (n << (32 - b));
  }

  function sha256(bytes) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774cdf, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

    const len = bytes.length;
    const bitLen = len * 8;
    const padLen = (64 - ((len + 1 + 8) % 64)) % 64;
    const totalLen = len + 1 + padLen + 8;
    const buf = new Uint8Array(totalLen);
    buf.set(bytes, 0);
    buf[len] = 0x80;

    const view = new DataView(buf.buffer);
    view.setUint32(totalLen - 4, bitLen, false);

    const W = new Uint32Array(64);
    for (let i = 0; i < totalLen; i += 64) {
      for (let t = 0; t < 16; t++) {
        W[t] = view.getUint32(i + t * 4, false);
      }
      for (let t = 16; t < 64; t++) {
        const s0 = rotr32(W[t - 15], 7) ^ rotr32(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = rotr32(W[t - 2], 17) ^ rotr32(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
        const ch = (e & f) ^ ((~e) & g);
        const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
        const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;

        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) {
      outView.setUint32(i * 4, H[i], false);
    }
    return out;
  }

  // 2. SHA-512 Implementation using 64-bit BigInt
  const K512 = [
    0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
    0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
    0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
    0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
    0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
    0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
    0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
    0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
    0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
    0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
    0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
    0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
    0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
    0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
    0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
    0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
    0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
    0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
    0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
    0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n
  ];
  const MASK64 = 0xFFFFFFFFFFFFFFFFn;

  function rotr64(x, n) {
    const nb = BigInt(n);
    return ((x >> nb) | ((x << (64n - nb)) & MASK64)) & MASK64;
  }

  function sha512(data) {
    if (typeof data === 'string') {
      data = new TextEncoder().encode(data);
    }
    const len = BigInt(data.length);
    const bitLen = len * 8n;
    const padLen = (128 - ((data.length + 1 + 16) % 128)) % 128;
    const totalLen = data.length + 1 + padLen + 16;
    const buf = new Uint8Array(totalLen);
    buf.set(data, 0);
    buf[data.length] = 0x80;

    const view = new DataView(buf.buffer);
    view.setBigUint64(totalLen - 16, 0n, false);
    view.setBigUint64(totalLen - 8, bitLen, false);

    let H = [
      0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
    ];

    const W = new Array(80);
    for (let i = 0; i < totalLen; i += 128) {
      for (let t = 0; t < 16; t++) {
        W[t] = view.getBigUint64(i + t * 8, false);
      }
      for (let t = 16; t < 80; t++) {
        const s0 = rotr64(W[t - 15], 1) ^ rotr64(W[t - 15], 8) ^ (W[t - 15] >> 7n);
        const s1 = rotr64(W[t - 2], 19) ^ rotr64(W[t - 2], 61) ^ (W[t - 2] >> 6n);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & MASK64;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 80; t++) {
        const S1 = rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41);
        const ch = (e & f) ^ ((~e & MASK64) & g);
        const temp1 = (h + S1 + ch + K512[t] + W[t]) & MASK64;
        const S0 = rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) & MASK64;

        h = g; g = f; f = e; e = (d + temp1) & MASK64;
        d = c; c = b; b = a; a = (temp1 + temp2) & MASK64;
      }
      H[0] = (H[0] + a) & MASK64;
      H[1] = (H[1] + b) & MASK64;
      H[2] = (H[2] + c) & MASK64;
      H[3] = (H[3] + d) & MASK64;
      H[4] = (H[4] + e) & MASK64;
      H[5] = (H[5] + f) & MASK64;
      H[6] = (H[6] + g) & MASK64;
      H[7] = (H[7] + h) & MASK64;
    }

    const out = new Uint8Array(64);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) {
      outView.setBigUint64(i * 8, H[i], false);
    }
    return out;
  }

  // 3. HMAC-SHA512
  function hmacSha512(key, data) {
    if (typeof key === 'string') key = new TextEncoder().encode(key);
    if (typeof data === 'string') data = new TextEncoder().encode(data);

    let k = new Uint8Array(128); // Block size 128 bytes
    if (key.length > 128) {
      const hashed = sha512(key);
      k.set(hashed, 0);
    } else {
      k.set(key, 0);
    }

    const ipad = new Uint8Array(128);
    const opad = new Uint8Array(128);
    for (let i = 0; i < 128; i++) {
      ipad[i] = k[i] ^ 0x36;
      opad[i] = k[i] ^ 0x5c;
    }

    const inner = new Uint8Array(128 + data.length);
    inner.set(ipad, 0);
    inner.set(data, 128);
    const innerHash = sha512(inner);

    const outer = new Uint8Array(128 + 64);
    outer.set(opad, 0);
    outer.set(innerHash, 128);
    return sha512(outer);
  }

  // 4. PBKDF2-HMAC-SHA512 (with WebCrypto acceleration or pure JS fallback)
  async function pbkdf2HmacSha512(password, salt, iterations = 2048, keyLen = 64) {
    // If WebCrypto is available in browser, use hardware-accelerated deriveBits
    if (window.crypto && window.crypto.subtle) {
      try {
        const passBytes = new TextEncoder().encode(password);
        const saltBytes = typeof salt === 'string' ? new TextEncoder().encode(salt) : salt;
        const keyMaterial = await window.crypto.subtle.importKey(
          'raw',
          passBytes,
          { name: 'PBKDF2' },
          false,
          ['deriveBits']
        );
        const derivedBits = await window.crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: iterations,
            hash: 'SHA-512'
          },
          keyMaterial,
          keyLen * 8
        );
        return new Uint8Array(derivedBits);
      } catch (err) {
        console.warn('WebCrypto PBKDF2 failed, using pure JS fallback:', err);
      }
    }

    // Pure JS Fallback
    const passBytes = typeof password === 'string' ? new TextEncoder().encode(password) : password;
    const saltBytes = typeof salt === 'string' ? new TextEncoder().encode(salt) : salt;

    // Block 1: U_1 = HMAC(pass, salt || INT(1))
    const initialData = new Uint8Array(saltBytes.length + 4);
    initialData.set(saltBytes, 0);
    initialData[saltBytes.length + 3] = 1; // Block index = 1

    let u = hmacSha512(passBytes, initialData);
    let t = new Uint8Array(u);

    for (let i = 2; i <= iterations; i++) {
      u = hmacSha512(passBytes, u);
      for (let j = 0; j < 64; j++) {
        t[j] ^= u[j];
      }
    }
    return t.slice(0, keyLen);
  }

  // 5. Keccak-256 (Original Ethereum pre-NIST sponge permutation)
  function keccak256(data) {
    if (typeof data === 'string') data = new TextEncoder().encode(data);

    const RC = [
      0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
      0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
      0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
      0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
      0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
      0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
    ];

    const rot = [
      [0, 36, 3, 41, 18],
      [1, 44, 10, 45, 2],
      [62, 6, 43, 15, 61],
      [28, 55, 25, 21, 56],
      [27, 20, 39, 8, 14]
    ];

    const rate = 136; // 1088 bits / 8
    const padLen = rate - (data.length % rate);
    const padded = new Uint8Array(data.length + padLen);
    padded.set(data, 0);

    // Keccak padding: 0x01 ... 0x80 (Note: NIST SHA3 uses 0x06 ... 0x80)
    if (padLen === 1) {
      padded[data.length] = 0x81;
    } else {
      padded[data.length] = 0x01;
      padded[padded.length - 1] = 0x80;
    }

    const state = Array.from({ length: 5 }, () => new Array(5).fill(0n));

    function rol64(val, r) {
      const nb = BigInt(r % 64);
      return ((val << nb) | (val >> (64n - nb))) & MASK64;
    }

    const view = new DataView(padded.buffer);
    for (let b = 0; b < padded.length; b += rate) {
      for (let idx = 0; idx < 17; idx++) {
        const lane = view.getBigUint64(b + idx * 8, true); // Little-endian
        const x = idx % 5;
        const y = Math.floor(idx / 5);
        state[x][y] ^= lane;
      }

      // 24 rounds of Keccak-f[1600]
      for (let r = 0; r < 24; r++) {
        // Theta step
        const C = new Array(5);
        for (let x = 0; x < 5; x++) {
          C[x] = state[x][0] ^ state[x][1] ^ state[x][2] ^ state[x][3] ^ state[x][4];
        }
        const D = new Array(5);
        for (let x = 0; x < 5; x++) {
          D[x] = C[(x + 4) % 5] ^ rol64(C[(x + 1) % 5], 1);
        }
        for (let x = 0; x < 5; x++) {
          for (let y = 0; y < 5; y++) {
            state[x][y] ^= D[x];
          }
        }

        // Rho and Pi steps
        const B = Array.from({ length: 5 }, () => new Array(5).fill(0n));
        for (let x = 0; x < 5; x++) {
          for (let y = 0; y < 5; y++) {
            B[y][(2 * x + 3 * y) % 5] = rol64(state[x][y], rot[x][y]);
          }
        }

        // Chi step
        for (let x = 0; x < 5; x++) {
          for (let y = 0; y < 5; y++) {
            state[x][y] = B[x][y] ^ ((~B[(x + 1) % 5][y] & MASK64) & B[(x + 2) % 5][y]);
          }
        }

        // Iota step
        state[0][0] ^= RC[r];
      }
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let idx = 0; idx < 4; idx++) {
      const x = idx % 5;
      const y = Math.floor(idx / 5);
      outView.setBigUint64(idx * 8, state[x][y], true);
    }
    return out;
  }

  // --- SECP256K1 Curve BigInt Arithmetic ---
  const SECP256K1_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
  const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
  const SECP256K1_GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
  const SECP256K1_GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;

  function secpModInv(a, m) {
    let [m0, y, x] = [m, 0n, 1n];
    while (a > 1n) {
      const q = a / m;
      let t = m;
      m = a % m; a = t;
      t = y; y = x - q * y; x = t;
    }
    if (x < 0n) x += m0;
    return x;
  }

  function secpPointAdd(p1, p2) {
    if (!p1) return p2;
    if (!p2) return p1;
    const { x: x1, y: y1 } = p1;
    const { x: x2, y: y2 } = p2;
    if (x1 === x2 && (y1 + y2) % SECP256K1_P === 0n) return null;

    let m;
    if (x1 === x2 && y1 === y2) {
      m = (3n * x1 * x1 * secpModInv(2n * y1, SECP256K1_P)) % SECP256K1_P;
    } else {
      let dy = (y2 - y1) % SECP256K1_P;
      if (dy < 0n) dy += SECP256K1_P;
      let dx = (x2 - x1) % SECP256K1_P;
      if (dx < 0n) dx += SECP256K1_P;
      m = (dy * secpModInv(dx, SECP256K1_P)) % SECP256K1_P;
    }

    let x3 = (m * m - x1 - x2) % SECP256K1_P;
    if (x3 < 0n) x3 += SECP256K1_P;
    let y3 = (m * (x1 - x3) - y1) % SECP256K1_P;
    if (y3 < 0n) y3 += SECP256K1_P;

    return { x: x3, y: y3 };
  }

  function secpPointMul(k, pt) {
    let res = null;
    let cur = pt;
    while (k > 0n) {
      if (k & 1n) res = secpPointAdd(res, cur);
      cur = secpPointAdd(cur, cur);
      k >>= 1n;
    }
    return res;
  }

  function serializeSecpCompressed(pt) {
    const prefix = pt.y % 2n === 0n ? '02' : '03';
    return prefix + pt.x.toString(16).padStart(64, '0');
  }

  function serializeSecpUncompressed(pt) {
    return '04' + pt.x.toString(16).padStart(64, '0') + pt.y.toString(16).padStart(64, '0');
  }

  // --- BIP-32 Child Key Derivation (CKDpriv) ---
  function ckdPriv(kPar, cPar, index) {
    let data;
    if (index >= 0x80000000) {
      // Hardened child: 0x00 || ser256(kPar) || ser32(index)
      const kHex = kPar.toString(16).padStart(64, '0');
      const kBytes = hexToBytes(kHex);
      data = new Uint8Array(1 + 32 + 4);
      data[0] = 0x00;
      data.set(kBytes, 1);
      const view = new DataView(data.buffer);
      view.setUint32(33, index, false);
    } else {
      // Normal child: serP(point(kPar)) || ser32(index)
      const pub = secpPointMul(kPar, { x: SECP256K1_GX, y: SECP256K1_GY });
      const pubHex = serializeSecpCompressed(pub);
      const pubBytes = hexToBytes(pubHex);
      data = new Uint8Array(33 + 4);
      data.set(pubBytes, 0);
      const view = new DataView(data.buffer);
      view.setUint32(33, index, false);
    }

    const I = hmacSha512(cPar, data);
    const IL = BigInt('0x' + bytesToHex(I.slice(0, 32)));
    const IR = I.slice(32);
    const ki = (IL + kPar) % SECP256K1_N;
    return { k: ki, c: IR };
  }

  // --- EIP-55 Mixed-Case Checksum ---
  function toChecksumAddress(addrHex) {
    const cleanAddr = addrHex.toLowerCase().replace(/^0x/, '');
    const hashBytes = keccak256(cleanAddr);
    const hashHex = bytesToHex(hashBytes);

    let checksummed = '0x';
    const breakdown = [];

    for (let i = 0; i < cleanAddr.length; i++) {
      const char = cleanAddr[i];
      const hashNibble = parseInt(hashHex[i], 16);
      let isUpper = false;

      if (char >= '0' && char <= '9') {
        checksummed += char;
      } else {
        if (hashNibble >= 8) {
          checksummed += char.toUpperCase();
          isUpper = true;
        } else {
          checksummed += char.toLowerCase();
        }
      }

      breakdown.push({
        char,
        hashNibble,
        isUpper,
        resultChar: checksummed[checksummed.length - 1]
      });
    }

    return { checksummed, breakdown };
  }

  // --- Utility Hex & Byte Conversions ---
  function bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexToBytes(hex) {
    hex = hex.replace(/^0x/, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // --- BIP-39 Mnemonic Generator and Parser ---
  class BIP39Manager {
    constructor(wordlist = window.BIP39_WORDLIST || []) {
      this.wordlist = wordlist;
    }

    generateMnemonic(strengthBits = 128) {
      // strengthBits: 128 (12 words) or 256 (24 words)
      const byteCount = strengthBits / 8;
      const entropy = new Uint8Array(byteCount);
      window.crypto.getRandomValues(entropy);
      return this.entropyToMnemonic(entropy);
    }

    entropyToMnemonic(entropyBytes) {
      const entBits = entropyBytes.length * 8;
      const csBits = entBits / 32;

      // SHA-256 of entropy
      const hash = sha256(entropyBytes);

      // Convert entropy to bit string
      let bitString = '';
      for (let i = 0; i < entropyBytes.length; i++) {
        bitString += entropyBytes[i].toString(2).padStart(8, '0');
      }

      // Add checksum bits
      const hashBits = hash[0].toString(2).padStart(8, '0');
      bitString += hashBits.substring(0, csBits);

      // Split into 11-bit chunks
      const words = [];
      for (let i = 0; i < bitString.length; i += 11) {
        const chunk = bitString.substring(i, i + 11);
        const index = parseInt(chunk, 2);
        words.push(this.wordlist[index] || `word_${index}`);
      }

      return {
        entropyHex: bytesToHex(entropyBytes),
        checksumBits: hashBits.substring(0, csBits),
        mnemonic: words.join(' '),
        words
      };
    }

    mnemonicToEntropy(mnemonic) {
      const val = this.validateMnemonic(mnemonic);
      if (!val.valid) return null;
      let bitString = '';
      for (let word of val.words) {
        const index = this.wordlist.indexOf(word);
        if (index === -1) return null;
        bitString += index.toString(2).padStart(11, '0');
      }
      const numWords = val.words.length;
      const totalBits = numWords * 11;
      const csBits = totalBits / 33;
      const entBits = totalBits - csBits;
      const entropyBits = bitString.substring(0, entBits);
      const checksumBits = bitString.substring(entBits);

      const entropyBytes = new Uint8Array(entBits / 8);
      for (let i = 0; i < entropyBytes.length; i++) {
        entropyBytes[i] = parseInt(entropyBits.substr(i * 8, 8), 2);
      }
      return {
        entropyHex: bytesToHex(entropyBytes),
        checksumHex: parseInt(checksumBits, 2).toString(16).toUpperCase(),
        checksumBits,
        wordCount: numWords
      };
    }

    validateMnemonic(mnemonic) {
      const words = mnemonic.trim().toLowerCase().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        return { valid: false, error: 'Mnemonic must be exactly 12 or 24 words.' };
      }
      for (let w of words) {
        if (!this.wordlist.includes(w)) {
          return { valid: false, error: `Invalid BIP-39 word: "${w}"` };
        }
      }
      return { valid: true, words };
    }
  }

  // --- Complete Ethereum Wallet Pipeline Orchestrator ---
  class EthereumWalletPipeline {
    constructor() {
      this.bip39 = new BIP39Manager();
    }

    async deriveFullPipeline(mnemonic, passphrase = '', derivationPath = "m/44'/60'/0'/0/0") {
      const validation = this.bip39.validateMnemonic(mnemonic);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 1: BIP-39 Mnemonic
      const words = validation.words;

      // Step 2: BIP-39 Seed via PBKDF2
      const salt = 'mnemonic' + passphrase;
      const seedBytes = await pbkdf2HmacSha512(mnemonic.trim(), salt, 2048, 64);
      const seedHex = bytesToHex(seedBytes);

      // Step 3: BIP-32 Root Key Derivation
      const masterI = hmacSha512('Bitcoin seed', seedBytes);
      const masterSecretHex = bytesToHex(masterI.slice(0, 32));
      const masterChainCodeHex = bytesToHex(masterI.slice(32));

      let currentPrivKey = BigInt('0x' + masterSecretHex);
      let currentChainCode = masterI.slice(32);

      // Step 4: BIP-44 Hierarchical Deterministic Path Navigation
      const pathSegments = derivationPath.split('/').slice(1); // skip 'm'
      const intermediateSteps = [];

      for (let segment of pathSegments) {
        const isHardened = segment.endsWith("'") || segment.endsWith('h');
        const indexNum = parseInt(segment.replace(/['h]/g, ''), 10);
        const childIndex = isHardened ? (indexNum + 0x80000000) : indexNum;

        const next = ckdPriv(currentPrivKey, currentChainCode, childIndex);
        currentPrivKey = next.k;
        currentChainCode = next.c;

        intermediateSteps.push({
          segment,
          childIndex,
          isHardened,
          derivedKeyHex: currentPrivKey.toString(16).padStart(64, '0'),
          chainCodeHex: bytesToHex(currentChainCode)
        });
      }

      const finalPrivKeyHex = currentPrivKey.toString(16).padStart(64, '0');

      // Step 5: secp256k1 Public Key Generation
      const pubPoint = secpPointMul(currentPrivKey, { x: SECP256K1_GX, y: SECP256K1_GY });
      const pubXHex = pubPoint.x.toString(16).padStart(64, '0');
      const pubYHex = pubPoint.y.toString(16).padStart(64, '0');
      const pubCompressed = serializeSecpCompressed(pubPoint);
      const pubUncompressed = serializeSecpUncompressed(pubPoint);

      // Step 6: Keccak-256 Hashing of Uncompressed Public Key coordinates (without 0x04)
      const pubCoordsBytes = hexToBytes(pubXHex + pubYHex);
      const keccakDigest = keccak256(pubCoordsBytes);
      const keccakHex = bytesToHex(keccakDigest);

      // Step 7: Ethereum Address Extraction (last 20 bytes = 40 hex chars)
      const rawAddress = keccakHex.slice(24); // 64 - 40 = 24

      // Step 8: EIP-55 Checksum Encoding
      const { checksummed, breakdown } = toChecksumAddress(rawAddress);

      const entropyInfo = this.bip39.mnemonicToEntropy(mnemonic) || {
        entropyHex: '00000000000000000000000000000000',
        checksumHex: '0',
        wordCount: words.length
      };

      const step1 = {
        entropyHex: entropyInfo.entropyHex,
        wordCount: words.length,
        checksumHex: entropyInfo.checksumHex
      };
      const step2 = { seedHex };
      const step3 = { masterPrivateKeyHex: masterSecretHex, masterChainCodeHex };
      const step4 = { path: derivationPath, derivedPrivateKeyHex: '0x' + finalPrivKeyHex };
      const step5 = {
        uncompressedPublicKeyHex: '0x' + pubUncompressed,
        xHex: '0x' + pubXHex,
        yHex: '0x' + pubYHex
      };
      const step6 = { keccakHashHex: '0x' + keccakHex };
      const step7 = { rawAddress: '0x' + rawAddress };
      const step8 = { checksummedAddress: checksummed };

      return {
        step1,
        step2,
        step3,
        step4,
        step5,
        step6,
        step7,
        step8,
        mnemonic,
        passphrase,
        derivationPath,
        seedHex,
        masterSecretHex,
        masterChainCodeHex,
        pathSteps: intermediateSteps,
        derivedPrivateKey: '0x' + finalPrivKeyHex,
        publicKeyPoint: { x: pubXHex, y: pubYHex },
        publicKeyCompressed: '0x' + pubCompressed,
        publicKeyUncompressed: '0x' + pubUncompressed,
        keccak256Hash: '0x' + keccakHex,
        rawAddress: '0x' + rawAddress,
        checksummedAddress: checksummed,
        eip55Breakdown: breakdown
      };
    }

    // Measure Avalanche Effect across Pipeline
    async measureAvalanche(mnemonic1, mnemonic2) {
      const res1 = await this.deriveFullPipeline(mnemonic1);
      const res2 = await this.deriveFullPipeline(mnemonic2);

      const hammingBits = (hex1, hex2) => {
        const b1 = hexToBytes(hex1);
        const b2 = hexToBytes(hex2);
        let diff = 0;
        const len = Math.min(b1.length, b2.length);
        for (let i = 0; i < len; i++) {
          let xor = b1[i] ^ b2[i];
          while (xor > 0) {
            diff += xor & 1;
            xor >>= 1;
          }
        }
        return { diffBits: diff, totalBits: len * 8, ratio: diff / (len * 8) };
      };

      return {
        seedDiff: hammingBits(res1.seedHex, res2.seedHex),
        privKeyDiff: hammingBits(res1.derivedPrivateKey, res2.derivedPrivateKey),
        pubKeyDiff: hammingBits(res1.publicKeyUncompressed.slice(4), res2.publicKeyUncompressed.slice(4)),
        hashDiff: hammingBits(res1.keccak256Hash, res2.keccak256Hash),
        addressDiff: hammingBits(res1.rawAddress, res2.rawAddress)
      };
    }
  }

  // Export to window
  window.BIP39Manager = BIP39Manager;
  window.EthereumWalletPipeline = EthereumWalletPipeline;
  window.toChecksumAddress = toChecksumAddress;
  window.keccak256 = keccak256;
  window.secpPointMul = secpPointMul;
  window.bytesToHex = bytesToHex;
  window.hexToBytes = hexToBytes;

})(window);
