// run: node --experimental-strip-types src/services/access-management/api.check.ts
import assert from 'node:assert/strict'
import { ACCESS_MANAGEMENT_APPS, buildAccessManagementCatalog } from './catalog.ts'

const catalog = buildAccessManagementCatalog()

// FSD §3.2 has 2 Apps and both must be represented in the seeded catalog
assert.deepEqual(ACCESS_MANAGEMENT_APPS, ['Platform Administrator', 'Sustainability Reporting'])
assert.ok(catalog.some((p) => p.app === 'Platform Administrator'))
assert.ok(catalog.some((p) => p.app === 'Sustainability Reporting'))

// menu rows with no Sub-Menu ("—") use the menu name as the page label
const periodicNotification = catalog.find((p) => p.menu === 'Periodic Notification')
assert.equal(periodicNotification?.label, 'Periodic Notification')
assert.equal(periodicNotification?.subMenu, null)

// menu rows with a Sub-Menu combine both into the page label
const masterUnit = catalog.find((p) => p.subMenu === 'Master Unit')
assert.equal(masterUnit?.label, 'Master Data - Master Unit')

// every page id is unique — this is the key a grant-matrix save payload references
const ids = catalog.map((p) => p.id)
assert.equal(new Set(ids).size, ids.length)

// grant-matrix save shape (AC-15/AC-17): one Position maps to a set of {app, page} rows
const savePayload = { position_id: 'pos-1', pages: [{ app: masterUnit!.app, page: masterUnit!.id }] }
assert.equal(savePayload.pages[0].page, masterUnit!.id)

console.log('ok')
