import { useEffect, useState } from "react";
import type {
	Reservation,
	ReservationConversionResponse,
	ReservationPaymentMethod,
} from "../lib/api";
import {
	getReservationPayments,
	type ReservationPaymentHistory,
} from "../lib/api";
import ReservationItemsTable from "./ReservationItemsTable";

type Props = {
	reservation: Reservation;
	onClose: () => void;
	onConfirm: (
		paymentMethod: ReservationPaymentMethod | undefined,
	) => Promise<ReservationConversionResponse>;
};

const paymentMethods: { value: ReservationPaymentMethod; label: string }[] = [
	{ value: "YAPE", label: "Yape" },
	{ value: "PLIN", label: "Plin" },
	{ value: "EFECTIVO", label: "Efectivo" },
	{ value: "TRANSFERENCIA", label: "Transferencia" },
	{ value: "TARJETA", label: "Tarjeta" },
];

export default function ReservationConversionModal({
	reservation,
	onClose,
	onConfirm,
}: Props) {
	const [paymentMethod, setPaymentMethod] =
		useState<ReservationPaymentMethod>("YAPE");
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<ReservationPaymentHistory | null>(
		null,
	);
	const [result, setResult] = useState<ReservationConversionResponse | null>(
		null,
	);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		getReservationPayments(reservation.id)
			.then((paymentSummary) => {
				if (active) setSummary(paymentSummary);
			})
			.catch((loadError: unknown) => {
				if (active) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "No se pudo cargar el saldo pendiente.",
					);
				}
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [reservation.id]);

	const totalAmount = summary?.totalAmount ?? reservation.totalAmount;
	const totalPaid = summary?.totalPaid ?? reservation.totalPaid;
	const pendingBalance = summary?.pendingBalance ?? reservation.pendingBalance;
	const needsPayment = pendingBalance !== "0.00";

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		try {
			setSubmitting(true);
			setResult(await onConfirm(needsPayment ? paymentMethod : undefined));
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "No se pudo liquidar y convertir la reserva.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
			<section
				aria-labelledby="reservation-conversion-title"
				aria-modal="true"
				className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
				role="dialog"
			>
				<div className="mb-5 flex items-center justify-between gap-4">
					<h2
						className="m-0 text-xl font-bold text-slate-900"
						id="reservation-conversion-title"
					>
						Liquidar y convertir a venta
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={submitting}
						className="cursor-pointer border-0 bg-transparent text-slate-500 hover:text-slate-800"
					>
						Cerrar
					</button>
				</div>

				{error && (
					<p
						aria-live="polite"
						className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					>
						{error}
					</p>
				)}

				{loading && (
					<p className="text-sm text-slate-500">
						Actualizando saldo pendiente...
					</p>
				)}

				{result ? (
					<div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
						<p className="m-0 font-semibold">
							Reserva convertida correctamente.
						</p>
						<p className="mb-0 mt-2">
							Venta: <span className="font-semibold">{result.sale.id}</span>
							{" · "}Estado:{" "}
							<span className="font-semibold">{result.sale.status}</span>
						</p>
						<p className="mb-0 mt-1">
							{result.payment
								? `Cobro final registrado: S/ ${result.payment.amount}.`
								: "No se registró un cobro final porque el saldo ya era cero."}
						</p>
					</div>
				) : (
					<>
						<p className="mb-4 mt-0 text-sm text-slate-600">
							Se liquidará el saldo pendiente y la venta conservará las
							condiciones registradas en esta reserva.
						</p>

						<h3 className="mb-2 text-sm font-semibold text-slate-800">
							Figuras de la reserva
						</h3>
						<div className="mb-6">
							<ReservationItemsTable items={reservation.items} />
						</div>

						<dl className="mb-6 grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-3">
							<div>
								<dt className="text-sm text-slate-500">Total</dt>
								<dd className="m-0 font-semibold text-slate-900">
									S/ {totalAmount}
								</dd>
							</div>
							<div>
								<dt className="text-sm text-slate-500">Total abonado</dt>
								<dd className="m-0 font-semibold text-slate-900">
									S/ {totalPaid}
								</dd>
							</div>
							<div>
								<dt className="text-sm text-slate-500">Saldo a cobrar</dt>
								<dd className="m-0 font-semibold text-slate-900">
									S/ {pendingBalance}
								</dd>
							</div>
						</dl>

						<form onSubmit={handleSubmit} className="space-y-4">
							{needsPayment && (
								<label className="block max-w-sm text-sm font-medium text-slate-700">
									Medio de pago
									<select
										required
										value={paymentMethod}
										onChange={(event) => {
											const method = paymentMethods.find(
												(item) => item.value === event.target.value,
											);
											if (method) setPaymentMethod(method.value);
										}}
										disabled={submitting}
										className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
									>
										{paymentMethods.map((method) => (
											<option key={method.value} value={method.value}>
												{method.label}
											</option>
										))}
									</select>
								</label>
							)}
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
									disabled={submitting || loading || !summary}
									className="cursor-pointer rounded-md border-0 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{submitting ? "Convirtiendo..." : "Confirmar conversión"}
								</button>
							</div>
						</form>
					</>
				)}
			</section>
		</div>
	);
}
