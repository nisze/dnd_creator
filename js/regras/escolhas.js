// Árvore de escolhas e nós ativos.
// Nomes (sem acento) das habilidades ativas de raça/classe; talentos escolhidos ficam em talentosEscolhidos().
function nomesAtivos() {
    const s = new Set();
    ['raca', 'classe'].forEach(cat => nodesAtivos(cat).forEach(x => s.add(semAcento((x.nome || x.Nome || '') + ' ' + (x.nome_ingles || '')))));
    return [...s].join(' | ');
}
function talentosEscolhidos() {
    const l = [];
    ['raca', 'classe', 'antecedente'].forEach(cat => escolhasResolvidas(cat).forEach(({ res }) => res.selecionados.forEach(x => { if (x.talento) l.push(semAcento(x.nome)); })));
    return l;
}
const temAtivo = (nomes, termo) => nomes.includes(semAcento(termo));

function extrairEspecializacoes() {
    const set = new Set();
    ['raca', 'classe', 'antecedente'].forEach(cat => {
        escolhasResolvidas(cat).forEach(({ res }) => {
            if (!ehEspecializacao(res.nodeOrigem)) return;
            res.selecionados.forEach(s => { const p = achaPericia(s.nome || s.Nome || s.texto); if (p) set.add(p.nome); });
        });
    });
    return Array.from(new Set([...set, ...periciasDobradasPorTalento()]));
}

// Escolhas atualmente alcançáveis (ignora seleções órfãs de uma sub-raça/variante anterior).
function escolhasResolvidas(cat) {
    if (cat === 'classe' && somandoClasses()) return porClasse(() => escolhasResolvidas('classe'));
    const raiz = charState[cat];
    if (!raiz) return [];
    return getActiveChoices(raiz, raiz.nome || raiz.Nome, cat)
        .map(c => ({ c, res: charState.escolhas[cat][c.id] }))
        .filter(x => x.res);
}

// Versões de outras fontes (Plane Shift, Eberron...) que dizem "substitui as características da raça base" listam em `substitui_base`
// os nomes dos nós da raça (ex.: "Variantes do Humano") que deixam de valer enquanto essa versão estiver escolhida.
let _calcBases = false;
function basesSubstituidasDaRaca() {
    if (_calcBases || !charState.raca) return new Set();
    _calcBases = true;
    try {
        const s = new Set();
        escolhasResolvidas('raca').forEach(({ res }) => res.selecionados.forEach(x => ((x.node || {}).substitui_base || []).forEach(n => s.add(n))));
        return s;
    } finally { _calcBases = false; }
}
const semBasesSubstituidas = (lista) => { const s = basesSubstituidasDaRaca(); return s.size ? (lista || []).filter(n => !s.has((n && (n.nome || n.Nome)) || '')) : lista; };

// Nós fixos (fora de escolhas não resolvidas) mais os nós das opções escolhidas.
function nodesAtivos(cat) {
    if (cat === 'classe' && somandoClasses()) return porClasse(() => nodesAtivos('classe'));
    const out = [];
    const visitar = (n) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) { n.forEach(visitar); return; }
        if (temEscolha(n)) return;
        if (foraDoNivel(n)) return;
        out.push(n);
        visitar(n.conteudo);
    };
    if (charState[cat]) visitar(cat === 'raca' ? semBasesSubstituidas(charState.raca.conteudo) : charState[cat].conteudo);
    escolhasResolvidas(cat).forEach(({ res }) => res.selecionados.forEach(s => {
        if (s.node) { out.push(s.node); visitar(s.node.conteudo); }
    }));
    return out;
}

// Quantidade de escolhas que cresce com o nível (invocações, metamagia, manobras...): tabela por nível ou totais acumulados por nível de classe.
function contagemEscolha(node) {
    const c = node.contagem; if (!c) return null;
    const n = nivelAtual();
    if (c.tabela) return c.tabela[Math.min(n, c.tabela.length) - 1] || 0;
    const ks = Object.keys(c.niveis).map(Number).filter(k => k <= n).sort((a, b) => a - b);
    return ks.length ? c.niveis[ks[ks.length - 1]] : 0;
}

