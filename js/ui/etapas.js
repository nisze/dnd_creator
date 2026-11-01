// Conteúdo de cada etapa da criação: painel de informações (esquerda) e opções (direita).
// Imagens em img/races (jpg, 550x309) e img/classes (png), por id. Sem imagem, nao mostra nada.
const IMG_RACAS = new Set(['aarakocra','aasimar','astral-elf','autognome','boggart','bugbear','centaur','changeling','deep-gnome','dhampir','dragonborn','duergar','duskling','dwarf','eladrin','elf','fairy','firbolg','genasi','giff','githyanki','githzerai','gnome','goblin','goliath','hadozee','half-elf','half-orc','halfling','harengon','hexblood','hobgoblin','human','kalashtar','kender','kenku','kobold','leonin','lizardfolk','lorwyn-changeling','loxodon','lupin','minotaur','orc','owlin','plasmoid','reborn','satyr','sea-elf','shadar-kai','shifter','simic-hybrid','tabaxi','thri-kreen','tiefling','tortle','triton','vedalken','verdan','warforged','yuan-ti']), IMG_CLASSES = new Set(['artificer','barbarian','bard','blood-hunter','cleric','druid','fighter','illrigger','monk','paladin','ranger','rogue','sorcerer','warlock','wizard']);
// Ilustrações em PNG com nome livre (id da raça -> arquivo em img/races); viashino usa a arte genérica de Amonkhet.
const IMG_RACAS_ARQ = { custom: 'custon.png', aetherborn: 'aetherborn.png', aven: 'aven.png', 'glitchling-ua': 'glitchling (2).png', grung: 'grung.png', khenra: 'khenra.png', kor: 'kor.png', locathah: 'locathahrising.png', merfolk: 'merfolk.png', naga: 'naga.png', siren: 'siren.png', vampire: 'vampire.png', 'viashino-ua': 'amonkhet.png' };
const imagemDe = (x, tipo) => { if (!x || !x.id) return ''; if (tipo === 'classe') { const id = x.id.startsWith('ranger') ? 'ranger' : x.id; return IMG_CLASSES.has(id) ? 'img/classes/' + id + '.png' : ''; } const id = x.id, png = [id, id.replace(/-ua(-revised)?$/, '')].map(s => IMG_RACAS_ARQ[s]).find(Boolean); if (png) return 'img/races/' + encodeURI(png); const achou = [id, id.replace(/-ua(-revised)?$/, ''), id.split('-')[0]].find(s => IMG_RACAS.has(s)); return achou ? 'img/races/dnd-races-' + achou + '-550x309.jpg' : ''; };
const ilustracao = (x, tipo) => { const src = imagemDe(x, tipo); return src ? `<img class="ilustracao" src="${src}" alt="${esc(nomeDe(x))}" onerror="this.remove()">` : ''; };
const vazioInfo = (t) => `<p class="vazio">${esc(t)}</p>`;
const oculto = (f) => f.opcional && !charState.tasha;

function listaTracos(nos) {
    const itens = nos.filter(n => nomeDe(n) && !oculto(n)).map(n => `<li><b>${esc(nomeDe(n))}</b>${etiquetas(n)}${n.nivel ? ` <span class="nivel-tag">(nível ${n.nivel})</span>` : ''}${n.escolha !== undefined ? ' <span class="nivel-tag">(exige escolha)</span>' : ''}${descDe(n) ? ': ' + paragrafos(descDe(n)) : ''}</li>`);
    return itens.length ? `<ul class="detalhe-lista">${itens.join('')}</ul>` : '';
}
const cabecalhoInfo = (x, extra) => `<h2>${esc(nomeDe(x))}${etiquetas(x)}</h2>${fonteDe(x) ? `<p class="meta"><span class="tag fonte">${esc(fonteDe(x))}</span></p>` : ''}${extra || ''}`;
const avisoConteudo = (x) => (x.ua ? `<div class="aviso"><b>Conteúdo UA</b>${esc(textoUA())}</div>` : '') + (x.homebrew ? `<div class="aviso"><b>Conteúdo de terceiros</b>${esc(textoTerceiros())}</div>` : '');

