// Tela "Consultar itens": duas guias (equipamento comum e itens mágicos), das fontes ligadas, agrupadas por categoria em listas que abrem e fecham; cada item é um cartão com imagem e descrição.
const consultaI = { aba: 'comuns', q: '', cat: '', fonte: '', raridade: '', mais: {}, abertos: {} };
const _RARIDADE_PT = { common: 'Comum', uncommon: 'Incomum', rare: 'Raro', 'very rare': 'Muito raro', legendary: 'Lendário', artifact: 'Artefato', varies: 'Varia' };
const _raridadeItem = (i) => (Idioma.atual === 'pt' ? _RARIDADE_PT[i.raridade] : null) || (i.raridade ? i.raridade.replace(/^./, c => c.toUpperCase()) : '');
const _fonteLoja = (i) => (i.cat === 'veneno' ? "Dungeon Master's Guide" : "Player's Handbook");
const _CATS_ITENS = [['', 'Todas as categorias']].concat(LOJA_CATS_UI.filter(c => c[0] !== 'todas'));
// Ícone de reserva por categoria, até haver a imagem do item (img/itens, mapeada em dados/icones.json por tools/gerar-icones.js).
const _ICO_ITEM = {
    arma: '<path d="M14.5 4l5.5-1-1 5.5L9 18.5l-3.5-3.5zM5.5 15L3 17.5l3.5 3.5L9 18.5M11 13l-2 2"/>',
    armadura: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 3v18"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    pacote: '<path d="M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2"/>',
    equipamento: '<path d="M7 7h10a2 2 0 0 1 2 2v10H5V9a2 2 0 0 1 2-2zM9 7V5a3 3 0 0 1 6 0v2M9 13h6"/>',
    ferramenta: '<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5L15 12l-3-3z"/>',
    montaria: '<path d="M4 18l2-8 5-3 3 2 4-1 2 3-3 2-2 5M8 18v3M14 18v3"/>',
    veneno: '<path d="M10 3h4M11 3v5l-5 9a3 3 0 0 0 2.6 4.5h6.8A3 3 0 0 0 18 17l-5-9V3M8 14h8"/>',
    magico: '<path d="M12 3l2.2 5.3L20 9l-4.4 3.8 1.4 5.7-5-3.2-5 3.2 1.4-5.7L4 9l5.8-.7z"/>'
};
const _svgItem = (cat) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${_ICO_ITEM[cat] || _ICO_ITEM.equipamento}</svg>`;
const _imgItem = (i) => { const it = (typeof ICONES !== 'undefined' && ICONES.itens) || {}, c = it[chaveIcone(i.nome_en || i.nome)] || (i.cat === 'magico' ? it['tipo_' + chaveIcone(i.grupo)] : null); return c ? `<img src="${encodeURI(c)}" alt="${esc(nomeItem(i))}" loading="lazy">` : _svgItem(i.cat); };

function _itensDaAba() {
    const lista = consultaI.aba === 'magicos' ? (db.magicos || []) : (db.loja || []).map(i => Object.assign({}, i, { fonte: _fonteLoja(i) }));
    return lista.filter(i => permitido(i));
}
function itensDaConsulta() {
    const q = normaliza(consultaI.q).trim(), magicos = consultaI.aba === 'magicos';
    return _itensDaAba().filter(i => (magicos || !consultaI.cat || i.cat === consultaI.cat) && (!consultaI.fonte || i.fonte === consultaI.fonte) && (!magicos || !consultaI.raridade || i.raridade === consultaI.raridade)
        && (!q || normaliza(i.nome + ' ' + i.nome_en + ' ' + (i.texto_en || i.desc_en || '')).includes(q)))
        .sort((a, b) => normaliza(a.nome).localeCompare(normaliza(b.nome)));
}
const _grupoConsulta = (i) => i.cat === 'magico'
    ? ((Idioma.atual === 'pt' && i.grupo_pt) || i.grupo || 'Item mágico')
    : ((_CATS_ITENS.find(c => c[0] === i.cat) || [0, 'Outros'])[1]);
function htmlItemConsulta(i) {
    const magico = i.cat === 'magico';
    const tags = magico ? [_raridadeItem(i), i.sint ? 'Requer sintonização' : ''] : [grupoLoja(i), i.custo_po != null ? fmtMoeda(i.custo_po) : '', i.peso_lb ? fmtPesoLoja(i.peso_lb) : ''];
    const corpo = magico ? ((Idioma.atual === 'pt' && i.texto_pt) || i.texto_en || '') : [resumoMecanico(i), (Idioma.atual === 'pt' && i.desc_pt) || i.desc_en || ''].filter(Boolean).join('\n');
    return `<article class="item-card" onclick="this.classList.toggle('aberto')" title="Clique para ver mais ou menos">
        <div class="item-img">${_imgItem(i)}</div>
        <h4 class="item-nome">${esc(nomeItem(i))}${etiquetas(i)}</h4>
        <p class="meta item-livro">${esc(i.fonte)}</p>
        ${tags.filter(Boolean).length ? `<p class="meta item-tags">${esc(tags.filter(Boolean).join(' · '))}</p>` : ''}
        <div class="item-desc">${corpo ? paragrafos(corpo) : '<span class="vazio">Sem descrição.</span>'}</div></article>`;
}
// Cada grupo mostra até 60 cartões por vez (os itens mágicos passam de 800); o contador do grupo é sempre o total.
const _CARTOES_POR_GRUPO = 60;
function htmlListaConsultaItens() {
    const l = itensDaConsulta();
    if (!l.length) return '<p class="meta mg-cont">0 item(ns)</p><p class="vazio">Nenhum item encontrado. Livros desligados em Fontes de conteúdo escondem seus itens.</p>';
    const grupos = new Map(); l.forEach(i => { const g = _grupoConsulta(i); if (!grupos.has(g)) grupos.set(g, []); grupos.get(g).push(i); });
    const ordem = consultaI.aba === 'magicos' ? [...grupos.keys()].sort((a, b) => normaliza(a).localeCompare(normaliza(b))) : _CATS_ITENS.map(c => c[1]).filter(n => grupos.has(n)).concat([...grupos.keys()].filter(n => !_CATS_ITENS.some(c => c[1] === n)));
    const abertos = !!consultaI.q || !!consultaI.cat || ordem.length === 1;
    return `<p class="meta mg-cont">${l.length} item(ns)</p>` + ordem.map(g => {
        const itens = grupos.get(g), cap = _CARTOES_POR_GRUPO + (consultaI.mais[g] || 0), resto = itens.length - cap;
        return `<details class="grupo-itens" data-grupo="${esc(g)}" ${abertos || consultaI.abertos[g] ? 'open' : ''} ontoggle="consultaI.abertos[this.dataset.grupo] = this.open"><summary>${esc(g)} <small class="meta">(${itens.length})</small></summary><div class="item-cards">${itens.slice(0, cap).map(htmlItemConsulta).join('')}</div>${resto > 0 ? `<p class="item-mais"><button type="button" class="sec mini" onclick="UI.consultaItemMais(this.closest('.grupo-itens').dataset.grupo)">Mostrar mais (${resto} restantes)</button></p>` : ''}</details>`;
    }).join('');
}
function htmlTelaConsultaItens() {
    const magicos = consultaI.aba === 'magicos';
    const fontes = [...new Set(_itensDaAba().map(i => i.fonte).filter(Boolean))].sort((a, b) => normaliza(a).localeCompare(normaliza(b)));
    const opt = (cur, v, rot) => `<option value="${esc(v)}"${cur === v ? ' selected' : ''}>${esc(rot)}</option>`;
    const raridades = [['', 'Todas as raridades']].concat(Object.keys(_RARIDADE_PT).map(k => [k, Idioma.atual === 'pt' ? _RARIDADE_PT[k] : k.replace(/^./, c => c.toUpperCase())]));
    const aba = (v, t) => `<button type="button" role="tab" aria-selected="${consultaI.aba === v}" class="${consultaI.aba === v ? 'ativo' : ''}" onclick="UI.consultaItemAba('${v}')">${t}</button>`;
    return `<div class="cab-pers"><h2>Consultar itens</h2></div>
    <div class="abas-loja" role="tablist">${aba('comuns', 'Itens')}${aba('magicos', 'Itens mágicos')}</div>
    <div class="mg-filtros">
        <input type="search" class="mg-busca" placeholder="Buscar item por nome ou texto..." aria-label="Buscar item" value="${esc(consultaI.q)}" oninput="UI.consultaItemFiltrar('q', this.value)">
        ${magicos ? '' : `<select aria-label="Categoria" onchange="UI.consultaItemFiltrar('cat', this.value)">${_CATS_ITENS.map(([v, t]) => opt(consultaI.cat, v, t)).join('')}</select>`}
        <select aria-label="Fonte" onchange="UI.consultaItemFiltrar('fonte', this.value)">${opt(consultaI.fonte, '', 'Todas as fontes')}${fontes.map(f => opt(consultaI.fonte, f, f)).join('')}</select>
        ${magicos ? `<select aria-label="Raridade" onchange="UI.consultaItemFiltrar('raridade', this.value)">${raridades.map(([v, t]) => opt(consultaI.raridade, v, t)).join('')}</select>` : ''}
        <button type="button" class="sec mini" onclick="UI.consultaItemLimpar()">Limpar filtros</button>
    </div>
    <div id="lista-consulta-itens" class="mg-lista">${htmlListaConsultaItens()}</div>`;
}

Object.assign(UI, {
    async telaConsultaItens() { UI.subirAbortar(); await carregarMagicos(); ui.tela = 'consulta-itens'; ui.confirmar = null; renderTudo(); window.scrollTo(0, 0); },
    consultaItemAba(v) { Object.assign(consultaI, { aba: v, cat: '', fonte: '', raridade: '', mais: {}, abertos: {} }); renderTudo(); },
    consultaItemFiltrar(campo, v) { consultaI[campo] = v; consultaI.mais = {}; const el = porId('lista-consulta-itens'); if (el) el.innerHTML = htmlListaConsultaItens(); },
    consultaItemMais(g) { consultaI.mais[g] = (consultaI.mais[g] || 0) + _CARTOES_POR_GRUPO; const el = porId('lista-consulta-itens'); if (el) el.innerHTML = htmlListaConsultaItens(); },
    consultaItemLimpar() { Object.assign(consultaI, { q: '', cat: '', fonte: '', raridade: '', mais: {}, abertos: {} }); renderTudo(); }
});
