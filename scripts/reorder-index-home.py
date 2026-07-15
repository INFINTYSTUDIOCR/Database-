# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "index.html"
c = p.read_text(encoding="utf-8")

pricing_start = '<section class="pricing-section pricing-home-bridge" id="pricing">'
problem_start = '<section class="s-dark" id="problem">'
kpi_start = '<section class="kpi-section" id="kpis">'
trust_start = '<section class="trust-proof trust-proof--compact" id="trust-proof">'
ecosystem_start = '<section id="ecosystem"'
about_start = '<section id="about">'
stats_start = '<div class="stats-bar">'
para_marker = '</section>\n\n' + stats_start

def extract(start, end):
    i = c.find(start)
    if i < 0:
        raise SystemExit(f"missing: {start[:40]}")
    j = c.find(end, i)
    if j < 0:
        raise SystemExit(f"missing end after: {start[:40]}")
    return c[i:j], i, j

pricing, pi, pj = extract(pricing_start, '</section>\n\n' + stats_start)
problem_comparar, pci, pcj = extract(problem_start, ecosystem_start)
kpi_block, ki, kj = extract(kpi_start, trust_start)
trust_block, ti, tj = extract(trust_start, '</section>\n\n' + about_start)

trust_bar = '''<div class="trust-bar" id="trust-proof">
  <div class="trust-bar-inner">
    <span><strong>10 colocados documentados</strong> � piloto Municipalidad de Goicoechea 2021</span>
    <span class="trust-bar-proof">Informe de Labores 2022, p. 34 � cita municipal verificable</span>
    <a href="casos-de-exito.html">Ver caso oficial ?</a>
    <a href="hablemos.html?solicitar=nexora#consulta">Pedir demo Nexora</a>
  </div>
</div>

'''

# Remove: top pricing, problem_comparar, kpi, trust
out = []
out.append(c[:pi])
out.append(c[pj:pci])
out.append(c[pcj:ki])
out.append(c[tj + len('</section>\n\n'):])
new_c = ''.join(out)

insert = '</section>\n\n' + problem_comparar + trust_bar + kpi_block + pricing + '\n\n' + stats_start
if para_marker not in new_c:
    raise SystemExit('para marker not found')
new_c = new_c.replace(para_marker, insert, 1)

new_c = new_c.replace('revis� precios arriba', 'revis� precios')
new_c = new_c.replace(
    'y por primera vez <strong>control�s tu avance con KPIs reales</strong>, sin humo.',
    'con <strong>KPIs en tu portal</strong> cada semana.',
)

p.write_text(new_c, encoding="utf-8")
print("reordered", p)
