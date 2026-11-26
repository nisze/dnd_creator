// Opções de uma escolha e validação da seleção (usadas pela interface e pelos testes).
// Descrição de uma opção: a própria; sem ela (sub-raças, versões de outros livros), um resumo montado com as características que a opção traz.
function descricaoDaOpcao(c) {
    const propria = c.descrição || c.Descrição || c.resumo || c.Resumo;
    if (propria) return { texto: propria, derivada: false };
    const linhas = (Array.isArray(c.conteudo) ? c.conteudo : []).map(s => {
        const n = s.nome || s.Nome || s.texto || '', d = s.descrição || s.Descrição || s.resumo || s.Resumo || '';
        return n && d ? `${n}${s.nivel ? ` (nível ${s.nivel})` : ''}: ${d}` : (n || d);
    }).filter(Boolean);
    if (Array.isArray(c.substitui_base) && c.substitui_base.length) linhas.push('Substitui da raça base: ' + c.substitui_base.join(', ') + '.');
    return { texto: linhas.join('\n'), derivada: linhas.length > 0 };
}
// Devolve { opcoes, notaPericia, notaEspecializacao }.
function opcoesDaEscolha(tipo, escolha, idEscolha) {
    const no = escolha.node, tR = escolha.escolhaVal;
    let opcoes = [], notaPericia = false, notaEspecializacao = false;
    if (typeof tR === 'string' && tR.toLowerCase().includes('idioma')) {
        opcoes = db.idiomas.map(i => ({ nome: i.nome, desc: i.observacao }));
    } else if (typeof tR === 'string' && (tR.toLowerCase().includes('perícia') || tR.toLowerCase().includes('skill'))) {
        opcoes = semPericiasRepetidas(PERICIAS.map(p => ({ nome: p.nome })), no, idEscolha); notaPericia = true;
        if (no.pericias_permitidas) opcoes = opcoes.filter(o => no.pericias_permitidas.includes(o.nome));
    } else if (no.magias) {
        opcoes = opcoesMagia(no.magias);
    } else if (no.lista_magias) {
        const { classe, nivel } = no.lista_magias;
        opcoes = db.magias
            .filter(m => m.nivel === nivel && (m.classes.includes(classe) || (charState.tasha && m.classes_opcionais_tasha.includes(classe))))
            .map(m => ({ nome: m.nome, exibir: nomeMagia(m), ua: m.ua, fonte: m.fonte, desc: `${escolaMagia(m)} · ${resumoMagia(m).join(' · ')}`, magia: m }));
    } else if (tR === 'ASI') {
        opcoes = opcoesASI(idEscolha);
    } else if (tR === 'Atributo') {
        opcoes = ATTR_NAMES.filter(a => !atributosJaUsadosNoPai(tipo, escolha).has(a)).map(a => ({ nome: a }));
    } else if (tR === 'Talento') {
        opcoes = opcoesTalento(idEscolha);
        if (Array.isArray(no.talentos_permitidos)) opcoes = opcoes.filter(o => no.talentos_permitidos.includes(o.nome));
    } else if (Array.isArray(no.conteudo)) {
        opcoes = no.conteudo.map(c => { const d = descricaoDaOpcao(c); return { nome: c.nome || c.Nome || c.texto, ua: nodeEhUA(c), homebrew: nodeEhHomebrew(c), desc: d.texto, descDerivada: d.derivada, node: c }; });
        if (ehGrupoOutrasFontes(no)) opcoes.forEach(o => { o.fonte = (o.node && o.node.outra_fonte && o.node.fonte) || o.nome; });
        opcoes = opcoes.filter(o => !/^Outras Variantes$/i.test(o.nome)); // marcador sem conteúdo: as outras versões vêm do grupo "Outras versões" e dos livros ligados
        if (no.grupo_unico) { const ja = nomesNoGrupo(no.grupo_unico, idEscolha); opcoes = opcoes.filter(o => !ja.has(o.nome)); }
        opcoes.forEach(o => { const p = o.node && o.node.prerequisito; if (p) { const r = checarPrereqOpcao(p); o.bloqueado = r.bloqueios.join('; ') || null; o.conferir = r.conferir.join('; ') || null; } });
        { const antes = opcoes.length; opcoes = semPericiasRepetidas(opcoes, no, idEscolha); if (opcoes.length !== antes) notaPericia = true; }
        if (ehEspecializacao(no)) {
            // Especialização só vale para perícias em que o personagem já é proficiente (ferramentas ficam).
            const prof = extrairProficiencias(), jaEsp = extrairEspecializacoes();
            const proprias = new Set((((charState.escolhas[tipo] || {})[idEscolha] || {}).selecionados || []).map(s => (achaPericia(s.nome) || {}).nome));
            opcoes = opcoes.filter(o => { const p = achaPericia(o.nome); return !p || (prof.includes(p.nome) && (!jaEsp.includes(p.nome) || proprias.has(p.nome))); });
            notaEspecializacao = true;
        }
    } else {
        opcoes = [{ nome: 'Opção Padrão' }];
    }
    return { opcoes: opcoes.filter(permitido), notaPericia, notaEspecializacao };
}

