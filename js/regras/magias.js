// Conjuração: truques, magias, espaços e magias raciais.
// ==========================================
// MAGIAS: truques, conhecidas/preparadas/grimório, espaços e CD (dados/conjuracao.json)
// As escolhas de magia entram como escolhas sintéticas da classe (ids "MAGIA-...") para usar o mesmo fluxo de resolução.
// ==========================================
let _pularMagias = 0;
const semMagias = (f) => { _pularMagias++; try { return f(); } finally { _pularMagias--; } };
const ATR_CHAVE = { 'Inteligência': 'Int', 'Sabedoria': 'Sab', 'Carisma': 'Car' };
const TERRENOS = ['Arctic', 'Coast', 'Desert', 'Forest', 'Grassland', 'Mountain', 'Swamp', 'Underdark'];
const TRUQUES_BONUS_ESCOLHA = { 'druid__land': 'Druid', 'cleric__nature': 'Druid' };
const TRUQUES_FIXOS = { 'cleric__light': ['Light'], 'warlock__celestial': ['Light', 'Sacred Flame'], 'warlock__celestial-ua': ['Light', 'Sacred Flame'] };
const ARCANUM = { 6: 11, 7: 13, 8: 15, 9: 17 };
const ESTILO_TRUQUES = { 'Blessed Warrior': 'Cleric', 'Druidic Warrior': 'Druid' };
const listaTruquesEstilo = () => soClasse(contextoDeClasse(), () => semMagias(() => escolhasResolvidas('classe'))).flatMap(({ res }) => res.selecionados.map(s => (s.node && s.node.nome_ingles) || s.nome)).map(n => ESTILO_TRUQUES[n]).find(Boolean);
// Cavaleiro Místico / Trapaceiro Arcano: magias de 1º círculo+ só dessas escolas; 1 livre no 3º nível e mais 1 em cada nível 8, 14 e 20.
const ESCOLAS_SUBCLASSE = { 'fighter__eldritch-knight': ['abjuration', 'evocation'], 'rogue__arcane-trickster': ['enchantment', 'illusion'] };
const escolasLivres = (n) => 1 + [8, 14, 20].filter(l => l <= n).length;
const ESCOLA_PT = { abjuration: 'abjuração', evocation: 'evocação', enchantment: 'encantamento', illusion: 'ilusão' };
const foraDasEscolas = (nomes, escolas) => nomes.filter(n => { const m = magiaPorNome(n); return m && m.nivel > 0 && !escolas.includes(m.escola); });
const magiaPorNome = (n) => db.magias.find(m => m.nome.toLowerCase() === String(n).toLowerCase());
const magiaPorId = (id) => db.magias.find(m => m.id === id);
// Exibição: m.nome (inglês) é a chave de lógica e não muda; na tela, em português, vale a camada traduzida (Idioma.tr('magias', id)).
const ESCOLA_NOME_PT = { abjuration: 'abjuração', conjuration: 'conjuração', divination: 'adivinhação', enchantment: 'encantamento', evocation: 'evocação', illusion: 'ilusão', necromancy: 'necromancia', transmutation: 'transmutação' };
const _trMagia = (m) => (m && typeof Idioma !== 'undefined' && Idioma.tr('magias', m.id)) || null;
const nomeMagia = (m) => { const t = _trMagia(m); return (t && t.nome) || (m && m.nome) || ''; };
const nomeMagiaTxt = (n) => { const m = magiaPorNome(n); return m ? nomeMagia(m) : n; };
const escolaMagia = (m) => (_trMagia(m) && ESCOLA_NOME_PT[m.escola]) || m.escola;
const resumoMagia = (m) => { const t = _trMagia(m) || {}; return [t.tempo_conjuracao || m.tempo_conjuracao, t.alcance || m.alcance, t.duracao || m.duracao].filter(Boolean); };
const selMagia = (id) => ((charState.escolhas.classe || {})['MAGIA-' + id] || {}).selecionados || [];

function subclasseEscolhida() {
    return soClasse(contextoDeClasse(), () => semMagias(() => { const r = escolhasResolvidas('classe').find(({ c }) => c.node.nivel_escolha !== undefined); const s = r && r.res.selecionados[0]; return s && s.node ? s.node.id || null : null; }));
}

