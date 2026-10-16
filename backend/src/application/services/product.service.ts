import { FranchiseNotFound } from '../../domain/errors/franchise.errors';
import { LineaNotFound } from '../../domain/errors/linea.errors';
import { IFranchiseRepository } from '../port/franchise.repository';
import { ILineaRepository } from '../port/linea.repository';
import { IProductRepository } from '../port/product.repository';

export interface CreateProductInput {
  name: string;
  sku: string;
  price: string;
  stock: number;
  active: boolean;
  franchiseId: string;
  lineaId: string;
}

export interface UpdateProductInput
  extends Partial<{
    name: string;
    sku: string;
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

  async create(input: CreateProductInput) {
    const franchise = await this.franchiseRepository.findById(
      input.franchiseId,
    );

    if (!franchise) throw new FranchiseNotFound();

    const linea = await this.lineaRepository.findById(input.lineaId);

    if (!linea) throw new LineaNotFound();

    return await this.productRepository.create(input);
  }

  async update(input: UpdateProductInput) {
    return await this.productRepository.update(input);
  }

  async delete(id: string) {
    return await this.productRepository.delete(id);
  }
}
