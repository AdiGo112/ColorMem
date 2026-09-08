import { useEffect, useRef, useCallback } from 'react';

// ─── Color Bubble Class ────────────────────────────────────────────────────
class Bubble {
  constructor(canvas, mouse) {
    this.canvas = canvas;
    this.mouse = mouse;
    this.reset(true);
  }

  reset(initial = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.radius = Math.random() * 35 + 15;
    this.x = initial ? Math.random() * w : Math.random() * w;
    this.y = initial ? Math.random() * h : Math.random() * h;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = (Math.random() - 0.5) * 1.2;
    this.hue = Math.random() * 360;
    this.saturation = Math.random() * 40 + 60;
    this.lightness = Math.random() * 25 + 45;
    this.alpha = Math.random() * 0.4 + 0.3;
    this.baseAlpha = this.alpha;
    this.pulseSpeed = Math.random() * 0.02 + 0.005;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.hueSpeed = (Math.random() - 0.5) * 0.3;
  }

  update(time) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase);
    this.alpha = this.baseAlpha + pulse * 0.1;
    const sizeWobble = 1 + pulse * 0.05;

    this.hue = (this.hue + this.hueSpeed + 360) % 360;

    if (this.mouse.active) {
      const dx = this.x - this.mouse.x;
      const dy = this.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const interactRadius = 180;

      if (dist < interactRadius && dist > 0) {
        if (this.mouse.pressed) {
          const force = (interactRadius - dist) / interactRadius * 0.08;
          this.vx -= (dx / dist) * force;
          this.vy -= (dy / dist) * force;
          this.alpha = Math.min(0.9, this.alpha + 0.2);
        } else {
          const force = (interactRadius - dist) / interactRadius * 0.03;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
      }
    }

    this.vx += (Math.random() - 0.5) * 0.02;
    this.vy += (Math.random() - 0.5) * 0.02;
    this.vx *= 0.995;
    this.vy *= 0.995;

    const maxVel = 3;
    const vel = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (vel > maxVel) {
      this.vx = (this.vx / vel) * maxVel;
      this.vy = (this.vy / vel) * maxVel;
    }

    this.x += this.vx;
    this.y += this.vy;

    const margin = this.radius * 2;
    if (this.x < -margin) this.x = w + margin;
    if (this.x > w + margin) this.x = -margin;
    if (this.y < -margin) this.y = h + margin;
    if (this.y > h + margin) this.y = -margin;

    this.displayRadius = this.radius * sizeWobble;
  }

  draw(ctx) {
    const grad = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.displayRadius * 2
    );
    grad.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha * 0.6})`);
    grad.addColorStop(0.4, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha * 0.2})`);
    grad.addColorStop(1, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0)`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.displayRadius * 2, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    const coreGrad = ctx.createRadialGradient(
      this.x - this.displayRadius * 0.2,
      this.y - this.displayRadius * 0.2,
      0,
      this.x, this.y, this.displayRadius
    );
    const coreL = Math.min(this.lightness + 15, 85);
    coreGrad.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${coreL}%, ${this.alpha * 0.9})`);
    coreGrad.addColorStop(0.7, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha * 0.7})`);
    coreGrad.addColorStop(1, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha * 0.1})`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.displayRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      this.x - this.displayRadius * 0.25,
      this.y - this.displayRadius * 0.25,
      this.displayRadius * 0.18,
      0, Math.PI * 2
    );
    ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${this.alpha * 0.5})`;
    ctx.fill();
  }
}

// ─── Spark Particle ────────────────────────────────────────────────────────
class Spark {
  constructor(x, y, hue) {
    this.x = x;
    this.y = y;
    this.hue = hue + (Math.random() - 0.5) * 40;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.decay = Math.random() * 0.03 + 0.015;
    this.radius = Math.random() * 3 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.life -= this.decay;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.life, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 90%, 70%, ${this.life * 0.8})`;
    ctx.fill();
  }
}

// ─── Connection Lines ──────────────────────────────────────────────────────
function drawConnections(ctx, bubbles) {
  const maxDist = 150;
  for (let i = 0; i < bubbles.length; i++) {
    for (let j = i + 1; j < bubbles.length; j++) {
      const a = bubbles[i];
      const b = bubbles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * 0.08;
        const hue = (a.hue + b.hue) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

// ─── BubbleBackground Component ────────────────────────────────────────────
export default function BubbleBackground({ interactive = false }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bubblesRef = useRef([]);
  const sparksRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false, pressed: false });
  const startTimeRef = useRef(Date.now());

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    handleResize();
    window.addEventListener('resize', handleResize);

    const count = Math.min(Math.floor(window.innerWidth / 50), 30);
    const mouse = mouseRef.current;
    bubblesRef.current = Array.from({ length: count }, () =>
      new Bubble({ width: window.innerWidth, height: window.innerHeight }, mouse)
    );

    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
    const onMouseDown = (e) => {
      mouse.pressed = true;
      const hue = Math.random() * 360;
      for (let i = 0; i < 12; i++) sparksRef.current.push(new Spark(e.clientX, e.clientY, hue));
    };
    const onMouseUp = () => { mouse.pressed = false; };
    const onMouseLeave = () => { mouse.active = false; mouse.pressed = false; };

    const onTouchMove = (e) => { const t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; mouse.active = true; };
    const onTouchStart = (e) => {
      const t = e.touches[0]; mouse.x = t.clientX; mouse.y = t.clientY; mouse.active = true; mouse.pressed = true;
      const hue = Math.random() * 360;
      for (let i = 0; i < 12; i++) sparksRef.current.push(new Spark(t.clientX, t.clientY, hue));
    };
    const onTouchEnd = () => { mouse.pressed = false; mouse.active = false; };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);

    const ctx = canvas.getContext('2d');
    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      const time = (Date.now() - startTimeRef.current) / 1000;

      // Reset transform to clear the full physical canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w * dpr, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      bubblesRef.current.forEach(b => {
        b.canvas = { width: w, height: h };
        b.mouse = mouse;
        b.update(time);
      });

      drawConnections(ctx, bubblesRef.current);
      bubblesRef.current.forEach(b => b.draw(ctx));

      sparksRef.current = sparksRef.current.filter(s => s.life > 0);
      sparksRef.current.forEach(s => { s.update(); s.draw(ctx); });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleResize]);

  return <canvas ref={canvasRef} className="bubble-canvas" style={interactive ? { pointerEvents: 'auto' } : undefined} />;
}
