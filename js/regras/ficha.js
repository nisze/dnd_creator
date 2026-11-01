// Dados derivados para a ficha impressa (sem DOM): perícias, salvaguardas, dados de vida, espaços de magia, recursos com usos, magias, características, idiomas e carga.
// Nada aqui guarda estado de jogo: o jogo acontece no papel. O que se edita aqui (moedas, quantidades, textos) vive em charState.folha e em charState.inventario.
const _calcDe = (c) => c || calcularPersonagem();
// O ouro da criação (antecedente, ouro inicial, menos compras) entra sozinho nas moedas da ficha; depois a ficha só acompanha as mudanças dele, sem apagar o que o jogador ajustou à mão.
function _sincronizarOuroFicha(f) {
    const alvo = Math.round(saldo() * 100);
    if (f.ouroAutoPC == null) f.ouroAutoPC = moedasEmPC(f.moedas) > 0 ? alvo : 0;
    const delta = alvo - f.ouroAutoPC; if (!delta) return;
    const m = f.moedas;
    if (delta > 0) { m.po += Math.floor(delta / 100); m.pp += Math.floor((delta % 100) / 10); m.pc += delta % 10; }
    else if (moedasEmPC(m) >= -delta) pagarComMoedas(m, -delta / 100);
    else Object.keys(m).forEach(k => { m[k] = 0; });
    f.ouroAutoPC = alvo;
}
function garantirFolha() {
    if (!charState.folha) charState.folha = novaFolha();
    const padrao = novaFolha(); Object.keys(padrao).forEach(k => { if (charState.folha[k] === undefined) charState.folha[k] = padrao[k]; });
    Object.keys(padrao.moedas).forEach(k => { if (typeof charState.folha.moedas[k] !== 'number') charState.folha.moedas[k] = 0; });
    _sincronizarOuroFicha(charState.folha);
    // A história nasce com o texto do antecedente escolhido (inclusive o personalizado) e acompanha a troca de antecedente até o jogador editar o campo.
    const f = charState.folha, desc = (charState.antecedente && historiaPersonalizada()) || (charState.antecedente && charState.antecedente.descricao);
    if (desc && !f.historiaEditada && (!f.historia || f.historia === f.historiaAuto)) { f.historia = desc; f.historiaAuto = desc; }
    return charState.folha;
}

// ---------- Dados de vida ----------
function dadosDeVida(calc) {
    calc = _calcDe(calc); const por = {};
    calc.pv.niveis.forEach(n => { por[n.dado] = (por[n.dado] || 0) + 1; });
    return Object.keys(por).map(Number).sort((a, b) => b - a).map(d => ({ dado: d, total: por[d] }));
}