function detalheRaca(r, naJanela) {
    if (!r) return vazioInfo('Passe o mouse ou clique em uma raça para ver os detalhes.');
    const fixos = r.conteudo.filter(n => n.escolha === undefined), escolhas = r.conteudo.filter(n => n.escolha !== undefined);
    return ilustracao(r, 'raca') + cabecalhoInfo(r, r.fonte ? `<p class="meta">Versão-base: ${esc(r.fonte)}</p>` : '') + avisoConteudo(r)
        + (descDe(r) ? `<p>${paragrafos(descDe(r))}</p>` : '')
        + '<h4>Características raciais</h4>' + listaTracos(fixos)
        + (escolhas.length ? `<h4>Escolhas adicionais</h4><ul class="detalhe-lista">${escolhas.filter(n => !oculto(n)).map(n => `<li><b>${esc(nomeDe(n))}</b>${descDe(n) ? ': ' + paragrafos(descDe(n)) : ''}</li>`).join('')}</ul>${naJanela ? '' : '<p class="meta">As escolhas aparecem ao lado depois que você selecionar a raça.</p>'}` : '');
}

function resumoConjuracao(c) {
    const b = db.conjuracao && db.conjuracao.classes[c.id]; const n = nivelAtual();
    if (!b) return '';
    if (b.magias_a_partir_do_nivel && n < b.magias_a_partir_do_nivel) return `<h4>Conjuração</h4><p>Começa no nível ${b.magias_a_partir_do_nivel}. Habilidade: ${esc(b.habilidade)}.</p>`;
    const slots = b.pacto ? `${b.pacto.espacos[n - 1]} espaço(s) de ${b.pacto.nivel_do_espaco[n - 1]}º círculo (Magia de Pacto)` : Object.entries(b.espacos ? b.espacos[n - 1] || {} : {}).map(([l, q]) => `${l}º: ${q}`).join(' | ') || 'nenhum ainda';
    return `<h4>Conjuração no nível ${n}</h4><ul class="detalhe-lista"><li><b>Habilidade:</b> ${esc(b.habilidade || '-')}</li><li><b>Truques:</b> ${b.truques ? b.truques[n - 1] : 0}</li><li><b>Espaços de magia:</b> ${esc(slots)}</li><li><b>Preparo:</b> ${b.preparacao === 'preparadas' ? 'prepara magias após cada descanso longo' : (b.grimorio_inicial ? 'grimório e magias preparadas' : 'magias conhecidas')}${b.ritual ? '; conjura rituais' : ''}</li></ul>`;
}

function detalheClasse(c) {
    if (!c) return vazioInfo('Passe o mouse ou clique em uma classe para ver os detalhes.');
    const n = nivelAtual();
    const niveis = c.conteudo.filter(ehNoDeNivel).sort((a, b) => nivelDoNode(a) - nivelDoNode(b));
    const base = c.conteudo.filter(x => !ehNoDeNivel(x) && x.escolha === undefined);
    const eq = c.equip || {};
    const ate = niveis.filter(x => nivelDoNode(x) <= n), depois = niveis.filter(x => nivelDoNode(x) > n);
    return ilustracao(c, 'classe') + cabecalhoInfo(c) + avisoConteudo(c) + (descDe(c) ? `<p>${paragrafos(descDe(c))}</p>` : '')
        + '<h4>Resumo</h4>' + listaTracos(base)
        + (eq.armaduras_en || eq.armas_en ? `<ul class="detalhe-lista"><li><b>Armaduras:</b> ${esc(eq.armaduras_en || 'nenhuma')}</li><li><b>Armas:</b> ${esc(eq.armas_en || 'nenhuma')}</li></ul>` : '')
        + resumoConjuracao(c)
        + `<h4>Características até o nível ${n}</h4>` + ate.map(x => `<details ${nivelDoNode(x) === n || nivelDoNode(x) === 1 ? 'open' : ''}><summary><b>Nível ${nivelDoNode(x)}</b></summary>${listaTracos(x.conteudo || [])}</details>`).join('')
        + (depois.length ? `<h4>Próximos níveis</h4><ul class="detalhe-lista">${depois.map(x => `<li><b>Nível ${nivelDoNode(x)}:</b> ${(x.conteudo || []).filter(f => !oculto(f)).map(f => esc(nomeDe(f))).join(', ') || '-'}</li>`).join('')}</ul>` : '');
}

function detalheSubclasse(o) {
    if (!o) return vazioInfo('Passe o mouse ou clique em uma subclasse para ver os detalhes.');
    const no = o.node || o, n = nivelAtual();
    const feats = (no.conteudo || []).filter(f => nomeDe(f) && !oculto(f)).sort((a, b) => (a.nivel || 0) - (b.nivel || 0));
    return cabecalhoInfo(no) + avisoConteudo(no) + (descDe(no) ? `<p>${paragrafos(descDe(no))}</p>` : '')
        + '<h4>Características por nível</h4><ul class="detalhe-lista">' + feats.map(f => `<li style="${f.nivel && f.nivel > n ? 'opacity:.6' : ''}"><b>${esc(nomeDe(f))}</b> <span class="nivel-tag">(nível ${f.nivel || '?'}${f.nivel && f.nivel > n ? ', ainda não liberada' : ''})</span>${descDe(f) ? ': ' + paragrafos(descDe(f)) : ''}</li>`).join('') + '</ul>';
}

