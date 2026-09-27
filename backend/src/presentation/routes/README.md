En esta carpeta van todos los controllers de la forma

```ts
import { Router } from "express";

const router = Router();

router.get('/recurso', (req, res) => {
    res.status(200);
})

router.post('/recurso', (req, res) => {
    res.status(201);
})

export default router;
```

Un controller es un router, hay que agregar endpoints al router y exportarlo para poder referenciarlo en el archivo `server.ts`