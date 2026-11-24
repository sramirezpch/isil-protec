import { useEffect } from "react";
import type { Sale } from "../lib/api";
import { formatDate, formatMoney } from "../lib/purchase";
import { formatClientName, SALE_STATUS_LABEL } from "../lib/sale";

type Props = {
	sale: Sale;
	onClose: () => void;
};

const thClass = "px-3 py-3 font-semibold";
const tdClass = "px-3 py-3 text-slate-700";

export default function SaleDetailModal({ sale, onClose }: Props) {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const resumen: [string, string][] = [
		["Cliente", formatClientName(sale.client)],
		["Estado", SALE_STATUS_LABEL[sale.status]],
		["Fecha de Venta", formatDate(sale.saleDate)],
		["Registrado", formatDate(sale.createdAt)],
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Cerrar"
				onClick={onClose}
				className="absolute inset-0 cursor-default border-0 bg-slate-900/50"
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="sale-detail-title"
				className="relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
			>
				<h2
					id="sale-detail-title"
					className="m-0 mb-5 text-lg font-bold text-slate-900"
				>
					Detalle de la Venta
				</h2>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
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
								<th className={thClass}>Cantidad</th>
								<th className={thClass}>Precio Unit.</th>
								<th className={thClass}>Subtotal</th>
							</tr>
						</thead>
						<tbody>
							{sale.items.map((item) => (
								<tr
									key={item.id}
									className="border-t border-slate-200 first:border-t-0"
								>
									<td className={tdClass}>{item.product?.sku ?? "—"}</td>
									<td className={`${tdClass} font-bold text-slate-900`}>
										{item.product?.name ?? "—"}
									</td>
									<td className={tdClass}>{item.quantity}</td>
									<td className={tdClass}>
										{formatMoney(Number(item.unitPrice))}
									</td>
									<td className={`${tdClass} font-bold text-slate-900`}>
										{formatMoney(Number(item.subtotal))}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="border-t border-slate-200 bg-slate-50">
								<td
									colSpan={4}
									className="px-3 py-3 text-right font-semibold text-slate-700"
								>
									Total Venta
								</td>
								<td className="px-3 py-3 font-bold text-slate-900">
									{formatMoney(Number(sale.totalAmount))}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>

				<div className="flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
					>
						Cerrar
					</button>
				</div>
			</div>
		</div>
	);
}
