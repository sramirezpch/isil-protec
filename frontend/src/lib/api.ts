export const API_URL =
	import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

type ApiResponse<T> = {
	success: boolean;
	data: T;
};

export type Formato = {
	id: string;
	name: string;
	active: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export async function getFormatos(): Promise<Formato[]> {
	const res = await fetch(`${API_URL}/formato`);
	if (!res.ok) {
		throw new Error(`Error al obtener formatos (${res.status})`);
	}
	const body: ApiResponse<{ formatos: Formato[] }> = await res.json();
	return body.data.formatos;
}

export type CatalogData = {
	name: string;
	active: boolean;
};

// Sends an optional JSON body and throws the backend's message on 4xx/5xx
async function sendJson(
	method: "POST" | "PATCH" | "DELETE",
	path: string,
	data: unknown,
	fallbackError: string,
): Promise<void> {
	const res = await fetch(`${API_URL}${path}`, {
		method,
		...(data !== undefined && {
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		}),
	});
	if (!res.ok) {
		const body: ApiResponse<{ message?: string }> | null = await res
			.json()
			.catch(() => null);
		throw new Error(body?.data.message ?? `${fallbackError} (${res.status})`);
	}
}

export function createFormato(formato: CatalogData): Promise<void> {
	return sendJson("POST", "/formato", formato, "Error al registrar el formato");
}

export function updateFormato(
	id: string,
	changes: Partial<CatalogData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/formato/${id}`,
		changes,
		"Error al actualizar el formato",
	);
}

// The backend soft-deletes: the formato stays listed as inactive
export function deleteFormato(id: string): Promise<void> {
	return sendJson(
		"DELETE",
		`/formato/${id}`,
		undefined,
		"Error al eliminar el formato",
	);
}

export type Brand = {
	id: string;
	name: string;
	active: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export async function getBrands(): Promise<Brand[]> {
	const res = await fetch(`${API_URL}/brand`);
	if (!res.ok) {
		throw new Error(`Error al obtener marcas (${res.status})`);
	}
	const body: ApiResponse<{ brands: Brand[] }> = await res.json();
	return body.data.brands;
}

export function createBrand(brand: CatalogData): Promise<void> {
	return sendJson("POST", "/brand", brand, "Error al registrar la marca");
}

export function updateBrand(
	id: string,
	changes: Partial<CatalogData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/brand/${id}`,
		changes,
		"Error al actualizar la marca",
	);
}

// The backend soft-deletes: the brand stays listed as inactive
export function deleteBrand(id: string): Promise<void> {
	return sendJson(
		"DELETE",
		`/brand/${id}`,
		undefined,
		"Error al eliminar la marca",
	);
}

// GET /franchise joins the formato and returns its name too
export type Franquicia = {
	id: string;
	name: string;
	active: boolean;
	formatoId: string;
	formatoName: string;
};

export type FranquiciaData = {
	name: string;
	active: boolean;
	formatoId: string;
};

export async function getFranquicias(): Promise<Franquicia[]> {
	const res = await fetch(`${API_URL}/franchise`);
	if (!res.ok) {
		throw new Error(`Error al obtener franquicias (${res.status})`);
	}
	const body: ApiResponse<{ franchises: Franquicia[] }> = await res.json();
	return body.data.franchises;
}

export function createFranquicia(franquicia: FranquiciaData): Promise<void> {
	return sendJson(
		"POST",
		"/franchise",
		franquicia,
		"Error al registrar la franquicia",
	);
}

