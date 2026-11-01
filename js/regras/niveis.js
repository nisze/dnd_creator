// Subir de nível e multiclasse (sem DOM): XP, regras de multiclasse (PHB cap. 6 e Tasha), espaços de magia combinados e histórico por nível.
// O personagem tem uma classe principal (charState.classe/nivel) e classes adicionais (charState.outras); ver o contexto de classe em nucleo.js.
// PV: sempre pelo valor fixo do dado (metade + 1); o nível 1 do personagem usa o dado cheio. Cada nível guarda o dado da classe em que foi ganho.

// ---------- XP ----------
const XP_NIVEL = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const xpDoNivel = (n) => XP_NIVEL[Math.min(20, Math.max(1, n)) - 1];
const nivelPorXP = (xp) => XP_NIVEL.reduce((n, v, i) => xp >= v ? i + 1 : n, 1);
// O campo de XP da ficha é texto livre ("1.500", "1500 XP"); devolve o número ou null.
function xpNumero(txt) { const n = parseInt(String(txt == null ? '' : txt).replace(/\D/g, ''), 10); return isNaN(n) ? null : n; }

// ---------- Multiclasse (PHB p. 163-164; Artífice: Tasha) ----------
// req: precisa de 13 nos atributos citados ("todos" = todos eles; "algum" = pelo menos um). As proficiências são só as que se ganham ao entrar na classe depois do nível 1.
const MULTI_CLASSES = {
    barbarian: { req: { todos: ['For'] }, armaduras: ['escudos'], armas: ['armas simples', 'armas marciais'] },
    bard: { req: { todos: ['Car'] }, armaduras: ['armaduras leves'], pericia: { qtd: 1, lista: null }, ferramentas: ['um instrumento musical à escolha'] },
    cleric: { req: { todos: ['Sab'] }, armaduras: ['armaduras leves', 'armaduras médias', 'escudos'] },
    druid: { req: { todos: ['Sab'] }, armaduras: ['armaduras leves', 'armaduras médias', 'escudos (druidas não usam armadura nem escudo de metal)'] },
    fighter: { req: { algum: ['For', 'Des'] }, armaduras: ['armaduras leves', 'armaduras médias', 'escudos'], armas: ['armas simples', 'armas marciais'] },
    monk: { req: { todos: ['Des', 'Sab'] }, armas: ['armas simples', 'espadas curtas'] },
    paladin: { req: { todos: ['For', 'Car'] }, armaduras: ['armaduras leves', 'armaduras médias', 'escudos'], armas: ['armas simples', 'armas marciais'] },
    ranger: { req: { todos: ['Des', 'Sab'] }, armaduras: ['armaduras leves', 'armaduras médias', 'escudos'], armas: ['armas simples', 'armas marciais'], pericia: { qtd: 1, lista: ['Lidar com Animais', 'Atletismo', 'Intuição', 'Investigação', 'Natureza', 'Percepção', 'Furtividade', 'Sobrevivência'] } },
    rogue: { req: { todos: ['Des'] }, armaduras: ['armaduras leves'], pericia: { qtd: 1, lista: ['Acrobacia', 'Atletismo', 'Enganação', 'Intuição', 'Intimidação', 'Investigação', 'Percepção', 'Atuação', 'Persuasão', 'Prestidigitação', 'Furtividade'] }, ferramentas: ['ferramentas de ladrão'] },
    sorcerer: { req: { todos: ['Car'] } },
    warlock: { req: { todos: ['Car'] }, armaduras: ['armaduras leves'], armas: ['armas simples'] },
    wizard: { req: { todos: ['Int'] } },
    artificer: { req: { todos: ['Int'] }, armaduras: ['armaduras leves', 'armaduras médias', 'escudos'], ferramentas: ['ferramentas de ladrão', 'ferramentas de funileiro'], conferir: true }
};
const nomeCurtoDaClasse = (c) => String((c && (c.nome || c.Nome)) || '').replace(/\s*\([^)]*\)\s*$/, '');
const _reqTexto = (r) => r.todos ? r.todos.map(k => `${k} 13`).join(' e ') : r.algum.map(k => `${k} 13`).join(' ou ');
const _reqOk = (r, at) => r.todos ? r.todos.every(k => at[k] >= 13) : r.algum.some(k => at[k] >= 13);
const requisitoMulticlasse = (id) => MULTI_CLASSES[id] ? _reqTexto(MULTI_CLASSES[id].req) : null;
// Proficiências que a classe `id` concede quando não é a primeira: { armaduras, armas, ferramentas, pericia } (listas de texto).
const proficienciasDeMulticlasse = (id) => { const r = MULTI_CLASSES[id]; return r ? { armaduras: r.armaduras || [], armas: r.armas || [], ferramentas: r.ferramentas || [], pericia: r.pericia || null, conferir: !!r.conferir } : null; };