// Aumento de atributo concedido pela raça. Com "Customizing Your Origin" (Tasha) marcado no personagem, ele é trocado pelo bônus livre +2/+1 ou +1/+1/+1.
const ehNoASIRacial = (n) => /Aumento (no Valor )?de Habilidade/.test((n && (n.nome || n.Nome)) || '');
// Humano Padrão (+1 em tudo) e Humano Variante (+1 em dois atributos à escolha) não têm o que redistribuir: o Tasha não muda os atributos deles.
function humanoSemTasha() {
    const r = charState.raca;
    if (!r || !/^Humano/.test(r.nome || r.Nome || '')) return false;
    const nomes = Object.values((charState.escolhas && charState.escolhas.raca) || {}).flatMap(x => (x.selecionados || []).map(s => s.nome || ''));
    const versao = nomes.find(n => /^(Humano (Padrão|Variante)|Mark of|Marca d[aeo]s? [^(]+\(Mark of|Keldon|Plane Shift)/.test(n));
    return !versao || /^Humano (Padrão|Variante)/.test(versao);
}
const racaPersonalizada = () => !!(charState.origemPersonalizada && charState.raca && !humanoSemTasha());

// Nome livre do Antecedente Personalizado (ex.: "Sacerdote Corrompido"). Fica em justificativas para ser salvo e zerado junto com o antecedente.
const CHAVE_NOME_ANT = '__nomeAntecedente';
const nomeAntecedentePersonalizado = () => (charState.antecedente && charState.antecedente.personalizado ? String((charState.justificativas || {})[CHAVE_NOME_ANT] || '').trim() : '');
const nomeAntecedente = () => nomeAntecedentePersonalizado() || (charState.antecedente ? (charState.antecedente.nome || charState.antecedente.Nome || '') : '');
// História do Antecedente Personalizado: as justificativas escritas pelo jogador (só das escolhas atuais), uma por linha. Vazio quando não há nenhuma.
function historiaPersonalizada() {
    const a = charState.antecedente; if (!a || !a.personalizado) return '';
    const just = charState.justificativas || {}, linhas = [];
    getActiveChoices(a, a.nome || a.Nome, 'antecedente').forEach(c => {
        if (!c.node.justificativa) return;
        ((charState.escolhas.antecedente[c.id] || {}).selecionados || []).forEach(s => { const t = String(just[s.nome] || '').trim(); if (t) linhas.push(s.nome + ': ' + t); });
    });
    return linhas.join('\n');
}

// Escolhas de raça/antecedente valem pelo nível total do personagem; as de classe, pelo nível da classe.
function getActiveChoices(node, pathName, type) { return comNivel(type === 'classe' ? null : nivelTotal(), () => _gac(node, pathName, type)); }
function _gac(node, pathName, type) {
    let found = [];
    if (!node || typeof node !== 'object') return found;
    
    const esc = ('escolha' in node) ? node.escolha : ('Escolha' in node ? node.Escolha : undefined);
    
    if (esc !== undefined && esc !== false && esc !== null) {
        const dinamica = contagemEscolha(node);
        if (dinamica === 0) return found;
        const choiceId = pathName.replace(/[^a-zA-Z0-9]/g, '-');
        found.push({ id: choiceId, path: pathName, node: node, escolhaVal: dinamica || esc });
        
        if (charState.escolhas[type] && charState.escolhas[type][choiceId]) {
            charState.escolhas[type][choiceId].selecionados.forEach((sel, selIndex) => {
                if (sel.node) {
                    found = found.concat(_gac(sel.node, `${pathName} > ${sel.nome || sel.Nome || sel.texto || 'Opção'}[${selIndex}]`, type));
                }
            });
        }
        return found; 
    }

    if (Array.isArray(node.conteudo)) {
        const substituidas = type === 'raca' && node === charState.raca ? basesSubstituidasDaRaca() : null;
        node.conteudo.forEach((child, index) => {
            if (foraDoNivel(child)) return;
            if (substituidas && substituidas.has(child.nome || child.Nome || '')) return;
            if (type === 'raca' && racaPersonalizada() && ehNoASIRacial(child)) return;
            // Classe adicional (multiclasse): as perícias da classe não valem; no lugar entra a escolha de multiclasse (ver escolhasMulticlasse).
            if (type === 'classe' && _ctxClasse > 0 && temEscolha(child) && /^Perícias$/.test(child.nome || child.Nome || '')) return;
            const sub = _gac(child, `${pathName} > ${child.nome || child.Nome || child.texto || 'Opção'}[${index}]`, type);
            sub.forEach(f => { if (f.node === child && !f.pai) f.pai = node; });
            found = found.concat(sub);
        });
    }
    if (type === 'classe' && node === charState.classe && !_pularMagias) found = found.concat(escolhasMagia(pathName));
    if (type === 'classe' && node === charState.classe && _ctxClasse > 0) found = found.concat(escolhasMulticlasse(pathName));
    if (type === 'antecedente' && node === charState.antecedente) found = found.concat(escolhasPericiaSubstituta(pathName));
    return found;
}

// Versão alternativa da linhagem (ex.: Marca de Eberron) que substitui o aumento de atributo da versão-base.
function racaSubstituiASI() {
    return escolhasResolvidas('raca').some(({ res }) => res.selecionados.some(s => s.node && (s.node.substitui_tracos || []).includes('Ability Score Increase')));
}

// Característica do antecedente: a padrão, ou a variante alternativa quando escolhida.
function caracteristicaDoAntecedente() {
    if (!charState.antecedente) return null;
    const alt = escolhasResolvidas('antecedente').map(({ res }) => res.selecionados.find(s => (s.node || s).alternativa)).find(Boolean);
    return alt ? (alt.node || alt) : (charState.antecedente.caracteristica || null);
}

// Antecedente personalizado (PHB p. 125): o que foi escolhido, para a ficha. Cada perícia pode ter uma justificativa digitada.
function resumoAntecedentePersonalizado() {
    if (!charState.antecedente || !charState.antecedente.personalizado) return null;
    const sels = escolhasResolvidas('antecedente').flatMap(({ c, res }) => res.selecionados.map(s => ({ s, no: c.node })));
    const pericias = [], outros = []; let equip = null, motivoCar = '';
    sels.forEach(({ s, no }) => {
        const nome = s.nome || s.Nome || s.texto || '', n = s.node || s;
        if (n.equip_de) equip = nome;
        else if (n.alternativa) motivoCar = String((charState.justificativas || {})[nome] || '').trim();
        else if (no.justificativa) { const item = { nome, motivo: String((charState.justificativas || {})[nome] || '').trim() }; (achaPericia(nome) ? pericias : outros).push(item); }
        else outros.push({ nome, motivo: '' });
    });
    const car = caracteristicaDoAntecedente();
    return { pericias, outros, caracteristica: car ? (car.nome || car.Nome) : null, motivoCaracteristica: motivoCar, equipamentoDe: equip };
}

// Reduz seleções que passaram do limite quando o nível diminui.
function ajustarContagens() {
    const ajusta = (cat) => {
        if (!charState[cat]) return;
        getActiveChoices(charState[cat], charState[cat].nome || charState[cat].Nome, cat).forEach(c => {
            const r = charState.escolhas[cat][c.id];
            if (r && typeof c.escolhaVal === 'number' && r.selecionados.length > c.escolhaVal) r.selecionados = r.selecionados.slice(0, c.escolhaVal);
        });
    };
    ['raca', 'antecedente'].forEach(ajusta);
    todasClasses().forEach(c => comClasse(c.idx, () => ajusta('classe')));
}

function nomesNoGrupo(grupo, excetoId) {
    const s = new Set();
    ['raca', 'classe', 'antecedente'].forEach(cat => Object.entries(charState.escolhas[cat] || {}).forEach(([id, res]) => {
        if (id !== excetoId && res.nodeOrigem && res.nodeOrigem.grupo_unico === grupo) res.selecionados.forEach(x => s.add(x.nome));
    }));
    return s;
}

// Pré-requisitos de opções de classe (invocações etc.): nível, pacto, patrono e magia exigida.
function checarPrereqOpcao(p) {
    const r = { bloqueios: [], conferir: [] };
    const daClasse = () => soClasse(contextoDeClasse(), () => semMagias(() => escolhasResolvidas('classe')));
    if (p.nivel && nivelAtual() < p.nivel) r.bloqueios.push(`nível ${p.nivel}`);
    const sel = daClasse().flatMap(({ res }) => res.selecionados.map(s => semAcento((s.node && s.node.nome_ingles) || s.nome || '')));
    if (p.pacto && !sel.some(n => n.includes('pact of the ' + semAcento(p.pacto)))) r.bloqueios.push(`Pact of the ${p.pacto} (escolha o pacto antes)`);
    if (p.patrono) {
        const escolheu = daClasse().some(({ c }) => c.node.nivel_escolha !== undefined);
        if (escolheu && !sel.some(n => n.includes(semAcento(p.patrono)))) r.bloqueios.push(`patrono ${p.patrono}`); else if (!escolheu) r.conferir.push(`patrono ${p.patrono}`);
    }
    if (p.magia) { const nomes = Object.entries(charState.escolhas.classe || {}).filter(([id]) => id.startsWith('MAGIA-')).flatMap(([, r2]) => r2.selecionados.map(s => s.nome)); if (!nomes.includes(p.magia)) r.conferir.push(`conhecer ${p.magia}`); }
    (p.conferir || []).forEach(c => r.conferir.push(c));
    return r;
}

