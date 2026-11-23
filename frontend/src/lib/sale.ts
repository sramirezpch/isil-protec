import type { Client, Sale, SaleStatus } from "./api";

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
	PENDING_PAYMENT: "Pendiente de Pago",
	PENDING_DELIVERY: "Pendiente de Delivery",
	DELIVERED: "Entregado",
	CANCELLED: "Cancelado",
};

export const SALE_STATUS_BADGE: Record<SaleStatus, string> = {
	PENDING_PAYMENT: "bg-amber-100 text-amber-700",
	PENDING_DELIVERY: "bg-blue-100 text-blue-700",
	DELIVERED: "bg-emerald-100 text-emerald-700",
	CANCELLED: "bg-red-100 text-red-600",
};

export const formatClientName = (
	client?: Pick<Client, "name" | "lastName" | "phone"> | null,
) => {
	if (!client) return "—";
	const full = [client.name, client.lastName].filter(Boolean).join(" ").trim();
	return full ? `${full} (${client.phone})` : client.phone;
};

export const saleUnitsOf = (sale: Sale) =>
	sale.items.reduce((sum, item) => sum + item.quantity, 0);
