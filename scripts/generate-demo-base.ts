// Regenerates src/services/strategic-insight/fixtures/gri-quantitative-base.json from the
// committed contract example.
//
// run: node --experimental-strip-types scripts/generate-demo-base.ts
//
// Why a committed JSON rather than reading the .yml at run time: demo-data.ts runs in the BROWSER,
// where there is no python3 to parse the Bruno collection and no fs to read it. The base file is
// the contract example verbatim (all 8 categories, dimensions[], labels{}, summary[]) — the
// expansion to 15 entities x 3 periods happens at run time in demo-data.ts, so this file stays a
// faithful copy of the contract and any contract change is a one-command refresh.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadContractExample } from './lib/gri-contract-diff.ts'

const OUT = fileURLToPath(
  new URL('../src/services/strategic-insight/fixtures/gri-quantitative-base.json', import.meta.url),
)

const example = loadContractExample()
writeFileSync(OUT, `${JSON.stringify(example, null, 2)}\n`)
console.log(`wrote ${OUT} — ${example.length} categories`)