function conjuracaoAtual() {
    const c = charState.classe; if (!c || !db.conjuracao) return null; const n = nivelAtual();
    const base = db.conjuracao.classes[c.id];
    if (base && base.tipo === 'runas') return { origem: 'classe', tipo: 'runas', habilidade: ATR_CHAVE[base.habilidade], lista: null, preparacao: 'conhecidas', truques: 0, conhecidas: 0, slots: base.espacos[n - 1] || {}, ua: !!base.ua, subId: null };
    if (base && base.tipo !== 'runas') {
        if (base.magias_a_partir_do_nivel && n < base.magias_a_partir_do_nivel) return null;
        const slots = base.pacto ? { [base.pacto.nivel_do_espaco[n - 1]]: base.pacto.espacos[n - 1] } : (base.espacos ? base.espacos[n - 1] : {});
        return { origem: 'classe', tipo: base.tipo, habilidade: ATR_CHAVE[base.habilidade], lista: base.lista_de_magias, preparacao: base.preparacao, truques: base.truques ? base.truques[n - 1] : 0, conhecidas: base.magias_conhecidas ? base.magias_conhecidas[n - 1] : null, preparadas: base.preparadas || null, grimorio: base.grimorio_inicial ? base.grimorio_inicial + base.grimorio_por_nivel * (n - 1) : null, slots, ritual: !!base.ritual, ua: !!base.ua, subId: subclasseEscolhida() };
    }
    const sid = subclasseEscolhida(); const s = sid && db.conjuracao.subclasses[sid]; const lv = s && s.niveis[n];
    if (!lv) return null;
    return { origem: 'subclasse', tipo: s.tipo === 'pacto' ? 'pacto' : 'terco', habilidade: ATR_CHAVE[s.habilidade] || 'Int', lista: s.lista_de_magias, preparacao: 'conhecidas', truques: lv.truques, conhecidas: lv.conhecidas, slots: lv.espacos || {}, truqueFixo: lv.truque_fixo || null, subId: sid, sinalHB: !s.habilidade };
}
const nivelMaxMagia = (conj) => Math.max(0, ...Object.keys(conj.slots || {}).map(Number));

function qtdPreparadas(conj, atributos) {
    const p = conj.preparadas, n = nivelAtual(); const mod = getMod(atributos[conj.habilidade]);
    const parte = p.nivel_divisor === 1 ? n : (p.arredonda === 'cima' ? Math.ceil(n / p.nivel_divisor) : Math.floor(n / p.nivel_divisor));
    return Math.max(p.minimo || 1, mod + parte);
}

// Magias sempre preparadas por domínio/juramento/círculo; no Bruxo a lista expandida só amplia as opções.
function magiasDaSubclasse(conj) {
    const tabelas = (db.conjuracao.magias_de_subclasse || {})[conj.subId] || []; const n = nivelAtual();
    const auto = [], expandidas = [];
    tabelas.forEach(t => {
        let linhas = t.linhas;
        if (conj.subId === 'druid__land') { const i = TERRENOS.indexOf(((selMagia('terreno')[0]) || {}).nome); linhas = i < 0 ? [] : t.linhas.slice(i * 4, i * 4 + 4); }
        linhas.forEach(l => { if (t.tipo === 'circulo_da_magia') expandidas.push(...l.ids); else if (l.nivel <= n) auto.push(...l.ids); });
    });
    return { auto: [...new Set(auto)], expandidas: [...new Set(expandidas)] };
}

