import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import FiguraFormModal, {
	type FiguraFormData,
} from "../components/FiguraFormModal";
import {
	archiveProduct,
	createProduct,
	getFranquicias,
	getLineas,
	getProducts,
	type Product,
	type ProductData,
	updateProduct,
} from "../lib/api";

export const Route = createFileRoute("/figura")({
	// Franquicias and líneas give names to the ids and fill the form selects
	loader: async () => {
		const [products, franquicias, lineas] = await Promise.all([
			getProducts(),
			getFranquicias(),
			getLineas(),
		]);
		return { products, franquicias, lineas };
	},
	component: RouteComponent,
	pendingComponent: () => (
		<main className="px-8 py-8 text-slate-500">Cargando figuras...</main>
	),
	errorComponent: ({ error }) => (
		<main className="px-8 py-8">
			<p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error instanceof Error
					? error.message
					: "Ocurrió un error al obtener las figuras"}
			</p>
		</main>
	),
});

type EstadoFiltro = "" | "activo" | "archivado";

const precioFormat = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

// Filters use the gray background from the design
const filterClass =
	"rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Suggests the next "SKU-<n>" after the highest existing one
const nextSku = (products: Product[]) => {
	const numbers = products
		.map((p) => /^SKU-(\d+)$/.exec(p.sku)?.[1])
		.filter((n) => n !== undefined)
		.map(Number);
	return `SKU-${Math.max(1000, ...numbers) + 1}`;
};

const toProductData = (data: FiguraFormData): ProductData => ({
	sku: data.sku,
	name: data.name,
	price: data.price.toFixed(2),
	stock: data.stock,
	active: data.active,
	franchiseId: data.franchiseId,
	lineaId: data.lineaId,
});

