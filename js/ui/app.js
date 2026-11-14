// Aplicação: estado da interface, navegação entre etapas, telas (criação, lista de personagens, ficha) e eventos.
const ETAPAS = [{ id: 'raca', nome: 'Raça' }, { id: 'classe', nome: 'Classe' }, { id: 'subclasse', nome: 'Subclasse' }, { id: 'antecedente', nome: 'Antecedente' }, { id: 'atributos', nome: 'Atributos' }, { id: 'escolhas', nome: 'Escolhas e equipamento' }, { id: 'revisao', nome: 'Nome e revisão' }];
const ui = { tela: 'criacao', etapa: 0, maxEtapa: 0, buscaLivro: '', foco: {}, focoTalento: {}, busca: {}, aberto: {}, asi: {}, asiModo: {}, metodo: 'compra', rolagens: [], pad: {}, padIdx: {}, loja: { q: '', cat: '' }, confirmar: null, msgs: [], subLista: [], idSalvo: null };

const TEXTO_INTERRUPTORES = {
    ua: ['Unearthed Arcana (UA)', 'Material de teste (playtest) publicado pela Wizards of the Coast para a comunidade experimentar. Não faz parte dos livros oficiais, pode mudar ou ser descartado, e a aceitação depende do mestre. Ligado, raças, classes, subclasses, talentos, magias e itens UA aparecem marcados com UA.'],
    terceiros: ['Conteúdo de terceiros', 'Material criado por outros autores, não publicado pela Wizards of the Coast (por exemplo, a classe Caçador de Sangue). Não é regra oficial e a aceitação depende do mestre. Ligado, esse conteúdo aparece marcado como Terceiros.'],
    tasha: ["Opções do Tasha's Cauldron of Everything", "Livro oficial com características de classe opcionais e listas de magias ampliadas. As opções dependem da autorização do mestre; quando ligadas, aparecem como alternativas às características originais (você escolhe qual versão usar)."]
};

// ---------- carga de dados ----------
async function carregarJSON(url) {
    let r; try { r = await fetch(url); } catch (e) { throw new Error(`não foi possível ler "${url}" (${e.message})`); }
    if (!r.ok) throw new Error(`"${url}" não encontrado (HTTP ${r.status})`);
    try { return await r.json(); } catch (e) { throw new Error(`"${url}" não é um JSON válido (${e.message})`); }
}
async function carregarMagicos() {
    if (db.magicos) return;
    try {
        let ptI = {}; try { ptI = await carregarJSON('dados/pt/itens_magicos.json'); } catch (e) { /* sem tradução: mostra o inglês */ }
        db.magicos = (await carregarJSON('dados/itens_magicos.json')).map(m => { const p = ptI[m.id]; return { id: 'magico-' + m.id, cat: 'magico', nome: p ? p.nome : m.nome, nome_en: m.nome, custo_po: null, custo_txt: 'concedido pelo mestre', peso_lb: null, grupo: m.tipo || 'Item mágico', grupo_pt: p ? p.grupo : null, ua: m.ua, fonte: m.fonte, raridade: m.raridade, texto_en: m.descricao_en || '', texto_pt: p && p.resumo ? p.resumo : null, sint: !!m.requer_sintonizacao, desc_en: [m.raridade, m.requer_sintonizacao ? 'requires attunement' + (m.sintonizacao_por_en ? ' by ' + m.sintonizacao_por_en : '') : '', m.fonte].filter(Boolean).join(' | ') + (m.descricao_en ? ' | ' + m.descricao_en : ''), desc_pt: p ? [p.linha, m.fonte].filter(Boolean).join(' | ') + (p.resumo ? ' | ' + p.resumo : '') : null }; });
    }
    catch (e) { db.magicos = []; avisar('Itens mágicos indisponíveis: ' + e.message, true); }
}
async function iniciar() {
    const app = porId('app');
    try {
        if (location.protocol === 'file:') throw new Error('abra pelo servidor local (o navegador bloqueia a leitura dos arquivos de dados ao abrir direto). No terminal, na pasta do projeto: node tools/serve.js  e depois http://127.0.0.1:5500/');
        const [racas, classes, antec, idiomas, talentos, loja, equipIni, magias, avisos, conjuracao, icones, magiasPt, lojaPt, equipPt] = await Promise.all(['raças.json', 'classes.json', 'antecedentes.json', 'idiomas.json', 'talentos.json', 'dados/loja.json', 'dados/equip_inicial.json', 'dados/magias.json', 'dados/avisos.json', 'dados/conjuracao.json', 'dados/icones.json', 'dados/pt/magias.json', 'dados/pt/loja.json', 'dados/pt/equip_inicial.json'].map(carregarJSON));
        Object.assign(db, { racas, classes, antecedentes: antec, idiomas: idiomas.idiomas, talentos, loja, equipInicial: equipIni, magias, avisos, conjuracao });
        Idioma.definirCamada('magias', magiasPt);
        db.equipPt = equipPt;
        loja.forEach(i => { const p = lojaPt[i.id]; if (!p) return; if (p.nome) i.nome = p.nome; if (p.desc) i.desc_pt = p.desc; });
        Idioma.adicionarNos(classes); Idioma.adicionarNos(talentos);
        try {
            db.fichaResumos = await carregarJSON('dados/ficha-resumos.json');
            Object.keys(db.fichaResumos).forEach(id => Object.values(db.fichaResumos[id]).forEach(p => { if (Array.isArray(p) && p[1]) Idioma.adicionar({ [p[0]]: p[1] }); }));
        } catch (e) { db.fichaResumos = {}; /* sem resumos: a ficha corta o texto original */ }
        ICONES = icones;
        const ordemRacas = ['Humano', 'Anão', 'Elfo'];
        db.racas.sort((a, b) => { let ia = ordemRacas.findIndex(r => nomeDe(a).includes(r)), ib = ordemRacas.findIndex(r => nomeDe(b).includes(r)); if (ia < 0) ia = 999; if (ib < 0) ib = 999; return ia !== ib ? ia - ib : nomeDe(a).localeCompare(nomeDe(b)); });
        db.classes.sort((a, b) => { const na = nomeDe(a), nb = nomeDe(b); if (na.includes('Bárbaro') !== nb.includes('Bárbaro')) return na.includes('Bárbaro') ? -1 : 1; if (na.includes('Artífice') !== nb.includes('Artífice')) return na.includes('Artífice') ? 1 : -1; return na.localeCompare(nb); });
        const cfg = lerConfig(); config.ua = !!cfg.ua; config.terceiros = !!cfg.terceiros; config.livros = { ...(cfg.livros || {}) };
        if (cfg.tasha) config.livros[CHAVE_TASHA] = true;
        charState.tasha = !!config.livros[CHAVE_TASHA];
        await carregarMagicos();
        ui.tela = 'inicio';
        renderTudo();
    } catch (e) { app.innerHTML = `<div class="aviso erro"><b>Erro ao carregar os dados</b>${esc(e.message)}</div>`; }
}

