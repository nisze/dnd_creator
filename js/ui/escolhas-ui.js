// Escolhas embutidas na página (sem janelas): listas com busca, aumento de atributo com +/- e talentos com pesquisa.
const LIMITE_SEM_BUSCA = 9;
const acharEscolha = (cat, id) => (charState[cat] ? getActiveChoices(charState[cat], nomeDe(charState[cat]), cat).find(c => c.id === id) : null);
const limiteDe = (c) => (typeof c.escolhaVal === 'number' ? c.escolhaVal : (parseInt(c.escolhaVal, 10) || 1));
const ehEscolhaDeMagia = (c) => String(c.id).startsWith('MAGIA-');
// Corta descrições longas só entre linhas (um corte no meio da frase não teria tradução).
function cortarDescricao(s, n) {
    s = String(s); if (s.length <= n) return s;
    const out = []; let t = 0;
    for (const l of s.split('\n')) { if (t >= n) break; out.push(l); t += l.length + 1; }
    return out.join('\n');
}
const caminhoLegivel = (c) => c.path.replace(/\[\d+\]/g, '').split(' > ').slice(1, -1).filter(p => !/^Nível \d+:?$/.test(p)).join(' > ');

function subItensHTML(no) {
    if (!no || !Array.isArray(no.conteudo)) return '';
    const nomes = no.conteudo.filter(s => nomeDe(s) && s.escolha === undefined && !foraDoNivel(s)).map(s => esc(nomeDe(s)) + (s.nivel ? ` <span class="nivel-tag">(nível ${s.nivel})</span>` : ''));
    return nomes.length ? `<div class="meta">Inclui: ${nomes.slice(0, 12).join(', ')}${nomes.length > 12 ? '...' : ''}</div>` : '';
}

function iconeOpcao(o) {
    if (o.magia) return htmlIcone(caminhoMagia(o.magia.id), o.exibir || o.nome, true);
    if (achaPericia(o.nome)) return htmlIcone(caminhoPericia(o.nome), o.nome, true);
    const en = o.node && (o.node.nome_ingles || o.nome); const p = en && caminhoPassivo(en);
    return p ? htmlIcone(p, o.nome, true) : '';
}

function linhaOpcao(cat, c, o, i, marcada, limite) {
    const tipo = limite === 1 ? 'radio' : 'checkbox';
    const pericia = achaPericia(o.nome) ? textoPericia(o.nome) : '';
    const desc = pericia || o.desc || '';
    const fonte = fonteDe(o);
    const longo = !!desc;
    return `<label class="opcao${marcada ? ' marcada' : ''}${o.bloqueado ? ' bloq' : ''}">
        <input type="${tipo}" name="op-${esc(c.id)}" ${marcada ? 'checked' : ''} ${o.bloqueado ? 'disabled' : ''} onclick="UI.marcar('${cat}','${esc(c.id)}',${i})">
        ${iconeOpcao(o)}
        <div class="corpo">
            <div class="titulo">${esc(o.exibir || o.nome)}${etiquetas(o)}${fonte ? `<span class="tag fonte">${esc(fonte)}</span>` : (o.fonteIndef ? '<span class="tag fonte">Fonte não identificada</span>' : '')}</div>
            ${o.bloqueado ? `<div class="motivo">Pré-requisito não atendido: ${esc(o.bloqueado)}</div>` : ''}
            ${o.conferir ? `<div class="conferir">Confira o pré-requisito: ${esc(o.conferir)}</div>` : ''}
            ${desc ? `<div class="texto${longo ? ' curto' : ''}">${paragrafos(desc)}</div>${longo ? '<button type="button" class="link" hidden onclick="UI.alternarTexto(this, event)">mais</button>' : ''}` : ''}
            ${o.node && !o.descDerivada ? subItensHTML(o.node) : ''}
            ${o.magia ? `<button type="button" class="link" onclick="UI.verMagia('${esc(o.magia.id)}', this, event)">Ver texto completo</button><div class="texto-magia" id="magia-${esc(o.magia.id)}" hidden></div>` : ''}
        </div>
    </label>`;
}

