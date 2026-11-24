import { useEffect, useRef, useState } from "react";
import type { Client, Product, SaleData } from "../lib/api";
import {
	dateInputToIso,
	formatMoney,
	isoToDateInput,
	todayDateInput,
} from "../lib/purchase";
import { formatClientName } from "../lib/sale";

export type SaleCatalogs = {
	clients: Client[];
	products: Product[];
};

type Props = {
	title: string;
	submitLabel: string;
	catalogs: SaleCatalogs;
	initial?: SaleData;
	onClose: () => void;
	onConfirm: (data: SaleData) => Promise<void>;
};

type ItemRow = {
	key: number;
	productId: string;
	quantity: string;
	unitPrice: string;
};

const labelClass = "mb-2 block text-sm font-semibold text-slate-900";

const fieldClass =
	"w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const selectClass =
	"w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const decimal = (value: string) => value.replace(",", ".");

export default function SaleFormModal({
	title,
	submitLabel,
	catalogs: { clients, products },
	initial,
	onClose,
	onConfirm,
}: Props) {
	const nextKey = useRef(0);
	const newRow = (item?: SaleData["items"][number]): ItemRow => ({
		key: nextKey.current++,
		productId: item?.productId ?? "",
		quantity: item ? String(item.quantity) : "1",
		unitPrice: item ? String(item.unitPrice) : "",
	});

	const [clientId, setClientId] = useState(initial?.clientId ?? "");
	const [saleDate, setSaleDate] = useState(
		initial?.saleDate ? isoToDateInput(initial.saleDate) : todayDateInput(),
	);
	const [rows, setRows] = useState<ItemRow[]>(() =>
		initial ? initial.items.map(newRow) : [newRow()],
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const updateRow = (key: number, changes: Partial<ItemRow>) =>
		setRows((current) =>
			current.map((r) => (r.key === key ? { ...r, ...changes } : r)),
		);

	const clientOptions = clients.filter((c) => c.active || c.id === clientId);

	const productOptions = (row: ItemRow) =>
		products.filter(
			(p) =>
				(p.active || p.id === row.productId) &&
				!rows.some((r) => r.key !== row.key && r.productId === p.id),
		);

	const getProduct = (productId: string) =>
		products.find((p) => p.id === productId);

	const rowsValid = rows.every((r) => {
		const product = getProduct(r.productId);
		const qty = Number(r.quantity);
		const price = Number(r.unitPrice);
		const hasStock = product ? qty <= product.stock : true;
		return (
			r.productId !== "" &&
			Number.isInteger(qty) &&
			qty >= 1 &&
			hasStock &&
			r.unitPrice !== "" &&
			price > 0
		);
	});

	const valid = clientId !== "" && rows.length > 0 && rowsValid;

	const totalAmount = rows.reduce((sum, r) => {
		const qty = Number(r.quantity) || 0;
		const price = Number(r.unitPrice) || 0;
		return sum + qty * price;
	}, 0);

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
				aria-labelledby="sale-form-title"
				onSubmit={async (e) => {
					e.preventDefault();
					if (!valid || saving) return;
					setSaving(true);
					setError(null);
					try {
						await onConfirm({
							clientId,
							saleDate: dateInputToIso(saleDate),
							items: rows.map((r) => ({
								productId: r.productId,
								quantity: Number(r.quantity),
								unitPrice: Number(r.unitPrice),
							})),
						});
					} catch (err) {
						setError(err instanceof Error ? err.message : "Ocurrió un error");
						setSaving(false);
					}
				}}
				className="relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
			>
				<h2
					id="sale-form-title"
					className="m-0 mb-5 text-lg font-bold text-slate-900"
				>
					{title}
				</h2>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<h3 className="m-0 mb-4 text-base font-bold text-slate-900">
						Datos de la Venta
					</h3>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_13rem]">
						<div>
							<label htmlFor="sale-client" className={labelClass}>
								Cliente
							</label>
							<select
								id="sale-client"
								// biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
								autoFocus
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								className={`${selectClass} ${clientId ? "text-slate-700" : "text-slate-500"}`}
							>
								<option value="" disabled>
									Seleccione un cliente...
								</option>
								{clientOptions.map((c) => (
									<option key={c.id} value={c.id}>
										{formatClientName(c)}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="sale-date" className={labelClass}>
								Fecha de Venta
							</label>
							<input
								id="sale-date"
								type="date"
								value={saleDate}
								onChange={(e) => setSaleDate(e.target.value)}
								className={fieldClass}
							/>
						</div>
					</div>
				</section>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<div className="mb-4 flex items-center justify-between gap-4">
						<h3 className="m-0 text-base font-bold text-slate-900">Figuras</h3>
						<button
							type="button"
							onClick={() => setRows((current) => [...current, newRow()])}
							className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
						>
							+ Agregar Figura
						</button>
					</div>

					<div className="mb-2 hidden grid-cols-[1fr_6rem_8rem_8rem_2rem] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
						<span>Figura</span>
						<span>Cantidad</span>
						<span>Precio Unit. (S/)</span>
						<span>Subtotal (S/)</span>
						<span />
					</div>

					<div className="flex flex-col gap-3">
						{rows.map((row, idx) => {
							const product = getProduct(row.productId);
							const qty = Number(row.quantity) || 0;
							const price = Number(row.unitPrice) || 0;
							const exceedsStock = product ? qty > product.stock : false;

							return (
								<div
									key={row.key}
									className="grid grid-cols-2 items-center gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_6rem_8rem_8rem_2rem] sm:border-b-0 sm:pb-0"
								>
									<select
										aria-label={`Figura ${idx + 1}`}
										value={row.productId}
										onChange={(e) => {
											const selected = getProduct(e.target.value);
											updateRow(row.key, {
												productId: e.target.value,
												unitPrice: selected
													? String(Number(selected.price))
													: row.unitPrice,
											});
										}}
										className={`col-span-2 sm:col-span-1 ${selectClass} ${row.productId ? "text-slate-700" : "text-slate-500"}`}
									>
										<option value="" disabled>
											Seleccione una figura...
										</option>
										{productOptions(row).map((p) => (
											<option key={p.id} value={p.id}>
												{p.sku} · {p.name} (Stock: {p.stock})
											</option>
										))}
									</select>

									<div>
										<input
											aria-label={`Cantidad de la figura ${idx + 1}`}
											type="number"
											inputMode="numeric"
											min="1"
											max={product?.stock}
											step="1"
											value={row.quantity}
											onChange={(e) =>
												updateRow(row.key, { quantity: e.target.value })
											}
											placeholder="1"
											className={`${fieldClass} ${exceedsStock ? "border-red-400 focus:border-red-500" : ""}`}
										/>
										{exceedsStock && product && (
											<span className="mt-1 block text-[11px] font-medium text-red-600">
												Máx: {product.stock}
											</span>
										)}
									</div>

									<input
										aria-label={`Precio unitario de la figura ${idx + 1}`}
										type="text"
										inputMode="decimal"
										value={row.unitPrice}
										onChange={(e) =>
											updateRow(row.key, { unitPrice: decimal(e.target.value) })
										}
										placeholder="0.00"
										className={fieldClass}
									/>

									<span className="text-sm font-semibold text-slate-900">
										{formatMoney(qty * price)}
									</span>

									<button
										type="button"
										aria-label={`Quitar la figura ${idx + 1}`}
										onClick={() =>
											setRows((current) =>
												current.filter((r) => r.key !== row.key),
											)
										}
										disabled={rows.length === 1}
										className="cursor-pointer justify-self-end border-0 bg-transparent p-0 text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
									>
										🗑️
									</button>
								</div>
							);
						})}
					</div>

					<dl className="m-0 mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-slate-200 pt-4 text-sm">
						<dt className="font-bold text-slate-900">Total Venta (S/)</dt>
						<dd className="m-0 text-right font-bold text-slate-900">
							{formatMoney(totalAmount)}
						</dd>
					</dl>
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