export function updateFranquicia(
	id: string,
	changes: Partial<FranquiciaData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/franchise/${id}`,
		changes,
		"Error al actualizar la franquicia",
	);
}

// The backend soft-deletes: the franquicia stays listed as inactive
export function deleteFranquicia(id: string): Promise<void> {
	return sendJson(
		"DELETE",
		`/franchise/${id}`,
		undefined,
		"Error al eliminar la franquicia",
	);
}

// GET /linea joins the brand and returns its name, not its id
export type Linea = {
	id: string;
	name: string;
	brandName: string;
	active: boolean;
};

export type LineaData = {
	name: string;
	brandId: string;
	active: boolean;
};

export async function getLineas(): Promise<Linea[]> {
	const res = await fetch(`${API_URL}/linea`);
	if (!res.ok) {
		throw new Error(`Error al obtener líneas (${res.status})`);
	}
	const body: ApiResponse<{ lineas: Linea[] }> = await res.json();
	return body.data.lineas;
}

export function createLinea(linea: LineaData): Promise<void> {
	return sendJson("POST", "/linea", linea, "Error al registrar la línea");
}

export function updateLinea(
	id: string,
	changes: Partial<LineaData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/linea/${id}`,
		changes,
		"Error al actualizar la línea",
	);
}

// The backend soft-deletes: the linea stays listed as inactive
export function deleteLinea(id: string): Promise<void> {
	return sendJson(
		"DELETE",
		`/linea/${id}`,
		undefined,
		"Error al eliminar la línea",
	);
}

// GET /product returns franchiseId and lineaId, not their names
export type Product = {
	id: string;
	sku: string;
	name: string;
	// numeric column: comes back as a string, e.g. "149.99"
	price: string;
	stock: number;
	active: boolean;
	franchiseId: string;
	lineaId: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type ProductData = {
	sku: string;
	name: string;
	price: string;
	stock: number;
	active: boolean;
	franchiseId: string;
	lineaId: string;
};

export async function getProducts(): Promise<Product[]> {
	const res = await fetch(`${API_URL}/product`);
	if (!res.ok) {
		throw new Error(`Error al obtener figuras (${res.status})`);
	}
	const body: ApiResponse<{ products: Product[] }> = await res.json();
	return body.data.products;
}

export function createProduct(product: ProductData): Promise<void> {
	return sendJson("POST", "/product", product, "Error al registrar la figura");
}

export function updateProduct(
	id: string,
	changes: Partial<ProductData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/product/${id}`,
		changes,
		"Error al actualizar la figura",
	);
}

// The backend soft-deletes ("archive"): the product is set to inactive
export function archiveProduct(id: string): Promise<void> {
	return sendJson(
		"DELETE",
		`/product/${id}`,
		undefined,
		"Error al archivar la figura",
	);
}
export type Supplier = {
	id: string;
	companyName: string;
	country: string;
	taxId: string;
	address: string;
	contactName: string;
	email: string;
	phone: string;
	active: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type SupplierData = {
	companyName: string;
	country: string;
	taxId: string;
	address: string;
	contactName: string;
	email: string;
	phone: string;
	active?: boolean;
};

export async function getSuppliers(): Promise<Supplier[]> {
	const res = await fetch(`${API_URL}/supplier`);
	if (!res.ok) {
		throw new Error(`Error al obtener proveedores (${res.status})`);
	}
	const body: ApiResponse<{ suppliers: Supplier[] }> = await res.json();
	return body.data.suppliers;
}

export function createSupplier(supplier: SupplierData): Promise<void> {
	return sendJson(
		"POST",
		"/supplier",
		supplier,
		"Error al registrar el proveedor",
	);
}

export function updateSupplier(
	id: string,
	changes: Partial<SupplierData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/supplier/${id}`,
		changes,
		"Error al actualizar el proveedor",
	);
}

export function deleteSupplier(id: string): Promise<void> {
	return sendJson(
		"DELETE",
		`/supplier/${id}`,
		undefined,
		"Error al eliminar el proveedor",
	);
}