function detalheAntecedente(a) {
    if (!a) return vazioInfo('Passe o mouse ou clique em um antecedente para ver os detalhes.');
    const per = (a.pericias_automaticas || []).map(p => `<li>${htmlIcone(caminhoPericia(p), p, true)} <b>${esc(p)}</b>: ${esc(textoPericia(p))}</li>`).join('');
    const extras = a.proficiencias_extras || [];
    return cabecalhoInfo(a) + avisoConteudo(a) + (descDe(a) ? `<p>${paragrafos(descDe(a))}</p>` : '')
        + '<h4>Perícias concedidas</h4>' + (per ? `<ul class="detalhe-lista">${per}</ul>` : '<p>Nenhuma fixa.</p>')
        + (extras.length ? '<h4>Proficiências e idiomas</h4>' + listaTracos(extras) : '')
        + (a.caracteristica ? `<h4>Característica</h4><ul class="detalhe-lista"><li><b>${esc(nomeDe(a.caracteristica))}</b>: ${paragrafos(descDe(a.caracteristica))}</li></ul>` : '')
        + ((a.equipamento_pt || a.equipamento_en) ? `<h4>Equipamento</h4><p>${esc(a.equipamento_pt || a.equipamento_en)}</p>` : '');
}

function infoAtributos() {
    return '<h2>Atributos</h2><p>Os seis atributos definem o que o personagem faz de melhor. Escolha um método de distribuição ao lado.</p><ul class="detalhe-lista">'
        + [['For', 'Força', 'Potência física: ataques corpo a corpo, Atletismo, carga.'], ['Des', 'Destreza', 'Agilidade e reflexos: ataques à distância, CA, iniciativa, Furtividade.'], ['Con', 'Constituição', 'Vigor: pontos de vida e concentração em magias.'], ['Int', 'Inteligência', 'Raciocínio e memória: magos, investigação.'], ['Sab', 'Sabedoria', 'Percepção e intuição: clérigos, druidas, patrulheiros.'], ['Car', 'Carisma', 'Força de personalidade: bardos, bruxos, feiticeiros, paladinos.']]
            .map(([k, n, t]) => `<li>${htmlIcone(caminhoAtributo(k), n, true)} <b>${n}</b>: ${t}</li>`).join('') + '</ul>'
        + '<h4>Métodos</h4><ul class="detalhe-lista"><li><b>Conjunto padrão:</b> 15, 14, 13, 12, 10 e 8, um valor para cada atributo.</li><li><b>Compra de pontos:</b> 27 pontos; valores de 8 a 15 com custo crescente (14 custa 7 e 15 custa 9).</li><li><b>Rolagem 4d6:</b> opcional; rola quatro dados, descarta o menor e soma. Os resultados são distribuídos como no conjunto padrão.</li><li><b>Manual:</b> sem regras, para mesas que definem os valores de outra forma.</li></ul><p class="meta">Os bônus de raça, de subclasse e de talentos são somados depois, sem custo.</p>';
}

// ---- Cartões ----
function cartao(tipo, i, nome, icone, selecionado, sub, extra) {
    return `<div class="cartao${selecionado ? ' selecionado' : ''}" tabindex="0" role="button" aria-pressed="${selecionado}" onclick="UI.selecionar('${tipo}', ${i}, event.detail)" onmouseenter="UI.focar('${tipo}', ${i})" onfocus="UI.focar('${tipo}', ${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();UI.selecionar('${tipo}', ${i});}">${icone}<span class="nome">${esc(nome)}${etiquetas(extra || {})}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div>`;
}
const campoBuscaLista = (tipo, ph) => `<div class="busca"><input type="search" id="busca-${tipo}" placeholder="${esc(ph)}" value="${esc(ui.busca[tipo] || '')}" oninput="UI.buscarLista('${tipo}', this.value)" aria-label="${esc(ph)}"><span class="contagem" id="cont-${tipo}"></span></div>`;

