import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import ReservationCancellationModal from "../components/ReservationCancellationModal";
import ReservationDetailModal from "../components/ReservationDetailModal";
import ReservationFormModal from "../components/ReservationFormModal";
import {
	cancelReservation,
	createReservation,
	getClients,
	getProducts,
	getReservations,
	type Reservation,
	type ReservationData,
} from "../lib/api";

export const Route = createFileRoute("/reservas")({
	loader: async () => {
		const [reservations, clients, products] = await Promise.all([
			getReservations(),
			getClients(),
			getProducts(),
		]);
		return { reservations, clients, products };
	},
	component: RouteComponent,
	pendingComponent: () => (
		<main className="px-8 py-8 text-slate-500">Cargando reservas...</main>
	),
	errorComponent: ({ error }) => (
		<main className="px-8 py-8">
			<p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error instanceof Error
					? error.message
					: "Ocurrió un error al obtener las reservas"}
			</p>
		</main>
	),
});

const clientName = (client?: {
	name: string | null;
	lastName: string | null;
	phone: string;
}): string =>
	client
		? [client.name, client.lastName].filter(Boolean).join(" ") || client.phone
		: "Cliente no disponible";

function RouteComponent() {
	const { reservations, clients, products } = Route.useLoaderData();
	const router = useRouter();
	const [creating, setCreating] = useState(false);
	const [selectedReservation, setSelectedReservation] =
		useState<Reservation | null>(null);
	const [reservationToCancel, setReservationToCancel] =
		useState<Reservation | null>(null);
	const [refreshError, setRefreshError] = useState<string | null>(null);

	const handleCreate = async (data: ReservationData) => {
		await createReservation(data);
		setCreating(false);
		try {
			await router.invalidate();
			setRefreshError(null);
		} catch (error) {
			setRefreshError(
				error instanceof Error
					? `La reserva se registró, pero no se pudo actualizar el listado: ${error.message}`
					: "La reserva se registró, pero no se pudo actualizar el listado.",
			);
		}
	};

	const handlePaymentsUpdated = async () => {
		await router.invalidate();
	};

	const handleCancel = async (
		reservation: Reservation,
		motivo: string,
		confirmarConAbonos: boolean,
	) => {
		await cancelReservation(reservation.id, { motivo, confirmarConAbonos });
		setReservationToCancel(null);
		try {
			await router.invalidate();
			setRefreshError(null);
		} catch (error) {
			setRefreshError(
				error instanceof Error
					? `La reserva se canceló, pero no se pudo actualizar reservas y stock: ${error.message}`
					: "La reserva se canceló, pero no se pudo actualizar reservas y stock.",
			);
		}
	};

	return (
		<main className="px-8 py-8">
			<div className="mb-7 flex items-center justify-between gap-4">
				<div>
					<h1 className="m-0 text-3xl font-bold text-slate-900">Reservas</h1>
					<p className="mb-0 mt-1 text-sm text-slate-500">
						Las figuras sin stock suficiente se registran como preventa.
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setRefreshError(null);
						setCreating(true);
					}}
					className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
				>
					+ Nueva reserva
				</button>
			</div>

			{refreshError && (
				<p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					{refreshError}
				</p>
			)}

			<div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
							<th className="px-4 py-3.5 font-semibold">Cliente</th>
							<th className="px-4 py-3.5 font-semibold">Fecha límite</th>
							<th className="px-4 py-3.5 font-semibold">Estado</th>
							<th className="px-4 py-3.5 font-semibold">Tipo</th>
							<th className="px-4 py-3.5 font-semibold">Total</th>
							<th className="px-4 py-3.5 font-semibold">Abonado</th>
							<th className="px-4 py-3.5 font-semibold">Saldo pendiente</th>
							<th className="px-4 py-3.5 font-semibold">Cancelación</th>
							<th className="px-4 py-3.5 font-semibold">Figuras</th>
							<th className="px-4 py-3.5 font-semibold">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{reservations.map((reservation) => {
							const firstItem = reservation.items[0];
							return (
								<tr
									key={reservation.id}
									className="border-t border-slate-200 first:border-t-0"
								>
									<td className="px-4 py-3.5 font-medium text-slate-900">
										{clientName(reservation.client)}
									</td>
									<td className="px-4 py-3.5 text-slate-700">
										{reservation.dueDate}
									</td>
									<td className="px-4 py-3.5">
										<span
											className={`rounded px-2 py-1 text-xs font-semibold ${
												reservation.status === "VIGENTE"
													? "bg-emerald-100 text-emerald-700"
													: "bg-slate-200 text-slate-700"
											}`}
										>
											{reservation.status === "VIGENTE"
												? "Vigente"
												: "Cancelada"}
										</span>
									</td>
									<td className="px-4 py-3.5">
										<span
											className={`rounded px-2 py-1 text-xs font-semibold ${
												reservation.type === "PREVENTA"
													? "bg-amber-100 text-amber-800"
													: "bg-indigo-100 text-indigo-700"
											}`}
										>
											{reservation.type === "PREVENTA" ? "Preventa" : "Reserva"}
										</span>
									</td>
									<td className="px-4 py-3.5 font-semibold text-slate-900">
										S/ {reservation.totalAmount}
									</td>
									<td className="px-4 py-3.5 text-slate-700">
										S/ {reservation.totalPaid}
									</td>
									<td className="px-4 py-3.5 font-semibold text-slate-900">
										S/ {reservation.pendingBalance}
									</td>
									<td className="px-4 py-3.5 text-sm text-slate-700">
										{reservation.status === "CANCELADA" ? (
											<>
												<p className="m-0">{reservation.cancellationReason}</p>
												{reservation.cancelledAt && (
													<time className="text-xs text-slate-500">
														{new Intl.DateTimeFormat("es-PE", {
															dateStyle: "short",
															timeStyle: "short",
														}).format(new Date(reservation.cancelledAt))}
													</time>
												)}
											</>
										) : (
											"—"
										)}
									</td>
									<td className="px-4 py-3.5 text-sm text-slate-700">
										{firstItem ? (
											<>
												<span className="font-medium text-slate-900">
													{firstItem.product?.name ?? firstItem.productId}
												</span>
												{reservation.items.length > 1 && (
													<span className="ml-1 text-slate-500">
														+{reservation.items.length - 1} más
													</span>
												)}
											</>
										) : (
											"—"
										)}
									</td>
									<td className="px-4 py-3.5">
										<div className="flex flex-col items-start gap-2">
											<button
												type="button"
												onClick={() => {
													setRefreshError(null);
													setSelectedReservation(reservation);
												}}
												className="cursor-pointer rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
											>
												Ver detalle
											</button>
											{reservation.status === "VIGENTE" && (
												<button
													type="button"
													onClick={() => {
														setRefreshError(null);
														setReservationToCancel(reservation);
													}}
													className="cursor-pointer rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
												>
													Cancelar reserva
												</button>
											)}
										</div>
									</td>
								</tr>
							);
						})}
						{reservations.length === 0 && (
							<tr>
								<td
									colSpan={10}
									className="px-4 py-8 text-center text-slate-500"
								>
									Aún no hay reservas registradas.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{creating && (
				<ReservationFormModal
					clients={clients.filter((client) => client.active)}
					products={products.filter((product) => product.active)}
					onClose={() => setCreating(false)}
					onConfirm={handleCreate}
				/>
			)}

			{selectedReservation && (
				<ReservationDetailModal
					reservation={selectedReservation}
					onClose={() => setSelectedReservation(null)}
					onUpdated={handlePaymentsUpdated}
				/>
			)}

			{reservationToCancel && (
				<ReservationCancellationModal
					reservation={reservationToCancel}
					onClose={() => setReservationToCancel(null)}
					onConfirm={(motivo, confirmarConAbonos) =>
						handleCancel(reservationToCancel, motivo, confirmarConAbonos)
					}
				/>
			)}
		</main>
	);
}