// Lista (com agrupamento por círculo para magias). `busca` filtra por nome e descrição.
function htmlOpcoes(cat, c, opcoes, busca) {
    const limite = limiteDe(c), sels = selecaoDe(cat, c.id); const q = normaliza(busca);
    const ok = (o) => !q || normaliza(o.nome + ' ' + (o.exibir || '') + ' ' + (o.desc || '') + ' ' + (o.magia ? o.magia.escola : '')).includes(q);
    const linhas = opcoes.map((o, i) => ({ o, i })).filter(x => ok(x.o));
    if (!linhas.length) return '<p class="vazio">Nenhuma opção encontrada.</p>';
    const marcada = (o) => sels.some(s => mesmaOpcao(o, s));
    if (c.node.magias || ehEscolhaDeMagia(c)) {
        // Uma aba por círculo (truques, 1º, 2º...), como guias do navegador.
        const grupos = {}; linhas.forEach(x => { const n = x.o.magia ? x.o.magia.nivel : 0; (grupos[n] = grupos[n] || []).push(x); });
        const niveis = Object.keys(grupos).map(Number).sort((a, b) => a - b);
        const guardada = (ui.abasMagia || {})[c.id], ativo = niveis.includes(guardada) ? guardada : niveis[0];
        const rotulo = (n) => n === 0 ? 'Truques' : n + 'º círculo';
        const abas = `<div class="abas-loja abas-magia" role="tablist">${niveis.map(n => { const nSel = grupos[n].filter(x => marcada(x.o)).length; return `<button type="button" role="tab" aria-selected="${n === ativo}" class="${n === ativo ? 'ativo' : ''}" onclick="UI.abaMagia('${esc(c.id)}', ${n})">${rotulo(n)} <span class="contagem">(${nSel ? nSel + '/' : ''}${grupos[n].length})</span></button>`; }).join('')}</div>`;
        return abas + `<div role="tabpanel">${grupos[ativo].map(x => linhaOpcao(cat, c, x.o, x.i, marcada(x.o), limite)).join('')}</div>`;
    }
    let h = '', ultimo = null;
    if (!linhas.some(x => x.o.grupo)) linhas.sort((a, b) => (a.o.bloqueado ? 1 : 0) - (b.o.bloqueado ? 1 : 0));
    linhas.forEach(x => { if (x.o.grupo && x.o.grupo !== ultimo) { h += `<div class="grupo-titulo">${esc(x.o.grupo)}</div>`; ultimo = x.o.grupo; } h += linhaOpcao(cat, c, x.o, x.i, marcada(x.o), limite); });
    return h;
}

const campoBusca = (c, placeholder) => `<div class="busca"><input type="search" placeholder="${esc(placeholder || 'Pesquisar...')}" value="${esc(ui.busca[c.id] || '')}" oninput="UI.buscar('${esc(c.id)}', this.value)" aria-label="Pesquisar"></div>`;

