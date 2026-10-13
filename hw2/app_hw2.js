/**
 * Homework 2: Hierarchical Deterministic Ethereum Wallets
 * Controller and Application Logic
 */

(function () {
  'use strict';

  // --- HW2 Application State ---
  const state = {
    pipeline: new window.EthereumWalletPipeline(),
    currentResult: null,
    defaultMnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    derivationPath: "m/44'/60'/0'/0/0"
  };

  // --- Initialization on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initHW2();
    initReportViewer();
  });

  // --- Tab Navigation ---
  function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(target);
        if (targetContent) {
          targetContent.classList.add('active');
          if (target === 'tab-report') {
            const container = document.getElementById('reportMarkdownContent');
            if (container) {
              if (!container.dataset.rendered) {
                initReportViewer();
              }
              container.dataset.rendered = 'true';
    renderMath(container);
            }
          }
        }
      });
    });
  }

  // --- HW2 Interactive Laboratory ---
  function initHW2() {
    const pipeline = state.pipeline;

    const mnemonicInput = document.getElementById('mnemonicInput');
    const passphraseInput = document.getElementById('passphraseInput');
    const pathInput = document.getElementById('pathInput');
    const deriveBtn = document.getElementById('deriveBtn');
    const random12Btn = document.getElementById('genRandom12Btn');
    const random24Btn = document.getElementById('genRandom24Btn');
    const loadTestVectorBtn = document.getElementById('loadTestVectorBtn');

    function setMnemonicMode(selectedBtn) {
      [random12Btn, random24Btn, loadTestVectorBtn].forEach(b => {
        if (!b) return;
        b.classList.remove('btn-primary', 'active');
        b.classList.add('btn-secondary');
      });
      if (selectedBtn) {
        selectedBtn.classList.remove('btn-secondary');
        selectedBtn.classList.add('btn-primary', 'active');
      }
    }

    if (mnemonicInput) mnemonicInput.value = state.defaultMnemonic;
    if (pathInput) pathInput.value = state.derivationPath;
    setMnemonicMode(loadTestVectorBtn);

    if (random12Btn) {
      random12Btn.addEventListener('click', () => {
        setMnemonicMode(random12Btn);
        const res = pipeline.bip39.generateMnemonic(128);
        if (mnemonicInput) mnemonicInput.value = res.mnemonic;
        triggerDerivation(false);
      });
    }

    if (random24Btn) {
      random24Btn.addEventListener('click', () => {
        setMnemonicMode(random24Btn);
        const res = pipeline.bip39.generateMnemonic(256);
        if (mnemonicInput) mnemonicInput.value = res.mnemonic;
        triggerDerivation(false);
      });
    }

    if (loadTestVectorBtn) {
      loadTestVectorBtn.addEventListener('click', () => {
        setMnemonicMode(loadTestVectorBtn);
        if (mnemonicInput) mnemonicInput.value = state.defaultMnemonic;
        if (passphraseInput) passphraseInput.value = '';
        if (pathInput) pathInput.value = "m/44'/60'/0'/0/0";
        triggerDerivation(false);
      });
    }

    if (mnemonicInput) {
      mnemonicInput.addEventListener('input', () => {
        if (mnemonicInput.value.trim() === state.defaultMnemonic) {
          setMnemonicMode(loadTestVectorBtn);
        } else {
          setMnemonicMode(null);
        }
      });
    }

    if (deriveBtn) {
      deriveBtn.addEventListener('click', () => triggerDerivation(false));
    }

    // Live Avalanche test button
    const testAvalancheBtn = document.getElementById('testAvalancheBtn');
    if (testAvalancheBtn) {
      testAvalancheBtn.addEventListener('click', runWalletAvalancheExperiment);
    }

    // Run initial derivation without animation
    triggerDerivation(true);
  }

  async function triggerDerivation(isInitial = false) {
    const pipeline = state.pipeline;
    const mnemonicInput = document.getElementById('mnemonicInput');
    const passphraseInput = document.getElementById('passphraseInput');
    const pathInput = document.getElementById('pathInput');
    const deriveBtn = document.getElementById('deriveBtn');
    const statusMsg = document.getElementById('derivationStatusMsg');

    if (!mnemonicInput) return;
    const mnemonic = mnemonicInput.value.trim();
    const passphrase = passphraseInput ? passphraseInput.value : '';
    const path = pathInput ? pathInput.value.trim() : "m/44'/60'/0'/0/0";

    if (deriveBtn) {
      deriveBtn.disabled = true;
      deriveBtn.textContent = 'Deriving Keys & Hash Digests...';
    }

    try {
      const result = await pipeline.deriveFullPipeline(mnemonic, passphrase, path);
      state.currentResult = result;

      // Safe property extraction
      const s1 = result.step1 || {};
      const s2 = result.step2 || {};
      const s3 = result.step3 || {};
      const s4 = result.step4 || {};
      const s5 = result.step5 || {};
      const s6 = result.step6 || {};
      const s7 = result.step7 || {};
      const s8 = result.step8 || {};

      const entropyHex = s1.entropyHex || '00000000000000000000000000000000';
      const wordCount = s1.wordCount || mnemonic.trim().split(/\s+/).length;
      const checksumHex = s1.checksumHex || '0';
      const seedHex = s2.seedHex || result.seedHex || '';
      const masterKey = s3.masterPrivateKeyHex || result.masterSecretHex || '';
      const masterChain = s3.masterChainCodeHex || result.masterChainCodeHex || '';
      const derivedPriv = s4.derivedPrivateKeyHex || result.derivedPrivateKey || '';
      const pubUncomp = s5.uncompressedPublicKeyHex || result.publicKeyUncompressed || '';
      const pubX = s5.xHex || (result.publicKeyPoint ? result.publicKeyPoint.x : '');
      const pubY = s5.yHex || (result.publicKeyPoint ? result.publicKeyPoint.y : '');
      const keccakHash = s6.keccakHashHex || result.keccak256Hash || '';
      const rawAddr = s7.rawAddress || result.rawAddress || '';
      const checksumAddr = s8.checksummedAddress || result.checksummedAddress || '';

      // Update Pipeline Step Cards
      setText('step1EntropyHex', entropyHex);
      setText('step1WordCount', `${wordCount} words (Checksum: 0x${checksumHex})`);
      setText('step2SeedHex', seedHex);
      setText('step3MasterKeyHex', masterKey);
      setText('step3ChainCodeHex', masterChain);
      setText('step4PathDisplay', path);
      setText('step4DerivedKeyHex', derivedPriv);
      setText('step5PubKeyHex', pubUncomp);
      setText('step5PointCoords', `X: ${pubX}\nY: ${pubY}`);
      setText('step6HashHex', keccakHash);
      setText('step7RawAddress', rawAddr);
      setText('step8ChecksumAddress', checksumAddr);

      // Render EIP-55 Visualizer Tiles
      renderEip55Tiles(checksumAddr, rawAddr);

      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'status-banner status-success';
        statusMsg.innerHTML = `&check; <strong>Pipeline Executed:</strong> Derived Ethereum Address <code>${checksumAddr}</code> (EIP-55 Checksum Verified).`;
      }
    } catch (err) {
      console.error(err);
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'status-banner status-error';
        statusMsg.innerHTML = `&cross; <strong>Derivation Error:</strong> ${err.message}`;
      }
    } finally {
      if (deriveBtn) {
        deriveBtn.disabled = false;
        deriveBtn.innerHTML = 'Execute Full Cryptographic Pipeline &rarr;';
      }
    }
  }

  function renderEip55Tiles(checksumAddress, rawAddress) {
    const container = document.getElementById('eip55TilesContainer');
    if (!container) return;
    container.innerHTML = '';

    const cleanCheck = checksumAddress.slice(2);
    const cleanRaw = rawAddress.slice(2);

    for (let i = 0; i < cleanCheck.length; i++) {
      const charCheck = cleanCheck[i];
      const charRaw = cleanRaw[i];
      const isLetter = /[a-fA-F]/.test(charCheck);
      const isUpper = isLetter && charCheck === charCheck.toUpperCase();

      const tile = document.createElement('div');
      tile.className = `eip55-tile ${isUpper ? 'upper' : 'lower'}`;
      tile.innerHTML = `
        <span class="char">${charCheck}</span>
        <span class="hash-nibble">${isUpper ? '&ge;8' : '&lt;8'}</span>
      `;
      container.appendChild(tile);
    }
  }

  async function runWalletAvalancheExperiment() {
    const pipeline = state.pipeline;
    const mnemonicInput = document.getElementById('mnemonicInput');
    const statusMsg = document.getElementById('derivationStatusMsg');
    const tableBody = document.getElementById('walletAvalancheTableBody');
    if (!mnemonicInput || !tableBody) return;

    const baseMnemonic = mnemonicInput.value.trim() || state.defaultMnemonic;
    const words = baseMnemonic.split(/\s+/);
    if (words.length < 12) return;

    // Mutate word 0 to an adjacent word in bip39 dictionary
    const dict = pipeline.bip39.wordlist;
    const currentWord = words[0];
    const currentIndex = dict.indexOf(currentWord);
    const newWord = dict[(currentIndex + 1) % dict.length];

    const mutatedWords = [...words];
    mutatedWords[0] = newWord;
    const mutatedMnemonic = mutatedWords.join(' ');

    setText('avalancheMutatedMnemonic', mutatedMnemonic);

    try {
      const baseRes = await pipeline.deriveFullPipeline(baseMnemonic, '', "m/44'/60'/0'/0/0");
      const mutRes = await pipeline.deriveFullPipeline(mutatedMnemonic, '', "m/44'/60'/0'/0/0");

      const countBitFlips = (hex1, hex2) => {
        let flips = 0;
        let total = 0;
        const b1 = hexToBytes(hex1);
        const b2 = hexToBytes(hex2);
        const len = Math.min(b1.length, b2.length);
        for (let i = 0; i < len; i++) {
          let xor = b1[i] ^ b2[i];
          while (xor > 0) {
            flips += xor & 1;
            xor >>= 1;
          }
          total += 8;
        }
        return { flips, total, pct: (flips / total) * 100 };
      };

      const stages = [
        { name: 'PBKDF2 Seed (512 bits)', h1: baseRes.step2.seedHex, h2: mutRes.step2.seedHex, target: '~50.0% (Cryptographic PRF)' },
        { name: 'BIP-32 Derived Key (256 bits)', h1: baseRes.step4.derivedPrivateKeyHex, h2: mutRes.step4.derivedPrivateKeyHex, target: '~50.0% (HMAC-SHA512)' },
        { name: 'secp256k1 Public Key (512 bits)', h1: baseRes.step5.uncompressedPublicKeyHex.slice(2), h2: mutRes.step5.uncompressedPublicKeyHex.slice(2), target: 'Algebraic diffusion on curve' },
        { name: 'Keccak-256 Digest (256 bits)', h1: baseRes.step6.keccakHashHex, h2: mutRes.step6.keccakHashHex, target: '~50.0% (Sponge permutation)' },
        { name: 'Ethereum Address (160 bits)', h1: baseRes.step7.rawAddress.slice(2), h2: mutRes.step7.rawAddress.slice(2), target: '~50.0% (Strict avalanche)' }
      ];

      tableBody.innerHTML = '';
      stages.forEach(s => {
        const stats = countBitFlips(s.h1, s.h2);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${s.name}</strong></td>
          <td>${stats.flips} / ${stats.total} bits (<strong>${stats.pct.toFixed(1)}%</strong>)</td>
          <td>${s.target}</td>
        `;
        tableBody.appendChild(row);
      });

    } catch (e) {
      console.error('Avalanche test error:', e);
    }
  }

  function hexToBytes(hex) {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
    }
    return bytes;
  }

  // --- Formal Report Viewer & KaTeX Renderer ---
  function initReportViewer() {
    const container = document.getElementById('reportMarkdownContent');
    if (!container) return;

    container.innerHTML = `
      <h1>Module 2: From Wallet Seed to Ethereum Address</h1>
      <p><strong>Specification:</strong> BIP-32/39/44, SECP256K1, Keccak-256 &bull; <strong>Topic:</strong> Key Derivation Pipeline</p>

      <h2>1. The Cryptographic Pipeline Architecture</h2>
      <p>Ethereum addresses are generated through a multi-stage deterministic pipeline:</p>
      <pre><code>[Entropy (128-256 bits)] 
    &darr; SHA-256 Checksum + Wordlist mapping (BIP-39)
[Mnemonic Sentence (12-24 words)]
    &darr; PBKDF2 (HMAC-SHA512, 2048 rounds, salt="mnemonic"+passphrase)
[512-bit Binary Seed]
    &darr; HMAC-SHA512("Bitcoin seed", Seed) (BIP-32)
[Master Private Key (IL) + Master Chain Code (IR)]
    &darr; CKDpriv along path m / 44' / 60' / 0' / 0 / 0 (BIP-44)
[Derived 256-bit Private Key k]
    &darr; secp256k1 Point Multiplication Q = k &middot; G
[Uncompressed Public Key (65 bytes: 04 || X || Y)]
    &darr; Keccak-256(X || Y) [64-byte payload without 0x04]
[32-byte Keccak-256 Hash Digest]
    &darr; Slice last 20 bytes (least significant 160 bits)
[Raw 20-byte Ethereum Address]
    &darr; EIP-55 Mixed-Case Capitalization via Keccak-256(lowercase_address)
[Final Checksummed Address (0x...)]</code></pre>

      <h2>2. Distinct Cryptographic Primitives & Roles</h2>
      <table class="matrix-table" style="margin: 20px 0;">
        <thead>
          <tr>
            <th>Primitive Category</th>
            <th>Specific Algorithm in Pipeline</th>
            <th>Mathematical Role & Guarantee</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Key Generation vs Derivation</td>
            <td>CSPRNG (Generation) &rarr; BIP-32/BIP-44 (Derivation)</td>
            <td>Entropy creation vs deterministic hierarchical key tree expansion.</td>
          </tr>
          <tr>
            <td>Public-Key Cryptography</td>
            <td>secp256k1 (Koblitz curve over $\\mathbb{F}_p$)</td>
            <td>Asymmetric trapdoor one-way function enabling ECDSA digital signatures.</td>
          </tr>
          <tr>
            <td>Cryptographic Hashing</td>
            <td>Keccak-256 & SHA-512</td>
            <td>Collision-resistant, pre-image resistant fixed-size digest creation.</td>
          </tr>
          <tr>
            <td>Error-Detection Checksums</td>
            <td>BIP-39 (SHA-256 bits) & EIP-55 (Keccak nibbles)</td>
            <td>Typographical and transmission error detection (human usability).</td>
          </tr>
          <tr>
            <td>Encoding</td>
            <td>Hexadecimal & ASCII</td>
            <td>Reversible representation without cryptographic keys.</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Historical Context & The Keccak-256 vs SHA-3 Divergence</h2>
      <p>Ethereum uses <strong>Keccak-256</strong>, which differs from NIST's standardized <strong>SHA3-256 (FIPS 202)</strong>. The Keccak team submitted the sponge construction with padding <code>0x01 ... 0x80</code>. When NIST finalized FIPS 202 in August 2015, they introduced a 2-bit domain separation suffix (<code>01</code>), changing the padding byte to <code>0x06</code>. Ethereum had already launched its genesis block in July 2015 with Keccak-256, choosing to preserve consensus stability rather than change hash functions.</p>

      <h2>4. Why Ethereum Uses a Multi-Primitive Architecture</h2>
      <ul>
        <li><strong>Separation of Concerns:</strong> Different primitives solve fundamentally different mathematical problems: asymmetric signing requires abelian group structure (secp256k1), while address generation requires irreversible compression (Keccak-256).</li>
        <li><strong>Storage Optimization & Quantum Defense:</strong> Compressing 64-byte public keys to 20-byte addresses saves massive state storage in the Merkle Patricia Trie and protects public keys from quantum Shor's algorithm attacks until the account broadcasts its first signed transaction!</li>
        <li><strong>Defense in Depth:</strong> If a vulnerability is found in SHA-512 or BIP-32, the secp256k1 signature scheme and Keccak-256 address hashing remain independently secure.</li>
      </ul>
    `;

    renderMath(container);
  }

  function renderMath(el) {
    if (!el) return;
    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
        return;
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window.renderMathInElement === 'function') {
        clearInterval(interval);
        try {
          window.renderMathInElement(el, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {}
      } else if (attempts > 12) {
        clearInterval(interval);
      }
    }, 150);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

})();
