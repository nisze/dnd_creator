// Equipamento inicial, inventário e loja, embutidos na etapa de escolhas.
const LOJA_CATS_UI = [['todas', 'Tudo'], ['arma', 'Armas'], ['armadura', 'Armaduras'], ['escudo', 'Escudos'], ['pacote', 'Pacotes de equipamento'], ['equipamento', 'Equipamento de aventura'], ['ferramenta', 'Ferramentas'], ['montaria', 'Montarias e veículos'], ['veneno', 'Venenos']];
const GRUPO_PT = { "Artisan's tools": 'Ferramentas de artesão', 'Gaming set': 'Jogos', 'Musical instrument': 'Instrumentos musicais', 'Miscellaneous': 'Outras ferramentas', 'Escudo': 'Escudos' };
const PROP_PT = { light: 'leve', finesse: 'acuidade', thrown: 'arremesso', 'two-handed': 'duas mãos', versatile: 'versátil', ammunition: 'munição', loading: 'recarga', heavy: 'pesada', reach: 'alcance', special: 'especial', range: 'distância', reload: 'recarga', 'burst fire': 'rajada' };
const traduzProp = (p) => String(p).replace(/burst fire|two-handed|[a-z]+/gi, (w) => PROP_PT[w.toLowerCase()] || w).replace(/^[a-zà-ú]/, (c) => c.toUpperCase());
const fmtMoeda = (po) => po >= 1 ? fmtPO(po) : po >= 0.1 ? Math.round(po * 10) + ' PP' : Math.round(po * 100) + ' PC';
const fmtPesoLoja = (lb) => lb ? String(lb).replace('.', ',') + ' lb' : '-';
const grupoLoja = (i) => GRUPO_PT[i.grupo] || i.grupo || '';
const rotuloEq = (r) => (Idioma.atual === 'pt' && db.equipPt && db.equipPt[r]) || r;
// Colunas da tabela: armas mostram o dano, armaduras e escudos a CA; o resto mostra os detalhes do item.
function colunasLoja(cat) {
    if (cat === 'arma') return ['Nome', 'Custo', 'Dano', 'Peso', 'Propriedades'];
    if (cat === 'armadura' || cat === 'escudo') return ['Nome', 'Custo', 'CA', 'Peso', 'Propriedades'];
    return ['Nome', 'Custo', 'Peso', 'Detalhes'];
}
function celulasLoja(i) {
    const m = i.mec || {};
    if (i.cat === 'arma') {
        const dano = m.dano ? m.dano + (m.tipo_dano ? ' ' + m.tipo_dano : '') : '-';
        return [dano, fmtPesoLoja(i.peso_lb), (m.propriedades || []).map(traduzProp).join(', ') || '-'];
    }
    if (i.cat === 'armadura' || i.cat === 'escudo') {
        const ca = i.cat === 'escudo' ? '+2' : `${m.ca}${m.dex === 'full' ? ' + Des' : m.dex === 'max2' ? ' + Des (máx. 2)' : ''}`;
        const props = [m.forca ? 'For ' + m.forca : '', m.furtividade_desv ? 'Furtividade em desvantagem' : ''].filter(Boolean).join('; ') || '-';
        return [ca, fmtPesoLoja(i.peso_lb), props];
    }
    return [fmtPesoLoja(i.peso_lb), String((Idioma.atual === 'pt' && i.desc_pt) || i.desc_en || '').slice(0, 160) || '-'];
}
function htmlLinhaLoja(i, s) {
    const semPreco = i.custo_po == null, caro = !semPreco && i.custo_po > s;
    const botao = semPreco ? '<span class="meta" title="Item sem preço de tabela: não pode ser comprado">Indisponível</span>'
        : `<button type="button" class="sec mini" ${caro ? 'disabled title="Saldo insuficiente"' : ''} onclick="UI.lojaComprar('${esc(i.id)}')">Comprar</button>`;
    return `<tr class="${semPreco ? 'sem-preco' : ''}"><td><b>${esc(nomeItem(i))}</b>${etiquetas(i)}</td><td>${semPreco ? '-' : esc(fmtMoeda(i.custo_po))}</td>${celulasLoja(i).map(c => `<td>${esc(c)}</td>`).join('')}<td>${botao}</td></tr>`;
}
function htmlLojaResultados() {
    const q = normaliza(ui.loja.q), cat = ui.loja.cat || 'arma';
    const lista = db.loja.filter(i => (cat === 'todas' || i.cat === cat) && permitido(i) && (!q || normaliza(i.nome + ' ' + i.nome_en).includes(q)));
    if (!lista.length) return '<p class="vazio">Nada encontrado.</p>';
    const s = ui.lojaFicha ? moedasEmPC(garantirFolha().moedas) / 100 : saldo(), secoes = new Map();
    lista.forEach(i => { const chave = i.cat + '|' + grupoLoja(i); if (!secoes.has(chave)) secoes.set(chave, []); secoes.get(chave).push(i); });
    return [...secoes.entries()].map(([chave, itens]) => {
        const colunas = colunasLoja(itens[0].cat);
        return `<h4 class="loja-grupo">${esc(chave.split('|')[1])} <small class="meta">(${itens.length})</small></h4><div class="tabela-rolagem"><table class="loja-tabela"><thead><tr>${colunas.map(c => `<th>${c}</th>`).join('')}<th></th></tr></thead><tbody>${itens.map(i => htmlLinhaLoja(i, s)).join('')}</tbody></table></div>`;
    }).join('');
}
function htmlLoja() {
    const cat = ui.loja.cat || 'arma';
    return `<div class="abas-loja" role="tablist">${LOJA_CATS_UI.map(([v, t]) => `<button type="button" role="tab" aria-selected="${v === cat}" class="${v === cat ? 'ativo' : ''}" onclick="UI.lojaCategoria('${v}')">${t}</button>`).join('')}</div>
        <div class="busca"><input type="search" id="busca-loja" placeholder="Buscar item (português ou inglês)..." value="${esc(ui.loja.q)}" oninput="UI.lojaBuscar(this.value)"></div><div id="loja-resultados">${htmlLojaResultados()}</div>`;
}