function RouteComponent() {
	const { products, franquicias, lineas } = Route.useLoaderData();
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [franquiciaId, setFranquiciaId] = useState("");
	const [estado, setEstado] = useState<EstadoFiltro>("");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Product | null>(null);
	const [archiveError, setArchiveError] = useState<string | null>(null);

	const franquiciaName = (id: string) =>
		franquicias.find((f) => f.id === id)?.name ?? "—";

	// Mutations don't return the product, so reload the list after each one
	const crearFigura = async (data: FiguraFormData) => {
		await createProduct(toProductData(data));
		await router.invalidate();
		setCreating(false);
	};

	const editarFigura = async (data: FiguraFormData) => {
		if (!editing) return;
		// PATCH only the fields that actually changed
		const next = toProductData(data);
		const changes: Partial<ProductData> = {};
		if (next.name !== editing.name) changes.name = next.name;
		if (Number(next.price) !== Number(editing.price))
			changes.price = next.price;
		if (next.stock !== editing.stock) changes.stock = next.stock;
		if (next.franchiseId !== editing.franchiseId)
			changes.franchiseId = next.franchiseId;
		if (next.lineaId !== editing.lineaId) changes.lineaId = next.lineaId;
		if (next.active !== editing.active) changes.active = next.active;

		if (Object.keys(changes).length > 0) {
			await updateProduct(editing.id, changes);
			await router.invalidate();
		}
		setEditing(null);
	};

	const archivarFigura = async (product: Product) => {
		if (!window.confirm(`¿Archivar la figura "${product.name}"?`)) return;
		setArchiveError(null);
		try {
			await archiveProduct(product.id);
			await router.invalidate();
		} catch (err) {
			setArchiveError(
				err instanceof Error ? err.message : "Error al archivar la figura",
			);
		}
	};

	const term = query.trim().toLowerCase();
	const filtered = products.filter(
		(p) =>
			(p.name.toLowerCase().includes(term) ||
				p.sku.toLowerCase().includes(term)) &&
			(franquiciaId === "" || p.franchiseId === franquiciaId) &&
			(estado === "" || p.active === (estado === "activo")),
	);

	return (
		<main className="px-8 py-8">
			<div className="mb-7 flex items-center justify-between gap-4">
				<h1 className="m-0 text-3xl font-bold text-slate-900">
					Inventario de Figuras
				</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
				>
					+ Nueva Figura
				</button>
			</div>

			<div className="mb-6 flex flex-col gap-3 sm:flex-row">
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar por Nombre o SKU..."
					className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
				/>
				<select
					aria-label="Filtrar por franquicia"
					value={franquiciaId}
					onChange={(e) => setFranquiciaId(e.target.value)}
					className={`${filterClass} sm:w-48`}
				>
					<option value="">Franquicia (Todas)</option>
					{franquicias.map((f) => (
						<option key={f.id} value={f.id}>
							{f.name}
						</option>
					))}
				</select>
				<select
					aria-label="Filtrar por estado"
					value={estado}
					onChange={(e) => setEstado(e.target.value as EstadoFiltro)}
					className={`${filterClass} sm:w-48`}
				>
					<option value="">Estado (Todos)</option>
					<option value="activo">Activo</option>
					<option value="archivado">Archivado</option>
				</select>
			</div>

			{archiveError && (
				<p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{archiveError}
				</p>
			)}

			<div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
							<th className="px-4 py-3.5 font-semibold">SKU</th>
							<th className="px-4 py-3.5 font-semibold">Figura</th>
							<th className="px-4 py-3.5 font-semibold">Estado</th>
							<th className="px-4 py-3.5 font-semibold">Precio</th>
							<th className="px-4 py-3.5 font-semibold">Stock</th>
							<th className="w-48 px-4 py-3.5 font-semibold">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((product) => (
							<tr
								key={product.id}
								className="border-t border-slate-200 first:border-t-0"
							>
								<td className="px-4 py-3.5 text-slate-700">{product.sku}</td>
								<td className="px-4 py-3.5">
									<div className="font-bold text-slate-900">{product.name}</div>
									<div className="text-xs text-slate-500">
										{franquiciaName(product.franchiseId)}
									</div>
								</td>
								<td className="px-4 py-3.5">
									{product.active ? (
										<span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
											Activo
										</span>
									) : (
										<span className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
											Archivado
										</span>
									)}
								</td>
								<td className="px-4 py-3.5 font-bold text-slate-900">
									{precioFormat.format(Number(product.price))}
								</td>
								<td className="px-4 py-3.5">
									{product.stock > 0 ? (
										<span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
											In Stock ({product.stock})
										</span>
									) : (
										<span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
											Agotado (0)
										</span>
									)}
								</td>
								<td className="px-4 py-3.5">
									<div className="flex items-center gap-5">
										<button
											type="button"
											onClick={() => setEditing(product)}
											className="cursor-pointer border-0 bg-transparent p-0 text-indigo-500 hover:text-indigo-700"
										>
											✏️ Editar
										</button>
										{product.active && (
											<button
												type="button"
												onClick={() => archivarFigura(product)}
												className="cursor-pointer border-0 bg-transparent p-0 text-red-500 hover:text-red-700"
											>
												📦 Archivar
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-slate-500"
								>
									No se encontraron figuras.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{creating && (
				<FiguraFormModal
					title="Nueva Figura"
					submitLabel="Confirmar Registro"
					suggestedSku={nextSku(products)}
					catalogs={{ franquicias, lineas }}
					onClose={() => setCreating(false)}
					onConfirm={crearFigura}
				/>
			)}

			{editing && (
				<FiguraFormModal
					key={editing.id}
					title="Editar Figura"
					submitLabel="Guardar Cambios"
					catalogs={{ franquicias, lineas }}
					initial={{
						sku: editing.sku,
						name: editing.name,
						price: Number(editing.price),
						stock: editing.stock,
						franchiseId: editing.franchiseId,
						lineaId: editing.lineaId,
						active: editing.active,
					}}
					onClose={() => setEditing(null)}
					onConfirm={editarFigura}
				/>
			)}
		</main>
	);
}
