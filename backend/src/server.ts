import express from "express";
import helmet from "helmet";
import cors from "cors";

import { BrandRepository } from './infrastructure/postgres/repository/BrandRepository';
import { BrandService } from './application/services/BrandService';
import { BrandController } from './presentation/controllers/BrandController';
import { BrandRouter } from './presentation/routes/BrandRouter';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/hello-world', (req, res) => {
    res.status(200).json({ status: 200, data: { message: "Hello world" } });
});

const brandRepository = new BrandRepository();
const brandService = new BrandService(brandRepository);
const brandController = new BrandController(brandService);
const brandRouter = new BrandRouter(brandController);

app.use('/v1', brandRouter.router);

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});