// Itens mágicos não têm preço: o mestre concede, então ficam fora da loja e valem em qualquer modo de equipamento.
function htmlMagicosResultados() {
    const q = normaliza(ui.magicosQ || '');
    const lista = (db.magicos || []).filter(i => permitido(i) && (!q || normaliza(i.nome + ' ' + i.nome_en).includes(q)));
    const linhas = lista.slice(0, 40).map(i => `<div class="loja-item"><div><b>${esc(nomeItem(i))}</b>${etiquetas(i)}<div class="meta">${esc((Idioma.atual === 'pt' && i.grupo_pt) || i.grupo || '')}${resumoMecanico(i) ? ' - ' + esc(resumoMecanico(i)) : ''}</div><div class="meta">${esc(String((Idioma.atual === 'pt' && i.desc_pt) || i.desc_en || '').slice(0, 260))}</div></div><button type="button" class="sec mini" onclick="UI.lojaComprar('${esc(i.id)}')">Adicionar</button></div>`).join('');
    return (linhas || '<p class="vazio">Nada encontrado.</p>') + (lista.length > 40 ? `<p class="meta">Mais ${lista.length - 40} itens: refine a busca.</p>` : '');
}
function htmlMagicos() {
    return `<div class="busca"><input type="search" id="busca-magicos" placeholder="Buscar item mágico (português ou inglês)..." value="${esc(ui.magicosQ || '')}" oninput="UI.magicoBuscar(this.value)"></div><div id="magicos-resultados">${htmlMagicosResultados()}</div>`;
}
const resumoMecanico = (i) => {
    const m = i.mec; if (!m) return '';
    if (m.categoria) return `${m.dano ? m.dano + ' ' + (m.tipo_dano || '') : m.dano_en}${m.versatil ? ' (versátil ' + m.versatil + ')' : ''} | ${m.categoria === 'simples' ? 'simples' : 'marcial'} | ${m.alcance === 'distancia' ? 'à distância' : 'corpo a corpo'}${m.propriedades && m.propriedades.length ? ' | ' + m.propriedades.join(', ') : ''}`;
    if (m.tipo === 'escudo') return 'CA +2';
    return `CA ${m.ca}${m.dex === 'full' ? ' + Des' : m.dex === 'max2' ? ' + Des (máx. 2)' : ''}${m.forca ? ' | For ' + m.forca : ''}${m.furtividade_desv ? ' | Furtividade em desvantagem' : ''}`;
};