// ---------- Espaços de magia e conjuração ----------
function espacosDeMagia() {
    const e = espacosDoPersonagem();
    const normais = Object.keys(e.slots).map(Number).filter(n => e.slots[n] > 0).sort((a, b) => a - b).map(n => ({ nivel: n, total: e.slots[n], pacto: false }));
    return normais.concat(e.pacto.map(p => ({ nivel: p.nivel, total: p.total, pacto: p.pacto })).sort((a, b) => a.nivel - b.nivel));
}
// Uma entrada por classe conjuradora; a CD e o ataque usam o bônus de proficiência do personagem.
function conjuracoesDaFicha(calc) {
    calc = _calcDe(calc);
    return conjuradoresDoPersonagem().map(c => {
        const conj = c.conj, mod = calc.mods[conj.habilidade];
        return soClasse(c.idx, () => ({ idx: c.idx, classe: nomeCurtoDaClasse(c.classe), habilidade: conj.habilidade, mod, cd: 8 + calc.profBonus + mod, ataque: calc.profBonus + mod, tipo: conj.tipo, ritual: !!conj.ritual, preparadas: conj.preparadas ? qtdPreparadas(conj, calc.atributos) : null, conhecidas: conj.preparacao === 'conhecidas' ? conj.conhecidas : null }));
    });
}
function conjuracaoDaFicha(calc) { return conjuracoesDaFicha(calc)[0] || null; }
// Magias do personagem para a ficha: { nome, nivel (0 = truque), origem, preparada, troca, resumo }.
// `troca`: magia que muda a cada descanso longo (grimório e preparadas); na ficha impressa a bolinha fica vazia para marcar a lápis.
function magiasDaFicha() {
    const out = [], vistos = new Set(), multi = todasClasses().length > 1;
    const add = (nome, origem, preparada, troca) => {
        const m = magiaPorNome(nome); const k = String(nome).toLowerCase(); if (vistos.has(k)) { if (preparada) { const e = out.find(x => x.chave === k); if (e) { e.preparada = true; if (!troca) e.troca = false; } } return; } vistos.add(k);
        out.push({ chave: k, nome: nome, exibir: m ? nomeMagia(m) : nome, nivel: m ? m.nivel : 0, origem, preparada: !!preparada, troca: !!troca, resumo: m ? resumoMagia(m).join(' · ') : '' });
    };
    todasClasses().forEach(cl => soClasse(cl.idx, () => {
        const conj = semMagias(conjuracaoAtual); if (!conj || !conj.habilidade) return;
        const rot = (o) => multi ? `${o} (${nomeCurtoDaClasse(cl.classe)})` : o;
        const nomes = (id) => selMagia(id).map(s => s.nome);
        (TRUQUES_FIXOS[conj.subId] || []).concat(conj.truqueFixo ? [conj.truqueFixo] : []).forEach(n => add(n, rot('Truque'), true));
        ['truques', 'truque-bonus', 'truques-estilo'].forEach(id => nomes(id).forEach(n => add(n, rot('Truque'), true)));
        nomes('conhecidas').forEach(n => add(n, rot('Conhecida'), true));
        nomes('segredos').forEach(n => add(n, rot('Segredo Mágico'), true));
        nomes('grimorio').forEach(n => add(n, rot('Grimório'), false, true));
        nomes('preparadas').forEach(n => add(n, rot('Preparada'), true, true));
        if (conj.subId && db.conjuracao.magias_de_subclasse) magiasDaSubclasse(conj).auto.forEach(i => { const m = magiaPorId(i); if (m) add(m.nome, rot('Sempre preparada'), true); });
        Object.keys(ARCANUM).forEach(lv => nomes('arcana-' + lv).forEach(n => add(n, rot('Arcana Mística'), true)));
    }));
    magiasRaciais().filter(x => x.nivel <= nivelTotal()).forEach(x => add(x.nome, 'Racial', true));
    return out.sort((a, b) => a.nivel - b.nivel || a.exibir.localeCompare(b.exibir, 'pt'));
}

