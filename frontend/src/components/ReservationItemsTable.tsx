import type { ReservationItem } from "../lib/api";

type Props = {
	items: ReservationItem[];
};

const stockLabel = (item: ReservationItem): string => {
	if (item.cantidadBloqueada === item.quantity) return "Stock bloqueado";
	if (item.cantidadBloqueada === 0) return "Pendiente (preventa)";
	return `Stock bloqueado: ${item.cantidadBloqueada}; pendiente (preventa): ${item.quantity - item.cantidadBloqueada}`;
};

const discountLabel = (item: ReservationItem): string => {
	if (!item.discountType || item.discountValue === null) return "—";
	return item.discountType === "PORCENTAJE"
		? `${item.discountValue}%`
		: `S/ ${item.discountValue}`;
};

export default function ReservationItemsTable({ items }: Props) {
	return (
		<div className="overflow-x-auto rounded-md border border-slate-200">
			<table className="w-full border-collapse text-left text-sm">
				<thead className="bg-slate-50 text-slate-600">
					<tr>
						<th className="px-3 py-2 font-semibold">Figura</th>
						<th className="px-3 py-2 font-semibold">SKU</th>
						<th className="px-3 py-2 text-right font-semibold">Cantidad</th>
						<th className="px-3 py-2 text-right font-semibold">
							Precio unitario
						</th>
						<th className="px-3 py-2 text-right font-semibold">Descuento</th>
						<th className="px-3 py-2 text-right font-semibold">
							Total de línea
						</th>
						<th className="px-3 py-2 font-semibold">Disponibilidad</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<tr key={item.id} className="border-t border-slate-200">
							<td className="px-3 py-2 font-medium text-slate-900">
								{item.product?.name ?? item.productId}
							</td>
							<td className="px-3 py-2 text-slate-700">
								{item.product?.sku ?? "—"}
							</td>
							<td className="px-3 py-2 text-right text-slate-700">
								{item.quantity}
							</td>
							<td className="px-3 py-2 text-right text-slate-700">
								S/ {item.unitPrice}
							</td>
							<td className="px-3 py-2 text-right text-slate-700">
								{discountLabel(item)}
							</td>
							<td className="px-3 py-2 text-right font-medium text-slate-900">
								S/ {item.lineTotal}
							</td>
							<td className="px-3 py-2 text-slate-700">{stockLabel(item)}</td>
						</tr>
					))}
					{items.length === 0 && (
						<tr>
							<td className="px-3 py-5 text-center text-slate-500" colSpan={7}>
								La reserva no tiene figuras registradas.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
