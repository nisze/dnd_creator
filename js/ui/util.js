// Utilidades da interface: texto seguro (sem emojis), ícones e descrições.
const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
// O único símbolo permitido é o de aviso.
const semEmoji = (s) => String(s == null ? '' : s).replace(EMOJI_RE, c => (c === '\u26A0' ? c : ''));
const esc = (s) => semEmoji(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Texto das descrições: títulos "## Título" e tabelas "Nome | Fonte" (filtradas por UA e livros ligados) viram linhas legíveis.
const _fonteLigada = (src) => {
    if (/unearthed arcana|\(UA\)/i.test(src)) return !!config.ua;
    const k = chaveLivro(src);
    return !k || config.livrosTodos || k.includes(CHAVE_PHB) || Object.keys(config.livros || {}).some(c => config.livros[c] && k.includes(c)) || !livrosDeFonte(src).length;
};
// Tabela por nível de classe ("Ranger Level | Spells", "Class Level | ..."): com o nível informado, sai o que ainda não foi liberado.
const _LINHA_NIVEL = /^(\d+)(?:st|nd|rd|th)?\s*\|\s*(.+)$/;
const _cabNivelClasse = (c) => /\blevel$/i.test(c) && !/^spell\b/i.test(c);
function _linhaDeBloco(t) {
    let m;
    if (/^(Ações|Reações|Ações Bônus|Ações Lendárias|Traços|Actions|Reactions|Bonus Actions)$/i.test(t)) return { sec: t };
    if ((m = /^([^:.\n]{2,45}):\s*(.+)$/.exec(t))) return { rot: m[1], val: m[2] };
    if ((m = /^(\p{Lu}[^.\n]{1,55}\.)\s+(.+)$/u.exec(t))) return { hab: m[1], val: m[2] };
    return { linha: t };
}
const _htmlBloco = (bloco) => '<span class="stat-bloco">' + bloco.map(b => b.nomeB !== undefined ? `<span class="stat-nome">${esc(b.nomeB)}</span>` : b.tipoB !== undefined ? `<i class="stat-tipo">${esc(b.tipoB)}</i>` : b.atr ? `<span class="stat-atrs">${b.atr.map(a => `<span><b>${esc(a.k)}</b>${esc(a.v)}</span>`).join('')}</span>` : b.sec !== undefined ? `<span class="sub-tit">${esc(b.sec)}</span>` : b.rot !== undefined ? `<span class="stat-lin"><b>${esc(b.rot)}:</b> ${esc(b.val)}</span>` : b.hab !== undefined ? `<span class="stat-lin"><b><i>${esc(b.hab)}</i></b> ${esc(b.val)}</span>` : `<span class="stat-lin">${esc(b.linha)}</span>`).join('') + '</span>';
function _linhasDoTexto(s, nivel) {
    const linhas = String(s == null ? '' : s).split('\n'), saida = [];
    for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i].trim();
        // Bloco de estatísticas de criatura (Defensor de Aço, Fera Companheira...): do nome até o fim do texto.
        if (/^(FOR|STR)\s*\|\s*(DES|DEX)\s*\|/i.test(l) && /\d/.test(linhas[i + 1] || '')) {
            const ini = [], ehRot = (t) => /^(Classe de Armadura|Pontos de Vida|Deslocamento|Armor Class|Hit Points|Speed):/i.test(t);
            while (saida.length && saida[saida.length - 1].txt !== undefined && ehRot(saida[saida.length - 1].txt.trim())) ini.unshift(saida.pop().txt.trim());
            for (let n = 0; n < 2 && saida.length && saida[saida.length - 1].txt !== undefined && saida[saida.length - 1].txt.trim() && saida[saida.length - 1].txt.trim().length < 80; n++) ini.unshift(saida.pop().txt.trim());
            const nomes = ini.filter(t => !ehRot(t)), bloco = [];
            if (nomes[0]) bloco.push({ nomeB: nomes[0] }); if (nomes[1]) bloco.push({ tipoB: nomes[1] });
            ini.filter(ehRot).forEach(t => bloco.push(_linhaDeBloco(t)));
            const ks = l.split('|').map(x => x.trim()), vs = (linhas[i + 1] || '').split('|').map(x => x.trim());
            bloco.push({ atr: ks.map((k, j) => ({ k, v: vs[j] || '' })) });
            for (i += 2; i < linhas.length; i++) { const t = linhas[i].trim(); if (t) bloco.push(_linhaDeBloco(t)); }
            saida.push({ bloco });
            break;
        }
        const cab = /^(.+?)\s*\|\s*(Source|Fonte)$/i.exec(l);
        if (cab) {
            const rows = []; let ua = false; i++;
            for (; i < linhas.length; i++) {
                const r = linhas[i].trim();
                if (/^(archived )?unearthed arcana$/i.test(r)) { ua = true; continue; }
                const m = /^([^|]+?)\s*\|\s*(.+)$/.exec(r);
                if (!m) break;
                const src = m[2].replace(/^Source:\s*/i, '');
                if (_fonteLigada(ua ? 'Unearthed Arcana ' + src : src) && !(/\(UA\)/i.test(m[1]) && !config.ua)) rows.push({ nome: m[1], src });
            }
            i--;
            if (rows.length) { saida.push({ tit: cab[1] + ' · Fonte' }); rows.forEach(r => saida.push({ item: r.nome, src: r.src })); }
            continue;
        }
        if (l.includes('|') && !_LINHA_NIVEL.test(l) && _LINHA_NIVEL.test((linhas[i + 1] || '').trim())) {
            const celulas = l.split('|').map(c => c.trim()), rows = []; i++;
            for (; i < linhas.length; i++) { const m = _LINHA_NIVEL.exec(linhas[i].trim()); if (!m) break; rows.push({ n: +m[1], rot: linhas[i].trim().split('|')[0].trim(), val: m[2].split('|').map(c => c.trim()).join(' \u00b7 ') }); }
            i--;
            const vis = nivel && _cabNivelClasse(celulas[0]) ? rows.filter(r => r.n <= nivel) : rows;
            if (vis.length) { saida.push({ tit: celulas.join(' \u00b7 ') }); vis.forEach(r => saida.push({ item: r.rot, val: r.val })); }
            continue;
        }
        const h = /^#{1,6}\s+(.+)$/.exec(l);
        // Tabela d100 em duas colunas ("d100 | Efeito | d100 | Efeito"): vira uma lista recolhível, em ordem.
        if (/^d100\s*\|/i.test(l)) {
            const itens = []; let k = i + 1;
            for (; k < linhas.length; k++) { const c = linhas[k].split('|').map(x => x.trim()); if (!/^\d+(-\d+)?$/.test(c[0])) break; for (let j = 0; j + 1 < c.length; j += 2) if (/^\d+(-\d+)?$/.test(c[j])) itens.push({ item: c[j], val: c[j + 1] }); }
            if (itens.length) { itens.sort((a, b) => parseInt(a.item, 10) - parseInt(b.item, 10)); saida.push({ detalhes: 'Tabela d100 (' + itens.length + ' efeitos)', lista: itens }); i = k - 1; continue; }
        }
        saida.push(h ? { tit: h[1] } : { txt: linhas[i] });
    }
    return saida;
}
const _negritoItem = (t) => esc(t).replace(/^(\s*-\s+)(\p{Lu}[^.\n]{1,60}?\.)(\s)/u, (m, a, nome, c) => nome.split(/\s+/).length <= 7 ? a + '<b>' + nome + '</b>' + c : m);
const paragrafos = (s, nivel) => '<span data-conteudo>' + _linhasDoTexto(s, nivel).map(x => x.bloco !== undefined ? _htmlBloco(x.bloco) : x.detalhes !== undefined ? `<details class="tabela-d"><summary>${esc(x.detalhes)}</summary>${x.lista.map(r => `<span class="sub-item"><b>${esc(r.item)}</b> \u00b7 ${esc(r.val)}</span>`).join('')}</details>` : x.tit !== undefined ? `<span class="sub-tit">${esc(x.tit)}</span>` : x.val !== undefined ? `<span class="sub-item"><b>${esc(x.item)}</b> \u00b7 ${esc(x.val)}</span>` : x.item !== undefined ? `<span class="sub-item">${esc(x.item)} <span class="nivel-tag">(${esc(x.src)})</span></span>` : _negritoItem(x.txt) + '<br>').join('').replace(/(<br>)+$/, '').replace(/<br>(<span class="sub-|<details)/g, '$1') + '</span>';
const nomeDe = (x) => (x && (x.nome || x.Nome || x.texto)) || '';
const descDe = (x) => (x && (x['descrição'] || x['Descrição'] || x.descricao || x.descricao_en || x.resumo || x.Resumo)) || '';
const porId = (id) => document.getElementById(id);
// Tela estreita (celular e tablet): detalhes e escolhas abrem em uma janela.
const ehMovel = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(max-width: 1120px)').matches;

// ---- Ícones (project/BG3Icons, usados onde estão) ----
let ICONES = { racas: {}, classes: {}, subclasses: {}, pericias: {}, antecedentes: {}, atributos: {}, magias: {}, passivos: {} };
const chaveIcone = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const ingles = (nome) => { const m = /\(([^)]+)\)\s*$/.exec(nome || ''); return m ? m[1] : nome; };
function htmlIcone(caminho, alt, pequeno) {
    const cls = 'icone' + (pequeno ? ' peq' : '');
    return caminho ? `<img class="${cls}" src="${encodeURI(caminho)}" alt="${esc(alt)}" loading="lazy">` : `<span class="${cls} icone-vazio" title="Sem ícone">?</span>`;
}
const nomeBaseRaca = (nome) => { const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(nome || ''); return !m ? nome : /^(Revised )?[A-Z]{2,4}$/.test(m[2]) ? m[1] : m[2]; };
const caminhoRaca = (nome) => ICONES.racas[chaveIcone(nomeBaseRaca(nome))] || null;
const caminhoClasse = (id) => ICONES.classes[chaveIcone(id)] || ICONES.classes[chaveIcone(String(id).replace(/-.*$/, ''))] || null;
const caminhoSubclasse = (id) => ICONES.subclasses[chaveIcone(id)] || null;
const caminhoPericia = (nome) => { const p = achaPericia(nome); return p ? ICONES.pericias[p.nome] || null : null; };
const caminhoAntecedente = (a) => ICONES.antecedentes[chaveIcone(a.nome_ingles || ingles(nomeDe(a)))] || null;
const caminhoMagia = (id) => ICONES.magias[chaveIcone(id)] || null;
const caminhoPassivo = (nomeEn) => ICONES.passivos[chaveIcone(nomeEn)] || null;
const caminhoAtributo = (k) => ICONES.atributos[k] || null;

// ---- Etiquetas de UA e terceiros ----
const textoUA = () => (db.avisos && db.avisos.ua && db.avisos.ua.texto_pt) || 'Material de playtest, não publicado oficialmente. A aceitação varia de mesa para mesa: confirme com o seu mestre.';
const textoTerceiros = () => (db.avisos && db.avisos.homebrew && db.avisos.homebrew.texto_pt) || 'Material criado por terceiros, não publicado pela Wizards of the Coast. A aceitação varia de mesa para mesa: confirme com o seu mestre.';
// Armadura no inventário: tipo entre parênteses e uma seta para baixo quando impõe desvantagem em Furtividade.
const tagArmadura = (i) => {
    if (!i || i.cat !== 'armadura' || !i.mec) return '';
    const t = { leve: '(leve)', media: '(média)', pesada: '(pesada)' }[i.mec.tipo];
    return (t ? ` <small class="tipo-arm">${t}</small>` : '') + (i.mec.furtividade_desv ? ' <span class="desv-furt" title="Desvantagem em Furtividade" aria-label="Desvantagem em Furtividade">&#9660;</span>' : '');
};
function etiquetas(x) {
    if (!x) return '';
    const no = x.node || x; let h = '';
    if (x.ua || nodeEhUA(no)) h += `<span class="tag" title="${esc(textoUA())}">UA</span>`;
    if (x.homebrew || nodeEhHomebrew(no)) h += `<span class="tag terceiros" title="${esc(textoTerceiros())}">Terceiros</span>`;
    return h;
}
const fonteDe = (x) => { const f = x && (x.fonte || (x.node && x.node.fonte)); const pg = x && (x.pagina || (x.node && x.node.pagina)); return f ? String(f).replace(/\s*\n\s*/g, ', ') + (pg ? ', p. ' + pg : '') : ''; };

// ---- Descrições curtas das perícias (nome em português como no app) ----
const DESC_PERICIA = {
    'Acrobacia': ['Destreza', 'Equilíbrio, piruetas, quedas controladas e manobras ágeis.'],
    'Lidar com Animais': ['Sabedoria', 'Acalmar, treinar e controlar animais e montarias.'],
    'Arcanismo': ['Inteligência', 'Conhecimento sobre magias, itens mágicos, símbolos arcanos e planos.'],
    'Atletismo': ['Força', 'Escalar, nadar, saltar e feitos de força física.'],
    'Atuação': ['Carisma', 'Música, dança, atuação e narração para entreter.'],
    'Enganação': ['Carisma', 'Mentir, disfarçar a verdade e enganar com palavras ou gestos.'],
    'Furtividade': ['Destreza', 'Mover-se sem ser visto nem ouvido.'],
    'História': ['Inteligência', 'Conhecimento de eventos históricos, lendas e civilizações.'],
    'Intimidação': ['Carisma', 'Influenciar pela ameaça, hostilidade ou violência implícita.'],
    'Intuição': ['Sabedoria', 'Perceber intenções, mentiras e o estado de ânimo de alguém.'],
    'Investigação': ['Inteligência', 'Procurar pistas, deduzir e examinar detalhes.'],
    'Medicina': ['Sabedoria', 'Estabilizar moribundos e diagnosticar doenças e ferimentos.'],
    'Natureza': ['Inteligência', 'Conhecimento de terrenos, plantas, animais e clima.'],
    'Percepção': ['Sabedoria', 'Notar, ouvir ou localizar algo ao redor.'],
    'Persuasão': ['Carisma', 'Convencer com tato, boas maneiras e argumentos.'],
    'Prestidigitação': ['Destreza', 'Truques de mãos, furtar bolsos e esconder objetos.'],
    'Religião': ['Inteligência', 'Conhecimento sobre deuses, ritos, símbolos sagrados e cultos.'],
    'Sobrevivência': ['Sabedoria', 'Rastrear, caçar, orientar-se e sobreviver em ermos.']
};
const textoPericia = (nome) => { const p = achaPericia(nome); const d = p && DESC_PERICIA[p.nome]; return d ? `${d[0]}. ${d[1]}` : ''; };

// ---- Pequenos blocos de HTML ----
const normaliza = (s) => semAcento(String(s || ''));
const selecaoDe = (cat, id) => ((charState.escolhas[cat] || {})[id] || {}).selecionados || [];
const mesmaOpcao = (opcao, s) => _casaSelecao(opcao, _resumoSelecao(s));
const sinal = (n) => (n >= 0 ? '+' + n : String(n));
const listaOuTraco = (l) => (l && l.length ? l.map(esc).join(', ') : 'nenhuma');
