import { useEffect, useRef } from "react";

export type BurstKind = "confetti" | "paws";

export interface Burst {
	/** Changes on every burst; that change is what triggers the spawn. */
	id: number;
	kind: BurstKind;
	/** Origin in viewport pixels. Defaults to the middle of the screen. */
	x?: number;
	y?: number;
}

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rot: number;
	vrot: number;
	size: number;
	life: number;
	maxLife: number;
	color: string;
	shape: BurstKind;
}

const GRAVITY = 0.28;
const DRAG = 0.99;

/**
 * A canvas overlay for celebration bursts.
 *
 * Canvas rather than DOM nodes because a hundred confetti pieces are a hundred
 * elements the browser has to lay out and composite every frame; on canvas they
 * are a hundred draw calls into one element. The loop only runs while particles
 * are alive, so an idle page costs nothing.
 */
export function Particles({ burst }: { burst: Burst | null }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particles = useRef<Particle[]>([]);
	const raf = useRef<number | null>(null);
	const lastBurst = useRef(-1);

	// Resize to the viewport, accounting for device pixel ratio so the shapes are
	// not blurry on a retina screen.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const fit = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.floor(window.innerWidth * dpr);
			canvas.height = Math.floor(window.innerHeight * dpr);
			canvas.style.width = `${window.innerWidth}px`;
			canvas.style.height = `${window.innerHeight}px`;
			const ctx = canvas.getContext("2d");
			if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		fit();
		window.addEventListener("resize", fit);
		return () => window.removeEventListener("resize", fit);
	}, []);

	useEffect(() => {
		if (!burst || burst.id === lastBurst.current) return;
		lastBurst.current = burst.id;

		// Someone who asked for less motion gets none of this, and the loop never
		// starts, so it costs nothing rather than being hidden with opacity.
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const palette = readPalette();
		const originX = burst.x ?? window.innerWidth / 2;
		const originY = burst.y ?? window.innerHeight / 3;
		const count = burst.kind === "confetti" ? 46 : 16;

		for (let i = 0; i < count; i++) {
			const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
			const speed = 5 + Math.random() * 7;
			const maxLife = 60 + Math.random() * 45;
			particles.current.push({
				x: originX + (Math.random() - 0.5) * 40,
				y: originY + (Math.random() - 0.5) * 20,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				rot: Math.random() * Math.PI * 2,
				vrot: (Math.random() - 0.5) * 0.28,
				size: burst.kind === "confetti" ? 5 + Math.random() * 6 : 9 + Math.random() * 6,
				life: maxLife,
				maxLife,
				color: palette[Math.floor(Math.random() * palette.length)],
				shape: burst.kind,
			});
		}

		if (raf.current === null) raf.current = requestAnimationFrame(step);
	}, [burst]);

	function step() {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) {
			raf.current = null;
			return;
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const alive: Particle[] = [];
		for (const p of particles.current) {
			p.vy += GRAVITY;
			p.vx *= DRAG;
			p.vy *= DRAG;
			p.x += p.vx;
			p.y += p.vy;
			p.rot += p.vrot;
			p.life -= 1;
			if (p.life <= 0 || p.y > window.innerHeight + 60) continue;

			ctx.save();
			ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.4));
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rot);
			ctx.fillStyle = p.color;
			if (p.shape === "confetti") drawConfetti(ctx, p.size);
			else drawPaw(ctx, p.size);
			ctx.restore();
			alive.push(p);
		}
		particles.current = alive;

		raf.current = alive.length > 0 ? requestAnimationFrame(step) : null;
	}

	useEffect(
		() => () => {
			if (raf.current !== null) cancelAnimationFrame(raf.current);
		},
		[],
	);

	return <canvas ref={canvasRef} className="particles" aria-hidden="true" />;
}

function drawConfetti(ctx: CanvasRenderingContext2D, size: number) {
	const w = size;
	const h = size * 0.6;
	const r = Math.min(w, h) * 0.35;
	ctx.beginPath();
	ctx.roundRect(-w / 2, -h / 2, w, h, r);
	ctx.fill();
}

function drawPaw(ctx: CanvasRenderingContext2D, size: number) {
	const pad = size * 0.42;
	ctx.beginPath();
	ctx.ellipse(0, size * 0.14, pad, pad * 0.85, 0, 0, Math.PI * 2);
	ctx.fill();
	const toe = size * 0.17;
	for (const [dx, dy] of [
		[-0.42, -0.42],
		[-0.15, -0.6],
		[0.15, -0.6],
		[0.42, -0.42],
	]) {
		ctx.beginPath();
		ctx.ellipse(dx * size, dy * size, toe, toe * 1.1, 0, 0, Math.PI * 2);
		ctx.fill();
	}
}

/**
 * Colours come from the live custom properties, so the burst follows whichever
 * theme is active instead of carrying a second, hardcoded palette that would
 * silently drift from the first.
 */
function readPalette(): string[] {
	const styles = getComputedStyle(document.documentElement);
	const names = ["--brand", "--cat-fur", "--cat-pink", "--cat-spark", "--ok"];
	const colors = names
		.map((n) => styles.getPropertyValue(n).trim())
		.filter(Boolean);
	return colors.length > 0 ? colors : ["#c2410c", "#ffcf8f", "#ff9aa8"];
}
