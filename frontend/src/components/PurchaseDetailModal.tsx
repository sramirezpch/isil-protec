import { useEffect, useState } from "react";
import type { Purchase, ReceivePurchaseData } from "../lib/api";
import {
	dateInputToIso,
	formatDate,
	formatMoney,
	landedTotalOf,
	STATUS_LABEL,
	todayDateInput,
} from "../lib/purchase";

type Props = {
	purchase: Purchase;
	onClose: () => void;
	// When given, the modal lets the user confirm the quantities that arrived
	onReceive?: (data: ReceivePurchaseData) => Promise<void>;
};

const fieldClass =
	"w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const thClass = "px-3 py-3 font-semibold";
const tdClass = "px-3 py-3 text-slate-700";

// Mount it only while open (with a `key` per purchase) so the fields start fresh
export default function PurchaseDetailModal({
	purchase,
	onClose,
	onReceive,
}: Props) {
	const receiving = onReceive !== undefined;
	// Quantities default to what was ordered; adjust them if something's missing
	const [received, setReceived] = useState<Record<string, string>>(() =>
		Object.fromEntries(
			purchase.items.map((i) => [i.productId, String(i.quantityOrdered)]),
		),
	);
	const [arrivalDate, setArrivalDate] = useState(todayDateInput());
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const valid = purchase.items.every((i) => {
		const value = received[i.productId];
		return (
			value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0
		);
	});

	const resumen: [string, string][] = [
		["Proveedor", purchase.supplier?.companyName ?? "—"],
		["Estado", STATUS_LABEL[purchase.status]],
		["Registrado", formatDate(purchase.createdAt)],
		["Llegada", formatDate(purchase.arrivalDate)],
		[
			"Moneda / T.C.",
			`${purchase.currency} · ${Number(purchase.exchangeRate).toFixed(4)}`,
		],
		[
			"Flete + Aranceles",
			formatMoney(
				Number(purchase.internationalFreight) + Number(purchase.customsDuties),
			),
		],
	];

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
				aria-labelledby="purchase-detail-title"
				onSubmit={async (e) => {
					e.preventDefault();
					if (!onReceive || !valid || saving) return;
					setSaving(true);
					setError(null);
					try {
						await onReceive({
							arrivalDate: dateInputToIso(arrivalDate),
							items: purchase.items.map((i) => ({
								productId: i.productId,
								quantityReceived: Number(received[i.productId]),
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
					id="purchase-detail-title"
					className="m-0 mb-5 text-lg font-bold text-slate-900"
				>
					{receiving ? "Recibir Compra" : "Detalle de la Compra"}
				</h2>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
						{resumen.map(([label, value]) => (
							<div key={label}>
								<dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
									{label}
								</dt>
								<dd className="m-0 mt-0.5 text-slate-900">{value}</dd>
							</div>
						))}
					</dl>
				</section>

				<div className="mb-6 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
					<table className="w-full border-collapse text-left text-sm">
						<thead>
							<tr className="bg-[#111827] text-xs font-semibold uppercase tracking-wide text-white">
								<th className={thClass}>SKU</th>
								<th className={thClass}>Figura</th>
								<th className={thClass}>Pedido</th>
								<th className={`${thClass} ${receiving ? "w-28" : ""}`}>
									Recibido
								</th>
								<th className={thClass}>Costo Unit.</th>
								<th className={thClass}>Costo Puesto</th>
							</tr>
						</thead>
						<tbody>
							{purchase.items.map((item) => (
								<tr
									key={item.id}
									className="border-t border-slate-200 first:border-t-0"
								>
									<td className={tdClass}>{item.product?.sku ?? "—"}</td>
									<td className={`${tdClass} font-bold text-slate-900`}>
										{item.product?.name ?? "—"}
									</td>
									<td className={tdClass}>{item.quantityOrdered}</td>
									<td className={tdClass}>
										{receiving ? (
											<input
												aria-label={`Cantidad recibida de ${item.product?.name ?? "la figura"}`}
												type="number"
												inputMode="numeric"
												min="0"
												step="1"
												value={received[item.productId]}
												onChange={(e) =>
													setReceived((current) => ({
														...current,
														[item.productId]: e.target.value,
													}))
												}
												className={`${fieldClass} px-2.5 py-1.5`}
											/>
										) : (
											(item.quantityReceived ?? "—")
										)}
									</td>
									<td className={tdClass}>
										{formatMoney(
											Number(item.unitCostForeign),
											purchase.currency,
										)}
									</td>
									<td className={`${tdClass} font-bold text-slate-900`}>
										{formatMoney(Number(item.unitLandedCost))}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="border-t border-slate-200 bg-slate-50">
								<td
									colSpan={5}
									className="px-3 py-3 text-right font-semibold text-slate-700"
								>
									Total Puesto
								</td>
								<td className="px-3 py-3 font-bold text-slate-900">
									{formatMoney(landedTotalOf(purchase))}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>

				{receiving && (
					<div className="mb-6 max-w-xs">
						<label
							htmlFor="purchase-received-date"
							className="mb-2 block text-sm font-semibold text-slate-900"
						>
							Fecha de Llegada
						</label>
						<input
							id="purchase-received-date"
							type="date"
							value={arrivalDate}
							onChange={(e) => setArrivalDate(e.target.value)}
							className={fieldClass}
						/>
						<p className="m-0 mt-2 text-xs text-slate-500">
							Las cantidades recibidas se suman al stock de cada figura.
						</p>
					</div>
				)}

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
						{receiving ? "Cancelar" : "Cerrar"}
					</button>
					{receiving && (
						<button
							type="submit"
							disabled={!valid || saving}
							className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{saving ? "Guardando..." : "Confirmar Recepción"}
						</button>
					)}
				</div>
			</form>
		</div>
	);
}