// ---------- Recursos com usos ----------
const _tem = (ativos, ...termos) => termos.some(t => temAtivo(ativos, t));
// { id, nome, fonte, max, recarga: 'curto' | 'longo', nota, ilimitado }. Os de subclasse ficam nas características (texto). Cada classe usa o próprio nível.
function recursosDaFicha(calc) {
    calc = _calcDe(calc);
    const m = calc.mods, ativos = calc.ativos, out = [];
    const add = (id, nome, fonte, max, recarga, nota) => {
        if (!(max > 0)) return;
        const ja = out.find(r => r.id === id); if (ja) { if (max > ja.max) { ja.max = max; ja.ilimitado = max >= 99; } return; } // Canalizar Divindade: uma reserva só
        out.push({ id, nome, fonte, max, recarga, nota: nota || '', ilimitado: max >= 99 });
    };
    const daClasse = (c, n) => {
    if (c === 'barbarian') add('furia', 'Fúria', 'Bárbaro', n >= 20 ? 99 : n >= 17 ? 6 : n >= 12 ? 5 : n >= 6 ? 4 : n >= 3 ? 3 : 2, 'longo', n >= 20 ? 'Usos ilimitados no 20º nível.' : '');
    if (c === 'bard') add('inspiracao-bardica', 'Inspiração de Bardo', 'Bardo', Math.max(1, m.Car), n >= 5 ? 'curto' : 'longo');
    if (c === 'cleric') { if (n >= 2) add('canalizar-divindade', 'Canalizar Divindade', 'Clérigo', n >= 18 ? 3 : n >= 6 ? 2 : 1, 'curto'); if (n >= 10) add('intervencao-divina', 'Intervenção Divina', 'Clérigo', 1, 'longo', 'Se funcionar, não pode usar por 7 dias.'); }
    if (c === 'druid' && n >= 2) add('forma-selvagem', 'Forma Selvagem', 'Druida', n >= 20 ? 99 : 2, 'curto', n >= 20 ? 'Usos ilimitados no 20º nível.' : '');
    if (c === 'fighter') {
        add('retomar-folego', 'Retomar o Fôlego', 'Guerreiro', 1, 'curto', `Cura 1d10 + ${n}.`);
        if (n >= 2) add('surto-de-acao', 'Surto de Ação', 'Guerreiro', n >= 17 ? 2 : 1, 'curto');
        if (n >= 9) add('indomavel', 'Indomável', 'Guerreiro', n >= 17 ? 3 : n >= 13 ? 2 : 1, 'longo');
    }
    if (c === 'monk' && n >= 2) add('ki', 'Pontos de Ki', 'Monge', n, 'curto');
    if (c === 'paladin') {
        add('maos-consagradas', 'Mãos Consagradas (reserva de PV)', 'Paladino', 5 * n, 'longo', '5 PV da reserva curam doença/veneno.');
        add('sentido-divino', 'Sentido Divino', 'Paladino', Math.max(1, 1 + m.Car), 'longo');
        if (n >= 3) add('canalizar-divindade', 'Canalizar Divindade', 'Paladino', 1, 'curto');
        if (n >= 14) add('toque-purificador', 'Toque Purificador', 'Paladino', Math.max(1, m.Car), 'longo');
    }
    if (c === 'sorcerer' && n >= 2) add('pontos-de-feiticaria', 'Pontos de Feitiçaria', 'Feiticeiro', n, 'longo');
    if (c === 'warlock') [[6, 11], [7, 13], [8, 15], [9, 17]].forEach(([circ, nv]) => { if (n >= nv) add('arcana-' + circ, `Arcana Mística (${circ}º círculo)`, 'Bruxo', 1, 'longo'); });
    if (c === 'wizard') add('recuperacao-arcana', 'Recuperação Arcana', 'Mago', 1, 'longo', `Recupera espaços de magia (soma até ${Math.ceil(n / 2)} círculos, nenhum acima do 5º) num descanso curto.`);
    };
    todasClasses().forEach(cl => soClasse(cl.idx, () => daClasse(cl.classe.id, cl.nivel)));
    if (_tem(ativos, 'breath weapon', 'arma de sopro')) add('arma-de-sopro', 'Arma de Sopro', 'Raça', 1, 'curto');
    if (_tem(ativos, 'relentless endurance', 'resistencia implacavel')) add('resistencia-implacavel', 'Resistência Implacável', 'Meio-Orc', 1, 'longo', 'Cai a 0 PV: fica com 1 PV.');
    if (talentosEscolhidos().some(t => /sortudo|lucky/.test(t))) add('sortudo', 'Pontos de Sorte', 'Talento Sortudo', 3, 'longo');
    return out;
}

