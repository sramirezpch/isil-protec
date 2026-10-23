import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import PurchaseDetailModal from "../components/PurchaseDetailModal";
import PurchaseFormModal from "../components/PurchaseFormModal";
import {
	cancelPurchase,
	createPurchase,
	getProducts,
	getPurchases,
	getSuppliers,
	type Purchase,
	type PurchaseData,
	type PurchaseStatus,
	type ReceivePurchaseData,
	receivePurchase,
	updatePurchase,
} from "../lib/api";
import {
	formatDate,
	formatMoney,
	landedTotalOf,
	STATUS_LABEL,
	unitsOf,
} from "../lib/purchase";

type CompraSearch = {
	q?: string;
	status?: PurchaseStatus;
	page?: number;
};

const isStatus = (value: unknown): value is PurchaseStatus =>
	value === "PENDING" || value === "RECEIVED" || value === "CANCELLED";

export const Route = createFileRoute("/compras")({
	// Filters live in the URL (?q=&status=&page=) so they survive reloads
	validateSearch: (search: Record<string, unknown>): CompraSearch => {
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
	// Suppliers and figuras fill the form selects
	loader: async ({ deps: { q, status, page } }) => {
		const [{ purchases, limit }, suppliers, products] = await Promise.all([
			getPurchases({ query: q, status, page }),
			getSuppliers(),
			getProducts(),
		]);
		return { purchases, limit, suppliers, products };
	},
	component: RouteComponent,
	pendingComponent: () => (
		<main className="px-8 py-8 text-slate-500">Cargando compras...</main>
	),
	errorComponent: ({ error }) => (
		<main className="px-8 py-8">
			<p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error instanceof Error
					? error.message
					: "Ocurrió un error al obtener las compras"}
			</p>
		</main>
	),
});

// Filters use the gray background from the design
const filterClass =
	"rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const pageButtonClass =
	"cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_BADGE: Record<PurchaseStatus, string> = {
	PENDING: "bg-amber-100 text-amber-700",
	RECEIVED: "bg-emerald-100 text-emerald-700",
	CANCELLED: "bg-red-100 text-red-600",
};

const toPurchaseData = (purchase: Purchase): PurchaseData => ({
	supplierId: purchase.supplierId,
	arrivalDate: purchase.arrivalDate,
	currency: purchase.currency,
	exchangeRate: Number(purchase.exchangeRate),
	internationalFreight: Number(purchase.internationalFreight),
	customsDuties: Number(purchase.customsDuties),
	items: purchase.items.map((i) => ({
		productId: i.productId,
		quantityOrdered: i.quantityOrdered,
		unitCostForeign: Number(i.unitCostForeign),
	})),
});

