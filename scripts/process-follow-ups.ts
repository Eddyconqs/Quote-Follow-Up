import { processDueEnrollments } from "@/lib/follow-up/engine";
import { prisma } from "@/lib/prisma";

async function main() {
  const results = await processDueEnrollments();
  // eslint-disable-next-line no-console
  console.log(`Processed ${results.length} due enrollment(s).`);
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`  - ${r.enrollmentId}: ${r.outcome}`);
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
