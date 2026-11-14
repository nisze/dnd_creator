// Persistência local (localStorage): personagens, rascunho de criação e configurações. O estado é salvo por nomes/ids e reconstruído com o motor de regras.
const ARMAZ = {
    chaves: { personagens: 'dnd5e.personagens.v1', rascunho: 'dnd5e.rascunho.v1', config: 'dnd5e.config.v1' },
    versao: 1, edicao: '2014',
    // Em testes ou navegadores sem localStorage, usa memória.
    backend: (typeof localStorage !== 'undefined') ? localStorage : (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; })()
};
const _lerJSON = (chave, padrao) => { try { const t = ARMAZ.backend.getItem(chave); return t ? JSON.parse(t) : padrao; } catch (e) { return padrao; } };
const _gravarJSON = (chave, valor) => { try { ARMAZ.backend.setItem(chave, JSON.stringify(valor)); return null; } catch (e) { return 'Não foi possível gravar (armazenamento cheio ou bloqueado): ' + e.message; } };
const _novoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---- estado <-> dados salvos ----
// Cada seleção vira um registro mínimo (nome e, quando existir, id, talento, asi, magia) e é procurada de novo entre as opções da escolha.
function _resumoSelecao(s) {
    const r = { nome: s.nome || s.Nome || s.texto || '' };
    const n = s.node;
    if (n && n.id) r.id = n.id;
    if (n && n.nome_ingles) r.ingles = n.nome_ingles;
    if (s.talento) r.talento = true;
    if (s.asi) r.asi = s.asi;
    if (s.magia && s.magia.id) r.magia = s.magia.id;
    return r;
}
function _casaSelecao(opcao, r) {
    if (r.asi) return !!opcao.asi && JSON.stringify(opcao.asi) === JSON.stringify(r.asi);
    if (r.magia) return !!opcao.magia && opcao.magia.id === r.magia;
    if (r.talento) return !!opcao.talento && String(opcao.nome).toLowerCase() === String(r.nome).toLowerCase() && ((opcao.node && opcao.node.nome_ingles) || '') === (r.ingles || '');
    if (r.id) return !!opcao.node && opcao.node.id === r.id;
    return (opcao.nome === r.nome || (!!r.ingles && (/^Mark of /.test(r.nome) || r.nome === r.ingles) && !!opcao.node && opcao.node.nome_ingles === r.ingles)) && (!r.ingles || !opcao.node || (opcao.node.nome_ingles || '') === r.ingles);
}

function serializarEstado() {
    if (contextoDeClasse()) return comClasse(0, serializarEstado);
    const selecoes = (cat, no) => {
        const o = {};
        getActiveChoices(no, no.nome || no.Nome, cat).forEach(c => { const r = charState.escolhas[cat][c.id]; if (r) o[c.id] = r.selecionados.map(_resumoSelecao); });
        return o;
    };
    const escolhas = {};
    ['raca', 'classe', 'antecedente'].forEach(cat => { escolhas[cat] = charState[cat] ? selecoes(cat, charState[cat]) : {}; });
    const outras = (charState.outras || []).map((_, i) => comClasse(i + 1, () => ({ classe: charState.classe.id, nivel: charState.nivel, escolhas: selecoes('classe', charState.classe) })));
    return {
        nivel: charState.nivel, outras, tasha: !!charState.tasha, tashaUsa: { ...(charState.tashaUsa || {}) }, origemPersonalizada: !!charState.origemPersonalizada, justificativas: { ...(charState.justificativas || {}) },
        raca: charState.raca ? (charState.raca.nome || charState.raca.Nome) : null,
        classe: charState.classe ? charState.classe.id : null,
        antecedente: charState.antecedente ? (charState.antecedente.nome || charState.antecedente.Nome) : null,
        atributosBase: { ...charState.atributosBase }, bonusRacial: { ...(charState.bonusRacial || {}) }, escolhas,
        inventario: JSON.parse(JSON.stringify(charState.inventario || [])),
        equipInicial: JSON.parse(JSON.stringify(charState.equipInicial || {})),
        retrato: charState.retrato || null, retratoOrig: charState.retratoOrig || null, retratoPos: charState.retratoPos ? { ...charState.retratoPos } : null, pvNiveis: JSON.parse(JSON.stringify(charState.pvNiveis || [])),
        pvAtual: charState.pvAtual == null ? null : charState.pvAtual, pvTemp: charState.pvTemp || 0, folha: JSON.parse(JSON.stringify(charState.antecedente ? garantirFolha() : (charState.folha || novaFolha()))),
        nomePersonagem: charState.nomePersonagem || '', historico: JSON.parse(JSON.stringify(charState.historico || []))
    };
}

