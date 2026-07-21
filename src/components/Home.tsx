import { useMemo } from "react";
import { VERBS } from "../data/verbs";
import { greeting } from "../lib/copy";
import type { Progress } from "../lib/storage";
import { KittenStage } from "./KittenStage";
import { SoundToggle } from "./SoundToggle";
import { WeekGoal } from "./WeekGoal";

interface Props {
	progress: Progress;
	weakIds: string[];
	onPractice: (verbIds?: string[]) => void;
	onExam: () => void;
	onPet: (x: number, y: number) => void;
	onReset: () => void;
}

/**
 * Only what is worth a glance, plus the two buttons she came for.
 *
 * The verb table and the trophy case used to live here behind accordions, which
 * meant unfolding and refolding them on every visit. They are destinations, so
 * they became addresses; what stays is status she reads on the way past.
 */
export function Home({
	progress,
	weakIds,
	onPractice,
	onExam,
	onPet,
	onReset,
}: Props) {
	// Memoised because it reads the clock. Recomputing on every render would let
	// the hello change under her mid-screen when the hour turns over, or worse,
	// flip between two wordings on an unrelated re-render.
	const hello = useMemo(() => greeting(progress), [progress]);
	const seen = Object.keys(progress.verbs).length;

	return (
		<section className="home">
			<header className="home__hero">
				<KittenStage
					mood="idle"
					size={150}
					accessory={progress.accessory}
					onPet={onPet}
					hint={progress.pets === 0}
				/>
				<p className="home__hello">{hello.hello}</p>
				<h1 className="home__title">Kitten Verbs</h1>
				<p className="home__sub">{hello.line}</p>
				<p className="home__meta">
					{VERBS.length} verbos irregulares · infinitive · past · past participle
				</p>
			</header>

			{(progress.streak > 0 || progress.bestExam !== null) && (
				<div className="stats">
					{progress.streak > 0 && (
						<div className="stat">
							<span className="stat__value">🔥 {progress.streak}</span>
							<span className="stat__label">
								{progress.streak === 1 ? "día" : "días seguidos"}
							</span>
						</div>
					)}
					{progress.bestExam !== null && (
						<div className="stat">
							<span className="stat__value">{progress.bestExam}%</span>
							<span className="stat__label">mejor simulacro</span>
						</div>
					)}
					{seen > 0 && (
						<div className="stat">
							<span className="stat__value">
								{seen}/{VERBS.length}
							</span>
							<span className="stat__label">verbos vistos</span>
						</div>
					)}
				</div>
			)}

			<WeekGoal progress={progress} />

			<div className="home__actions">
				<button
					className="btn btn--primary btn--big"
					type="button"
					onClick={() => onPractice()}
				>
					Practicar
					<small>{VERBS.length} preguntas · escribir, elegir y completar</small>
				</button>

				<button className="btn btn--exam btn--big" type="button" onClick={onExam}>
					Simulacro cronometrado
					<small>{VERBS.length} preguntas · 7:30 · sin pistas ni opciones</small>
				</button>

				{weakIds.length > 0 && (
					<button
						className="btn btn--ghost btn--big"
						type="button"
						onClick={() => onPractice(weakIds)}
					>
						Repasar los que se me escapan
						<small>
							{weakIds.length} {weakIds.length === 1 ? "verbo" : "verbos"}
						</small>
					</button>
				)}
			</div>

			<footer className="home__foot">
				<SoundToggle />
				{seen > 0 && (
					<button className="link-reset" type="button" onClick={onReset}>
						Borrar mi progreso
					</button>
				)}
			</footer>
		</section>
	);
}
