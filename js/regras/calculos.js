// Motor de cálculo: tudo que é derivado do personagem (sem DOM). Cada bônus registra a origem.
const bonusProficiencia = (nivel) => Math.ceil(nivel / 4) + 1;
const pvFixoDoDado = (dado) => Math.floor(dado / 2) + 1;

// Dado de vida da classe atual (1d8 -> 8); null se a classe não declara.
function dadoDeVidaDaClasse(classe) {
    const no = classe && classe.conteudo.find(c => (c.nome || c.Nome) && (c.nome || c.Nome).includes('Dado de Vida'));
    const m = no && (no.nome || no.Nome).match(/1d(\d+)/);
    return m ? parseInt(m[1], 10) : null;
}

// Pontos de vida máximos pela regra oficial: nível 1 = dado máximo; depois, valor fixo (média arredondada para cima) ou rolagem registrada em
// charState.pvNiveis[nivel - 1] = { dado, metodo: 'fixo' | 'rolado', valor }. Soma Con e bônus por nível (Robusto, Anão da Colina, Dracônico); mínimo 1 por nível.
function calcularPV(modCon, nivel, ativos) {
    const dadoClasse = dadoDeVidaDaClasse(charState.classe);
    if (!dadoClasse) return { maximo: 0, niveis: [], bonusPorNivel: 0, origem: [] };
    const bonus = [];
    if (temAtivo(ativos, 'tenacidade ana') || temAtivo(ativos, 'dwarven toughness')) bonus.push({ fonte: 'Tenacidade Anã', valor: 1 });
    if (temAtivo(ativos, 'resiliencia draconica') || temAtivo(ativos, 'draconic resilience')) bonus.push({ fonte: 'Resiliência Dracônica', valor: 1 });
    if (talentosEscolhidos().includes('robusto')) bonus.push({ fonte: 'Talento Robusto', valor: 2 });
    const bonusPorNivel = bonus.reduce((s, b) => s + b.valor, 0);
    const niveis = []; let maximo = 0;
    for (let n = 1; n <= nivel; n++) {
        const reg = (charState.pvNiveis || [])[n - 1] || {};
        const dado = reg.dado || dadoClasse;
        const metodo = n === 1 ? 'maximo' : (reg.metodo === 'rolado' ? 'rolado' : 'fixo');
        const base = n === 1 ? dado : (metodo === 'rolado' ? Math.min(dado, Math.max(1, reg.valor || 1)) : pvFixoDoDado(dado));
        const ganho = Math.max(1, base + modCon + bonusPorNivel);
        niveis.push({ nivel: n, dado, metodo, base, ganho }); maximo += ganho;
    }
    return { maximo, niveis, bonusPorNivel, origem: bonus };
}

// Classe de Armadura com a origem de cada parte. `bonus` lista só o que vem além do cálculo base.
function calcularCA(mods, ctx) {
    const { ativos, estilos, corpo, temEscudo, escudoSolto, bonusEscudo, nomeClasse } = ctx;
    let base = 10 + mods.Des, metodo = 'Sem armadura: 10 + Des';
    // Defesa sem Armadura (Bárbaro ou Monge; em multiclasse vale a melhor, nunca somam).
    if (nomeClasse.includes('Bárbaro')) { base = 10 + mods.Des + mods.Con; metodo = 'Defesa sem Armadura do Bárbaro: 10 + Des + Con'; }
    if (nomeClasse.includes('Monge') && 10 + mods.Des + mods.Sab > base) { base = 10 + mods.Des + mods.Sab; metodo = 'Defesa sem Armadura do Monge: 10 + Des + Sab'; }
    if (temAtivo(ativos, 'resiliencia draconica') || temAtivo(ativos, 'draconic resilience')) { if (13 + mods.Des > base) { base = 13 + mods.Des; metodo = 'Resiliência Dracônica: 13 + Des'; } }
    if (!corpo && temEscudo && nomeClasse.includes('Monge')) { base = 10 + mods.Des; metodo = 'Sem armadura: 10 + Des (o escudo anula a Defesa sem Armadura do Monge)'; }
    const bonus = [];
    let final = base;
    if (corpo) { final = corpo.ca; metodo = `${nomeItem(corpo.inv)}: ${corpo.inv.mec.ca}${corpo.inv.mec.dex === 'full' ? ' + Des' : corpo.inv.mec.dex === 'max2' ? ' + Des (máx. 2)' : ''}${corpo.inv.bonus_magico ? ' + ' + corpo.inv.bonus_magico + ' mágico' : ''}`; }
    const soma = (fonte, valor) => { if (!valor) return; bonus.push({ fonte, valor }); final += valor; };
    if (temEscudo) soma('Escudo' + (bonusEscudo ? ' +' + bonusEscudo + ' mágico' : ''), 2 + bonusEscudo);
    efeitosAtivos().forEach(e => { if (e.ca) soma('Item mágico', e.ca); if (e.ca_sem_armadura && !corpo && !temEscudo) soma('Item mágico (sem armadura e sem escudo)', e.ca_sem_armadura); });
    if (corpo && estilos.has('defense')) soma('Estilo de Luta: Defesa', 1);
    const marinheiro = estilos.has('mariner') && !(corpo && corpo.inv.mec.tipo === 'pesada') && !temEscudo;
    if (marinheiro) soma('Estilo de Luta: Marinheiro', 1);
    return { base, metodo, bonus, final, marinheiro, comArmadura: !!corpo, comEscudo: !!temEscudo, escudoExtra: escudoSolto ? { valor: escudoSolto.valor, final: final + escudoSolto.valor, armas: escudoSolto.armas } : null };
}

