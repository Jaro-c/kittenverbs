import { useEffect, useRef, useState } from "react";
import {
	asmrAvailable,
	currentSettings,
	disposeAsmr,
	handleVisibility,
	loadSettings,
	primeSettings,
	saveSettings,
	startAsmr,
	stopAsmr,
	type AsmrSettings,
} from "../lib/asmr";
import type { Progress } from "../lib/storage";
import { KittenStage } from "./KittenStage";

interface Props {
	progress: Progress;
	onPet: (x: number, y: number) => void;
}

/** Minutes she can ask for, plus no limit at all. */
const TIMERS = [5, 10, 20, 0] as const;

const LAYERS: { key: keyof AsmrSettings; label: string; hint: string }[] = [
	{ key: "purr", label: "Ronroneo", hint: "el rumor de fondo" },
	{ key: "licks", label: "Lengüetazos", hint: "de vez en cuando" },
	{ key: "knead", label: "Amasado", hint: "las patitas" },
];

/**
 * A corner with no verbs in it.
 *
 * Everything else in this app asks her for something. This asks nothing: the cat
 * purrs for as long as she wants and there is no score at the end.
 */
export function CalmPage({ progress, onPet }: Props) {
	const [settings, setSettings] = useState<AsmrSettings>(() => {
		const stored = loadSettings();
		primeSettings(stored);
		return stored;
	});
	const [playing, setPlaying] = useState(false);
	const [minutes, setMinutes] = useState<number>(10);
	const [left, setLeft] = useState<number | null>(null);
	const timer = useRef<number | null>(null);

	// The audio hardware is released when she leaves, not merely paused. She may
	// well fall asleep with this open, and a suspended context still holds it.
	useEffect(() => {
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			disposeAsmr();
		};
	}, []);

	useEffect(() => {
		if (!playing || minutes === 0) {
			setLeft(null);
			return;
		}
		setLeft(minutes * 60);
		const id = window.setInterval(() => {
			setLeft((seconds) => {
				if (seconds === null) return null;
				if (seconds <= 1) {
					stopAsmr();
					setPlaying(false);
					return null;
				}
				return seconds - 1;
			});
		}, 1000);
		timer.current = id;
		return () => clearInterval(id);
	}, [playing, minutes]);

	if (!asmrAvailable()) {
		return (
			<section className="page page--empty">
				<h1 className="page__title">Un ratito con el gato</h1>
				<p className="page__sub">
					Este navegador no puede sintetizar sonido, así que el ronroneo no
					funcionaría aquí. Pruébalo desde el móvil.
				</p>
			</section>
		);
	}

	const update = (key: keyof AsmrSettings, value: number) => {
		const next = { ...settings, [key]: value };
		setSettings(next);
		saveSettings(next);
	};

	return (
		<section className="page calm">
			<header className="page__head">
				<h1 className="page__title">Un ratito con el gato</h1>
				<p className="page__sub">
					Sin verbos, sin nota. Ronronea hasta que te apetezca parar.
				</p>
			</header>

			<div className={`calm__stage${playing ? " calm__stage--on" : ""}`}>
				<KittenStage
					mood="idle"
					size={190}
					accessory={progress.accessory}
					onPet={onPet}
				/>
			</div>

			<button
				className={`btn btn--big ${playing ? "btn--exam" : "btn--primary"}`}
				type="button"
				onClick={() => {
					if (playing) {
						stopAsmr();
						setPlaying(false);
					} else {
						// Started from this click, because browsers refuse to let audio
						// begin without a gesture. There is no way around that, and no
						// point pretending otherwise with an autoplay that never fires.
						primeSettings(currentSettings());
						if (startAsmr()) setPlaying(true);
					}
				}}
			>
				{playing ? "Parar" : "Que ronronee"}
				<small>
					{playing
						? left === null
							? "sin límite · toca para parar"
							: `quedan ${formatClock(left)}`
						: minutes === 0
							? "sin límite de tiempo"
							: `${minutes} minutos`}
				</small>
			</button>

			<div className="calm__timers" role="group" aria-label="Duración">
				{TIMERS.map((option) => (
					<button
						key={option}
						type="button"
						className={`filter${minutes === option ? " filter--on" : ""}`}
						aria-pressed={minutes === option}
						onClick={() => setMinutes(option)}
					>
						{option === 0 ? "Sin límite" : `${option} min`}
					</button>
				))}
			</div>

			<div className="mixer">
				<h2 className="ranking__title">La mezcla</h2>

				<label className="mixer__row">
					<span className="mixer__label">Volumen</span>
					<input
						type="range"
						min={0}
						max={100}
						value={Math.round(settings.master * 100)}
						onChange={(event) => update("master", Number(event.target.value) / 100)}
					/>
					<span className="mixer__value">{Math.round(settings.master * 100)}</span>
				</label>

				{LAYERS.map((layer) => (
					<label className="mixer__row" key={layer.key}>
						<span className="mixer__label">
							{layer.label}
							<small>{layer.hint}</small>
						</span>
						<input
							type="range"
							min={0}
							max={100}
							value={Math.round(settings[layer.key] * 100)}
							onChange={(event) =>
								update(layer.key, Number(event.target.value) / 100)
							}
						/>
						<span className="mixer__value">
							{Math.round(settings[layer.key] * 100)}
						</span>
					</label>
				))}
			</div>

			{/* Not decoration. A purr lives between 25 and 150 Hz and a phone speaker
			    cannot move air that slowly — it turns the rumble into a plastic
			    rattle. The same sound through headphones is the whole point. */}
			<p className="page__note calm__note">
				🎧 Con auriculares suena como debe. Por el altavoz del móvil el ronroneo
				se convierte en vibración, porque los graves de un ronroneo están por
				debajo de lo que puede dar un altavoz pequeño.
			</p>
		</section>
	);
}

function formatClock(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}
