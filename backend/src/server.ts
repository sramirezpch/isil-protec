import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { BrandService } from './application/services/brand-service';
import { FormatoService } from './application/services/formato.service';
import { FranchiseService } from './application/services/franchise.service';
import { BrandRepository } from './infrastructure/postgres/repository/brand.repository';
import { FormatoRepository } from './infrastructure/postgres/repository/formato.repository';
import { FranchiseRepository } from './infrastructure/postgres/repository/franchise.repository';
import { BrandController } from './presentation/controllers/brand/brand.controller';
import { FormatoController } from './presentation/controllers/formato/formato.controller';
import { FranchiseController } from './presentation/controllers/franchise/franchise.controller';
import { BrandRouter } from './presentation/routes/brand.routes';
import { FormatoRouter } from './presentation/routes/formato.routes';
import { LineaRouter } from './presentation/routes/linea.routes';
import { LineaRepository } from './infrastructure/postgres/repository/linea.repository';
import { LineaService } from './application/services/linea.service';
import { LineaController } from './presentation/controllers/linea/linea.controller';
import { FranchiseRouter } from './presentation/routes/franchise.routes';
import { ProductRepository } from './infrastructure/postgres/repository/product.repository';
import { ProductService } from './application/services/product.service';
import { ProductController } from './presentation/controllers/product/product.controller';
import { ProductRouter } from './presentation/routes/product.routes';
import { SupplierRouter } from './presentation/routes/supplier.routes';
import { SupplierController } from './presentation/controllers/supplier/supplier.controller';
import { SupplierService } from './application/services/supplier.service';
import { SupplierRepository } from './infrastructure/postgres/repository/supplier.repository';
import { LookupTaxTaxIdValidator } from './infrastructure/external/lookuptax/lookuptax-tax-id.validator';
import { env } from './infrastructure/config/environment';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const formatoRepository = new FormatoRepository();
const formatoService = new FormatoService(formatoRepository);
const formatoController = new FormatoController(formatoService);
const formatoRouter = new FormatoRouter(formatoController);

const brandRepository = new BrandRepository();
const brandService = new BrandService(brandRepository);
const brandController = new BrandController(brandService);
const brandRouter = new BrandRouter(brandController);

const lineaRepository = new LineaRepository();
const lineaService = new LineaService(lineaRepository);
const lineaController = new LineaController(lineaService);
const lineaRouter = new LineaRouter(lineaController);

const franchiseRepository = new FranchiseRepository();
const franchiseService = new FranchiseService(franchiseRepository);
const franchiseController = new FranchiseController(franchiseService);
const franchiseRouter = new FranchiseRouter(franchiseController);

const supplierRepository = new SupplierRepository();
const taxIdValidator = new LookupTaxTaxIdValidator(
  env.taxIdApiKey,
  env.taxIdApiUrl,
);
const supplierService = new SupplierService(supplierRepository, taxIdValidator);
const supplierController = new SupplierController(supplierService);
const supplierRouter = new SupplierRouter(supplierController);

const productRepository = new ProductRepository();
const productService = new ProductService(
  productRepository,
  franchiseRepository,
  lineaRepository,
);
const productController = new ProductController(productService);
const productRouter = new ProductRouter(productController);

app.use('/api/v1/formato', formatoRouter.router);
app.use('/api/v1/brand', brandRouter.router);
app.use('/api/v1/franchise', franchiseRouter.router);
app.use('/api/v1/linea', lineaRouter.router);
app.use('/api/v1/product', productRouter.router);
app.use('/api/v1/supplier', supplierRouter.router);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
