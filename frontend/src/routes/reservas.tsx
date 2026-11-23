import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import ReservationCancellationModal from "../components/ReservationCancellationModal";
import ReservationConversionModal from "../components/ReservationConversionModal";
import ReservationDetailModal from "../components/ReservationDetailModal";
import ReservationFormModal from "../components/ReservationFormModal";
import {
	cancelReservation,
	convertReservationToSale,
	createReservation,
	getClients,
	getProducts,
	getReservations,
	type Reservation,
	type ReservationConversionResponse,
	type ReservationData,
	type ReservationPaymentMethod,
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

type ReservationStatusFilter = "" | Reservation["status"];
type ReservationTypeFilter = "" | Reservation["type"];

const normalizeSearchText = (value: string): string =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.replace(/\s+/g, " ")
		.toLocaleLowerCase();

const filterFieldClass =
	"w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function RouteComponent() {
	const { reservations, clients, products } = Route.useLoaderData();
	const router = useRouter();
	const [creating, setCreating] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ReservationStatusFilter>("");
	const [typeFilter, setTypeFilter] = useState<ReservationTypeFilter>("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [selectedReservation, setSelectedReservation] =
		useState<Reservation | null>(null);
	const [reservationToCancel, setReservationToCancel] =
		useState<Reservation | null>(null);
	const [reservationToConvert, setReservationToConvert] =
		useState<Reservation | null>(null);
	const [refreshError, setRefreshError] = useState<string | null>(null);

	const hasInvalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
	const normalizedQuery = normalizeSearchText(searchQuery);
	const filteredReservations = reservations.filter((reservation) => {
		const name = [reservation.client?.name, reservation.client?.lastName]
			.filter(Boolean)
			.join(" ");
		const matchesName =
			!normalizedQuery || normalizeSearchText(name).includes(normalizedQuery);
		const matchesStatus = !statusFilter || reservation.status === statusFilter;
		const matchesType = !typeFilter || reservation.type === typeFilter;
		const matchesDate =
			hasInvalidDateRange ||
			((!dateFrom || reservation.dueDate >= dateFrom) &&
				(!dateTo || reservation.dueDate <= dateTo));

		return matchesName && matchesStatus && matchesType && matchesDate;
	});
	const hasActiveFilters = Boolean(
		searchQuery || statusFilter || typeFilter || dateFrom || dateTo,
	);

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("");
		setTypeFilter("");
		setDateFrom("");
		setDateTo("");
	};

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

	const handleConvert = async (
		paymentMethod: ReservationPaymentMethod | undefined,
	): Promise<ReservationConversionResponse> => {
		if (!reservationToConvert) {
			throw new Error("No se seleccionó una reserva para convertir.");
		}

		const result = await convertReservationToSale(
			reservationToConvert.id,
			paymentMethod ? { paymentMethod } : {},
		);
		try {
			await router.invalidate();
			setRefreshError(null);
		} catch (error) {
			setRefreshError(
				error instanceof Error
					? `La reserva se convirtió, pero no se pudo actualizar reservas y stock: ${error.message}`
					: "La reserva se convirtió, pero no se pudo actualizar reservas y stock.",
			);
		}
		return result;
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

			<section className="mb-5 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1.5fr)_repeat(2,minmax(10rem,1fr))]">
					<div>
						<label
							htmlFor="reservation-search"
							className="mb-1.5 block text-sm font-medium text-slate-700"
						>
							Buscar por cliente
						</label>
						<input
							id="reservation-search"
							type="search"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Nombre del cliente..."
							className={filterFieldClass}
						/>
					</div>
					<div>
						<label
							htmlFor="reservation-status-filter"
							className="mb-1.5 block text-sm font-medium text-slate-700"
						>
							Estado
						</label>
						<select
							id="reservation-status-filter"
							value={statusFilter}
							onChange={(event) =>
								setStatusFilter(event.target.value as ReservationStatusFilter)
							}
							className={filterFieldClass}
						>
							<option value="">Todos</option>
							<option value="VIGENTE">Vigente</option>
							<option value="CANCELADA">Cancelada</option>
							<option value="CONVERTIDA">Convertida</option>
						</select>
					</div>
					<div>
						<label
							htmlFor="reservation-type-filter"
							className="mb-1.5 block text-sm font-medium text-slate-700"
						>
							Tipo
						</label>
						<select
							id="reservation-type-filter"
							value={typeFilter}
							onChange={(event) =>
								setTypeFilter(event.target.value as ReservationTypeFilter)
							}
							className={filterFieldClass}
						>
							<option value="">Todos</option>
							<option value="RESERVA">Reserva</option>
							<option value="PREVENTA">Preventa</option>
						</select>
					</div>
				</div>

				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					<div>
						<label
							htmlFor="reservation-date-from"
							className="mb-1.5 block text-sm font-medium text-slate-700"
						>
							Fecha límite desde
						</label>
						<input
							id="reservation-date-from"
							type="date"
							value={dateFrom}
							onChange={(event) => setDateFrom(event.target.value)}
							className={filterFieldClass}
						/>
					</div>
					<div>
						<label
							htmlFor="reservation-date-to"
							className="mb-1.5 block text-sm font-medium text-slate-700"
						>
							Fecha límite hasta
						</label>
						<input
							id="reservation-date-to"
							type="date"
							value={dateTo}
							onChange={(event) => setDateTo(event.target.value)}
							className={filterFieldClass}
						/>
					</div>
				</div>

				{hasInvalidDateRange && (
					<p className="mb-0 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
						La fecha «Desde» debe ser anterior o igual a «Hasta». No se aplicará
						el filtro de fecha.
					</p>
				)}

				<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
					<p className="m-0 text-sm text-slate-600" aria-live="polite">
						Mostrando {filteredReservations.length} de {reservations.length}{" "}
						reservas
					</p>
					<button
						type="button"
						onClick={clearFilters}
						disabled={!hasActiveFilters}
						className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Limpiar filtros
					</button>
				</div>
			</section>

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
						{filteredReservations.map((reservation) => {
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
													: reservation.status === "CONVERTIDA"
														? "bg-violet-100 text-violet-700"
														: "bg-slate-200 text-slate-700"
											}`}
										>
											{reservation.status === "VIGENTE"
												? "Vigente"
												: reservation.status === "CONVERTIDA"
													? "Convertida"
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
									<td className="w-56 px-4 py-3.5">
										<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
											<button
												type="button"
												onClick={() => {
													setRefreshError(null);
													setSelectedReservation(reservation);
												}}
												className="cursor-pointer border-0 bg-transparent p-0 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
											>
												Detalle y abonos
											</button>
											{reservation.status === "VIGENTE" && (
												<>
													<button
														type="button"
														onClick={() => {
															setRefreshError(null);
															setReservationToConvert(reservation);
														}}
														className="cursor-pointer border-0 bg-transparent p-0 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
													>
														Liquidar y convertir
													</button>
													<button
														type="button"
														onClick={() => {
															setRefreshError(null);
															setReservationToCancel(reservation);
														}}
														className="cursor-pointer border-0 bg-transparent p-0 py-1 text-xs font-semibold text-red-700 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
													>
														Cancelar
													</button>
												</>
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
						{reservations.length > 0 && filteredReservations.length === 0 && (
							<tr>
								<td
									colSpan={10}
									className="px-4 py-8 text-center text-slate-500"
								>
									No hay reservas que coincidan con los filtros.
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
					onConvert={(reservation) => {
						setSelectedReservation(null);
						setReservationToConvert(reservation);
					}}
				/>
			)}

			{reservationToConvert && (
				<ReservationConversionModal
					reservation={reservationToConvert}
					onClose={() => setReservationToConvert(null)}
					onConfirm={handleConvert}
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