function indicesFiltrados(tipo) {
    const lista = ({ raca: db.racas, classe: db.classes, antecedente: db.antecedentes })[tipo]; const q = normaliza(ui.busca[tipo] || '');
    const out = []; lista.forEach((x, i) => { if (permitido(x) && (!q || normaliza(nomeDe(x) + ' ' + (x.nome_ingles || '')).includes(q))) out.push(i); });
    return out;
}
const gradeAtr = (tipo) => `<div class="grade grade-lista" onmouseleave="UI.desfocar('${tipo}')" onfocusout="if(!this.contains(event.relatedTarget))UI.desfocar('${tipo}')">`;
function htmlGrade(tipo) {
    const lista = ({ raca: db.racas, classe: db.classes, antecedente: db.antecedentes })[tipo]; const sel = charState[tipo];
    const idx = indicesFiltrados(tipo);
    if (!idx.length) return '<p class="vazio">Nada encontrado. Verifique a pesquisa e as fontes de conteúdo (livros, UA e terceiros).</p>';
    return gradeAtr(tipo) + idx.map(i => { const x = lista[i]; const ic = tipo === 'raca' ? caminhoRaca(nomeDe(x)) : tipo === 'classe' ? caminhoClasse(x.id) : caminhoAntecedente(x);
        return cartao(tipo, i, nomeDe(x), htmlIcone(ic, nomeDe(x)), sel === x, tipo === 'raca' ? (x.fonte || '') : (fonteDe(x) || ''), x); }).join('') + '</div>';
}

function htmlEtapaRaca() {
    const movel = ehMovel();
    return `<h2>Escolha da raça</h2><p class="desc">${movel ? 'Toque em uma raça para ver os detalhes e fazer as escolhas.' : 'Passe o mouse sobre um cartão para ler os detalhes à esquerda e clique para escolher.'}</p>${campoBuscaLista('raca', 'Pesquisar raça...')}<div id="grade-raca">${htmlGrade('raca')}</div>`
        + (charState.raca && !movel ? `<h3 style="margin-top:1rem">Escolhas da raça</h3><div id="area-escolhas">${htmlEscolhasDe('raca', null, 'Esta raça não exige escolhas adicionais.')}</div>` : '');
}
function htmlEtapaClasse() {
    return `<h2>Escolha da classe</h2>
        <div class="bloco">${charState.outras.length ? `<p><b>Classes:</b> ${esc(textoDasClasses())}</p><p class="desc">Este personagem tem mais de uma classe: os níveis sobem pela ficha, em "Subir de nível". Aqui se troca só a classe principal.</p>` : `<label><b>Nível inicial do personagem</b> <input type="number" min="1" max="20" value="${nivelAtual()}" style="width:5rem" onchange="UI.definirNivel(this.value)"></label>
        <p class="desc">O personagem é criado já neste nível. A subclasse é escolhida quando a classe a concede; antes disso você poderá escolher ao subir de nível.</p>`}</div>
        ${campoBuscaLista('classe', 'Pesquisar classe...')}<div id="grade-classe">${htmlGrade('classe')}</div>`;
}
function htmlEtapaSubclasse() {
    const info = subclasseInfo();
    if (!charState.classe) return '<h2>Subclasse</h2><div class="aviso info"><b>Escolha uma classe primeiro</b>A subclasse depende da classe.</div>';
    if (!info) return '<h2>Subclasse</h2><div class="aviso info"><b>Sem subclasse</b>Esta classe não tem subclasses neste conjunto de regras.</div>';
    const n = nivelAtual();
    let aviso = '', opcoes = [], sel = [];
    if (!info.liberada) {
        aviso = `<div class="aviso info"><b>Subclasse no nível ${info.nivel}</b>${esc(nomeDe(charState.classe))} escolhe a subclasse no nível ${info.nivel}, e o personagem está no nível ${n}. Você poderá escolher ao subir de nível. Clique em uma opção para ler o que ela faz.</div>`;
        opcoes = info.no.conteudo.map(o => ({ nome: nomeDe(o), node: o, ua: nodeEhUA(o), homebrew: nodeEhHomebrew(o) })).filter(permitido);
    } else {
        opcoes = opcoesDaEscolha('classe', info.escolha, info.escolha.id).opcoes; sel = selecaoDe('classe', info.escolha.id);
    }
    ui.subLista = opcoes;
    const grade = opcoes.length ? `<div class="grade grade-lista" onmouseleave="UI.desfocar('subclasse')" onfocusout="if(!this.contains(event.relatedTarget))UI.desfocar('subclasse')">` + opcoes.map((o, i) => `<div class="cartao${sel.some(s => mesmaOpcao(o, s)) ? ' selecionado' : ''}${info.liberada ? '' : ' bloqueado'}${!info.liberada && ui.subFixo === i ? ' lendo' : ''}" tabindex="0" role="button" onclick="UI.selecionar('subclasse', ${i}, event.detail)" onmouseenter="UI.focar('subclasse', ${i})" onfocus="UI.focar('subclasse', ${i})">${htmlIcone(caminhoSubclasse(o.node && o.node.id), o.nome)}<span class="nome">${esc(o.nome)}${etiquetas(o)}</span>${fonteDe(o) ? `<span class="sub">${esc(fonteDe(o))}</span>` : ''}</div>`).join('') + '</div>' : '<p class="vazio">Nenhuma subclasse disponível com as fontes de conteúdo atuais.</p>';
    return `<h2>Escolha da subclasse</h2>${aviso}${grade}`;
}
function htmlEtapaAntecedente() {
    return `<h2>Escolha do antecedente</h2>${campoBuscaLista('antecedente', 'Pesquisar antecedente...')}<div id="grade-antecedente">${htmlGrade('antecedente')}</div>`
        + (charState.antecedente && !ehMovel() ? `<h3 style="margin-top:1rem">Escolhas do antecedente</h3><div id="area-escolhas">${htmlEscolhasDe('antecedente', null, 'Este antecedente não exige escolhas adicionais.')}</div>` : '');
}