// ---------- Características, perícias, salvaguardas e sentidos ----------
// Características com texto vindas de raça, classe e antecedente (as escolhidas entram pelo próprio nome e pelas características que trazem).
function caracteristicasDaFicha() {
    const ignorar = /^(Dado de Vida|Testes? de Resist|Idiomas?|Deslocamento|Tamanho|Aumento (no|de) |Profici[eê]ncias?$|Equipamento|Idade|Alinhamento|Pontos de Vida|Perícias?$)/i;
    const rotulo = { raca: 'Raça', classe: 'Classe', antecedente: 'Antecedente' }, out = [], vistos = new Set();
    ['raca', 'classe', 'antecedente'].forEach(cat => {
        if (!charState[cat]) return;
        // Com mais de uma classe cada característica leva o nome da classe de origem.
        const subDe = (idx) => soClasse(idx, () => semMagias(() => { const r = escolhasResolvidas('classe').find(({ c }) => c.node.nivel_escolha !== undefined); const s = r && r.res.selecionados[0]; return s && s.node ? { nome: s.nome || nomeDe(s.node), node: s.node } : null; }));
        const grupos = cat === 'classe' && todasClasses().length > 1
            ? todasClasses().map(cl => ({ rot: nomeCurtoDaClasse(cl.classe), nos: soClasse(cl.idx, () => nodesAtivos('classe')), nivelClasse: cl.nivel, subNode: subDe(cl.idx) }))
            : [{ rot: rotulo[cat], nos: nodesAtivos(cat), nivelClasse: cat === 'classe' ? (todasClasses()[0] || {}).nivel || null : null, subNode: cat === 'classe' ? subDe(0) : null }];
        grupos.forEach(({ rot, nos, nivelClasse, subNode }) => {
            // Características da subclasse escolhida ficam num grupo próprio; o texto genérico "escolha um arquétipo" (lista de opções) sai.
            const daSub = new Set(), coletar = (x) => { if (Array.isArray(x)) return x.forEach(coletar); if (!x || typeof x !== 'object') return; daSub.add(x); coletar(x.conteudo); };
            if (subNode) coletar(subNode.node.conteudo);
            nos.forEach(n => {
                const nome = String(n.nome || n.Nome || '').trim(), texto = String(n['descrição'] || n['Descrição'] || n.descricao || '').trim();
                if (!nome || !texto || /^(n[aã]o|nenhum[a]?)\.?$/i.test(texto) || ehNoDeNivel(n) || ignorar.test(nome) || (cat === 'antecedente' && /^Profici[eê]ncias? /i.test(texto))) return;
                if (subNode && /\|\s*(Source|Fonte)\s*(\n|$)/i.test(texto)) return;
                const sub = daSub.has(n) ? subNode.nome : '';
                const k = rot + '|' + sub + '|' + nome; if (vistos.has(k)) return; vistos.add(k);
                out.push({ fonte: rot, nome, texto, nivel: n.nivel || null, sub, nivelClasse });
            });
        });
    });
    // Talentos escolhidos (nome + resumo) em seção própria, com a origem: raça, antecedente ou aumento de atributo de uma classe.
    const fontesTalento = [
        ...['raca', 'antecedente'].map(cat => ({ origem: cat === 'raca' ? 'Raça' : 'Antecedente', lista: escolhasResolvidas(cat) })),
        ...todasClasses().map(cl => ({ classe: nomeCurtoDaClasse(cl.classe), lista: soClasse(cl.idx, () => escolhasResolvidas('classe')) }))
    ];
    fontesTalento.forEach(({ origem, classe, lista }) => lista.forEach(({ c, res }) => res.selecionados.forEach(s => {
        const no = s.node || s; if (!res.nodeOrigem || !(c.escolhaVal === 'Talento' || s.talento)) return;
        const nome = s.nome || nomeDe(no); if (out.some(x => x.fonte === 'Talento' && x.nome === nome)) return;
        const nv = (/N[ií]vel\s+(\d+)/.exec(c.path || '') || [])[1];
        const de = classe ? (c.escolhaVal === 'ASI' ? `Aumento de atributo (${classe}${nv ? ' ' + nv : ''})` : classe) : origem;
        out.push({ fonte: 'Talento', origem: de, nome, texto: descricaoDaOpcao(no).texto || '', nivel: null });
        // Os benefícios do talento já vêm no texto dele: não repetir como característica de raça/classe/antecedente.
        const filhos = new Set(), coletar = (x) => { if (Array.isArray(x)) return x.forEach(coletar); if (!x || typeof x !== 'object') return; const nm = String(x.nome || x.Nome || '').trim(); if (nm) filhos.add(nm); coletar(x.conteudo); };
        coletar(no.conteudo);
        for (let i = out.length - 1; i >= 0; i--) if (out[i].fonte !== 'Talento' && (filhos.has(out[i].nome) || out[i].nome === nome)) out.splice(i, 1);
    })));
    return out;
}
// Ações da página 1: características que dizem usar uma ação, ação bônus ou reação. Heurística por texto: vale a primeira menção; usos por descanso vêm de recursosDaFicha().
const _TIPOS_ACAO = [
    ['bonus', /a[çc][ãa]o (adicional|b[ôo]nus)/i],
    ['reacao', /rea[çc][ãa]o/i],
    ['acao', /(?:como|com|usar|use|usando|gastar|gaste)\s+(?:uma|sua|a)\s+a[çc][ãa]o(?!\s+(?:adicional|b[ôo]nus|atacar|correr|esquivar|desengajar|ajudar|esconder|procurar|preparar|usar))/i]
];
function acoesDaFicha(calc) {
    const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const rec = recursosDaFicha(calc);
    return caracteristicasDaFicha().map(c => {
        let tipo = null, pos = Infinity;
        _TIPOS_ACAO.forEach(([t, re]) => { const m = re.exec(c.texto || ''); if (m && m.index < pos) { pos = m.index; tipo = t; } });
        if (!tipo) return null;
        const r = rec.find(x => { const a = norm(x.nome), b = norm(c.nome); return a === b || a.includes(b) || b.includes(a); });
        const uso = r ? (r.ilimitado ? '' : `${r.max}x/${r.recarga === 'curto' ? 'desc. curto' : 'desc. longo'}`) : '';
        return { tipo, nome: c.nome, origem: c.fonte === 'Classe' ? '' : c.fonte, uso };
    }).filter(Boolean);
}
function periciasDaFicha(calc) {
    calc = _calcDe(calc);
    return PERICIAS.map(p => {
        const treinada = calc.periciasTreinadas.includes(p.nome), especialista = calc.especializadas.includes(p.nome);
        const bonus = calc.mods[p.attr] + (treinada ? calc.profBonus * (especialista ? 2 : 1) : calc.bonusMeio(p.attr));
        return { nome: p.nome, attr: p.attr, treinada, especialista, bonus, passiva: 10 + bonus };
    });
}
function salvaguardasDaFicha(calc) {
    calc = _calcDe(calc);
    return Object.keys(ATTR_MAP_KEY).map(nome => {
        const k = ATTR_MAP_KEY[nome], prof = calc.salvaguardas.includes(nome);
        return { nome, chave: k, proficiente: prof, bonus: calc.mods[k] + (prof ? calc.profBonus : 0) + calc.bonusSalva };
    });
}
// Visão no escuro e afins: lê as descrições das habilidades ativas ("Visão no Escuro ... 18 metros").
function sentidosDaFicha(calc) {
    calc = _calcDe(calc); const per = periciasDaFicha(calc), out = []; let umbral = false;
    ['Percepção', 'Intuição', 'Investigação'].forEach(n => { const p = per.find(x => x.nome === n); if (p) out.push({ nome: `${n} passiva`, valor: String(p.passiva) }); });
    nodesAtivos('raca').concat(nodesAtivos('classe')).forEach(n => {
        const nome = n.nome || n.Nome || '', ing = n.nome_ingles || '';
        if (/Vis[aã]o Umbral|Umbral Sight/i.test(nome + ' ' + ing)) { umbral = true; return; }
        if (/Vis[aã]o no Escuro|Darkvision|Superior Darkvision/i.test(nome + ' ' + ing)) { const d = String(n['descrição'] || n['Descrição'] || n.descricao || ''); const m = d.match(/(\d+(?:,\d+)?)\s*metros/); if (m && !out.some(o => o.nome === 'Visão no Escuro')) out.push({ nome: 'Visão no Escuro', valor: m[1] + ' m' }); }
    });
    // Visão Umbral (Espreitador Sombrio): 18 m de visão no escuro, ou +9 m sobre a que já se tem.
    if (umbral) { const d = out.find(o => o.nome === 'Visão no Escuro'); if (d) d.valor = (parseFloat(d.valor.replace(',', '.')) + 9) + ' m'; else out.push({ nome: 'Visão no Escuro', valor: '18 m' }); }
    return out;
}
function idiomasDaFicha() {
    const out = [], nos = [];
    // Nós "Idiomas" fixos, mesmo os que também oferecem uma escolha ("Comum, e um idioma adicional").
    const visitar = (n) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) { n.forEach(visitar); return; }
        if (foraDoNivel(n)) return;
        if (/^Idiomas?$/i.test(n.nome || n.Nome || '')) nos.push(n);
        if (temEscolha(n)) return;
        visitar(n.conteudo);
    };
    ['raca', 'classe', 'antecedente'].forEach(cat => { if (charState[cat]) visitar(cat === 'raca' ? semBasesSubstituidas(charState.raca.conteudo) : charState[cat].conteudo); nodesAtivos(cat).forEach(n => { if (/^Idiomas?$/i.test(n.nome || n.Nome || '') && !nos.includes(n)) nos.push(n); }); });
    nos.forEach(n => String(n['descrição'] || n['Descrição'] || n.descricao || '').replace(/\.$/, '').split(/,| e /).map(s => s.trim()).filter(s => s && !/escolha|adicional|extra|idioma/i.test(s)).forEach(s => out.push(s)));
    ['raca', 'classe', 'antecedente'].forEach(cat => escolhasResolvidas(cat).forEach(({ res }) => { const o = res.nodeOrigem || {}; if (/idioma/i.test(String(o.escolha || '') + ' ' + (o.nome || o.Nome || ''))) res.selecionados.forEach(s => { const nm = s.nome || s.Nome || s.texto; const mista = /ferramenta/i.test(o.nome || o.Nome || ''); if (nm && (!mista || (db.idiomas || []).some(i => i.nome === nm))) out.push(nm); }); }));
    const PT = { Dwarvish: 'Anão', 'Deep Speech': 'Fala Profunda', Elvish: 'Élfico', Gnomish: 'Gnômico', Giant: 'Gigante', Abyssal: 'Abissal', Draconic: 'Dracônico', Sylvan: 'Silvestre', Undercommon: 'Subcomum', Common: 'Comum' };
    if (nodesAtivos('classe').some(n => /^G[ií]ria de Ladr[aã]o$/i.test(n.nome || n.Nome || '') || /^Thieves[’']? Cant$/i.test(n.nome_ingles || ''))) out.push('Gíria de Ladrão');
    return [...new Set(out.filter(Boolean).map(i => PT[i] || i))];
}
// Outras proficiências: armas, armaduras (texto da classe) e ferramentas/instrumentos (perícias ficam na lista de perícias).
const _TRAD_PROF = [
    [/all simple weapons/i, 'todas as armas simples'], [/simple weapons/i, 'armas simples'], [/martial weapons/i, 'armas marciais'], [/all armor/i, 'todas as armaduras'],
    [/light armor/i, 'armaduras leves'], [/medium armor/i, 'armaduras médias'], [/heavy armor/i, 'armaduras pesadas'], [/shields/i, 'escudos'],
    [/hand crossbows/i, 'bestas de mão'], [/light crossbows/i, 'bestas leves'], [/longswords/i, 'espadas longas'], [/rapiers/i, 'rapieiras'], [/shortswords/i, 'espadas curtas'],
    [/clubs/i, 'clavas'], [/daggers/i, 'adagas'], [/darts/i, 'dardos'], [/javelins/i, 'azagaias'], [/maces/i, 'maças'], [/quarterstaffs/i, 'bordões'], [/scimitars/i, 'cimitarras'], [/sickles/i, 'foices'], [/slings/i, 'fundas'], [/spears/i, 'lanças'],
    [/\(druids will not wear armor or use shields made of metal\)/i, '(druidas não usam armadura nem escudo de metal)'],
    [/thieves[’']\s*tools/i, 'ferramentas de ladrão'], [/tinker[’']s tools/i, 'ferramentas de funileiro'], [/one type of artisan[’']s tools of your choice/i, 'um tipo de ferramenta de artesão à escolha'],
    [/three musical instruments of your choice/i, 'três instrumentos musicais à escolha'], [/herbalism kit/i, 'kit de herbalismo'], [/alchemist[’']s supplies/i, 'suprimentos de alquimista'],
    [/choose one type of artisan[’']s tools or one musical instrument/i, 'um tipo de ferramenta de artesão ou um instrumento musical'],
    [/calligrapher[’']s supplies/i, 'suprimentos de calígrafo'], [/mason[’']s tools/i, 'ferramentas de pedreiro'], [/woodcarver[’']s tools/i, 'ferramentas de entalhador']
];
const _traduzProf = (t) => _TRAD_PROF.reduce((s, [re, pt]) => s.replace(re, pt), String(t || '')).replace(/^\w/, c => c.toUpperCase());
function outrasProficienciasDaFicha() {
    const eq = (charState.classe && charState.classe.equip) || {}, out = [];
    const extra = { Armaduras: [], Armas: [], Ferramentas: [] };
    todasClasses().filter(c => c.idx > 0).forEach(c => { const p = proficienciasDeMulticlasse(c.classe.id); if (p) { extra.Armaduras.push(...p.armaduras); extra.Armas.push(...p.armas); extra.Ferramentas.push(...p.ferramentas); } });
    [['armaduras_en', 'Armaduras'], ['armas_en', 'Armas'], ['ferramentas_en', 'Ferramentas']].forEach(([k, rotulo]) => {
        const t = String(eq[k] || '').trim(), base = t && !/^(nenhum|none|-|—)$/i.test(t) ? [_traduzProf(t).replace(/\.$/, '')] : [];
        const lista = base.concat(extra[rotulo].filter(x => !base.join(' ').toLowerCase().includes(x.toLowerCase())));
        if (lista.length) out.push({ rotulo, texto: [...new Set(lista)].join(', ') });
    });
    // Proficiência do antecedente que é só o nome da ferramenta ("Kit de Disfarce: Kit de disfarce") entra na linha Ferramentas, sem repetir as que a classe já deu.
    const juntarFerramentas = (nome) => {
        let r = out.find(o => o.rotulo === 'Ferramentas'); if (!r) { r = { rotulo: 'Ferramentas', texto: '' }; out.push(r); }
        const atual = r.texto ? r.texto.split(', ') : [];
        if (!atual.some(a => a.toLowerCase() === nome.toLowerCase())) atual.push(atual.length ? nome.replace(/^./, c => c.toLowerCase()) : nome.replace(/^./, c => c.toUpperCase()));
        r.texto = atual.join(', ');
    };
    nodesAtivos('antecedente').forEach(n => {
        const d = String(n['descrição'] || n['Descrição'] || n.descricao || '').trim(), nome = String(n.nome || n.Nome || '').trim();
        if (!nome || !/^Profici[eê]ncias? /i.test(d)) return;
        const texto = d.replace(/^Profici[eê]ncias? (com |em |nas? |nos? )?/i, '').replace(/^\w/, c => c.toUpperCase()).replace(/\.$/, '');
        if (texto.toLowerCase() === nome.toLowerCase()) juntarFerramentas(texto); else out.push({ rotulo: nome, texto });
    });
    const outras = new Set();
    ['raca', 'classe', 'antecedente'].forEach(cat => escolhasResolvidas(cat).forEach(({ res }) => res.selecionados.forEach(s => { const o = res.nodeOrigem || {}; if (o.proficiencia_equip || /ferramenta|instrumento|tool|instrument/i.test(String(o.escolha || '') + ' ' + (o.nome || o.Nome || ''))) { const nm = s.nome || s.Nome || s.texto; if (nm && !(db.idiomas || []).some(i => i.nome === nm)) outras.add(nm); } })));
    if (outras.size) out.push({ rotulo: 'Escolhidas', texto: [...outras].join(', ') });
    return out;
}
// Proficiências de armadura, escudo e armas para a página de equipamento: as seis categorias (sempre listadas) e só as exceções, isto é, armas/armaduras nomeadas fora das categorias com proficiência (ex.: cimitarra do Bardo da Escola das Espadas).
function proficienciasEquipDaFicha() {
    const P = proficienciasEquip();
    const categorias = [['Armadura leve', P.leve], ['Armadura média', P.media], ['Armadura pesada', P.pesada], ['Escudo', P.escudo], ['Arma simples', P.simples], ['Arma marcial', P.marcial]].map(([nome, tem]) => ({ nome, tem: !!tem }));
    const coberto = (i) => { const m = i.mec || {}; if (i.cat === 'arma') return m.categoria === 'simples' ? P.simples : m.categoria === 'marcial' ? P.marcial : false; if (i.cat === 'armadura') return !!P[m.tipo]; return P.escudo; };
    const excecoes = [];
    (db.loja || []).filter(i => ['arma', 'armadura', 'escudo'].includes(i.cat) && i.mec).forEach(i => { if (!coberto(i) && proficienteEquip(i, P) && !excecoes.includes(i.nome)) excecoes.push(i.nome); });
    return { categorias, excecoes };
}

// Defesas permanentes (resistências, imunidades e vantagens em salvaguardas), lidas dos textos das características ativas. Efeitos condicionais ("enquanto", "quando"...) ficam só na descrição.
const _TIPOS_DANO = ['ácido', 'contundente', 'cortante', 'elétrico', 'energético', 'frio', 'fogo', 'necrótico', 'perfurante', 'psíquico', 'radiante', 'trovejante', 'veneno'];
const _tiposDeDano = (s) => _TIPOS_DANO.filter(t => new RegExp('(?<![a-zà-ú])' + t, 'i').test(s));
function defesasDaFicha() {
    const res = new Set(), imu = new Set(), vant = new Set();
    const ancestralidade = () => { const r = escolhasResolvidas('raca').find(({ res: x }) => /Ancestralidade/i.test((x.nodeOrigem || {}).nome || (x.nodeOrigem || {}).Nome || '')); const s = r && r.res.selecionados[0]; return s ? _tiposDeDano(String(descricaoDaOpcao(s.node || s).texto || '').split('.')[0]) : []; };
    caracteristicasDaFicha().forEach(c => String(c.texto).split(/(?<=[.!])\s+/).forEach(frase => {
        if (/\b(enquanto|durante|quando|se voc[eê]|at[eé] o fim)\b/i.test(frase) || /^Criaturas?\b/i.test(frase.trim())) return;
        const r = frase.match(/(?<!testes? de )resist[eê]ncia (?:a|ao|à)(?: tipo de)? dano\b([^.;]*)/i);
        if (r) { const t = _tiposDeDano(r[1]); (t.length ? t : /ancestralidade/i.test(r[1]) ? ancestralidade() : []).forEach(x => res.add(x)); }
        const i = frase.match(/imun(?:e|idade)s? (?:a|à|ao|aos|às)\s+([^.;]*)/i);
        if (i) imu.add(i[1].trim().replace(/^./, ch => ch.toLowerCase()));
        const v = frase.match(/vantagem (?:em|nos?|nas?) (?:testes? de resist[eê]ncia|salvaguardas?)\s+(?:contra\s+)?([^.;]*)/i);
        if (v) { const alvo = v[1].replace(/\s+e resist[eê]ncia a dano.*$/i, '').trim(); if (alvo) vant.add(alvo.replace(/^./, ch => ch.toLowerCase())); }
    }));
    const cap = (a) => [...a].map((s, k) => k === 0 ? s.replace(/^./, ch => ch.toUpperCase()) : s).join(', ');
    const out = [];
    if (res.size) out.push({ rotulo: 'Resistências', texto: cap(res) });
    if (imu.size) out.push({ rotulo: 'Imunidades', texto: cap(imu) });
    if (vant.size) out.push({ rotulo: 'Vantagem em salvaguardas contra', texto: [...vant].join('; ') });
    return out;
}

// ---------- Carga e moedas ----------
const VALOR_MOEDA_PO = { pc: 0.01, pp: 0.1, pe: 0.5, po: 1, pl: 10 };
const NOME_MOEDA = { pc: 'PC', pp: 'PP', pe: 'PE', po: 'PO', pl: 'PL' };
const moedasEmPO = (m) => +Object.keys(VALOR_MOEDA_PO).reduce((s, k) => s + (m[k] || 0) * VALOR_MOEDA_PO[k], 0).toFixed(2);
const LB_KG = 0.45359237;
const emKg = (lb) => +(lb * LB_KG).toFixed(1);
function cargaDaFicha(calc) {
    calc = _calcDe(calc); const f = garantirFolha(), forca = calc.atributos.For;
    const itens = charState.inventario.reduce((s, i) => s + (parseFloat(i.peso_lb) || 0) * (i.qtd == null ? 1 : i.qtd), 0);
    const moedas = Object.keys(VALOR_MOEDA_PO).reduce((s, k) => s + (f.moedas[k] || 0), 0) / 50;
    const peso = +(itens + moedas).toFixed(2), capacidade = forca * 15;
    return { peso, capacidade, empurrar: capacidade * 2, leve: forca * 5, pesada: forca * 10, nivel: peso > forca * 10 ? 'pesada' : peso > forca * 5 ? 'leve' : 'normal', sobrecarregado: peso > capacidade };
}
