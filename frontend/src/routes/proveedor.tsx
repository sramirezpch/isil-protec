import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import SupplierFormModal from "../components/SupplierFormModal";
import {
	createSupplier,
	deleteSupplier,
	getSuppliers,
	type Supplier,
	type SupplierData,
	updateSupplier,
} from "../lib/api";

export const Route = createFileRoute("/proveedor")({
	loader: () => getSuppliers(),
	component: RouteComponent,
	pendingComponent: () => (
		<main className="px-8 py-8 text-slate-500">Cargando proveedores...</main>
	),
	errorComponent: ({ error }) => (
		<main className="px-8 py-8">
			<p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error instanceof Error
					? error.message
					: "Ocurrió un error al obtener proveedores"}
			</p>
		</main>
	),
});

function RouteComponent() {
	const suppliers = Route.useLoaderData();
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Supplier | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const crearProveedor = async (data: SupplierData) => {
		await createSupplier(data);
		await router.invalidate();
		setCreating(false);
	};

	const editarProveedor = async (data: SupplierData) => {
		if (!editing) return;
		await updateSupplier(editing.id, data);
		await router.invalidate();
		setEditing(null);
	};

	const eliminarProveedor = async (supplier: Supplier) => {
		if (!window.confirm(`¿Eliminar al proveedor "${supplier.companyName}"?`))
			return;
		setDeleteError(null);
		try {
			await deleteSupplier(supplier.id);
			await router.invalidate();
		} catch (err) {
			setDeleteError(
				err instanceof Error ? err.message : "Error al eliminar el proveedor",
			);
		}
	};

	const term = query.trim().toLowerCase();
	const filtered = suppliers.filter(
		(s) =>
			s.companyName.toLowerCase().includes(term) ||
			s.taxId.toLowerCase().includes(term) ||
			s.contactName.toLowerCase().includes(term),
	);

	return (
		<main className="px-8 py-8">
			<div className="mb-7 flex items-center justify-between gap-4">
				<h1 className="m-0 text-3xl font-bold text-slate-900">
					Listado de Proveedores
				</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
				>
					+ Nuevo Proveedor
				</button>
			</div>

			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Buscar por empresa, Tax ID o contacto..."
				className="mb-6 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
			/>

			{deleteError && (
				<p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{deleteError}
				</p>
			)}

			{/* Tabla con encabezado oscuro e ID */}
			<div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<table className="w-full border-collapse text-left text-sm text-slate-600">
					<thead className="bg-[#0f172a] text-[11px] font-bold uppercase tracking-wider text-white">
						<tr>
							<th className="px-4 py-3">ID</th>
							<th className="px-4 py-3">Empresa</th>
							<th className="px-4 py-3">Tax ID / RUC</th>
							<th className="px-4 py-3">País</th>
							<th className="px-4 py-3">Contacto</th>
							<th className="px-4 py-3">Teléfono / Email</th>
							<th className="px-4 py-3">Estado</th>
							<th className="px-4 py-3 text-right">Acciones</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200">
						{filtered.length === 0 ? (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-6 text-center text-slate-500"
								>
									No se encontraron proveedores.
								</td>
							</tr>
						) : (
							filtered.map((s) => (
								<tr key={s.id} className="hover:bg-slate-50 transition">
									<td className="px-4 py-3 font-mono text-xs text-slate-500">
										{s.id.slice(0, 8)}...
									</td>
									<td className="px-4 py-3 font-semibold text-slate-900">
										{s.companyName}
									</td>
									<td className="px-4 py-3 font-mono">{s.taxId}</td>
									<td className="px-4 py-3">{s.country}</td>
									<td className="px-4 py-3">{s.contactName}</td>
									<td className="px-4 py-3 text-xs">
										<div>{s.email}</div>
										<div className="text-slate-400">{s.phone}</div>
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												s.active
													? "bg-emerald-50 text-emerald-700"
													: "bg-slate-100 text-slate-600"
											}`}
										>
											{s.active ? "Activo" : "Inactivo"}
										</span>
									</td>
									<td className="px-4 py-3 text-right space-x-2">
										<button
											type="button"
											onClick={() => setEditing(s)}
											className="cursor-pointer text-indigo-600 hover:text-indigo-900 font-semibold text-xs"
										>
											Editar
										</button>
										<button
											type="button"
											onClick={() => eliminarProveedor(s)}
											className="cursor-pointer text-red-600 hover:text-red-900 font-semibold text-xs"
										>
											Eliminar
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{creating && (
				<SupplierFormModal
					title="Nuevo Proveedor"
					submitLabel="Confirmar Registro"
					onClose={() => setCreating(false)}
					onConfirm={crearProveedor}
				/>
			)}

			{editing && (
				<SupplierFormModal
					key={editing.id}
					title="Editar Proveedor"
					submitLabel="Guardar Cambios"
					initial={{
						companyName: editing.companyName,
						country: editing.country,
						taxId: editing.taxId,
						address: editing.address,
						contactName: editing.contactName,
						email: editing.email,
						phone: editing.phone,
						active: editing.active,
					}}
					onClose={() => setEditing(null)}
					onConfirm={editarProveedor}
				/>
			)}
		</main>
	);
}
