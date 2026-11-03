import { useState } from "react";
import type { Product } from "../lib/api";

type Props = {
	product: Product;
	type: "IN" | "OUT";
	onClose: () => void;
	onConfirm: (
		product: Product,
		quantity: number,
		type: "IN" | "OUT",
	) => Promise<void>;
};

export default function StockMovementModal({
	product,
	type,
	onClose,
	onConfirm,
}: Props) {
	const [quantity, setQuantity] = useState<number>(1);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEntry = type === "IN";
	const title = isEntry
		? `Entrada de Stock - ${product.name}`
		: `Salida de Stock - ${product.name}`;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (quantity <= 0) {
			setError("La cantidad debe ser mayor a cero.");
			return;
		}

		// Criterio Escenario 2: Salida excede el stock disponible
		if (!isEntry && quantity > product.stock) {
			setError(
				`No se pueden retirar más unidades de las disponibles (Stock disponible: ${product.stock}).`,
			);
			return;
		}

		try {
			setIsSubmitting(true);
			await onConfirm(product, quantity, type);
			onClose();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Error al procesar el movimiento de stock.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<h2 className="mb-2 text-xl font-bold text-slate-900">{title}</h2>
				<p className="mb-4 text-sm text-slate-600">
					Stock disponible actual:{" "}
					<span className="font-bold text-slate-900">{product.stock}</span>
				</p>

				{error && (
					<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="quantity"
							className="mb-1 block text-sm font-medium text-slate-700"
						>
							Cantidad a {isEntry ? "ingresar" : "retirar"}
						</label>
						<input
							id="quantity"
							type="number"
							min="1"
							value={quantity}
							onChange={(e) => setQuantity(Number(e.target.value))}
							className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
							// biome-ignore lint/a11y/noAutofocus: focus input when modal opens
							autoFocus
						/>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className={`cursor-pointer rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
								isEntry
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-amber-600 hover:bg-amber-700"
							}`}
						>
							{isSubmitting
								? "Guardando..."
								: isEntry
									? "Confirmar Entrada"
									: "Confirmar Salida"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
