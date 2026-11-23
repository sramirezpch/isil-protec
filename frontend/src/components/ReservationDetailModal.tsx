import { useEffect, useState } from "react";
import {
	createReservationPayment,
	getReservationPayments,
	type Reservation,
	type ReservationPaymentHistory,
	type ReservationPaymentMethod,
} from "../lib/api";
import ReservationItemsTable from "./ReservationItemsTable";

type Props = {
	reservation: Reservation;
	onClose: () => void;
	onUpdated: () => Promise<void>;
};

const paymentMethods: { value: ReservationPaymentMethod; label: string }[] = [
	{ value: "YAPE", label: "Yape" },
	{ value: "PLIN", label: "Plin" },
	{ value: "EFECTIVO", label: "Efectivo" },
	{ value: "TRANSFERENCIA", label: "Transferencia" },
	{ value: "TARJETA", label: "Tarjeta" },
];

const paymentMethodLabel = (method: ReservationPaymentMethod): string =>
	paymentMethods.find((item) => item.value === method)?.label ?? method;

const formatDate = (value: string): string =>
	new Intl.DateTimeFormat("es-PE", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(new Date(value));

export default function ReservationDetailModal({
	reservation,
	onClose,
	onUpdated,
}: Props) {
	const [summary, setSummary] = useState<ReservationPaymentHistory | null>(
		null,
	);
	const [amount, setAmount] = useState("");
	const [paymentMethod, setPaymentMethod] =
		useState<ReservationPaymentMethod>("YAPE");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		getReservationPayments(reservation.id)
			.then((result) => {
				if (active) setSummary(result);
			})
			.catch((loadError: unknown) => {
				if (active) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "No se pudo cargar el historial de abonos.",
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

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);

		try {
			setSubmitting(true);
			const result = await createReservationPayment(reservation.id, {
				amount,
				paymentMethod,
			});
			setSummary((current) =>
				current
					? {
							...current,
							totalAmount: result.totalAmount,
							totalPaid: result.totalPaid,
							pendingBalance: result.pendingBalance,
							payments: [result.payment, ...current.payments],
						}
					: current,
			);
			setAmount("");

			try {
				await onUpdated();
				setSummary(await getReservationPayments(reservation.id));
			} catch (refreshError) {
				setError(
					refreshError instanceof Error
						? `El abono se registró, pero no se pudo actualizar la información: ${refreshError.message}`
						: "El abono se registró, pero no se pudo actualizar la información.",
				);
			}
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "No se pudo registrar el abono.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const disabled =
		loading ||
		submitting ||
		reservation.status !== "VIGENTE" ||
		!summary ||
		summary.pendingBalance === "0.00";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<section
				aria-labelledby="reservation-detail-title"
				aria-modal="true"
				className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
				role="dialog"
			>
				<div className="mb-5 flex items-center justify-between gap-4">
					<h2
						className="m-0 text-xl font-bold text-slate-900"
						id="reservation-detail-title"
					>
						Detalle de reserva
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
					<p className="text-sm text-slate-500">Cargando abonos...</p>
				)}

				<dl className="mb-6 grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
					<div>
						<dt className="text-sm text-slate-500">Cliente</dt>
						<dd className="m-0 font-semibold text-slate-900">
							{reservation.client
								? [reservation.client.name, reservation.client.lastName]
										.filter(Boolean)
										.join(" ") || reservation.client.phone
								: "Cliente no disponible"}
						</dd>
					</div>
					<div>
						<dt className="text-sm text-slate-500">Fecha límite</dt>
						<dd className="m-0 font-semibold text-slate-900">
							{reservation.dueDate}
						</dd>
					</div>
					<div>
						<dt className="text-sm text-slate-500">Tipo</dt>
						<dd className="m-0">
							<span
								className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
									reservation.type === "PREVENTA"
										? "bg-amber-100 text-amber-800"
										: "bg-indigo-100 text-indigo-700"
								}`}
							>
								{reservation.type === "PREVENTA" ? "Preventa" : "Reserva"}
							</span>
						</dd>
					</div>
					<div>
						<dt className="text-sm text-slate-500">Estado</dt>
						<dd className="m-0">
							<span
								className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
									reservation.status === "VIGENTE"
										? "bg-emerald-100 text-emerald-700"
										: "bg-slate-200 text-slate-700"
								}`}
							>
								{reservation.status === "VIGENTE" ? "Vigente" : "Cancelada"}
							</span>
						</dd>
					</div>
				</dl>

				<h3 className="mb-2 text-sm font-semibold text-slate-800">
					Figuras de la reserva
				</h3>
				<div className="mb-6">
					<ReservationItemsTable items={reservation.items} />
				</div>

				{summary && (
					<>
						<dl className="mb-6 grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-3">
							<div>
								<dt className="text-sm text-slate-500">Total</dt>
								<dd className="m-0 font-semibold text-slate-900">
									S/ {summary.totalAmount}
								</dd>
							</div>
							<div>
								<dt className="text-sm text-slate-500">Total abonado</dt>
								<dd className="m-0 font-semibold text-slate-900">
									S/ {summary.totalPaid}
								</dd>
							</div>
							<div>
								<dt className="text-sm text-slate-500">Saldo pendiente</dt>
								<dd className="m-0 font-semibold text-slate-900">
									S/ {summary.pendingBalance}
								</dd>
							</div>
						</dl>

						<h3 className="mb-2 text-sm font-semibold text-slate-800">
							Historial
						</h3>
						<div className="mb-6 overflow-x-auto rounded-md border border-slate-200">
							<table className="w-full border-collapse text-left text-sm">
								<thead className="bg-slate-50 text-slate-600">
									<tr>
										<th className="px-3 py-2 font-semibold">Fecha</th>
										<th className="px-3 py-2 font-semibold">Medio de pago</th>
										<th className="px-3 py-2 text-right font-semibold">
											Monto
										</th>
									</tr>
								</thead>
								<tbody>
									{summary.payments.map((payment) => (
										<tr key={payment.id} className="border-t border-slate-200">
											<td className="px-3 py-2 text-slate-700">
												{formatDate(payment.recordedAt)}
											</td>
											<td className="px-3 py-2 text-slate-700">
												{paymentMethodLabel(payment.paymentMethod)}
											</td>
											<td className="px-3 py-2 text-right font-medium text-slate-900">
												S/ {payment.amount}
											</td>
										</tr>
									))}
									{summary.payments.length === 0 && (
										<tr>
											<td
												className="px-3 py-5 text-center text-slate-500"
												colSpan={3}
											>
												Aún no hay abonos registrados.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							<h3 className="m-0 text-sm font-semibold text-slate-800">
								Registrar abono
							</h3>
							<p className="m-0 text-sm text-slate-600">
								Saldo pendiente:{" "}
								<span className="font-semibold">
									S/ {summary.pendingBalance}
								</span>
							</p>
							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block text-sm font-medium text-slate-700">
									Monto
									<input
										required
										type="number"
										min="0.01"
										step="0.01"
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
										disabled={disabled}
										className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
									/>
								</label>
								<label className="block text-sm font-medium text-slate-700">
									Medio de pago
									<select
										value={paymentMethod}
										onChange={(event) => {
											const method = paymentMethods.find(
												(item) => item.value === event.target.value,
											);
											if (method) setPaymentMethod(method.value);
										}}
										disabled={disabled}
										className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
									>
										{paymentMethods.map((method) => (
											<option key={method.value} value={method.value}>
												{method.label}
											</option>
										))}
									</select>
								</label>
							</div>
							<div className="flex justify-end">
								<button
									type="submit"
									disabled={disabled}
									className="cursor-pointer rounded-md border-0 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{submitting ? "Registrando..." : "Registrar abono"}
								</button>
							</div>
						</form>
					</>
				)}
			</section>
		</div>
	);
}