function htmlASI(cat, c) {
    const sels = selecaoDe(cat, c.id), s0 = sels[0];
    const modo = ui.asiModo[c.id] || (s0 && s0.talento ? 'talento' : 'atributos');
    const abas = `<div class="asi-modos"><button type="button" class="mini ${modo === 'atributos' ? '' : 'sec'}" onclick="UI.asiModo('${cat}','${esc(c.id)}','atributos')">Aumentar atributos</button><button type="button" class="mini ${modo === 'talento' ? '' : 'sec'}" onclick="UI.asiModo('${cat}','${esc(c.id)}','talento')">Escolher um talento</button></div>`;
    if (modo === 'talento') {
        const { opcoes } = opcoesDaEscolha(cat, c, c.id);
        return abas + htmlTalentoSplit(cat, c, opcoes);
    }
    const dist = ui.asi[c.id] || (s0 && s0.asi ? { ...s0.asi } : {});
    const salvo = charState.escolhas[cat][c.id]; delete charState.escolhas[cat][c.id];
    const finais = calcularAtributosFinais(); if (salvo) charState.escolhas[cat][c.id] = salvo;
    const total = Object.values(dist).reduce((t, v) => t + v, 0);
    const linhas = ATTR_NAMES.map(nome => {
        const k = ATTR_MAP_KEY[nome], add = dist[k] || 0, v = finais[k];
        return `<div class="asi-linha">${htmlIcone(caminhoAtributo(k), nome, true)}<span class="n">${esc(nome)}</span><button type="button" class="mini sec" ${add === 0 ? 'disabled' : ''} onclick="UI.asiAjustar('${cat}','${esc(c.id)}','${k}',-1)" aria-label="Diminuir ${esc(nome)}">-</button><span class="v">${v}${add ? ` <b style="color:var(--ouro-claro)">+${add}</b> = ${Math.min(20, v + add)}` : ''}</span><button type="button" class="mini sec" ${(total >= 2 || add >= 2 || v + add >= 20) ? 'disabled' : ''} onclick="UI.asiAjustar('${cat}','${esc(c.id)}','${k}',1)" aria-label="Aumentar ${esc(nome)}">+</button></div>`;
    }).join('');
    return abas + `<div class="desc">Distribua 2 pontos: +2 em um atributo ou +1 em dois atributos diferentes. Nenhum atributo passa de 20.</div>${linhas}<div class="contagem" style="margin-top:.4rem">${total === 2 ? 'Distribuição completa.' : 'Faltam ' + (2 - total) + ' ponto(s).'}</div>`;
}
const _filtroTalento = (o, q) => o.talento && (!q || normaliza(o.nome + ' ' + ((o.node && o.node.nome_ingles) || '') + ' ' + JSON.stringify((o.node && o.node.conteudo) || '')).includes(q));
function htmlOpcoesTalentos(cat, c, opcoes) {
    const sels = selecaoDe(cat, c.id), q = normaliza(ui.busca[c.id] || '');
    const linhas = opcoes.map((o, i) => ({ o, i })).filter(x => _filtroTalento(x.o, q));
    if (!linhas.length) return '<p class="vazio">Nenhum talento encontrado.</p>';
    linhas.sort((a, b) => (a.o.bloqueado ? 1 : 0) - (b.o.bloqueado ? 1 : 0));
    return linhas.map(x => linhaTalento(cat, c, x.o, x.i, sels.some(s => mesmaOpcao(x.o, s)))).join('');
}
const contagemTalentos = (c, opcoes) => { const q = normaliza(ui.busca[c.id] || ''); const n = opcoes.filter(o => _filtroTalento(o, q)).length; return q ? `${n} resultado(s)` : `${n} talentos disponíveis`; };
function linhaTalento(cat, c, o, i, marcada) {
    const fonte = fonteDe(o), id = esc(c.id);
    return `<label class="opcao${marcada ? ' marcada' : ''}${o.bloqueado ? ' bloq' : ''}" onmouseenter="UI.focarTalento('${cat}','${id}',${i})" onclick="UI.focarTalento('${cat}','${id}',${i})">
        <input type="radio" name="op-${id}" ${marcada ? 'checked' : ''} ${o.bloqueado ? 'disabled' : ''} onclick="UI.marcar('${cat}','${id}',${i})">
        <div class="corpo"><div class="titulo">${esc(o.nome)}${etiquetas(o)}${fonte ? `<span class="tag fonte">${esc(fonte)}</span>` : (o.fonteIndef ? '<span class="tag fonte">Fonte não identificada</span>' : '')}</div>${o.bloqueado ? `<div class="motivo">Pré-requisito não atendido: ${esc(o.bloqueado)}</div>` : ''}</div></label>`;
}
// Descrição completa do talento (painel ao lado da lista).
function htmlDescTalento(o) {
    if (!o) return '<p class="vazio">Passe o mouse ou clique em um talento para ler a descrição completa.</p>';
    const no = o.node || {}, fonte = fonteDe(o);
    const partes = (no.conteudo || []).filter(n => nomeDe(n) || descDe(n)).map(n => `<h4>${esc(nomeDe(n) || '')}</h4><p>${paragrafos(descDe(n) || '')}</p>`).join('');
    return `<h3>${esc(o.nome)}${etiquetas(o)}</h3>${no.nome_ingles ? `<p class="meta">${esc(no.nome_ingles)}</p>` : ''}${fonte ? `<p class="meta"><span class="tag fonte">${esc(fonte)}</span></p>` : ''}`
        + (o.bloqueado ? `<div class="aviso erro"><b>Pré-requisito não atendido</b>${esc(o.bloqueado)}</div>` : '') + (o.conferir ? `<div class="aviso info"><b>Confira o pré-requisito</b>${esc(o.conferir)}</div>` : '')
        + (partes || '<p class="vazio">Sem descrição.</p>');
}
const opcaoEmFocoTalento = (c, opcoes, sels) => { const i = (ui.focoTalento || {})[c.id]; if (i != null && opcoes[i]) return opcoes[i]; const s = sels[0]; return s && s.talento ? (opcoes.find(o => mesmaOpcao(o, s)) || s) : null; };
// Duas colunas: lista com pesquisa e, ao lado, a descrição completa do talento em foco.
const _opcoesTalentos = {};
function htmlTalentoSplit(cat, c, opcoes) {
    const id = esc(c.id); _opcoesTalentos[c.id] = opcoes;
    return `<div class="talentos-split"><div class="col-lista">${campoBusca(c, 'Pesquisar talento por nome ou texto...')}<div class="contagem" id="cont-${id}">${contagemTalentos(c, opcoes)}</div><div class="opcoes" id="lista-${id}" onmouseleave="UI.focarTalento('${cat}','${id}',null)">${htmlOpcoesTalentos(cat, c, opcoes)}</div></div>
        <div class="col-desc" id="desc-${id}">${htmlDescTalento(opcaoEmFocoTalento(c, opcoes, selecaoDe(cat, c.id)))}</div></div>`;
}
const resumoTalento = (no) => (no && Array.isArray(no.conteudo) ? no.conteudo.filter(n => !/^pr[eé]-?requisito/i.test(nomeDe(n))).map(n => (nomeDe(n) ? nomeDe(n) + ': ' : '') + descDe(n)).filter(Boolean).join('\n') : '');

