const j = require('../_inventory-raw.json');
const skip = (f) =>
  f.startsWith('kamuk/') ||
  f.startsWith('gospanol/') ||
  f.includes('scripts/') ||
  f.includes('_inventory') ||
  f.includes('_migration') ||
  f.includes('ASSET_REQUIRES') ||
  f.includes('BRAND-MIGRATION') ||
  f.includes('migrate-infinity') ||
  f.includes('inventory-brand') ||
  f.includes('validate-brand') ||
  f.includes('_archive_kamuk');

const active = j.rows.filter((r) => !skip(r.file));
console.log('ACTIVE_HITS=' + active.length);
for (const r of active) {
  console.log(r.file + ' :: ' + r.legacy.join(' | '));
}
