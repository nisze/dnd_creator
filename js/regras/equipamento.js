// Equipamento, proficiências de armas/armaduras e itens mágicos.
const lojaPorId = (id) => (db.lojaMap || (db.lojaMap = new Map(db.loja.map(i => [i.id, i])))).get(id);
// Efeitos numéricos de itens mágicos do DMG: só valem com o item em uso (e sintonizado, se exigir; máximo de 3 sintonias).
const EFEITOS_ITENS = {
    'ring-of-protection': { ca: 1, salva: 1 }, 'cloak-of-protection': { ca: 1, salva: 1 }, 'bracers-of-defense': { ca_sem_armadura: 2 }, 'staff-of-power': { ca: 2, salva: 2 }, 'luckstone': { salva: 1 },
    'amulet-of-health': { atributo: { Con: 19 } }, 'gauntlets-of-ogre-power': { atributo: { For: 19 } }, 'headband-of-intellect': { atributo: { Int: 19 } }, 'gloves-of-soul-catching': { atributo: { Con: 20 } },
    'belt-of-dwarvenkind': { atributo_soma: { Con: 2 }, limite: 20 }, 'boots-of-striding-and-springing': { velocidade_min: 30 },
    'belt-of-giant-strength': { variantes: [['Gigante da Colina', 21], ['Gigante de Pedra/Gelo', 23], ['Gigante de Fogo', 25], ['Gigante das Nuvens', 27], ['Gigante da Tempestade', 29]].map(([nome, v]) => ({ nome, atributo: { For: v } })) }
};
const MAX_SINTONIAS = 3;
const efeitoDoItem = (i) => { if (!i.efeito || (i.sint && !i.sintonizado)) return null; return i.efeito.variantes ? i.efeito.variantes[i.variante || 0] : i.efeito; };
const efeitosAtivos = () => (charState.inventario || []).map(efeitoDoItem).filter(Boolean);
const totalSintonizados = () => (charState.inventario || []).filter(i => i.sint && i.sintonizado).length;
const itemDeLoja = (l, extra) => ({ id: novoIdInv(), ref: l.id, cat: l.cat, nome: l.nome, nome_en: l.nome_en, qtd: 1, custo: 0, peso_lb: l.peso_lb, mec: l.mec || null, desc: l.desc_en || '', ...(l.cat === 'magico' ? { efeito: EFEITOS_ITENS[String(l.id).replace(/^magico-/, '')] || null, sint: !!l.sint, sintonizado: false } : {}), ...extra });

