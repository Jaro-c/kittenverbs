import { useState } from "react";
import { VERBS } from "../data/verbs";
import type { Pattern } from "../lib/types";
import type { Progress } from "../lib/storage";
import { Kitten } from "./Kitten";

interface Props {
	progress: Progress;
	weakIds: string[];
	onPractice: (verbIds?: string[]) => void;
	onExam: () => void;
	onReset: () => void;
}

const PATTERN_NOTE: Record<Pattern, string> = {
	ABB: "pasado y participio iguales",
	ABC: "las tres formas distintas",
};

export function Home({ progress, weakIds, onPractice, onExam, onReset }: Props) {
	const [tableOpen, setTableOpen] = useState(false);
	const [pattern, setPattern] = useState<Pattern | "all">("all");

	const shown = pattern === "all" ? VERBS : VERBS.filter((v) => v.pattern === pattern);
	const seen = Object.keys(progress.verbs).length;

	return (
		<section className="home">
			<header className="home__hero">
				<Kitten mood="idle" size={150} />
				<h1 className="home__title">Kitten Verbs</h1>
				<p className="home__sub">
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
						Repasar mis fallados
						<small>
							{weakIds.length} {weakIds.length === 1 ? "verbo" : "verbos"}
						</small>
					</button>
				)}
			</div>

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
											<td>{verb.base}</td>
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

			{seen > 0 && (
				<button className="link-reset" type="button" onClick={onReset}>
					Borrar mi progreso
				</button>
			)}
		</section>
	);
}
