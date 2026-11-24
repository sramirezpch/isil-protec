import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SaleDetailModal from "../components/SaleDetailModal";
import SaleFormModal from "../components/SaleFormModal";
import {
	cancelSale,
	createSale,
	getClients,
	getProducts,
	getSales,
	type Sale,
	type SaleData,
	type SaleStatus,
	updateSale,
	updateSaleStatus,
} from "../lib/api";
import { formatDate, formatMoney } from "../lib/purchase";
import {
	formatClientName,
	SALE_STATUS_BADGE,
	SALE_STATUS_LABEL,
	saleUnitsOf,
} from "../lib/sale";

type VentaSearch = {
	q?: string;
	status?: SaleStatus;
	page?: number;
};

const isStatus = (value: unknown): value is SaleStatus =>
	value === "PENDING_PAYMENT" ||
	value === "PENDING_DELIVERY" ||
	value === "DELIVERED" ||
	value === "CANCELLED";

export const Route = createFileRoute("/ventas")({
	validateSearch: (search: Record<string, unknown>): VentaSearch => {
		const page = Number(search.page);
		return {
			q:
				typeof search.q === "string" && search.q.trim() !== ""
					? search.q.trim()
					: undefined,
			status: isStatus(search.status) ? search.status : undefined,
			page: Number.isInteger(page) && page > 1 ? page : undefined,
		};
	},
	loaderDeps: ({ search: { q, status, page } }) => ({ q, status, page }),
	loader: async ({ deps: { q, status, page } }) => {
		const [{ sales, limit }, clients, products] = await Promise.all([
			getSales({ query: q, status, page }),
			getClients(),
			getProducts(),
		]);
		return { sales, limit, clients, products };
	},
	component: RouteComponent,
	pendingComponent: () => (
		<main className="px-8 py-8 text-slate-500">Cargando ventas...</main>
	),
	errorComponent: ({ error }) => (
		<main className="px-8 py-8">
			<p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error instanceof Error
					? error.message
					: "Ocurrió un error al obtener las ventas"}
			</p>
		</main>
	),
});

const filterClass =
	"rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const pageButtonClass =
	"cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const toSaleData = (sale: Sale): SaleData => ({
	clientId: sale.clientId,
	saleDate: sale.saleDate,
	items: sale.items.map((i) => ({
		productId: i.productId,
		quantity: i.quantity,
		unitPrice: Number(i.unitPrice),
	})),
});

