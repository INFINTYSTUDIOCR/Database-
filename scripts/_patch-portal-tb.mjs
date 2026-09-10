import { readFileSync, writeFileSync } from 'fs';

const portalPath = 'Infinity_Student_Portal.html';
let portal = readFileSync(portalPath, 'utf8');
const start = portal.indexOf('  // ── TRAINING BOOK');
const end = portal.indexOf('  // ── RECURSOS', start);
if (start < 0 || end < 0) {
  console.error('markers', start, end);
  process.exit(1);
}

const block = `  // ── TRAINING BOOK completo (Fases 1–3) · glosario secundario ──
  var tbStudentId = encodeURIComponent(s.id || s.code || '');
  var tbPortalUser = encodeURIComponent(((s.info && s.info.portalUser) || s.portalUser || '').toString().trim().toLowerCase());
  var tbEmbed = 'Infinity_Training_Book.html?embed=1&from=portal&studentId=' + tbStudentId + (tbPortalUser ? ('&portalUser=' + tbPortalUser) : '') + '&v=20260825full';
  var trainingBookHtml = ''
    +'<div class="card" style="padding:0;overflow:hidden;">'
    +'<div class="card-title" style="padding:12px 14px 8px;margin:0;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">'
    +'<span><i class="ti ti-book-2"></i> Training Book completo</span>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<a href="training-book/glosario/index.html" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="text-decoration:none;"><i class="ti ti-vocabulary"></i> Glosario</a>'
    +'<a href="'+tbEmbed+'" target="_blank" rel="noopener" class="btn btn-navy btn-sm" style="text-decoration:none;"><i class="ti ti-external-link"></i> Pantalla completa</a>'
    +'</div></div>'
    +'<p style="font-size:12px;color:var(--t2);line-height:1.5;margin:0 14px 10px;">Fase 1 Arquitectura (pronombres, verbos, tiempos), Fase 2 Expansión (conectores), Fase 3 Naturalidad — sin recortes. El glosario es práctica extra.</p>'
    +'<iframe title="Training Book completo — Infinity" src="'+tbEmbed+'" style="width:100%;height:min(82vh,900px);border:0;display:block;background:#132840;"></iframe>'
    +'</div>'
    +'<div id="simulation-onboarding-root"></div>'
    +'<div id="simulation-nexora-panel" class="card" style="margin-top:16px;">'
    +'<div class="card-title"><i class="ti ti-sparkles"></i> Nexora · Practice lab</div>'
    +'<p style="font-size:13px;line-height:1.55;color:var(--t2);margin:0 0 12px;">Misma experiencia que producción con <strong>Infinity Holdings Inc</strong>. Práctica real. <strong>No impacta</strong> tu score semanal.</p>'
    +'<div id="simulation-nexora-body"></div>'
    +'</div>';

`;

portal = portal.slice(0, start) + block + '\n' + portal.slice(end);
writeFileSync(portalPath, portal);
console.log('portal patched', portal.includes('Infinity_Training_Book.html'));
