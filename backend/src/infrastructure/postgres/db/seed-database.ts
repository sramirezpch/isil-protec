import { db } from './connection';
import { brandTable, type NewBrandModel } from './schema/brand';
import { formatoTable, type NewFormatoModel } from './schema/formato';

const formatos: NewFormatoModel[] = [
  { name: 'Anime' },
  { name: 'Videojuego' },
  { name: 'Serie' },
  { name: 'Pelicula' },
  { name: 'Comic', active: false },
];

const brands: NewBrandModel[] = [
  { name: 'Bandai' },
  { name: 'Good Smile Company' },
  { name: 'Ichibansho' },
  { name: 'Hasbro' },
  { name: 'Funko', active: false },
];

// Pass --reset to wipe the tables before seeding
const reset = process.argv.includes('--reset');

async function seed() {
  await db.transaction(async (tx) => {
    const tables = [
      { label: 'formato', table: formatoTable, rows: formatos },
      { label: 'brand', table: brandTable, rows: brands },
    ];

    for (const { label, table, rows } of tables) {
      if (reset) {
        await tx.delete(table);
        console.log(`Tabla ${label} vaciada`);
      }

      const existing = await tx.$count(table);
      if (existing > 0) {
        console.log(
          `${label} ya tiene ${existing} registros, se omite (usa --reset para reemplazarlos)`,
        );
        continue;
      }

      // Goes through Drizzle so $defaultFn generates UUIDv7 ids
      await tx.insert(table).values(rows);
      console.log(`Insertados ${rows.length} registros en ${label}`);
    }
  });
}

seed()
  .catch((error) => {
    console.error('Error al poblar la base de datos:', error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