// ---------- utilitários ----------
let _toastTimer = null;
function avisar(texto, erro) { const t = porId('toast'); t.textContent = semEmoji(texto); t.className = erro ? 'erro' : ''; t.style.display = 'block'; clearTimeout(_toastTimer); _toastTimer = setTimeout(() => { t.style.display = 'none'; }, erro ? 6000 : 3000); }
function novoPersonagem() {
    Object.assign(charState, { nivel: 1, outras: [], raca: null, classe: null, antecedente: null, inventario: [], retrato: null, retratoOrig: null, retratoPos: null, atributosBase: { For: 8, Des: 8, Con: 8, Int: 8, Sab: 8, Car: 8 }, bonusRacial: {}, tashaUsa: {}, origemPersonalizada: false, justificativas: {}, escolhas: { raca: {}, classe: {}, antecedente: {} }, pvNiveis: [], pvAtual: null, pvTemp: 0, folha: novaFolha(), historico: [], nomePersonagem: '', idSalvo: null, equipInicial: { modo: 'equipamento', escolhas: {}, ouro: null, classeId: null, antecedenteNome: null } });
    Object.assign(ui, { tela: 'criacao', etapa: 0, maxEtapa: 0, foco: {}, busca: {}, aberto: {}, asi: {}, asiModo: {}, metodo: 'compra', rolagens: [], pad: {}, padIdx: {}, loja: { q: '', cat: '' }, confirmar: null, msgs: [], idSalvo: null });
}
// Descobre qual método de atributos explica os valores já definidos (ao abrir um personagem salvo).
function inferirMetodo() {
    const v = Object.values(charState.atributosBase).sort((a, b) => b - a);
    if (JSON.stringify(v) === JSON.stringify(CONJUNTO_PADRAO)) { ui.metodo = 'padrao'; ui.pad = { ...charState.atributosBase }; ui.padIdx = {}; const usados = new Set(); Object.entries(ui.pad).forEach(([k, val]) => { const i = CONJUNTO_PADRAO.findIndex((x, j) => x === val && !usados.has(j)); usados.add(i); ui.padIdx[k] = i; }); }
    else if (v.every(x => x >= 8 && x <= 15) && pontosGastos(charState.atributosBase) <= PONTOS_COMPRA) ui.metodo = 'compra';
    else ui.metodo = 'manual';
}

// ---------- validação ----------
function validarEtapa(i) {
    const id = ETAPAS[i].id; const m = [];
    const faltas = (cat, filtro) => escolhasPendentes(cat, filtro).forEach(p => m.push(`Falta decidir: ${nomeDe(p.c.node)} (${p.feitas}/${p.limite}).`));
    if (id === 'raca') { if (!charState.raca) m.push('Escolha uma raça para continuar.'); else faltas('raca'); }
    if (id === 'classe') { if (!charState.classe) m.push('Escolha uma classe para continuar.'); if (!(nivelAtual() >= 1 && nivelAtual() <= 20)) m.push('O nível deve ficar entre 1 e 20.'); }
    if (id === 'subclasse') { const s = subclasseInfo(); if (s && s.liberada && !selecaoDe('classe', s.escolha.id).length) m.push('Escolha a subclasse (a classe já a concede neste nível).'); }
    if (id === 'antecedente') { if (!charState.antecedente) m.push('Escolha um antecedente para continuar.'); else faltas('antecedente'); }
    if (id === 'atributos') {
        if (ui.metodo === 'padrao' || ui.metodo === 'rolagem') { if (ui.metodo === 'rolagem' && !ui.rolagens.length) m.push('Role os dados antes de distribuir os valores.'); else if (ATTR_NAMES.some(n => ui.pad[ATTR_MAP_KEY[n]] == null)) m.push('Atribua um valor a cada um dos seis atributos.'); }
        if (ui.metodo === 'compra' && pontosGastos(charState.atributosBase) > PONTOS_COMPRA) m.push('Você gastou mais pontos do que o permitido.');
        if (racaPersonalizada() && !bonusRacialCompleto()) m.push('Distribua o bônus de raça: +2 em um atributo e +1 em outro, ou +1 em três atributos.');
    }
    if (id === 'escolhas') { faltas('classe', c => !ehEscolhaDeSubclasse(c)); pendenciasEquipamento().forEach(p => m.push(p.rot + '.')); }
    if (id === 'revisao') { if (!(charState.nomePersonagem || '').trim()) m.push('Dê um nome ao personagem.'); }
    return m;
}
function primeiraEtapaInvalida() { for (let i = 0; i < ETAPAS.length - 1; i++) { const m = validarEtapa(i); if (m.length) return { i, m }; } return null; }

