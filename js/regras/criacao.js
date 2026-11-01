// Regras do fluxo de criação sem interface: filtros de UA/terceiros, pendências, subclasse, atributos e equipamento inicial.

// ---- Fontes (livros) ----
// O Player's Handbook está sempre ligado. Todo o resto só aparece com o livro ligado; UA e terceiros têm interruptores próprios.
const CHAVE_PHB = 'playershandbook', CHAVE_TASHA = 'tashascauldronofeverything';
const _semAcentoLivro = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const chaveLivro = (s) => _semAcentoLivro(s).replace(/[^a-z0-9]+/g, '');
// O mesmo livro aparece escrito de jeitos diferentes nos dados.
const ALIAS_LIVRO = { acquisitionsincorporated: 'acquisitionsinc', wayfarersguidetoeberron: 'wayfindersguidetoeberron', spelljammeradventuresinspaceastraladventurersguide: 'astraladventurersguide', spelljammerastraladventurersguide: 'astraladventurersguide', phb: 'playershandbook', tce: 'tashascauldronofeverything' };
const NOME_LIVRO = { acquisitionsinc: 'Acquisitions Incorporated', astraladventurersguide: "Spelljammer: Astral Adventurer's Guide", wayfindersguidetoeberron: "Wayfinder's Guide to Eberron" };
// Livros listados no painel: nome mostrado e grupo.
const SUPLEMENTOS_REGRAS = ['tashascauldronofeverything', 'xanatharsguidetoeverything', 'mordenkainenpresentsmonstersofthemultiverse', 'swordcoastadventurersguide', 'dungeonmastersguide', 'mordenkainenstomeoffoes', 'volosguidetomonsters', 'fizbanstreasuryofdragons', 'bigbypresentsgloryofthegiants', 'elementalevilplayerscompanion', 'eberronrisingfromthelastwar', 'guildmastersguidetoravnica', 'mythicodysseysoftheros', 'vanrichtensguidetoravenloft'];

// Livros citados numa string de fonte (pode ter vários, separados por "/", vírgula ou quebra de linha). UA e terceiros não são livros.
function livrosDeFonte(f) {
    if (!f) return [];
    return String(f).split(/\n|\/|,\s+(?!Extra Life)/).map(p => p.replace(/\.$/, '').replace(/\s*\[(UA|HB)\]\s*$/i, '').trim())
        .filter(p => p && !/^unearthed arcana/i.test(p) && !/^UA$/.test(p) && !/dnd beyond/i.test(p))
        .map(p => { const k = chaveLivro(p); const chave = ALIAS_LIVRO[k] || k; return { chave, nome: NOME_LIVRO[chave] || p }; });
}
const fonteBrutaDe = (x) => (x && (x.fonte || (x.node && x.node.fonte))) || '';
const livroLigado = (chave) => chave === CHAVE_PHB || !!config.livrosTodos || !!(config.livros && config.livros[chave]);
// Sem fonte identificada: não há o que filtrar. Com várias fontes, basta uma ligada.
function livroPermitido(x) {
    const ls = livrosDeFonte(fonteBrutaDe(x));
    return !ls.length || ls.some(l => livroLigado(l.chave));
}
const _ehUA = (x) => !!x && (!!x.ua || /unearthed arcana/i.test(fonteBrutaDe(x)) || /^UA$/.test(fonteBrutaDe(x).trim()));
// "Outras versões (outras fontes)": cada opção é um livro; só vale decidir por elas se o livro estiver ligado.
const ehGrupoOutrasFontes = (no) => !!no && /^Outras versões \(outras fontes\)$/i.test(no.nome || '');
const ehOpcional = (no) => !!no && (!!no.escolha_opcional || ehGrupoOutrasFontes(no));

