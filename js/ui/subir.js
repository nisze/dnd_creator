// Subir de nível (assistente): escolher a classe (a atual ou uma nova, em multiclasse), ver o que o nível traz, decidir as escolhas pendentes e confirmar.
// O nível é aplicado ao vivo em charState com um instantâneo; cancelar volta ao que era. Nada é gravado até confirmar (nem o rascunho).
function _subirEstado() { return ui.subir || (ui.subir = { sub: null, liberar: false, vistas: new Set() }); }
const _numBR = (n) => Number(n).toLocaleString('pt-BR');

// Dica de XP para a ficha e para o assistente (null quando o campo está vazio ou não tem número).
function infoXP() {
    const x = xpNumero(garantirFolha().xp); if (x === null) return null;
    const atual = nivelTotal(), sugerido = nivelPorXP(x);
    return { xp: x, sugerido, atual, pode: sugerido > atual && atual < 20, falta: atual < 20 ? Math.max(0, xpDoNivel(atual + 1) - x) : 0 };
}
function htmlDicaXP() {
    const i = infoXP(); if (!i) return '';
    if (i.pode) return `Com ${_numBR(i.xp)} XP o personagem já alcança o nível ${i.sugerido} (hoje está no ${i.atual}).`;
    return i.atual < 20 ? `${_numBR(i.xp)} XP: faltam ${_numBR(i.falta)} para o nível ${i.atual + 1}.` : '';
}

const _textoEspacos = (l) => l.length ? l.map(e => `${e.nivel}º${e.pacto ? ' (pacto)' : ''}: ${e.total}`).join(' · ') : 'nenhum';

function _htmlSubirEscolha(st) {
    const r = classesParaSubir(st.liberar), dica = htmlDicaXP();
    if (r.cheio) return `<h2>Subir de nível</h2><div class="aviso info"><b>Nível máximo</b>O personagem já está no nível 20.</div><button type="button" class="sec" onclick="UI.subirCancelar()">Voltar à ficha</button>`;
    const atuais = r.atuais.map(c => { const sc = nomeDaSubclasse(c.idx); return `<button type="button" class="sub-cartao" onclick="UI.subirEscolher(${c.idx})"><b>${esc(nomeCurtoDaClasse(c.classe))}</b><span>nível ${c.nivel} para ${c.nivel + 1}${sc ? ' · ' + esc(sc) : ''}</span></button>`; }).join('');
    const novas = r.novas.map(n => { const bl = n.bloqueios.length > 0; return `<button type="button" class="sub-cartao ${bl ? 'sub-bloq' : ''}" ${bl ? 'disabled' : ''} onclick="UI.subirEscolherNova('${esc(n.classe.id)}')"><b>${esc(nomeCurtoDaClasse(n.classe))}${etiquetas(n.classe)}</b><span>${n.requisito ? 'exige ' + esc(n.requisito) : 'sem regra oficial de multiclasse'}</span>${bl ? `<em>${esc(n.bloqueios.join(' '))}</em>` : ''}</button>`; }).join('');
    const liberar = r.novas.some(n => n.semRegra) ? `<label class="sub-liberar"><input type="checkbox" ${st.liberar ? 'checked' : ''} onchange="UI.subirLiberar(this.checked)"> Liberar classes sem regra oficial de multiclasse (UA e terceiros), por minha conta</label>` : '';
    return `<h2>Subir de nível</h2>
        <p class="meta">${esc(charState.nomePersonagem || 'Personagem')}: ${esc(textoDasClasses(true))} (nível total ${nivelTotal()}).${dica ? ' ' + esc(dica) : ''}</p>
        <div class="bloco"><h3>Continuar numa classe que você já tem</h3><div class="sub-cartoes">${atuais}</div></div>
        <div class="bloco"><h3>Entrar numa classe nova (multiclasse)</h3>
            <p class="desc">Decisão sua: ao subir de nível o jogador pode seguir na mesma classe ou começar outra. É preciso ter 13 no atributo principal da classe nova e de todas as classes atuais.</p>
            <div class="sub-cartoes">${novas}</div>${liberar}
            <details class="sub-regras"><summary>Regras de multiclasse</summary><ul>
                <li>Pré-requisito: 13 no atributo da classe nova e de cada classe que você já tem.</li>
                <li>Você ganha só parte das proficiências da classe nova (aparecem ao escolhê-la), sem equipamento inicial e sem as salvaguardas dela.</li>
                <li>O bônus de proficiência segue o nível total. Os pontos de vida usam o dado da classe em que o nível foi ganho (valor fixo).</li>
                <li>Espaços de magia: soma dos níveis de conjurador (completo: nível inteiro; meio: metade, arredondada para baixo, e o Artífice para cima; terço: um terço). Os espaços do Bruxo (Magia de Pacto) ficam separados.</li>
                <li>Ataque Extra não se acumula entre classes, e só uma Defesa sem Armadura vale por vez.</li></ul></details>
        </div>
        <div class="sub-rodape"><button type="button" class="sec" onclick="UI.subirCancelar()">Voltar à ficha</button></div>`;
}

