import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ClientFormModal, {
	type ClientFormData,
} from "../components/ClientFormModal";
import {
	type Client,
	type ClientData,
	createClient,
	deleteClient,
	getClients,
	updateClient,
} from "../lib/api";

type ClientesSearch = { q?: string };

export const Route = createFileRoute("/clientes")({
	// The search term lives in the URL (?q=) so it survives reloads
	validateSearch: (search: Record<string, unknown>): ClientesSearch => ({
		q:
			typeof search.q === "string" && search.q.trim() !== ""
				? search.q.trim()
				: undefined,
	}),
	loaderDeps: ({ search: { q } }) => ({ q }),
	loader: ({ deps: { q } }) => getClients(q),
	component: RouteComponent,
	pendingComponent: () => (
		<main className="px-8 py-8 text-slate-500">Cargando clientes...</main>
	),
	errorComponent: ({ error }) => (
		<main className="px-8 py-8">
			<p className="m-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error instanceof Error
					? error.message
					: "Ocurrió un error al obtener los clientes"}
			</p>
		</main>
	),
});

type EstadoFiltro = "" | "activo" | "inactivo";

// Filters use the gray background from the design
const filterClass =
	"rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const fullName = (client: Client) =>
	[client.name, client.lastName].filter(Boolean).join(" ");

// The create form leaves blank optional fields out instead of storing ""
const toClientData = (data: ClientFormData): ClientData => ({
	phone: data.phone,
	...(data.name && { name: data.name }),
	...(data.lastName && { lastName: data.lastName }),
	...(data.aliasTiktok && { aliasTiktok: data.aliasTiktok }),
	active: data.active,
});

function RouteComponent() {
	const clients = Route.useLoaderData();
	const { q } = Route.useSearch();
	const navigate = Route.useNavigate();
	const router = useRouter();
	const [query, setQuery] = useState(q ?? "");
	const [estado, setEstado] = useState<EstadoFiltro>("");
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Client | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// Debounce typing before asking the backend to search
	useEffect(() => {
		const term = query.trim() || undefined;
		if (term === q) return;
		const timeout = setTimeout(
			() => navigate({ search: { q: term }, replace: true }),
			300,
		);
		return () => clearTimeout(timeout);
	}, [query, q, navigate]);

	// Mutations don't return the client, so reload the list after each one
	const crearCliente = async (data: ClientFormData) => {
		await createClient(toClientData(data));
		await router.invalidate();
		setCreating(false);
	};

	const editarCliente = async (data: ClientFormData) => {
		if (!editing) return;
		// PATCH only the fields that actually changed; "" clears an optional one
		const changes: Partial<ClientData> = {};
		if (data.phone !== editing.phone) changes.phone = data.phone;
		if (data.name !== (editing.name ?? "")) changes.name = data.name;
		if (data.lastName !== (editing.lastName ?? ""))
			changes.lastName = data.lastName;
		if (data.aliasTiktok !== (editing.aliasTiktok ?? ""))
			changes.aliasTiktok = data.aliasTiktok;
		if (data.active !== editing.active) changes.active = data.active;

		if (Object.keys(changes).length > 0) {
			await updateClient(editing.id, changes);
			await router.invalidate();
		}
		setEditing(null);
	};

	const eliminarCliente = async (client: Client) => {
		const label = fullName(client) || client.phone;
		if (!window.confirm(`¿Eliminar al cliente "${label}"?`)) return;
		setDeleteError(null);
		try {
			await deleteClient(client.id);
			await router.invalidate();
		} catch (err) {
			setDeleteError(
				err instanceof Error ? err.message : "Error al eliminar el cliente",
			);
		}
	};

	// Phone/name/alias search happens in the backend; the estado filter stays client-side
	const filtered = clients.filter(
		(c) => estado === "" || c.active === (estado === "activo"),
	);

	return (
		<main className="px-8 py-8">
			<div className="mb-7 flex items-center justify-between gap-4">
				<h1 className="m-0 text-3xl font-bold text-slate-900">
					Listado de Clientes
				</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
				>
					+ Nuevo Cliente
				</button>
			</div>

			<div className="mb-6 flex flex-col gap-3 sm:flex-row">
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar por teléfono, nombre o alias de TikTok..."
					className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
				/>
				<select
					aria-label="Filtrar por estado"
					value={estado}
					onChange={(e) => setEstado(e.target.value as EstadoFiltro)}
					className={`${filterClass} sm:w-48`}
				>
					<option value="">Estado (Todos)</option>
					<option value="activo">Activo</option>
					<option value="inactivo">Inactivo</option>
				</select>
			</div>

			{deleteError && (
				<p className="m-0 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{deleteError}
				</p>
			)}

			<div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
							<th className="px-4 py-3.5 font-semibold">Cliente</th>
							<th className="px-4 py-3.5 font-semibold">Alias TikTok</th>
							<th className="px-4 py-3.5 font-semibold">Teléfono</th>
							<th className="px-4 py-3.5 font-semibold">Estado</th>
							<th className="w-48 px-4 py-3.5 font-semibold">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((client) => (
							<tr
								key={client.id}
								className="border-t border-slate-200 first:border-t-0"
							>
								<td className="px-4 py-3.5 font-bold text-slate-900">
									{fullName(client) || (
										<span className="font-normal text-slate-500">
											Sin nombre
										</span>
									)}
								</td>
								<td className="px-4 py-3.5 text-slate-700">
									{client.aliasTiktok ? `@${client.aliasTiktok}` : "—"}
								</td>
								<td className="px-4 py-3.5 font-mono text-sm text-slate-700">
									{client.phone}
								</td>
								<td className="px-4 py-3.5">
									{client.active ? (
										<span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
											Activo
										</span>
									) : (
										<span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
											Inactivo
										</span>
									)}
								</td>
								<td className="px-4 py-3.5">
									<div className="flex items-center gap-5">
										<button
											type="button"
											onClick={() => setEditing(client)}
											className="cursor-pointer border-0 bg-transparent p-0 text-indigo-500 hover:text-indigo-700"
										>
											✏️ Editar
										</button>
										{client.active && (
											<button
												type="button"
												onClick={() => eliminarCliente(client)}
												className="cursor-pointer border-0 bg-transparent p-0 text-red-500 hover:text-red-700"
											>
												🗑️ Eliminar
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td
									colSpan={5}
									className="px-4 py-8 text-center text-slate-500"
								>
									No se encontraron clientes.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{creating && (
				<ClientFormModal
					title="Nuevo Cliente"
					submitLabel="Confirmar Registro"
					onClose={() => setCreating(false)}
					onConfirm={crearCliente}
				/>
			)}

			{editing && (
				<ClientFormModal
					key={editing.id}
					title="Editar Cliente"
					submitLabel="Guardar Cambios"
					initial={{
						phone: editing.phone,
						name: editing.name ?? "",
						lastName: editing.lastName ?? "",
						aliasTiktok: editing.aliasTiktok ?? "",
						active: editing.active,
					}}
					onClose={() => setEditing(null)}
					onConfirm={editarCliente}
				/>
			)}
		</main>
	);
}