// Pacotes de equipamento (PHB): o inventário recebe o conteúdo, não o pacote. [qtd, id da loja] ou [qtd, nome, nome em inglês] para o que a loja não tem.
const PACOTES = {
    'pacote-burglar-s-pack': [[1, 'equipamento-backpack'], [1, 'equipamento-ball-bearings-bag-of-1-000'], [1, 'Barbante (3 m)', 'String (10 feet)'], [1, 'equipamento-bell'], [5, 'equipamento-candle'], [1, 'equipamento-crowbar'], [1, 'equipamento-hammer'], [10, 'equipamento-piton'], [1, 'equipamento-lantern-hooded'], [2, 'equipamento-oil-flask'], [5, 'equipamento-rations-1-day'], [1, 'equipamento-tinderbox'], [1, 'equipamento-waterskin'], [1, 'equipamento-rope']],
    'pacote-diplomat-s-pack': [[1, 'equipamento-chest'], [2, 'equipamento-case-map-scroll'], [1, 'equipamento-fine-clothes'], [1, 'equipamento-ink-1-oz'], [1, 'equipamento-ink-pen'], [1, 'equipamento-lamp'], [2, 'equipamento-oil-flask'], [5, 'equipamento-paper-1-sheet'], [1, 'equipamento-perfume-vial'], [1, 'equipamento-sealing-wax'], [1, 'Sabão', 'Soap']],
    'pacote-dungeoneer-s-pack': [[1, 'equipamento-backpack'], [1, 'equipamento-crowbar'], [1, 'equipamento-hammer'], [10, 'equipamento-piton'], [10, 'equipamento-torch'], [1, 'equipamento-tinderbox'], [10, 'equipamento-rations-1-day'], [1, 'equipamento-waterskin'], [1, 'equipamento-rope']],
    'pacote-entertainer-s-pack': [[1, 'equipamento-backpack'], [1, 'equipamento-bedroll'], [2, 'equipamento-costume'], [5, 'equipamento-candle'], [5, 'equipamento-rations-1-day'], [1, 'equipamento-waterskin'], [1, 'ferramenta-disguise-kit']],
    'pacote-explorer-s-pack': [[1, 'equipamento-backpack'], [1, 'equipamento-bedroll'], [1, 'equipamento-mess-kit'], [1, 'equipamento-tinderbox'], [10, 'equipamento-torch'], [10, 'equipamento-rations-1-day'], [1, 'equipamento-waterskin'], [1, 'equipamento-rope']],
    'pacote-priest-s-pack': [[1, 'equipamento-backpack'], [1, 'equipamento-blanket'], [10, 'equipamento-candle'], [1, 'equipamento-tinderbox'], [1, 'Caixa de esmolas', 'Alms box'], [2, 'Bloco de incenso', 'Block of incense'], [1, 'Incensário', 'Censer'], [1, 'Vestimentas', 'Vestments'], [2, 'equipamento-rations-1-day'], [1, 'equipamento-waterskin']],
    'pacote-scholar-s-pack': [[1, 'equipamento-backpack'], [1, 'equipamento-book'], [1, 'equipamento-ink-1-oz'], [1, 'equipamento-ink-pen'], [10, 'equipamento-parchment-1-sheet'], [1, 'Bolsinha de areia', 'Little bag of sand'], [1, 'Faca pequena', 'Small knife']],
    // Kits: o peso do kit é repartido entre as partes (4º valor: peso de cada uma, em libras).
    'equipamento-healer-s-kit': [[1, 'Bandagens', 'Bandages', 1], [1, 'Unguentos', 'Salves', 1], [1, 'Talas', 'Splints', 1]],
    'equipamento-climber-s-kit': [[1, 'Pitões especiais', 'Special pitons', 3], [1, 'Biqueiras de botas', 'Boot tips', 3], [1, 'Luvas de escalada', 'Climbing gloves', 3], [1, 'Arnês', 'Harness', 3]]
};
// Itens de texto do equipamento do antecedente que são kits da loja (entram desmembrados).
const KITS_TEXTO = [[/kit de curandeiro|healer'?s kit/i, 'equipamento-healer-s-kit'], [/kit de escalada|climber'?s kit/i, 'equipamento-climber-s-kit']];
// Itens do pacote `l` (vezes `vezes`), ou null se `l` não for um pacote. O preço pago, se houver, é repartido entre os itens da loja na proporção dos preços.
function itensDoPacote(l, extra, vezes, preco) {
    const comp = PACOTES[l.id]; if (!comp) return null;
    const itens = comp.map(c => {
        if (c.length === 2) { const li = lojaPorId(c[1]); return li ? itemDeLoja(li, { qtd: c[0] * (vezes || 1), ...extra }) : null; }
        return { id: novoIdInv(), cat: 'texto', nome: c[1], nome_en: c[2], qtd: c[0] * (vezes || 1), custo: 0, mec: null, desc: '', ...(c[3] ? { peso_lb: c[3] } : {}), ...extra };
    }).filter(Boolean);
    if (preco > 0) {
        const peso = itens.map(it => it.ref ? (lojaPorId(it.ref).custo_po || 0) * it.qtd : 0), total = peso.reduce((s, p) => s + p, 0);
        if (total > 0) {
            itens.forEach((it, k) => { it.custo = Math.round(preco * peso[k] / total * 100) / 100; });
            const k = peso.indexOf(Math.max(...peso)); itens[k].custo = Math.round((itens[k].custo + preco - itens.reduce((s, it) => s + it.custo, 0)) * 100) / 100;
        } else {
            itens.forEach(it => { it.custo = Math.round(preco / itens.length * 100) / 100; });
            itens[0].custo = Math.round((itens[0].custo + preco - itens.reduce((s, it) => s + it.custo, 0)) * 100) / 100;
        }
    }
    return itens;
}
// Soma na lista um item que já exista (mesma origem e mesmo item); senão acrescenta.
function juntarItem(lista, it) {
    const ja = lista.find(x => x.origem === it.origem && x.cat === it.cat && (it.ref ? x.ref === it.ref : x.nome === it.nome));
    if (ja) { ja.qtd += it.qtd; ja.custo = Math.round(((ja.custo || 0) + (it.custo || 0)) * 100) / 100; } else lista.push(it);
}