// Reconstrói charState; devolve { ok, perdas } onde `perdas` lista seleções que não existem mais nos dados.
function restaurarEstado(e) {
    if (contextoDeClasse()) _trocarContexto(0);
    const perdas = [];
    const raca = db.racas.find(r => (r.nome || r.Nome) === e.raca), classe = db.classes.find(c => c.id === e.classe), ant = db.antecedentes.find(a => (a.nome || a.Nome) === e.antecedente) || db.antecedentes.find(a => a.nome_ingles === e.antecedente);
    if (!raca) perdas.push('Raça não encontrada: ' + e.raca);
    if (!classe) perdas.push('Classe não encontrada: ' + e.classe);
    if (!ant) perdas.push('Antecedente não encontrado: ' + e.antecedente);
    const outras = [], outrasSalvas = [];
    (e.outras || []).forEach(o => {
        const c = db.classes.find(x => x.id === o.classe);
        if (!c) { perdas.push('Classe não encontrada: ' + o.classe); return; }
        outras.push({ classe: c, nivel: o.nivel || 1, escolhas: {} }); outrasSalvas.push(o);
    });
    Object.assign(charState, {
        outras,
        nivel: e.nivel || 1, tasha: !!e.tasha, tashaUsa: e.tashaUsa ? { ...e.tashaUsa } : (e.tasha ? todasSubstituicoesTasha() : {}), justificativas: { ...(e.justificativas || {}) }, origemPersonalizada: e.origemPersonalizada === undefined ? Object.keys(e.bonusRacial || {}).length > 0 : !!e.origemPersonalizada, raca: raca || null, classe: classe || null, antecedente: ant || null,
        atributosBase: { ...e.atributosBase }, bonusRacial: { ...(e.bonusRacial || {}) }, escolhas: { raca: {}, classe: {}, antecedente: {} },
        inventario: JSON.parse(JSON.stringify(e.inventario || [])), equipInicial: JSON.parse(JSON.stringify(e.equipInicial || charState.equipInicial)),
        retrato: e.retrato || null, retratoOrig: e.retratoOrig || null, retratoPos: e.retratoPos ? { ...e.retratoPos } : null, pvNiveis: JSON.parse(JSON.stringify(e.pvNiveis || [])), pvAtual: e.pvAtual == null ? null : e.pvAtual, pvTemp: e.pvTemp || 0, folha: (() => { const f = JSON.parse(JSON.stringify(e.folha || {})); return Object.assign(novaFolha(), f, { moedas: Object.assign(novaFolha().moedas, f.moedas || {}) }); })(),
        nomePersonagem: e.nomePersonagem || '', historico: JSON.parse(JSON.stringify(e.historico || []))
    });
    if (ant && ant.proficiencias_extras) ant.conteudo = ant.proficiencias_extras;
    // O Tasha é um livro como os outros: personagem que usa as opções dele liga o livro.
    if (e.tasha && !(config.livros || {})[CHAVE_TASHA]) { definirLivro(CHAVE_TASHA, true); try { salvarConfig({ livros: config.livros }); } catch (x) { /* configuração é opcional */ } }
    const pendentes = {};
    ['raca', 'classe', 'antecedente'].forEach(cat => Object.entries((e.escolhas || {})[cat] || {}).forEach(([id, sel]) => { pendentes[cat + ':' + id] = sel; }));
    outrasSalvas.forEach((o, i) => Object.entries(o.escolhas || {}).forEach(([id, sel]) => { pendentes['classe#' + (i + 1) + ':' + id] = sel; }));
    // Escolhas aninhadas só aparecem depois das anteriores: repete até não haver progresso. As classes adicionais têm o próprio contexto (chave "classe#N").
    const fontes = [{ cat: 'raca', idx: 0 }, { cat: 'classe', idx: 0 }, { cat: 'antecedente', idx: 0 }].concat(outras.map((_, i) => ({ cat: 'classe', idx: i + 1 })));
    for (let volta = 0; volta < 80; volta++) {
        let progresso = false;
        fontes.forEach(({ cat, idx }) => {
            comClasse(idx, () => {
                if (!charState[cat]) return;
                const prefixo = idx ? cat + '#' + idx : cat;
                getActiveChoices(charState[cat], charState[cat].nome || charState[cat].Nome, cat).forEach(c => {
                    const chave = prefixo + ':' + c.id; const salvo = pendentes[chave];
                    if (!salvo || charState.escolhas[cat][c.id]) return;
                    const opcoes = opcoesDaEscolha(cat, c, c.id).opcoes;
                    const brutas = Array.isArray(c.node.conteudo) ? c.node.conteudo.map(n => ({ nome: n.nome || n.Nome || n.texto, node: n })) : [];
                    const achadas = salvo.map(r => opcoes.find(o => _casaSelecao(o, r)) || brutas.find(o => _casaSelecao(o, r)));
                    if (achadas.some(a => !a)) return;
                    charState.escolhas[cat][c.id] = { nodeOrigem: c.node, selecionados: achadas };
                    delete pendentes[chave]; progresso = true;
                });
            });
        });
        if (!progresso) break;
    }
    // As magias preparadas não são mais escolhidas na criação (são marcadas na ficha): personagens antigos trazem essa escolha, que é descartada em silêncio.
    Object.entries(pendentes).forEach(([chave, sel]) => { if (/:MAGIA-preparadas$/.test(chave)) return; perdas.push('Escolha não restaurada (' + chave.split(':')[0] + '): ' + sel.map(r => r.nome).join(', ')); });
    return { ok: !!(raca && classe && ant), perdas };
}

