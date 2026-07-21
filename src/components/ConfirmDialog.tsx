import { useEffect, useRef } from "react";

interface Props {
	open: boolean;
	title: string;
	body?: string;
	confirmLabel: string;
	cancelLabel: string;
	/** Marks the confirm button as the destructive one. */
	danger?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * Uses the native <dialog> rather than a div with a backdrop.
 *
 * showModal() brings the focus trap, the Escape key, inertness of the page
 * behind it and top-layer stacking for free — four things that are easy to hand
 * roll badly and that decide whether a keyboard or screen reader user can get
 * back out of this thing.
 */
export function ConfirmDialog({
	open,
	title,
	body,
	confirmLabel,
	cancelLabel,
	danger = false,
	onConfirm,
	onCancel,
}: Props) {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	return (
		<dialog
			ref={ref}
			className="confirm"
			// Escape and the backdrop both mean "no". Without this the dialog would
			// close natively while React still believed it was open, and it could
			// never be reopened.
			onCancel={(event) => {
				event.preventDefault();
				onCancel();
			}}
			onClick={(event) => {
				if (event.target === ref.current) onCancel();
			}}
		>
			<h2 className="confirm__title">{title}</h2>
			{body && <p className="confirm__body">{body}</p>}
			<div className="confirm__actions">
				<button
					type="button"
					className="btn btn--ghost"
					onClick={onCancel}
					autoFocus
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
					onClick={onConfirm}
				>
					{confirmLabel}
				</button>
			</div>
		</dialog>
	);
}