function htmlEscolha(cat, c) {
    const limite = limiteDe(c), sels = selecaoDe(cat, c.id), feitas = sels.length;
    const completo = feitas >= limite || ehOpcional(c.node) && feitas > 0;
    const caminho = caminhoLegivel(c);
    const ehIdioma = typeof c.escolhaVal === 'string' && c.escolhaVal.toLowerCase().includes('idioma');
    let corpo;
    if (c.escolhaVal === 'ASI') corpo = htmlASI(cat, c);
    else if (c.escolhaVal === 'Talento') corpo = htmlTalentoSplit(cat, c, opcoesDaEscolha(cat, c, c.id).opcoes);
    else {
        const r = opcoesDaEscolha(cat, c, c.id);
        const buscavel = r.opcoes.length > LIMITE_SEM_BUSCA;
        corpo = (buscavel ? campoBusca(c, 'Pesquisar nesta lista...') : '') + `<div class="opcoes" id="lista-${esc(c.id)}"${ehIdioma ? ' data-lingua' : ''}>${htmlOpcoes(cat, c, r.opcoes, ui.busca[c.id])}</div>`
            + (r.notaPericia ? '<div class="aviso info"><b>Perícias repetidas</b> Uma perícia não pode ser escolhida duas vezes: as que você já tem (de classe, antecedente ou raça) não aparecem.</div>' : '')
            + (r.notaEspecializacao ? '<div class="aviso info"><b>Especialização</b> Só vale para perícias em que você já é proficiente. Defina as perícias antes.</div>' : '');
    }
    const escolhidas = feitas ? `<div class="resumo-lista"${ehIdioma ? ' data-lingua' : ''}>${sels.map((s, k) => `<span class="rem">${esc(ehEscolhaDeMagia(c) ? nomeMagiaTxt(s.nome) : (s.nome || s.Nome || s.texto))}<button type="button" class="x" onclick="UI.removerSelecao('${cat}','${esc(c.id)}',${k})" aria-label="Remover" title="Remover">&times;</button></span>`).join('')}</div>` : '';
    const justif = c.node.justificativa && feitas ? `<div class="justificativas">${sels.map((s, k) => `<label class="justificativa"><span>Por que <b>${esc(s.nome)}</b> combina com o personagem? <small>(opcional)</small></span><input type="text" maxlength="200" value="${esc((charState.justificativas || {})[s.nome] || '')}" placeholder="Ex.: aprendeu isso na vida que levava antes da aventura" oninput="UI.justificar('${cat}','${esc(c.id)}',${k},this.value)"></label>`).join('')}</div>` : '';
    return `<section class="bloco" id="bloco-${esc(c.id)}"><h3>${esc(nomeDe(c.node) || 'Escolha')}<span class="estado ${completo ? 'ok' : ''}">${ehOpcional(c.node) && !feitas ? 'Opcional' : `${feitas}/${limite}`}</span>${etiquetas(c.node)}</h3>
        ${caminho ? `<div class="caminho">${esc(caminho)}</div>` : ''}${descDe(c.node) ? `<div class="desc">${paragrafos(cortarDescricao(descDe(c.node), 700))}</div>` : ''}${corpo}${escolhidas}${justif}</section>`;
}

