import { useMemo, useState } from "react";
import { VERBS } from "../data/verbs";
import type { AccessoryId } from "../lib/accessories";
import { greeting } from "../lib/copy";
import type { Progress } from "../lib/storage";
import type { Pattern } from "../lib/types";
import { KittenStage } from "./KittenStage";
import { SoundToggle } from "./SoundToggle";
import { SpeakButton } from "./SpeakButton";
import { Trophies } from "./Trophies";
import { WeekGoal } from "./WeekGoal";

interface Props {
	progress: Progress;
	weakIds: string[];
	onPractice: (verbIds?: string[]) => void;
	onExam: () => void;
	onPet: (x: number, y: number) => void;
	onWear: (accessory: AccessoryId | null) => void;
	onReset: () => void;
}

const PATTERN_NOTE: Record<Pattern, string> = {
	ABB: "pasado y participio iguales",
	ABC: "las tres formas distintas",
};

export function Home({
	progress,
	weakIds,
	onPractice,
	onExam,
	onPet,
	onWear,
	onReset,
}: Props) {
	const [tableOpen, setTableOpen] = useState(false);
	const [pattern, setPattern] = useState<Pattern | "all">("all");

	// Memoised because it reads the clock. Recomputing on every render would let
	// the hello change under her mid-screen when the hour turns over, or worse,
	// flip between two wordings on an unrelated re-render.
	const hello = useMemo(() => greeting(progress), [progress]);

	const shown = pattern === "all" ? VERBS : VERBS.filter((v) => v.pattern === pattern);
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
					15 verbos irregulares · infinitive · past · past participle
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
				<button className="btn btn--primary btn--big" type="button" onClick={() => onPractice()}>
					Practicar
					<small>15 preguntas · escribir, elegir y completar</small>
				</button>

				<button className="btn btn--exam btn--big" type="button" onClick={onExam}>
					Simulacro cronometrado
					<small>15 preguntas · 7:30 · sin pistas ni opciones</small>
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

			<Trophies progress={progress} onWear={onWear} />

			<div className="table-block">
				<button
					className="table-block__toggle"
					type="button"
					onClick={() => setTableOpen((open) => !open)}
					aria-expanded={tableOpen}
				>
					{tableOpen ? "Ocultar" : "Ver"} la tabla completa
				</button>

				{tableOpen && (
					<>
						<div className="filters" role="group" aria-label="Filtrar por patrón">
							{(["all", "ABB", "ABC"] as const).map((option) => (
								<button
									key={option}
									type="button"
									className={`filter${pattern === option ? " filter--on" : ""}`}
									onClick={() => setPattern(option)}
								>
									{option === "all" ? "Todos" : option}
									{option !== "all" && (
										<small> · {PATTERN_NOTE[option]}</small>
									)}
								</button>
							))}
						</div>

						<div className="table-scroll">
							<table className="verb-table">
								<thead>
									<tr>
										<th>Infinitive</th>
										<th>Past</th>
										<th>Past participle</th>
										<th>Español</th>
									</tr>
								</thead>
								<tbody>
									{shown.map((verb) => (
										<tr key={verb.id}>
											<td>
												<span className="verb-table__cell">
													{verb.base}
													<SpeakButton
														words={[verb.base, verb.past, verb.participle]}
														label={`${verb.base}, ${verb.past}, ${verb.participle}`}
														size="sm"
													/>
												</span>
											</td>
											<td>{verb.past}</td>
											<td>{verb.participle}</td>
											<td className="verb-table__es">{verb.es}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<p className="table-block__note">
							Inglés americano. <b>spelled</b> es la forma de la evaluación;{" "}
							<b>spelt</b> es británica y también se acepta al escribir.
						</p>
					</>
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
