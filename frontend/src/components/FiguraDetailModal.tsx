import { useEffect, useState } from "react";
import type { Franquicia, Linea, Product } from "../lib/api";
import { downloadProductLabel } from "../lib/api";

type Props = {
	product: Product;
	catalogs: {
		franquicias: Franquicia[];
		lineas: Linea[];
	};
	onClose: () => void;
};

const precioFormat = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
});

export default function FiguraDetailModal({
	product,
	catalogs: { franquicias, lineas },
	onClose,
}: Props) {
	const [quantity, setQuantity] = useState<number>(1);
	const [generating, setGenerating] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const franquicia = franquicias.find((f) => f.id === product.franchiseId);
	const linea = lineas.find((l) => l.id === product.lineaId);

	const hasSku = Boolean(product.sku && product.sku.trim() !== "");
	const isValidQty =
		Number.isInteger(quantity) && quantity >= 1 && quantity <= 100;

	const handleGenerateLabels = async () => {
		if (!hasSku || !isValidQty || generating) return;
		setGenerating(true);
		setError(null);

		try {
			const blob = await downloadProductLabel(product.id, quantity);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `etiquetas-${product.sku}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Ocurrió un error al generar las etiquetas",
			);
		} finally {
			setGenerating(false);
		}
	};

	const detalles: [string, string][] = [
		["SKU", product.sku || "Sin SKU asignado"],
		["Nombre de Figura", product.name],
		["Franquicia", franquicia?.name ?? "—"],
		["Línea", linea?.name ?? "—"],
		["Precio de Venta", precioFormat.format(Number(product.price))],
		["Stock Disponible", `${product.stock} unidades`],
		["Estado", product.active ? "Activo" : "Archivado"],
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
				aria-labelledby="figura-detail-title"
				className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
			>
				<div className="mb-5 flex items-start justify-between">
					<div>
						<h2
							id="figura-detail-title"
							className="m-0 text-xl font-bold text-slate-900"
						>
							Detalle de Figura
						</h2>
						<p className="m-0 mt-1 text-xs text-slate-500">
							Información del producto y emisión de etiquetas físicas
						</p>
					</div>
					{hasSku ? (
						<span className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
							{product.sku}
						</span>
					) : (
						<span className="rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
							Sin SKU
						</span>
					)}
				</div>

				<section className="mb-6 rounded-lg border border-slate-200 p-5">
					<h3 className="m-0 mb-3 text-sm font-bold text-slate-900 uppercase tracking-wide">
						Datos del Producto
					</h3>
					<dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						{detalles.map(([label, value]) => (
							<div key={label}>
								<dt className="text-xs font-semibold text-slate-500">
									{label}
								</dt>
								<dd className="m-0 mt-0.5 font-medium text-slate-900">
									{value}
								</dd>
							</div>
						))}
					</dl>
				</section>

				<section className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/40 p-5">
					<h3 className="m-0 mb-2 text-sm font-bold text-slate-900">
						Generación de Etiquetas
					</h3>
					<p className="m-0 mb-4 text-xs text-slate-600">
						Genera un documento PDF descargable con etiquetas adhesivas. Cada
						etiqueta contiene el SKU en texto, nombre de la figura, código QR y
						código de barras Code128 para control en mostrador.
					</p>

					<div className="flex flex-col gap-4 sm:flex-row sm:items-end">
						<div className="flex-1">
							<label
								htmlFor="label-quantity"
								className="mb-1 block text-xs font-semibold text-slate-700"
							>
								Cantidad de etiquetas (1 - 100)
							</label>
							<input
								id="label-quantity"
								type="number"
								min="1"
								max="100"
								step="1"
								value={quantity}
								onChange={(e) => setQuantity(Number(e.target.value))}
								disabled={!hasSku || generating}
								className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
							/>
						</div>

						<button
							type="button"
							onClick={handleGenerateLabels}
							disabled={!hasSku || !isValidQty || generating}
							className="cursor-pointer rounded-md border-0 bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{generating ? "Generando PDF..." : "Generar Etiquetas"}
						</button>
					</div>

					{!hasSku && (
						<p className="m-0 mt-3 text-xs text-amber-600">
							Esta figura no cuenta con un SKU asignado. No se pueden emitir
							etiquetas.
						</p>
					)}
				</section>

				{error && (
					<p className="m-0 mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
						{error}
					</p>
				)}

				<div className="flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						Cerrar
					</button>
				</div>
			</div>
		</div>
	);
}
