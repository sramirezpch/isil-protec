import { useState } from "react";
import {
	type Reservation,
	ReservationCancellationConfirmationRequiredError,
} from "../lib/api";

type Props = {
	reservation: Reservation;
	onClose: () => void;
	onConfirm: (motivo: string, confirmarConAbonos: boolean) => Promise<void>;
};

export default function ReservationCancellationModal({
	reservation,
	onClose,
	onConfirm,
}: Props) {
	const [motivo, setMotivo] = useState("");
	const [totalPaid, setTotalPaid] = useState(reservation.totalPaid);
	const [confirmarConAbonos, setConfirmarConAbonos] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const hasPayments = totalPaid !== "0.00";

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		const normalizedReason = motivo.trim();
		if (!normalizedReason || normalizedReason.length > 500) {
			setError("Ingrese un motivo de hasta 500 caracteres.");
			return;
		}

		try {
			setSubmitting(true);
			await onConfirm(normalizedReason, confirmarConAbonos);
		} catch (submitError) {
			if (
				submitError instanceof ReservationCancellationConfirmationRequiredError
			) {
				setTotalPaid(submitError.totalPaid);
				setConfirmarConAbonos(false);
				return;
			}
			setError(
				submitError instanceof Error
					? submitError.message
					: "No se pudo cancelar la reserva.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<section
				aria-labelledby="reservation-cancellation-title"
				aria-modal="true"
				className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
				role="dialog"
			>
				<h2
					className="mb-4 text-xl font-bold text-slate-900"
					id="reservation-cancellation-title"
				>
					Cancelar reserva
				</h2>

				{hasPayments && (
					<div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
						<p className="m-0">
							Esta reserva tiene S/ {totalPaid} en abonos registrados. El
							sistema conservará el historial, pero no devolverá ese dinero
							automáticamente.
						</p>
						<label className="mt-3 flex items-start gap-2 font-medium">
							<input
								type="checkbox"
								checked={confirmarConAbonos}
								onChange={(event) =>
									setConfirmarConAbonos(event.target.checked)
								}
								disabled={submitting}
							/>
							<span>
								Confirmo que deseo cancelar con estos abonos registrados.
							</span>
						</label>
					</div>
				)}

				{error && (
					<p
						aria-live="polite"
						className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					>
						{error}
					</p>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<label className="block text-sm font-medium text-slate-700">
						Motivo de cancelación
						<textarea
							required
							maxLength={500}
							value={motivo}
							onChange={(event) => setMotivo(event.target.value)}
							disabled={submitting}
							rows={3}
							className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
						/>
					</label>
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
						>
							Volver
						</button>
						<button
							type="submit"
							disabled={
								submitting ||
								!motivo.trim() ||
								motivo.trim().length > 500 ||
								(hasPayments && !confirmarConAbonos)
							}
							className="cursor-pointer rounded-md border-0 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{submitting ? "Cancelando..." : "Confirmar cancelación"}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