// ---------- renderização ----------
function htmlInterruptor(k, ligado) {
    const [t, d] = TEXTO_INTERRUPTORES[k];
    return `<div class="interruptor"><label><input type="checkbox" role="switch" ${ligado ? 'checked' : ''} onchange="UI.alternarConfig('${k}')"> ${esc(t)}</label><details><summary>O que é isso?</summary><p>${esc(d)}</p></details></div>`;
}
const NOME_TIPO_FONTE = { racas: 'raças', variantes: 'variantes de raça', subclasses: 'subclasses', talentos: 'talentos', antecedentes: 'antecedentes', magias: 'magias', itens: 'itens mágicos' };
function htmlLivro(l) {
    const resumo = Object.entries(l.qtd).map(([t, n]) => `${n} ${NOME_TIPO_FONTE[t] || t}`).join(', ');
    return `<label class="livro"><input type="checkbox" ${livroLigado(l.chave) ? 'checked' : ''} onchange="UI.alternarLivro('${l.chave}')"><span class="nome">${esc(l.nome)}${l.chave === CHAVE_TASHA ? '<span class="nota">Também ativa as características opcionais de classe e as listas de magias ampliadas.</span>' : ''}</span><span class="meta">${esc(resumo)}</span></label>`;
}
// Divide o catálogo em: suplementos de regras, grupo Plane Shift, grupo de livros que só trazem itens e os demais.
function gruposLivros() {
    const lista = catalogoLivros().slice().sort((a, b) => a.nome.localeCompare(b.nome));
    const suple = SUPLEMENTOS_REGRAS.map(k => lista.find(l => l.chave === k)).filter(Boolean), resto = lista.filter(l => !suple.includes(l));
    const planeshift = resto.filter(l => /^Plane Shift/i.test(l.nome));
    const itens = resto.filter(l => !planeshift.includes(l) && Object.keys(l.qtd).every(t => t === 'itens'));
    const outros = resto.filter(l => !planeshift.includes(l) && !itens.includes(l));
    return { lista, suple, resto, planeshift, itens, outros };
}
// Bloco recolhível (com seta) de livros. `secao`: cabeçalho com botões ligar/desligar; senão, caixa mestre com estado parcial. Todos começam fechados.
function htmlGrupoLivros(id, titulo, livros, secao, lista, extra) {
    if (!livros.length) return '';
    lista = lista || livros;
    const k = 'grupo-' + id, aberto = !!ui.aberto[k];
    const on = livros.filter(l => livroLigado(l.chave)).length, estado = on === 0 ? 'nenhum' : on === livros.length ? 'todos' : 'parcial';
    const controle = secao
        ? ''
        : `<input type="checkbox" data-estado="${estado}" ${estado === 'todos' ? 'checked' : ''} aria-label="${esc(titulo)}" onclick="event.stopPropagation()" onchange="UI.livrosGrupo('${id}', this.checked)"> `;
    const botoes = secao ? `<span class="sec-acoes" onclick="event.stopPropagation()"><button type="button" class="mini sec" onclick="UI.livrosGrupo('${id}', true)">Ligar todos</button><button type="button" class="mini sec" onclick="UI.livrosGrupo('${id}', false)">Desligar todos</button></span>` : '';
    return `<details class="grupo-livros ${secao ? 'grupo-secao' : ''}" ${aberto ? 'open' : ''} ontoggle="ui.aberto['${k}'] = this.open"><summary>${controle}<span class="grupo-nome">${esc(titulo)}</span> <span class="meta">(${on}/${livros.length})</span>${botoes}</summary><div class="fontes-lista">${lista.map(htmlLivro).join('')}</div>${extra || ''}</details>`;
}
// Painel do topo: nasce sob a seta; se passar da borda direita da janela, recua só o necessário.
function ajustarPainelFontes(det) {
    const corpo = det.querySelector('.fontes-corpo');
    if (!corpo || !det.classList.contains('fontes-topo')) return;
    corpo.style.marginLeft = '0px';
    if (!det.open) return;
    const sobra = corpo.getBoundingClientRect().right - (document.documentElement.clientWidth - 16);
    if (sobra > 0) corpo.style.marginLeft = -sobra + 'px';
}
// Painel das fontes de conteúdo: livros (o Player's Handbook sempre vale) e conteúdo não oficial. `chave` guarda se está aberto.
function htmlPainelFontes(chave) {
    const { lista, suple, resto, planeshift, itens, outros } = gruposLivros();
    const ligadas = lista.filter(l => livroLigado(l.chave)).length + (config.ua ? 1 : 0) + (config.terceiros ? 1 : 0);
    return `<details class="fontes ${chave === 'fontesTopo' ? 'fontes-topo' : 'fontes-etapa'}" ${ui.aberto[chave] ? 'open' : ''} ontoggle="ui.aberto['${chave}'] = this.open; ajustarPainelFontes(this)"><summary><span class="so-pc">Fontes de conteúdo</span><span class="so-mob">Fontes</span> <span class="meta">(<span class="so-pc">Player's Handbook</span><span class="so-mob">PHB</span>${ligadas ? ' + ' + ligadas : ''})</span></summary>
        <div class="fontes-corpo"><p class="meta">Só o Player's Handbook vem ligado. Livros desligados escondem suas raças, subclasses, talentos, antecedentes, magias e itens. Vale para o app inteiro.</p>
        <input type="search" class="busca-fontes" placeholder="Buscar livro ou fonte..." aria-label="Buscar fonte de conteúdo" value="${esc(ui.buscaLivro)}" oninput="UI.buscarLivro(this.value)">
        <div class="fontes-acoes"><button type="button" class="mini sec" onclick="UI.livrosTodos(true)">Ligar todos os livros</button><button type="button" class="mini sec" onclick="UI.livrosTodos(false)">Desligar todos</button></div>
        ${htmlGrupoLivros('suple', 'Livros de regras e suplementos', suple, true)}${htmlGrupoLivros('resto', 'Aventuras, cenários e outros livros', resto, true, outros, htmlGrupoLivros('planeshift', 'Plane Shift', planeshift) + htmlGrupoLivros('itens', 'Livros que só trazem itens mágicos', itens))}
        <h4>Conteúdo não oficial</h4><div class="fontes-lista">${htmlInterruptor('ua', config.ua)}${htmlInterruptor('terceiros', config.terceiros)}</div><p class="meta fontes-vazio" hidden>Nenhuma fonte encontrada.</p></div></details>`;
}
// Filtra, sem redesenhar, os livros e interruptores pelo texto da busca; esconde os títulos de grupos sem resultado.
function filtrarLivros() {
    const q = normaliza(ui.buscaLivro).trim();
    document.querySelectorAll('.fontes-corpo').forEach(corpo => {
        let visiveis = 0;
        corpo.querySelectorAll('.livro, .interruptor').forEach(el => { const ok = !q || normaliza(el.textContent).includes(q); el.hidden = !ok; if (ok) visiveis++; });
        corpo.querySelectorAll('.fontes-lista').forEach(l => { if (l.closest('.grupo-livros')) return; const algum = !!l.querySelector('.livro:not([hidden]), .interruptor:not([hidden])'); l.hidden = !algum; if (l.previousElementSibling) l.previousElementSibling.hidden = !algum; });
        corpo.querySelectorAll('.grupo-livros').forEach(g => { const algum = !!g.querySelector('.livro:not([hidden])'); g.hidden = !algum; if (q && algum) g.open = true; });
        corpo.querySelectorAll('input[data-estado]').forEach(c => { c.indeterminate = c.dataset.estado === 'parcial'; });
        const v = corpo.querySelector('.fontes-vazio'); if (v) v.hidden = visiveis > 0;
    });
}
function renderTopo() {
    porId('interruptores').innerHTML = htmlPainelFontes('fontesTopo');
}
function renderAvisosGlobais() {
    const inc = ui.tela === 'criacao' ? selecoesIncompativeis() : [];
    porId('avisos-globais').innerHTML = inc.length ? `<div class="aviso erro"><b>Conteúdo desligado em uso</b>O personagem usa itens de livros, UA ou terceiros que estão desligados nas fontes de conteúdo: ${[...new Set(inc.map(x => x.nome))].slice(0, 8).map(esc).join(', ')}. Ligue a fonte de volta ou remova esses itens. <button type="button" class="perigo mini" onclick="UI.removerIncompativeis()">Remover do personagem</button></div>` : '';
}
function renderEtapas() {
    const nav = porId('etapas'), barra = porId('barra');
    if (ui.tela !== 'criacao') { nav.innerHTML = ''; barra.hidden = true; return; }
    barra.hidden = false;
    nav.innerHTML = ETAPAS.map((e, i) => `<button type="button" class="${i === ui.etapa ? 'atual' : ''} ${i < ui.maxEtapa ? 'feita' : ''}" ${i > ui.maxEtapa ? 'disabled' : ''} onclick="UI.irEtapa(${i})" ${i === ui.etapa ? 'aria-current="step"' : ''}><span class="num">Etapa ${i + 1}</span>${esc(e.nome)}</button>`).join('');
    barra.firstElementChild.style.width = Math.round(((ui.etapa + 1) / ETAPAS.length) * 100) + '%';
}
function htmlInfoEtapa() {
    const id = ETAPAS[ui.etapa].id;
    if (id === 'raca') return detalheRaca(ui.foco.raca != null ? db.racas[ui.foco.raca] : charState.raca);
    if (id === 'classe') return detalheClasse(ui.foco.classe != null ? db.classes[ui.foco.classe] : charState.classe);
    if (id === 'subclasse') { const sel = ui.subLista.find(o => { const s = subclasseInfo(); return s && s.liberada && selecaoDe('classe', s.escolha.id).some(x => mesmaOpcao(o, x)); }); return detalheSubclasse(ui.foco.subclasse != null ? ui.subLista[ui.foco.subclasse] : (sel || (ui.subFixo != null ? ui.subLista[ui.subFixo] : null))); }
    if (id === 'antecedente') return detalheAntecedente(ui.foco.antecedente != null ? db.antecedentes[ui.foco.antecedente] : charState.antecedente);
    if (id === 'atributos') return infoAtributos();
    if (id === 'escolhas') return infoResumoBasico();
    return '<h2>Revisão</h2><p>Confira o personagem. Você pode voltar a qualquer etapa pelo menu acima sem perder nada.</p>';
}
function infoResumoBasico() {
    const per = extrairProficiencias();
    return `<h2>Seu personagem</h2><ul class="detalhe-lista"><li><b>Raça:</b> ${esc(nomeDe(charState.raca))}</li><li><b>Classe:</b> ${esc(nomeDe(charState.classe))} (nível ${nivelAtual()})</li><li><b>Antecedente:</b> ${esc(nomeAntecedente())}</li></ul><h4>Perícias já concedidas</h4>${per.length ? `<ul class="detalhe-lista">${per.map(p => `<li>${htmlIcone(caminhoPericia(p), p, true)} <b>${esc(p)}</b></li>`).join('')}</ul>` : '<p class="vazio">Nenhuma ainda.</p>'}<p class="meta">Uma perícia não pode ser escolhida duas vezes: as listas só mostram o que você ainda não tem.</p>`;
}
function htmlOpcoesEtapa() {
    return ({ raca: htmlEtapaRaca, classe: htmlEtapaClasse, subclasse: htmlEtapaSubclasse, antecedente: htmlEtapaAntecedente, atributos: htmlEtapaAtributos, escolhas: htmlEtapaEscolhas, revisao: htmlEtapaRevisao })[ETAPAS[ui.etapa].id]();
}
function renderRodape() {
    const r = porId('rodape');
    if (ui.tela !== 'criacao') { r.innerHTML = ''; r.hidden = true; return; }
    r.hidden = false; const ultimo = ui.etapa === ETAPAS.length - 1;
    const conf = ui.confirmar === 'cancelar' ? '<span class="msg">Descartar esta criação? <button type="button" class="perigo mini" onclick="UI.cancelar(true)">Sim, descartar</button> <button type="button" class="sec mini" onclick="UI.cancelar(false)">Não</button></span>' : '';
    r.innerHTML = `<div class="grupo"><button type="button" class="perigo" onclick="UI.cancelar()">Cancelar</button><button type="button" class="sec" onclick="UI.guardarRascunho()">Salvar rascunho</button>${conf}</div>
        <div class="grupo">${ui.msgs.length ? `<span class="msg">${ui.msgs.slice(0, 2).map(esc).join(' ')}${ui.msgs.length > 2 ? ' (+' + (ui.msgs.length - 2) + ')' : ''}</span>` : ''}<button type="button" class="sec" ${ui.etapa === 0 ? 'disabled' : ''} onclick="UI.voltar()">Voltar</button><button type="button" onclick="${ultimo ? 'UI.salvar()' : 'UI.continuar()'}">${ultimo ? 'Salvar personagem' : 'Continuar'}</button></div>`;
}
function renderInfo() { porId('painel-info').innerHTML = htmlInfoEtapa(); }
function renderOpcoes() { redesenharEscolhas('painel-opcoes', htmlOpcoesEtapa); }
function renderTudo() {
    renderTopo(); renderAvisosGlobais(); renderEtapas();
    const app = porId('app'), info = porId('painel-info');
    if (ui.tela === 'criacao') { app.classList.remove('cheio'); info.hidden = false; renderInfo(); renderOpcoes(); }
    else { app.classList.add('cheio'); info.hidden = true; if (ui.tela === 'subir') redesenharEscolhas('painel-opcoes', htmlTelaSubir); else porId('painel-opcoes').innerHTML = ui.tela === 'ficha' ? htmlTelaFicha() : ui.tela === 'inicio' ? htmlTelaInicio() : ui.tela === 'consulta' ? htmlTelaConsulta() : ui.tela === 'consulta-talentos' ? htmlTelaConsultaTalentos() : ui.tela === 'consulta-itens' ? htmlTelaConsultaItens() : htmlTelaPersonagens(); }
    app.classList.toggle('inicio-tela', ui.tela === 'inicio');
    const etapaJanela = ui.tela === 'criacao' && ['raca', 'classe', 'subclasse', 'antecedente'].includes(ETAPAS[ui.etapa].id);
    app.classList.toggle('janela-movel', etapaJanela);
    if (ui.janela && !(etapaJanela && ui.janela.tipo === ETAPAS[ui.etapa].id)) ui.janela = null;
    renderRodape(); filtrarLivros(); renderJanela();
    if (ui.tela === 'ficha') ajustarTextosFicha();
}
// Rola até o primeiro item que falta decidir na etapa atual e o destaca.
function irParaPendencia() {
    const id = ETAPAS[ui.etapa].id;
    const bloco = (cat, filtro) => { const p = escolhasPendentes(cat, filtro)[0]; return p ? porId('bloco-' + p.c.id) : null; };
    let el = null;
    if (id === 'raca') el = bloco('raca');
    else if (id === 'antecedente') el = bloco('antecedente');
    else if (id === 'escolhas') el = bloco('classe', c => !ehEscolhaDeSubclasse(c)) || document.querySelector('[data-pendente]');
    else if (id === 'atributos') el = document.querySelector('.attr[data-pendente]') || document.querySelector('.attr');
    else if (id === 'revisao') el = porId('campo-nome');
    if (!el) el = porId('painel-opcoes');
    rolarEDestacar(el);
}
function rolarEDestacar(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el.tagName === 'INPUT') el.focus({ preventScroll: true });
    el.classList.remove('destacar'); void el.offsetWidth; el.classList.add('destacar');
    setTimeout(() => el.classList.remove('destacar'), 2200);
}
// Duplo clique em um cartão: depois de escolher, desce até a próxima escolha da mesma página (ou até o fim dela, se não houver mais nada a decidir).
function irParaProximaEscolha(tipo) {
    const cat = tipo === 'raca' || tipo === 'antecedente' ? tipo : null;
    const p = cat ? escolhasPendentes(cat)[0] : null;
    const el = (p && porId('bloco-' + p.c.id)) || (cat && porId('area-escolhas'));
    if (el) rolarEDestacar(el); else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
}
// Depois de qualquer mudança no personagem.
function aposMudanca() {
    ajustarContagens();
    // Subindo de nível nada é guardado (nem rascunho) até confirmar.
    if (ui.tela === 'subir') { renderTudo(); return; }
    try { if (charState.raca && charState.classe && charState.antecedente) salvarRascunho(); } catch (e) { /* rascunho é opcional */ }
    ui.msgs = [];
    renderAvisosGlobais(); renderEtapas(); renderInfo(); renderOpcoes(); renderRodape(); renderJanela();
}