// Escolha sintética de uma classe adicional: a perícia que a multiclasse concede (Bardo, Patrulheiro, Ladino).
function escolhasMulticlasse(raiz) {
    const r = MULTI_CLASSES[charState.classe.id]; if (!r || !r.pericia) return [];
    const lista = r.pericia.lista;
    return [{ id: 'MULTI-pericia', path: raiz + ' > Perícia de multiclasse', escolhaVal: 'Perícia', node: { simbolo: '🎓', nome: 'Perícia de multiclasse', escolha: 'Perícia', pericias_permitidas: lista, 'descrição': 'Ao entrar nesta classe você ganha uma proficiência em perícia' + (lista ? ' da lista dela.' : ' à sua escolha.') } }];
}

// Opções do assistente "Subir de nível": classes que o personagem já tem e classes novas (com o que impede cada uma).
// `liberarSemRegra`: classes de fora do PHB/Tasha (UA, terceiros) não têm regra oficial de multiclasse; só entram se o jogador liberar.
function classesParaSubir(liberarSemRegra) {
    const at = calcularAtributosFinais();
    const atuais = todasClasses().map(c => ({ idx: c.idx, classe: c.classe, nivel: c.nivel, nova: false }));
    const ids = new Set(atuais.map(c => c.classe.id));
    const novas = db.classes.filter(c => !ids.has(c.id) && permitido(c)).map(c => {
        const bloqueios = [], faltas = [];
        const regra = MULTI_CLASSES[c.id];
        // É preciso cumprir o pré-requisito da classe nova e o de cada classe que já se tem.
        [c.id].concat(atuais.map(a => a.classe.id)).forEach(id => { const r = MULTI_CLASSES[id]; if (r && !_reqOk(r.req, at)) { const nome = nomeCurtoDaClasse(db.classes.find(x => x.id === id)); faltas.push(`${nome} exige ${_reqTexto(r.req)}`); } });
        if (faltas.length) bloqueios.push('Atributos insuficientes: ' + faltas.join('; ') + '.');
        if (!regra && !liberarSemRegra) bloqueios.push('Sem regra oficial de multiclasse (UA/terceiros): libere abaixo para usar por sua conta.');
        return { classe: c, nova: true, semRegra: !regra, requisito: regra ? _reqTexto(regra.req) : null, bloqueios };
    });
    return { atuais, novas, cheio: nivelTotal() >= 20, atributos: at };
}

// ---------- Progressão: instantâneo, subir, cancelar, desfazer ----------
// O instantâneo guarda só o que o nível muda (classes, escolhas, dados de vida): inventário, ficha e retrato ficam como estão.
function snapshotProgressao() { const e = serializarEstado(); return JSON.parse(JSON.stringify({ nivel: e.nivel, classe: e.classe, outras: e.outras, escolhas: e.escolhas, pvNiveis: e.pvNiveis })); }
function aplicarProgressao(p) { const e = serializarEstado(); Object.assign(e, JSON.parse(JSON.stringify(p))); return restaurarEstado(e); }