function RouteComponent() {
	const { purchases, limit, suppliers, products } = Route.useLoaderData();
	const { q, status, page = 1 } = Route.useSearch();
	const navigate = Route.useNavigate();
	const router = useRouter();
	const [query, setQuery] = useState(q ?? "");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Purchase | null>(null);
	const [receiving, setReceiving] = useState<Purchase | null>(null);
	const [viewing, setViewing] = useState<Purchase | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	// Debounce typing before asking the backend to search; a new search
	// starts again from the first page
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

	// Mutations don't return the purchase, so reload the list after each one
	const registrarCompra = async (data: PurchaseData) => {
		await createPurchase(data);
		await router.invalidate();
		setCreating(false);
	};

	const editarCompra = async (data: PurchaseData) => {
		if (!editing) return;
		await updatePurchase(editing.id, data);
		await router.invalidate();
		setEditing(null);
	};

	const recibirCompra = async (data: ReceivePurchaseData) => {
		if (!receiving) return;
		await receivePurchase(receiving.id, data);
		await router.invalidate();
		setReceiving(null);
	};

	const cancelarCompra = async (purchase: Purchase) => {
		const supplier = purchase.supplier?.companyName ?? "el proveedor";
		if (!window.confirm(`¿Cancelar la compra de "${supplier}"?`)) return;
		setActionError(null);
		try {
			await cancelPurchase(purchase.id);
			await router.invalidate();
		} catch (err) {
			setActionError(
				err instanceof Error ? err.message : "Error al cancelar la compra",
			);
		}
	};

	// Without a total count, a full page is the only hint that more exist
	const hasNextPage = purchases.length === limit;

	return (
		<main className="px-8 py-8">
			<div className="mb-7 flex items-center justify-between gap-4">
				<h1 className="m-0 text-3xl font-bold text-slate-900">
					Registro de Compras
				</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
				>
					+ Nueva Compra
				</button>
			</div>

			<div className="mb-6 flex flex-col gap-3 sm:flex-row">
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar por proveedor o moneda..."
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
					className={`${filterClass} sm:w-48`}
				>
					<option value="">Estado (Todos)</option>
					<option value="PENDING">Pendiente</option>
					<option value="RECEIVED">Recibido</option>
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
							<th className="px-4 py-3.5 font-semibold">Registrado</th>
							<th className="px-4 py-3.5 font-semibold">Proveedor</th>
							<th className="px-4 py-3.5 font-semibold">Figuras</th>
							<th className="px-4 py-3.5 font-semibold">Moneda</th>
							<th className="px-4 py-3.5 font-semibold">Total Puesto</th>
							<th className="px-4 py-3.5 font-semibold">Llegada</th>
							<th className="px-4 py-3.5 font-semibold">Estado</th>
							<th className="w-64 px-4 py-3.5 font-semibold">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{purchases.map((purchase) => (
							<tr
								key={purchase.id}
								className="border-t border-slate-200 first:border-t-0"
							>
								<td className="px-4 py-3.5 text-slate-700">
									{formatDate(purchase.createdAt)}
								</td>
								<td className="px-4 py-3.5 font-bold text-slate-900">
									{purchase.supplier?.companyName ?? "—"}
								</td>
								<td className="px-4 py-3.5">
									<div className="text-slate-700">
										{unitsOf(purchase)} unidades
									</div>
									<div className="text-xs text-slate-500">
										{purchase.items.length}{" "}
										{purchase.items.length === 1 ? "figura" : "figuras"}
									</div>
								</td>
								<td className="px-4 py-3.5">
									<div className="text-slate-700">{purchase.currency}</div>
									<div className="text-xs text-slate-500">
										T.C. {Number(purchase.exchangeRate).toFixed(4)}
									</div>
								</td>
								<td className="px-4 py-3.5 font-bold text-slate-900">
									{formatMoney(landedTotalOf(purchase))}
								</td>
								<td className="px-4 py-3.5 text-slate-700">
									{formatDate(purchase.arrivalDate)}
								</td>
								<td className="px-4 py-3.5">
									<span
										className={`rounded px-2 py-1 text-xs font-semibold ${STATUS_BADGE[purchase.status]}`}
									>
										{STATUS_LABEL[purchase.status]}
									</span>
								</td>
								<td className="px-4 py-3.5">
									{/* Only pending purchases can still change */}
									{purchase.status === "PENDING" ? (
										<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
											<button
												type="button"
												onClick={() => setEditing(purchase)}
												className="cursor-pointer border-0 bg-transparent p-0 text-indigo-500 hover:text-indigo-700"
											>
												✏️ Editar
											</button>
											<button
												type="button"
												onClick={() => setReceiving(purchase)}
												className="cursor-pointer border-0 bg-transparent p-0 text-emerald-600 hover:text-emerald-800"
											>
												📥 Recibir
											</button>
											<button
												type="button"
												onClick={() => cancelarCompra(purchase)}
												className="cursor-pointer border-0 bg-transparent p-0 text-red-500 hover:text-red-700"
											>
												✖️ Cancelar
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => setViewing(purchase)}
											className="cursor-pointer border-0 bg-transparent p-0 text-indigo-500 hover:text-indigo-700"
										>
											👁️ Ver Detalle
										</button>
									)}
								</td>
							</tr>
						))}
						{purchases.length === 0 && (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-8 text-center text-slate-500"
								>
									No se encontraron compras.
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
				<PurchaseFormModal
					title="Nueva Compra"
					submitLabel="Confirmar Registro"
					catalogs={{ suppliers, products }}
					onClose={() => setCreating(false)}
					onConfirm={registrarCompra}
				/>
			)}

			{editing && (
				<PurchaseFormModal
					key={editing.id}
					title="Editar Compra"
					submitLabel="Guardar Cambios"
					catalogs={{ suppliers, products }}
					initial={toPurchaseData(editing)}
					onClose={() => setEditing(null)}
					onConfirm={editarCompra}
				/>
			)}

			{receiving && (
				<PurchaseDetailModal
					key={receiving.id}
					purchase={receiving}
					onClose={() => setReceiving(null)}
					onReceive={recibirCompra}
				/>
			)}

			{viewing && (
				<PurchaseDetailModal
					key={viewing.id}
					purchase={viewing}
					onClose={() => setViewing(null)}
				/>
			)}
		</main>
	);
}
