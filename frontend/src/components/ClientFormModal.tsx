import { useEffect, useState } from "react";
import type { ClientData } from "../lib/api";

// Optional fields come back as "" when left blank
export type ClientFormData = Required<ClientData>;

type Props = {
	title: string;
	submitLabel: string;
	initial?: ClientFormData;
	onClose: () => void;
	onConfirm: (data: ClientFormData) => Promise<void>;
};

const labelClass = "mb-2 block text-sm font-semibold text-slate-900";

const fieldClass =
	"w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Selects use the gray background from the design
const selectClass =
	"w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// The phone column is varchar(20)
const PHONE_MAX = 20;

// Mount it only while open (with a `key` per item) so the fields start fresh
export default function ClientFormModal({
	title,
	submitLabel,
	initial,
	onClose,
	onConfirm,
}: Props) {
	const [telefono, setTelefono] = useState(initial?.phone ?? "");
	const [nombre, setNombre] = useState(initial?.name ?? "");
	const [apellido, setApellido] = useState(initial?.lastName ?? "");
	const [alias, setAlias] = useState(initial?.aliasTiktok ?? "");
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

	const telefonoTrimmed = telefono.trim();
	const valid = telefonoTrimmed !== "" && telefonoTrimmed.length <= PHONE_MAX;

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
				aria-labelledby="client-form-title"
				onSubmit={async (e) => {
					e.preventDefault();
					if (!valid || saving) return;
					setSaving(true);
					setError(null);
					try {
						await onConfirm({
							phone: telefonoTrimmed,
							name: nombre.trim(),
							lastName: apellido.trim(),
							// Users often type the "@" from TikTok; store just the handle
							aliasTiktok: alias.trim().replace(/^@+/, ""),
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
					id="client-form-title"
					className="m-0 mb-5 text-lg font-bold text-slate-900"
				>
					{title}
				</h2>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<h3 className="m-0 mb-4 text-base font-bold text-slate-900">
						Datos del Cliente
					</h3>

					<label htmlFor="client-telefono" className={labelClass}>
						Teléfono
					</label>
					<input
						id="client-telefono"
						// biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
						autoFocus
						type="tel"
						inputMode="tel"
						maxLength={PHONE_MAX}
						value={telefono}
						onChange={(e) => setTelefono(e.target.value)}
						placeholder="987654321"
						className={`mb-5 ${fieldClass}`}
					/>

					<div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<label htmlFor="client-nombre" className={labelClass}>
								Nombre{" "}
								<span className="font-normal text-slate-500">(opcional)</span>
							</label>
							<input
								id="client-nombre"
								value={nombre}
								onChange={(e) => setNombre(e.target.value)}
								placeholder="Nombre..."
								className={fieldClass}
							/>
						</div>
						<div>
							<label htmlFor="client-apellido" className={labelClass}>
								Apellido{" "}
								<span className="font-normal text-slate-500">(opcional)</span>
							</label>
							<input
								id="client-apellido"
								value={apellido}
								onChange={(e) => setApellido(e.target.value)}
								placeholder="Apellido..."
								className={fieldClass}
							/>
						</div>
					</div>

					<label htmlFor="client-alias" className={labelClass}>
						Alias de TikTok{" "}
						<span className="font-normal text-slate-500">(opcional)</span>
					</label>
					<div className="mb-5 flex items-center rounded-md border border-slate-200 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
						<span className="pl-3.5 text-sm text-slate-500">@</span>
						<input
							id="client-alias"
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder="usuario"
							className="w-full rounded-md border-0 bg-transparent py-2.5 pl-1 pr-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-500"
						/>
					</div>

					<label htmlFor="client-estado" className={labelClass}>
						Estado
					</label>
					<select
						id="client-estado"
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
