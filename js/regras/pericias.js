// Perícias, proficiências e salvaguardas.
// Perícias fixas de raça/classe (texto "Proficiência na perícia X"). Se coincidem com as do antecedente, o antecedente deve dar outra.
const RE_PERICIA_FIXA = /[Pp]roficiência na perícia ([^.]+)\./;
function periciasFixasRacaClasse() {
    const s = new Set();
    ['raca', 'classe'].forEach(cat => nodesAtivos(cat).forEach(n => { const m = String(n.descrição || n.Descrição || '').match(RE_PERICIA_FIXA); const p = n.pericia_fixa ? achaPericia(n.pericia_fixa) : (m && achaPericia(m[1])); if (p) s.add(p.nome); }));
    // Perícias que o jogador escolheu na raça ou na classe (ex.: Humano Variante, perícias de classe) também contam: se o antecedente der a mesma, ele concede outra no lugar.
    ['raca', 'classe'].forEach(cat => escolhasResolvidas(cat).forEach(({ res }) => {
        if (ehEspecializacao(res.nodeOrigem)) return;
        res.selecionados.forEach(x => { const p = achaPericia(String(x.nome || x.Nome || x.texto || '').split('(')[0].trim()); if (p) s.add(p.nome); });
    }));
    return s;
}
const idSubstituta = (nome) => 'DUP-' + nome.replace(/[^A-Za-z]/g, '');
function escolhasPericiaSubstituta(raiz) {
    if (!charState.antecedente) return [];
    const fixas = periciasFixasRacaClasse();
    return (charState.antecedente.pericias_automaticas || []).map(achaPericia).filter(p => p && fixas.has(p.nome)).map(p => ({
        id: idSubstituta(p.nome), path: raiz + ' > Perícia substituta', escolhaVal: 'Perícia',
        node: { simbolo: '🔁', nome: `Perícia substituta (${p.nome})`, escolha: 'Perícia', 'descrição': `Você já recebe ${p.nome} da raça ou da classe. Uma mesma proficiência não vem duas vezes: escolha outra perícia no lugar da que o antecedente concede.`, substituta_de: p.nome }
    }));
}

// Perícias concedidas (com repetição quando a mesma vem de duas fontes). `excetoId` ignora a própria escolha em edição.
function concessoesPericias(excetoId) {
    const lista = [];
    if (charState.antecedente && charState.antecedente.pericias_automaticas) {
        const fixas = periciasFixasRacaClasse();
        charState.antecedente.pericias_automaticas.forEach(p => {
            const pericia = achaPericia(p); if (!pericia) return;
            const subst = ((charState.escolhas.antecedente || {})[idSubstituta(pericia.nome)] || {}).selecionados;
            if (subst && subst.length && fixas.has(pericia.nome) && excetoId !== idSubstituta(pericia.nome)) return;
            lista.push({ nome: pericia.nome, fonte: 'antecedente' });
        });
    }
    // Proficiências fixas de raça/classe descritas em texto (ex.: Sentidos Aguçados, Ameaçador).
    ['raca', 'classe', 'antecedente'].forEach(cat => {
        nodesAtivos(cat).forEach(n => {
            const fixas = n.pericias_fixas || (n.pericia_fixa ? [n.pericia_fixa] : null);
            if (fixas) { fixas.forEach(f => { const p = achaPericia(f); if (p) lista.push({ nome: p.nome, fonte: cat, dobra: !!n.dobra_se_ja }); }); return; }
            if (cat === 'antecedente') return;
            if (Array.isArray(n.conteudo) && n.conteudo.some(x => x && x.pericia_condicional)) return;
            const m = String(n.descrição || n.Descrição || '').match(/[Pp]roficiência na perícia ([^.]+)\./);
            const pericia = m && achaPericia(m[1]);
            if (pericia) lista.push({ nome: pericia.nome, fonte: cat });
        });
    });
    ['raca', 'classe', 'antecedente'].forEach(cat => {
        escolhasResolvidas(cat).forEach(({ c, res }) => {
            if (ehEspecializacao(res.nodeOrigem) || c.id === excetoId) return;
            res.selecionados.forEach(s => {
                let cleanName = s.nome || s.Nome || s.texto || "";
                if (cleanName.includes('(')) cleanName = cleanName.split('(')[0].trim();
                const pericia = achaPericia(cleanName);
                if (pericia) lista.push({ nome: pericia.nome, fonte: cat });
            });
        });
    });
    return lista;
}
function extrairProficiencias(excetoId) { return [...new Set(concessoesPericias(excetoId).map(x => x.nome))]; }
const periciasRepetidas = () => { const c = {}; concessoesPericias().forEach(x => { if (!x.dobra) c[x.nome] = (c[x.nome] || 0) + 1; }); return Object.keys(c).filter(k => c[k] > 1); };
// Talentos de perícia (UA): se a perícia já vem de outra fonte, o bônus de proficiência dela é dobrado.
const periciasDobradasPorTalento = () => { const l = concessoesPericias(); return [...new Set(l.filter(x => x.dobra && l.filter(y => y.nome === x.nome).length > 1).map(x => x.nome))]; };

