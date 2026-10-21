import { useEffect, useState } from "react";
import type { SupplierData } from "../lib/api";

type Props = {
	title: string;
	submitLabel: string;
	initial?: SupplierData;
	onClose: () => void;
	onConfirm: (data: SupplierData) => Promise<void>;
};

const defaultInitial: SupplierData = {
	companyName: "",
	country: "PE",
	taxId: "",
	address: "",
	contactName: "",
	email: "",
	phone: "",
	active: true,
};

export default function SupplierFormModal({
	title,
	submitLabel,
	initial = defaultInitial,
	onClose,
	onConfirm,
}: Props) {
	const [formData, setFormData] = useState<SupplierData>(initial);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.companyName.trim() || !formData.taxId.trim() || saving)
			return;
		setSaving(true);
		setError(null);
		try {
			await onConfirm({
				...formData,
				companyName: formData.companyName.trim(),
				taxId: formData.taxId.trim(),
				country: formData.country.trim().toUpperCase(),
			});
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
				onSubmit={onSubmit}
				className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
			>
				<h2 className="m-0 mb-5 text-lg font-bold text-slate-900">{title}</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label
							htmlFor="companyName"
							className="mb-1 block text-sm font-semibold text-slate-900"
						>
							Razón Social / Empresa
						</label>
						<input
							id="companyName"
							name="companyName"
							// biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
							autoFocus
							value={formData.companyName}
							onChange={handleChange}
							placeholder="Nombre de la empresa..."
							className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
						/>
					</div>

					<div>
						<label
							htmlFor="country"
							className="mb-1 block text-sm font-semibold text-slate-900"
						>
							País
						</label>
						<input
							id="country"
							name="country"
							value={formData.country}
							onChange={handleChange}
							placeholder="PE, US, JP..."
							className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
						/>
					</div>

					<div>
						<label
							htmlFor="taxId"
							className="mb-1 block text-sm font-semibold text-slate-900"
						>
							Tax ID / RUC
						</label>
						<input
							id="taxId"
							name="taxId"
							value={formData.taxId}
							onChange={handleChange}
							placeholder="Número de identificación fiscal..."
							className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
						/>
					</div>

					<div>
						<label
							htmlFor="contactName"
							className="mb-1 block text-sm font-semibold text-slate-900"
						>
							Persona de Contacto
						</label>
						<input
							id="contactName"
							name="contactName"
							value={formData.contactName}
							onChange={handleChange}
							placeholder="Nombre del contacto..."
							className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
						/>
					</div>

					<div>
						<label
							htmlFor="email"
							className="mb-1 block text-sm font-semibold text-slate-900"
						>
							Correo Electrónico
						</label>
						<input
							id="email"
							type="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							placeholder="contacto@empresa.com"
							className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
						/>
					</div>

					<div>
						<label
							htmlFor="phone"
							className="mb-1 block text-sm font-semibold text-slate-900"
						>
							Teléfono
						</label>
						<input
							id="phone"
							name="phone"
							value={formData.phone}
							onChange={handleChange}
							placeholder="+51 987654321"
							className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
						/>
					</div>
				</div>

				<div className="mb-4">
					<label
						htmlFor="address"
						className="mb-1 block text-sm font-semibold text-slate-900"
					>
						Dirección
					</label>
					<input
						id="address"
						name="address"
						value={formData.address}
						onChange={handleChange}
						placeholder="Dirección fiscal..."
						className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
					/>
				</div>

				<div className="mb-6">
					<label
						htmlFor="active"
						className="mb-1 block text-sm font-semibold text-slate-900"
					>
						Estado
					</label>
					<select
						id="active"
						value={formData.active ? "activo" : "inactivo"}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								active: e.target.value === "activo",
							}))
						}
						className="w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
					>
						<option value="activo">Activo</option>
						<option value="inactivo">Inactivo</option>
					</select>
				</div>

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
						disabled={
							!formData.companyName.trim() || !formData.taxId.trim() || saving
						}
						className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? "Guardando..." : submitLabel}
					</button>
				</div>
			</form>
		</div>
	);
}
