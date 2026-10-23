import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { BrandService } from './application/services/brand-service';
import { ClientService } from './application/services/client.service';
import { FormatoService } from './application/services/formato.service';
import { FranchiseService } from './application/services/franchise.service';
import { LineaService } from './application/services/linea.service';
import { ProductService } from './application/services/product.service';
import { PurchaseService } from './application/services/purchase.service';
import { SupplierService } from './application/services/supplier.service';
import { env } from './infrastructure/config/environment';
import { LookupTaxTaxIdValidator } from './infrastructure/external/lookuptax/lookuptax-tax-id.validator';
import { BrandRepository } from './infrastructure/postgres/repository/brand.repository';
import { ClientRepository } from './infrastructure/postgres/repository/client.repository';
import { FormatoRepository } from './infrastructure/postgres/repository/formato.repository';
import { FranchiseRepository } from './infrastructure/postgres/repository/franchise.repository';
import { LineaRepository } from './infrastructure/postgres/repository/linea.repository';
import { ProductRepository } from './infrastructure/postgres/repository/product.repository';
import { PurchaseRepository } from './infrastructure/postgres/repository/purchase.repository';
import { SupplierRepository } from './infrastructure/postgres/repository/supplier.repository';
import { BrandController } from './presentation/controllers/brand/brand.controller';
import { ClientController } from './presentation/controllers/client/client.controller';
import { FormatoController } from './presentation/controllers/formato/formato.controller';
import { FranchiseController } from './presentation/controllers/franchise/franchise.controller';
import { LineaController } from './presentation/controllers/linea/linea.controller';
import { ProductController } from './presentation/controllers/product/product.controller';
import { PurchaseController } from './presentation/controllers/purchase/purchase.controller';
import { SupplierController } from './presentation/controllers/supplier/supplier.controller';
import { BrandRouter } from './presentation/routes/brand.routes';
import { ClientRouter } from './presentation/routes/client.routes';
import { FormatoRouter } from './presentation/routes/formato.routes';
import { FranchiseRouter } from './presentation/routes/franchise.routes';
import { LineaRouter } from './presentation/routes/linea.routes';
import { ProductRouter } from './presentation/routes/product.routes';
import { PurchaseRouter } from './presentation/routes/purchase.routes';
import { SupplierRouter } from './presentation/routes/supplier.routes';

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

const clientRepository = new ClientRepository();
const clientService = new ClientService(clientRepository);
const clientController = new ClientController(clientService);
const clientRouter = new ClientRouter(clientController);

const productRepository = new ProductRepository();
const productService = new ProductService(
  productRepository,
  franchiseRepository,
  lineaRepository,
);
const productController = new ProductController(productService);
const productRouter = new ProductRouter(productController);

const purchaseRepository = new PurchaseRepository();
const purchaseService = new PurchaseService(
  purchaseRepository,
  supplierRepository,
  productRepository,
);
const purchaseController = new PurchaseController(purchaseService);
const purchaseRouter = new PurchaseRouter(purchaseController);

app.use('/api/v1/formato', formatoRouter.router);
app.use('/api/v1/brand', brandRouter.router);
app.use('/api/v1/franchise', franchiseRouter.router);
app.use('/api/v1/linea', lineaRouter.router);
app.use('/api/v1/client', clientRouter.router);
app.use('/api/v1/product', productRouter.router);
app.use('/api/v1/supplier', supplierRouter.router);
app.use('/api/v1/purchase', purchaseRouter.router);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
