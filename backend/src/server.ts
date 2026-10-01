import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { BrandService } from './application/services/brand-service';
import { FormatoService } from './application/services/formato.service';
import { BrandRepository } from './infrastructure/postgres/repository/brand.repository';
import { FormatoRepository } from './infrastructure/postgres/repository/formato.repository';
import { BrandController } from './presentation/controllers/brand/brand.controller';
import { FormatoController } from './presentation/controllers/formato/formato.controller';
import { BrandRouter } from './presentation/routes/brand.routes';
import { FormatoRouter } from './presentation/routes/formato.routes';

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

app.use('/api/v1/formato', formatoRouter.router);
app.use('/api/v1/brand', brandRouter.router);

app.listen('3000', () => {
  console.log('Server listening on port 3000');
});
