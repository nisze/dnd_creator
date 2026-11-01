// Tela "Consultar magias": busca e filtros sobre todas as magias das fontes ligadas, sem precisar de um personagem.
const consulta = { q: '', nivel: '', escola: '', classe: '', ritual: false, conc: false };
const CLASSES_CONSULTA = ['Artificer', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
const _capMg = (s) => String(s || '').replace(/^./, c => c.toUpperCase());
const _nomeClasseMg = (en) => { const c = (db.classes || []).find(x => x.id === en.toLowerCase()); return c ? nomeDe(c) : en; };
const _rotuloNivelMg = (n) => n === 0 ? 'Truque' : n + 'º círculo';

function magiasDaConsulta() {
    const q = normaliza(consulta.q).trim();
    return (db.magias || []).filter(m => livroPermitido(m) && (!_ehUA(m) || config.ua)
        && (consulta.nivel === '' || m.nivel === +consulta.nivel) && (!consulta.escola || m.escola === consulta.escola)
        && (!consulta.classe || m.classes.includes(consulta.classe)) && (!consulta.ritual || m.ritual) && (!consulta.conc || m.concentracao)
        && (!q || normaliza(nomeMagia(m) + ' ' + m.nome).includes(q)))
        .sort((a, b) => a.nivel - b.nivel || normaliza(nomeMagia(a)).localeCompare(normaliza(nomeMagia(b))));
}
function htmlItemMagiaConsulta(m) {
    const t = _trMagia(m) || {}, r = resumoMagia(m);
    const tags = [_rotuloNivelMg(m.nivel), _capMg(ESCOLA_NOME_PT[m.escola] || m.escola)].map(x => `<span class="mg-tag">${esc(x)}</span>`).join('')
        + (m.ritual ? '<span class="mg-tag">Ritual</span>' : '') + (m.concentracao ? '<span class="mg-tag">Concentração</span>' : '') + (m.ua ? '<span class="mg-tag">UA</span>' : '');
    return `<details class="mg-item" ontoggle="UI.consultaTexto(this, '${esc(m.id)}')"><summary><b>${esc(nomeMagia(m))}</b><span class="mg-tags">${tags}</span><span class="meta mg-resumo">${esc(r.join(' · '))}</span></summary>
        <div class="mg-corpo"><p class="meta">Componentes: ${esc(t.componentes || m.componentes || '—')}</p><p class="meta">Classes: ${esc(m.classes.map(_nomeClasseMg).join(', ') || '—')} · ${esc(t._fonte || m.fonte || '')}</p><div class="mg-texto">Carregando...</div></div></details>`;
}
function htmlListaConsulta() {
    const l = magiasDaConsulta();
    return `<p class="meta mg-cont">${l.length} magia(s)</p>${l.length ? l.map(htmlItemMagiaConsulta).join('') : '<p class="vazio">Nenhuma magia encontrada. Livros desligados em Fontes de conteúdo escondem suas magias.</p>'}`;
}
function htmlTelaConsulta() {
    const opt = (v, rot, sel) => `<option value="${esc(v)}"${String(sel) === String(v) ? ' selected' : ''}>${esc(rot)}</option>`;
    return `<div class="cab-pers"><h2>Consultar magias</h2></div>
    <div class="mg-filtros">
        <input type="search" class="mg-busca" placeholder="Buscar magia pelo nome..." aria-label="Buscar magia" value="${esc(consulta.q)}" oninput="UI.consultaFiltrar('q', this.value)">
        <select aria-label="Nível" onchange="UI.consultaFiltrar('nivel', this.value)">${opt('', 'Todos os níveis', consulta.nivel)}${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => opt(n, _rotuloNivelMg(n), consulta.nivel)).join('')}</select>
        <select aria-label="Escola" onchange="UI.consultaFiltrar('escola', this.value)">${opt('', 'Todas as escolas', consulta.escola)}${Object.keys(ESCOLA_NOME_PT).map(e => opt(e, _capMg(ESCOLA_NOME_PT[e]), consulta.escola)).join('')}</select>
        <select aria-label="Classe" onchange="UI.consultaFiltrar('classe', this.value)">${opt('', 'Todas as classes', consulta.classe)}${CLASSES_CONSULTA.map(c => opt(c, _nomeClasseMg(c), consulta.classe)).join('')}</select>
        <label class="mg-chk"><input type="checkbox" ${consulta.ritual ? 'checked' : ''} onchange="UI.consultaFiltrar('ritual', this.checked)"> Ritual</label>
        <label class="mg-chk"><input type="checkbox" ${consulta.conc ? 'checked' : ''} onchange="UI.consultaFiltrar('conc', this.checked)"> Concentração</label>
        <button type="button" class="sec mini" onclick="UI.consultaLimpar()">Limpar filtros</button>
    </div>
    <div id="lista-consulta" class="mg-lista">${htmlListaConsulta()}</div>`;
}

Object.assign(UI, {
    telaConsulta() { UI.subirAbortar(); ui.tela = 'consulta'; ui.confirmar = null; renderTudo(); window.scrollTo(0, 0); },
    consultaFiltrar(campo, v) { consulta[campo] = v; const el = porId('lista-consulta'); if (el) el.innerHTML = htmlListaConsulta(); },
    consultaLimpar() { Object.assign(consulta, { q: '', nivel: '', escola: '', classe: '', ritual: false, conc: false }); renderTudo(); },
    async consultaTexto(det, id) {
        if (!det.open) return; const box = det.querySelector('.mg-texto'); if (!box || box.dataset.pronto) return;
        if (!db.magiasTexto) { try { db.magiasTexto = await carregarJSON('dados/magias_texto.json'); } catch (e) { box.textContent = 'Texto não disponível.'; return; } }
        const pt = Idioma.tr('magias', id), t = db.magiasTexto[id];
        box.textContent = pt && pt.descricao ? pt.descricao + (pt.em_niveis_superiores ? '\n\nEm Níveis Superiores. ' + pt.em_niveis_superiores : '') : (t ? t.descricao_en + (t.em_niveis_superiores_en ? '\n\nAt Higher Levels. ' + t.em_niveis_superiores_en : '') : 'Texto não disponível.');
        box.dataset.pronto = '1';
    }
});
