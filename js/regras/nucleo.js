// Funções básicas das regras (níveis, escolhas, atributos).
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const nodeEhUA = (n) => !!(n && (n.ua || /\(UA\)/i.test(n.nome || n.Nome || n.texto || '')));
const nodeEhHomebrew = (n) => !!(n && n.homebrew);
// Nós de nível maior que o do personagem e habilidades opcionais não entram.
// `nivelAtual()` é o nível da classe em contexto; dentro de raça/antecedente/talentos vale o nível total (ver comNivel).
let _nivelFixo = null;
const nivelAtual = () => _nivelFixo !== null ? _nivelFixo : charState.nivel;
function comNivel(v, f) { const a = _nivelFixo; _nivelFixo = v; try { return f(); } finally { _nivelFixo = a; } }

// ---------- Multiclasse: contexto de classe ----------
// charState.classe / nivel / escolhas.classe descrevem a classe "em contexto". A principal é o índice 0; as demais ficam em charState.outras ({ classe, nivel, escolhas }).
// comClasse(idx, f) troca o contexto só durante f. Fora de qualquer contexto (índice 0) as listas de classe (nodesAtivos, escolhasResolvidas) somam todas as classes.
let _ctxClasse = 0, _guardaPrincipal = null, _agg = 0;
function _slotClasse(idx) {
    if (idx === _ctxClasse) return { classe: charState.classe, nivel: charState.nivel, escolhas: charState.escolhas.classe };
    return idx === 0 ? _guardaPrincipal : charState.outras[idx - 1];
}
function _trocarContexto(idx) {
    if (_ctxClasse) {
        const o = charState.outras[_ctxClasse - 1];
        o.classe = charState.classe; o.nivel = charState.nivel; o.escolhas = charState.escolhas.classe;
        charState.classe = _guardaPrincipal.classe; charState.nivel = _guardaPrincipal.nivel; charState.escolhas.classe = _guardaPrincipal.escolhas;
        _ctxClasse = 0; _guardaPrincipal = null;
    }
    if (idx) {
        const o = charState.outras[idx - 1];
        _guardaPrincipal = { classe: charState.classe, nivel: charState.nivel, escolhas: charState.escolhas.classe };
        charState.classe = o.classe; charState.nivel = o.nivel; charState.escolhas.classe = o.escolhas;
        _ctxClasse = idx;
    }
    _cacheSubst = { chave: null, nomes: [] };
}
function comClasse(idx, f) {
    if (idx === _ctxClasse) return f();
    const ant = _ctxClasse; _trocarContexto(idx);
    try { return f(); } finally { _trocarContexto(ant); }
}
const contextoDeClasse = () => _ctxClasse;
const todasClasses = () => [0].concat((charState.outras || []).map((_, i) => i + 1)).map(idx => ({ idx, ..._slotClasse(idx) })).filter(c => c.classe);
const nivelTotal = () => (charState.outras || []).reduce((s, o, i) => s + _slotClasse(i + 1).nivel, _slotClasse(0).nivel || 0);
const nivelDaClasse = (id) => todasClasses().filter(c => c.classe.id === id).reduce((s, c) => s + c.nivel, 0);
// Roda f em cada classe (sem somar de novo) e junta as listas devolvidas.
function porClasse(f) { const r = []; todasClasses().forEach(c => comClasse(c.idx, () => { _agg++; try { r.push(...f(c)); } finally { _agg--; } })); return r; }
const soClasse = (idx, f) => comClasse(idx, () => { _agg++; try { return f(); } finally { _agg--; } });
const somandoClasses = () => !_agg && (charState.outras || []).length > 0;
const ehNoDeNivel = (n) => /^Nível\s+\d+/.test(n.nome || n.Nome || '');
const nivelDoNode = (n) => { const m = /^Nível\s+(\d+)/.exec(n.nome || n.Nome || ''); return m ? parseInt(m[1], 10) : (typeof n.nivel === 'number' ? n.nivel : null); };
// Características opcionais do Tasha: só valem com o interruptor ligado. As que apenas acrescentam algo entram sempre; as que substituem uma original (`substitui`)
// só valem se o jogador escolher a versão do Tasha (charState.tashaUsa[nome original em minúsculas]). Sem escolha, vale a original do Livro do Jogador.
let _cacheSubst = { chave: null, nomes: [] };
let _tudoTasha = false; // ligado só para listar as duas versões lado a lado (opcoesTasha)
const usaTasha = (s) => !!(charState.tashaUsa && charState.tashaUsa[String(s).toLowerCase()]);
const tashaValeu = (n) => !!charState.tasha && (!Array.isArray(n.substitui) || !n.substitui.length || n.substitui.some(usaTasha));
function substituidosTasha() {
    if (!charState.tasha || !charState.classe) return [];
    const chave = charState.classe.id + ':' + charState.nivel + ':' + JSON.stringify(charState.tashaUsa || {});
    if (_cacheSubst.chave === chave) return _cacheSubst.nomes;
    const nomes = [];
    const visita = (n, nivelPai) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) return n.forEach(x => visita(x, nivelPai));
        const nv = ehNoDeNivel(n) ? nivelDoNode(n) : nivelPai;
        if (nv !== null && nv > charState.nivel) return;
        if (n.opcional === true && Array.isArray(n.substitui)) n.substitui.filter(usaTasha).forEach(s => nomes.push(s.toLowerCase()));
        visita(n.conteudo, nv);
    };
    visita(charState.classe.conteudo, null);
    _cacheSubst = { chave, nomes };
    return nomes;
}
const substituidoPorTasha = (n) => n.opcional !== true && !!n.nome_ingles && substituidosTasha().some(s => n.nome_ingles.toLowerCase().startsWith(s));
const foraDoNivel = (n) => !!n && typeof n === 'object' && ((n.opcional === true && (_tudoTasha ? !charState.tasha : !tashaValeu(n))) || (nivelDoNode(n) !== null && nivelDoNode(n) > nivelAtual()) || (!_tudoTasha && substituidoPorTasha(n)));

