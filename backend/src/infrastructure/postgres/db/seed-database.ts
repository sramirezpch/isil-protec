import { db } from './connection';
import { formatoTable, type NewFormatoModel } from './schema/formato';

const formatos: NewFormatoModel[] = [
  { name: 'Anime' },
  { name: 'Videojuego' },
  { name: 'Serie' },
  { name: 'Pelicula' },
  { name: 'Comic', active: false },
];

// Pass --reset to wipe the tables before seeding
const reset = process.argv.includes('--reset');

async function seed() {
  await db.transaction(async (tx) => {
    if (reset) {
      await tx.delete(formatoTable);
      console.log('Tabla formato vaciada');
    }

    const existing = await tx.$count(formatoTable);
    if (existing > 0) {
      console.log(
        `formato ya tiene ${existing} registros, se omite (usa --reset para reemplazarlos)`,
      );
      return;
    }

    // Goes through Drizzle so $defaultFn generates UUIDv7 ids
    await tx.insert(formatoTable).values(formatos);
    console.log(`Insertados ${formatos.length} formatos`);
  });
}

seed()
  .catch((error) => {
    console.error('Error al poblar la base de datos:', error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