// Tasha: para cada característica que o livro troca, o jogador decide entre a original (Livro do Jogador) e a versão do Tasha.
function htmlOpcoesTasha(filtro) {
    const l = opcoesTasha().filter(p => !filtro || filtro(p));
    ui.tashaLista = l.map(p => p.chave);
    if (!l.length) return '';
    const detalhe = (n) => `<details class="tasha-det"><summary>${esc(nomeDe(n))}${n.nome_ingles && n.nome_ingles !== nomeDe(n) ? ` <small>(${esc(n.nome_ingles)})</small>` : ''}</summary>${descDe(n) ? `<p>${paragrafos(descDe(n))}</p>` : '<p class="vazio">Sem descrição.</p>'}</details>`;
    const par = (p, i) => `<div class="tasha-par"><div class="tasha-opcao${p.usa ? '' : ' sel'}"><label><input type="radio" name="tasha-${i}" ${p.usa ? '' : 'checked'} onchange="UI.tashaUsar(${i}, false)"> <b>Livro do Jogador:</b> ${esc(p.original.join(', '))}</label>${detalhe(p.nosOriginais[0])}</div>
        <div class="tasha-opcao${p.usa ? ' sel' : ''}"><label><input type="radio" name="tasha-${i}" ${p.usa ? 'checked' : ''} onchange="UI.tashaUsar(${i}, true)"> <b>Tasha:</b> ${esc(p.tasha.join(', '))}</label>${detalhe(p.nosTasha[0])}</div></div>`;
    return `<section class="bloco tasha-troca"><h3>Tasha: escolha qual versão usar</h3><p class="desc">O Tasha oferece versões alternativas de algumas características. Elas não substituem as do Livro do Jogador: você decide qual vale para este personagem.</p>${l.map(par).join('')}</section>`;
}