// Only the phone is required, and it's unique among clients
export type Client = {
	id: string;
	phone: string;
	name: string | null;
	lastName: string | null;
	// Stored without the leading "@"
	aliasTiktok: string | null;
	active: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

export type ClientData = {
	phone: string;
	name?: string;
	lastName?: string;
	aliasTiktok?: string;
	active: boolean;
};

// The backend matches `q` against phone, name or TikTok alias
export async function getClients(query?: string): Promise<Client[]> {
	const params = query ? `?${new URLSearchParams({ q: query })}` : "";
	const res = await fetch(`${API_URL}/client${params}`);
	if (!res.ok) {
		throw new Error(`Error al obtener clientes (${res.status})`);
	}
	const body: ApiResponse<{ clients: Client[] }> = await res.json();
	return body.data.clients;
}

export function createClient(client: ClientData): Promise<void> {
	return sendJson("POST", "/client", client, "Error al registrar el cliente");
}

export function updateClient(
	id: string,
	changes: Partial<ClientData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/client/${id}`,
		changes,
		"Error al actualizar el cliente",
	);
}

// The backend soft-deletes: the client stays listed as inactive
export function deleteClient(id: string): Promise<void> {
	return sendJson(
		"DELETE",
		`/client/${id}`,
		undefined,
		"Error al eliminar el cliente",
	);
}

// Compras: a purchase to a supplier that adds stock once it's received
export type PurchaseStatus = "PENDING" | "RECEIVED" | "CANCELLED";

// numeric columns come back as strings. Costs in PEN already include the
// exchange rate; the landed cost also spreads freight and customs duties
export type PurchaseItem = {
	id: string;
	productId: string;
	quantityOrdered: number;
	// null until the purchase is received
	quantityReceived: number | null;
	unitCostForeign: string;
	unitCostPen: string;
	unitLandedCost: string;
	product?: { id: string; sku: string; name: string };
};

export type Purchase = {
	id: string;
	supplierId: string;
	supplier?: { id: string; companyName: string };
	arrivalDate: string | null;
	status: PurchaseStatus;
	currency: string;
	exchangeRate: string;
	// Both in PEN
	internationalFreight: string;
	customsDuties: string;
	items: PurchaseItem[];
	createdAt: string;
	updatedAt: string;
};

export type PurchaseItemData = {
	productId: string;
	quantityOrdered: number;
	unitCostForeign: number;
};

export type PurchaseData = {
	supplierId: string;
	arrivalDate: string | null;
	currency: string;
	exchangeRate: number;
	internationalFreight: number;
	customsDuties: number;
	items: PurchaseItemData[];
};

export type ReceivePurchaseData = {
	arrivalDate: string | null;
	items: { productId: string; quantityReceived: number }[];
};

export type PurchaseFilters = {
	// Matches the supplier's name or the currency
	query?: string;
	status?: PurchaseStatus;
	page?: number;
};

// The backend pages by `limit` but doesn't return the total count
export async function getPurchases(filters: PurchaseFilters = {}): Promise<{
	purchases: Purchase[];
	page: number;
	limit: number;
}> {
	const params = new URLSearchParams();
	if (filters.query) params.set("query", filters.query);
	if (filters.status) params.set("status", filters.status);
	if (filters.page) params.set("page", String(filters.page));
	const search = params.size > 0 ? `?${params}` : "";
	const res = await fetch(`${API_URL}/purchase${search}`);
	if (!res.ok) {
		throw new Error(`Error al obtener las compras (${res.status})`);
	}
	const body: ApiResponse<{
		purchases: Purchase[];
		page: number;
		limit: number;
	}> = await res.json();
	return body.data;
}

export function createPurchase(purchase: PurchaseData): Promise<void> {
	return sendJson(
		"POST",
		"/purchase",
		purchase,
		"Error al registrar la compra",
	);
}

// Only pending purchases can change; sending `items` replaces all of them
export function updatePurchase(
	id: string,
	changes: Partial<PurchaseData>,
): Promise<void> {
	return sendJson(
		"PATCH",
		`/purchase/${id}`,
		changes,
		"Error al actualizar la compra",
	);
}

export function cancelPurchase(id: string): Promise<void> {
	return sendJson(
		"POST",
		`/purchase/${id}/cancel`,
		undefined,
		"Error al cancelar la compra",
	);
}

// Marks it received and adds each quantityReceived to the figura's stock
export function receivePurchase(
	id: string,
	data: ReceivePurchaseData,
): Promise<void> {
	return sendJson(
		"POST",
		`/purchase/${id}/receive`,
		data,
		"Error al recibir la compra",
	);
}