// Atributos que uma escolha de aumento não pode repetir: os já escolhidos nos aumentos irmãos ("dois valores diferentes")
// e os que o mesmo grupo já fixa (ex.: Meio-Elfo tem Carisma +2 e escolhe outros dois).
function atributosJaUsadosNoPai(tipo, escolha) {
    const usados = new Set(), pai = escolha.pai;
    if (!pai || !Array.isArray(pai.conteudo) || !escolha.path) return usados;
    const base = escolha.path.slice(0, escolha.path.lastIndexOf(' > '));
    pai.conteudo.forEach((irmao, i) => {
        if (irmao === escolha.node || !ehNoASIRacial(irmao)) return;
        if (irmao.escolha === 'Atributo') {
            const id = `${base} > ${irmao.nome || irmao.Nome || irmao.texto || 'Opção'}[${i}]`.replace(/[^a-zA-Z0-9]/g, '-');
            const r = (charState.escolhas[tipo] || {})[id];
            if (r) r.selecionados.forEach(s => usados.add(s.nome));
        } else if (irmao.escolha === undefined || irmao.escolha === null || irmao.escolha === false) {
            ATTR_NAMES.forEach(a => { if (new RegExp(a + '\\s*\\+\\d', 'i').test(irmao.descrição || irmao.Descrição || '')) usados.add(a); });
        }
    });
    return usados;
}

// Regras que valem mesmo com a seleção incompleta (hoje: limite de magias fora das escolas do Cavaleiro Místico/Trapaceiro Arcano).
function validarRegrasSelecao(escolha, selecionados) {
    const cfg = escolha.node.magias;
    if (cfg && cfg.escolas && selecionados.filter(s => s.foraEscola).length > cfg.livres) return `No máximo ${cfg.livres} magia(s) podem ser de fora das escolas da subclasse (${cfg.escolas.map(e => ESCOLA_PT[e]).join(', ')}).`;
    return null;
}

// Texto do erro quando a seleção viola as regras da escolha; null se estiver válida.
function validarSelecao(escolha, selecionados) {
    const limite = parseInt(escolha.escolhaVal) || 1;
    if (selecionados.length === 0 && ehOpcional(escolha.node)) return null;
    if (selecionados.length === 0 || selecionados.length > limite) return `Selecione exatamente ${limite} opções.`;
    return validarRegrasSelecao(escolha, selecionados);
}

// Grava a seleção no estado (ou limpa, quando nada foi marcado).
function registrarSelecao(tipo, escolha, selecionados) {
    if (selecionados.length === 0) { delete charState.escolhas[tipo][escolha.id]; return; }
    charState.escolhas[tipo][escolha.id] = { nodeOrigem: escolha.node, selecionados };
}
