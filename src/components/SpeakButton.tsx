import { useEffect, useState } from "react";
import { speak, speakForms, speechAvailable } from "../lib/speech";

interface Props {
	/** What to say. Several entries are read as one phrase with pauses between. */
	words: string[];
	/** Spoken in the button's accessible name, so it is clear what will be heard. */
	label?: string;
	size?: "sm" | "md";
}

/**
 * A speaker button next to English text.
 *
 * It is only ever placed on words already visible on screen. Attaching one to an
 * answer she has not given yet would read it out loud — the same leak the exam
 * mode closes on the audio and visual channels.
 */
export function SpeakButton({ words, label, size = "md" }: Props) {
	const [usable, setUsable] = useState(false);

	// Checked after mount rather than during render: on a server-less build there
	// is no window at module scope, and the voice list may still be loading.
	useEffect(() => {
		setUsable(speechAvailable());
	}, []);

	if (!usable) return null;

	const spoken = words.filter(Boolean).join(", ");

	return (
		<button
			type="button"
			className={`speak speak--${size}`}
			aria-label={`Escuchar ${label ?? spoken} en inglés`}
			onClick={(event) => {
				event.stopPropagation();
				if (words.length > 1) speakForms(words);
				else speak(words[0]);
				if (!speechAvailable()) setUsable(false);
			}}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
				<path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" />
				<path className="speak__wave" d="M15.6 9.1a4 4 0 0 1 0 5.8" />
				<path className="speak__wave speak__wave--far" d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
			</svg>
		</button>
	);
}