// Divide por vírgula/ponto e vírgula fora de parênteses.
function dividirFora(texto) {
    const out = []; let d = 0, cur = '';
    for (const ch of String(texto)) {
        if (ch === '(') d++; else if (ch === ')') d = Math.max(0, d - 1);
        if ((ch === ',' || ch === ';') && d === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim().replace(/^and\s+/i, '')).filter(Boolean);
}

// Itens de texto livre e moedas do antecedente (ex.: "...and a pouch containing 15 gp").
function equipDoAntecedente(a) {
    if (a && a.personalizado) { const s = escolhasResolvidas('antecedente').flatMap(({ res }) => res.selecionados).find(x => (x.node || x).equip_de); const n = s ? (s.node || s) : null; a = { equipamento_en: n ? (n.equip_en || n.descricao || '') : '', equipamento_pt: n && n.equip_en ? n.descricao : '' }; }
    const txt = String((a && a.equipamento_en) || '').replace(/Value:[^,;]*?Weight:\s*[\d.,]+\s*lbs?\.?/gi, '').replace(/Value:?\s*[\d.,]+\s*(gp|sp|cp|pp)?/gi, '');
    const valor = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 };
    let ouro = 0; const itens = [];
    dividirFora(txt).forEach(p => {
        const m = /(\d[\d,]*)\s*(gp|pp|sp|cp)\b/i.exec(p);
        if (/^lifestyle\b/i.test(p)) return;
        if (m && (/pouch|purse/i.test(p) || /^[\d,\s]*(gp|pp|sp|cp)\.?$/i.test(p))) { ouro += parseInt(m[1].replace(/,/g, ''), 10) * valor[m[2].toLowerCase()]; if (/pouch|purse/i.test(p)) itens.push('Pouch'); }
        else itens.push(p.charAt(0).toUpperCase() + p.slice(1));
    });
    // Nomes em português (equipamento_pt): só os rótulos; moedas e regras continuam vindo do texto em inglês.
    const itensPt = [];
    if (a && a.equipamento_pt) dividirFora(a.equipamento_pt).map(s => s.replace(/^e\s+/, '')).forEach(p => {
        const sep = /^(.+) e (.*(?:bolsa|saquinho).*)$/i.exec(p);
        (sep ? [sep[1], sep[2]] : [p]).forEach(q => {
            const m = /(\d[\d.,]*)\s*(po|pp|pc|pe|pl)\b/i.exec(q);
            if (/^estilo de vida\b/i.test(q)) return;
            if (m && (/bolsa|saquinho|bolsinha/i.test(q) || /^[\d.,\s]*(po|pp|pc|pe|pl)\.?$/i.test(q))) { if (/bolsa|saquinho|bolsinha/i.test(q)) itensPt.push('Bolsa'); }
            else itensPt.push(q.charAt(0).toUpperCase() + q.slice(1));
        });
    });
    return { ouro, itens: itensPt.length ? itensPt : itens, itensEn: itens };
}

function ouroBase() {
    const ei = charState.equipInicial, ant = equipDoAntecedente(charState.antecedente).ouro;
    // O ouro do antecedente fica com o personagem nos dois modos; no modo "Ouro inicial" soma-se ao ouro da classe.
    return ei.modo === 'ouro' ? (ei.ouro || 0) + ant : ant;
}
const gastoCompras = () => charState.inventario.filter(i => i.origem === 'compra').reduce((s, i) => s + i.custo, 0);
const saldo = () => Math.round((ouroBase() - gastoCompras()) * 100) / 100;
// A loja só existe no modo "Ouro inicial" (sem equipamento cadastrado para a classe não há o que escolher, então ela fica aberta).
const lojaAberta = () => charState.equipInicial.modo === 'ouro' || !(charState.classe && db.equipInicial && db.equipInicial[charState.classe.id]);
// Loja na ficha: o item é pago com as moedas da ficha (primeiro as menores; o troco volta em PO, PP e PC).
const VALOR_MOEDA_PC = { pc: 1, pp: 10, pe: 50, po: 100, pl: 1000 };
const moedasEmPC = (m) => Object.keys(VALOR_MOEDA_PC).reduce((s, k) => s + (m[k] || 0) * VALOR_MOEDA_PC[k], 0);
function pagarComMoedas(m, custoPO) {
    let resta = Math.round(custoPO * 100);
    if (resta > moedasEmPC(m)) return false;
    const ordem = Object.keys(VALOR_MOEDA_PC).sort((a, b) => VALOR_MOEDA_PC[a] - VALOR_MOEDA_PC[b]);
    ordem.forEach(k => { const usa = Math.min(m[k] || 0, Math.floor(resta / VALOR_MOEDA_PC[k])); m[k] = (m[k] || 0) - usa; resta -= usa * VALOR_MOEDA_PC[k]; });
    if (resta > 0) {
        const k = ordem.find(x => (m[x] || 0) > 0); m[k]--;
        let troco = VALOR_MOEDA_PC[k] - resta;
        ['po', 'pp', 'pc'].forEach(t => { const n = Math.floor(troco / VALOR_MOEDA_PC[t]); m[t] = (m[t] || 0) + n; troco -= n * VALOR_MOEDA_PC[t]; });
    }
    return true;
}
function compraNaFicha(l) {
    if (l.custo_po == null) return 'Este item não tem preço de tabela e não pode ser comprado.';
    if (!pagarComMoedas(garantirFolha().moedas, l.custo_po)) return 'Moedas insuficientes.';
    const pacote = itensDoPacote(l, { origem: 'ficha' });
    if (pacote) { pacote.forEach(it => juntarItem(charState.inventario, it)); return null; }
    const ja = charState.inventario.find(i => i.ref === l.id && i.origem === 'ficha');
    if (ja) ja.qtd++; else charState.inventario.push(itemDeLoja(l, { origem: 'ficha', ...(l.ua ? { ua: true } : {}) }));
    return null;
}
// Trocar para o equipamento da classe devolve as compras feitas com o ouro; devolve quantos itens saíram.
function equipamentoModoDefinir(m) {
    const ei = charState.equipInicial; let removidos = 0;
    if (m === 'equipamento') { removidos = charState.inventario.filter(i => i.origem === 'compra').length; charState.inventario = charState.inventario.filter(i => i.origem !== 'compra'); }
    ei.modo = m; return removidos;
}

