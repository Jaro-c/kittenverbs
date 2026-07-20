import { useEffect, useRef } from "react";

export type BurstKind = "confetti" | "paws" | "hearts";

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
	/** Per particle, because hearts rise and confetti falls. */
	gravity: number;
}

const DRAG = 0.99;

/**
 * Hearts are not confetti with a different sprite.
 *
 * Confetti is thrown: it is fast, heavy and it lands. Affection floats — so
 * hearts get negative gravity, a fraction of the launch speed and a long life,
 * which is what makes them read as drifting up rather than being fired.
 */
const RECIPE: Record<
	BurstKind,
	{ count: number; gravity: number; speed: number; spread: number; life: number; size: number }
> = {
	confetti: { count: 46, gravity: 0.28, speed: 7, spread: 1.9, life: 60, size: 5 },
	paws: { count: 16, gravity: 0.28, speed: 7, spread: 1.9, life: 60, size: 9 },
	hearts: { count: 7, gravity: -0.055, speed: 2.2, spread: 1.1, life: 78, size: 11 },
};

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

		const palette = readPalette(burst.kind);
		const recipe = RECIPE[burst.kind];
		const originX = burst.x ?? window.innerWidth / 2;
		const originY = burst.y ?? window.innerHeight / 3;

		for (let i = 0; i < recipe.count; i++) {
			const angle = -Math.PI / 2 + (Math.random() - 0.5) * recipe.spread;
			const speed = recipe.speed * (0.6 + Math.random() * 0.7);
			const maxLife = recipe.life + Math.random() * 45;
			particles.current.push({
				x: originX + (Math.random() - 0.5) * 40,
				y: originY + (Math.random() - 0.5) * 20,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				rot: burst.kind === "hearts" ? (Math.random() - 0.5) * 0.5 : Math.random() * Math.PI * 2,
				vrot: (Math.random() - 0.5) * (burst.kind === "hearts" ? 0.03 : 0.28),
				size: recipe.size + Math.random() * 6,
				life: maxLife,
				maxLife,
				color: palette[Math.floor(Math.random() * palette.length)],
				shape: burst.kind,
				gravity: recipe.gravity,
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
			p.vy += p.gravity;
			p.vx *= DRAG;
			p.vy *= DRAG;
			p.x += p.vx;
			p.y += p.vy;
			p.rot += p.vrot;
			p.life -= 1;
			// A rising heart leaves through the top; culling only on the bottom edge
			// would keep it alive off-screen for the rest of its life.
			if (p.life <= 0 || p.y > window.innerHeight + 60 || p.y < -80) continue;

			ctx.save();
			ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.4));
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rot);
			ctx.fillStyle = p.color;
			if (p.shape === "confetti") drawConfetti(ctx, p.size);
			else if (p.shape === "hearts") drawHeart(ctx, p.size);
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

function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
	const s = size / 2;
	ctx.beginPath();
	ctx.moveTo(0, s * 0.9);
	ctx.bezierCurveTo(-s * 1.5, -s * 0.2, -s * 0.6, -s * 1.3, 0, -s * 0.4);
	ctx.bezierCurveTo(s * 0.6, -s * 1.3, s * 1.5, -s * 0.2, 0, s * 0.9);
	ctx.fill();
}

/**
 * Colours come from the live custom properties, so the burst follows whichever
 * theme is active instead of carrying a second, hardcoded palette that would
 * silently drift from the first.
 *
 * Hearts get their own short list. Celebration confetti is meant to be a jumble
 * of everything; affection reading as a random colour draw would not land.
 */
function readPalette(kind: BurstKind): string[] {
	const styles = getComputedStyle(document.documentElement);
	const names =
		kind === "hearts"
			? ["--cat-heart", "--cat-pink", "--cat-bow"]
			: ["--brand", "--cat-fur", "--cat-pink", "--cat-spark", "--ok"];
	const colors = names
		.map((n) => styles.getPropertyValue(n).trim())
		.filter(Boolean);
	return colors.length > 0 ? colors : ["#c2410c", "#ffcf8f", "#ff9aa8"];
}