// ---- Atributos ----
function htmlEtapaAtributos() {
    const m = ui.metodo, base = charState.atributosBase, finais = calcularAtributosFinais();
    const botoes = [['compra', 'Compra de pontos'], ['padrao', 'Conjunto padrão'], ['rolagem', 'Rolagem 4d6 (opcional)'], ['manual', 'Manual (sem regras)']].map(([k, t]) => `<button type="button" class="${m === k ? 'ativo' : ''}" onclick="UI.metodoAtributos('${k}')">${t}</button>`).join('');
    let topo = '';
    if (m === 'compra') { const gasto = pontosGastos(base); topo = `<div class="pontos">Pontos restantes: <b>${PONTOS_COMPRA - gasto}</b> de ${PONTOS_COMPRA}</div>`; }
    if (m === 'padrao') topo = `<div class="desc">Clique em um valor sob cada atributo (${CONJUNTO_PADRAO.join(', ')}). Valores já usados ficam escurecidos; clicar em outro valor libera o anterior, e clicar num valor usado em outro atributo troca os dois.</div>`;
    if (m === 'rolagem') topo = `<div class="desc">Role 4d6 e descarte o menor dado, seis vezes. Os resultados já entram nos atributos na ordem em que saíram; clique em outro valor sob um atributo para trocá-los de lugar.</div><button type="button" onclick="UI.rolarAtributos()">${ui.rolagens.length ? 'Rolar novamente' : 'Rolar os seis valores'}</button><div class="dados-rolados">${ui.rolagens.map(v => `<span>${v}</span>`).join('')}</div>`;
    if (m === 'manual') topo = '<div class="aviso"><b>Sem regras</b>Os valores são livres (3 a 20). Use apenas se o mestre definir os atributos de outra forma.</div>';
    const personalizada = racaPersonalizada(), bonusR = charState.bonusRacial || {};
    const caixaTasha = !charState.raca ? '' : humanoSemTasha()
        ? '<div class="aviso info"><b>Regra de Tasha</b>Humano Padrão e Humano Variante não mudam de atributos com a regra de Tasha: o Padrão continua com +1 em tudo e o Variante com +1 em dois atributos diferentes à sua escolha.</div>'
        : `<label class="opcao-tasha"><input type="checkbox" ${personalizada ? 'checked' : ''} onchange="UI.origemPersonalizada(this.checked)"> <b>Usar a regra de Tasha</b> (Customizing Your Origin): trocar os bônus de atributo da raça por +2 em um atributo e +1 em outro, ou +1 em três atributos diferentes.</label>`;
    const avisoRaca = !charState.raca ? '' : personalizada
        ? `<div class="aviso ${bonusRacialCompleto() ? 'info' : ''}"><b>Bônus livre no lugar dos de ${esc(nomeDe(charState.raca))}</b>Use os botões +2 e +1 de cada atributo: um +2 e um +1 em atributos diferentes, ou três +1 em atributos diferentes. Nenhum atributo passa de 20. ${bonusRacialCompleto() ? 'Distribuição completa.' : 'Faltam pontos a distribuir.'}</div>`
        : `<div class="aviso info"><b>Bônus fixos da raça</b>Valem os bônus de atributo de ${esc(nomeDe(charState.raca))} (aparecem em "Bônus de raça e origem" em cada atributo), como no Livro do Jogador.</div>`;
    const pool = m === 'padrao' ? CONJUNTO_PADRAO : (m === 'rolagem' ? ui.rolagens : null);
    const cards = ATTR_NAMES.map(nome => {
        const k = ATTR_MAP_KEY[nome]; const atribuido = pool ? ui.pad[k] : base[k];
        const final = finais[k], bonus = final - (atribuido == null ? base[k] : atribuido);
        const valorTxt = atribuido == null ? '-' : atribuido;
        const valorBase = pool
            ? `<div class="valor-base"><span>${valorTxt}</span></div><div class="chips-valor">${pool.length ? pool.map((v, i) => { const dono = Object.keys(ui.padIdx).find(x => ui.padIdx[x] === i); return `<button type="button" class="chip-valor${dono === k ? ' sel' : dono ? ' usado' : ''}" aria-pressed="${dono === k}" onclick="UI.valorAtributo('${k}', ${i})">${v}</button>`; }).join('') : '<small>Role os dados primeiro.</small>'}</div>`
            : `<div class="valor-base"><button type="button" class="sec" onclick="UI.atributo('${k}', -1)" aria-label="Diminuir ${esc(nome)}">-</button><span>${valorTxt}</span><button type="button" class="sec" onclick="UI.atributo('${k}', 1)" aria-label="Aumentar ${esc(nome)}">+</button></div>`;
        const botoesRaca = personalizada ? `<div class="bonus-racial"><button type="button" class="${bonusR[k] === 2 ? 'ativo' : ''}" aria-pressed="${bonusR[k] === 2}" onclick="UI.bonusRacial('${k}', 2)">+2</button><button type="button" class="${bonusR[k] === 1 ? 'ativo' : ''}" aria-pressed="${bonusR[k] === 1}" onclick="UI.bonusRacial('${k}', 1)">+1</button></div>` : '';
        return `<div class="attr"${atribuido == null ? ' data-pendente' : ''}><div class="cabeca">${htmlIcone(caminhoAtributo(k), nome, true)}<h3>${esc(nome)}</h3></div>
            ${valorBase}${botoesRaca}
            ${m === 'compra' ? `<div class="linha"><span>Custo</span><span>${custoCompra(base[k])}</span></div>` : ''}
            <div class="linha"><span>Bônus de raça e origem</span><span>${bonus ? sinal(bonus) : '0'}</span></div>
            <div class="linha"><span>Valor final</span><span class="final">${atribuido == null ? '-' : final}</span></div>
            <div class="linha"><span>Modificador</span><span class="mod">${atribuido == null ? '-' : sinal(getMod(final))}</span></div></div>`;
    }).join('');
    return `<h2>Distribuição de atributos</h2><div class="metodos">${botoes}</div>${topo}${caixaTasha}${avisoRaca}<div class="attr-grade">${cards}</div><p class="meta" id="aviso-atributo"></p>`;
}

