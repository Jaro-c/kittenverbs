import { hasHistory, overall, strongest, toughest } from "../lib/records";
import type { Progress } from "../lib/storage";
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
				<Record value={`${stats.percent}%`} label="aciertos en total" />
				<Record value={stats.answered} label="preguntas respondidas" />
				<Record value={stats.sessions} label={stats.sessions === 1 ? "ronda" : "rondas"} />
				<Record
					value={stats.bestExam === null ? "—" : `${stats.bestExam}%`}
					label="mejor simulacro"
				/>
				<Record value={`🔥 ${stats.bestStreak}`} label="racha más larga" />
				<Record value={`${stats.seen}/${stats.ofTotal}`} label="verbos vistos" />
				<Record value={stats.unlocked} label="logros" />
				<Record value={stats.pets} label="caricias al gatito" />
			</div>

			<WeekGoal progress={progress} />

			{worst.length > 0 && (
				<div className="ranking">
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
				<div className="ranking">
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

			<p className="page__note">
				Un verbo entra en estas listas a partir de tres intentos. Con menos, un
				fallo suelto lo colocaría de nemesis sin merecerlo.
			</p>
		</section>
	);
}

function Record({ value, label }: { value: string | number; label: string }) {
	return (
		<div className="record">
			<span className="record__value">{value}</span>
			<span className="record__label">{label}</span>
		</div>
	);
}
