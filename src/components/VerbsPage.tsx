import { useState, type CSSProperties } from "react";
import { VERBS } from "../data/verbs";
import type { Pattern } from "../lib/types";
import { withViewTransition } from "../lib/viewTransition";
import { SpeakButton } from "./SpeakButton";

const PATTERN_NOTE: Record<Pattern, string> = {
	ABB: "pasado y participio iguales",
	ABC: "las tres formas distintas",
};

/**
 * The reference table, on its own address.
 *
 * It used to be an accordion on the home screen, which meant unfolding and
 * refolding it every time she wanted to check a form. A thing you go to on
 * purpose deserves somewhere to go.
 */
export function VerbsPage() {
	const [pattern, setPattern] = useState<Pattern | "all">("all");
	const shown = pattern === "all" ? VERBS : VERBS.filter((v) => v.pattern === pattern);

	return (
		<section className="page">
			<header className="page__head">
				<h1 className="page__title">Los verbos</h1>
				<p className="page__sub">
					Toca el altavoz para oír las tres formas seguidas.
				</p>
			</header>

			<div className="filters" role="group" aria-label="Filtrar por patrón">
				{(["all", "ABB", "ABC"] as const).map((option) => (
					<button
						key={option}
						type="button"
						className={`filter${pattern === option ? " filter--on" : ""}`}
						aria-pressed={pattern === option}
						// Seven rows leaving at once used to be a jump cut. The browser
						// cross-fades the two tables for us; no list library, no keys to
						// reconcile, and where the API is missing it is still the same
						// instant swap it always was.
						onClick={() => withViewTransition("swap", () => setPattern(option))}
					>
						{option === "all" ? "Todos" : option}
						{option !== "all" && <small> · {PATTERN_NOTE[option]}</small>}
					</button>
				))}
			</div>

			<p className="page__count">
				{shown.length} {shown.length === 1 ? "verbo" : "verbos"}
			</p>

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
						{shown.map((verb, i) => (
							// The row's place in the list, handed to CSS as a number so the
							// stagger is one declaration instead of fifteen. Capped in the
							// stylesheet, not here: a row's index is a fact, how long the
							// sweep is allowed to take is a design decision.
							<tr key={verb.id} style={{ "--i": i } as CSSProperties}>
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

			<p className="page__note">
				Inglés americano. <b>spelled</b> es la forma de la evaluación;{" "}
				<b>spelt</b> es británica y también se acepta al escribir.
			</p>
		</section>
	);
}