// Aplica +1 nível já no estado (a decisão pode ser cancelada com cancelarSubida). alvo: { idx } classe que o personagem já tem, ou { classeId } classe nova.
function iniciarSubida(alvo) {
    if (nivelTotal() >= 20) return { ok: false, erro: 'O personagem já está no nível 20.' };
    const snap = snapshotProgressao(), antesMagias = nomesMagiasConhecidas();
    let idx;
    if (alvo.classeId != null) {
        const c = db.classes.find(x => x.id === alvo.classeId);
        if (!c) return { ok: false, erro: 'Classe não encontrada.' };
        if (todasClasses().some(x => x.classe.id === c.id)) return { ok: false, erro: 'O personagem já tem essa classe.' };
        charState.outras = charState.outras || [];
        charState.outras.push({ classe: c, nivel: 1, escolhas: {} }); idx = charState.outras.length;
    } else {
        idx = alvo.idx || 0;
        if (idx === 0) charState.nivel++; else if (charState.outras[idx - 1]) charState.outras[idx - 1].nivel++; else return { ok: false, erro: 'Classe não encontrada.' };
    }
    const sl = _slotClasse(idx);
    charState.pvNiveis = charState.pvNiveis || [];
    charState.pvNiveis[nivelTotal() - 1] = { dado: dadoDeVidaDaClasse(sl.classe) || 8, metodo: 'fixo', classe: sl.classe.id };
    return { ok: true, idx, snap, nova: alvo.classeId != null, classeId: sl.classe.id, antesMagias, trocou: false };
}
function cancelarSubida(sub) { return aplicarProgressao(sub.snap); }
// Escolhas que ainda faltam para fechar o nível (subclasse, aumento de atributo/talento, magias, estilo de luta...).
const pendenciasDaSubida = (sub) => soClasse(sub.idx, () => escolhasPendentes('classe'));
function concluirSubida(sub) {
    const n = nivelTotal(), calc = calcularPersonagem(), reg = calc.pv.niveis[n - 1], sl = _slotClasse(sub.idx);
    charState.historico = charState.historico || [];
    charState.historico.forEach(h => { delete h.antes; }); // só o último nível pode ser desfeito
    charState.historico.push({ n, classe: sl.classe.id, nomeClasse: nomeCurtoDaClasse(sl.classe), nivelClasse: sl.nivel, nova: !!sub.nova, pv: reg ? reg.ganho : 0, trocou: sub.trocou || null, data: new Date().toISOString(), antes: sub.snap });
    return charState.historico[charState.historico.length - 1];
}
const podeDesfazerNivel = () => { const h = (charState.historico || [])[(charState.historico || []).length - 1]; return !!(h && h.antes); };
function desfazerUltimoNivel() {
    const hist = charState.historico || [], h = hist[hist.length - 1];
    if (!h || !h.antes) return { ok: false, erro: 'Não há nível para desfazer.' };
    const resto = hist.slice(0, -1), r = aplicarProgressao(h.antes);
    charState.historico = resto;
    return r;
}

// ---------- O que o nível traz ----------
// Características fixas do nível `nivel` da classe em contexto (as escolhas aparecem à parte, como pendências).
function novidadesDoNivel(idx) {
    return soClasse(idx, () => {
        const N = charState.nivel, out = [], vistos = new Set();
        const descr = (n) => String(n['descrição'] || n['Descrição'] || n.descricao || '').trim();
        const add = (n, origem) => { const nome = String(n.nome || n.Nome || '').trim(); if (!nome || vistos.has(nome) || ehNoDeNivel(n) || temEscolha(n) || foraDoNivel(n)) return; vistos.add(nome); out.push({ nome, texto: descr(n), origem }); };
        const no = (charState.classe.conteudo || []).find(n => ehNoDeNivel(n) && nivelDoNode(n) === N);
        ((no && no.conteudo) || []).forEach(n => { if (!temEscolha(n) && !foraDoNivel(n)) add(n, 'Classe'); });
        nodesAtivos('classe').forEach(n => { if (typeof n.nivel === 'number' && n.nivel === N) add(n, 'Subclasse'); });
        return out;
    });
}
// Conjuração da classe `idx` num nível dessa classe (null = sem conjuração).
const conjuracaoDaClasse = (idx, nivel) => soClasse(idx, () => {
    const a = charState.nivel; if (nivel != null) charState.nivel = nivel;
    try { return semMagias(conjuracaoAtual); } finally { charState.nivel = a; }
});
// Mudança de conjuração ao subir: { antes, depois } no formato de conjuracaoAtual (ou nulos).
const mudancaDeConjuracao = (idx) => { const n = _slotClasse(idx).nivel; return { antes: n > 1 ? conjuracaoDaClasse(idx, n - 1) : null, depois: conjuracaoDaClasse(idx) }; };