function pendenciasEquipamento() {
    const p = []; const ei = charState.equipInicial;
    if (!charState.classe || !charState.antecedente || ei.modo !== 'equipamento') return p;
    equipInicialSincronizar(); const cfg = db.equipInicial[charState.classe.id]; if (!cfg) return p;
    cfg.grupos.forEach((g, gi) => {
        const e = ei.escolhas[gi] || {};
        if (g.escolha && e.op === undefined) { p.push({ rot: `Equipamento inicial: escolha uma opção no grupo ${gi + 1}`, etapa: 5, gi }); return; }
        const op = g.opcoes[g.escolha ? e.op : 0]; if (!op) return;
        op.itens.forEach((it, ii) => { if (it.ref || it.tipo === 'texto') return; const feitos = ((e.picks || {})[ii] || []).length; if (feitos < it.qtd) p.push({ rot: `Equipamento inicial: ${it.rotulo || 'arma'} (${feitos}/${it.qtd})`, etapa: 5, gi }); });
    });
    return p;
}

function controlesItemUI(i) {
    let h = '';
    if (i.efeito && i.efeito.variantes) h += `<select onchange="UI.invVariante(${i.id}, this.value)">${i.efeito.variantes.map((v, k) => `<option value="${k}"${(i.variante || 0) === k ? ' selected' : ''}>${esc(v.nome)}</option>`).join('')}</select>`;
    if (i.sint) h += `<label><input type="checkbox" ${i.sintonizado ? 'checked' : ''} onchange="UI.invSintonia(${i.id})"> sintonizado</label>`;
    if (i.mec && (i.mec.categoria || i.mec.tipo) && i.cat !== 'magico') h += `<select onchange="UI.invBonus(${i.id}, this.value)" title="Bônus mágico">${[0, 1, 2, 3].map(n => `<option value="${n}"${(i.bonus_magico || 0) === n ? ' selected' : ''}>${n ? '+' + n + ' mágico' : 'não mágico'}</option>`).join('')}</select>`;
    return h;
}

function htmlInventario() {
    const peso = charState.inventario.reduce((s, i) => s + (i.peso_lb || 0) * i.qtd, 0);
    const itens = charState.inventario.map(i => `<div class="inv-item"><span>${i.qtd > 1 ? i.qtd + 'x ' : ''}<b>${esc(nomeItem(i))}</b>${tagArmadura(i)}${etiquetas(i)}${i.mec ? ` <small class="meta">[${esc(resumoMecanico(i))}]</small>` : ''}${i.origem === 'inicial' ? ' <small class="meta">(inicial)</small>' : ''}</span><span style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">${controlesItemUI(i)}<button type="button" class="perigo mini" onclick="UI.invRemover(${i.id})">Remover</button></span></div>`).join('');
    return `<h4>Inventário</h4>${itens || '<p class="vazio">Vazio.</p>'}<p class="meta" style="text-align:right">Peso total: ${Math.round(peso * 10) / 10} lb${charState.inventario.some(i => i.sint) ? ` | Sintonizados: ${totalSintonizados()}/${MAX_SINTONIAS}` : ''}</p>`;
}

