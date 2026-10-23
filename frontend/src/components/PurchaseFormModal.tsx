import { useEffect, useRef, useState } from "react";
import type { Product, PurchaseData, Supplier } from "../lib/api";
import {
	CURRENCIES,
	dateInputToIso,
	formatMoney,
	isoToDateInput,
	landedUnitCosts,
} from "../lib/purchase";

export type PurchaseCatalogs = {
	suppliers: Supplier[];
	products: Product[];
};

type Props = {
	title: string;
	submitLabel: string;
	catalogs: PurchaseCatalogs;
	initial?: PurchaseData;
	onClose: () => void;
	onConfirm: (data: PurchaseData) => Promise<void>;
};

// Inputs are kept as strings so a field can be empty while typing
type ItemRow = {
	key: number;
	productId: string;
	quantity: string;
	cost: string;
};

const labelClass = "mb-2 block text-sm font-semibold text-slate-900";

const fieldClass =
	"w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

// Selects use the gray background from the design
const selectClass =
	"w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const isNonNegative = (value: string) => value !== "" && Number(value) >= 0;

// Decimal fields are text inputs so "3,75" works too: a number input would
// silently treat the comma as an empty value
const decimal = (value: string) => value.replace(",", ".");

// Mount it only while open (with a `key` per item) so the fields start fresh
export default function PurchaseFormModal({
	title,
	submitLabel,
	catalogs: { suppliers, products },
	initial,
	onClose,
	onConfirm,
}: Props) {
	const nextKey = useRef(0);
	const newRow = (item?: PurchaseData["items"][number]): ItemRow => ({
		key: nextKey.current++,
		productId: item?.productId ?? "",
		quantity: item ? String(item.quantityOrdered) : "",
		cost: item ? String(item.unitCostForeign) : "",
	});

	const [supplierId, setSupplierId] = useState(initial?.supplierId ?? "");
	const [currency, setCurrency] = useState(initial?.currency ?? "USD");
	const [exchangeRate, setExchangeRate] = useState(
		initial ? String(initial.exchangeRate) : "",
	);
	const [freight, setFreight] = useState(
		initial ? String(initial.internationalFreight) : "0",
	);
	const [duties, setDuties] = useState(
		initial ? String(initial.customsDuties) : "0",
	);
	const [arrivalDate, setArrivalDate] = useState(
		isoToDateInput(initial?.arrivalDate ?? null),
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

	// Inactive entries stay selectable only if they're the current value
	const supplierOptions = suppliers.filter(
		(s) => s.active || s.id === supplierId,
	);
	const currencyOptions = CURRENCIES.includes(currency)
		? CURRENCIES
		: [currency, ...CURRENCIES];
	// A figura can appear only once per purchase
	const productOptions = (row: ItemRow) =>
		products.filter(
			(p) =>
				(p.active || p.id === row.productId) &&
				!rows.some((r) => r.key !== row.key && r.productId === p.id),
		);

	const rateNum = Number(exchangeRate);
	const freightNum = Number(freight);
	const dutiesNum = Number(duties);
	const rowsValid = rows.every(
		(r) =>
			r.productId !== "" &&
			Number.isInteger(Number(r.quantity)) &&
			Number(r.quantity) >= 1 &&
			isNonNegative(r.cost),
	);
	const valid =
		supplierId !== "" &&
		exchangeRate !== "" &&
		rateNum > 0 &&
		isNonNegative(freight) &&
		isNonNegative(duties) &&
		rows.length > 0 &&
		rowsValid;

	// Live preview of what the backend will compute
	const costInputs = rows.map((r) => ({
		quantity: Number(r.quantity) || 0,
		unitCostForeign: Number(r.cost) || 0,
	}));
	const rate = rateNum > 0 ? rateNum : 0;
	const landed = landedUnitCosts(
		costInputs,
		rate,
		freightNum || 0,
		dutiesNum || 0,
	);
	const subtotalForeign = costInputs.reduce(
		(sum, i) => sum + i.unitCostForeign * i.quantity,
		0,
	);
	const subtotalPen = subtotalForeign * rate;
	const totalLanded = landed.reduce(
		(sum, unit, idx) => sum + unit * costInputs[idx].quantity,
		0,
	);
	const missingRate = (
		<span className="text-xs font-normal text-amber-700">Falta T.C.</span>
	);

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
				aria-labelledby="purchase-form-title"
				onSubmit={async (e) => {
					e.preventDefault();
					if (!valid || saving) return;
					setSaving(true);
					setError(null);
					try {
						await onConfirm({
							supplierId,
							arrivalDate: dateInputToIso(arrivalDate),
							currency,
							exchangeRate: rateNum,
							internationalFreight: freightNum,
							customsDuties: dutiesNum,
							items: rows.map((r) => ({
								productId: r.productId,
								quantityOrdered: Number(r.quantity),
								unitCostForeign: Number(r.cost),
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
					id="purchase-form-title"
					className="m-0 mb-5 text-lg font-bold text-slate-900"
				>
					{title}
				</h2>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<h3 className="m-0 mb-4 text-base font-bold text-slate-900">
						Datos de la Compra
					</h3>

					<label htmlFor="purchase-supplier" className={labelClass}>
						Proveedor
					</label>
					<select
						id="purchase-supplier"
						// biome-ignore lint/a11y/noAutofocus: focus the first field when the modal opens
						autoFocus
						value={supplierId}
						onChange={(e) => setSupplierId(e.target.value)}
						className={`mb-5 ${selectClass} ${supplierId ? "text-slate-700" : "text-slate-500"}`}
					>
						<option value="" disabled>
							Seleccione un proveedor...
						</option>
						{supplierOptions.map((s) => (
							<option key={s.id} value={s.id}>
								{s.companyName}
							</option>
						))}
					</select>

					<div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<label htmlFor="purchase-currency" className={labelClass}>
								Moneda del Proveedor
							</label>
							<select
								id="purchase-currency"
								value={currency}
								onChange={(e) => setCurrency(e.target.value)}
								className={`${selectClass} text-slate-700`}
							>
								{currencyOptions.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="purchase-rate" className={labelClass}>
								Tipo de Cambio (S/ por 1 {currency})
							</label>
							<input
								id="purchase-rate"
								type="text"
								inputMode="decimal"
								value={exchangeRate}
								onChange={(e) => setExchangeRate(decimal(e.target.value))}
								placeholder="3.7500"
								className={fieldClass}
							/>
							{rate <= 0 && (
								<p className="m-0 mt-1.5 text-xs text-slate-500">
									Necesario para calcular el costo puesto.
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div>
							<label htmlFor="purchase-freight" className={labelClass}>
								Flete Internacional (S/)
							</label>
							<input
								id="purchase-freight"
								type="text"
								inputMode="decimal"
								value={freight}
								onChange={(e) => setFreight(decimal(e.target.value))}
								placeholder="0.00"
								className={fieldClass}
							/>
						</div>
						<div>
							<label htmlFor="purchase-duties" className={labelClass}>
								Aranceles (S/)
							</label>
							<input
								id="purchase-duties"
								type="text"
								inputMode="decimal"
								value={duties}
								onChange={(e) => setDuties(decimal(e.target.value))}
								placeholder="0.00"
								className={fieldClass}
							/>
						</div>
						<div>
							<label htmlFor="purchase-arrival" className={labelClass}>
								Llegada Estimada
							</label>
							<input
								id="purchase-arrival"
								type="date"
								value={arrivalDate}
								onChange={(e) => setArrivalDate(e.target.value)}
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
						<span>Costo Unit. ({currency})</span>
						<span>Costo Puesto (S/)</span>
						<span />
					</div>

					<div className="flex flex-col gap-3">
						{rows.map((row, idx) => (
							<div
								key={row.key}
								className="grid grid-cols-2 items-center gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_6rem_8rem_8rem_2rem] sm:border-b-0 sm:pb-0"
							>
								<select
									aria-label={`Figura ${idx + 1}`}
									value={row.productId}
									onChange={(e) =>
										updateRow(row.key, { productId: e.target.value })
									}
									className={`col-span-2 sm:col-span-1 ${selectClass} ${row.productId ? "text-slate-700" : "text-slate-500"}`}
								>
									<option value="" disabled>
										Seleccione una figura...
									</option>
									{productOptions(row).map((p) => (
										<option key={p.id} value={p.id}>
											{p.sku} · {p.name}
										</option>
									))}
								</select>
								<input
									aria-label={`Cantidad de la figura ${idx + 1}`}
									type="number"
									inputMode="numeric"
									min="1"
									step="1"
									value={row.quantity}
									onChange={(e) =>
										updateRow(row.key, { quantity: e.target.value })
									}
									placeholder="0"
									className={fieldClass}
								/>
								<input
									aria-label={`Costo unitario de la figura ${idx + 1}`}
									type="text"
									inputMode="decimal"
									value={row.cost}
									onChange={(e) =>
										updateRow(row.key, { cost: decimal(e.target.value) })
									}
									placeholder="0.00"
									className={fieldClass}
								/>
								{/* Say what's missing instead of a bare dash */}
								{rate <= 0 ? (
									<span className="text-xs text-amber-700">Falta T.C.</span>
								) : costInputs[idx].quantity <= 0 ? (
									<span className="text-xs text-amber-700">Falta cantidad</span>
								) : (
									<span className="text-sm font-semibold text-slate-900">
										{formatMoney(landed[idx])}
									</span>
								)}
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
						))}
					</div>

					<dl className="m-0 mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-slate-200 pt-4 text-sm">
						<dt className="text-slate-500">Subtotal ({currency})</dt>
						<dd className="m-0 text-right text-slate-900">
							{formatMoney(subtotalForeign, currency)}
						</dd>
						<dt className="text-slate-500">Tipo de Cambio</dt>
						<dd className="m-0 text-right text-slate-900">
							{rate > 0
								? `S/ ${rate.toFixed(4)} por 1 ${currency}`
								: missingRate}
						</dd>
						<dt className="text-slate-500">Subtotal (S/)</dt>
						<dd className="m-0 text-right text-slate-900">
							{rate > 0 ? formatMoney(subtotalPen) : missingRate}
						</dd>
						<dt className="text-slate-500">Flete + Aranceles</dt>
						<dd className="m-0 text-right text-slate-900">
							{formatMoney((freightNum || 0) + (dutiesNum || 0))}
						</dd>
						<dt className="font-bold text-slate-900">Total Puesto (S/)</dt>
						<dd className="m-0 text-right font-bold text-slate-900">
							{rate > 0 ? formatMoney(totalLanded) : missingRate}
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
