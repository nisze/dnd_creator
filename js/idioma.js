// Idioma da interface e do conteúdo (pt-BR / inglês). Carregar antes dos demais scripts.
// - Texto escrito no código em português é traduzido na tela por dicionário (Idioma.adicionar) e padrões (Idioma.padrao);
//   o que não está no dicionário permanece como está.
// - O conteúdo do jogo (magias etc.) vem dos dados em inglês; em pt-BR usa-se a camada dados/pt/*.json (Idioma.tr).
// - A escolha fica em localStorage ('dnd_idioma'), separada dos personagens (que guardam só ids).
const Idioma = (() => {
    const CHAVE = 'dnd_idioma';
    const dic = new Map();       // texto pt -> texto en
    const padroes = [];          // [RegExp, substituição (string com $1.. ou função)]
    const trechos = new Map();   // trecho pt -> trecho en (trocado dentro de textos maiores, com valores no meio)
    let reTrechos = null;
    const camadas = {};          // categoria -> { id: {campos pt} }
    let atual = 'pt';
    try { if (typeof localStorage !== 'undefined' && localStorage.getItem(CHAVE) === 'en') atual = 'en'; } catch (e) { /* sem armazenamento */ }

    const chave = (s) => String(s).replace(/\s+/g, ' ').trim();

    function adicionar(obj) { Object.keys(obj).forEach(k => dic.set(chave(k), obj[k])); }
    function padrao(re, sub) { padroes.push([re, sub]); }
    // Dados com texto em português e o original em inglês guardado (descricao_en / resumo_en): monta o dicionário linha a linha em tempo de execução.
    function adicionarNos(raiz) {
        const par = (pt, en) => {
            if (typeof pt !== 'string' || typeof en !== 'string' || pt === en) return;
            const lp = pt.split('\n'), le = en.split('\n');
            if (lp.length !== le.length) return;
            lp.forEach((p, i) => { const k = chave(p); if (k && !dic.has(k) && chave(le[i]) !== k) dic.set(k, chave(le[i])); });
        };
        (function v(n) {
            if (!n || typeof n !== 'object') return;
            if (Array.isArray(n)) { n.forEach(v); return; }
            if (n.idioma_descricao !== 'en') {
                par(n['descrição'] || n['Descrição'], n.descricao_en); par(n.resumo || n.Resumo, n.resumo_en); par(n.nome || n.Nome, n.nome_ingles);
                const pr = n.prerequisito;
                if (pr && Array.isArray(pr.conferir) && Array.isArray(pr.conferir_en)) pr.conferir.forEach((c, i) => par(c, pr.conferir_en[i]));
            }
            v(n.conteudo);
        })(raiz);
    }
    function adicionarTrechos(obj) { Object.keys(obj).forEach(k => trechos.set(chave(k), obj[k])); reTrechos = null; }
    const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    function trocarTrechos(k) {
        if (!trechos.size) return k;
        if (!reTrechos) {
            const ks = [...trechos.keys()].sort((a, b) => b.length - a.length).map(escRe);
            reTrechos = new RegExp('(?<![\\p{L}\\p{N}])(?:' + ks.join('|') + ')(?![\\p{L}\\p{N}])', 'gu');
        }
        return k.replace(reTrechos, m => trechos.get(m));
    }

    function dividirVirgulas(k) {
        const ps = []; let nivel = 0, ini = 0;
        for (let i = 0; i < k.length; i++) {
            const c = k[i];
            if (c === '(') nivel++; else if (c === ')') nivel = Math.max(0, nivel - 1);
            else if (c === ',' && nivel === 0 && k[i + 1] === ' ') { ps.push(k.slice(ini, i)); ini = i + 2; }
        }
        ps.push(k.slice(ini));
        return ps;
    }
    // Traduz um texto solto; devolve null quando não há tradução.
    // conteudo=true (texto de regras ainda em português): não troca trechos soltos, para não misturar idiomas.
    function traduzirTexto(txt, conteudo) {
        const k = chave(txt);
        if (!k) return null;
        if (dic.has(k)) return dic.get(k);
        for (const [re, sub] of padroes) { if (re.test(k)) return re instanceof RegExp ? k.replace(re, sub) : sub(k); }
        // "A · B · C" (rótulos juntados): traduz cada parte
        if (k.length < 300 && /( · | \| )/.test(k) && !/[.!?] [A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(k)) {
            const ps = k.split(/( · | \| )/), ts = ps.map((p, j) => j % 2 ? null : traduzirTexto(p, conteudo));
            if (ts.some(x => x != null)) return ps.map((p, j) => ts[j] != null ? ts[j] : p).join('');
        }
        // "Nome do traço: descrição" (linhas de resumo): traduz cada lado
        const i = k.indexOf(': ');
        if (i > 0 && i < 70 && dividirVirgulas(k.slice(0, i)).length === 1) {
            const a = traduzirTexto(k.slice(0, i), conteudo), b = traduzirTexto(k.slice(i + 2), conteudo);
            if (a != null || b != null) return (a != null ? a : k.slice(0, i)) + ': ' + (b != null ? b : k.slice(i + 2));
        }
        // "A; B" (pré-requisitos juntados): traduz cada parte
        if (k.length < 300 && k.includes('; ') && !k.includes('. ')) {
            const ps = k.split('; '), ts = ps.map(p => traduzirTexto(p, conteudo));
            if (ts.some(t => t != null)) return ps.map((p, j) => ts[j] != null ? ts[j] : p).join('; ');
        }
        // "A, B, C" (listas de nomes juntadas): traduz cada item, respeitando vírgulas dentro de parênteses
        if (k.length < 500 && k.includes(', ') && !k.includes('. ')) {
            const ps = dividirVirgulas(k);
            if (ps.length > 1) {
                const ts = ps.map(p => traduzirTexto(p, conteudo));
                if (ts.some(x => x != null)) return ps.map((p, j) => ts[j] != null ? ts[j] : p).join(', ');
            }
        }
        // "Português (English)": em inglês mostra só a parte entre parênteses
        const base = conteudo ? k : trocarTrechos(k);
        const tr2 = soIngles(base);
        if (tr2 !== k) return tr2;
        return null;
    }
    // Troca "Elfo (Elf)", "Alto Elfo (High Elf)" por "Elf", "High Elf" em qualquer ponto do texto.
    function soIngles(s) {
        const re = / \((?!(?:Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)\))([A-Z][A-Za-z'’\-]*(?: [A-Za-z'’\-]+)*)\)/g;
        let out = '', ult = 0, m;
        while ((m = re.exec(s))) {
            const n = m[1].split(' ').length, antes = s.slice(ult, m.index).split(' ');
            let i = antes.length, cnt = 0, fim = i, extra = false;
            while (i > 0) {
                const tk = antes[i - 1];
                if (cnt < n && /^[\p{Lu}][\p{L}'’\-]*$/u.test(tk)) { cnt++; i--; fim = i; }
                else if (cnt && cnt < n && /^(d[aeo]s?|e)$/.test(tk)) i--;
                // nome em português com mais palavras que o inglês ("Elfo Negro (Drow)", "Treinamento com Armas Élficas (Elf Weapon Training)"):
                // leva o resto do nome até o começo do texto ou da frase
                else if (cnt >= 1 && !extra) {
                    let j = i;
                    while (j > 0 && (/^[\p{Lu}][\p{L}'’\-]*$/u.test(antes[j - 1]) || /^(d[aeo]s?|n[ao]s?|e|com|em|para|a|o|as|os|ao|à|uma?)$/.test(antes[j - 1]))) j--;
                    while (j < i && !/^[\p{Lu}]/u.test(antes[j])) j++;
                    if (j < i && (j === 0 || /[,:;]$/.test(antes[j - 1]))) { i = j; fim = j; }
                    extra = true;
                }
                else break;
            }
            const fimTxt = m.index + m[0].length;
            if (!cnt) out += s.slice(ult, fimTxt);
            else out += antes.slice(0, fim).join(' ') + (fim ? ' ' : '') + m[1];
            ult = fimTxt;
        }
        return out + s.slice(ult);
    }
    // Traduz preservando espaços nas pontas.
    function t(txt, conteudo) {
        if (atual !== 'en' || txt == null) return txt;
        const s = String(txt);
        const r = traduzirTexto(s, conteudo);
        if (r == null) return s;
        return (/^\s*/.exec(s)[0]) + r + (/\s*$/.exec(s)[0]);
    }

    // Camadas de conteúdo traduzido (dados/pt/*.json): tr('magias', id) -> objeto pt ou null (usar o inglês).
    function definirCamada(cat, dados) { camadas[cat] = dados || {}; }
    function tr(cat, id) { return atual === 'pt' && camadas[cat] && camadas[cat][id] || null; }

    // Unidades: os dados estão em pés/libras; em pt-BR mostra metros/kg.
    const arred = (n, p) => { const v = Math.round(n / p) * p; return String(+v.toFixed(2)).replace('.', ','); };
    function distancia(pes) { return atual === 'pt' ? arred(pes * 0.3, 0.5) + ' m' : pes + ' ft.'; }
    function peso(lb) { return atual === 'pt' ? arred(lb * 0.5, 0.5) + ' kg' : lb + ' lb.'; }

    // ---- DOM ----
    const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
    const PULAR = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 0, NOSCRIPT: 1 };
    let obs = null;
    const guardaTexto = new WeakMap();   // nó de texto -> { orig, trad }
    const guardaAttr = new WeakMap();    // elemento -> { attr: { orig, trad } }

    function aplicarNo(no) {
        if (no.nodeType === 3) {
            const g = guardaTexto.get(no);
            if (g && no.nodeValue === g.trad) return;
            const orig = no.nodeValue;
            const cont = atual === 'en' && no.parentElement && no.parentElement.closest('[data-conteudo]');
            // listas de idiomas: "Anão" é o idioma (Dwarvish), não a raça
            const lin = atual === 'en' && no.parentElement && no.parentElement.closest('[data-lingua]');
            const r = atual === 'en' ? t(lin ? orig.replace(/(^|, )Anão(?=,|$)/g, '$1Dwarvish') : orig, !!cont) : orig;
            if (r !== orig) { guardaTexto.set(no, { orig, trad: r }); no.nodeValue = r; } else if (g) guardaTexto.delete(no);
            return;
        }
        if (no.nodeType !== 1) return;
        aplicarAttrs(no);
        if (PULAR[no.nodeName]) return;
        for (let c = no.firstChild; c; c = c.nextSibling) aplicarNo(c);
    }
    function aplicarAttrs(el) {
        for (const a of ATTRS) {
            if (!el.hasAttribute || !el.hasAttribute(a)) continue;
            const g = (guardaAttr.get(el) || {})[a];
            const v = el.getAttribute(a);
            if (g && v === g.trad) continue;
            const r = atual === 'en' ? t(v) : v;
            if (r !== v) { const m = guardaAttr.get(el) || {}; m[a] = { orig: v, trad: r }; guardaAttr.set(el, m); el.setAttribute(a, r); }
        }
    }
    function restaurarNo(no) {
        if (no.nodeType === 3) { const g = guardaTexto.get(no); if (g && no.nodeValue === g.trad) no.nodeValue = g.orig; guardaTexto.delete(no); return; }
        if (no.nodeType !== 1) return;
        const m = guardaAttr.get(no);
        if (m) { Object.keys(m).forEach(a => { if (no.getAttribute(a) === m[a].trad) no.setAttribute(a, m[a].orig); }); guardaAttr.delete(no); }
        for (let c = no.firstChild; c; c = c.nextSibling) restaurarNo(c);
    }
    function observar() { if (obs) obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); }
    function aoMudar(regs) {
        obs.disconnect();
        try {
            for (const r of regs) {
                if (r.type === 'childList') r.addedNodes.forEach(aplicarNo);
                else if (r.type === 'characterData') aplicarNo(r.target);
                else if (r.type === 'attributes') aplicarAttrs(r.target);
            }
        } finally { observar(); }
    }
    function aplicarTudo() { if (typeof document === 'undefined') return; if (obs) obs.disconnect(); aplicarNo(document.documentElement); observar(); }

    function definir(l) {
        const novo = l === 'en' ? 'en' : 'pt';
        if (novo === atual) return;
        atual = novo;
        try { localStorage.setItem(CHAVE, atual); } catch (e) { /* sem armazenamento */ }
        if (typeof document === 'undefined') return;
        document.documentElement.lang = atual === 'en' ? 'en' : 'pt-BR';
        if (obs) obs.disconnect();
        if (atual === 'pt') restaurarNo(document.documentElement);
        document.dispatchEvent(new CustomEvent('idioma-mudou', { detail: atual }));
        aplicarTudo();
        atualizarBotao();
    }

    function atualizarBotao() {
        const b = typeof document !== 'undefined' && document.getElementById('btn-idioma');
        if (!b) return;
        b.innerHTML = '<span class="' + (atual === 'en' ? 'ativo' : '') + '">EN</span><span class="' + (atual === 'pt' ? 'ativo' : '') + '">PT</span>';
        b.title = atual === 'en' ? 'Mudar para português' : 'Switch to English';
        b.setAttribute('aria-label', b.title);
        // o título/rótulo do botão não deve ser traduzido pelo dicionário
        guardaAttr.delete(b);
    }
    function criarBotao() {
        if (document.getElementById('btn-idioma')) return;
        const nav = document.querySelector('.acoes-topo');
        if (!nav) return;
        const b = document.createElement('button');
        b.type = 'button'; b.id = 'btn-idioma'; b.className = 'sec seletor-idioma';
        b.addEventListener('click', () => definir(atual === 'en' ? 'pt' : 'en'));
        nav.insertBefore(b, nav.firstChild);
        atualizarBotao();
    }

    function iniciar() {
        if (typeof document === 'undefined') return;
        document.documentElement.lang = atual === 'en' ? 'en' : 'pt-BR';
        criarBotao();
        if (typeof MutationObserver !== 'undefined') obs = new MutationObserver(aoMudar);
        aplicarTudo();
        // caixas de diálogo nativas
        ['alert', 'confirm', 'prompt'].forEach(n => {
            const orig = window[n];
            if (typeof orig !== 'function') return;
            window[n] = function (msg, ...r) { return orig.call(window, t(msg), ...r); };
        });
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
    }

    return {
        get atual() { return atual; },
        definir, adicionar, adicionarNos, adicionarTrechos, padrao, t, tr, definirCamada, distancia, peso,
        aplicar: aplicarTudo, traduzirTexto
    };
})();