// Aumentos de +1 irmãos (humano variante, meio-elfo, "+1 em três atributos") são um de cada: ficam num bloco só. O +2 e o +1 seguinte continuam separados.
const _baseCaminho = (c) => c.path.slice(0, c.path.lastIndexOf(' > '));
const ehAumentoMais1 = (c) => c.escolhaVal === 'Atributo' && /^\s*\+1\b/.test(descDe(c.node));
function agruparAumentos(lista) {
    const out = [];
    lista.forEach(c => {
        if (!ehAumentoMais1(c)) { out.push({ c }); return; }
        const g = out.find(x => x.itens && _baseCaminho(x.itens[0]) === _baseCaminho(c));
        if (g) g.itens.push(c); else out.push({ itens: [c] });
    });
    return out.map(x => (x.itens && x.itens.length === 1) ? { c: x.itens[0] } : x);
}
function htmlGrupoAumentos(cat, itens) {
    const n = itens.length, ids = itens.map(c => esc(c.id)).join(',');
    const sels = itens.map(c => selecaoDe(cat, c.id)[0]).filter(Boolean), nomes = new Set(sels.map(s => s.nome));
    const disp = new Set(); itens.forEach(c => opcoesDaEscolha(cat, c, c.id).opcoes.forEach(o => disp.add(o.nome)));
    const completo = sels.length >= n;
    const linhas = ATTR_NAMES.map(nome => {
        const k = ATTR_MAP_KEY[nome], ck = nomes.has(nome), bloq = !ck && (completo || !disp.has(nome));
        return `<label class="opcao${ck ? ' marcada' : ''}${bloq ? ' bloq' : ''}"><input type="checkbox" ${ck ? 'checked' : ''} ${bloq ? 'disabled' : ''} onclick="UI.marcarAumento('${cat}','${ids}','${esc(nome)}')">${htmlIcone(caminhoAtributo(k), nome, true)}<div class="corpo"><div class="titulo">${esc(nome)}${ck ? '<span class="tag fonte">+1</span>' : ''}</div></div></label>`;
    }).join('');
    const desc = `+1 em ${n === 2 ? 'dois' : n} valores de habilidade diferentes, à sua escolha.`;
    return `<section class="bloco" id="bloco-${esc(itens[0].id)}"><h3>${esc(nomeDe(itens[0].node) || 'Aumento no Valor de Habilidade')}<span class="estado ${completo ? 'ok' : ''}">${sels.length}/${n}</span></h3><div class="desc">${esc(desc)}</div><div class="opcoes">${linhas}</div>${sels.length ? `<div class="resumo-lista">${sels.map(s => `<span class="rem">${esc(s.nome)}<button type="button" class="x" onclick="UI.marcarAumento('${cat}','${ids}','${esc(s.nome)}')" aria-label="Remover" title="Remover">&times;</button></span>`).join('')}</div>` : ''}</section>`;
}

// Todas as escolhas ativas de uma categoria (com filtro opcional).
function htmlEscolhasDe(cat, filtro, vazio) {
    if (!charState[cat]) return '';
    // "Outras versões (outras fontes)" só aparece quando algum dos livros dessas versões está ligado (ou já há escolha feita).
    const l = getActiveChoices(charState[cat], nomeDe(charState[cat]), cat).filter(c => (!filtro || filtro(c)) && !(ehGrupoOutrasFontes(c.node) && !selecaoDe(cat, c.id).length && !opcoesDaEscolha(cat, c, c.id).opcoes.length));
    const nome = cat === 'antecedente' && charState.antecedente.personalizado
        ? `<label class="justificativa nome-antecedente"><span><b>Nome do seu antecedente</b> <small>(opcional)</small></span><input type="text" maxlength="60" value="${esc(nomeAntecedentePersonalizado())}" placeholder="Ex.: Sacerdote Corrompido" oninput="UI.nomeAntecedente(this.value)"></label>` : '';
    return nome + (l.length ? agruparAumentos(l).map(g => g.itens ? htmlGrupoAumentos(cat, g.itens) : htmlEscolha(cat, g.c)).join('') : `<p class="vazio">${esc(vazio || 'Nenhuma escolha adicional.')}</p>`);
}

// O botão "mais" só aparece quando o texto realmente está cortado (itens ocultos são medidos quando o grupo abre).
function ajustarMais(raiz) {
    (raiz || document).querySelectorAll('.opcao .texto.curto').forEach(t => {
        if (t.offsetParent === null) return;
        const b = t.nextElementSibling; if (b && b.classList.contains('link')) b.hidden = t.scrollHeight <= t.clientHeight + 1;
    });
}

// Redesenha mantendo a posição de rolagem das listas e da página.
function redesenharEscolhas(idArea, gerar) {
    const area = porId(idArea); if (!area) return;
    const y = window.scrollY; const rolagens = {}; area.querySelectorAll('.opcoes').forEach(el => { rolagens[el.id] = el.scrollTop; });
    const foco = document.activeElement && document.activeElement.type === 'search' ? { v: document.activeElement.value, p: document.activeElement.selectionStart } : null;
    area.innerHTML = gerar();
    ajustarMais(area);
    Object.entries(rolagens).forEach(([id, t]) => { const el = porId(id); if (el) el.scrollTop = t; });
    if (foco) { const bs = area.querySelectorAll('input[type=search]'); const alvo = [...bs].find(b => b.value === foco.v); if (alvo) { alvo.focus(); alvo.setSelectionRange(foco.p, foco.p); } }
    window.scrollTo(0, y);
}