// Conteúdo UA e de terceiros só aparece com o interruptor correspondente ligado; o resto, com o livro ligado.
const permitido = (x) => {
    if (!x) return true;
    if (_ehUA(x) && !config.ua) return false;
    if (x.homebrew && !config.terceiros) return false;
    if (_soVariantesBloqueadas(x)) return false;
    return _ehUA(x) || x.homebrew || livroPermitido(x);
};
// Raça cuja única escolha é a variante e todas as variantes são de livros desligados (ex.: Kender): não há como seguir, então some da lista.
const _soVariantesBloqueadas = (x) => {
    const g = Array.isArray(x.conteudo) && x.conteudo.length === 1 ? x.conteudo[0] : null;
    const v = g && g.escolha && Array.isArray(g.conteudo) ? g.conteudo : null;
    return !!v && v.length > 0 && v.every(c => c && c.fonte && !_ehUA(c) && !c.homebrew && !livroPermitido(c));
};
const motivoBloqueio = (x) => _ehUA(x) && !config.ua ? 'ua' : ((x.homebrew && !config.terceiros) ? 'terceiros' : (!_ehUA(x) && !x.homebrew && !livroPermitido(x) ? 'livro' : null));
const marcasDe = (s) => ({ ua: !!(s.ua || nodeEhUA(s.node || s)), homebrew: !!(s.homebrew || nodeEhHomebrew(s.node || s)), fonte: fonteBrutaDe(s), node: s.node });

// Livros que existem nos dados, com quanto conteúdo cada um traz. [{ chave, nome, qtd: { racas, ... } }]
let _catalogoLivros = null;
function catalogoLivros() {
    if (_catalogoLivros && _catalogoLivros.n === (db.magicos || []).length) return _catalogoLivros.lista;
    const mapa = {};
    const add = (fonte, tipo, x) => { if (x && (_ehUA(x) || x.homebrew)) return; livrosDeFonte(fonte).forEach(l => { const m = mapa[l.chave] || (mapa[l.chave] = { chave: l.chave, nome: l.nome, qtd: {} }); m.qtd[tipo] = (m.qtd[tipo] || 0) + 1; }); };
    const subclasses = (n) => { if (Array.isArray(n)) return n.forEach(subclasses); if (n && typeof n === 'object') { if (n.nivel_escolha !== undefined && Array.isArray(n.conteudo)) n.conteudo.forEach(s => add(s.fonte, 'subclasses', s)); subclasses(n.conteudo); } };
    const outras = (n) => { if (Array.isArray(n)) return n.forEach(outras); if (n && typeof n === 'object') { if (ehGrupoOutrasFontes(n) && Array.isArray(n.conteudo)) n.conteudo.forEach(o => { if (!o.outra_fonte) add(o.nome, 'variantes', o); }); else if (n.outra_fonte) add(n.fonte, 'variantes', n); outras(n.conteudo); } };
    db.racas.forEach(r => { add(r.fonte, 'racas', r); outras(r.conteudo); });
    db.classes.forEach(c => subclasses(c.conteudo));
    db.talentos.forEach(t => add(t.fonte, 'talentos', t));
    db.antecedentes.forEach(a => add(a.fonte, 'antecedentes', a));
    db.magias.forEach(m => add(m.fonte, 'magias', m));
    (db.magicos || []).forEach(i => add(i.fonte, 'itens', i));
    const lista = Object.values(mapa).filter(l => l.chave !== CHAVE_PHB);
    _catalogoLivros = { n: (db.magicos || []).length, lista };
    return lista;
}
// Liga/desliga um livro; o Tasha também liga as opções de classe do livro (charState.tasha).
function definirLivro(chave, ligado) {
    config.livros = config.livros || {}; if (ligado) config.livros[chave] = true; else delete config.livros[chave];
    if (chave === CHAVE_TASHA) charState.tasha = !!ligado;
}

// Quanto falta decidir: cada item traz a categoria, a escolha e o que falta.
function escolhasPendentes(cat, filtro) {
    if (!charState[cat]) return [];
    return getActiveChoices(charState[cat], charState[cat].nome || charState[cat].Nome, cat)
        .filter(c => !filtro || filtro(c))
        .map(c => ({ cat, c, limite: typeof c.escolhaVal === 'number' ? c.escolhaVal : 1, feitas: ((charState.escolhas[cat][c.id] || {}).selecionados || []).length }))
        .filter(p => !ehOpcional(p.c.node) && p.feitas < p.limite);
}

