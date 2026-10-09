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
import { FranchiseRouter } from './presentation/routes/franchise.routes';

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

const franchiseRepository = new FranchiseRepository();
const franchiseService = new FranchiseService(franchiseRepository);
const franchiseController = new FranchiseController(franchiseService);
const franchiseRouter = new FranchiseRouter(franchiseController);

app.use('/api/v1/formato', formatoRouter.router);
app.use('/api/v1/brand', brandRouter.router);
app.use('/api/v1/franchise', franchiseRouter.router);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});