// ---------- telas ----------
const _svgIni = (d, cls) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const _D20_PATH = '<path d="M12 2.5l8.5 5v9l-8.5 5-8.5-5v-9z"/><path d="M12 2.5l-3.5 7.5h7zM8.5 10l-5-2.5M15.5 10l5-2.5M8.5 10L12 21.5M15.5 10L12 21.5M8.5 10l-5 6.5M15.5 10l5 6.5"/>';
function htmlTelaInicio() {
    const n = listarPersonagens().length, rasc = lerRascunho();
    const novo = _svgIni('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M18 8v6M15 11h6"/>', 'ico');
    const grupo = _svgIni('<circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M2 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15 15c3 0 5.5 1.8 5.5 4.5"/>', 'ico');
    return `<div class="inicio"><div class="inicio-caixa"><div class="inicio-orn"><i></i>${_svgIni(_D20_PATH, 'd20-orn')}<i></i></div><h2>D&amp;D 5e</h2><div class="inicio-sublinha"><i></i><span>Regras de 2014</span><i></i></div>
        <div class="inicio-botoes"><button type="button" class="inicio-primario" onclick="UI.novo()">${novo}<b class="sep"></b><span>Criar personagem</span></button><button type="button" class="sec inicio-sec" onclick="UI.telaPersonagens()">${grupo}<b class="sep"></b><span>Meus personagens${n ? ' (' + n + ')' : ''}</span><em class="seta">&rsaquo;</em></button></div>
        ${rasc ? '<p class="inicio-rasc"><button type="button" class="mini" onclick="UI.continuarRascunho()">Continuar criação em andamento</button></p>' : ''}</div></div>`;
}
const COR_CLASSE = { barbarian: '#d9533f', bard: '#e07bb0', 'blood-hunter': '#c42b45', warlock: '#a97be0', cleric: '#e6c458', druid: '#72c25f', sorcerer: '#e8703f', fighter: '#c9976a', rogue: '#a3adb8', wizard: '#4fa8e6', monk: '#46c2b8', mystic: '#c993e8', paladin: '#ec92c0', ranger: '#5fae6d', 'rune-scribe': '#6ab0da', artificer: '#e0a145' };
const _svgp = d => `<svg class="ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICO_PERS = {
    livro: _svgp('<path d="M12 6.5C10.5 5.2 8 4.5 4 4.5v13c4 0 6.5.7 8 2 1.5-1.3 4-2 8-2v-13c-4 0-6.5.7-8 2zM12 6.5v13"/>'),
    d20: _svgp('<path d="M12 2.5l8.5 5v9l-8.5 5-8.5-5v-9z"/><path d="M12 2.5l-3.5 7.5h7zM8.5 10l-5 -2.5M15.5 10l5-2.5M8.5 10L12 21.5M15.5 10L12 21.5M8.5 10l-5 6.5M15.5 10l5 6.5"/>'),
    pena: _svgp('<path d="M20 4c-7 0-12 4-13 11l-2 5 5-2c7-1 11-6 10-14zM9 15l6-6"/>'),
    copia: _svgp('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    exportar: _svgp('<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
    lixeira: _svgp('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>')
};
if (document.addEventListener) document.addEventListener('click', e => document.querySelectorAll('.pers-menu[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }));
if (typeof window !== 'undefined' && window.addEventListener && document.getElementById) {
    const bt = document.getElementById('voltar-topo');
    if (bt) { bt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' }); window.addEventListener('scroll', () => { bt.hidden = window.scrollY < 700; }, { passive: true }); }
}
function htmlTelaPersonagens() {
    const lista = listarPersonagens(), rasc = lerRascunho();
    const itens = lista.map(p => { const e = p.estado;
        const cls = [{ classe: e.classe, nivel: e.nivel }].concat(e.outras || []);
        const corDe = id => COR_CLASSE[id] || COR_CLASSE[String(id).replace(/-.*$/, '')] || 'var(--ouro-claro)';
        const classes = cls.map(x => { const cl = db.classes.find(c => c.id === x.classe); return `<span class="cl" style="--cor:${corDe(x.classe)}">${esc(cl ? nomeCurtoDaClasse(cl) : x.classe)} ${x.nivel}</span>`; }).join(' / ');
        const nivelTotal = cls.reduce((s, x) => s + (Number(x.nivel) || 0), 0);
        const barras = cls.length > 1 ? `<span class="pers-barras">${cls.map(x => `<i style="flex:${Number(x.nivel) || 1};background:${corDe(x.classe)}"></i>`).join('')}</span>` : '';
        const corPrim = corDe(e.classe);
        return `<div class="pers"><span class="pers-canto c1"></span><span class="pers-canto c2"></span><span class="pers-canto c3"></span><span class="pers-canto c4"></span><details class="pers-menu"><summary title="Mais ações" aria-label="Mais ações">&#8942;</summary><div class="pers-menu-lista" onclick="this.parentNode.open = false"><button type="button" class="sec" onclick="UI.editar('${p.id}')">${ICO_PERS.pena}Editar</button><button type="button" class="sec" onclick="UI.duplicar('${p.id}')">${ICO_PERS.copia}Duplicar</button><button type="button" class="sec" onclick="UI.exportar('${p.id}')">${ICO_PERS.exportar}Exportar</button><hr><button type="button" class="sec perigo-txt" onclick="UI.excluir('${p.id}')">${ICO_PERS.lixeira}Excluir</button></div></details><div class="pers-topo"><div class="pers-fotobox"><div class="pers-foto${e.retrato ? '' : ' vazia'}">${e.retrato ? `<img src="${esc(e.retrato)}" alt="">` : ''}</div><span class="pers-nivel" title="Nível">${nivelTotal}</span></div><div class="pers-info"><b>${esc(p.nome)}</b><span class="pers-raca">${esc(e.raca || '?')}</span><span class="pers-classes">${classes}</span>${barras}<span class="meta peq">atualizado em ${esc(new Date(p.atualizadoEm).toLocaleString('pt-BR'))}</span></div></div><div class="pers-div"></div><div class="acoes">${ui.confirmar === 'ex-' + p.id ? `<span class="confirmacao"><b>Excluir mesmo?</b><span class="conf-bt"><button type="button" class="perigo" onclick="UI.excluir('${p.id}', true)">Sim, excluir</button><button type="button" class="sec" onclick="UI.excluir('${p.id}', false)">Não</button></span></span>` : `<button type="button" class="abrir" onclick="UI.abrir('${p.id}')">${ICO_PERS.livro}Abrir ficha</button><button type="button" class="sec subir" style="--cor:${corPrim}" onclick="UI.subirDe('${p.id}')">${ICO_PERS.d20}Subir de nível</button>`}</div></div>`; }).join('');
    return `<div class="cab-pers"><h2>Meus personagens</h2><div class="busca"><button type="button" onclick="UI.novo()">Novo personagem</button><label class="sec" style="cursor:pointer"><button type="button" class="sec" onclick="this.nextElementSibling.click()">Importar arquivo</button><input type="file" accept="application/json,.json" hidden onchange="UI.importar(this)"></label></div></div>
        ${rasc ? `<div class="aviso info"><b>Criação em andamento</b>Há um rascunho salvo em ${esc(new Date(rasc.salvoEm).toLocaleString('pt-BR'))}. <button type="button" class="mini" onclick="UI.continuarRascunho()">Continuar de onde parei</button> <button type="button" class="perigo mini" onclick="UI.descartarRascunho()">Descartar</button></div>` : ''}
        <div class="lista-personagens">${itens || '<p class="vazio">Nenhum personagem salvo ainda.</p>'}</div>`;
}