function htmlEquipamento() {
    if (!charState.classe || !charState.antecedente) return '<p class="vazio">Escolha a classe e o antecedente para definir o equipamento inicial.</p>';
    equipInicialSincronizar();
    const ei = charState.equipInicial, cfg = db.equipInicial[charState.classe.id], P = proficienciasEquip();
    if (cfg && ei.modo === 'ouro' && ei.ouro == null) ei.ouro = ouroInicialLimites().medio;
    const pendEq = new Set(pendenciasEquipamento().map(p => p.gi));
    let h = `<div class="bloco"><h3>Equipamento inicial${lojaAberta() ? ` <span class="saldo">Saldo: ${saldo().toFixed(2)} PO</span>` : ''}</h3>`;
    if (!cfg) h += '<p class="vazio">Sem equipamento inicial cadastrado para esta classe. Compre itens na loja da ficha.</p>';
    else {
        h += `<div style="margin:.4rem 0"><label style="margin-right:1.2rem"><input type="radio" name="eqmodo" ${ei.modo === 'equipamento' ? 'checked' : ''} onchange="UI.equipModo('equipamento')"> Equipamento da classe e do antecedente</label><label><input type="radio" name="eqmodo" ${ei.modo === 'ouro' ? 'checked' : ''} onchange="UI.equipModo('ouro')"> Ouro inicial (abre mão do equipamento da classe e do antecedente)</label></div>`;
        if (ei.modo === 'ouro') {
            const l = ouroInicialLimites(); if (ei.ouro == null) ei.ouro = l.medio;
            h += `<div>Ouro inicial da classe: <b>${l.cfg.dados}${l.cfg.mult > 1 ? ' x ' + l.cfg.mult : ''} PO</b> <button type="button" class="sec mini" onclick="UI.ouroRolar()">Rolar</button> <button type="button" class="sec mini" onclick="UI.ouroMedia()">Média</button> Valor: <input type="number" value="${ei.ouro}" min="${l.min}" max="${l.max}" style="width:6rem" onchange="UI.ouroDefinir(this.value)"> PO${equipDoAntecedente(charState.antecedente).ouro ? ` <small class="meta">+ ${equipDoAntecedente(charState.antecedente).ouro} PO do antecedente (somados)</small>` : ''}</div>`;
        } else {
            cfg.grupos.forEach((g, gi) => {
                const e = ei.escolhas[gi] || {};
                h += `<div class="bloco" style="margin:.4rem 0"${pendEq.has(gi) ? ' data-pendente' : ''}>`;
                g.opcoes.forEach((op, oi) => {
                    const lib = opcaoLiberada(op, P), sel = g.escolha ? e.op === oi : true;
                    h += `<div style="${lib ? '' : 'opacity:.55'}">${g.escolha ? `<label><input type="radio" name="eq-g${gi}" ${sel ? 'checked' : ''} ${lib ? '' : 'disabled'} onchange="UI.equipOpcao(${gi}, ${oi})"> ${esc(rotuloEq(op.rotulo))}${lib ? '' : ' <small class="motivo">(exige proficiência)</small>'}</label>` : `- ${esc(rotuloEq(op.rotulo))}`}`;
                    if (sel) op.itens.forEach((it, ii) => {
                        if (it.ref || it.tipo === 'texto') return;
                        const opts = opcoesPick(it), atual = ((e.picks || {})[ii]) || [];
                        for (let k = 0; k < it.qtd; k++) h += `<div style="margin:.25rem 0 .25rem 1.5rem"><small>${esc(it.rotulo || (it.cat === 'simples' ? 'Arma simples' : 'Arma marcial'))}${it.qtd > 1 ? ' ' + (k + 1) : ''}:</small> <select onchange="UI.equipPick(${gi}, ${ii}, ${k}, this.value)"><option value="">escolher...</option>${opts.map(o => `<option value="${esc(o.id)}" ${atual[k] === o.id ? 'selected' : ''}>${esc(nomeItem(o))}</option>`).join('')}</select></div>`;
                    });
                    h += '</div>';
                });
                h += '</div>';
            });
            const ant = equipDoAntecedente(charState.antecedente);
            h += `<p class="desc"><b>Do antecedente (${esc(nomeAntecedentePersonalizado() || nomeDe(charState.antecedente))}):</b> ${esc(((Idioma.atual === 'en' ? ant.itensEn : ant.itens) || ant.itens).join(', ') || 'nada')}${ant.ouro ? ` | <b>Moedas: ${ant.ouro} PO</b>` : ''}</p>`;
        }
    }
    equipInicialAplicar();
    h += '</div>' + `<div class="bloco" id="inv-area">${htmlInventario()}</div>`
        + '<p class="meta">Loja disponível na etapa da ficha.</p>'
        + `<details class="bloco" ${ui.aberto.magicos ? 'open' : ''} ontoggle="UI.magicosAbrir(this.open)"><summary><b>Itens mágicos concedidos pelo mestre</b> <small class="meta">(não têm preço)</small></summary>${ui.aberto.magicos ? htmlMagicos() : '<p class="meta">Abra para buscar itens.</p>'}</details>`;
    return h;
}