// Deslocamento em pés, com a origem de cada alteração.
function calcularDeslocamento(atributos, ctx) {
    const { ativos, corpo, temEscudo } = ctx;
    const descRaca = (n) => String(n.descrição || n.Descrição || n.descricao || '');
    const deslNode = semBasesSubstituidas(charState.raca.conteudo).find(c => (c.nome || c.Nome) === 'Deslocamento') || nodesAtivos('raca').find(c => (c.nome || c.Nome) === 'Deslocamento');
    let pes = 30, semPenalidadeArmadura = false; const origem = [];
    if (deslNode) {
        const m = descRaca(deslNode).match(/(\d+(?:,\d+)?)\s*metros/);
        if (m) pes = Math.round(parseFloat(m[1].replace(',', '.')) / 0.3);
        semPenalidadeArmadura = /n[aã]o [eé] reduzid[ao] pelo uso de armadura pesada|not reduced by wearing heavy armor/i.test(descRaca(deslNode));
    }
    origem.push({ fonte: 'Raça (base)', valor: pes });
    nodesAtivos('raca').forEach(n => {
        const t = descRaca(n); let m;
        if ((m = /base walking speed (?:increases to|is) (\d+) feet/i.exec(t)) || (m = /deslocamento base aumenta para [\d,]+ metros \((\d+) p[eé]s\)/i.exec(t))) { const v = parseInt(m[1], 10); if (v > pes) { pes = v; origem.push({ fonte: n.nome || n.Nome, valor: v, tipo: 'novo base' }); } }
    });
    const soma = (fonte, v) => { if (!v) return; pes += v; origem.push({ fonte, valor: v }); };
    if (temAtivo(ativos, 'fast movement') && !(corpo && corpo.inv.mec.tipo === 'pesada')) soma('Movimento Rápido', 10);
    if (temAtivo(ativos, 'unarmored movement') && !corpo && !temEscudo) { const n = nivelDaClasse('monk'); soma('Movimento sem Armadura', n >= 18 ? 30 : n >= 14 ? 25 : n >= 10 ? 20 : n >= 6 ? 15 : n >= 2 ? 10 : 0); }
    if (temAtivo(ativos, 'superior mobility')) soma('Mobilidade Superior', 10);
    const errante = todasClasses().some(c => /^ranger/.test(c.classe.id) && c.nivel >= 6) && temAtivo(ativos, 'deft explorer');
    if (errante) soma('Explorador Hábil: Errante', 5);
    efeitosAtivos().forEach(e => { if (e.velocidade_min && pes < e.velocidade_min) { origem.push({ fonte: 'Item mágico', valor: e.velocidade_min - pes }); pes = e.velocidade_min; } });
    if (talentosEscolhidos().some(t => t === 'mobile' || t === 'mobilidade')) soma('Talento Mobilidade', 10);
    if (corpo && corpo.inv.mec.forca && atributos.For < corpo.inv.mec.forca && !semPenalidadeArmadura) soma('Armadura pesada sem a Força exigida', -10);
    return { pes, metros: String(+(pes * 0.3).toFixed(2)).replace('.', ','), origem, errante, deslNode, descRaca };
}