// Todas as substituições que o Tasha oferece (personagens salvos antes da escolha por característica usavam sempre a versão do Tasha).
function todasSubstituicoesTasha() {
    const m = {};
    const visita = (n) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(visita); if (n.opcional === true && Array.isArray(n.substitui)) n.substitui.forEach(s => { m[s.toLowerCase()] = true; }); visita(n.conteudo); };
    (db.classes || []).forEach(c => visita(c.conteudo));
    return m;
}

// Pares "original do Livro do Jogador x versão do Tasha" da classe atual (até o nível atual), para o jogador decidir qual usar.
function opcoesTasha() {
    if (!charState.tasha || !charState.classe) return [];
    let nos; _tudoTasha = true; _agg++;
    try { nos = nodesAtivos('classe').concat(getActiveChoices(charState.classe, charState.classe.nome || charState.classe.Nome, 'classe').map(c => c.node)); } finally { _tudoTasha = false; _agg--; }
    const grupos = new Map();
    nos.filter(n => n.opcional === true && Array.isArray(n.substitui)).forEach(n => n.substitui.forEach(s => {
        const k = s.toLowerCase(), g = grupos.get(k) || { chave: k, tasha: [], originais: [] };
        if (!g.tasha.includes(n)) g.tasha.push(n);
        grupos.set(k, g);
    }));
    const nomeNo = (n) => String(n.nome || n.Nome || n.nome_ingles || '').trim();
    const niveis = new Map();
    const marca = (n, v) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(x => marca(x, v)); const nv = ehNoDeNivel(n) ? nivelDoNode(n) : v; niveis.set(n, nv); marca(n.conteudo, nv); };
    marca(charState.classe.conteudo, null);
    const nivelNo = (n) => { if (typeof n.nivel === 'number') return n.nivel; const v = niveis.get(n); if (v != null) return v; const p = nivelDoNode(n); return p === null ? 1 : p; };
    const saida = [];
    grupos.forEach(g => {
        g.originais = nos.filter(n => n.opcional !== true && n.nome_ingles && n.nome_ingles.toLowerCase().startsWith(g.chave));
        if (!g.originais.length) return;
        const unicos = (l) => [...new Set(l.map(nomeNo))];
        const nv = (l) => Math.min(...l.map(nivelNo));
        saida.push({ chave: g.chave, original: unicos(g.originais), tasha: unicos(g.tasha), nivel: Math.min(nv(g.originais), nv(g.tasha)), usa: usaTasha(g.chave), nosOriginais: g.originais, nosTasha: g.tasha });
    });
    return saida;
}

function achaPericia(nome) {
    const alvo = semAcento(String(nome || '').split('(')[0]);
    return PERICIAS.find(p => [p.nome, ...(p.aliases || [])].some(a => semAcento(a) === alvo));
}

function temEscolha(node) {
    const e = ('escolha' in node) ? node.escolha : node.Escolha;
    return e !== undefined && e !== false && e !== null;
}

const ehEspecializacao = (node) => /^(expertise|especializa[cç][aã]o)$/i.test(String(node.nome_ingles || '').trim()) || /^especializa[cç][aã]o$/i.test(String(node.nome || node.Nome || '').trim());

// Perícias com proficiência dobrada (Expertise), vindas de escolhas resolvidas.
// Aumento de atributo dos talentos: fixo (bonus_atributo) ou escolha entre os atributos citados no texto.
const ATTR_STEMS = { "Força": 'forca', "Destreza": 'destreza', "Constituição": 'constitui', "Inteligência": 'intelig', "Sabedoria": 'sabedor', "Carisma": 'carism' };
function atributosCitados(texto) {
    const t = semAcento(texto);
    return Object.keys(ATTR_STEMS).filter(a => t.includes(ATTR_STEMS[a]));
}

const ATTR_NAMES = ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"];
const ATTR_MAP_KEY = { "Força": "For", "Destreza": "Des", "Constituição": "Con", "Inteligência": "Int", "Sabedoria": "Sab", "Carisma": "Car" };

const fmtPO = (n) => (Math.round(n * 100) / 100).toLocaleString('pt-BR') + ' PO';
const nomeBaseItem = (i) => (!i.nome_en || i.nome === i.nome_en) ? i.nome : (typeof Idioma !== 'undefined' && Idioma.atual === 'en') ? i.nome_en : `${i.nome} (${i.nome_en})`;
// Nome dado pelo jogador (ex.: "Arco de Van Cleef") tem prioridade sobre o nome de tabela.
const nomeItem = (i) => i.apelido || nomeBaseItem(i);
const novoIdInv = () => Date.now() + Math.random();
const semPlural = (s) => semAcento(s).replace(/[^a-z\s]/g, ' ').split(/\s+/).map(w => w.replace(/s$/, '')).filter(Boolean).join(' ');
function getMod(val) { return Math.floor((val - 10) / 2); }
function formatMod(mod) { return mod >= 0 ? `+${mod}` : `${mod}`; }