function RouteComponent() {
	const { sales, limit, clients, products } = Route.useLoaderData();
	const { q, status, page = 1 } = Route.useSearch();
	const navigate = Route.useNavigate();
	const router = useRouter();
	const [query, setQuery] = useState(q ?? "");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Sale | null>(null);
	const [viewing, setViewing] = useState<Sale | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	useEffect(() => {
		const term = query.trim() || undefined;
		if (term === q) return;
		const timeout = setTimeout(
			() =>
				navigate({
					search: (prev) => ({ ...prev, q: term, page: undefined }),
					replace: true,
				}),
			300,
		);
		return () => clearTimeout(timeout);
	}, [query, q, navigate]);

	const goToPage = (next: number) =>
		navigate({
			search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }),
		});

	const registrarVenta = async (data: SaleData) => {
		await createSale(data);
		await router.invalidate();
		setCreating(false);
	};

	const editarVenta = async (data: SaleData) => {
		if (!editing) return;
		await updateSale(editing.id, data);
		await router.invalidate();
		setEditing(null);
	};

	const cambiarEstado = async (
		sale: Sale,
		nextStatus: "PENDING_PAYMENT" | "PENDING_DELIVERY" | "DELIVERED",
		confirmMessage: string,
	) => {
		if (!window.confirm(confirmMessage)) return;
		setActionError(null);
		try {
			await updateSaleStatus(sale.id, nextStatus);
			await router.invalidate();
		} catch (err) {
			setActionError(
				err instanceof Error
					? err.message
					: "Error al actualizar el estado de la venta",
			);
		}
	};

	const cancelarVenta = async (sale: Sale) => {
		const client = formatClientName(sale.client);
		if (!window.confirm(`¿Cancelar la venta del cliente "${client}"?`)) return;
		setActionError(null);
		try {
			await cancelSale(sale.id);
			await router.invalidate();
		} catch (err) {
			setActionError(
				err instanceof Error ? err.message : "Error al cancelar la venta",
			);
		}
	};

	const hasNextPage = sales.length === limit;

	return (
		<main className="px-8 py-8">
			<div className="mb-7 flex items-center justify-between gap-4">
				<h1 className="m-0 text-3xl font-bold text-slate-900">
					Registro de Ventas
				</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
				>
					+ Nueva Venta
				</button>
			</div>

			<div className="mb-6 flex flex-col gap-3 sm:flex-row">
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar por cliente o teléfono..."
					className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
				/>
				<select
					aria-label="Filtrar por estado"
					value={status ?? ""}
					onChange={(e) =>
						navigate({
							search: (prev) => ({
								...prev,
								status: isStatus(e.target.value) ? e.target.value : undefined,
								page: undefined,
							}),
						})
					}
					className={`${filterClass} sm:w-56`}
				>
					<option value="">Estado (Todos)</option>
					<option value="PENDING_PAYMENT">Pendiente de Pago</option>
					<option value="PENDING_DELIVERY">Pendiente de Delivery</option>
					<option value="DELIVERED">Entregado</option>
					<option value="CANCELLED">Cancelado</option>
				</select>
			</div>

			{actionError && (
				<p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{actionError}
				</p>
			)}

			<div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
							<th className="px-4 py-3.5 font-semibold">Fecha</th>
							<th className="px-4 py-3.5 font-semibold">Cliente</th>
							<th className="px-4 py-3.5 font-semibold">Figuras</th>
							<th className="px-4 py-3.5 font-semibold">Total</th>
							<th className="px-4 py-3.5 font-semibold">Estado</th>
							<th className="w-72 px-4 py-3.5 font-semibold">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{sales.map((sale) => (
							<tr
								key={sale.id}
								className="border-t border-slate-200 first:border-t-0"
							>
								<td className="px-4 py-3.5 text-slate-700">
									{formatDate(sale.saleDate)}
								</td>
								<td className="px-4 py-3.5 font-bold text-slate-900">
									{formatClientName(sale.client)}
								</td>
								<td className="px-4 py-3.5">
									<div className="text-slate-700">
										{saleUnitsOf(sale)} unidades
									</div>
									<div className="text-xs text-slate-500">
										{sale.items.length}{" "}
										{sale.items.length === 1 ? "figura" : "figuras"}
									</div>
								</td>
								<td className="px-4 py-3.5 font-bold text-slate-900">
									{formatMoney(Number(sale.totalAmount))}
								</td>
								<td className="px-4 py-3.5">
									<span
										className={`rounded px-2 py-1 text-xs font-semibold ${SALE_STATUS_BADGE[sale.status]}`}
									>
										{SALE_STATUS_LABEL[sale.status]}
									</span>
								</td>
								<td className="px-4 py-3.5">
									<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
										{sale.status === "PENDING_PAYMENT" && (
											<>
												<button
													type="button"
													onClick={() => setEditing(sale)}
													className="cursor-pointer border-0 bg-transparent p-0 text-indigo-500 hover:text-indigo-700"
												>
													✏️ Editar
												</button>
												<button
													type="button"
													onClick={() =>
														cambiarEstado(
															sale,
															"PENDING_DELIVERY",
															"¿Confirmar pago y pasar a Pendiente de Delivery? Esto descontará el stock de las figuras.",
														)
													}
													className="cursor-pointer border-0 bg-transparent p-0 text-blue-600 hover:text-blue-800"
												>
													🚚 A Delivery
												</button>
												<button
													type="button"
													onClick={() => cancelarVenta(sale)}
													className="cursor-pointer border-0 bg-transparent p-0 text-red-500 hover:text-red-700"
												>
													✖️ Cancelar
												</button>
											</>
										)}

										{sale.status === "PENDING_DELIVERY" && (
											<button
												type="button"
												onClick={() =>
													cambiarEstado(
														sale,
														"DELIVERED",
														"¿Marcar esta venta como Entregada?",
													)
												}
												className="cursor-pointer border-0 bg-transparent p-0 text-emerald-600 hover:text-emerald-800"
											>
												✅ Entregar
											</button>
										)}

										<button
											type="button"
											onClick={() => setViewing(sale)}
											className="cursor-pointer border-0 bg-transparent p-0 text-slate-600 hover:text-slate-900"
										>
											👁️ Detalle
										</button>
									</div>
								</td>
							</tr>
						))}
						{sales.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-slate-500"
								>
									No se encontraron ventas.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{(page > 1 || hasNextPage) && (
				<div className="mt-4 flex items-center justify-end gap-3">
					<span className="text-sm text-slate-500">Página {page}</span>
					<button
						type="button"
						onClick={() => goToPage(page - 1)}
						disabled={page <= 1}
						className={pageButtonClass}
					>
						← Anterior
					</button>
					<button
						type="button"
						onClick={() => goToPage(page + 1)}
						disabled={!hasNextPage}
						className={pageButtonClass}
					>
						Siguiente →
					</button>
				</div>
			)}

			{creating && (
				<SaleFormModal
					title="Nueva Venta"
					submitLabel="Confirmar Registro"
					catalogs={{ clients, products }}
					onClose={() => setCreating(false)}
					onConfirm={registrarVenta}
				/>
			)}

			{editing && (
				<SaleFormModal
					key={editing.id}
					title="Editar Venta"
					submitLabel="Guardar Cambios"
					catalogs={{ clients, products }}
					initial={toSaleData(editing)}
					onClose={() => setEditing(null)}
					onConfirm={editarVenta}
				/>
			)}

			{viewing && (
				<SaleDetailModal
					key={viewing.id}
					sale={viewing}
					onClose={() => setViewing(null)}
				/>
			)}
		</main>
	);
}
