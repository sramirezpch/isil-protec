import { useEffect, useState } from "react";
import type { Franquicia, Linea } from "../lib/api";

export type FiguraFormData = {
	sku: string;
	name: string;
	price: number;
	stock: number;
	// Formato and marca aren't asked: they derive from the franquicia and the línea
	franchiseId: string;
	lineaId: string;
	active: boolean;
};

export type FiguraCatalogs = {
	franquicias: Franquicia[];
	lineas: Linea[];
};

type Props = {
	title: string;
	submitLabel: string;
	// Suggested SKU when creating; when editing it comes from `initial`
	suggestedSku?: string;
	catalogs: FiguraCatalogs;
	initial?: FiguraFormData;
	onClose: () => void;
	onConfirm: (data: FiguraFormData) => Promise<void>;
};

const labelClass = "mb-2 block text-sm font-semibold text-slate-900";

const fieldClass =
	"w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Selects use the gray background from the design
const selectClass =
	"w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Mount it only while open (with a `key` per item) so the fields start fresh
export default function FiguraFormModal({
	title,
	submitLabel,
	suggestedSku = "",
	catalogs: { franquicias, lineas },
	initial,
	onClose,
	onConfirm,
}: Props) {
	const editingSku = initial !== undefined;
	const [sku, setSku] = useState(initial?.sku ?? suggestedSku);
	const [nombre, setNombre] = useState(initial?.name ?? "");
	const [precio, setPrecio] = useState(initial ? String(initial.price) : "");
	const [stock, setStock] = useState(initial ? String(initial.stock) : "");
	const [franquiciaId, setFranquiciaId] = useState(initial?.franchiseId ?? "");
	const [lineaId, setLineaId] = useState(initial?.lineaId ?? "");
	const [active, setActive] = useState(initial?.active ?? true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	// Inactive entries stay selectable only if they're the current value
	const franquiciaOptions = franquicias.filter(
		(f) => f.active || f.id === franquiciaId,
	);
	const lineaOptions = lineas.filter((l) => l.active || l.id === lineaId);

	const trimmed = nombre.trim();
	const skuTrimmed = sku.trim();
	const precioNum = Number(precio);
	const stockNum = Number(stock);
	const valid =
		skuTrimmed !== "" &&
		trimmed !== "" &&
		precio !== "" &&
		precioNum >= 0 &&
		stock !== "" &&
		Number.isInteger(stockNum) &&
		stockNum >= 0 &&
		franquiciaId !== "" &&
		lineaId !== "";

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
				aria-labelledby="figura-form-title"
				onSubmit={async (e) => {
					e.preventDefault();
					if (!valid || saving) return;
					setSaving(true);
					setError(null);
					try {
						await onConfirm({
							sku: skuTrimmed,
							name: trimmed,
							price: precioNum,
							stock: stockNum,
							franchiseId: franquiciaId,
							lineaId,
							active,
						});
					} catch (err) {
						setError(err instanceof Error ? err.message : "Ocurrió un error");
						setSaving(false);
					}
				}}
				className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
			>
				<h2
					id="figura-form-title"
					className="m-0 mb-5 text-lg font-bold text-slate-900"
				>
					{title}
				</h2>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<h3 className="m-0 mb-4 text-base font-bold text-slate-900">
						Datos Principales
					</h3>

					<label htmlFor="figura-sku" className={labelClass}>
						SKU (Código Único)
					</label>
					{/* Suggested when creating, fixed once the figura exists */}
					<input
						id="figura-sku"
						value={sku}
						onChange={(e) => setSku(e.target.value)}
						readOnly={editingSku}
						placeholder="SKU-1001"
						className={`mb-5 w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none ${editingSku ? "text-slate-500" : "text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"}`}
					/>

					<label htmlFor="figura-nombre" className={labelClass}>
						Nombre de la Figura
					</label>
					<input
						id="figura-nombre"
						// biome-ignore lint/a11y/noAutofocus: focus the first editable field when the modal opens
						autoFocus
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
						placeholder="Nombre..."
						className={`mb-5 ${fieldClass}`}
					/>

					<div className="mb-5 grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="figura-precio" className={labelClass}>
								Precio de Venta (S/)
							</label>
							<input
								id="figura-precio"
								type="number"
								inputMode="decimal"
								min="0"
								step="0.01"
								value={precio}
								onChange={(e) => setPrecio(e.target.value)}
								placeholder="0.00"
								className={fieldClass}
							/>
						</div>
						<div>
							<label htmlFor="figura-stock" className={labelClass}>
								Stock Inicial
							</label>
							<input
								id="figura-stock"
								type="number"
								inputMode="numeric"
								min="0"
								step="1"
								value={stock}
								onChange={(e) => setStock(e.target.value)}
								placeholder="0"
								className={fieldClass}
							/>
						</div>
					</div>

					<label htmlFor="figura-franquicia" className={labelClass}>
						Franquicia
					</label>
					<select
						id="figura-franquicia"
						value={franquiciaId}
						onChange={(e) => setFranquiciaId(e.target.value)}
						className={`mb-5 ${selectClass} ${franquiciaId ? "text-slate-700" : "text-slate-500"}`}
					>
						<option value="" disabled>
							Seleccione una franquicia...
						</option>
						{franquiciaOptions.map((f) => (
							<option key={f.id} value={f.id}>
								{f.name}
							</option>
						))}
					</select>

					<label htmlFor="figura-linea" className={labelClass}>
						Línea
					</label>
					<select
						id="figura-linea"
						value={lineaId}
						onChange={(e) => setLineaId(e.target.value)}
						className={`${selectClass} ${lineaId ? "text-slate-700" : "text-slate-500"}`}
					>
						<option value="" disabled>
							Seleccione una línea...
						</option>
						{lineaOptions.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name}
							</option>
						))}
					</select>

					<label htmlFor="figura-estado" className={`mt-5 ${labelClass}`}>
						Estado
					</label>
					<select
						id="figura-estado"
						value={active ? "activo" : "inactivo"}
						onChange={(e) => setActive(e.target.value === "activo")}
						className={`${selectClass} text-slate-700`}
					>
						<option value="activo">Activo</option>
						<option value="inactivo">Inactivo</option>
					</select>
				</section>

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
