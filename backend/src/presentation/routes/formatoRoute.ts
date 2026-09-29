import { Router } from "express";
import { formatoController } from "../controllers/formatoController";

const formatoRoute = Router();

formatoRoute.get("/", formatoController.listarFormatos);

export default formatoRoute;