function escolhasMagia(raiz) {
    const conj = semMagias(conjuracaoAtual); if (!conj || !conj.habilidade) return [];
    const atributos = calcularAtributosFinais(); const out = [];
    const add = (id, nome, qtd, cfg, desc) => { if (qtd > 0) out.push({ id: 'MAGIA-' + id, path: raiz + ' > Magias > ' + nome, node: { simbolo: '✨', nome, escolha: qtd, magias: cfg, 'descrição': desc || '' }, escolhaVal: qtd }); };
    const max = nivelMaxMagia(conj); const sub = magiasDaSubclasse(conj);
    const fixos = (TRUQUES_FIXOS[conj.subId] || []).concat(conj.truqueFixo ? [conj.truqueFixo] : []);
    const listaExtra = soClasse(contextoDeClasse(), () => semMagias(() => nodesAtivos('classe').map(n => n.lista_extra_magias).find(Boolean)));
    const listasExtra = listaExtra && conj.origem === 'classe' ? { listas_extra: [listaExtra] } : {};
    add('truques', 'Truques', Math.max(0, conj.truques - fixos.length), { lista: conj.lista, min: 0, max: 0, excluirNomes: fixos, ...listasExtra }, `Truques da lista de ${conj.lista}.${fixos.length ? ' Já concedidos pela subclasse: ' + fixos.map(nomeMagiaTxt).join(', ') + '.' : ''}`);
    if (TRUQUES_BONUS_ESCOLHA[conj.subId]) add('truque-bonus', 'Truque bônus (subclasse)', 1, { lista: TRUQUES_BONUS_ESCOLHA[conj.subId], min: 0, max: 0 }, 'Truque extra da sua subclasse.');
    if (conj.subId === 'druid__land') add('terreno', 'Terreno do Círculo', 1, { lista_fixa: TERRENOS }, 'Define as magias de círculo (sempre preparadas).');
    const estiloTruques = listaTruquesEstilo();
    if (estiloTruques && conj.origem === 'classe') add('truques-estilo', 'Truques do Estilo de Luta', 2, { lista: estiloTruques, min: 0, max: 0 }, `Contam como magias de ${conj.lista === 'Paladin' ? 'paladino' : 'patrulheiro'}; a habilidade de conjuração é a da classe.`);
    if (conj.preparacao === 'conhecidas' && conj.conhecidas) {
        const extra = conj.lista === 'Warlock' ? sub.expandidas : [];
        const escolas = ESCOLAS_SUBCLASSE[conj.subId];
        add('conhecidas', 'Magias conhecidas', conj.conhecidas, { lista: conj.lista, min: 1, max, extra, ...listasExtra, ...(escolas ? { escolas, livres: escolasLivres(nivelAtual()) } : {}) }, escolas ? `Todas devem ser de ${escolas.map(e => ESCOLA_PT[e]).join(' ou ')}, exceto até ${escolasLivres(nivelAtual())} de qualquer escola (as aprendidas nos níveis 3, 8, 14 e 20).` : '');
    }
    // As magias preparadas do dia (grimório, clérigo, druida, paladino) não são escolhidas aqui: o jogador as marca na ficha.
    if (conj.grimorio) add('grimorio', 'Grimório', conj.grimorio, { lista: conj.lista, min: 1, max }, 'Magias copiadas para o grimório. As magias preparadas do dia são marcadas na ficha.');
    if (conj.lista === 'Warlock' && conj.origem === 'classe') Object.entries(ARCANUM).forEach(([lv, nv]) => { if (nivelAtual() >= nv) add('arcana-' + lv, `Arcana Mística (${lv}º círculo)`, 1, { lista: 'Warlock', min: +lv, max: +lv }, 'Uma vez por descanso longo, sem gastar espaço.'); });
    if (conj.lista === 'Bard' && conj.origem === 'classe') {
        const n = nivelAtual(); const q = (n >= 18 ? 6 : n >= 14 ? 4 : n >= 10 ? 2 : 0) + (conj.subId === 'bard__lore' && n >= 6 ? 2 : 0);
        add('segredos', 'Segredos Mágicos (qualquer classe)', q, { todas: true, min: 0, max }, 'Truques ou magias de qualquer classe, dentro dos círculos que você pode conjurar; contam como magias de bardo.');
    }
    return out;
}

function opcoesMagia(cfg) {
    const fmt = (m, extra) => ({ nome: m.nome, exibir: nomeMagia(m), ua: m.ua, fonte: m.fonte, desc: `${extra ? extra + ' · ' : ''}${m.nivel === 0 ? 'Truque' : m.nivel + 'º círculo'} · ${escolaMagia(m)} · ${resumoMagia(m).join(' · ')}`, magia: m });
    if (cfg.lista_fixa) return cfg.lista_fixa.map(n => ({ nome: n }));
    if (cfg.origem === 'grimorio') return selMagia('grimorio').map(s => s.magia).filter(Boolean).map(m => fmt(m));
    const filtroExtra = (m) => (!cfg.somente_escolas || cfg.somente_escolas.includes(m.escola)) && (!cfg.ritual || m.ritual) && (!cfg.nomes || cfg.nomes.map(n => n.toLowerCase()).includes(m.nome.toLowerCase()));
    if (cfg.todas) return db.magias.filter(m => m.nivel >= cfg.min && m.nivel <= cfg.max && filtroExtra(m) && (m.classes.length || charState.tasha)).map(m => fmt(m, m.classes.slice(0, 4).join('/')));
    const ex = new Set(cfg.excluirIds || []); const exN = new Set((cfg.excluirNomes || []).map(n => n.toLowerCase()));
    return db.magias.filter(m => m.nivel >= cfg.min && m.nivel <= cfg.max && filtroExtra(m) && !ex.has(m.id) && !exN.has(m.nome.toLowerCase()) && (m.classes.includes(cfg.lista) || (charState.tasha && m.classes_opcionais_tasha.includes(cfg.lista)) || (cfg.listas_extra || []).some(l => m.classes.includes(l)) || (cfg.extra || []).includes(m.id)))
        .map(m => ({ ...fmt(m, m.classes.includes(cfg.lista) || (cfg.extra || []).includes(m.id) ? '' : 'lista opcional (Tasha)'), ...(cfg.escolas && m.nivel > 0 && !cfg.escolas.includes(m.escola) ? { foraEscola: true } : {}) }))
        .map(o => o.foraEscola ? { ...o, desc: 'ESCOLHA LIVRE (fora das escolas da subclasse) · ' + o.desc } : o);
}