// ---- personagens ----
function listarPersonagens() { return _lerJSON(ARMAZ.chaves.personagens, []).sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || '')); }
function resumoPersonagem(r) { const o = r.estado.outras || []; return { id: r.id, nome: r.nome, raca: r.estado.raca, classe: r.estado.classe, nivel: (r.estado.nivel || 1) + o.reduce((s, x) => s + (x.nivel || 0), 0), outras: o.map(x => ({ classe: x.classe, nivel: x.nivel })), atualizadoEm: r.atualizadoEm }; }
function obterPersonagem(id) { return listarPersonagens().find(p => p.id === id) || null; }

// Salva o estado atual; devolve { id, erro }. Com `id`, atualiza o registro existente.
function salvarPersonagem(nome, id) {
    const todos = _lerJSON(ARMAZ.chaves.personagens, []); const agora = new Date().toISOString();
    const estado = serializarEstado(); estado.nomePersonagem = nome || estado.nomePersonagem || '';
    let reg = id && todos.find(p => p.id === id);
    if (reg) { reg.nome = nome || reg.nome; reg.estado = estado; reg.atualizadoEm = agora; }
    else { reg = { id: _novoId(), versao: ARMAZ.versao, edicao: ARMAZ.edicao, nome: nome || 'Sem nome', criadoEm: agora, atualizadoEm: agora, estado }; todos.push(reg); }
    const erro = _gravarJSON(ARMAZ.chaves.personagens, todos);
    return { id: reg.id, erro };
}
function carregarPersonagem(id) {
    const reg = obterPersonagem(id); if (!reg) return { ok: false, perdas: ['Personagem não encontrado.'] };
    const r = restaurarEstado(migrarRegistro(reg).estado); charState.idSalvo = id; return r;
}
function excluirPersonagem(id) { return _gravarJSON(ARMAZ.chaves.personagens, _lerJSON(ARMAZ.chaves.personagens, []).filter(p => p.id !== id)); }
function duplicarPersonagem(id) {
    const todos = _lerJSON(ARMAZ.chaves.personagens, []); const o = todos.find(p => p.id === id); if (!o) return { id: null, erro: 'Personagem não encontrado.' };
    const c = JSON.parse(JSON.stringify(o)); c.id = _novoId(); c.nome = o.nome + ' (cópia)'; c.criadoEm = c.atualizadoEm = new Date().toISOString(); c.estado.nomePersonagem = c.nome; todos.push(c);
    return { id: c.id, erro: _gravarJSON(ARMAZ.chaves.personagens, todos) };
}
function exportarPersonagem(id) { const o = obterPersonagem(id); return o ? JSON.stringify(o, null, 2) : null; }
function importarPersonagem(texto) {
    let o; try { o = JSON.parse(texto); } catch (e) { return { id: null, erro: 'Arquivo inválido (não é JSON).' }; }
    if (!o || !o.estado || !o.estado.classe || !o.estado.raca) return { id: null, erro: 'Arquivo sem dados de personagem.' };
    o = migrarRegistro(o); const todos = _lerJSON(ARMAZ.chaves.personagens, []); o.id = _novoId(); o.atualizadoEm = new Date().toISOString(); todos.push(o);
    return { id: o.id, erro: _gravarJSON(ARMAZ.chaves.personagens, todos) };
}
// Atualiza registros antigos para a versão atual (por enquanto só a 1).
function migrarRegistro(r) { r.versao = r.versao || 1; r.edicao = r.edicao || '2014'; r.estado.pvNiveis = r.estado.pvNiveis || []; r.estado.historico = r.estado.historico || []; r.estado.outras = r.estado.outras || []; return r; }

// ---- rascunho da criação e configurações ----
function salvarRascunho() { return _gravarJSON(ARMAZ.chaves.rascunho, { salvoEm: new Date().toISOString(), estado: serializarEstado() }); }
function lerRascunho() { return _lerJSON(ARMAZ.chaves.rascunho, null); }
function limparRascunho() { ARMAZ.backend.removeItem(ARMAZ.chaves.rascunho); }
function continuarRascunho() { const r = lerRascunho(); return r ? restaurarEstado(migrarRegistro({ estado: r.estado }).estado) : { ok: false, perdas: ['Não há rascunho.'] }; }
const CONFIG_PADRAO = { ua: false, terceiros: false, tasha: false, livros: {} };
function lerConfig() { return { ...CONFIG_PADRAO, ..._lerJSON(ARMAZ.chaves.config, {}) }; }
function salvarConfig(parcial) { return _gravarJSON(ARMAZ.chaves.config, { ...lerConfig(), ...parcial }); }