// ---- Escolhas restantes e equipamento ----
function pendenciasGerais() {
    const l = [];
    const nomes = { raca: ['Raça', 0], classe: ['Classe', 5], antecedente: ['Antecedente', 3] };
    ['raca', 'classe', 'antecedente'].forEach(cat => { const filtro = cat === 'classe' ? (c => !ehEscolhaDeSubclasse(c)) : null; escolhasPendentes(cat, filtro).forEach(p => l.push({ rot: `${nomes[cat][0]}: ${nomeDe(p.c.node)} (${p.feitas}/${p.limite})`, etapa: nomes[cat][1] })); });
    const sub = subclasseInfo(); if (sub && sub.liberada && !selecaoDe('classe', sub.escolha.id).length) l.push({ rot: 'Subclasse não escolhida', etapa: 2 });
    return l;
}
function htmlEtapaEscolhas() {
    const pend = pendenciasGerais().concat(pendenciasEquipamento());
    const conj = charState.classe ? semMagias(conjuracaoAtual) : null;
    return `<h2>Perícias, magias e equipamento</h2>
        <div id="resumo-pend">${htmlResumoPendencias(pend)}</div>
        <h3>Escolhas da classe</h3>${htmlOpcoesTasha()}<div id="area-escolhas-classe">${htmlEscolhasDe('classe', c => !ehEscolhaDeSubclasse(c) && !ehEscolhaDeMagia(c), 'Sem escolhas adicionais de classe neste nível.')}</div>
        <h3 style="margin-top:1.2rem">Magias</h3>${conj && conj.habilidade ? `<p class="desc">Habilidade de conjuração: ${esc(Object.keys(ATR_CHAVE).find(k => ATR_CHAVE[k] === conj.habilidade))}. Espaços de magia: ${esc(Object.entries(conj.slots || {}).map(([l, q]) => l + 'º: ' + q).join(' | ') || 'nenhum')}.</p>` : ''}
        <div id="area-magias">${htmlEscolhasDe('classe', ehEscolhaDeMagia, 'Esta classe não escolhe magias neste nível.')}</div>
        <h3 style="margin-top:1.2rem">Equipamento</h3><div id="area-equip">${htmlEquipamento()}</div>`;
}
function htmlResumoPendencias(pend) {
    if (!pend.length) return '<div class="aviso info"><b>Tudo definido</b>Não há escolhas pendentes. Você pode continuar.</div>';
    return `<div class="aviso erro"><b>Ainda falta decidir</b><ul style="margin:.3rem 0 0 1rem;padding:0">${pend.map(p => `<li>${esc(p.rot)} <button type="button" class="link" onclick="UI.irEtapa(${p.etapa})">${p.etapa === 5 ? 'abaixo' : 'ir para a etapa'}</button></li>`).join('')}</ul></div>`;
}