// Regra: uma perícia não pode ser escolhida de novo se já vem de outra fonte (a Especialização é a exceção).
// Também aplica as regras "esta perícia, ou outra se você já a tem" (pericia_condicional) e "esta salvaguarda, ou outras" (salva_condicional).
function semPericiasRepetidas(optionsList, node, choiceId) {
    if (node.salva_condicional) {
        const ja = salvaguardasProficientes(choiceId);
        return optionsList.filter(o => node.salva_condicional.prioritaria === o.nome ? !ja.has(o.nome) : ja.has(node.salva_condicional.prioritaria) && !ja.has(o.nome));
    }
    if (ehEspecializacao(node) || !optionsList.length) return optionsList;
    const ja = new Set(extrairProficiencias(choiceId));
    if (node.pericia_mista) {
        const prio = node.pericia_condicional && achaPericia(node.pericia_condicional.prioritaria).nome;
        return optionsList.filter(o => { const p = achaPericia(o.nome); if (!p) return !prio || ja.has(prio); return prio ? (p.nome === prio ? !ja.has(prio) : false) : !ja.has(p.nome); });
    }
    if (!optionsList.every(o => achaPericia(o.nome))) return optionsList;
    if (node.pericia_condicional) {
        const prio = achaPericia(node.pericia_condicional.prioritaria).nome;
        return ja.has(prio) ? optionsList.filter(o => achaPericia(o.nome).nome !== prio && !ja.has(achaPericia(o.nome).nome)) : optionsList.filter(o => achaPericia(o.nome).nome === prio);
    }
    return optionsList.filter(o => !ja.has(achaPericia(o.nome).nome));
}

// Salvaguardas com proficiência: da classe, de características fixas (salva: {tipo}) e de escolhas que concedem (concede_salvaguarda).
function salvaguardasDaClasse() {
    const n = charState.classe && charState.classe.conteudo.find(c => (c.nome || c.Nome) && (c.nome || c.Nome).includes('Testes de Resistência'));
    return n ? (n.nome || n.Nome).split(':')[1].split(',').map(s => s.trim().replace('.', '')) : [];
}
function salvaguardasProficientes(excetoId) {
    const s = new Set(salvaguardasDaClasse());
    ['raca', 'classe', 'antecedente'].forEach(cat => nodesAtivos(cat).forEach(n => {
        if (!n.salva) return;
        if (n.salva.tipo === 'todas') ATTR_NAMES.forEach(a => s.add(a));
        else if (n.salva.tipo === 'fixa') n.salva.lista.forEach(a => s.add(a));
    }));
    ['raca', 'classe', 'antecedente'].forEach(cat => escolhasResolvidas(cat).forEach(({ c, res }) => {
        if (c.id === excetoId || !res.nodeOrigem.concede_salvaguarda) return;
        res.selecionados.forEach(x => { if (ATTR_NAMES.includes(x.nome)) s.add(x.nome); });
    }));
    return s;
}

