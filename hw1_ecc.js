/**
 * Module 1: Toy Elliptic Curve Cryptography & Statistical Exploration
 * Domain: Modular Arithmetic & Elliptic Curve Cryptography
 * Curve: y^2 = x^3 + 7 (mod 17), Base Point G = (1, 5)
 */

(function (window) {
  'use strict';

  // --- Finite Field Arithmetic Helper Functions ---
  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function modInverse(a, m) {
    a = mod(a, m);
    if (a === 0) return null;
    let [m0, y, x] = [m, 0, 1];
    while (a > 1) {
      if (m === 0) return null;
      let q = Math.floor(a / m);
      let t = m;
      m = a % m;
      a = t;
      t = y;
      y = x - q * y;
      x = t;
    }
    if (x < 0) x += m0;
    return x;
  }

  // --- Elliptic Curve Class over F_p ---
  class ToyEllipticCurve {
    constructor(p = 17, a = 0, b = 7) {
      this.p = p;
      this.a = a;
      this.b = b;
      this.cachedPoints = null;
    }

    isPointOnCurve(P) {
      if (!P) return true; // Point at infinity O
      const { x, y } = P;
      const left = mod(y * y, this.p);
      const right = mod(x * x * x + this.a * x + this.b, this.p);
      return left === right;
    }

    addPoints(P, Q) {
      // Point at infinity handling
      if (!P) return Q;
      if (!Q) return P;

      const p = this.p;
      const a = this.a;

      // P + (-P) = O
      if (P.x === Q.x && mod(P.y + Q.y, p) === 0) {
        return null;
      }

      let m;
      if (P.x === Q.x && P.y === Q.y) {
        // Point Doubling: m = (3*x1^2 + a) / (2*y1) mod p
        if (P.y === 0) return null; // Vertical tangent
        const num = mod(3 * P.x * P.x + a, p);
        const den = mod(2 * P.y, p);
        const invDen = modInverse(den, p);
        if (invDen === null) return null;
        m = mod(num * invDen, p);
      } else {
        // Point Addition: m = (y2 - y1) / (x2 - x1) mod p
        const num = mod(Q.y - P.y, p);
        const den = mod(Q.x - P.x, p);
        const invDen = modInverse(den, p);
        if (invDen === null) return null;
        m = mod(num * invDen, p);
      }

      // x3 = m^2 - x1 - x2 mod p
      const x3 = mod(m * m - P.x - Q.x, p);
      // y3 = m*(x1 - x3) - y1 mod p
      const y3 = mod(m * (P.x - x3) - P.y, p);

      return { x: x3, y: y3, slope: m };
    }

    // Scalar multiplication returning full history of steps (Naive repeated addition)
    scalarMultiplyHistory(k, G) {
      const history = [];
      let current = null;

      for (let i = 1; i <= k; i++) {
        if (i === 1) {
          current = { x: G.x, y: G.y };
          history.push({
            step: 1,
            label: '1G',
            point: { ...current },
            prevPoint: null,
            addPoint: G,
            slope: null,
            interPoint: { x: current.x, y: mod(this.p - current.y, this.p) }
          });
        } else {
          const prev = { ...current };
          const result = this.addPoints(current, G);
          let inter = null;
          if (result) {
            inter = { x: result.x, y: mod(this.p - result.y, this.p) };
          }
          current = result ? { x: result.x, y: result.y } : null;
          history.push({
            step: i,
            label: `${i}G`,
            point: current ? { ...current } : null,
            prevPoint: prev,
            addPoint: G,
            slope: result ? result.slope : null,
            interPoint: inter
          });
        }
      }
      return history;
    }

    // Double-and-Add algorithm for fast scalar multiplication
    scalarMultiplyDoubleAndAdd(k, G) {
      const steps = [];
      let current = null;
      let temp = { ...G };
      const binary = k.toString(2);

      steps.push({
        type: 'INIT',
        binary,
        description: `Represent private key k = ${k} in binary: ${binary}`
      });

      for (let i = 0; i < binary.length; i++) {
        const bit = binary[i];
        if (i > 0) {
          const prev = current ? { ...current } : null;
          current = this.addPoints(current, current);
          steps.push({
            type: 'DOUBLE',
            bitIndex: i,
            bit,
            prev,
            result: current ? { ...current } : null,
            description: `Bit ${i} (${bit}): Double current accumulated point`
          });
        }
        if (bit === '1') {
          if (!current) {
            current = { ...G };
            steps.push({
              type: 'ADD_BASE',
              bitIndex: i,
              bit,
              result: { ...current },
              description: `Bit ${i} (${bit}): Initialize accumulator with G = (${G.x}, ${G.y})`
            });
          } else if (i > 0) {
            const prev = { ...current };
            current = this.addPoints(current, G);
            steps.push({
              type: 'ADD',
              bitIndex: i,
              bit,
              prev,
              result: current ? { ...current } : null,
              description: `Bit ${i} (${bit}): Add G = (${G.x}, ${G.y}) to accumulator`
            });
          }
        }
      }

      return { finalPoint: current, steps };
    }

    // Find all affine points on the curve in F_p
    findAllPoints() {
      if (this.cachedPoints) return this.cachedPoints;
      const points = [];
      for (let x = 0; x < this.p; x++) {
        const rhs = mod(x * x * x + this.a * x + this.b, this.p);
        for (let y = 0; y < this.p; y++) {
          if (mod(y * y, this.p) === rhs) {
            points.push({ x, y });
          }
        }
      }
      this.cachedPoints = points;
      return points;
    }

    // Calculate order of any point
    computePointOrder(P) {
      if (!P) return 1;
      let cur = { ...P };
      let order = 1;
      while (cur !== null) {
        order++;
        cur = this.addPoints(cur, P);
        if (order > this.p * 2 + 5) break; // Safeguard
      }
      return order;
    }

    // Compute orders for all points
    computeAllPointOrders() {
      const all = this.findAllPoints();
      return all.map(pt => ({
        point: pt,
        order: this.computePointOrder(pt)
      }));
    }

    // Get the cyclic subgroup generated by P
    getSubgroup(P) {
      if (!P) return [{ k: 1, point: null }];
      const group = [];
      let cur = { ...P };
      let k = 1;
      while (cur !== null) {
        group.push({ k, point: { ...cur } });
        k++;
        cur = this.addPoints(cur, P);
        if (k > 50) break;
      }
      group.push({ k, point: null }); // Identity element O
      return group;
    }
  }

  // --- Discrete Canvas Visualizer (F_17 x F_17 Grid) ---
  class DiscreteGridVisualizer {
    constructor(canvas, curve) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.curve = curve;
      this.currentStep = null;
      this.allPoints = curve.findAllPoints();
      this.animationProgress = 1;

      if (typeof window !== 'undefined' && window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.resize();
        });
        this.resizeObserver.observe(this.canvas);
      }
    }

    checkResolution() {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        return true;
      }
      return false;
    }

    resize() {
      this.checkResolution();
      this.render();
    }

    getGridGeometry(paddingLeft = 48, paddingRight = 24, paddingTop = 36, paddingBottom = 38) {
      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width || 700;
      const h = rect.height || 480;
      const availW = Math.max(10, w - paddingLeft - paddingRight);
      const availH = Math.max(10, h - paddingTop - paddingBottom);
      const gridSize = Math.min(availW, availH);
      const originX = paddingLeft + (availW - gridSize) / 2;
      const originY = paddingTop + (availH - gridSize) / 2;
      const p = this.curve.p;
      const step = gridSize / (p - 1);

      return {
        width: w,
        height: h,
        gridSize,
        originX,
        originY,
        step,
        toCanvas: (x, y) => ({
          cx: originX + x * step,
          cy: originY + (p - 1 - y) * step
        })
      };
    }

    toCanvasCoords(x, y) {
      const geo = this.getGridGeometry();
      return geo.toCanvas(x, y);
    }

    drawStep(stepData) {
      this.render(stepData);
    }

    render(stepData = this.currentStep) {
      this.currentStep = stepData;
      this.checkResolution();

      const ctx = this.ctx;
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (!width || !height) return;

      const p = this.curve.p;
      const geo = this.getGridGeometry();
      const { originX, originY, gridSize, toCanvas } = geo;

      ctx.clearRect(0, 0, width, height);

      // Deep dark futuristic canvas backdrop
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid area background fill
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(originX, originY, gridSize, gridSize);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(originX, originY, gridSize, gridSize);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < p; i++) {
        const { cx: x1, cy: y1 } = toCanvas(i, 0);
        const { cx: x2, cy: y2 } = toCanvas(i, p - 1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const { cx: hx1, cy: hy1 } = toCanvas(0, i);
        const { cx: hx2, cy: hy2 } = toCanvas(p - 1, i);
        ctx.beginPath();
        ctx.moveTo(hx1, hy1);
        ctx.lineTo(hx2, hy2);
        ctx.stroke();

        // Axis numeric labels (monospace)
        ctx.fillStyle = '#64748b';
        ctx.font = '500 10px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x1, originY + gridSize + 18);

        ctx.textAlign = 'right';
        ctx.fillText(i.toString(), originX - 10, hy1 + 4);
      }

      // Title & Field Info Header
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Discrete Affine Plane \uD835\uDD3D\u2081\u2087 \u00d7 \uD835\uDD3D\u2081\u2087 (17\u00d717 Grid)`, 16, 22);

      // Symmetry line y = 8.5 (reflection axis mod 17)
      const { cy: symY } = toCanvas(0, 8.5);
      ctx.strokeStyle = '#38bdf855';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(originX, symY);
      ctx.lineTo(originX + gridSize, symY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8aa';
      ctx.font = '500 10px "Inter", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Reflection Axis (y = 8.5)', originX + gridSize, symY - 6);

      // Draw all valid points on curve as subtle dots
      for (const pt of this.allPoints) {
        const { cx, cy } = toCanvas(pt.x, pt.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#0ea5e944';
        ctx.fill();
        ctx.strokeStyle = '#38bdf888';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // If step data is provided, draw algebraic chords and modular line
      if (stepData) {
        const { prevPoint, addPoint, point: finalPoint, interPoint, slope, label, step } = stepData;

        // Draw modular line segments if slope is defined
        if (slope !== null && prevPoint && addPoint) {
          ctx.strokeStyle = '#f59e0b77';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);

          // Plot points on the line: y = slope * (x - x1) + y1 mod p
          for (let x = 0; x < p; x++) {
            const y = mod(slope * (x - prevPoint.x) + prevPoint.y, p);
            const { cx, cy } = toCanvas(x, y);
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0baa';
            ctx.fill();
          }
          ctx.setLineDash([]);
        }

        // Draw line connecting P, Q and -R if points exist
        if (prevPoint && addPoint && interPoint) {
          const { cx: xP, cy: yP } = toCanvas(prevPoint.x, prevPoint.y);
          const { cx: xQ, cy: yQ } = toCanvas(addPoint.x, addPoint.y);
          const { cx: xR, cy: yR } = toCanvas(interPoint.x, interPoint.y);

          ctx.strokeStyle = '#f59e0bdd';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(xP, yP);
          ctx.lineTo(xQ, yQ);
          ctx.stroke();

          // Connect to intersection point -R
          ctx.beginPath();
          ctx.moveTo(xQ, yQ);
          ctx.lineTo(xR, yR);
          ctx.stroke();

          // Vertical reflection line from -R to +R
          if (finalPoint) {
            const { cx: xF, cy: yF } = toCanvas(finalPoint.x, finalPoint.y);
            ctx.strokeStyle = '#ec4899dd';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(xR, yR);
            ctx.lineTo(xF, yF);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw -R (intersection before reflection)
            ctx.beginPath();
            ctx.arc(xR, yR, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#f43f5e';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#f43f5e';
            ctx.font = 'bold 11px "Fira Code", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`-R (${interPoint.x}, ${interPoint.y})`, xR + 10, yR + 4);
          }
        }

        // Highlight P (Previous point)
        if (prevPoint) {
          const { cx, cy } = toCanvas(prevPoint.x, prevPoint.y);
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#6366f1';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#a5b4fc';
          ctx.font = 'bold 11px "Fira Code", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`P (${prevPoint.x}, ${prevPoint.y})`, cx - 10, cy - 8);
        }

        // Highlight Q = G (Base point being added)
        if (addPoint) {
          const { cx, cy } = toCanvas(addPoint.x, addPoint.y);
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 11px "Fira Code", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`G (${addPoint.x}, ${addPoint.y})`, cx + 10, cy - 8);
        }

        // Highlight Final Point +R = kG
        if (finalPoint) {
          const { cx, cy } = toCanvas(finalPoint.x, finalPoint.y);
          ctx.beginPath();
          ctx.arc(cx, cy, 9, 0, Math.PI * 2);
          ctx.fillStyle = '#ec4899';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Outer glowing ring
          ctx.beginPath();
          ctx.arc(cx, cy, 15, 0, Math.PI * 2);
          ctx.strokeStyle = '#ec489988';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#fbcfe8';
          ctx.font = 'bold 12px "Fira Code", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${label} = (${finalPoint.x}, ${finalPoint.y})`, cx + 16, cy + 4);
        } else {
          // Point at infinity O
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 14px "Fira Code", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`Point at Infinity \ud835\udcde reached! (${label} = \ud835\udcde)`, originX + gridSize / 2, originY + gridSize / 2);
        }
      }
    }
  }

  // --- Continuous Real Elliptic Curve Visualizer (Intuition) ---
  class ContinuousCurveVisualizer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.currentX = 1.0;
      this.isHovering = false;
      this.isAutoSweeping = false;
      this.sweepDirection = 1;
      this.sweepTimer = null;

      if (typeof window !== 'undefined' && window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.resize();
        });
        this.resizeObserver.observe(this.canvas);
      }

      this.initInteractivity();
    }

    initInteractivity() {
      const canvas = this.canvas;
      canvas.style.cursor = 'grab';

      const updatePointer = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const px = clientX - rect.left;
        const padding = 28;
        const width = rect.width;
        const minX = -3, maxX = 5;
        let x = minX + ((px - padding) / (width - padding * 2)) * (maxX - minX);
        const xRoot = -Math.cbrt(7); // ~ -1.9129
        x = Math.max(xRoot + 0.1, Math.min(x, 3.6));
        this.currentX = x;
        this.render();
      };

      canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 1 || this.isHovering) {
          canvas.style.cursor = 'grabbing';
          updatePointer(e);
        }
      });

      canvas.addEventListener('mousedown', (e) => {
        this.isHovering = true;
        canvas.style.cursor = 'grabbing';
        if (this.isAutoSweeping) this.stopAutoSweep();
        updatePointer(e);
      });

      window.addEventListener('mouseup', () => {
        canvas.style.cursor = 'grab';
      });

      canvas.addEventListener('mouseenter', () => {
        this.isHovering = true;
      });

      canvas.addEventListener('mouseleave', () => {
        this.isHovering = false;
        canvas.style.cursor = 'grab';
      });

      canvas.addEventListener('touchstart', (e) => {
        if (this.isAutoSweeping) this.stopAutoSweep();
        updatePointer(e);
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        updatePointer(e);
      }, { passive: true });
    }

    toggleAutoSweep() {
      if (this.isAutoSweeping) {
        this.stopAutoSweep();
      } else {
        this.startAutoSweep();
      }
      return this.isAutoSweeping;
    }

    startAutoSweep() {
      if (this.isAutoSweeping) return;
      this.isAutoSweeping = true;
      const stepSweep = () => {
        if (!this.isAutoSweeping) return;
        const speed = 0.02 * this.sweepDirection;
        this.currentX += speed;
        if (this.currentX > 3.4) {
          this.currentX = 3.4;
          this.sweepDirection = -1;
        } else if (this.currentX < -1.4) {
          this.currentX = -1.4;
          this.sweepDirection = 1;
        }
        this.render();
        this.sweepTimer = requestAnimationFrame(stepSweep);
      };
      this.sweepTimer = requestAnimationFrame(stepSweep);
    }

    stopAutoSweep() {
      this.isAutoSweeping = false;
      if (this.sweepTimer) {
        cancelAnimationFrame(this.sweepTimer);
        this.sweepTimer = null;
      }
      this.render();
    }

    checkResolution() {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        return true;
      }
      return false;
    }

    resize() {
      this.checkResolution();
      this.render();
    }

    render() {
      this.checkResolution();
      const ctx = this.ctx;
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (!width || !height) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Coordinate mapping: x in [-3, 5], y in [-6, 6]
      const minX = -3, maxX = 5;
      const minY = -6, maxY = 6;
      const padding = 28;
      const toScreen = (x, y) => ({
        sx: padding + ((x - minX) / (maxX - minX)) * (width - padding * 2),
        sy: (height - padding) - ((y - minY) / (maxY - minY)) * (height - padding * 2)
      });

      // Draw subtle grid axes
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const origin = toScreen(0, 0);

      // X Axis
      ctx.beginPath();
      ctx.moveTo(padding, origin.sy);
      ctx.lineTo(width - padding, origin.sy);
      ctx.stroke();

      // Y Axis
      ctx.beginPath();
      ctx.moveTo(origin.sx, padding);
      ctx.lineTo(origin.sx, height - padding);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px "Fira Code", monospace';
      ctx.fillText('(0,0)', origin.sx + 4, origin.sy + 12);

      // Continuous Curve: y^2 = x^3 + 7 => y = \pm sqrt(x^3 + 7)
      // Real root at x = -cbrt(7) \approx -1.9129
      const xRoot = -Math.cbrt(7);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;

      // Positive branch
      ctx.beginPath();
      let first = true;
      for (let x = xRoot; x <= maxX; x += 0.04) {
        const val = x * x * x + 7;
        if (val >= 0) {
          const y = Math.sqrt(val);
          const p = toScreen(x, y);
          if (first) {
            ctx.moveTo(p.sx, p.sy);
            first = false;
          } else {
            ctx.lineTo(p.sx, p.sy);
          }
        }
      }
      ctx.stroke();

      // Negative branch
      ctx.beginPath();
      first = true;
      for (let x = xRoot; x <= maxX; x += 0.04) {
        const val = x * x * x + 7;
        if (val >= 0) {
          const y = -Math.sqrt(val);
          const p = toScreen(x, y);
          if (first) {
            ctx.moveTo(p.sx, p.sy);
            first = false;
          } else {
            ctx.lineTo(p.sx, p.sy);
          }
        }
      }
      ctx.stroke();

      // Continuous chord and tangent computation
      const x1 = this.currentX;
      const val1 = x1 * x1 * x1 + 7;
      if (val1 <= 0) return;
      const y1 = Math.sqrt(val1);

      // Tangent slope: m = 3*x1^2 / (2*y1)
      const m = (3 * x1 * x1) / (2 * y1);
      const x3 = m * m - 2 * x1;
      const y3_inter = m * (x3 - x1) + y1;
      const y3_final = -y3_inter;

      const pP = toScreen(x1, y1);
      const pR_inter = toScreen(x3, y3_inter);
      const pR_final = toScreen(x3, y3_final);

      // Tangent line extending across visible window
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const pStart = toScreen(-2.5, m * (-2.5 - x1) + y1);
      const pEnd = toScreen(4.5, m * (4.5 - x1) + y1);
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pEnd.sx, pEnd.sy);
      ctx.stroke();

      // Vertical reflection line
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pR_inter.sx, pR_inter.sy);
      ctx.lineTo(pR_final.sx, pR_final.sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw points with glowing accents
      // Point P
      ctx.beginPath();
      ctx.arc(pP.sx, pP.sy, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#6366f166';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(pP.sx, pP.sy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Point -R
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(pR_inter.sx, pR_inter.sy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Point +R (Reflection = 2P)
      ctx.beginPath();
      ctx.arc(pR_final.sx, pR_final.sy, 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#ec489966';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(pR_final.sx, pR_final.sy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Point labels
      ctx.fillStyle = '#a5b4fc';
      ctx.font = '500 10px "Fira Code", monospace';
      ctx.fillText(`P (${x1.toFixed(2)}, ${y1.toFixed(2)})`, pP.sx + 8, pP.sy - 6);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`-R (${x3.toFixed(2)}, ${y3_inter.toFixed(2)})`, pR_inter.sx + 8, pR_inter.sy + 4);

      ctx.fillStyle = '#fbcfe8';
      ctx.fillText(`+R = 2P (${x3.toFixed(2)}, ${y3_final.toFixed(2)})`, pR_final.sx + 8, pR_final.sy + 12);

      // Header Legend with live slope
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.fillText(`Real Curve y\u00b2 = x\u00b3 + 7 in \u211d\u00b2  \u2022  Tangent Slope m = ${m.toFixed(2)}`, 15, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 10px "Fira Code", monospace';
      ctx.fillText(`Drag mouse over canvas to move P  \u2022  Reflection across X-axis`, 15, 34);
    }
  }


  // --- Statistical Exploration Engine ---
  class ECCStatisticalEngine {
    constructor(curve, basePoint = { x: 1, y: 5 }) {
      this.curve = curve;
      this.basePoint = basePoint;
    }

    // Run exhaustive analysis of all multiples of basePoint
    analyzeSubgroupMultiples() {
      const order = this.curve.computePointOrder(this.basePoint);
      const orbit = [];
      let cur = { ...this.basePoint };
      for (let k = 1; k < order; k++) {
        orbit.push({ k, x: cur.x, y: cur.y });
        cur = this.curve.addPoints(cur, this.basePoint);
      }

      // Also analyze across all points of the curve
      const allPoints = this.curve.findAllPoints();

      return {
        order,
        orbit,
        allPoints,
        subgroupStats: this.calculatePointStats(orbit),
        fullCurveStats: this.calculatePointStats(allPoints.map((pt, i) => ({ k: i + 1, x: pt.x, y: pt.y })))
      };
    }

    calculatePointStats(dataPoints) {
      const p = this.curve.p;
      const N = dataPoints.length;

      // 1. Marginal distributions
      const xCounts = new Array(p).fill(0);
      const yCounts = new Array(p).fill(0);
      let sumX = 0, sumY = 0;

      dataPoints.forEach(pt => {
        xCounts[pt.x]++;
        yCounts[pt.y]++;
        sumX += pt.x;
        sumY += pt.y;
      });

      const meanX = sumX / N;
      const meanY = sumY / N;

      let varX = 0, varY = 0;
      dataPoints.forEach(pt => {
        varX += Math.pow(pt.x - meanX, 2);
        varY += Math.pow(pt.y - meanY, 2);
      });
      varX /= N;
      varY /= N;

      // 2. Bit distribution (5 bits since p = 17, values 0..16 fit in 5 bits)
      const numBits = 5;
      const bitCountsX = new Array(numBits).fill(0);
      const bitCountsY = new Array(numBits).fill(0);
      let totalHammingX = 0;
      let totalHammingY = 0;

      dataPoints.forEach(pt => {
        for (let b = 0; b < numBits; b++) {
          if ((pt.x >> b) & 1) bitCountsX[b]++;
          if ((pt.y >> b) & 1) bitCountsY[b]++;
        }
        totalHammingX += this.hammingWeight(pt.x);
        totalHammingY += this.hammingWeight(pt.y);
      });

      // 3. Shannon Entropy: H = -sum p_i * log2(p_i)
      let entropyX = 0, entropyY = 0;
      xCounts.forEach(c => {
        if (c > 0) {
          const prob = c / N;
          entropyX -= prob * Math.log2(prob);
        }
      });
      yCounts.forEach(c => {
        if (c > 0) {
          const prob = c / N;
          entropyY -= prob * Math.log2(prob);
        }
      });
      const maxEntropy = Math.log2(p); // Uniform distribution entropy

      // 4. Chi-Square Goodness-of-fit against Uniform U{0, p-1}
      const expected = N / p;
      let chiSquareX = 0, chiSquareY = 0;
      for (let i = 0; i < p; i++) {
        chiSquareX += Math.pow(xCounts[i] - expected, 2) / expected;
        chiSquareY += Math.pow(yCounts[i] - expected, 2) / expected;
      }

      // 5. Input-Output Correlation (k vs x and k vs y)
      let meanK = (N + 1) / 2;
      let covKX = 0, covKY = 0, varK = 0;
      dataPoints.forEach(pt => {
        const dk = pt.k - meanK;
        covKX += dk * (pt.x - meanX);
        covKY += dk * (pt.y - meanY);
        varK += dk * dk;
      });
      covKX /= N;
      covKY /= N;
      varK /= N;

      const stdK = Math.sqrt(varK);
      const stdX = Math.sqrt(varX);
      const stdY = Math.sqrt(varY);
      const corrKX = (stdK > 0 && stdX > 0) ? (covKX / (stdK * stdX)) : 0;
      const corrKY = (stdK > 0 && stdY > 0) ? (covKY / (stdK * stdY)) : 0;

      // 6. Strict Avalanche Criterion (SAC) simulation on private key bits
      const sacResults = this.testStrictAvalancheCriterion();

      return {
        sampleSize: N,
        meanX,
        meanY,
        varX,
        varY,
        xCounts,
        yCounts,
        bitCountsX,
        bitCountsY,
        avgHammingX: totalHammingX / N,
        avgHammingY: totalHammingY / N,
        entropyX,
        entropyY,
        maxEntropy,
        chiSquareX,
        chiSquareY,
        degreesOfFreedom: p - 1,
        corrKX,
        corrKY,
        sacResults
      };
    }

    hammingWeight(val) {
      let w = 0;
      while (val > 0) {
        w += val & 1;
        val >>= 1;
      }
      return w;
    }

    // Strict Avalanche Criterion test
    testStrictAvalancheCriterion() {
      const order = this.curve.computePointOrder(this.basePoint);
      const validKeys = [];
      for (let k = 1; k < order; k++) validKeys.push(k);

      let totalBitFlipsTested = 0;
      let totalOutputBitsFlipped = 0;
      const numInputBits = 4; // since order is 9, keys 1..8 use 4 bits
      const totalCoordBits = 10; // 5 bits for X, 5 bits for Y

      validKeys.forEach(k => {
        const Q = this.getMultiple(k);
        if (!Q) return;

        for (let bit = 0; bit < numInputBits; bit++) {
          const kPrime = k ^ (1 << bit);
          if (kPrime >= 1 && kPrime < order) {
            const QPrime = this.getMultiple(kPrime);
            if (QPrime) {
              const diffX = this.hammingWeight(Q.x ^ QPrime.x);
              const diffY = this.hammingWeight(Q.y ^ QPrime.y);
              totalOutputBitsFlipped += (diffX + diffY);
              totalBitFlipsTested++;
            }
          }
        }
      });

      const avgBitsFlipped = totalBitFlipsTested > 0 ? (totalOutputBitsFlipped / totalBitFlipsTested) : 0;
      const flipRatio = totalBitFlipsTested > 0 ? (avgBitsFlipped / totalCoordBits) : 0;

      return {
        totalBitFlipsTested,
        avgBitsFlipped,
        totalOutputBits: totalCoordBits,
        flipRatio,
        satisfiesSAC: Math.abs(flipRatio - 0.5) < 0.15
      };
    }

    getMultiple(k) {
      let cur = null;
      for (let i = 1; i <= k; i++) {
        cur = this.curve.addPoints(cur, this.basePoint);
      }
      return cur;
    }
  }

  // Export to window
  window.ToyEllipticCurve = ToyEllipticCurve;
  window.DiscreteGridVisualizer = DiscreteGridVisualizer;
  window.ContinuousCurveVisualizer = ContinuousCurveVisualizer;
  window.ECCStatisticalEngine = ECCStatisticalEngine;

})(window);