// Proficiências em armas/armaduras: texto da classe (wiki) + o que raça, subclasse e talentos concedem.
function proficienciasEquip() {
    const eq = (charState.classe && charState.classe.equip) || {};
    const base = semAcento([eq.armaduras_en, eq.armas_en].filter(Boolean).join(' , ').replace(/[’`]/g, "'"));
    const extras = [];
    // Classes adicionais dão só as proficiências de multiclasse (PHB p. 164), não as do 1º nível.
    todasClasses().filter(c => c.idx > 0).forEach(c => { const p = proficienciasDeMulticlasse(c.classe.id); if (p) p.armaduras.concat(p.armas).forEach(t => extras.push(semAcento(t))); });
    const visita = (n) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(visita); if (foraDoNivel(n) || temEscolha(n)) return; const d = String(n.descrição || n.Descrição || n.descricao || ''); if (/profici|proficien/i.test(d)) extras.push(semAcento(d)); visita(n.conteudo); };
    ['raca', 'classe'].forEach(cat => nodesAtivos(cat).forEach(visita));
    ['raca', 'classe', 'antecedente'].forEach(cat => escolhasResolvidas(cat).forEach(({ res }) => res.selecionados.forEach(s => { if (res.nodeOrigem.proficiencia_equip) extras.push(semAcento(s.nome)); visita(s.node || s); })));
    const t = base + ' | ' + extras.join(' | ');
    const lista = base.split(/,|\band\b/).map(s => s.trim()).filter(Boolean);
    return {
        texto: t, lista,
        simples: /simple weapons|armas simples/.test(t), marcial: /martial weapons|armas marciais/.test(t),
        leve: /light armor|all armor|armaduras? leves?/.test(t), media: /medium armor|all armor|armaduras? medias?/.test(t), pesada: /heavy armor|all armor|armaduras? pesadas?/.test(t), escudo: /shields?|escudos?/.test(t)
    };
}
function proficienteEquip(it, P) {
    const m = it && it.mec; if (!m) return true;
    if (m.tipo) return m.tipo === 'escudo' ? P.escudo : !!P[m.tipo];
    if (m.categoria === 'simples' && P.simples) return true;
    if (m.categoria === 'marcial' && P.marcial) return true;
    const chaves = [it.nome_en.toLowerCase()].concat(it.nome_en.includes(',') ? [it.nome_en.split(',').reverse().map(s => s.trim().toLowerCase()).join(' ')] : []);
    const nomesLista = P.lista.map(semPlural);
    if (chaves.some(k => nomesLista.includes(semPlural(k)))) return true;
    const txt = ' ' + semPlural(P.texto) + ' ';
    return txt.includes(' ' + semPlural(it.nome) + ' ');
}

// Opções de um item que exige escolha (arma livre, foco, instrumento...).
function opcoesPick(it) {
    if (it.tipo === 'arma-livre') return db.loja.filter(i => i.cat === 'arma' && !i.mec.arma_de_fogo && i.mec.categoria === it.cat && (!it.alcance || i.mec.alcance === it.alcance));
    const f = it.filtro || {};
    return db.loja.filter(i => i.cat === f.cat && (!f.grupo || i.grupo === f.grupo) && (!f.grupo_re || new RegExp(f.grupo_re, 'i').test(i.grupo)));
}

function itensDaOpcao(op) { return op.itens.map((it, ii) => ({ it, ii })); }
function opcaoLiberada(op, P) {
    if (!op.requer_proficiencia) return true;
    return op.itens.every(it => { const l = it.ref ? lojaPorId(it.ref) : null; return !l || proficienteEquip(l, P); });
}