// ---------- Trocar magia conhecida ao subir (Bardo, Feiticeiro, Bruxo, Patrulheiro e subclasses de 1/3) ----------
const ID_MAGIAS_CONHECIDAS = 'MAGIA-conhecidas';
function nomesMagiasConhecidas() {
    const s = new Set();
    todasClasses().forEach(c => soClasse(c.idx, () => selMagia('conhecidas').forEach(m => s.add(c.idx + ':' + m.nome))));
    return s;
}
// Magias conhecidas da classe `idx` que podem ser trocadas (já eram conhecidas antes deste nível). [{ i, nome }]
function magiasTrocaveis(idx, sub) {
    return soClasse(idx, () => {
        const conj = semMagias(conjuracaoAtual);
        if (!conj || conj.preparacao !== 'conhecidas' || !conj.conhecidas) return [];
        return selMagia('conhecidas').map((m, i) => ({ i, nome: m.nome })).filter(x => sub.antesMagias.has(idx + ':' + x.nome));
    });
}
// Esquece a magia na posição `i`; o espaço fica pendente para escolher a nova. Uma troca por nível.
function trocarMagiaConhecida(sub, i) {
    if (sub.trocou) return { ok: false, erro: 'Só é possível trocar uma magia por nível.' };
    return soClasse(sub.idx, () => {
        const r = (charState.escolhas.classe || {})[ID_MAGIAS_CONHECIDAS];
        if (!r || !r.selecionados[i]) return { ok: false, erro: 'Magia não encontrada.' };
        const nome = r.selecionados[i].nome;
        r.selecionados.splice(i, 1);
        if (!r.selecionados.length) delete charState.escolhas.classe[ID_MAGIAS_CONHECIDAS];
        sub.trocou = { de: nome };
        return { ok: true, nome };
    });
}

// ---------- Espaços de magia com mais de uma classe conjuradora (PHB p. 164) ----------
const SLOTS_MULTICLASSE = [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
// Classes com conjuração: [{ idx, classe, nivel, conj }].
const conjuradoresDoPersonagem = () => todasClasses().map(c => ({ ...c, conj: conjuracaoDaClasse(c.idx) })).filter(c => c.conj && c.conj.habilidade);
// { combinada, nivelConjurador, slots: { círculo: qtd }, pacto: [{ nivel, total }] }. Com uma só classe conjuradora (fora o Bruxo) valem os espaços da própria classe.
function espacosDoPersonagem() {
    const cj = conjuradoresDoPersonagem();
    const pacto = cj.filter(c => c.conj.tipo === 'pacto'), normais = cj.filter(c => c.conj.tipo !== 'pacto' && c.conj.tipo !== 'runas');
    const pactoSlots = pacto.flatMap(c => Object.keys(c.conj.slots || {}).map(Number).filter(n => c.conj.slots[n] > 0).map(n => ({ nivel: n, total: c.conj.slots[n], pacto: c.conj.origem === 'classe' })));
    if (normais.length <= 1) return { combinada: false, nivelConjurador: normais[0] ? normais[0].nivel : 0, slots: normais[0] ? { ...(normais[0].conj.slots || {}) } : {}, pacto: pactoSlots };
    let nc = 0;
    normais.forEach(c => {
        const t = c.conj.tipo;
        nc += t === 'completo' ? c.nivel : t === 'metade' ? (c.classe.id === 'artificer' ? Math.ceil(c.nivel / 2) : Math.floor(c.nivel / 2)) : t === 'terco' ? Math.floor(c.nivel / 3) : 0;
    });
    const linha = nc > 0 ? SLOTS_MULTICLASSE[Math.min(20, nc) - 1] : [], slots = {};
    linha.forEach((q, i) => { if (q > 0) slots[i + 1] = q; });
    return { combinada: true, nivelConjurador: nc, slots, pacto: pactoSlots };
}

// ---------- Resumos ----------
// Classes do personagem para exibir: [{ idx, id, nome, nivel, subclasse }].
function resumoDasClasses() {
    return todasClasses().map(c => ({ idx: c.idx, id: c.classe.id, nome: nomeCurtoDaClasse(c.classe), nivel: c.nivel, subclasse: nomeDaSubclasse(c.idx) }));
}
function nomeDaSubclasse(idx) {
    return soClasse(idx || 0, () => semMagias(() => { const r = escolhasResolvidas('classe').find(({ c }) => c.node.nivel_escolha !== undefined); const s = r && r.res.selecionados[0]; return s ? (s.nome || '') : ''; }));
}
// "Guerreiro 3 / Mago 2" (nome e nível de cada classe).
const textoDasClasses = (comSub) => resumoDasClasses().map(c => `${c.nome} ${c.nivel}${comSub && c.subclasse ? ' (' + c.subclasse + ')' : ''}`).join(' / ');