// Magias inatas de raça: lidas das características ativas, com o nível em que cada uma passa a valer ("at 3rd level", "No 3º nível").
const MAGIA_PT_EN = { 'globos de luz': 'Dancing Lights', 'fogo das fadas': 'Faerie Fire', 'escuridão': 'Darkness', 'taumaturgia': 'Thaumaturgy', 'repreensão infernal': 'Hellish Rebuke', 'ilusão menor': 'Minor Illusion', 'falar com animais': 'Speak with Animals', 'mãos mágicas': 'Mage Hand', 'druidismo': 'Druidcraft', 'prestidigitação': 'Prestidigitation' };
let _regexMagias = null;
function magiasRaciais() {
    if (!charState.raca || !db.magias) return [];
    if (!_regexMagias) _regexMagias = db.magias.map(m => ({ m, re: new RegExp('(^|[^A-Za-z])' + m.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z])', 'i'), simples: !/[ \/\-']/.test(m.nome) })).sort((a, b) => b.m.nome.length - a.m.nome.length);
    const n = nivelTotal(); const out = []; const vistos = new Set();
    nodesAtivos('raca').forEach(node => {
        let t = String(node.descricao_en || node['Descrição'] || node['descrição'] || node.descricao || '');
        Object.keys(MAGIA_PT_EN).forEach(pt => { t = t.replace(new RegExp(pt, 'ig'), MAGIA_PT_EN[pt]); });
        if (!/cast|know|learn|cantrip|spell|conhece|conjurar|truque|magia/i.test(t)) return;
        const hab = /(Intelligence|Wisdom|Charisma)(?:,| or)[^.]*?(?:Wisdom|Charisma|Intelligence)[^.]*?(?:choose|escolh)/i.test(t) ? 'Int/Sab/Car (à escolha)' : ((/(Intelligence|Wisdom|Charisma)\s+is\s+your\s+spellcasting/i.exec(t) || /(Inteligência|Sabedoria|Carisma)\s+é\s+a\s+(?:sua\s+)?habilidade/i.exec(t) || [])[1] || '');
        t.split(/(?<=[.!?])\s+|\n/).forEach(frase => {
            if (!/cast|know|learn|cantrip|spell|conhece|conjurar|truque|magia/i.test(frase)) return;
            let lv = 1; const mm = /(?:at|reach(?:ing)?|starting at|beginning at|upon reaching)\s+(\d+)(?:st|nd|rd|th)\s+level/i.exec(frase) || /no\s+(\d+)º\s+nível/i.exec(frase);
            if (mm) lv = parseInt(mm[1], 10);
            let resto = frase;
            _regexMagias.forEach(({ m, re, simples }) => {
                const x = re.exec(resto); if (!x) return;
                const ini = x.index + x[1].length, fim = x.index + x[0].length;
                if (simples) { const depois = resto.slice(fim); const cap = /[A-Z]/.test(resto[ini]); if (!(/^\s+(cantrip|spell)/i.test(depois) || (cap && ini > 0 && /(cast|know|learn|conhece|conjura|aprende|truque|magia)/i.test(resto.slice(0, ini))))) return; }
                resto = resto.slice(0, ini) + ' '.repeat(fim - ini) + resto.slice(fim);
                const chave = (node.nome || node.Nome) + '|' + m.nome; if (vistos.has(chave)) return; vistos.add(chave);
                out.push({ nome: m.nome, nivel: lv, exp: !!mm, truque: m.nivel === 0, livre: /at will|à vontade/i.test(frase), hab, trait: node.nome || node.Nome });
            });
        });
    });
    const melhor = new Map();
    out.forEach(x => { const a = melhor.get(x.nome); if (!a || (x.exp && !a.exp) || (x.exp === a.exp && x.nivel < a.nivel)) melhor.set(x.nome, x); });
    return [...melhor.values()];
}
