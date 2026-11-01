// Atributos finais e compra de pontos.
function calcPointBuy() {
    const isFree = document.getElementById('free-dist').checked; let totalCost = 0; const costs = {8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9};
    ATTR_NAMES.forEach(nomeExtenso => {
        const key = ATTR_MAP_KEY[nomeExtenso];
        const val = parseInt(document.getElementById(`attr-${key}`).value) || 8;
        charState.atributosBase[key] = val;
        let cost = (!isFree && val>=8 && val<=15) ? costs[val] : 0;
        document.getElementById(`cost-${key}`).innerText = isFree ? '-' : cost; totalCost += cost;
    });
    document.getElementById('pontos-restantes').innerText = isFree ? "∞" : 27 - totalCost;
}

// ==========================================
// MOTOR DE CÁLCULO E RENDERIZAÇÃO DA FICHA
// ==========================================
function calcularAtributosFinais() { return semMagias(calcularAtributosFinaisBase); }

// Bônus racial livre (Tasha, origem personalizada): +2 em um atributo e +1 em outro, ou +1 em três atributos diferentes.
function bonusRacialDistribuicao() { return Object.values(charState.bonusRacial || {}).sort((a, b) => b - a).join(','); }
function bonusRacialCompleto() { const d = bonusRacialDistribuicao(); return d === '2,1' || d === '1,1,1'; }
function alternarBonusRacial(k, valor) {
    const b = { ...(charState.bonusRacial || {}) };
    if (b[k] === valor) delete b[k];
    else {
        b[k] = valor;
        const outros = Object.keys(b).filter(x => x !== k);
        if (valor === 2) outros.filter(x => b[x] === 2).forEach(x => delete b[x]);
        const uns = outros.filter(x => b[x] === 1);
        if (Object.values(b).includes(2)) uns.slice(valor === 1 ? 0 : 1).forEach(x => delete b[x]);
        else if (uns.length > 2) delete b[uns[0]];
    }
    charState.bonusRacial = b;
}
function calcularAtributosFinaisBase() {
    let finais = { ...charState.atributosBase };
    const ehNoASI = ehNoASIRacial;
    const substituido = racaSubstituiASI();
    const personalizada = racaPersonalizada();
    const mapaNomes = { "Força": "For", "Destreza": "Des", "Constituição": "Con", "Inteligência": "Int", "Sabedoria": "Sab", "Carisma": "Car" };
    
    const aplicarBonus = (texto) => {
        const t = texto || "";
        if (/\+1 em todos/i.test(t)) {
            Object.values(mapaNomes).forEach(key => finais[key] += 1);
            return;
        }
        // Cada atributo recebe o valor que vem logo depois do seu nome (ex.: "Força +2, Carisma +1").
        Object.keys(mapaNomes).forEach(nome => {
            const m = t.match(new RegExp(nome + '\\s*\\+(\\d)', 'i'));
            if (m) finais[mapaNomes[nome]] += parseInt(m[1]);
        });
    };

    const processarNodeParaAtributos = (node, daRaca) => {
        if(!node) return;
        if(Array.isArray(node)) {
            node.forEach(n => processarNodeParaAtributos(n, daRaca));
            return;
        }
        if (temEscolha(node)) return;
        if (personalizada && daRaca && ehNoASI(node)) return;
        if (node.bonus_atributo) finais[node.bonus_atributo] += 1;
        let nNome = node.nome || node.Nome || "";
        if (nNome.includes("Aumento no Valor de Habilidade") || nNome.includes("Aumento de Habilidade")) {
            aplicarBonus(node.descrição || node.Descrição);
        }
        if (node.conteudo) {
            processarNodeParaAtributos(node.conteudo, daRaca);
        }
    };

    if(charState.raca && charState.raca.conteudo) {
        processarNodeParaAtributos(semBasesSubstituidas(charState.raca.conteudo).filter(n => !(substituido && ehNoASI(n))), true);
    }
    if (personalizada) Object.entries(charState.bonusRacial || {}).forEach(([k, v]) => { if (k in finais) finais[k] += v; });
    
    ['raca', 'classe', 'antecedente'].forEach(cat => escolhasResolvidas(cat).forEach(({ res }) => {
        const daRaca = cat === 'raca';
        if (daRaca && personalizada && ehNoASI(res.nodeOrigem)) return;
        if (substituido && charState.raca.conteudo.includes(res.nodeOrigem) && ehNoASI(res.nodeOrigem)) return;
        res.selecionados.forEach(sel => {
            if (sel.asi) { Object.entries(sel.asi).forEach(([k, v]) => { finais[k] += v; }); return; }
            if (sel.node && sel.node.conteudo) {
                processarNodeParaAtributos(sel.node.conteudo, daRaca);
            } else if (sel.conteudo) {
                processarNodeParaAtributos(sel.conteudo, daRaca);
            }
            
            let selNome = sel.nome || sel.Nome || sel.texto || "";
            if(["Força","Destreza","Constituição","Inteligência","Sabedoria","Carisma"].includes(selNome) && !(res.nodeOrigem.concede_salvaguarda && !res.nodeOrigem.com_aumento)) {
                const bonus = parseInt((String(res.nodeOrigem.descrição || res.nodeOrigem.Descrição || '').match(/\+(\d)/) || [])[1]) || 1;
                finais[mapaNomes[selNome]] += bonus; 
            }
        });
    }));

    Object.keys(finais).forEach(k => { finais[k] = Math.min(20, finais[k]); });
    // Itens que fixam ou somam atributos (Cinto de Gigante, Manoplas de Ogro...) valem depois do limite de 20.
    efeitosAtivos().forEach(e => {
        if (e.atributo) Object.entries(e.atributo).forEach(([k, v]) => { if (finais[k] < v) finais[k] = v; });
        if (e.atributo_soma) Object.entries(e.atributo_soma).forEach(([k, v]) => { finais[k] = Math.min(e.limite || 30, finais[k] + v); });
    });
    return finais;
}