function _htmlSubirDetalhe(st) {
    const sub = st.sub;
    const sl = _slotClasse(sub.idx), nomeCl = nomeCurtoDaClasse(sl.classe), calc = calcularPersonagem();
    const reg = calc.pv.niveis[nivelTotal() - 1];
    const titulo = sub.nova ? `Nova classe: ${nomeCl}` : `${nomeCl}: nível ${sl.nivel - 1} para ${sl.nivel}`;
    // Pontos de vida (sempre o valor fixo do dado)
    const bonusPv = calc.pv.bonusPorNivel ? ` + ${calc.pv.bonusPorNivel} (bônus por nível)` : '';
    const pv = reg ? `<div class="bloco"><h3>Pontos de vida: +${reg.ganho}</h3><p>Dado de vida d${reg.dado}, valor fixo ${reg.base}${reg.metodo === 'maximo' ? ' (dado cheio)' : ''} + Constituição ${formatMod(calc.mods.Con)}${bonusPv}. PV máximos: ${st.pvAntes} para <b>${calc.maxPV}</b>.</p></div>` : '';
    const prof = calc.profBonus !== st.bonusAntes ? `<p>Bônus de proficiência: ${formatMod(st.bonusAntes)} para <b>${formatMod(calc.profBonus)}</b>.</p>` : '';
    // Proficiências ao entrar numa classe nova
    let entrada = '';
    if (sub.nova) {
        const p = proficienciasDeMulticlasse(sl.classe.id) || { armaduras: [], armas: [], ferramentas: [], pericia: null };
        const itens = [['Armaduras', p.armaduras], ['Armas', p.armas], ['Ferramentas', p.ferramentas]].filter(([, l]) => l.length).map(([r, l]) => `<li><b>${r}:</b> ${esc(l.join(', '))}</li>`);
        if (p.pericia) itens.push(`<li><b>Perícia:</b> 1 ${p.pericia.lista ? 'da lista da classe' : 'à sua escolha'} (escolha abaixo)</li>`);
        entrada = `<div class="bloco"><h3>O que a multiclasse concede</h3>${itens.length ? `<ul class="detalhe-lista">${itens.join('')}</ul>` : '<p>Nenhuma proficiência nova.</p>'}<p class="meta">Sem equipamento inicial e sem as salvaguardas dessa classe.</p>${p.conferir ? '<div class="aviso info"><b>Confira no livro</b>As proficiências de multiclasse do Artífice (Tasha) devem ser conferidas com o mestre ou no livro.</div>' : ''}</div>`;
    }
    // Magias: espaços, troca
    const esp = espacosDeMagia(), espMudou = _textoEspacos(esp) !== _textoEspacos(st.espacosAntes);
    const espacos = !espMudou ? '' : st.espacosAntes.length
        ? `<p>Espaços de magia: ${esc(_textoEspacos(st.espacosAntes))} para <b>${esc(_textoEspacos(esp))}</b>.</p>`
        : `<p>Espaços de magia: <b>${esc(_textoEspacos(esp))}</b> (novos).</p>`;
    const troca = sub.nova ? [] : magiasTrocaveis(sub.idx, sub);
    const trocaHtml = sub.trocou ? `<div class="aviso info"><b>Magia trocada</b>Você esqueceu ${esc(nomeMagiaTxt(sub.trocou.de))}: escolha a nova magia conhecida abaixo.</div>`
        : (troca.length ? `<details class="bloco sub-troca"><summary>Trocar uma magia conhecida</summary><p class="desc">Ao subir de nível você pode trocar uma magia conhecida por outra da lista da classe (uma por nível).</p><div class="sub-troca-lista">${troca.map(x => `<button type="button" class="sec mini" onclick="UI.subirTrocar(${x.i})">Esquecer ${esc(nomeMagiaTxt(x.nome))}</button>`).join('')}</div></details>` : '');
    // O que o nível traz
    const nov = novidadesDoNivel(sub.idx);
    const novHtml = `<div class="bloco"><h3>O que este nível traz</h3>${nov.length ? nov.map(n => `<details class="sub-nov"><summary>${esc(n.nome)}${n.origem !== 'Classe' ? `<span class="tag fonte">${esc(n.origem)}</span>` : ''}</summary>${n.texto ? `<p>${paragrafos(n.texto)}</p>` : ''}</details>`).join('') : '<p class="vazio">Nenhuma característica fixa neste nível (veja as escolhas abaixo, se houver).</p>'}</div>`;
    // Escolhas (as que faltam e as que já foram vistas neste nível)
    const pend = escolhasPendentes('classe'); pend.forEach(p => st.vistas.add(p.c.id));
    const lista = getActiveChoices(charState.classe, nomeDe(charState.classe), 'classe').filter(c => st.vistas.has(c.id) && !(ehGrupoOutrasFontes(c.node) && !selecaoDe('classe', c.id).length && !opcoesDaEscolha('classe', c, c.id).opcoes.length));
    const escolhas = lista.length ? `<h3 class="sub-tit">Escolhas deste nível</h3>${lista.map(c => htmlEscolha('classe', c)).join('')}` : '';
    const tasha = htmlOpcoesTasha(p => p.nivel === sl.nivel);
    const falta = pend.length ? `Faltam ${pend.length} escolha(s): ${pend.slice(0, 3).map(p => nomeDe(p.c.node)).join(', ')}${pend.length > 3 ? '...' : ''}.` : 'Tudo decidido.';
    return `<h2>${esc(titulo)}</h2><p class="meta">Nível total ${nivelTotal()} · ${esc(textoDasClasses())}</p>
        ${pv}${prof || espacos ? `<div class="bloco">${prof}${espacos}</div>` : ''}${entrada}${novHtml}${trocaHtml}${tasha}${escolhas}
        <div class="sub-rodape"><button type="button" class="perigo" onclick="UI.subirCancelar()">Cancelar</button><button type="button" class="sec" onclick="UI.subirOutra()">Escolher outra classe</button><span class="msg">${esc(falta)}</span><button type="button" onclick="UI.subirConfirmar()">Confirmar nível</button></div>`;
}