// Escolha de subclasse da classe atual: nível em que ocorre e, se já liberada, a escolha ativa.
function subclasseInfo() {
    if (!charState.classe) return null;
    let no = null; const visita = (n) => { if (Array.isArray(n)) return n.forEach(visita); if (n && typeof n === 'object') { if (n.nivel_escolha !== undefined && !no) no = n; visita(n.conteudo); } };
    visita(charState.classe.conteudo);
    if (!no) return null;
    const ativa = semMagias(() => getActiveChoices(charState.classe, charState.classe.nome || charState.classe.Nome, 'classe')).find(c => c.node === no) || null;
    return { nivel: no.nivel_escolha, no, escolha: ativa, liberada: !!ativa };
}
const ehEscolhaDeSubclasse = (c) => c.node.nivel_escolha !== undefined;

// Itens já escolhidos que dependem de um conteúdo agora desligado (UA/terceiros).
function selecoesIncompativeis() {
    const l = [];
    ['raca', 'classe', 'antecedente'].forEach(cat => { const n = charState[cat]; if (n && !permitido(n)) l.push({ cat, id: null, nome: n.nome || n.Nome, motivo: motivoBloqueio(n) }); });
    ['raca', 'classe', 'antecedente'].forEach(cat => escolhasResolvidas(cat).forEach(({ c, res }) => res.selecionados.forEach(s => { const m = marcasDe(s); if (!permitido(m)) l.push({ cat, id: c.id, nome: s.nome || s.Nome || s.texto, motivo: motivoBloqueio(m) }); })));
    return l;
}
function removerSelecoesIncompativeis() {
    ['raca', 'classe', 'antecedente'].forEach(cat => {
        const n = charState[cat]; if (n && !permitido(n)) { charState[cat] = null; charState.escolhas[cat] = {}; return; }
        escolhasResolvidas(cat).forEach(({ c, res }) => { res.selecionados = res.selecionados.filter(s => permitido(marcasDe(s))); if (!res.selecionados.length) delete charState.escolhas[cat][c.id]; });
    });
}

// ---- Atributos ----
const CONJUNTO_PADRAO = [15, 14, 13, 12, 10, 8];
const CUSTO_COMPRA = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const PONTOS_COMPRA = 27;
const custoCompra = (valor) => CUSTO_COMPRA[valor];
const pontosGastos = (base) => Object.values(base).reduce((s, v) => s + (CUSTO_COMPRA[v] === undefined ? 0 : CUSTO_COMPRA[v]), 0);
// Pode mudar o atributo para `novo` mantendo o orçamento? Devolve null se sim, ou o motivo do bloqueio.
function motivoCompraBloqueada(base, chave, novo) {
    if (novo < 8) return 'Na compra de pontos o valor mínimo é 8.';
    if (novo > 15) return 'Na compra de pontos o valor máximo é 15 (antes dos bônus de raça).';
    const t = { ...base, [chave]: novo }; const gasto = pontosGastos(t);
    if (gasto > PONTOS_COMPRA) return `Pontos insuficientes: custaria ${gasto} de ${PONTOS_COMPRA}.`;
    return null;
}
// Próximo valor do conjunto (padrão ou rolado) ainda livre, no sentido pedido; null = sem valor (atributo vazio).
function proximoValorLivre(pool, atribuidos, chave, sentido) {
    const usados = { }; Object.entries(atribuidos).forEach(([k, v]) => { if (k !== chave && v != null) usados[v] = (usados[v] || 0) + 1; });
    const disp = []; const cont = {}; pool.forEach(v => { cont[v] = (cont[v] || 0) + 1; });
    Object.keys(cont).map(Number).forEach(v => { if ((usados[v] || 0) < cont[v]) disp.push(v); });
    disp.sort((a, b) => a - b);
    const atual = atribuidos[chave];
    if (sentido > 0) return atual == null ? (disp[0] ?? null) : (disp.find(v => v > atual) ?? atual);
    return atual == null ? null : ([...disp].reverse().find(v => v < atual) ?? null);
}
// 4d6 descartando o menor.
function rolar4d6(rnd) { const r = rnd || Math.random; const d = Array.from({ length: 4 }, () => 1 + Math.floor(r() * 6)).sort((a, b) => a - b); return d[1] + d[2] + d[3]; }

