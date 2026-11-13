import { FranchiseNotFound } from '../../domain/errors/franchise.errors';
import { LineaNotFound } from '../../domain/errors/linea.errors';
import { ProductNotFound } from '../../domain/errors/product.errors';
import type { IFranchiseRepository } from '../port/franchise.repository';
import type { ILineaRepository } from '../port/linea.repository';
import type { IProductRepository } from '../port/product.repository';
import { generateSku, generateSkuWithRetry } from './sku.service';

export interface CreateProductInput {
  name: string;
  sku?: string;
  price: string;
  stock: number;
  active: boolean;
  franchiseId: string;
  lineaId: string;
}

export interface UpdateProductInput
  extends Partial<{
    name: string;
    price: string;
    stock: number;
    active: boolean;
    franchiseId: string;
    lineaId: string;
  }> {
  id: string;
}

export class ProductService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly franchiseRepository: IFranchiseRepository,
    private readonly lineaRepository: ILineaRepository,
  ) {}

  async findAll(query?: string) {
    return await this.productRepository.findAll(query);
  }

  async findById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new ProductNotFound();
    return product;
  }

  async generateSku(franchiseId: string, lineaId: string, name: string) {
    const franchise = await this.franchiseRepository.findById(franchiseId);
    if (!franchise) throw new FranchiseNotFound();

    const linea = await this.lineaRepository.findById(lineaId);
    if (!linea) throw new LineaNotFound();

    return generateSku(
      this.productRepository,
      franchise.name,
      linea.name,
      name,
    );
  }

  async create(input: CreateProductInput) {
    const franchise = await this.franchiseRepository.findById(
      input.franchiseId,
    );
    if (!franchise) throw new FranchiseNotFound();

    const linea = await this.lineaRepository.findById(input.lineaId);
    if (!linea) throw new LineaNotFound();

    if (input.sku) {
      await this.productRepository.create({
        sku: input.sku,
        name: input.name,
        price: input.price,
        stock: input.stock,
        franchiseId: input.franchiseId,
        lineaId: input.lineaId,
      });
      return;
    }

    await generateSkuWithRetry(
      this.productRepository,
      franchise.name,
      linea.name,
      input.name,
      (sku) =>
        this.productRepository.create({
          sku,
          name: input.name,
          price: input.price,
          stock: input.stock,
          franchiseId: input.franchiseId,
          lineaId: input.lineaId,
        }),
    );
  }

  async update(input: UpdateProductInput) {
    const { id, ...rest } = input;
    return await this.productRepository.update({ id, ...rest });
  }

  async delete(id: string) {
    return await this.productRepository.delete(id);
  }
}
