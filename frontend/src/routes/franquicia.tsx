import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import CatalogTable from "../components/CatalogTable";
import RelatedCatalogFormModal, {
	type RelatedCatalogData,
} from "../components/RelatedCatalogFormModal";
import {
	createFranquicia,
	deleteFranquicia,
	type Franquicia,
	type FranquiciaData,
	getFormatos,
	getFranquicias,
	updateFranquicia,
} from "../lib/api";

export const Route = createFileRoute("/franquicia")({
	// Formatos fill the "Formato" select in the form
	loader: async () => {
		const [franquicias, formatos] = await Promise.all([
			getFranquicias(),
			getFormatos(),
		]);
		return { franquicias, formatos };
	},
	component: RouteComponent,
	pendingComponent: () => (
		<main className="px-8 py-8 text-slate-500">Cargando franquicias...</main>
	),
	errorComponent: ({ error }) => (
		<main className="px-8 py-8">
			<p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error instanceof Error
					? error.message
					: "Ocurrió un error al obtener franquicias"}
			</p>
		</main>
	),
});

function RouteComponent() {
	const { franquicias, formatos } = Route.useLoaderData();
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Franquicia | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// Only active formatos can be picked, but keep the current one selectable
	const formatoOptions = (currentId?: string) =>
		formatos.filter((f) => f.active || f.id === currentId);

	const toFranquiciaData = (data: RelatedCatalogData): FranquiciaData => ({
		name: data.name,
		active: data.active,
		formatoId: data.relatedId,
	});

	// Mutations don't return the franquicia, so reload the list after each one
	const crearFranquicia = async (data: RelatedCatalogData) => {
		await createFranquicia(toFranquiciaData(data));
		await router.invalidate();
		setCreating(false);
	};

	const editarFranquicia = async (data: RelatedCatalogData) => {
		if (!editing) return;
		// PATCH only the fields that actually changed
		const next = toFranquiciaData(data);
		const changes: Partial<FranquiciaData> = {};
		if (next.name !== editing.name) changes.name = next.name;
		if (next.active !== editing.active) changes.active = next.active;
		if (next.formatoId !== editing.formatoId)
			changes.formatoId = next.formatoId;

		if (Object.keys(changes).length > 0) {
			await updateFranquicia(editing.id, changes);
			await router.invalidate();
		}
		setEditing(null);
	};

	const eliminarFranquicia = async (franquicia: Franquicia) => {
		if (!window.confirm(`¿Eliminar la franquicia "${franquicia.name}"?`))
			return;
		setDeleteError(null);
		try {
			await deleteFranquicia(franquicia.id);
			await router.invalidate();
		} catch (err) {
			setDeleteError(
				err instanceof Error ? err.message : "Error al eliminar la franquicia",
			);
		}
	};

	const term = query.trim().toLowerCase();
	const filtered = franquicias.filter(
		(f) =>
			f.name.toLowerCase().includes(term) ||
			f.id.toLowerCase().includes(term) ||
			f.formatoName.toLowerCase().includes(term),
	);

	return (
		<main className="px-8 py-8">
			<div className="mb-7 flex items-center justify-between gap-4">
				<h1 className="m-0 text-3xl font-bold text-slate-900">
					Listado de Franquicias
				</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
				>
					+ Nueva Franquicia
				</button>
			</div>

			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Buscar franquicia..."
				className="mb-6 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
			/>

			{deleteError && (
				<p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{deleteError}
				</p>
			)}

			<CatalogTable
				items={filtered}
				emptyMessage="No se encontraron franquicias."
				extraColumns={[{ header: "Formato", render: (f) => f.formatoName }]}
				onEdit={setEditing}
				onDelete={eliminarFranquicia}
			/>

			{creating && (
				<RelatedCatalogFormModal
					title="Nueva Franquicia"
					submitLabel="Confirmar Registro"
					entityLabel="Franquicia"
					relatedLabel="Formato"
					relatedPlaceholder="Seleccione un formato..."
					options={formatoOptions()}
					onClose={() => setCreating(false)}
					onConfirm={crearFranquicia}
				/>
			)}

			{editing && (
				<RelatedCatalogFormModal
					key={editing.id}
					title="Editar Franquicia"
					submitLabel="Guardar Cambios"
					entityLabel="Franquicia"
					relatedLabel="Formato"
					relatedPlaceholder="Seleccione un formato..."
					options={formatoOptions(editing.formatoId)}
					initial={{
						name: editing.name,
						relatedId: editing.formatoId,
						active: editing.active,
					}}
					onClose={() => setEditing(null)}
					onConfirm={editarFranquicia}
				/>
			)}
		</main>
	);
}
