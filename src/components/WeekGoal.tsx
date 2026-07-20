import { daysMet, remainingToday, weekView, type Progress } from "../lib/storage";

/**
 * A seven-day rolling goal strip.
 *
 * The target is questions answered, not sessions started and not accuracy:
 * counting sessions rewards opening the app and closing it, and counting
 * accuracy punishes practising the verbs you are worst at — which is the exact
 * behaviour the app should be encouraging.
 */
export function WeekGoal({ progress }: { progress: Progress }) {
	const days = weekView(progress);
	const met = daysMet(progress);
	const left = remainingToday(progress);

	return (
		<section className="week" aria-label="Meta de los últimos 7 días">
			<header className="week__head">
				<span className="week__count">
					<b>{met}</b>/7 días
				</span>
				<span className="week__hint">
					{left === 0
						? "Meta de hoy cumplida 🎉"
						: `Faltan ${left} preguntas hoy`}
				</span>
			</header>

			<ol className="week__dots">
				{days.map((day) => {
					const state = day.met ? " week__dot--met" : "";
					const today = day.isToday ? " week__dot--today" : "";
					const label = day.met
						? `${day.answered} preguntas, meta cumplida`
						: `${day.answered} preguntas`;
					return (
						<li className="week__day" key={day.key}>
							<span
								className={`week__dot${state}${today}`}
								title={`${day.key}: ${label}`}
							>
								{day.met ? "🐾" : ""}
							</span>
							<span className="week__letter">{day.label}</span>
							<span className="sr-only">
								{day.key}: {label}
							</span>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
