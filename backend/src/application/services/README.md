Aquí van todos los servicios que va a consumir un controller

```ts
export class RecursoService {
    constructor(private readonly dependencia1: any) { }

    async getById(id: string) {
        return await this.dependencia1.getById(1);
    }
}
```

Cada metodo de la clase debe ser una accion concreta que debe tomar el service. Si estamos creando un endpoint para crear un recurso, entonces el service debe tener un metodo `create` o un metodo `save` y recibir por parametro lo que necesite para crearlo.

Los services van a tener un constructor y siempre van a tener al menos 1 dependencia, el repoitory del recurso. Esta como `private readonly` precisamente para que el repository no pueda ser cambiado en algun metodo y que se pueda referenciar con `this` en cualquier metodo.

El service **siempre** va a retornar algo, idealmente siendo lo que sea que el repository haya devuelto.