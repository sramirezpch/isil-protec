import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import ReservationFormModal from "../components/ReservationFormModal";
import {
	createReservation,
	getClients,
	getProducts,
	getReservations,
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
							<th className="px-4 py-3.5 font-semibold">Figuras pendientes</th>
						</tr>
					</thead>
					<tbody>
						{reservations.map((reservation) => {
							const pendingItems = reservation.items.filter(
								(item) => item.cantidadBloqueada === 0,
							);
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
										<span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
											{reservation.status}
										</span>
									</td>
									<td className="px-4 py-3.5 text-slate-700">
										{reservation.type}
									</td>
									<td className="px-4 py-3.5 font-semibold text-slate-900">
										S/ {reservation.totalAmount}
									</td>
									<td className="px-4 py-3.5 text-sm text-slate-700">
										{pendingItems.length > 0
											? pendingItems
													.map((item) => item.product?.name ?? item.productId)
													.join(", ")
											: "—"}
									</td>
								</tr>
							);
						})}
						{reservations.length === 0 && (
							<tr>
								<td
									colSpan={6}
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
		</main>
	);
}
