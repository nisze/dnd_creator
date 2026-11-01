// Tela "Consultar talentos": busca e filtros sobre os talentos das fontes ligadas, sem precisar de um personagem.
const consultaT = { q: '', fonte: '', sem: false };
const _fonteTalento = (t) => String(t.fonte || '').replace(/\s*\n\s*/g, ', ');
const _temPrereqTalento = (t) => !!t.prerequisito || (t.conteudo || []).some(n => /^pr[eé]-?requisito/i.test(nomeDe(n)));
const _textoPrereqTalento = (t) => { const n = (t.conteudo || []).find(x => /^pr[eé]-?requisito/i.test(nomeDe(x))); return n ? String(descDe(n)).replace(/^pr[eé]-?requisito:?\s*/i, '') : ''; };

function talentosDaConsulta() {
    const q = normaliza(consultaT.q).trim();
    return (db.talentos || []).map((t, i) => ({ t, i })).filter(({ t }) => permitido(t)
        && (!consultaT.fonte || _fonteTalento(t) === consultaT.fonte) && (!consultaT.sem || !_temPrereqTalento(t))
        && (!q || normaliza(nomeDe(t) + ' ' + (t.nome_ingles || '') + ' ' + JSON.stringify(t.conteudo || '')).includes(q)))
        .sort((a, b) => normaliza(nomeDe(a.t)).localeCompare(normaliza(nomeDe(b.t))));
}
function htmlItemTalentoConsulta({ t, i }) {
    const pre = _textoPrereqTalento(t), fonte = _fonteTalento(t);
    return `<details class="mg-item" ontoggle="UI.consultaTalentoCorpo(this, ${i})"><summary><b>${esc(nomeDe(t))}</b><span class="mg-tags">${etiquetas(t)}</span>${t.nome_ingles && t.nome_ingles !== nomeDe(t) ? `<span class="meta">${esc(t.nome_ingles)}</span>` : ''}${pre ? `<span class="meta mg-resumo">Pré-requisito: ${esc(pre)}</span>` : ''}</summary>
        <div class="mg-corpo">${fonte ? `<p class="meta">Fonte: ${esc(fonte)}</p>` : ''}<div class="mg-texto">Carregando...</div></div></details>`;
}
function htmlListaConsultaTalentos() {
    const l = talentosDaConsulta();
    return `<p class="meta mg-cont">${l.length} talento(s)</p>${l.length ? l.map(htmlItemTalentoConsulta).join('') : '<p class="vazio">Nenhum talento encontrado. Livros desligados em Fontes de conteúdo escondem seus talentos.</p>'}`;
}
function htmlTelaConsultaTalentos() {
    const fontes = [...new Set((db.talentos || []).filter(permitido).map(_fonteTalento).filter(Boolean))].sort((a, b) => normaliza(a).localeCompare(normaliza(b)));
    const opt = (v, rot) => `<option value="${esc(v)}"${consultaT.fonte === v ? ' selected' : ''}>${esc(rot)}</option>`;
    return `<div class="cab-pers"><h2>Consultar talentos</h2></div>
    <div class="mg-filtros">
        <input type="search" class="mg-busca" placeholder="Buscar talento por nome ou texto..." aria-label="Buscar talento" value="${esc(consultaT.q)}" oninput="UI.consultaTalentoFiltrar('q', this.value)">
        <select aria-label="Fonte" onchange="UI.consultaTalentoFiltrar('fonte', this.value)">${opt('', 'Todas as fontes')}${fontes.map(f => opt(f, f)).join('')}</select>
        <label class="mg-chk"><input type="checkbox" ${consultaT.sem ? 'checked' : ''} onchange="UI.consultaTalentoFiltrar('sem', this.checked)"> Sem pré-requisito</label>
        <button type="button" class="sec mini" onclick="UI.consultaTalentoLimpar()">Limpar filtros</button>
    </div>
    <div id="lista-consulta-talentos" class="mg-lista">${htmlListaConsultaTalentos()}</div>`;
}

Object.assign(UI, {
    telaConsultaTalentos() { UI.subirAbortar(); ui.tela = 'consulta-talentos'; ui.confirmar = null; renderTudo(); window.scrollTo(0, 0); },
    consultaTalentoFiltrar(campo, v) { consultaT[campo] = v; const el = porId('lista-consulta-talentos'); if (el) el.innerHTML = htmlListaConsultaTalentos(); },
    consultaTalentoLimpar() { Object.assign(consultaT, { q: '', fonte: '', sem: false }); renderTudo(); },
    consultaTalentoCorpo(det, i) {
        if (!det.open) return; const box = det.querySelector('.mg-texto'); if (!box || box.dataset.pronto) return;
        const t = (db.talentos || [])[i];
        box.innerHTML = t ? ((t.conteudo || []).filter(n => nomeDe(n) || descDe(n)).map(n => `<h4>${esc(nomeDe(n) || '')}</h4><p>${paragrafos(descDe(n) || '')}</p>`).join('') || '<p class="vazio">Sem descrição.</p>') : '';
        box.dataset.pronto = '1';
    }
});
