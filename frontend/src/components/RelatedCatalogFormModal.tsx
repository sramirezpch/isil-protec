import { useEffect, useState } from "react";

export type RelatedCatalogData = {
	name: string;
	// Id of the related entity (brand for lineas, formato for franquicias)
	relatedId: string;
	active: boolean;
};

export type RelatedOption = {
	id: string;
	name: string;
};

type Props = {
	title: string;
	submitLabel: string;
	// e.g. "Línea" → "Nombre de Línea"
	entityLabel: string;
	// e.g. "Marca", with placeholder "Seleccione una marca..."
	relatedLabel: string;
	relatedPlaceholder: string;
	options: RelatedOption[];
	initial?: RelatedCatalogData;
	onClose: () => void;
	onConfirm: (data: RelatedCatalogData) => Promise<void>;
};

const fieldClass =
	"w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Selects use the gray background from the design
const selectClass =
	"w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Mount it only while open (with a `key` per item) so the fields start fresh
export default function RelatedCatalogFormModal({
	title,
	submitLabel,
	entityLabel,
	relatedLabel,
	relatedPlaceholder,
	options,
	initial = { name: "", relatedId: "", active: true },
	onClose,
	onConfirm,
}: Props) {
	const [nombre, setNombre] = useState(initial.name);
	const [relatedId, setRelatedId] = useState(initial.relatedId);
	const [active, setActive] = useState(initial.active);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const trimmed = nombre.trim();
	const valid = trimmed !== "" && relatedId !== "";

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!valid || saving) return;
		setSaving(true);
		setError(null);
		try {
			await onConfirm({ name: trimmed, relatedId, active });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Ocurrió un error");
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Cerrar"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-0 bg-slate-900/50"
			/>
			<form
				role="dialog"
				aria-modal="true"
				aria-labelledby="related-form-title"
				onSubmit={onSubmit}
				className="relative w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
			>
				<h2
					id="related-form-title"
					className="m-0 mb-5 text-lg font-bold text-slate-900"
				>
					{title}
				</h2>

				<label
					htmlFor="related-nombre"
					className="mb-2 block text-sm font-semibold text-slate-900"
				>
					Nombre de {entityLabel}
				</label>
				<input
					id="related-nombre"
					// biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
					autoFocus
					value={nombre}
					onChange={(e) => setNombre(e.target.value)}
					placeholder="Nombre..."
					className={`mb-5 ${fieldClass}`}
				/>

				<label
					htmlFor="related-select"
					className="mb-2 block text-sm font-semibold text-slate-900"
				>
					{relatedLabel}
				</label>
				<select
					id="related-select"
					value={relatedId}
					onChange={(e) => setRelatedId(e.target.value)}
					className={`mb-5 ${selectClass} ${relatedId ? "text-slate-700" : "text-slate-500"}`}
				>
					<option value="" disabled>
						{relatedPlaceholder}
					</option>
					{options.map((o) => (
						<option key={o.id} value={o.id}>
							{o.name}
						</option>
					))}
				</select>

				<label
					htmlFor="related-estado"
					className="mb-2 block text-sm font-semibold text-slate-900"
				>
					Estado
				</label>
				<select
					id="related-estado"
					value={active ? "activo" : "inactivo"}
					onChange={(e) => setActive(e.target.value === "activo")}
					className={`mb-8 ${selectClass} text-slate-700`}
				>
					<option value="activo">Activo</option>
					<option value="inactivo">Inactivo</option>
				</select>

				{error && (
					<p className="m-0 mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
						{error}
					</p>
				)}

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={!valid || saving}
						className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? "Guardando..." : submitLabel}
					</button>
				</div>
			</form>
		</div>
	);
}