// ---- Revisão ----
// Ouro com que o personagem sai da criação: ouro do antecedente (+ ouro inicial da classe, se abriu mão do equipamento) menos as compras; vai para as moedas da ficha.
function htmlResumoOuro() {
    const ei = charState.equipInicial, ant = equipDoAntecedente(charState.antecedente).ouro, inicial = ei.modo === 'ouro' ? (ei.ouro || 0) : 0, gasto = gastoCompras();
    if (!ant && !inicial && !gasto) return '';
    const partes = [ant ? `${ant} PO do antecedente` : '', inicial ? `${ant ? '+ ' : ''}${inicial} PO de ouro inicial da classe` : '', gasto ? `- ${Math.round(gasto * 100) / 100} PO gastos na loja` : ''].filter(Boolean);
    return `<p><b>Ouro inicial: ${saldo().toFixed(2).replace(/\.00$/, '')} PO</b> <small class="meta">(${partes.join(' ')}) - vai para as moedas da ficha.</small></p>`;
}
function htmlFichaResumo(somenteLeitura) {
    let calc;
    try { calc = calcularPersonagem(); } catch (e) { return `<div class="aviso erro"><b>Não foi possível calcular a ficha</b>${esc(e.message)}</div>`; }
    const { atributos, mods, profBonus, periciasTreinadas, especializadas, salvaguardas, ataques, ca, pv, desl } = calc;
    const sub = subclasseInfo(); const subSel = sub && sub.liberada ? selecaoDe('classe', sub.escolha.id)[0] : null;
    const tabela = ATTR_NAMES.map(nome => { const k = ATTR_MAP_KEY[nome]; return `<li><b>${esc(nome)}</b> ${atributos[k]} (${sinal(mods[k])})</li>`; }).join('');
    const pericias = PERICIAS.map(p => { const tr = periciasTreinadas.includes(p.nome), esp = especializadas.includes(p.nome); const v = mods[p.attr] + (tr ? profBonus * (esp ? 2 : 1) : calc.bonusMeio(p.attr)); return `<li>${tr ? '<b>' : ''}${esc(p.nome)}${tr ? '</b>' : ''} ${sinal(v)}${esp ? ' (especialista)' : ''}</li>`; }).join('');
    const salvas = ATTR_NAMES.map(nome => { const k = ATTR_MAP_KEY[nome], pr = salvaguardas.includes(nome); return `<li>${pr ? '<b>' : ''}${esc(nome)}${pr ? '</b>' : ''} ${sinal(mods[k] + (pr ? profBonus : 0) + calc.bonusSalva)}${pr ? ' (proficiente)' : ''}</li>`; }).join('');
    const conj = semMagias(conjuracaoAtual);
    const magiasSel = Object.entries(charState.escolhas.classe).filter(([k]) => k.startsWith('MAGIA-')).map(([k, v]) => `<li><b>${esc(k.replace('MAGIA-', ''))}:</b> ${v.selecionados.map(s => esc(k.startsWith('MAGIA-') ? nomeMagiaTxt(s.nome) : s.nome)).join(', ')}</li>`).join('');
    const caracs = nodesAtivos('classe').filter(n => nomeDe(n) && n.escolha === undefined && !ehNoDeNivel(n) && !/^(Dado de Vida|Testes de Resist)/.test(nomeDe(n))).map(n => esc(nomeDe(n))); const caracsRaca = nodesAtivos('raca').filter(n => nomeDe(n) && n.escolha === undefined).map(n => esc(nomeDe(n)));
    const caracAnt = caracteristicaDoAntecedente(), perso = resumoAntecedentePersonalizado();
    return `<div class="revisao">
        <div class="cartao-ficha"><h3>Identidade</h3><ul><li><b>Raça:</b> ${esc(nomeDe(charState.raca))}</li><li><b>Classe:</b> ${esc(nomeDe(charState.classe))} ${calc.nivel}${subSel ? ' (' + esc(subSel.nome) + ')' : ''}</li><li><b>Antecedente:</b> ${esc(nomeAntecedente())}</li><li><b>Nível:</b> ${calc.nivel} | <b>Bônus de proficiência:</b> ${sinal(profBonus)}</li></ul></div>
        <div class="cartao-ficha"><h3>Combate</h3><ul><li><b>Pontos de vida:</b> <span class="grande">${calc.maxPV}</span> (dado de vida d${pv.niveis[0] ? pv.niveis[0].dado : '?'}; valor fixo por nível após o 1º)</li><li><b>Classe de Armadura:</b> <span class="grande">${ca.final}</span><br><small>Base: ${esc(ca.metodo)}${ca.bonus.length ? '<br>Bônus: ' + ca.bonus.map(b => esc(b.fonte) + ' ' + sinal(b.valor)).join('; ') : ''}</small></li><li><b>Iniciativa:</b> ${sinal(calc.iniciativa)}</li><li><b>Deslocamento:</b> ${desl.metros} m (${desl.pes} pés)</li></ul></div>
        <div class="cartao-ficha"><h3>Atributos</h3><ul>${tabela}</ul></div>
        <div class="cartao-ficha"><h3>Salvaguardas</h3><ul>${salvas}</ul></div>
        <div class="cartao-ficha"><h3>Perícias</h3><ul style="columns:2">${pericias}</ul></div>
        <div class="cartao-ficha"><h3>Ataques</h3><ul>${ataques.map(a => `<li><b>${esc(a.nome)}</b> ${sinal(a.bonus)} | ${esc(a.dano)}</li>`).join('')}</ul></div>
        ${conj && conj.habilidade ? `<div class="cartao-ficha largo"><h3>Magias</h3><ul><li><b>Habilidade:</b> ${esc(Object.keys(ATR_CHAVE).find(k => ATR_CHAVE[k] === conj.habilidade))} | <b>CD:</b> ${8 + profBonus + mods[conj.habilidade]} | <b>Ataque:</b> ${sinal(profBonus + mods[conj.habilidade])}</li><li><b>Espaços:</b> ${esc(Object.entries(conj.slots || {}).map(([l, q]) => l + 'º: ' + q).join(' | ') || '-')}</li>${magiasSel}</ul></div>` : ''}
        <div class="cartao-ficha largo"><h3>Características</h3><p><b>Raça:</b> ${caracsRaca.join(', ') || '-'}</p><p><b>Classe:</b> ${caracs.join(', ') || '-'}</p>${caracAnt ? `<p><b>Antecedente:</b> ${esc(nomeDe(caracAnt))}</p>` : ''}</div>
        ${perso ? `<div class="cartao-ficha largo"><h3>Antecedente personalizado</h3><ul>${perso.caracteristica ? `<li><b>${esc(perso.caracteristica)}</b>${perso.motivoCaracteristica ? ': ' + esc(perso.motivoCaracteristica) : ''}</li>` : ''}${perso.pericias.map(p => `<li><b>${esc(p.nome)}</b>${p.motivo ? ': ' + esc(p.motivo) : ''}</li>`).join('')}${perso.outros.length ? perso.outros.map(p => `<li><b>${esc(p.nome)}</b>${p.motivo ? ': ' + esc(p.motivo) : ''}</li>`).join('') : ''}${perso.equipamentoDe ? `<li><b>Equipamento de:</b> ${esc(perso.equipamentoDe)}</li>` : ''}</ul></div>` : ''}
        <div class="cartao-ficha largo"><h3>Equipamento</h3><ul>${charState.inventario.map(i => `<li>${i.qtd > 1 ? i.qtd + 'x ' : ''}${esc(nomeItem(i))}${i.bonus_magico ? ' +' + i.bonus_magico : ''}</li>`).join('') || '<li>Nenhum item</li>'}</ul>${htmlResumoOuro()}${calc.avisosEquip.length ? `<div class="aviso"><b>Avisos de equipamento</b>${[...new Set(calc.avisosEquip)].map(esc).join('<br>')}</div>` : ''}</div>
    </div>`;
}
function htmlEtapaRevisao() {
    return `<h2>Nome e revisão</h2>
        <div class="bloco"><label><b>Nome do personagem</b><br><input type="text" id="campo-nome" value="${esc(charState.nomePersonagem || '')}" placeholder="Digite o nome" style="width:100%;max-width:420px" oninput="UI.nome(this.value)"></label>
        <button type="button" class="sec mini" onclick="UI.gerarNome()">Gerar nome</button>
        <p class="meta">O retrato é enviado e ajustado depois, na ficha.</p></div>
        <div id="resumo-pend">${htmlResumoPendencias(pendenciasGerais().concat(pendenciasEquipamento()))}</div>
        ${htmlFichaResumo()}`;
}
