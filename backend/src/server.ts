import express from "express";
import helmet from "helmet";
import cors from "cors";

import { FormatoRepository } from "./infrastructure/postgres/repository/formatoRepository";
import { FormatoService } from "./application/services/formatoService";
import { FormatoController } from "./presentation/controllers/formatoController";
import { FormatoRouter } from "./presentation/routes/formatoRoute";


const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const formatoRepository = new FormatoRepository();
const formatoService = new FormatoService(formatoRepository);
const formatoController = new FormatoController(formatoService);
const formatoRouter = new FormatoRouter(formatoController);
app.use('/api/v1/formato', formatoRouter.router)

app.get('/hello-world', (req, res) => {
    res.status(200).json({ status: 200, data: { message: "Hello world" } })
})

app.listen('3000', () => {
    console.log("Server listening on port 3000")
})