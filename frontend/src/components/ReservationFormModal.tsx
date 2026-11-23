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

const labelClass = "mb-2 block text-sm font-semibold text-slate-900";

const fieldClass =
	"w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const selectClass =
	"w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

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
			<form
				role="dialog"
				aria-modal="true"
				aria-labelledby="reservation-form-title"
				onSubmit={handleSubmit}
				className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
			>
				<div className="mb-5 flex items-center justify-between gap-4">
					<h2
						id="reservation-form-title"
						className="m-0 text-lg font-bold text-slate-900"
					>
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

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<h3 className="m-0 mb-4 text-base font-bold text-slate-900">
						Datos de la Reserva
					</h3>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<label htmlFor="reservation-client" className={labelClass}>
								Cliente
							</label>
							<select
								id="reservation-client"
								required
								value={clientId}
								onChange={(event) => setClientId(event.target.value)}
								className={`${selectClass} ${clientId ? "text-slate-700" : "text-slate-500"}`}
							>
								<option value="">Seleccione un cliente...</option>
								{clients.map((client) => (
									<option key={client.id} value={client.id}>
										{fullName(client)}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="reservation-due-date" className={labelClass}>
								Fecha límite de pago
							</label>
							<input
								id="reservation-due-date"
								required
								type="date"
								min={currentDateInPeru()}
								value={dueDate}
								onChange={(event) => setDueDate(event.target.value)}
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
							onClick={() => setItems((current) => [...current, emptyLine()])}
							className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
						>
							+ Agregar Figura
						</button>
					</div>

					<div className="mb-2 hidden grid-cols-[minmax(14rem,1fr)_5rem_8rem_7rem_10rem_7rem_2rem] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
						<span>Figura</span>
						<span>Cantidad</span>
						<span>Descuento</span>
						<span>Valor</span>
						<span>Disponibilidad</span>
						<span className="text-right">Total línea</span>
						<span />
					</div>

					<div className="flex flex-col gap-3">
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
							const lineTotal = calculateLineTotal(item, product);

							return (
								<div
									key={item.id}
									className="grid grid-cols-2 items-center gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(14rem,1fr)_5rem_8rem_7rem_10rem_7rem_2rem] lg:border-b-0 lg:pb-0"
								>
									<select
										aria-label={`Figura ${index + 1}`}
										required
										value={item.productId}
										onChange={(event) =>
											updateItem(index, { productId: event.target.value })
										}
										className={`col-span-2 ${selectClass} ${item.productId ? "text-slate-700" : "text-slate-500"} lg:col-span-1`}
									>
										<option value="">Seleccione una figura activa...</option>
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
												{candidate.sku} · {candidate.name} (stock:{" "}
												{candidate.stock}) — S/ {candidate.price}
											</option>
										))}
									</select>
									<div>
										<span className="mb-1 block text-xs text-slate-500 lg:hidden">
											Cantidad
										</span>
										<input
											aria-label={`Cantidad de la figura ${index + 1}`}
											required
											type="number"
											min="1"
											step="1"
											value={item.quantity}
											onChange={(event) =>
												updateItem(index, { quantity: event.target.value })
											}
											placeholder="0"
											className={fieldClass}
										/>
									</div>
									<div>
										<span className="mb-1 block text-xs text-slate-500 lg:hidden">
											Descuento
										</span>
										<select
											aria-label={`Tipo de descuento de la figura ${index + 1}`}
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
											className={`${selectClass} text-slate-700`}
										>
											<option value="">Sin descuento</option>
											<option value="PORCENTAJE">Porcentaje</option>
											<option value="MONTO">Monto fijo</option>
										</select>
									</div>
									<div>
										<span
											className={`mb-1 block text-xs text-slate-500 lg:hidden ${
												item.discountType ? "" : "hidden"
											}`}
										>
											Valor
										</span>
										{item.discountType ? (
											<input
												aria-label={`Valor del descuento de la figura ${index + 1}`}
												required
												type="number"
												min="0"
												max={
													item.discountType === "PORCENTAJE" ? "100" : undefined
												}
												step="0.01"
												value={item.discountValue}
												onChange={(event) =>
													updateItem(index, {
														discountValue: event.target.value,
													})
												}
												placeholder={
													item.discountType === "PORCENTAJE" ? "0–100" : "0.00"
												}
												className={fieldClass}
											/>
										) : (
											<span className="hidden text-center text-slate-400 lg:block">
												—
											</span>
										)}
									</div>
									{product ? (
										<span
											className={`col-span-2 text-xs ${
												canBlock ? "text-emerald-700" : "text-amber-700"
											} lg:col-span-1`}
										>
											{canBlock
												? "Se bloqueará stock"
												: "Sin stock suficiente: quedará como preventa"}
										</span>
									) : (
										<span className="hidden text-center text-slate-400 lg:block">
											—
										</span>
									)}
									<span className="text-right text-sm font-semibold text-slate-900">
										<span className="lg:hidden">Total: </span>
										{lineTotal === null ? "—" : formatCents(lineTotal)}
									</span>
									<button
										type="button"
										aria-label={`Quitar la figura ${index + 1}`}
										onClick={() =>
											setItems((current) =>
												current.filter((line) => line.id !== item.id),
											)
										}
										disabled={items.length === 1}
										className="cursor-pointer justify-self-end border-0 bg-transparent p-0 text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
									>
										🗑️
									</button>
								</div>
							);
						})}
					</div>

					<dl className="m-0 mt-5 grid grid-cols-2 gap-x-4 border-t border-slate-200 pt-4 text-sm">
						<dt className="font-bold text-slate-900">Total referencial</dt>
						<dd className="m-0 text-right text-lg font-bold text-slate-900">
							{totalCents === null ? "—" : formatCents(totalCents)}
						</dd>
					</dl>
				</section>

				{error && (
					<p className="m-0 mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
						{error}
					</p>
				)}

				<div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="cursor-pointer rounded-md border-0 bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "Guardando..." : "Registrar reserva"}
					</button>
				</div>
			</form>
		</div>
	);
}