// ---------- ações (chamadas pelos elementos da página) ----------
const UI = {
    alternarConfig(k) { config[k] = !config[k]; UI.aplicarFontes(); },
    alternarLivro(chave) { definirLivro(chave, !(config.livros || {})[chave]); UI.aplicarFontes(); },
    livrosTodos(ligar) { config.livros = {}; if (ligar) catalogoLivros().forEach(l => { config.livros[l.chave] = true; }); charState.tasha = !!config.livros[CHAVE_TASHA]; UI.aplicarFontes(); },
    // Liga/desliga uma seção ('suple', 'resto') ou um grupo ('planeshift', 'itens') de livros.
    livrosGrupo(id, ligar) {
        const g = gruposLivros();
        const alvo = id === 'resto' ? g.resto : (g[id] || []);
        alvo.forEach(l => definirLivro(l.chave, !!ligar));
        UI.aplicarFontes();
    },
    // Grava e redesenha tudo após mudar uma fonte, mantendo a rolagem dos painéis de fontes.
    aplicarFontes() {
        const rol = [...document.querySelectorAll('.fontes-corpo')].map(e => e.scrollTop);
        _cacheSubst = { chave: null, nomes: [] };
        salvarConfig({ ua: config.ua, terceiros: config.terceiros, tasha: !!charState.tasha, livros: config.livros });
        ajustarContagens(); renderTudo();
        document.querySelectorAll('.fontes-corpo').forEach((e, i) => { if (rol[i] != null) e.scrollTop = rol[i]; });
    },
    buscarLivro(v) { ui.buscaLivro = v; document.querySelectorAll('.busca-fontes').forEach(i => { if (i.value !== v) i.value = v; }); filtrarLivros(); },
    removerIncompativeis() { removerSelecoesIncompativeis(); aposMudanca(); avisar('Itens removidos do personagem.'); },
    novo() { UI.subirAbortar(); novoPersonagem(); renderTudo(); },
    telaPersonagens() { UI.subirAbortar(); ui.tela = 'personagens'; ui.confirmar = null; renderTudo(); },
    inicio() { UI.subirAbortar(); ui.tela = 'inicio'; ui.confirmar = null; renderTudo(); window.scrollTo(0, 0); },
    irEtapa(i) { if (i <= ui.maxEtapa) { ui.etapa = i; ui.msgs = []; ui.foco = {}; ui.subFixo = null; ui.focoTalento = {}; renderTudo(); window.scrollTo(0, 0); } },
    voltar() { if (ui.etapa > 0) UI.irEtapa(ui.etapa - 1); },
    continuar() {
        const m = validarEtapa(ui.etapa); ui.msgs = m;
        if (m.length) { renderRodape(); avisar(m[0], true); irParaPendencia(); return; }
        ui.etapa++; ui.maxEtapa = Math.max(ui.maxEtapa, ui.etapa); ui.foco = {}; ui.subFixo = null; renderTudo(); window.scrollTo(0, 0);
    },
    cancelar(confirmado) {
        if (confirmado === undefined) { ui.confirmar = 'cancelar'; renderRodape(); return; }
        ui.confirmar = null;
        if (confirmado) { limparRascunho(); novoPersonagem(); ui.tela = listarPersonagens().length ? 'personagens' : 'inicio'; renderTudo(); avisar('Criação descartada.'); } else renderRodape();
    },
    guardarRascunho() { if (!charState.raca && !charState.classe && !charState.antecedente) return avisar('Escolha ao menos a raça, a classe e o antecedente para guardar o rascunho.', true); const e = salvarRascunho(); avisar(e || 'Rascunho salvo.', !!e); },
    continuarRascunho() { const r = continuarRascunho(); novoPersonagemMantendo(); inferirMetodo(); ui.tela = 'criacao'; const pend = primeiraEtapaInvalida(); ui.etapa = pend ? pend.i : ETAPAS.length - 1; ui.maxEtapa = ui.etapa; renderTudo(); if (r.perdas.length) avisar('Alguns itens do rascunho não existem mais: ' + r.perdas.slice(0, 2).join('; '), true); },
    descartarRascunho() { limparRascunho(); renderTudo(); },

    // seleção de cartões
    selecionar(tipo, i, cliques) {
        const seguir = () => { if (cliques >= 2) irParaProximaEscolha(tipo); };
        if (ehMovel() && ['raca', 'classe', 'antecedente', 'subclasse'].includes(tipo)) return UI.abrirJanela(tipo, i);
        if (tipo === 'raca') { if (charState.raca === db.racas[i]) return seguir(); charState.raca = db.racas[i]; charState.escolhas.raca = {}; }
        else if (tipo === 'classe') { if (charState.classe === db.classes[i]) return seguir(); charState.classe = db.classes[i]; charState.escolhas.classe = {}; ui.subFixo = null; }
        else if (tipo === 'antecedente') { if (charState.antecedente === db.antecedentes[i]) return seguir(); const a = db.antecedentes[i]; a.conteudo = a.proficiencias_extras; charState.antecedente = a; charState.escolhas.antecedente = {}; charState.justificativas = {}; }
        else if (tipo === 'subclasse') { const s = subclasseInfo(); if (s && !s.liberada) { ui.subFixo = i; ui.foco.subclasse = null; renderTudo(); return; } if (!s) return; registrarSelecao('classe', s.escolha, [opcoesDaEscolha('classe', s.escolha, s.escolha.id).opcoes[i]]); }
        ui.foco[tipo] = null; aposMudanca(); seguir();
    },
    focar(tipo, i) { ui.foco[tipo] = i; renderInfo(); },
    desfocar(tipo) { if (ui.foco[tipo] == null) return; ui.foco[tipo] = null; renderInfo(); },
    buscarLista(tipo, v) { ui.busca[tipo] = v; porId('grade-' + tipo).innerHTML = htmlGrade(tipo); const n = indicesFiltrados(tipo).length; porId('cont-' + tipo).textContent = n + ' resultado(s)'; },
    definirNivel(v) { let n = parseInt(v, 10); if (isNaN(n)) n = 1; charState.nivel = Math.min(20, Math.max(1, n)); aposMudanca(); },

    // escolhas
    marcar(cat, id, i) {
        const c = acharEscolha(cat, id); if (!c) return;
        const o = opcoesDaEscolha(cat, c, id).opcoes[i]; if (!o || o.bloqueado) return;
        const limite = limiteDe(c); let sels = selecaoDe(cat, id).slice();
        const k = sels.findIndex(s => mesmaOpcao(o, s));
        if (k >= 0) sels.splice(k, 1);
        else if (limite === 1) sels = [o];
        else if (sels.length >= limite) { aposMudanca(); return avisar(`Você já escolheu ${limite}. Desmarque uma opção antes de marcar outra.`, true); }
        else sels.push(o);
        const erro = validarRegrasSelecao(c, sels); if (erro) { aposMudanca(); return avisar(erro, true); }
        registrarSelecao(cat, c, sels); aposMudanca();
    },
    // Justificativa digitada de uma perícia do antecedente personalizado (não redesenha para não perder o foco do campo).
    justificar(cat, id, k, v) {
        const s = selecaoDe(cat, id)[k]; if (!s) return;
        charState.justificativas = charState.justificativas || {};
        const t = String(v).slice(0, 200); if (t.trim()) charState.justificativas[s.nome] = t; else delete charState.justificativas[s.nome];
        try { if (ui.tela === 'criacao' && charState.raca && charState.classe && charState.antecedente) salvarRascunho(); } catch (e) { /* rascunho é opcional */ }
    },
    nomeAntecedente(v) {
        charState.justificativas = charState.justificativas || {};
        const t = String(v).slice(0, 60); if (t.trim()) charState.justificativas[CHAVE_NOME_ANT] = t; else delete charState.justificativas[CHAVE_NOME_ANT];
        try { if (ui.tela === 'criacao' && charState.raca && charState.classe && charState.antecedente) salvarRascunho(); } catch (e) { /* rascunho é opcional */ }
    },
    buscar(id, v) {
        ui.busca[id] = v;
        for (const cat of ['raca', 'classe', 'antecedente']) {
            const c = acharEscolha(cat, id); if (!c) continue; const el = porId('lista-' + id); if (!el) return;
            const r = opcoesDaEscolha(cat, c, id);
            if (porId('desc-' + id)) { _opcoesTalentos[id] = r.opcoes; el.innerHTML = htmlOpcoesTalentos(cat, c, r.opcoes); porId('cont-' + id).textContent = contagemTalentos(c, r.opcoes); }
            else { el.innerHTML = htmlOpcoes(cat, c, r.opcoes, v); ajustarMais(el); }
            return;
        }
    },
    alternarTexto(btn, ev) { ev.preventDefault(); ev.stopPropagation(); const t = btn.previousElementSibling; t.classList.toggle('curto'); btn.textContent = t.classList.contains('curto') ? 'mais' : 'menos'; },
    async verMagia(id, btn, ev) {
        ev.preventDefault(); ev.stopPropagation(); const box = porId('magia-' + id);
        if (!box.hidden) { box.hidden = true; btn.textContent = 'Ver texto completo'; return; }
        if (!db.magiasTexto) { try { db.magiasTexto = await carregarJSON('dados/magias_texto.json'); } catch (e) { return avisar(e.message, true); } }
        const pt = Idioma.tr('magias', id), t = db.magiasTexto[id];
        box.textContent = pt && pt.descricao ? pt.descricao + (pt.em_niveis_superiores ? '\n\nEm Níveis Superiores. ' + pt.em_niveis_superiores : '') : (t ? t.descricao_en + (t.em_niveis_superiores_en ? '\n\nAt Higher Levels. ' + t.em_niveis_superiores_en : '') : 'Texto não disponível.');
        box.hidden = false; btn.textContent = 'Ocultar texto';
    },
    focarTalento(cat, id, i) {
        (ui.focoTalento = ui.focoTalento || {})[id] = i;
        const c = acharEscolha(cat, id), op = _opcoesTalentos[id], box = porId('desc-' + id); if (!c || !op || !box) return;
        box.innerHTML = htmlDescTalento(opcaoEmFocoTalento(c, op, selecaoDe(cat, id)));
    },
    asiModo(cat, id, modo) { ui.asiModo[id] = modo; if (ui.tela === 'subir') renderTudo(); else renderOpcoes(); },
    asiAjustar(cat, id, k, d) {
        const c = acharEscolha(cat, id); if (!c) return; const s0 = selecaoDe(cat, id)[0];
        const dist = ui.asi[id] || (s0 && s0.asi ? { ...s0.asi } : {});
        dist[k] = Math.max(0, (dist[k] || 0) + d); if (!dist[k]) delete dist[k];
        ui.asi[id] = dist; const total = Object.values(dist).reduce((t, v) => t + v, 0);
        if (total === 2) {
            const ord = {}; ATTR_NAMES.forEach(n => { const kk = ATTR_MAP_KEY[n]; if (dist[kk]) ord[kk] = dist[kk]; });
            const o = opcoesDaEscolha(cat, c, id).opcoes.find(x => x.asi && JSON.stringify(x.asi) === JSON.stringify(ord));
            if (o) registrarSelecao(cat, c, [o]);
        } else registrarSelecao(cat, c, []);
        aposMudanca();
    },

    // atributos
    metodoAtributos(m) {
        ui.metodo = m; ui.pad = {}; ui.padIdx = {}; if (m !== 'manual') charState.atributosBase = { For: 8, Des: 8, Con: 8, Int: 8, Sab: 8, Car: 8 };
        aposMudanca();
    },
    // Os seis resultados ficam na ordem em que saíram e já são distribuídos nos atributos; depois dá para trocar.
    rolarAtributos() {
        ui.rolagens = Array.from({ length: 6 }, () => rolar4d6()); ui.pad = {}; ui.padIdx = {};
        ATTR_NAMES.forEach((n, i) => { const k = ATTR_MAP_KEY[n]; ui.padIdx[k] = i; ui.pad[k] = ui.rolagens[i]; charState.atributosBase[k] = ui.rolagens[i]; });
        aposMudanca();
    },
    // Clicar num valor do conjunto: ocupa o atributo (o valor antigo volta a ficar livre); se já estiver em outro atributo, os dois trocam; clicar de novo desmarca.
    valorAtributo(k, idx) {
        const pool = ui.metodo === 'padrao' ? CONJUNTO_PADRAO : ui.rolagens; if (!pool.length || pool[idx] == null) return;
        const antigo = ui.padIdx[k]; const dono = Object.keys(ui.padIdx).find(x => x !== k && ui.padIdx[x] === idx);
        const grava = (a, i) => { if (i == null) { delete ui.padIdx[a]; delete ui.pad[a]; charState.atributosBase[a] = 8; } else { ui.padIdx[a] = i; ui.pad[a] = pool[i]; charState.atributosBase[a] = pool[i]; } };
        if (antigo === idx) grava(k, null);
        else { if (dono) grava(dono, antigo); grava(k, idx); }
        aposMudanca();
    },
    bonusRacial(k, v) { alternarBonusRacial(k, v); aposMudanca(); },
    origemPersonalizada(ligar) { charState.origemPersonalizada = !!ligar; if (!ligar) charState.bonusRacial = {}; aposMudanca(); },
    tashaUsar(i, usa) { const k = (ui.tashaLista || [])[i]; if (!k) return; charState.tashaUsa = charState.tashaUsa || {}; if (usa) charState.tashaUsa[k] = true; else delete charState.tashaUsa[k]; aposMudanca(); },
    atributo(k, d) {
        const base = charState.atributosBase; let msg = '';
        if (ui.metodo === 'compra') { const mot = motivoCompraBloqueada(base, k, base[k] + d); if (mot) msg = mot; else base[k] += d; }
        else if (ui.metodo === 'manual') base[k] = Math.min(20, Math.max(3, base[k] + d));
        aposMudanca(); if (msg) { const el = porId('aviso-atributo'); if (el) el.textContent = msg; avisar(msg, true); }
    },

    // nome, retrato e salvamento
    nome(v) { charState.nomePersonagem = v; },
    gerarNome() { const p = ['Ael', 'Thor', 'Mia', 'Leg', 'Mor', 'Gar', 'Balth', 'Kael'], s = ['ar', 'in', 'li', 'olas', 'el', 'gran', 'azar', 'ian']; const r = (l) => l[Math.floor(Math.random() * l.length)]; charState.nomePersonagem = r(p) + r(s) + ' ' + r(p) + 'son'; porId('campo-nome').value = charState.nomePersonagem; },
    salvar() {
        const bad = primeiraEtapaInvalida(); const m = validarEtapa(ETAPAS.length - 1);
        if (bad) { ui.msgs = bad.m; renderRodape(); avisar(`Etapa ${bad.i + 1} (${ETAPAS[bad.i].nome}): ${bad.m[0]}`, true); return; }
        if (m.length) { ui.msgs = m; renderRodape(); avisar(m[0], true); irParaPendencia(); return; }
        const r = salvarPersonagem(charState.nomePersonagem.trim(), ui.idSalvo);
        if (r.erro) return avisar(r.erro, true);
        ui.idSalvo = r.id; limparRascunho(); ui.tela = 'ficha'; renderTudo(); window.scrollTo(0, 0); avisar('Personagem salvo.');
    },

    // lista de personagens
    abrir(id) { const r = carregarPersonagem(id); ui.idSalvo = id; ui.tela = 'ficha'; renderTudo(); if (r.perdas.length) avisar('Itens que não existem mais foram ignorados: ' + r.perdas.slice(0, 2).join('; '), true); },
    editar(id) { const r = carregarPersonagem(id); ui.idSalvo = id; inferirMetodo(); ui.tela = 'criacao'; ui.etapa = 5; ui.maxEtapa = 6; ui.foco = {}; ui.msgs = []; renderTudo(); if (r.perdas.length) avisar('Itens que não existem mais foram ignorados: ' + r.perdas.slice(0, 2).join('; '), true); },
    duplicar(id) { const r = duplicarPersonagem(id); avisar(r.erro || 'Personagem duplicado.', !!r.erro); renderTudo(); },
    exportar(id) { const t = exportarPersonagem(id); if (!t) return; const p = obterPersonagem(id); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = (p.nome || 'personagem').replace(/[^a-z0-9]+/gi, '_') + '.json'; a.click(); URL.revokeObjectURL(a.href); },
    importar(input) { const f = input.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const r = importarPersonagem(rd.result); avisar(r.erro || 'Personagem importado.', !!r.erro); renderTudo(); }; rd.readAsText(f); },
    excluir(id, confirmado) {
        if (confirmado === undefined) { ui.confirmar = 'ex-' + id; renderTudo(); return; }
        ui.confirmar = null; if (confirmado) { excluirPersonagem(id); avisar('Personagem excluído.'); } renderTudo();
    },

    // equipamento
    redesenharEquip() { redesenharEscolhas('area-equip', htmlEquipamento); const r = porId('resumo-pend'); if (r) r.innerHTML = htmlResumoPendencias(pendenciasGerais().concat(pendenciasEquipamento())); try { if (charState.raca && charState.classe && charState.antecedente) salvarRascunho(); } catch (e) { /* opcional */ } },
    equipModo(m) { const n = equipamentoModoDefinir(m); if (n) avisar(`${n} ${n > 1 ? 'itens comprados com o ouro foram removidos' : 'item comprado com o ouro foi removido'} do inventário.`); UI.redesenharEquip(); },
    equipOpcao(gi, op) { charState.equipInicial.escolhas[gi] = { op, picks: {} }; UI.redesenharEquip(); },
    equipPick(gi, ii, k, id) { const ei = charState.equipInicial; const e = ei.escolhas[gi] || (ei.escolhas[gi] = { op: 0, picks: {} }); e.picks[ii] = e.picks[ii] || []; e.picks[ii][k] = id || undefined; e.picks[ii] = e.picks[ii].filter(Boolean); UI.redesenharEquip(); },
    ouroDefinir(v) { ouroInicialDefinir(v); UI.redesenharEquip(); },
    ouroRolar() { ouroInicialRolar(); UI.redesenharEquip(); },
    ouroMedia() { ouroInicialDefinir(ouroInicialLimites().medio); UI.redesenharEquip(); },
    invRemover(id) { inventarioRemover(id); UI.redesenharEquip(); },
    invSintonia(id) { const i = charState.inventario.find(x => x.id === id); if (!i) return; if (!i.sintonizado && totalSintonizados() >= MAX_SINTONIAS) { UI.redesenharEquip(); return avisar(`Você só pode estar sintonizado a ${MAX_SINTONIAS} itens mágicos ao mesmo tempo.`, true); } i.sintonizado = !i.sintonizado; UI.redesenharEquip(); },
    invVariante(id, v) { const i = charState.inventario.find(x => x.id === id); if (i) { i.variante = parseInt(v, 10) || 0; UI.redesenharEquip(); } },
    invBonus(id, v) { const i = charState.inventario.find(x => x.id === id); if (i) { i.bonus_magico = parseInt(v, 10) || 0; UI.redesenharEquip(); } },
    lojaAbrir(aberta) { if (ui.aberto.loja === aberta) return; ui.aberto.loja = aberta; UI.redesenharEquip(); },
    lojaBuscar(v) { ui.loja.q = v; porId('loja-resultados').innerHTML = htmlLojaResultados(); },
    async lojaCategoria(v) { ui.loja.cat = v; if (ui.lojaFicha) _renderLojaFicha(); else UI.redesenharEquip(); },
    magicosAbrir(aberta) { if (ui.aberto.magicos === aberta) return; ui.aberto.magicos = aberta; UI.redesenharEquip(); },
    magicoBuscar(v) { ui.magicosQ = v; porId('magicos-resultados').innerHTML = htmlMagicosResultados(); },
    lojaComprar(id) { if (ui.lojaFicha) return UI.fichaLojaComprar(id); const l = id.startsWith('magico-') ? (db.magicos || []).find(m => m.id === id) : lojaPorId(id); if (!l) return; const e = inventarioAdicionar(l); if (e) return avisar(e, true); UI.redesenharEquip(); }
};
// Mantém o que o restauro já colocou em charState (usado ao continuar um rascunho).
function novoPersonagemMantendo() { ui.foco = {}; ui.subFixo = null; ui.busca = {}; ui.aberto = {}; ui.asi = {}; ui.asiModo = {}; ui.rolagens = []; ui.pad = {}; ui.padIdx = {}; ui.msgs = []; ui.confirmar = null; ui.idSalvo = null; }

window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('idioma-mudou', () => { if (db.racas) renderTudo(); });
    porId('btn-personagens').addEventListener('click', () => UI.telaPersonagens());
    porId('btn-consulta').addEventListener('click', () => UI.telaConsulta());
    porId('btn-consulta-talentos').addEventListener('click', () => UI.telaConsultaTalentos());
    porId('btn-consulta-itens').addEventListener('click', () => UI.telaConsultaItens());
    porId('btn-novo').addEventListener('click', () => UI.novo());
    document.querySelector('.marca').addEventListener('click', () => UI.inicio());
    const menu = porId('menu-topo'), btnMenu = porId('btn-menu');
    const fecharMenu = () => { menu.hidden = true; btnMenu.setAttribute('aria-expanded', 'false'); };
    btnMenu.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; btnMenu.setAttribute('aria-expanded', String(!menu.hidden)); });
    menu.addEventListener('click', (e) => { if (e.target.closest('button')) fecharMenu(); });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) fecharMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });
    iniciar();
});
