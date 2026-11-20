import { useState } from "react";
import type {
	Client,
	Product,
	ReservationData,
	ReservationDiscountType,
} from "../lib/api";

type Props = {
	clients: Client[];
	products: Product[];
	onClose: () => void;
	onConfirm: (reservation: ReservationData) => Promise<void>;
};

type ReservationLineInput = {
	id: string;
	productId: string;
	quantity: string;
	discountType: "" | ReservationDiscountType;
	discountValue: string;
};

const emptyLine = (): ReservationLineInput => ({
	id: crypto.randomUUID(),
	productId: "",
	quantity: "1",
	discountType: "",
	discountValue: "",
});

const parseCents = (value: string): bigint | null => {
	const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
	if (!match) return null;
	return BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
};

const formatCents = (cents: bigint): string =>
	`S/ ${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;

const currentDateInPeru = (): string => {
	const parts: Record<string, string> = {};
	for (const part of new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date())) {
		if (part.type !== "literal") parts[part.type] = part.value;
	}
	return `${parts.year}-${parts.month}-${parts.day}`;
};

const calculateLineTotal = (
	line: ReservationLineInput,
	product: Product | undefined,
): bigint | null => {
	if (!product || !/^\d+$/.test(line.quantity)) return null;
	const quantity = BigInt(line.quantity);
	if (quantity < 1n) return null;
	const unitPrice = parseCents(product.price);
	if (unitPrice === null) return null;
	const subtotal = unitPrice * quantity;

	if (!line.discountType) {
		return line.discountValue.trim() ? null : subtotal;
	}

	const discountValue = parseCents(line.discountValue);
	if (discountValue === null) return null;
	if (line.discountType === "PORCENTAJE") {
		if (discountValue > 10_000n) return null;
		const discount = (subtotal * discountValue + 5_000n) / 10_000n;
		return subtotal - discount;
	}
	if (discountValue > subtotal) return null;
	return subtotal - discountValue;
};

const fullName = (client: Client): string =>
	[client.name, client.lastName].filter(Boolean).join(" ") || client.phone;

export default function ReservationFormModal({
	clients,
	products,
	onClose,
	onConfirm,
}: Props) {
	const [clientId, setClientId] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [items, setItems] = useState<ReservationLineInput[]>([emptyLine()]);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const updateItem = (
		index: number,
		changes: Partial<ReservationLineInput>,
	) => {
		setItems((current) =>
			current.map((item, itemIndex) =>
				itemIndex === index ? { ...item, ...changes } : item,
			),
		);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		if (!clientId) {
			setError("Debe seleccionar un cliente activo.");
			return;
		}
		if (!dueDate) {
			setError("Debe indicar una fecha límite válida.");
			return;
		}
		if (items.length === 0 || items.some((item) => !item.productId)) {
			setError("Agregue al menos una figura a la reserva.");
			return;
		}
		if (new Set(items.map((item) => item.productId)).size !== items.length) {
			setError("No se puede incluir la misma figura más de una vez.");
			return;
		}
		if (
			items.some(
				(item) =>
					calculateLineTotal(
						item,
						products.find((product) => product.id === item.productId),
					) === null,
			)
		) {
			setError("Revise las cantidades y descuentos de cada figura.");
			return;
		}

		const reservation: ReservationData = {
			clientId,
			dueDate,
			items: items.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
				discountType: item.discountType || null,
				discountValue: item.discountType ? item.discountValue : null,
			})),
		};

		try {
			setIsSubmitting(true);
			await onConfirm(reservation);
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Ocurrió un error al registrar la reserva.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const totals = items.map((item) =>
		calculateLineTotal(
			item,
			products.find((product) => product.id === item.productId),
		),
	);
	const totalCents = totals.every((total) => total !== null)
		? totals.reduce<bigint>((sum, total) => sum + (total ?? 0n), 0n)
		: null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
				<div className="mb-5 flex items-center justify-between gap-4">
					<h2 className="m-0 text-xl font-bold text-slate-900">
						Nueva reserva o preventa
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="cursor-pointer border-0 bg-transparent text-slate-500 hover:text-slate-800"
					>
						Cerrar
					</button>
				</div>

				{error && (
					<p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</p>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="block text-sm font-medium text-slate-700">
							Cliente
							<select
								required
								value={clientId}
								onChange={(event) => setClientId(event.target.value)}
								className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
							>
								<option value="">Seleccione un cliente</option>
								{clients.map((client) => (
									<option key={client.id} value={client.id}>
										{fullName(client)}
									</option>
								))}
							</select>
						</label>
						<label className="block text-sm font-medium text-slate-700">
							Fecha límite de pago
							<input
								required
								type="date"
								min={currentDateInPeru()}
								value={dueDate}
								onChange={(event) => setDueDate(event.target.value)}
								className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
							/>
						</label>
					</div>

					<div className="space-y-4">
						{items.map((item, index) => {
							const product = products.find(
								(candidate) => candidate.id === item.productId,
							);
							const quantityValid = /^\d+$/.test(item.quantity);
							const quantity = quantityValid ? BigInt(item.quantity) : 0n;
							const canBlock =
								product !== undefined &&
								quantity > 0n &&
								BigInt(product.stock) >= quantity;

							return (
								<div
									key={item.id}
									className="rounded-md border border-slate-200 p-4"
								>
									<div className="mb-3 flex items-center justify-between">
										<h3 className="m-0 text-sm font-semibold text-slate-800">
											Figura {index + 1}
										</h3>
										{items.length > 1 && (
											<button
												type="button"
												onClick={() =>
													setItems((current) =>
														current.filter(
															(_, itemIndex) => itemIndex !== index,
														),
													)
												}
												className="cursor-pointer border-0 bg-transparent text-sm text-red-600"
											>
												Quitar
											</button>
										)}
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										<label className="block text-sm font-medium text-slate-700 md:col-span-2">
											Figura
											<select
												required
												value={item.productId}
												onChange={(event) =>
													updateItem(index, { productId: event.target.value })
												}
												className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
											>
												<option value="">Seleccione una figura activa</option>
												{products.map((candidate) => (
													<option
														key={candidate.id}
														value={candidate.id}
														disabled={items.some(
															(other, otherIndex) =>
																otherIndex !== index &&
																other.productId === candidate.id,
														)}
													>
														{candidate.sku} — {candidate.name} (stock:{" "}
														{candidate.stock}) — S/ {candidate.price}
													</option>
												))}
											</select>
										</label>
										<label className="block text-sm font-medium text-slate-700">
											Cantidad
											<input
												required
												type="number"
												min="1"
												step="1"
												value={item.quantity}
												onChange={(event) =>
													updateItem(index, { quantity: event.target.value })
												}
												className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
											/>
										</label>
										<label className="block text-sm font-medium text-slate-700">
											Tipo de descuento
											<select
												value={item.discountType}
												onChange={(event) => {
													const value = event.target.value;
													if (
														value === "" ||
														value === "PORCENTAJE" ||
														value === "MONTO"
													) {
														updateItem(index, {
															discountType: value,
															discountValue: "",
														});
													}
												}}
												className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
											>
												<option value="">Sin descuento</option>
												<option value="PORCENTAJE">Porcentaje</option>
												<option value="MONTO">Monto fijo (PEN)</option>
											</select>
										</label>
										{item.discountType && (
											<label className="block text-sm font-medium text-slate-700">
												Valor del descuento{" "}
												{item.discountType === "PORCENTAJE" ? "(%)" : "(PEN)"}
												<input
													required
													type="number"
													min="0"
													max={
														item.discountType === "PORCENTAJE"
															? "100"
															: undefined
													}
													step="0.01"
													value={item.discountValue}
													onChange={(event) =>
														updateItem(index, {
															discountValue: event.target.value,
														})
													}
													className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
												/>
											</label>
										)}
									</div>

									{product && (
										<p
											className={`mb-0 mt-3 text-sm ${
												canBlock ? "text-emerald-700" : "text-amber-700"
											}`}
										>
											{canBlock
												? "Se bloqueará stock"
												: "Sin stock suficiente: quedará como preventa"}
										</p>
									)}
								</div>
							);
						})}
					</div>

					<button
						type="button"
						onClick={() => setItems((current) => [...current, emptyLine()])}
						className="cursor-pointer rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
					>
						+ Agregar figura
					</button>

					<p className="m-0 text-right text-lg font-bold text-slate-900">
						Total referencial:{" "}
						{totalCents === null ? "—" : formatCents(totalCents)}
					</p>

					<div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="cursor-pointer rounded-md border-0 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
						>
							{isSubmitting ? "Guardando..." : "Registrar reserva"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
