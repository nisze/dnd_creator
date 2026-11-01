// Talentos: pré-requisitos e opções.
function talentoComEscolhas(t) {
    const c = JSON.parse(JSON.stringify(t));
    (c.conteudo || []).forEach(n => {
        const d = n['descrição'] || '';
        if (!/^Aumento/i.test(n.nome || '') || !/Aument[ea]/i.test(d) || /deslocamento/i.test((n.nome || '') + d)) return;
        const attrs = /(uma habilidade|um atributo|valor de um )/i.test(d) ? Object.keys(ATTR_STEMS) : atributosCitados(d);
        if (attrs.length === 1) n.bonus_atributo = ATTR_MAP_KEY[attrs[0]];
        else if (attrs.length > 1) { n.escolha = 1; n.conteudo = attrs.map(a => ({ nome: a })); }
    });
    return c;
}

// Pré-requisitos: nível, atributo e raça bloqueiam; o resto (conjuração, proficiências, campanha) fica como aviso.
function checarPrereq(t, finais) {
    const r = { bloqueios: [], conferir: [] }; const p = t.prerequisito;
    if (!p) return r;
    if (p.nivel && nivelTotal() < p.nivel) r.bloqueios.push(`nível ${p.nivel}`);
    if (p.atributos && finais && !p.atributos.lista.some(k => finais[k] >= p.atributos.min)) r.bloqueios.push(`${p.atributos.lista.join(' ou ')} ${p.atributos.min}+`);
    if (p.racas && charState.raca) {
        const nomeRaca = semAcento(charState.raca.nome || charState.raca.Nome);
        const selecionados = escolhasResolvidas('raca').flatMap(({ res }) => res.selecionados.map(s => semAcento(s.nome || s.Nome || s.texto)));
        const casa = (tokens, texto) => tokens.some(tk => new RegExp('(^|[^a-z-])' + tk.replace(/[-]/g, '\\-') + '($|[^a-z-])').test(texto));
        const base = p.racas.filter(x => casa(x.tokens, nomeRaca));
        if (!base.length) r.bloqueios.push('raça ' + p.racas.map(x => x.tokens[0]).join(' / '));
        else if (!base.some(x => !x.sub || x.sub.some(s => selecionados.some(n => n.includes(s))))) r.conferir.push('sub-raça ' + base.map(x => x.sub[0]).join(' / '));
    }
    (p.conferir || []).forEach(c => r.conferir.push(c));
    return r;
}

const opcoesTalento = () => {
    const finais = db.talentos.some(t => t.prerequisito && t.prerequisito.atributos) ? calcularAtributosFinais() : null;
    return db.talentos.map(t => {
        const c = checarPrereq(t, finais);
        return { nome: t.nome || t.texto, ua: nodeEhUA(t), homebrew: !!t.homebrew, talento: true, fonte: t.fonte || null, fonteIndef: !t.fonte, node: talentoComEscolhas(t), bloqueado: c.bloqueios.join('; ') || null, conferir: c.conferir.join('; ') || null };
    });
};

function opcoesASI() {
    const o = []; const nomes = Object.keys(ATTR_STEMS);
    nomes.forEach(a => o.push({ nome: `${a} +2`, grupo: '+2 em um atributo', asi: { [ATTR_MAP_KEY[a]]: 2 } }));
    for (let i = 0; i < nomes.length; i++) for (let j = i + 1; j < nomes.length; j++) o.push({ nome: `${nomes[i]} +1, ${nomes[j]} +1`, grupo: '+1 em dois atributos', asi: { [ATTR_MAP_KEY[nomes[i]]]: 1, [ATTR_MAP_KEY[nomes[j]]]: 1 } });
    return o.concat(opcoesTalento().map(t => ({ ...t, grupo: 'Talento' })));
}