// ---- Equipamento inicial (sem interface) ----
function equipInicialAplicar() {
    const ei = charState.equipInicial;
    charState.inventario = charState.inventario.filter(i => i.origem === 'compra' || i.origem === 'magico' || i.origem === 'ficha');
    const novos = [];
    if (ei.modo === 'equipamento' && charState.classe && charState.antecedente) {
        const cfg = db.equipInicial[charState.classe.id];
        if (cfg) cfg.grupos.forEach((g, gi) => {
            const e = ei.escolhas[gi] || {}; const op = g.opcoes[g.escolha ? e.op : 0]; if (!op) return;
            op.itens.forEach((it, ii) => {
                if (it.ref) { const l = lojaPorId(it.ref); if (l) novos.push(itemDeLoja(l, { qtd: it.qtd, origem: 'inicial' })); }
                else if (it.tipo === 'texto') novos.push({ id: novoIdInv(), cat: 'texto', nome: it.nome, nome_en: '', qtd: 1, custo: 0, mec: null, desc: '', origem: 'inicial' });
                else ((e.picks || {})[ii] || []).forEach(id => { const l = lojaPorId(id); if (l) novos.push(itemDeLoja(l, { origem: 'inicial' })); });
            });
        });
        equipDoAntecedente(charState.antecedente).itens.forEach(t => novos.push({ id: novoIdInv(), cat: 'texto', nome: t, nome_en: '', qtd: 1, custo: 0, mec: null, desc: '', origem: 'inicial' }));
    }
    charState.inventario = novos.concat(charState.inventario);
}
// Zera a configuração quando a classe ou o antecedente mudam.
function equipInicialSincronizar() {
    const ei = charState.equipInicial; if (!charState.classe || !charState.antecedente) return;
    const nomeAnt = charState.antecedente.nome || charState.antecedente.Nome;
    if (ei.classeId !== charState.classe.id || ei.antecedenteNome !== nomeAnt) { ei.classeId = charState.classe.id; ei.antecedenteNome = nomeAnt; ei.escolhas = {}; ei.ouro = null; }
}
function ouroInicialLimites() {
    const cfg = db.equipInicial[charState.classe.id].ouro; const [n, lados] = cfg.dados.split('d').map(Number);
    return { cfg, min: n * cfg.mult, max: n * lados * cfg.mult, medio: Math.round(n * (lados + 1) / 2 * cfg.mult), n, lados };
}
function ouroInicialDefinir(v) { const l = ouroInicialLimites(); let x = Math.round(parseFloat(v)); if (isNaN(x)) x = l.min; charState.equipInicial.ouro = Math.min(l.max, Math.max(l.min, x)); }
function ouroInicialRolar() { const l = ouroInicialLimites(); let s = 0; for (let i = 0; i < l.n; i++) s += 1 + Math.floor(Math.random() * l.lados); ouroInicialDefinir(s * l.cfg.mult); }
function inventarioAdicionar(l) {
    if (l.cat !== 'magico') {
        if (l.custo_po == null) return 'Este item não tem preço de tabela e não pode ser comprado.';
        if (!lojaAberta()) return 'A loja só está disponível no modo "Ouro inicial".';
    }
    const c = l.custo_po || 0; if (c > saldo()) return 'Saldo insuficiente.';
    const origem = l.cat === 'magico' ? 'magico' : 'compra';
    const ja = charState.inventario.find(i => i.ref === l.id && i.origem === origem);
    if (ja && l.cat !== 'magico') { ja.qtd++; ja.custo += c; } else if (!ja) charState.inventario.push(itemDeLoja(l, { custo: c, origem, ...(l.ua ? { ua: true } : {}) }));
    return null;
}
function inventarioRemover(id) {
    const idx = charState.inventario.findIndex(i => i.id === id); if (idx < 0) return;
    const it = charState.inventario[idx];
    if (it.origem === 'compra' && it.qtd > 1) { const un = it.custo / it.qtd; it.qtd--; it.custo -= un; } else charState.inventario.splice(idx, 1);
}
