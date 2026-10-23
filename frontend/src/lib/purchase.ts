import type { Purchase, PurchaseStatus } from "./api";

export const STATUS_LABEL: Record<PurchaseStatus, string> = {
	PENDING: "Pendiente",
	RECEIVED: "Recibido",
	CANCELLED: "Cancelado",
};

// Currencies offered in the form; the backend accepts any ISO 4217 code
export const CURRENCIES = ["USD", "JPY", "CNY", "EUR", "KRW", "PEN"];

export const formatMoney = (amount: number, currency = "PEN") =>
	new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
		amount,
	);

export const formatDate = (iso: string | null) =>
	iso ? new Date(iso).toLocaleDateString("es-PE") : "—";

// <input type="date"> works with local "YYYY-MM-DD"; sending the bare date
// would be read as UTC midnight and show up as the day before in Lima
export const dateInputToIso = (value: string) =>
	value ? new Date(`${value}T00:00:00`).toISOString() : null;

export const isoToDateInput = (iso: string | null) => {
	if (!iso) return "";
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const todayDateInput = () => isoToDateInput(new Date().toISOString());

type CostInput = { quantity: number; unitCostForeign: number };

// Same split as the backend's calculateItemCosts: freight and duties (in PEN)
// are spread by each item's share of the PEN subtotal
export const landedUnitCosts = (
	items: CostInput[],
	exchangeRate: number,
	freight: number,
	duties: number,
) => {
	const subtotals = items.map(
		(i) => i.unitCostForeign * exchangeRate * i.quantity,
	);
	const totalBase = subtotals.reduce((sum, s) => sum + s, 0);
	return items.map((item, idx) => {
		const unitPen = item.unitCostForeign * exchangeRate;
		const weight = totalBase > 0 ? subtotals[idx] / totalBase : 0;
		const unitAccessory =
			item.quantity > 0 ? ((freight + duties) * weight) / item.quantity : 0;
		return unitPen + unitAccessory;
	});
};

// Received purchases count what actually arrived; the rest what was ordered
export const unitsOf = (purchase: Purchase) =>
	purchase.items.reduce(
		(sum, i) =>
			sum +
			(purchase.status === "RECEIVED"
				? (i.quantityReceived ?? 0)
				: i.quantityOrdered),
		0,
	);

export const landedTotalOf = (purchase: Purchase) =>
	purchase.items.reduce(
		(sum, i) => sum + Number(i.unitLandedCost) * i.quantityOrdered,
		0,
	);
