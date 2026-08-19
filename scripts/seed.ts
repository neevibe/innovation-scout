import { resetToSeed } from "../lib/db/store";

// Reset the runtime store to the grounded seed dataset.
resetToSeed()
  .then((s) => {
    console.log(`Seeded store: ${s.opportunities.length} opportunities, ${s.signals.length} signals, ${s.cities.length} cities.`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