// Resultado completo usado pela ficha (o que for derivado nasce aqui e só aqui).
function calcularPersonagem() {
    const atributos = calcularAtributosFinais();
    const mods = { For: getMod(atributos.For), Des: getMod(atributos.Des), Con: getMod(atributos.Con), Int: getMod(atributos.Int), Sab: getMod(atributos.Sab), Car: getMod(atributos.Car) };
    const nivel = nivelTotal(), profBonus = bonusProficiencia(nivel);
    const periciasTreinadas = extrairProficiencias(), especializadas = extrairEspecializacoes();
    const ativos = nomesAtivos();
    const salvaguardas = [...salvaguardasProficientes()];
    const nomeClasse = todasClasses().map(c => c.classe.nome || c.classe.Nome).join(' / ');
    const pv = calcularPV(mods.Con, nivel, ativos);

    const profEq = proficienciasEquip();
    const avisosEquip = [];
    let corpo = null, temEscudo = false, bonusEscudo = 0;
    charState.inventario.forEach(inv => {
        const m = inv.mec; if (!m || !m.tipo) return;
        if (m.tipo === 'escudo') { temEscudo = true; bonusEscudo = Math.max(bonusEscudo, inv.bonus_magico || 0); if (!proficienteEquip(inv, profEq)) avisosEquip.push(`${nomeItem(inv)}: sem proficiência (desvantagem em testes de For/Des, ataques e salvaguardas; não conjura magias).`); return; }
        const modDex = m.dex === 'full' ? mods.Des : m.dex === 'max2' ? Math.min(2, mods.Des) : 0;
        if (!corpo || m.ca + modDex + (inv.bonus_magico || 0) > corpo.ca) corpo = { ca: m.ca + modDex + (inv.bonus_magico || 0), inv };
    });
    if (corpo) {
        const m = corpo.inv.mec;
        if (!proficienteEquip(corpo.inv, profEq)) avisosEquip.push(`${nomeItem(corpo.inv)}: sem proficiência (desvantagem em testes de For/Des, ataques e salvaguardas; não conjura magias).`);
        if (m.forca && atributos.For < m.forca) avisosEquip.push(`${nomeItem(corpo.inv)}: exige For ${m.forca} (deslocamento reduzido em 3 m).`);
        if (m.furtividade_desv) avisosEquip.push(`${nomeItem(corpo.inv)}: desvantagem em testes de Furtividade.`);
    }
    const bonusSalva = efeitosAtivos().reduce((s, e) => s + (e.salva || 0), 0);
    if (totalSintonizados() > MAX_SINTONIAS) avisosEquip.push(`Sintonia: ${totalSintonizados()} itens sintonizados (máximo ${MAX_SINTONIAS}).`);
    charState.inventario.filter(i => i.sint && !i.sintonizado && i.efeito).forEach(i => avisosEquip.push(`${nomeItem(i)}: exige sintonização (marque "sintonizado" no inventário) para valer na ficha.`));
    const estilos = new Set(escolhasResolvidas('classe').flatMap(({ res }) => res.selecionados.map(s => semAcento((s.node || s).nome_ingles || ''))));
    // Escudo e arma empunhada com as duas mãos não se usam juntos (duas mãos, ou versátil, que o jogador pode empunhar com as duas): o escudo só dá o bônus se ele largar a arma ou usar só uma mão.
    const en = typeof Idioma !== 'undefined' && Idioma.atual === 'en';
    const duasMaos = charState.inventario.filter(i => (i.qtd || 0) > 0 && i.mec && i.mec.categoria && (i.mec.duas_maos || i.mec.versatil));
    const escudoSolto = temEscudo && duasMaos.length ? { valor: 2 + bonusEscudo, armas: duasMaos.map(i => nomeItem(i) + (i.mec.duas_maos ? '' : ` (${en ? 'versatile' : 'versátil'})`)) } : null;
    if (escudoSolto) avisosEquip.push(`Escudo: não vale junto de ${escudoSolto.armas.join(', ')} empunhada com as duas mãos. A CA mostrada não conta o escudo: ele dá +${escudoSolto.valor} se for empunhado sem usar a arma com as duas mãos.`);
    const ctx = { ativos, estilos, corpo, temEscudo: temEscudo && !escudoSolto, escudoSolto, bonusEscudo, nomeClasse };
    const ca = calcularCA(mods, ctx);

    const ataques = charState.inventario.filter(i => i.mec && i.mec.categoria).map(i => {
        const m = i.mec; const usaDes = m.alcance === 'distancia' || (m.finesse && mods.Des > mods.For);
        const mod = usaDes ? mods.Des : mods.For; const prof = proficienteEquip(i, profEq);
        const bonusEstilo = m.alcance === 'distancia' && estilos.has('archery') ? 2 : 0;
        const bonusMag = i.bonus_magico || 0;
        const bonusCQS = m.alcance === 'distancia' && estilos.has('close quarters shooter') ? 1 : 0;
        const danoMod = mod + bonusMag + (m.alcance === 'corpo' && !m.duas_maos && estilos.has('dueling') ? 2 : 0);
        if (!prof) avisosEquip.push(`${nomeItem(i)}: sem proficiência (sem bônus de proficiência no ataque).`);
        let dano = m.dano ? `${m.dano}${danoMod ? formatMod(danoMod) : ''} ${({ cortante: 'cort.', perfurante: 'perf.', contundente: 'cont.' })[m.tipo_dano] || m.tipo_dano || ''}${m.versatil ? ' (' + m.versatil + ')' : ''}`.trim() : (m.dano_en || '-');
        if (m.arremesso && m.dano && estilos.has('thrown weapon fighting')) dano += ` (arremessada: ${m.dano}${formatMod(danoMod + 2)})`;
        return { nome: (i.apelido || i.nome) + (bonusMag ? ' +' + bonusMag : ''), bonus: mod + bonusMag + bonusEstilo + bonusCQS + (prof ? profBonus : 0), dano, props: m.propriedades || [], semProf: !prof };
    });
    { const luta = estilos.has('unarmed fighting'); ataques.push({ nome: 'Ataque desarmado', bonus: mods.For + profBonus, dano: luta ? `1d6${formatMod(mods.For)} cont. (1d8 sem armas/escudo)` : `${Math.max(1, 1 + mods.For)} cont.` }); }

    const desl = calcularDeslocamento(atributos, ctx);

    // Faz-Tudo (metade da proficiência, para baixo) e Atleta Notável (metade, para cima, só For/Des/Con) em testes sem proficiência.
    const jack = temAtivo(ativos, 'jack of all trades'), atleta = temAtivo(ativos, 'remarkable athlete');
    const bonusMeio = (attr) => { let b = jack ? Math.floor(profBonus / 2) : 0; if (atleta && ['For', 'Des', 'Con'].includes(attr)) b = Math.max(b, Math.ceil(profBonus / 2)); return b; };

    return {
        nivel, profBonus, atributos, mods, ativos, estilos, nomeClasse, classes: todasClasses().map(c => ({ idx: c.idx, id: c.classe.id, nome: c.classe.nome || c.classe.Nome, nivel: c.nivel })), periciasTreinadas, especializadas, salvaguardas, bonusSalva,
        pv, maxPV: pv.maximo, ca, caFinal: ca.final, ataques, avisosEquip, bonusMeio,
        desl, pes: desl.pes, deslBase: desl.metros, marinheiroAtivo: ca.marinheiro, errante: desl.errante, deslNode: desl.deslNode, descRaca: desl.descRaca,
        iniciativa: mods.Des + bonusMeio('Des') + (talentosEscolhidos().some(t => t === 'alert' || t === 'alerta') ? 5 : 0)
            + (temAtivo(ativos, 'dread ambusher') ? mods.Sab : 0) + (temAtivo(ativos, 'rakish audacity') ? mods.Car : 0) + (temAtivo(ativos, 'tactical wit') ? mods.Int : 0)
    };
}
