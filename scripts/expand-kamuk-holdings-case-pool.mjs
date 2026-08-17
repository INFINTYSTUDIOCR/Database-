/**
 * Expands Kamuk Holdings CRM pack to 40+ unique cases by cloning enriched templates
 * with new IDs, titles, clients and briefs. Rubrics inherit from the template.
 * Run: node scripts/expand-kamuk-holdings-case-pool.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('kamuk/data');
const packPath = path.join(root, 'kamuk-holdings-crm-pack-v1.json');
const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));

const VARIANTS = {
  'KH-1042': [
    { id: 'KH-1201', title: 'Operating account lock — payroll suppliers unpaid', brief: 'An overnight risk rule locked the operating account. Three supplier payments declined and payroll is due today.', clientName: 'Sofia Delgado', company: 'Delgado Produce Export', statement: 'My suppliers are calling me every ten minutes. Unlock this now.' },
    { id: 'KH-1202', title: 'Account restriction after false positive fraud', brief: 'A false positive fraud rule restricted the corporate account. Two ACH payments failed and the client faces late fees.', clientName: 'Luis Mora', company: 'Mora Industrial Parts', statement: 'Your system blocked clean payments. Who pays the late fees?' },
    { id: 'KH-1203', title: 'Frozen account — customs broker cannot be paid', brief: 'The operating account is frozen and a customs broker invoice must clear before cargo release.', clientName: 'Andrea Quirós', company: 'Pacific Freight CR', statement: 'The container is sitting at port because your freeze blocked the broker.' },
    { id: 'KH-1204', title: 'Unexpected hold on operating funds', brief: 'A compliance hold landed on the operating account without prior notice. Client has two urgent local transfers.', clientName: 'Diego Solís', company: 'Solís Construction Group', statement: 'Nobody warned me. I have crews waiting for materials.' }
  ],
  'KH-1051': [
    { id: 'KH-1211', title: 'Supplier wire stuck — factory shutdown risk', brief: 'A USD 86,000 wire to a critical supplier is held. The factory will stop if funds do not land today.', clientName: 'Helena Vargas', company: 'Vargas Textiles', statement: 'If that wire fails, the plant closes at 6 p.m.' },
    { id: 'KH-1212', title: 'Tax payment wire pending review', brief: 'A government tax wire is stuck in review. Late filing penalties start tomorrow morning.', clientName: 'Carlos Méndez', company: 'Méndez & Associates', statement: 'This is a tax payment. Penalties start at midnight.' },
    { id: 'KH-1213', title: 'Cross-border wire delayed — client contract at risk', brief: 'An international wire to fulfill a signed contract remains pending Level 2 review.', clientName: 'Patricia Núñez', company: 'Núñez Medical Imports', statement: 'We will breach the contract if this wire sits another day.' },
    { id: 'KH-1214', title: 'Emergency wire for spare parts', brief: 'A high-priority wire for spare parts is held. Production line downtime costs $4,000 per hour.', clientName: 'Roberto Castillo', company: 'Castillo Packaging', statement: 'Every hour this stays held costs us thousands.' }
  ],
  'KH-1064': [
    { id: 'KH-1221', title: 'Platinum card declined — board dinner', brief: 'VIP platinum card declined at a private club during a board dinner. Client demands director recovery.', clientName: 'Ignacio Porras', company: 'Porras Capital', statement: 'I was embarrassed in front of the board. Fix this tonight.' },
    { id: 'KH-1222', title: 'Card blocked abroad — no travel notice', brief: 'Corporate card blocked in Madrid with no travel notice on file. Client is already checked into the hotel.', clientName: 'Valeria Chacón', company: 'Chacón Advisory', statement: 'I am abroad and your card just failed at reception.' },
    { id: 'KH-1223', title: 'VIP card limit hit mid-purchase', brief: 'VIP card declined mid-purchase at a luxury retailer due to an outdated temporary limit.', clientName: 'Esteban Rojas', company: 'Rojas Family Office', statement: 'Raise the limit and make this right before I leave the store.' },
    { id: 'KH-1224', title: 'Declined card — private aviation deposit', brief: 'Obsidian card declined for a private aviation deposit. Client threatens to move the relationship.', clientName: 'Camila Jiménez', company: 'Jiménez Holdings', statement: 'If my aviation deposit fails, I will move my banking tomorrow.' }
  ],
  'KH-1084': [
    { id: 'KH-1231', title: 'Cash structuring pattern — branch deposits', brief: 'Internal alert: 41 cash deposits just under the reporting threshold across three branches.', clientName: 'Internal Review', company: 'Compliance Desk', statement: 'Internal-only case. Do not contact the client.' },
    { id: 'KH-1232', title: 'Repeated near-threshold cash activity', brief: 'Surveillance flagged repeated cash deposits of $9,800 over twelve business days.', clientName: 'Internal Review', company: 'Compliance Desk', statement: 'Classify, document and escalate without tipping off.' },
    { id: 'KH-1233', title: 'Structured deposits via related accounts', brief: 'Linked accounts show coordinated sub-threshold deposits that appear designed to avoid reporting.', clientName: 'Internal Review', company: 'Compliance Desk', statement: 'Treat as suspected structuring. No client outreach.' },
    { id: 'KH-1234', title: 'Placement alert — courier cash pattern', brief: 'Courier-delivered cash deposits form a placement pattern inconsistent with declared business activity.', clientName: 'Internal Review', company: 'Compliance Desk', statement: 'File the required report and escalate quietly.' }
  ],
  'KH-1090': [
    { id: 'KH-1241', title: 'Layering wires — rapid outbound transfers', brief: 'Client pushes for release of three rapid outbound wires that look like layering.', clientName: 'Natalia Espinoza', company: 'Espinoza Trading', statement: 'Release the wires now. I have counterparties waiting.' },
    { id: 'KH-1242', title: 'Complex transfer chain under review', brief: 'Funds moved through four accounts in 36 hours. Client insists the holds are discriminatory.', clientName: 'Marco Alfaro', company: 'Alfaro Logistics', statement: 'This is routine business. Stop delaying my money.' },
    { id: 'KH-1243', title: 'Outbound wire cluster — AML hold', brief: 'A cluster of outbound wires triggered an AML hold. Client demands immediate release language.', clientName: 'Silvia Brenes', company: 'Brenes Imports', statement: 'Tell me exactly when the money will move.' },
    { id: 'KH-1244', title: 'Suspicious pass-through transfers', brief: 'Pass-through transfers with thin economic purpose are held. Client is aggressive and persuasive.', clientName: 'Jorge Salazar', company: 'Salazar Ventures', statement: 'I need these transfers out today or I escalate publicly.' }
  ],
  'KH-1102': [
    { id: 'KH-1251', title: 'Expansion loan inquiry — new plant', brief: 'Client wants financing to open a second plant. Needs product fit and a clear proposal path.', clientName: 'Michelle Arias', company: 'Arias Foods', statement: 'We need a facility that actually matches a plant expansion.' },
    { id: 'KH-1252', title: 'Credit request for fleet upgrade', brief: 'Company requests credit for a logistics fleet upgrade and compares working capital versus expansion options.', clientName: 'Pablo Herrera', company: 'Herrera Transport', statement: 'Which facility fits a fleet purchase without choking cash flow?' },
    { id: 'KH-1253', title: 'Growth financing — regional rollout', brief: 'Client asks for structured growth financing to enter two new regional markets.', clientName: 'Laura Campos', company: 'Campos Retail Group', statement: 'We need a proposal we can take to our board next week.' },
    { id: 'KH-1254', title: 'Capex financing conversation', brief: 'Client explores capex financing for machinery. Requires discovery before any product promise.', clientName: 'Andrés Quesada', company: 'Quesada Metals', statement: 'Do not sell me the wrong product. Match the need first.' }
  ],
  'KH-1110': [
    { id: 'KH-1261', title: 'Credit file inconsistency — pressure to approve', brief: 'Internal credit case: cash-flow footnote conflicts with the application. Manager pressure to approve fast.', clientName: 'Internal Credit', company: 'Credit Risk Desk', statement: 'Document independently. Do not rubber-stamp.' },
    { id: 'KH-1262', title: 'Enhanced due diligence required', brief: 'Borrower file shows unexplained revenue spikes. Approval is being pushed by sales.', clientName: 'Internal Credit', company: 'Credit Risk Desk', statement: 'Pause, request EDD and escalate.' },
    { id: 'KH-1263', title: 'Related-party exposure in loan package', brief: 'Loan package hides related-party exposure in a footnote. Sales wants same-day approval.', clientName: 'Internal Credit', company: 'Credit Risk Desk', statement: 'Protect the bank. Escalate the inconsistency.' },
    { id: 'KH-1264', title: 'Incomplete collateral package', brief: 'Collateral schedule is incomplete and valuations are outdated, yet urgency language is intense.', clientName: 'Internal Credit', company: 'Credit Risk Desk', statement: 'Do not approve. Request missing evidence.' }
  ],
  'KH-1120': [
    { id: 'KH-1271', title: 'VIP travel collapse — same-night recovery', brief: 'Aviation booking failed hours before departure. VIP expects confirmed aviation and ground transport tonight.', clientName: 'Elena Marín', company: 'Marín Private Office', statement: 'I need a confirmed itinerary before midnight.' },
    { id: 'KH-1272', title: 'Concierge failure — awards gala travel', brief: 'Ground transport and lounge access failed before an awards gala. Client demands ownership and a verified plan.', clientName: 'Tomás Aguilar', company: 'Aguilar Media', statement: 'Own the failure and fix the full itinerary.' },
    { id: 'KH-1273', title: 'Missed connection recovery — VIP desk', brief: 'A missed connection left a VIP stranded. Needs aviation alternative plus hotel and car in one plan.', clientName: 'Isabel Fonseca', company: 'Fonseca Group', statement: 'One plan, confirmed, not three vague options.' },
    { id: 'KH-1274', title: 'Last-minute itinerary rebuild', brief: 'Vendor cancelled a charter. Client needs a rebuilt itinerary with lounge and ground transport confirmed.', clientName: 'Ricardo Peña', company: 'Peña Investments', statement: 'Rebuild everything and confirm each piece in writing.' }
  ]
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rewriteIds(node, fromId, toId, fromClientId, toClientId) {
  if (Array.isArray(node)) return node.map((item) => rewriteIds(item, fromId, toId, fromClientId, toClientId));
  if (!node || typeof node !== 'object') {
    if (typeof node === 'string') {
      return node
        .split(fromId).join(toId)
        .split(fromClientId).join(toClientId);
    }
    return node;
  }
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = rewriteIds(value, fromId, toId, fromClientId, toClientId);
  }
  return out;
}

const byId = new Map(pack.cases.map((item) => [item.id, item]));
const expanded = [...pack.cases];
const templateMap = {};

for (const [templateId, variants] of Object.entries(VARIANTS)) {
  const template = byId.get(templateId);
  if (!template) throw new Error('Missing template ' + templateId);
  templateMap[templateId] = templateId;
  for (const variant of variants) {
    const clone = deepClone(template);
    const fromClientId = template.client.id;
    const toClientId = 'KH-C' + variant.id.slice(-5);
    const rewritten = rewriteIds(clone, templateId, variant.id, fromClientId, toClientId);
    rewritten.id = variant.id;
    rewritten.title = variant.title;
    rewritten.brief = variant.brief;
    rewritten.clientStatement = variant.statement;
    rewritten.client.name = variant.clientName;
    rewritten.client.company = variant.company;
    rewritten.client.id = toClientId;
    rewritten.client.initials = variant.clientName.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    rewritten.templateId = templateId;
    expanded.push(rewritten);
    templateMap[variant.id] = templateId;
  }
}

pack.cases = expanded;
pack.version = '1.2.0-pool40';
pack.generatedAt = new Date().toISOString();
pack.templateMap = templateMap;

fs.writeFileSync(packPath, JSON.stringify(pack, null, 2));
fs.writeFileSync(path.join(root, 'kamuk-holdings-template-map.json'), JSON.stringify(templateMap, null, 2));
console.log('cases', pack.cases.length, 'bytes', Buffer.byteLength(JSON.stringify(pack)));