function htmlTelaSubir() {
    const st = _subirEstado();
    // As escolhas pertencem à classe do nível; o resto é do personagem inteiro.
    return `<div class="subir">${st.sub ? comClasse(st.sub.idx, () => _htmlSubirDetalhe(st)) : comClasse(0, () => _htmlSubirEscolha(st))}</div>`;
}

// Histórico de níveis para a ficha.
function htmlHistoricoNiveis() {
    const h = charState.historico || [];
    if (!h.length) return '<p class="meta">Nenhum nível foi subido pelo app ainda.</p>';
    const linhas = h.slice().reverse().map(x => `<li><b>Nível ${x.n}</b>: ${esc(x.nomeClasse)}${x.nova ? ' (classe nova)' : ' ' + x.nivelClasse} · +${x.pv} PV${x.trocou ? ' · trocou ' + esc(x.trocou.de) : ''}</li>`).join('');
    const desfazer = !podeDesfazerNivel() ? '' : ui.confirmar === 'desfazer'
        ? '<span class="confirmacao">Desfazer o último nível mesmo? <button type="button" class="perigo mini" onclick="UI.desfazerNivel(true)">Sim, desfazer</button> <button type="button" class="sec mini" onclick="UI.desfazerNivel(false)">Não</button></span>'
        : '<button type="button" class="perigo mini" onclick="UI.desfazerNivel()">Desfazer último nível</button>';
    return `<ul class="sub-hist">${linhas}</ul>${desfazer}`;
}

