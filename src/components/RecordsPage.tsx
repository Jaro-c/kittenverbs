import type { CSSProperties } from "react";
import { hasHistory, overall, strongest, toughest } from "../lib/records";
import type { Progress } from "../lib/storage";
import { useCountUp } from "../lib/useCountUp";
import { KittenStage } from "./KittenStage";
import { SpeakButton } from "./SpeakButton";
import { WeekGoal } from "./WeekGoal";

interface Props {
	progress: Progress;
	onPet: (x: number, y: number) => void;
	onPractice: (verbIds?: string[]) => void;
}

/**
 * Her records, measured against herself.
 *
 * Deliberately not a leaderboard: there is one person here, and everything lives
 * in localStorage with no server behind it. Competing with your own past week is
 * also the only comparison that means anything when you are learning alone.
 */
export function RecordsPage({ progress, onPet, onPractice }: Props) {
	const stats = overall(progress);
	const worst = toughest(progress);
	const best = strongest(progress);

	if (!hasHistory(progress)) {
		return (
			<section className="page page--empty">
				<KittenStage mood="idle" size={130} accessory={progress.accessory} onPet={onPet} />
				<h1 className="page__title">Tus marcas</h1>
				<p className="page__sub">
					Aquí van tus récords en cuanto hagas la primera ronda: mejor simulacro,
					racha más larga y qué verbos se te resisten.
				</p>
				<button
					className="btn btn--primary btn--big"
					type="button"
					onClick={() => onPractice()}
				>
					Empezar la primera
				</button>
			</section>
		);
	}

	return (
		<section className="page">
			<header className="page__head">
				<h1 className="page__title">Tus marcas</h1>
				<p className="page__sub">Todo esto lo has hecho tú.</p>
			</header>

			<div className="records">
				{[
					{ n: stats.percent, suffix: "%", label: "aciertos en total" },
					{ n: stats.answered, label: "preguntas respondidas" },
					{
						n: stats.sessions,
						label: stats.sessions === 1 ? "ronda" : "rondas",
					},
					{ n: stats.bestExam, suffix: "%", label: "mejor simulacro" },
					{ n: stats.bestStreak, mark: "🔥", label: "racha más larga" },
					{
						n: stats.seen,
						suffix: `/${stats.ofTotal}`,
						label: "verbos vistos",
					},
					{ n: stats.unlocked, label: "logros" },
					{ n: stats.pets, label: "caricias al gatito" },
				].map((record, i) => (
					<Record key={record.label} index={i} {...record} />
				))}
			</div>

			<WeekGoal progress={progress} />

			{worst.length > 0 && (
				<div className="ranking reveal">
					<h2 className="ranking__title">Los que se te resisten</h2>
					<ul className="ranking__list">
						{worst.map((row) => (
							<li className="ranking__row" key={row.verb.id}>
								<span className="ranking__verb">
									{row.verb.base}
									<SpeakButton
										words={[row.verb.base, row.verb.past, row.verb.participle]}
										label={`${row.verb.base}, ${row.verb.past}, ${row.verb.participle}`}
										size="sm"
									/>
								</span>
								<span className="ranking__bar" aria-hidden="true">
									<span
										className="ranking__fill ranking__fill--weak"
										style={{ width: `${row.percent}%` }}
									/>
								</span>
								<span className="ranking__pct">{row.percent}%</span>
							</li>
						))}
					</ul>
					<button
						className="btn btn--primary btn--big"
						type="button"
						onClick={() => onPractice(worst.map((row) => row.verb.id))}
					>
						Practicar solo estos
						<small>
							{worst.length} {worst.length === 1 ? "verbo" : "verbos"}
						</small>
					</button>
				</div>
			)}

			{best.length > 0 && (
				<div className="ranking reveal">
					<h2 className="ranking__title">Los que ya dominas</h2>
					<ul className="ranking__list">
						{best.map((row) => (
							<li className="ranking__row" key={row.verb.id}>
								<span className="ranking__verb">{row.verb.base}</span>
								<span className="ranking__bar" aria-hidden="true">
									<span
										className="ranking__fill"
										style={{ width: `${row.percent}%` }}
									/>
								</span>
								<span className="ranking__pct">{row.percent}%</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<p className="page__note reveal">
				Un verbo entra en estas listas a partir de tres intentos. Con menos, un
				fallo suelto lo colocaría de nemesis sin merecerlo.
			</p>
		</section>
	);
}

/** Mirrors --t-count in index.css; the two are the same decision, stated twice
 *  because a rAF loop cannot read a stylesheet without becoming worse code. */
const COUNT_MS = 700;

function Record({
	n,
	label,
	suffix = "",
	mark,
	index,
}: {
	/** null means the record does not exist yet — a dash, never a zero. */
	n: number | null;
	label: string;
	suffix?: string;
	/** A decorative glyph in front of the figure, hidden from screen readers. */
	mark?: string;
	/** Position in the grid, so the cards arrive as a sweep rather than a slab. */
	index: number;
}) {
	const shown = useCountUp(n ?? 0, COUNT_MS);

	return (
		<div className="record reveal-step" style={{ "--i": index } as CSSProperties}>
			<span className="record__value">
				{mark && <span aria-hidden="true">{mark} </span>}
				{/* The label carries the settled number, so a screen reader reads the
				    record once and correctly instead of narrating a slot machine. */}
				<span aria-hidden="true">
					{n === null ? "—" : shown}
					{n === null ? "" : suffix}
				</span>
				<span className="sr-only">{n === null ? "sin marca todavía" : `${n}${suffix}`}</span>
			</span>
			<span className="record__label">{label}</span>
		</div>
	);
}