Object.assign(UI, {
    subirAbrir() { ui.subir = { sub: null, liberar: false, vistas: new Set() }; ui.tela = 'subir'; ui.confirmar = null; renderTudo(); window.scrollTo(0, 0); },
    // Da lista de personagens: abre o personagem e já entra no assistente.
    subirDe(id) { const r = carregarPersonagem(id); ui.idSalvo = id; if (!r.ok) return avisar('Não foi possível abrir o personagem: ' + r.perdas.slice(0, 2).join('; '), true); if (r.perdas.length) avisar('Itens que não existem mais foram ignorados: ' + r.perdas.slice(0, 2).join('; '), true); UI.subirAbrir(); },
    _subirIniciar(alvo) {
        const st = _subirEstado(), c0 = calcularPersonagem();
        const antes = { pvAntes: c0.maxPV, espacosAntes: espacosDeMagia(), bonusAntes: c0.profBonus };
        const r = iniciarSubida(alvo); if (!r.ok) return avisar(r.erro, true);
        Object.assign(st, antes, { sub: r, vistas: new Set() }); ui.busca = {}; ui.asi = {}; ui.asiModo = {}; ui.focoTalento = {};
        renderTudo(); window.scrollTo(0, 0);
    },
    subirEscolher(idx) { UI._subirIniciar({ idx }); },
    subirEscolherNova(id) { UI._subirIniciar({ classeId: id }); },
    subirLiberar(v) { _subirEstado().liberar = !!v; renderTudo(); },
    subirTrocar(i) { const r = trocarMagiaConhecida(ui.subir.sub, i); if (!r.ok) return avisar(r.erro, true); renderTudo(); },
    subirOutra() { if (ui.subir && ui.subir.sub) cancelarSubida(ui.subir.sub); ui.subir.sub = null; ui.busca = {}; renderTudo(); window.scrollTo(0, 0); },
    // Desfaz o que o assistente aplicou (sem avisos) e sai dele.
    subirAbortar() { if (ui.subir && ui.subir.sub) cancelarSubida(ui.subir.sub); ui.subir = null; },
    subirCancelar() { UI.subirAbortar(); ui.tela = 'ficha'; renderTudo(); window.scrollTo(0, 0); },
    subirConfirmar() {
        const st = ui.subir, sub = st && st.sub; if (!sub) return;
        const falta = comClasse(sub.idx, () => escolhasPendentes('classe'));
        if (falta.length) { avisar('Falta decidir: ' + nomeDe(falta[0].c.node) + '.', true); const el = porId('bloco-' + falta[0].c.id); if (el) rolarEDestacar(el); return; }
        const h = concluirSubida(sub), r = salvarPersonagem((charState.nomePersonagem || '').trim(), ui.idSalvo);
        if (r.erro) return avisar(r.erro, true);
        ui.idSalvo = r.id; ui.subir = null; ui.tela = 'ficha'; renderTudo(); window.scrollTo(0, 0);
        avisar(`Nível ${h.n} confirmado: ${h.nomeClasse}${h.nova ? ' (classe nova)' : ' ' + h.nivelClasse}, +${h.pv} PV.`);
    },
    desfazerNivel(confirmado) {
        if (confirmado === undefined) { ui.confirmar = 'desfazer'; renderTudo(); return; }
        ui.confirmar = null;
        if (confirmado) {
            const r = desfazerUltimoNivel(); if (!r.ok) return avisar(r.erro || 'Não foi possível desfazer.', true);
            const s = salvarPersonagem((charState.nomePersonagem || '').trim(), ui.idSalvo); if (s.erro) return avisar(s.erro, true); ui.idSalvo = s.id;
            avisar('Último nível desfeito.');
        }
        renderTudo();
    }
});

// No assistente, os handlers das escolhas valem para a classe do nível (as demais telas seguem como antes).
['marcar', 'buscar', 'asiModo', 'asiAjustar', 'justificar', 'focarTalento'].forEach(k => {
    const orig = UI[k];
    UI[k] = (...a) => (ui.tela === 'subir' && ui.subir && ui.subir.sub) ? comClasse(ui.subir.sub.idx, () => orig(...a)) : orig(...a);
});
