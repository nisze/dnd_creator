// Ficha impressa (A4): página 1 no estilo da ficha clássica, mais páginas de magias/recursos, equipamento/história e características.
// A ficha é de papel: aqui só se ajusta o que mudou entre sessões (quantidades, moedas, textos) antes de imprimir.
const _t = (s) => esc(s == null ? '' : String(s));
const _multi = (s) => _t(s).replace(/\n/g, '<br>');
const _ord = (n) => n + 'º';
const _bolas = (n, cls) => Array.from({ length: n }, () => `<i class="${cls || 'bola'}"></i>`).join('');
const _caixas = (n) => (n > 12 ? `<span class="f-ate">____ / ${n}</span>` : _bolas(n, 'caixa'));

function _subclasseNome() {
    const r = semMagias(() => escolhasResolvidas('classe').find(({ c }) => c.node.nivel_escolha !== undefined));
    const s = r && r.res.selecionados[0]; return s ? (s.nome || '') : '';
}
const _pt = (x) => {
    const n = nomeDe(x);
    if (typeof Idioma !== 'undefined' && Idioma.atual === 'en') { const e = Idioma.traduzirTexto(n); if (e) return e; }
    return n.replace(/\s*\([^)]*\)\s*$/, '');
};
const _tit = (t) => `<div class="f-tit">${_t(t)}</div>`;
const _campoTopo = (rot, val) => { const n = String(val || '').length; return `<div class="f-campo${n > 80 ? ' longo2' : n > 34 ? ' longo' : ''}"><b>${_t(val) || '&nbsp;'}</b><small>${_t(rot)}</small></div>`; };

function _htmlPagina1(calc) {
    const f = garantirFolha();
    const per = periciasDaFicha(calc), salvas = salvaguardasDaFicha(calc), sent = sentidosDaFicha(calc);
    const dv = dadosDeVida(calc);
    const bolaPer = (p) => `<i class="bola ${p.especialista ? 'dupla' : p.treinada ? 'cheia' : ''}"></i>`;
    // Seis molduras de atributo em duas colunas ao lado do retrato: valor no círculo grande, modificador no círculo pequeno, nome na placa; salvaguarda embaixo (cheia = proficiente).
    const MOLD = {
        simples: { w: 28, ar: '620/630', img: 'mold_atributo.png', hx: 51.5, hy: 47.9, sx: 15, sy: 20.3, bd: 21.5, px: 21, py: 81.9, pw: 61, ph: 13 },
        dragao: { w: 36.6, ar: '811/963', img: 'mold_forca.png', hx: 64.5, hy: 51.7, sx: 36.4, sy: 33.9, bd: 16.4, px: 41.3, py: 74.1, pw: 45.5, ph: 8.5 }
    };
    // Centro do círculo grande (x, y em mm), em arco sobre o aro e descendo pela direita: For, Des, Con, Int, Sab, Car.
    const LUGAR = [[26.8, 12.8, 'dragao', 36.6], [55.1, -1.9, 'simples', 28], [86, 4.4, 'simples', 28], [113.2, 26.8, 'simples', 28], [124.3, 59.1, 'simples', 28], [118.6, 92.3, 'simples', 28]];
    const orbes = [['FOR', 'For'], ['DEX', 'Des'], ['CON', 'Con'], ['INT', 'Int'], ['SAB', 'Sab'], ['CAR', 'Car']].map(([nome, k], i) => {
        const sv = salvas.find(s => s.chave === k), [cx, cy, tipo, larg] = LUGAR[i], m = MOLD[tipo], w = larg || m.w;
        const [arL, arA] = m.ar.split('/').map(Number), topo = (cy - m.hy / 100 * w * arA / arL).toFixed(2);
        const vars = `--e:${(w / m.w).toFixed(3)};--hx:${m.hx}%;--hy:${m.hy}%;--sx:${m.sx}%;--sy:${m.sy}%;--bd:${m.bd}%;--px:${m.px}%;--py:${m.py}%;--pw:${m.pw}%;--ph:${m.ph}%`;
        return `<div class="f-mold ${tipo}" style="left:${(cx - m.hx / 100 * w).toFixed(2)}mm;top:${topo}mm;width:${w}mm;aspect-ratio:${m.ar};${vars}"><i class="f-m-fundo${sv.proficiente ? ' prof' : ''}"></i><img src="img/ficha/${m.img}" alt=""><span class="f-m-val"><b>${calc.atributos[k]}</b><em>${formatMod(calc.mods[k])}</em></span><span class="f-m-salva${sv.proficiente ? ' prof' : ''}">${formatMod(sv.bonus)}</span><span class="f-m-nome">${nome}</span></div>`;
    }).join('');    const ataques = calc.ataques.slice(0, 7), linhasAtq = ataques.map(a => `<tr><td>${_t(a.nome)}</td><td class="c">${formatMod(a.bonus)}</td><td>${_t(a.dano)}</td></tr>`).join('') + Array.from({ length: Math.max(0, 6 - ataques.length) }, () => '<tr><td>&nbsp;</td><td></td><td></td></tr>').join('');
    const prof = outrasProficienciasDaFicha().filter(p => !['Armaduras', 'Armas'].includes(p.rotulo)), idiomas = idiomasDaFicha();
    const visao = sent.find(s => s.nome === 'Visão no Escuro');
    const notasAtq = calc.ataques.map(a => ({ nome: a.nome, txt: [...(a.props || []).map(p => traduzProp(p).toLowerCase()), ...(a.semProf ? ['sem proficiência'] : [])].join(', ') })).filter(a => a.txt);
    let nNt = 0; const listaNotas = notasAtq.map(a => `<li data-r="${nNt++}"><b>${_t(a.nome)}</b><small>${_t(a.txt)}</small></li>`).join('');
    const defesas = defesasDaFicha(), defExtra = String(f.defesas || '').trim();
    const dvTxt = dv.map(d => `${d.total}d${d.dado}`).join(' + ');
    const acoes = acoesDaFicha(calc); let nAc = 0;
    const liAcao = (a) => `<li data-r="${nAc++}"><b>${_t(a.nome)}</b><small>${_t([a.origem, a.uso].filter(Boolean).join(' · '))}</small></li>`;
    const listaAcoes = acoes.filter(a => a.tipo === 'acao').map(liAcao).join('');
    const listaBonus = [['bonus', 'Ação bônus'], ['reacao', 'Reação']].map(([t, rot]) => { const l = acoes.filter(a => a.tipo === t); return l.length ? `<li class="g">${rot}</li>${l.map(liAcao).join('')}` : ''; }).join('');
    return `<section class="folha p1">
    <header class="f-topo">
        <div class="f-nome"><b>${_t(charState.nomePersonagem) || '&nbsp;'}</b><small>Nome do personagem</small></div>
        <div class="f-ident">
            ${_campoTopo('Classe e nível', textoDasClasses(true))}${_campoTopo('Antecedente', nomeAntecedentePersonalizado() || _pt(charState.antecedente))}${_campoTopo('Jogador', f.jogador)}
            ${_campoTopo('Raça', _pt(charState.raca))}${_campoTopo('Tendência', f.alinhamento)}${_campoTopo('Pontos de experiência', f.xp)}
        </div>
    </header>
    <div class="f-faixa">
        <div class="f-selo"><i class="f-circ"></i><small>Inspiração</small></div>
        <div class="f-selo"><b>${formatMod(calc.profBonus)}</b><small>Bônus de proficiência</small></div>
    </div>
    <div class="f-meio">
        <div class="f-esq">
            <div class="f-caixa f-pericias">${_tit('Perícias')}<ul>${per.map(p => `<li>${bolaPer(p)}<b>${formatMod(p.bonus)}</b><span>${_t(p.nome)}</span><em>${_t(p.attr)}</em></li>`).join('')}</ul></div>
        </div>
        <div class="f-dir">
            <div class="f-heroi"><img class="f-sigilo" src="img/ficha/sigilo.png" alt="">
                <div class="f-aro"><div class="f-foto${charState.retrato && charState.retrato.startsWith('data:image/png') ? ' recorte' : ''}">${charState.retrato ? `<img src="${charState.retrato}" alt="">` : '<span>Retrato</span>'}</div><button type="button" class="f-foto-ed sem-impressao" onclick="UI.fretratoEditar()">${charState.retrato ? 'Reposicionar foto' : 'Enviar foto'}</button></div>
                ${orbes}
                <div class="f-ca"><img src="img/ficha/escudo.png" alt=""><img class="f-ca-miolo" src="img/ficha/escudo_miolo.png" alt=""><b>${calc.caFinal}</b><small>CA</small>${calc.ca.escudoExtra ? `<em class="f-ca-esc">+${calc.ca.escudoExtra.valor} com escudo</em>` : ''}</div>
                <div class="f-plaq esq"><img src="img/ficha/retangulo_medio_borda.png" alt=""><span class="f-plaq-txt"><b>${_t(calc.deslBase)} m</b><small>Deslocamento</small></span></div>
                <div class="f-plaq dir"><img src="img/ficha/retangulo_medio_borda.png" alt=""><span class="f-plaq-txt"><b>${formatMod(calc.iniciativa)}</b><small>Iniciativa</small></span></div>

            </div>
        </div>
    </div>
    <div class="f-baixo">
        <div class="f-col">
            <div class="f-caixa f-ataques">${_tit('Ataques e conjuração')}<table><thead><tr><th>Nome</th><th>Bônus</th><th>Dano / tipo</th></tr></thead><tbody>${linhasAtq}</tbody></table></div>
            <div class="f-caixa f-acoes f-notas" data-sem-paginas="1" data-vazio="Sem propriedades especiais.">${_tit('Notas dos ataques')}<ul>${listaNotas}</ul><p class="f-mais"></p></div>
        </div>
        <div class="f-col">
            <div class="f-caixa f-pv">${_tit('Pontos de vida')}
                <div class="f-pv-linha"><div><b>${calc.maxPV}</b><small>PV máximos</small></div><div class="f-grande"><b>&nbsp;</b><small>PV atuais</small></div><div class="f-grande"><b>&nbsp;</b><small>PV temporários</small></div></div>
                <div class="f-dv"><span>Dados de vida: <b>${_t(dvTxt)}</b></span><div>${dv.map(d => `<span class="f-dv-g">${_bolas(d.total, 'caixa')}</span>`).join('')}</div></div>
                <div class="f-morte"><span>Salvaguardas de morte</span><div><em>Sucessos</em>${_bolas(3, 'bola')}</div><div><em>Falhas</em>${_bolas(3, 'bola')}</div></div>
            </div>
            <div class="f-caixa f-prof">${_tit('Outras proficiências e idiomas')}
                ${prof.map(p => `<p><b>${_t(p.rotulo)}:</b> ${_t(p.texto)}</p>`).join('')}
                <p><b>Idiomas:</b> <span data-lingua>${_t(idiomas.join(', ') || '—')}</span></p>
                ${sent.filter(s => !/passiva|Visão no Escuro/.test(s.nome)).map(s => `<p><b>${_t(s.nome)}:</b> ${_t(s.valor)}</p>`).join('')}
                <p><b>${_t('Visão no Escuro')}:</b> ${visao ? _t(visao.valor) : _t('não possui')}</p>
            </div>
        </div>
        <div class="f-col">
            <div class="f-caixa f-defesas">${_tit('Defesas')}${defesas.map(d => `<p><b>${_t(d.rotulo)}:</b> ${_t(d.texto)}</p>`).join('')}${defExtra ? `<p>${_multi(defExtra)}</p>` : ''}${defesas.length || defExtra ? '' : '<p class="peq">Nenhuma resistência ou imunidade permanente.</p>'}</div>
            <div class="f-caixa f-acoes">${_tit('Ações')}<ul>${listaAcoes}</ul><p class="f-mais"></p></div>
            <div class="f-caixa f-acoes">${_tit('Ação bônus e reação')}<ul>${listaBonus}</ul><p class="f-mais"></p></div>
        </div>
    </div>
</section>`;
}

function _htmlPaginaMagiasRecursos(calc) {
    const conjs = conjuracoesDaFicha(calc), espacos = espacosDeMagia(), magias = magiasDaFicha(), recursos = recursosDaFicha(calc), metamagia = metamagiaDaFicha();
    if (!conjs.length && !magias.length && !recursos.length) return '';
    const grupos = {}; magias.forEach(m => { (grupos[m.nivel] = grupos[m.nivel] || []).push(m); });
    const secoes = Object.keys(grupos).map(Number).sort((a, b) => a - b).map(n => `<div class="f-mg-grupo"><h4>${n === 0 ? 'Truques' : _ord(n) + ' círculo'}</h4><ul>${grupos[n].map(m => `<li><i class="bola ${m.preparada && !m.troca ? 'cheia' : ''}"></i><b>${_t(m.exibir || m.nome)}</b><em>${_t(m.origem)}</em><small>${_t(m.resumo)}</small></li>`).join('')}</ul></div>`).join('');
    const prep = (conj) => conj.preparadas ? `<span>Preparadas por descanso longo: <b>${conj.preparadas}</b></span>` : '';
    const algumaTroca = magias.some(m => m.troca);
    // Conjuração e recursos ocupam a largura toda; a lista de magias corre em duas colunas para a página não crescer sem fim.
    return `<section class="folha livre">
    <h2 class="f-h2">Magias e recursos</h2>
    <div class="${conjs.length ? 'f-duas' : ''}">
    ${conjs.length ? `<div class="f-caixa">${_tit('Conjuração')}<div class="f-conj-tab${conjs.length > 1 ? ' multi' : ''}">${conjs.map(conj => `<div class="f-conj-linha">${conjs.length > 1 ? `<span><b>${_t(conj.classe)}</b></span>` : ''}<span>Habilidade <b>${_t(conj.habilidade)}</b></span><span>CD das magias <b>${conj.cd}</b></span><span>Ataque <b>${formatMod(conj.ataque)}</b></span>${prep(conj) || conj.ritual ? `<span class="f-conj-ext">${prep(conj)}${conj.ritual ? '<span>Conjura rituais</span>' : ''}</span>` : ''}</div>`).join('')}</div>
    ${espacos.length ? `<div class="f-slots">${espacos.map(e => `<div><small>${_ord(e.nivel)} círculo${e.pacto ? ' (pacto)' : ''}</small><span>${_bolas(e.total, 'caixa')}</span></div>`).join('')}</div>` : ''}</div>` : ''}
    <div class="f-caixa">${_tit('Recursos com usos')}${recursos.length ? `<ul class="f-rec">${recursos.map(r => `<li><div><b>${_t(r.nome)}</b><em>${r.recarga === 'curto' ? 'descanso curto' : 'descanso longo'}</em></div><div class="f-rec-cx">${r.ilimitado ? '<span class="f-ate">ilimitado</span>' : _caixas(r.max)}</div>${r.nota ? `<small>${_t(r.nota)}</small>` : ''}</li>`).join('')}</ul>` : '<p class="peq">Nenhum recurso com usos contado automaticamente. Os de subclasse estão nas características.</p>'}</div>
    </div>
    ${metamagia.length ? `<div class="f-caixa">${_tit('Metamagia')}<ul class="f-rec f-meta">${metamagia.map(m => `<li><div><b>${_t(m.nome)}</b></div></li>`).join('')}</ul></div>` : ''}
    <div class="f-caixa">${_tit('Magias')}${secoes ? `<div class="f-mg-cols">${secoes}</div>` : '<p class="peq">Nenhuma magia escolhida.</p>'}${algumaTroca ? '<p class="peq">Bolinha vazia: marque a lápis as magias preparadas do dia. Bolinha cheia: sempre disponível.</p>' : ''}</div>
</section>`;
}

function _htmlPaginaEquipamento(calc) {
    const f = garantirFolha(), carga = cargaDaFicha(calc), itens = charState.inventario.filter(i => (i.qtd || 0) > 0);
    const linhas = itens.map(i => { const kg = (parseFloat(i.peso_lb) || 0) * i.qtd; return `<li><span class="f-qtd">${i.qtd}</span><b>${_t(i.apelido || i.nome)}${i.bonus_magico ? ' +' + i.bonus_magico : ''}${i.sint ? (i.sintonizado ? ' (sintonizado)' : ' (requer sintonização)') : ''}${(i.cat === 'personalizado' ? i.desc : i.obs) ? ` <small>${_t(i.cat === 'personalizado' ? i.desc : i.obs)}</small>` : ''}</b>${tagArmadura(i)}<small>${kg ? emKg(kg).toString().replace('.', ',') + ' kg' : ''}</small></li>`; }).join('');
    const pe = proficienciasEquipDaFicha();
    const moedas = Object.keys(NOME_MOEDA).map(k => `<div class="f-moeda"><b>${f.moedas[k] || '&nbsp;'}</b><small>${NOME_MOEDA[k]}</small></div>`).join('');
    const texto = (rot, k) => `<div class="f-caixa f-texto" data-k="${k}" data-rot="${_t(rot)}">${_tit(rot)}<p>${_multi(f[k])}</p></div>`;
    return `<section class="folha livre eqp">
    <h2 class="f-h2">Equipamento e história</h2>
    <div class="f-duas f-eq">
        <div class="f-caixa">${_tit('Equipamento')}<ul class="f-itens">${linhas}<li class="preench" aria-hidden="true"></li></ul>
            <div class="f-eq-rodape"><p>Peso total (equipamento + moedas): <b>${String(emKg(carga.peso)).replace('.', ',')} kg</b> de ${emKg(carga.capacidade).toString().replace('.', ',')} kg (limite).</p><p class="peq">Empurrar/arrastar/levantar: ${emKg(carga.empurrar).toString().replace('.', ',')} kg.</p></div></div>
        <div class="f-col">
            <div class="f-caixa">${_tit('Moedas')}<div class="f-moedas">${moedas}</div><p class="peq">Total: ${String(moedasEmPO(f.moedas)).replace('.', ',')} PO</p></div>
            <div class="f-caixa f-profeq">${_tit('Proficiências de equipamento')}<ul class="f-pe">${pe.categorias.map(c => `<li><i class="bola${c.tem ? ' cheia' : ''}"></i><span>${_t(c.nome)}</span></li>`).join('')}</ul>${pe.excecoes.length ? `<ul class="f-pe f-pe-ex">${pe.excecoes.map(n => `<li><i class="bola cheia"></i><span>${_t(n)}</span></li>`).join('')}</ul>` : ''}</div>
            ${texto('Anotações', 'notas')}
            ${texto('Aliados e organizações', 'aliados')}
            ${texto('Aparência', 'aparencia')}
        </div>
    </div>
    <div class="f-quatro txt">${texto('Traços de personalidade', 'personalidade')}${texto('Ideais', 'ideais')}${texto('Vínculos', 'vinculos')}${texto('Defeitos', 'defeitos')}</div>
    <div class="f-um txt grande">${texto('História do personagem', 'historia')}</div>
</section>`;
}

// As caixas de texto têm tamanho fixo na página: a letra encolhe até caber e, se mesmo assim não couber, o texto inteiro vai para uma página de continuação.
function ajustarTextosFicha() {
    const prev = porId('ficha-previa'); if (!prev || !prev.querySelectorAll) return;
    paginarCaracteristicas();
    ajustarListasPagina1();
    const velha = prev.querySelector('.f-cont'); if (velha) velha.remove();
    const sobras = [];
    prev.querySelectorAll('.eqp .f-texto').forEach(box => {
        const p = box.querySelector('p'); if (!p) return;
        p.style.removeProperty('--fs'); box.classList.remove('estoura');
        const cabe = () => p.scrollHeight <= p.clientHeight + 1;
        let fs = 8;
        while (!cabe() && fs > 5.5) { fs -= 0.25; p.style.setProperty('--fs', fs + 'pt'); }
        if (!cabe()) { box.classList.add('estoura'); sobras.push({ rot: box.getAttribute('data-rot') || '', k: box.getAttribute('data-k') }); }
    });
    const eqp = prev.querySelector('.eqp'); if (!sobras.length || !eqp) return;
    const f = garantirFolha(), sec = document.createElement('section');
    sec.className = 'folha livre f-cont';
    sec.innerHTML = `<h2 class="f-h2">Continuação: personalidade e história</h2>${sobras.map(s => `<div class="f-caixa f-texto">${_tit(_t(s.rot))}<p>${_multi(f[s.k])}</p></div>`).join('')}`;
    eqp.after(sec);
}

// Características e talentos: cada lista é repartida em quantas folhas A4 forem necessárias; cada descrição fica inteira numa folha.
function paginarCaracteristicas() {
    const prev = porId('ficha-previa'); if (!prev || !prev.querySelector) return;
    const paginas = Array.from(prev.querySelectorAll('.f-carac-pg')); if (!paginas.length) return;
    prev.querySelectorAll('.f-carac-cont').forEach(s => {
        const orig = paginas.find(p => p.getAttribute('data-de') === s.getAttribute('data-de'));
        if (orig) s.querySelectorAll('article').forEach(a => orig.querySelector('.f-cols').appendChild(a));
        s.remove();
    });
    const regua = document.createElement('div'); regua.style.cssText = 'position:absolute;visibility:hidden;height:296mm;width:1px'; prev.appendChild(regua);
    const mm = regua.getBoundingClientRect().height / 296; regua.remove(); if (!(mm > 0)) return;
    paginas.forEach(primeira => {
        const cols0 = primeira.querySelector('.f-cols'), artigos = Array.from(cols0.querySelectorAll('article')); if (!artigos.length) return;
        artigos.forEach(a => a.remove());
        let pg = primeira, cols = cols0;
        const estoura = () => cols.getBoundingClientRect().bottom > pg.getBoundingClientRect().top + 287 * mm;
        artigos.forEach(a => {
            cols.appendChild(a);
            if (estoura() && cols.children.length > 1) {
                cols.removeChild(a);
                const nova = document.createElement('section'); nova.className = 'folha livre f-carac-cont'; nova.setAttribute('data-de', primeira.getAttribute('data-de'));
                nova.innerHTML = `<h2 class="f-h2">${_t(primeira.getAttribute('data-tit'))} (continuação)</h2><div class="f-cols"></div>`;
                pg.after(nova); pg = nova; cols = nova.querySelector('.f-cols'); cols.appendChild(a);
            }
        });
    });
}

// Listas curtas da página 1 (ações, ação bônus e reação): o que não cabe no quadro sai da lista e vira "+ N"; as descrições estão nas páginas finais.
function ajustarListasPagina1() {
    const prev = porId('ficha-previa'); if (!prev || !prev.querySelectorAll) return;
    prev.querySelectorAll('.p1 .f-acoes').forEach(box => {
        const ul = box.querySelector('ul'), mais = box.querySelector('.f-mais'); if (!ul || !mais) return;
        const vazio = !ul.children.length;
        if (vazio) { ul.remove(); mais.textContent = box.getAttribute('data-vazio') || 'Nenhuma habilidade de uso detectada.'; return; }
        let ocultos = parseInt(box.getAttribute('data-ocultos') || '0', 10), semPg = box.hasAttribute('data-sem-paginas');
        const nota = () => { mais.textContent = ocultos ? `+ ${ocultos}${semPg ? '' : ' nas últimas páginas'}.` : (semPg ? '' : 'Descrições nas últimas páginas.'); };
        nota();
        const limparGrupos = () => ul.querySelectorAll('li.g').forEach(g => { const n = g.nextElementSibling; if (!n || n.classList.contains('g')) g.remove(); });
        while (box.scrollHeight > box.clientHeight + 1) {
            // Sai primeiro o último item da lista (maior data-r); títulos de grupo que ficam sem itens saem junto.
            const itens = [...ul.children].filter(li => !li.classList.contains('g')); if (!itens.length) break;
            itens.reduce((a, b) => (+b.dataset.r > +a.dataset.r ? b : a)).remove(); ocultos++; limparGrupos(); nota();
        }
        limparGrupos();
        box.setAttribute('data-ocultos', ocultos);
    });
}

// Agrupa as características pela origem: as classes (na ordem do personagem), depois Raça e Antecedente.
const _rotuloGrupo = (c) => (c.fonte === 'Classe' ? nomeCurtoDaClasse(charState.classe) : c.fonte) + (c.sub ? ' \u00b7 ' + c.sub : '');
function _gruposCaracteristicas(lista) {
    const peso = (r) => r === 'Raça' ? 1 : r === 'Antecedente' ? 2 : 0, gs = [];
    lista.forEach(c => { const rot = _rotuloGrupo(c); let g = gs.find(x => x.rot === rot); if (!g) gs.push(g = { rot, itens: [] }); g.itens.push(c); });
    return gs.map((g, i) => ({ g, i })).sort((a, b) => peso(a.g.rot) - peso(b.g.rot) || a.i - b.i).map(x => x.g);
}

// Páginas de descrição: Características (por origem) e Talentos (com o local de onde vêm). Cada uma é repartida em folhas por paginarCaracteristicas().
function _htmlPaginaCaracteristicas() {
    const grupos = _gruposCaracteristicas(caracteristicasDaFicha().filter(c => c.fonte !== 'Talento')); if (!grupos.length) return '';
    return `<section class="folha livre f-carac-pg" data-de="carac" data-tit="Características">
    <h2 class="f-h2">Características</h2>
    <div class="f-cols">${grupos.map(g => g.itens.map((c, i) => `<article>${i === 0 ? `<h3 class="f-grupo">${_t(g.rot)}</h3>` : ''}<h4>${_t(c.nome)} <small>${_t(g.rot)}${c.nivel ? ' · nível ' + c.nivel : ''}</small></h4><p>${paragrafos(c.texto, c.nivelClasse)}</p></article>`).join('')).join('')}</div>
</section>`;
}

function _htmlPaginaTalentos() {
    const lista = caracteristicasDaFicha().filter(c => c.fonte === 'Talento'); if (!lista.length) return '';
    return `<section class="folha livre f-carac-pg" data-de="talentos" data-tit="Talentos">
    <h2 class="f-h2">Talentos</h2>
    <div class="f-cols">${lista.map(c => `<article><h4>${_t(c.nome)} <small>${_t(c.origem)}</small></h4><p>${paragrafos(c.texto)}</p></article>`).join('')}</div>
</section>`;
}

// Tabelas de rolagem marcadas pelo jogador: ficam em páginas depois das características (as pequenas dividem a página; a de d100 ocupa uma inteira).
function _htmlPaginasTabelas() {
    const marcadas = garantirFolha().tabelas || {}, sel = tabelasDaFicha().filter(t => marcadas[t.chave]); if (!sel.length) return '';
    const linhasDe = (t) => 3 + t.itens.reduce((s, i) => s + Math.ceil((String(i.efeito).length + 8) / 62), 0);
    const paginas = []; let atual = [], total = 0;
    sel.forEach(t => { const n = linhasDe(t); if (atual.length && total + n > 150) { paginas.push(atual); atual = []; total = 0; } atual.push(t); total += n; });
    if (atual.length) paginas.push(atual);
    const en = typeof Idioma !== 'undefined' && Idioma.atual === 'en';
    return paginas.map((pg, k) => `<section class="folha livre f-tab-pg" data-de="tabelas"><h2 class="f-h2">${_t(sel.length === 1 ? sel[0].titulo : (en ? 'Tables' : 'Tabelas'))}${k ? ' (' + (en ? 'continued' : 'continuação') + ')' : ''}</h2><div class="f-tabelas">${pg.map(t => `<div class="f-tabela${t.itens.length > 14 ? '' : ' junta'}"><h4>${_t(t.titulo)} <small>${_t(t.dado)}</small></h4><ul class="f-d100">${t.itens.map(i => `<li><b>${_t(i.d)}</b><span>${_t(i.efeito)}</span></li>`).join('')}</ul></div>`).join('')}</div></section>`).join('');
}
// Pergunta no fim da tela (fora da folha, não sai na impressão): cada tabela de rolagem das características do personagem entra na ficha só se for marcada.
function _htmlOpcoesFinaisFicha() {
    const ts = tabelasDaFicha(); if (!ts.length) return '';
    const marcadas = garantirFolha().tabelas || {}, en = typeof Idioma !== 'undefined' && Idioma.atual === 'en';
    return `<div id="ficha-opcoes" class="ficha-opcoes sem-impressao"><b>${en ? 'Tables from your features' : 'Tabelas das suas características'}</b>${ts.map((t, i) => `<label class="aj-opcao"><input type="checkbox" ${marcadas[t.chave] ? 'checked' : ''} onchange="UI.ftabela(${i}, this.checked)"> ${en ? `Include the "${_t(t.titulo)}" table (${_t(t.dado)}, ${t.itens.length} rows) on the sheet, after the features` : `Incluir a tabela "${_t(t.titulo)}" (${_t(t.dado)}, ${t.itens.length} linhas) na ficha, depois das características`}</label>`).join('')}</div>`;
}

function htmlPaginasFicha() {
    const calc = calcularPersonagem();
    return _htmlPagina1(calc) + _htmlPaginaMagiasRecursos(calc) + _htmlPaginaEquipamento(calc) + _htmlPaginaCaracteristicas() + _htmlPaginasTabelas() + _htmlPaginaTalentos();
}

// Armas, armaduras e escudos comuns podem ter bônus mágico +1 a +3 (no editor do item).
const _podeMelhorar = (i) => !!(i.mec && (i.mec.categoria || i.mec.tipo)) && i.cat !== 'magico';
function _htmlEditorItem(i) {
    const id = _t(i.id), pessoal = i.cat === 'personalizado';
    return `<div class="aj-editor"><div class="aj-linha"><label class="aj-campo larga">Nome do item<input type="text" id="ei-nome" maxlength="80" value="${_t(i.apelido || '')}" placeholder="${_t(nomeBaseItem(i))}"></label>${_podeMelhorar(i) ? `<label class="aj-campo">Bônus mágico<select id="ei-bonus">${[0, 1, 2, 3].map(n => `<option value="${n}" ${(i.bonus_magico || 0) === n ? 'selected' : ''}>${n ? '+' + n : 'nenhum'}</option>`).join('')}</select></label>` : ''}<label class="aj-campo larga">Observação (opcional)<input type="text" id="ei-obs" maxlength="120" value="${_t(pessoal ? i.desc : i.obs)}"></label></div><div class="aj-linha"><button type="button" class="mini" onclick="UI.fitemSalvar('${id}')">Salvar</button><button type="button" class="sec mini" onclick="UI.fitemEditar(null)">Cancelar</button></div></div>`;
}
const _botoesQtd = (i) => { const id = _t(i.id); return `<button type="button" class="sec mini" onclick="UI.fqtd('${id}', -1)" aria-label="Diminuir">-</button><input type="number" min="0" value="${i.qtd || 0}" onchange="UI.fqtdSet('${id}', this.value)" aria-label="Quantidade"><button type="button" class="sec mini" onclick="UI.fqtd('${id}', 1)" aria-label="Aumentar">+</button>`; };
function _htmlLinhaItem(i, extras) {
    const id = _t(i.id), b = i.bonus_magico || 0, aberto = String(ui.fichaEditaItem) === String(i.id);
    const base = i.apelido ? ` <small class="meta">(${_t(nomeBaseItem(i))})</small>` : '';
    return `<div class="aj-bloco"><div class="aj-item ${i.qtd > 0 ? '' : 'zerado'}"><span>${_t(nomeItem(i))}${b ? ` <b class="aj-bonus">+${b}</b>` : ''}${base}${i.cat === 'personalizado' ? ' <em>(item pessoal)</em>' : ''}</span>${extras || ''}<button type="button" class="sec mini" onclick="UI.fitemEditar('${id}')" aria-expanded="${aberto}">Editar</button>${String(ui.fichaRemoveItem) === String(i.id) ? `<span class="msg">Remover este item? <button type="button" class="perigo mini" onclick="UI.fitemRemover('${id}', true)">Sim</button> <button type="button" class="sec mini" onclick="UI.fitemRemover(null)">Não</button></span>` : `<button type="button" class="sec mini" onclick="UI.fitemRemover('${id}')" aria-label="Remover item">Remover</button>`}${_botoesQtd(i)}</div>${aberto ? _htmlEditorItem(i) : ''}</div>`;
}
function _htmlAjusteItens() {
    const itens = charState.inventario.filter(i => i.cat !== 'magico');
    if (!itens.length) return '<p class="meta">Sem itens no inventário.</p>';
    return itens.map(i => _htmlLinhaItem(i)).join('');
}
function _htmlAjusteMagicos() {
    const itens = charState.inventario.filter(i => i.cat === 'magico');
    if (!itens.length) return '<p class="meta">Nenhum item mágico.</p>';
    return itens.map(i => {
        const id = _t(i.id);
        const variante = i.efeito && i.efeito.variantes ? `<select onchange="UI.fvariante('${id}', this.value)" aria-label="Variante">${i.efeito.variantes.map((v, k) => `<option value="${k}"${(i.variante || 0) === k ? ' selected' : ''}>${_t(v.nome)}</option>`).join('')}</select>` : '';
        const sint = i.sint ? `<label class="aj-opcao"><input type="checkbox" ${i.sintonizado ? 'checked' : ''} onchange="UI.fsintonia('${id}')"> sintonizado</label>` : '';
        return _htmlLinhaItem(i, variante + sint);
    }).join('') + `<p class="meta">Sintonizados: ${totalSintonizados()}/${MAX_SINTONIAS}</p>`;
}

const _ICO_ABA = {
    geral: _svgp('<path d="M3 11l9-7 9 7M5 10v10h14V10"/>'), inventario: _svgp('<path d="M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2"/>'),
    magicos: _svgp('<path d="M12 3l2.4 5.6 6.1.5-4.6 4 1.4 6-5.3-3.2-5.3 3.2 1.4-6-4.6-4 6.1-.5z"/>'),
    historico: _svgp('<path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z"/>')
};
const _ABAS_FICHA = [['geral', 'Geral'], ['inventario', 'Inventário'], ['magicos', 'Itens mágicos'], ['historico', 'Histórico de níveis']];

// Cartão do personagem (como em "Meus personagens"), barra de XP, ações e seções; fica acima da ficha.
function _htmlLateralFicha() {
    garantirFolha();
    const corDe = id => COR_CLASSE[id] || COR_CLASSE[String(id).replace(/-.*$/, '')] || 'var(--ouro-claro)';
    const classes = todasClasses().map(c => `<span class="cl" style="--cor:${corDe(c.classe.id)}">${_t(nomeCurtoDaClasse(c.classe))} ${c.nivel}</span>`).join(' / ');
    const nivel = nivelTotal(), xp = infoXP(), prox = nivel < 20 ? xpDoNivel(nivel + 1) : null, cor = corDe(charState.classe.id);
    const pct = xp && prox ? Math.min(100, Math.round(xp.xp / prox * 100)) : 0;
    return `<div class="pers ficha-pers"><span class="pers-canto c1"></span><span class="pers-canto c2"></span><span class="pers-canto c3"></span><span class="pers-canto c4"></span>
        <div class="pers-topo"><div class="pers-fotobox"><div class="pers-foto${charState.retrato ? '' : ' vazia'}">${charState.retrato ? `<img src="${_t(charState.retrato)}" alt="">` : ''}</div><span class="pers-nivel" title="Nível">${nivel}</span></div>
        <div class="pers-info"><b>${_t(charState.nomePersonagem) || 'Sem nome'}</b><span class="pers-raca">${_t(nomeDe(charState.raca))}</span><span class="pers-classes">${classes}</span></div></div>
        <div class="f-xp" title="Pontos de experiência"><span class="f-xp-barra"><i style="width:${pct}%"></i></span><small>XP ${_numBR(xp ? xp.xp : 0)}${prox ? ' / ' + _numBR(prox) : ''}</small></div>
        <div class="pers-div"></div>
        <div class="acoes"><button type="button" class="abrir${xp && xp.pode ? ' destaque' : ''}" onclick="UI.subirAbrir()">${ICO_PERS.d20}Subir de nível</button><button type="button" class="sec subir" style="--cor:${cor}" onclick="UI.imprimirFicha()">${ICO_PERS.livro}Imprimir ficha</button><button type="button" class="sec subir" style="--cor:${cor}" onclick="UI.editar(ui.idSalvo)">${ICO_PERS.pena}Editar personagem</button></div></div>
    <nav class="ficha-nav" aria-label="Seções da ficha">${_ABAS_FICHA.map(([k, r]) => `<button type="button" class="${ui.fichaJanela === k ? 'ativa' : ''}" onclick="UI.fichaAba('${k}')">${_ICO_ABA[k]}${r}</button>`).join('')}</nav>
    <div class="ficha-extra"><label class="aj-opcao"><input type="checkbox" ${ui.fichaSemFundo ? 'checked' : ''} onchange="UI.fichaFundo(this.checked)"> Economizar tinta (sem fundo de pergaminho)</label>
    <button type="button" class="sec mini" onclick="UI.telaPersonagens()">Meus personagens</button></div>`;
}

// Conteúdo de cada seção da janela: Geral (cabeçalho e retrato), Inventário (itens, moedas, loja), Defesas, Histórico de níveis e Notas (personalidade e história).
function _htmlPainelFicha(aba) {
    const f = garantirFolha();
    const campo = (k, rot, larg) => `<label class="aj-campo ${larg || ''}">${rot}<input type="text" value="${_t(f[k])}" onchange="UI.fcampo('${k}', this.value)"></label>`;
    const tendencias = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'];
    if (f.alinhamento && !tendencias.includes(f.alinhamento)) tendencias.push(f.alinhamento);
    const selTend = `<label class="aj-campo">Tendência<select onchange="UI.fcampo('alinhamento', this.value)"><option value="">—</option>${tendencias.map(t => `<option value="${_t(t)}" ${t === f.alinhamento ? 'selected' : ''}>${_t(t)}</option>`).join('')}</select></label>`;
    const area = (k, rot) => { const v = String(f[k] || ''), linhas = Math.min(12, Math.max(3, Math.ceil(v.length / 60) + v.split('\n').length - 1)); return `<label class="aj-campo larga">${rot}<textarea rows="${linhas}" oninput="UI.fcampoVivo('${k}', this)" onchange="UI.fcampo('${k}', this.value)">${_t(v)}</textarea></label>`; };
    const moedas = Object.keys(NOME_MOEDA).map(k => `<label class="aj-campo">${NOME_MOEDA[k]}<input type="number" min="0" value="${f.moedas[k] || 0}" onchange="UI.fmoeda('${k}', this.value)"></label>`).join('');
    if (aba === 'inventario') return `<p class="meta">O que for gasto em jogo (ração, flechas, poções, ouro) se ajusta aqui; a ficha é atualizada na hora. Itens com quantidade 0 não saem na impressão.</p>
        <h4>Itens</h4><div id="f-aj-itens">${_htmlAjusteItens()}</div>
        <h4>Moedas</h4><div class="aj-linha" id="f-aj-moedas">${moedas}</div>
        <h4>Loja</h4><div class="aj-linha"><button type="button" onclick="UI.fichaLoja()">Abrir loja</button></div>
        <h4>Adicionar item pessoal</h4>
        <div class="aj-linha"><label class="aj-campo">Nome<input type="text" id="novo-item-nome" maxlength="80" placeholder="Chaveiro da minha irmã"></label><label class="aj-campo">Qtd<input type="number" id="novo-item-qtd" min="1" value="1"></label><label class="aj-campo">Peso (kg)<input type="number" id="novo-item-peso" min="0" step="0.1" value="0"></label><label class="aj-campo larga">Observação (opcional)<input type="text" id="novo-item-desc" maxlength="120"></label><button type="button" class="mini" onclick="UI.fitemAdd()">Adicionar</button></div>`;

    if (aba === 'magicos') return `<p class="meta">Itens mágicos do personagem. Os que exigem sintonização contam no máximo de ${MAX_SINTONIAS}; a ficha é atualizada na hora.</p>
        <h4>Itens mágicos</h4><div id="f-aj-magicos">${_htmlAjusteMagicos()}</div>
        <div class="aj-linha"><button type="button" onclick="UI.fichaMagicos()">Adicionar item mágico</button></div>`;
    if (aba === 'historico') return `<h4>Histórico de níveis</h4><div id="f-historico">${htmlHistoricoNiveis()}</div>`;

    return `<p class="meta">Ajuste antes de imprimir; a ficha abaixo é atualizada na hora.</p>
        <h4>Cabeçalho</h4><div class="aj-linha">${campo('jogador', 'Jogador')}${selTend}${campo('xp', 'Pontos de experiência')}</div><p class="meta" id="f-xp-dica">${_t(htmlDicaXP())}</p>
        <h4>Retrato</h4><div class="aj-linha aj-retrato">${charState.retrato ? `<img src="${charState.retrato}" alt="Retrato atual">` : '<span class="meta">Sem retrato.</span>'}<div class="aj-ret-col"><label class="aj-campo">${charState.retrato ? 'Substituir foto' : 'Enviar foto'}<input type="file" accept="image/*" onchange="UI.fretrato(this)"></label>${charState.retrato ? `<div class="aj-linha"><button type="button" class="mini" onclick="UI.fretratoEditar()">Reposicionar</button><button type="button" class="sec mini" onclick="UI.fretratoRemover()">Remover foto</button></div>` : ''}<small class="meta">Dica: usar imagem sem fundo (PNG) também fica bom.</small></div></div><div id="f-ret-ed"></div>
        <h4>Defesas extras</h4><div class="aj-linha">${area('defesas', 'Resistências, imunidades ou vantagens que o app não detectou (aparecem no quadro Defesas)')}</div>
        <h4>Personalidade e história</h4><div class="aj-linha">${area('personalidade', 'Traços de personalidade')}${area('ideais', 'Ideais')}${area('vinculos', 'Vínculos')}${area('defeitos', 'Defeitos')}${area('aparencia', 'Aparência')}${area('aliados', 'Aliados e organizações')}${area('historia', 'História')}${area('notas', 'Anotações')}</div>`;
}
const _htmlJanelaFicha = () => ui.fichaJanela ? `<div class="fj-cab"><h3>${_t((_ABAS_FICHA.find(a => a[0] === ui.fichaJanela) || [0, ''])[1])}</h3><button type="button" class="sec mini" onclick="UI.fichaAba(null)">Fechar</button></div><div class="fj-corpo">${_htmlPainelFicha(ui.fichaJanela)}</div>` : '';
function _atualizarJanelaFicha() {
    const j = porId('ficha-janela'); if (j) { j.className = 'ficha-janela' + (ui.fichaJanela ? ' aberta' : ''); j.innerHTML = _htmlJanelaFicha(); }
    const t = porId('ficha-topo'); if (t && t.classList) t.classList.toggle('sem-janela', !ui.fichaJanela);
    const l = porId('ficha-lateral'); if (l) l.innerHTML = _htmlLateralFicha();
}

// Acima da ficha, dentro da mesma largura dela: cartão e seções à esquerda, janela da seção à direita (no celular a janela ocupa a tela).
function htmlTelaFicha() {
    garantirFolha();
    if (ui.fichaJanela === undefined) ui.fichaJanela = (typeof window !== 'undefined' && window.innerWidth > 800) ? 'geral' : null;
    return `<div class="ficha-tela">
    <div id="ficha-topo" class="ficha-topo sem-impressao${ui.fichaJanela ? '' : ' sem-janela'}">
        <aside id="ficha-lateral" class="ficha-lateral">${_htmlLateralFicha()}</aside>
        <div id="ficha-janela" class="ficha-janela${ui.fichaJanela ? ' aberta' : ''}" role="dialog" aria-label="Ajustes da ficha">${_htmlJanelaFicha()}</div>
    </div>
    <div class="ficha-centro"><div id="ficha-previa" class="${ui.fichaSemFundo ? 'sem-fundo' : ''}">${htmlPaginasFicha()}</div>${_htmlOpcoesFinaisFicha()}</div>
</div>`;
}

function _persistirFicha() {
    const r = salvarPersonagem((charState.nomePersonagem || '').trim(), ui.idSalvo);
    if (r.erro) avisar(r.erro, true); else ui.idSalvo = r.id;
    const aj = porId('f-aj-itens'); if (aj) aj.innerHTML = _htmlAjusteItens();
    const ajm = porId('f-aj-magicos'); if (ajm) ajm.innerHTML = _htmlAjusteMagicos();
    const lat = porId('ficha-lateral'); if (lat) lat.innerHTML = _htmlLateralFicha();
    const dica = porId('f-xp-dica'); if (dica) dica.textContent = htmlDicaXP();
    porId('ficha-previa').innerHTML = htmlPaginasFicha();
    ajustarTextosFicha();
}
let _tmrFicha = null;
// Loja aberta a partir da ficha: janela com a loja inteira; as compras saem das moedas da ficha.
const _htmlTopoLojaFicha = () => { const m = garantirFolha().moedas; return `<h3 style="margin:0 0 .6rem">Loja <span class="saldo" id="loja-ficha-moedas">${Object.keys(NOME_MOEDA).filter(k => m[k]).map(k => m[k] + ' ' + NOME_MOEDA[k]).join(' / ') || 'sem moedas'}</span></h3>`; };
const _htmlTopoMagicosFicha = () => '<h3 style="margin:0 0 .6rem">Itens mágicos <small class="meta">(concedidos pelo mestre, sem preço)</small></h3>';

// Carrinho da loja da ficha: itens escolhidos ficam numa lista e só são pagos (com as moedas da ficha) quando o jogador confirma.
const _carrinho = () => ui.carrinho || (ui.carrinho = []);
const qtdNoCarrinho = (id) => (_carrinho().find(x => x.id === id) || {}).qtd || 0;
const totalCarrinhoPC = () => Math.round(_carrinho().reduce((s, x) => { const l = lojaPorId(x.id); return s + (l && l.custo_po != null ? l.custo_po * 100 * x.qtd : 0); }, 0));
function htmlCarrinho() {
    const itens = _carrinho().filter(x => lojaPorId(x.id)), total = totalCarrinhoPC(), tem = moedasEmPC(garantirFolha().moedas), falta = total - tem;
    const linhas = itens.map(x => { const l = lojaPorId(x.id), id = esc(x.id); return `<li><div class="car-nome"><b>${esc(nomeItem(l))}</b><small>${esc(fmtMoeda(l.custo_po))} cada</small></div><div class="car-qtd"><button type="button" class="sec mini" onclick="UI.carrinhoQtd('${id}', -1)" aria-label="Diminuir">-</button><span>${x.qtd}</span><button type="button" class="sec mini" onclick="UI.carrinhoQtd('${id}', 1)" aria-label="Aumentar">+</button><button type="button" class="perigo mini" onclick="UI.carrinhoRemover('${id}')" aria-label="Remover do carrinho">&times;</button></div><span class="car-sub">${esc(fmtMoeda(l.custo_po * x.qtd))}</span></li>`; }).join('');
    return `<button type="button" class="car-resumo" onclick="UI.carrinhoAlternar()" aria-expanded="${!!ui.carrinhoAberto}"><span>Carrinho (${itens.reduce((s, x) => s + x.qtd, 0)})</span><b>${esc(fmtMoeda(total / 100))}</b><span class="car-seta">${ui.carrinhoAberto ? '&#9660;' : '&#9650;'}</span></button><h4>Carrinho</h4>${itens.length ? `<ul class="car-lista">${linhas}</ul>` : '<p class="vazio">Nenhum item. Use "Adicionar" na lista ao lado.</p>'}
        <div class="car-total"><span>Total</span><b>${esc(fmtMoeda(total / 100))}</b></div><div class="car-total"><span>Suas moedas</span><b>${esc(fmtMoeda(tem / 100))}</b></div>
        ${itens.length && falta > 0 ? `<p class="car-falta">Faltam ${esc(fmtMoeda(falta / 100))} para comprar tudo.</p>` : ''}
        <div class="car-acoes"><button type="button" ${itens.length && falta <= 0 ? '' : 'disabled'} onclick="UI.carrinhoComprar()">Comprar</button><button type="button" class="sec" ${itens.length ? '' : 'disabled'} onclick="UI.carrinhoLimpar()">Esvaziar</button></div>`;
}
function _atualizarCarrinho() {
    const c = porId('loja-carrinho'); if (c) { c.innerHTML = htmlCarrinho(); c.classList.toggle('aberto', !!ui.carrinhoAberto); }
    const r = porId('loja-resultados'); if (r) r.innerHTML = htmlLojaResultados();
}
function _renderLojaFicha() {
    if (typeof document === 'undefined' || !document.body || !document.body.appendChild) return;
    let el = porId('loja-ficha');
    if (!el) {
        el = document.createElement('div'); el.id = 'loja-ficha'; el.className = 'janela-fundo'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
        el.innerHTML = '<div class="janela janela-larga"><div class="janela-corpo" id="loja-ficha-corpo"></div><div class="janela-rodape"><button type="button" class="sec" onclick="UI.fichaLojaFechar()">Fechar</button></div></div>';
        document.body.appendChild(el); if (document.body.classList) document.body.classList.add('janela-aberta');
    }
    porId('loja-ficha-corpo').innerHTML = ui.fichaModo === 'magicos' ? _htmlTopoMagicosFicha() + htmlMagicos() : _htmlTopoLojaFicha() + htmlLoja();
}
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.lojaFicha) UI.fichaLojaFechar(); });
// Editor do retrato: a foto é arrastada e ampliada dentro de um círculo; ao aplicar, guarda-se só o quadrado recortado (RET_SAIDA px).
const RET_VISTA = 260, RET_SAIDA = 512, RET_ZMAX = 4;
let _ret = null;
function _retEscala() { return (RET_VISTA / Math.min(_ret.img.width, _ret.img.height)) * _ret.z; }
function _retLimitar() {
    const s = _retEscala(), mx = Math.max(0, (_ret.img.width * s - RET_VISTA) / 2), my = Math.max(0, (_ret.img.height * s - RET_VISTA) / 2);
    _ret.x = Math.min(mx, Math.max(-mx, _ret.x)); _ret.y = Math.min(my, Math.max(-my, _ret.y));
}
function _retPintar(ctx, tam) {
    const s = _retEscala(), k = tam / RET_VISTA, w = _ret.img.width * s, h = _ret.img.height * s;
    if (_ret.alfa) ctx.clearRect(0, 0, tam, tam); else { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tam, tam); }
    ctx.drawImage(_ret.img, (RET_VISTA / 2 + _ret.x - w / 2) * k, (RET_VISTA / 2 + _ret.y - h / 2) * k, w * k, h * k);
}
// PNG com partes transparentes: o recorte mantém o canal alfa (a ficha mostra o papel por trás).
function _temAlfa(img) {
    const n = 96, cv = document.createElement('canvas'); cv.width = cv.height = n; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, n, n);
    const d = ctx.getImageData(0, 0, n, n).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true; return false;
}
function _retDesenhar() {
    const cv = porId('ret-cv'); if (!cv || !_ret) return; const ctx = cv.getContext('2d'), c = RET_VISTA / 2;
    if (_ret.alfa) { ctx.fillStyle = '#e9dfc2'; ctx.fillRect(0, 0, RET_VISTA, RET_VISTA); const q = RET_VISTA / 26; ctx.fillStyle = '#ded3b2'; for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) if ((i + j) % 2) ctx.fillRect(i * q, j * q, q, q); }
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = RET_VISTA; _retPintar(tmp.getContext('2d'), RET_VISTA); ctx.drawImage(tmp, 0, 0);
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.rect(0, 0, RET_VISTA, RET_VISTA); ctx.arc(c, c, c - 3, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore();
    ctx.strokeStyle = '#d8b45c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c, c, c - 3, 0, Math.PI * 2); ctx.stroke();
}
function _retReduzida(img, alfa) {
    let m = 900, url;
    do {
        const k = Math.min(1, m / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        const ctx = cv.getContext('2d'); if (!alfa) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); }
        ctx.drawImage(img, 0, 0, cv.width, cv.height); url = alfa ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.9); m = Math.round(m * 0.75);
    } while (url.length > 900000 && m > 300);
    return url;
}
function _retAbrir(img, pos, orig) {
    const el = porId('f-ret-ed'); if (!el) return;
    _ret = { img, x: 0, y: 0, z: 1, alfa: _temAlfa(img), orig: orig || null };
    if (pos) { _ret.x = Number(pos.x) || 0; _ret.y = Number(pos.y) || 0; _ret.z = Math.min(RET_ZMAX, Math.max(1, Number(pos.z) || 1)); _retLimitar(); }
    el.innerHTML = `<div class="ret-ed"><canvas id="ret-cv" width="${RET_VISTA}" height="${RET_VISTA}" tabindex="0" aria-label="Posição da foto: arraste ou use as setas"></canvas>
        <div class="ret-ctl"><p class="meta">Arraste a foto para centralizar no círculo. Zoom pelo controle ou pela roda do mouse; as setas movem de pouco em pouco.</p>
        <label class="aj-campo">Zoom<input type="range" id="ret-z" min="1" max="${RET_ZMAX}" step="0.01" value="${_ret.z}" oninput="UI.fretratoZoom(this.value)"></label>
        <div class="aj-linha"><button type="button" class="mini" onclick="UI.fretratoAplicar()">Aplicar</button><button type="button" class="sec mini" onclick="UI.fretratoCancelar()">Cancelar</button></div></div></div>`;
    const cv = porId('ret-cv'); let ult = null;
    cv.addEventListener('pointerdown', e => { ult = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!ult || !_ret) return; const k = RET_VISTA / cv.getBoundingClientRect().width; _ret.x += (e.clientX - ult[0]) * k; _ret.y += (e.clientY - ult[1]) * k; ult = [e.clientX, e.clientY]; _retLimitar(); _retDesenhar(); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { ult = null; }));
    cv.addEventListener('wheel', e => { e.preventDefault(); if (!_ret) return; _ret.z = Math.min(RET_ZMAX, Math.max(1, _ret.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))); porId('ret-z').value = _ret.z; _retLimitar(); _retDesenhar(); }, { passive: false });
    cv.addEventListener('keydown', e => { const d = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }[e.key]; if (!d || !_ret) return; e.preventDefault(); _ret.x += d[0]; _ret.y += d[1]; _retLimitar(); _retDesenhar(); });
    _retDesenhar(); el.scrollIntoView({ block: 'nearest' });
}
Object.assign(UI, {
    fichaLoja() { ui.lojaFicha = true; ui.fichaModo = 'loja'; if (ui.carrinhoDe !== ui.idSalvo) { ui.carrinho = []; ui.carrinhoDe = ui.idSalvo; } if (!ui.loja.cat) ui.loja.cat = 'arma'; _renderLojaFicha(); },
    fichaMagicos() { ui.lojaFicha = true; ui.fichaModo = 'magicos'; _renderLojaFicha(); },
    fichaLojaFechar() { ui.lojaFicha = false; const el = porId('loja-ficha'); if (el && el.remove) el.remove(); if (typeof document !== 'undefined' && document.body && document.body.classList) document.body.classList.remove('janela-aberta'); },
    fichaLojaComprar(id) {
        if (String(id).startsWith('magico-')) {
            const m = (db.magicos || []).find(x => x.id === id); if (!m) return;
            const ja = !m.sint && charState.inventario.find(i => i.ref === m.id && i.origem === 'ficha');
            if (ja) ja.qtd++; else charState.inventario.push(itemDeLoja(m, { origem: 'ficha', ...(m.ua ? { ua: true } : {}) }));
            avisar(`${nomeItem(m)} adicionado aos itens mágicos.`); _persistirFicha(); return;
        }
        const l = lojaPorId(id); if (!l) return; const e = compraNaFicha(l); if (e) return avisar(e, true);
        _persistirFicha();
        const f = garantirFolha(), mo = porId('f-aj-moedas'); if (mo) mo.innerHTML = Object.keys(NOME_MOEDA).map(k => `<label class="aj-campo">${NOME_MOEDA[k]}<input type="number" min="0" value="${f.moedas[k] || 0}" onchange="UI.fmoeda('${k}', this.value)"></label>`).join('');
        const t = porId('loja-ficha-moedas'); if (t) t.outerHTML = _htmlTopoLojaFicha().match(/<span.*<\/span>/)[0];
        const r = porId('loja-resultados'); if (r) r.innerHTML = htmlLojaResultados();
    },
    carrinhoAdd(id) {
        const l = lojaPorId(id); if (!l || l.custo_po == null) return;
        const x = _carrinho().find(y => y.id === id); if (x) x.qtd++; else _carrinho().push({ id, qtd: 1 });
        avisar(`${nomeItem(l)} adicionado ao carrinho.`); _atualizarCarrinho();
    },
    carrinhoQtd(id, d) { const c = _carrinho(), x = c.find(y => y.id === id); if (!x) return; x.qtd += d; if (x.qtd <= 0) c.splice(c.indexOf(x), 1); _atualizarCarrinho(); },
    carrinhoRemover(id) { ui.carrinho = _carrinho().filter(x => x.id !== id); _atualizarCarrinho(); },
    carrinhoLimpar() { ui.carrinho = []; _atualizarCarrinho(); },
    carrinhoAlternar() { ui.carrinhoAberto = !ui.carrinhoAberto; _atualizarCarrinho(); },
    carrinhoComprar() {
        const c = _carrinho().filter(x => lojaPorId(x.id)); if (!c.length) return;
        const total = totalCarrinhoPC(); if (total > moedasEmPC(garantirFolha().moedas)) return avisar('Moedas insuficientes para comprar tudo.', true);
        let n = 0, erro = null;
        for (const x of c) { const l = lojaPorId(x.id); for (let k = 0; k < x.qtd && !erro; k++) { erro = compraNaFicha(l); if (!erro) n++; } if (erro) break; }
        ui.carrinho = [];
        if (erro) avisar(`${erro} (${n} item(ns) comprado(s) antes).`, true); else avisar(`Compra realizada: ${n} item(ns) por ${fmtMoeda(total / 100)}.`);
        _persistirFicha();
        const f = garantirFolha(), mo = porId('f-aj-moedas'); if (mo) mo.innerHTML = Object.keys(NOME_MOEDA).map(k => `<label class="aj-campo">${NOME_MOEDA[k]}<input type="number" min="0" value="${f.moedas[k] || 0}" onchange="UI.fmoeda('${k}', this.value)"></label>`).join('');
        const t = porId('loja-ficha-moedas'); if (t) t.outerHTML = _htmlTopoLojaFicha().match(/<span.*<\/span>/)[0];
        _atualizarCarrinho();
    },
    fqtd(id, d) { const i = charState.inventario.find(x => String(x.id) === String(id)); if (!i) return; i.qtd = Math.max(0, (i.qtd || 0) + d); _persistirFicha(); },
    fqtdSet(id, v) { const i = charState.inventario.find(x => String(x.id) === String(id)); if (!i) return; i.qtd = Math.max(0, Math.floor(Number(v)) || 0); _persistirFicha(); },
    fmoeda(k, v) { const f = garantirFolha(); if (!(k in f.moedas)) return; f.moedas[k] = Math.max(0, Math.floor(Number(v)) || 0); _persistirFicha(); },
    ftabela(i, on) { const t = tabelasDaFicha()[i]; if (!t) return; const f = garantirFolha(); f.tabelas = f.tabelas || {}; if (on) f.tabelas[t.chave] = true; else delete f.tabelas[t.chave]; _persistirFicha(); },
    fcampo(k, v) { const f = garantirFolha(); if (!(k in f)) return; f[k] = String(v); if (k === 'historia') f.historiaEditada = true; _persistirFicha(); },
    // Digitando: a caixa cresce com o texto e a ficha se atualiza logo depois de parar de digitar.
    fcampoVivo(k, el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; clearTimeout(_tmrFicha); _tmrFicha = setTimeout(() => UI.fcampo(k, el.value), 350); },
    fitemAdd() {
        const nome = (porId('novo-item-nome').value || '').trim(); if (!nome) { avisar('Dê um nome ao item.', true); return; }
        const qtd = Math.max(1, Math.floor(Number(porId('novo-item-qtd').value)) || 1), kg = Math.max(0, Number(porId('novo-item-peso').value) || 0);
        charState.inventario.push({ id: novoIdInv(), ref: null, cat: 'personalizado', nome, nome_en: '', qtd, custo: 0, peso_lb: +(kg / 0.45359237).toFixed(3), mec: null, desc: (porId('novo-item-desc').value || '').trim(), origem: 'personalizado' });
        _persistirFicha(); ['novo-item-nome', 'novo-item-desc'].forEach(id => { porId(id).value = ''; });
    },
    fitemRemover(id, confirmado) {
        if (!confirmado) { ui.fichaRemoveItem = id == null ? null : String(id); _persistirFicha(); return; }
        const k = charState.inventario.findIndex(x => String(x.id) === String(id)); ui.fichaRemoveItem = null;
        if (k >= 0) { if (String(ui.fichaEditaItem) === String(id)) ui.fichaEditaItem = null; charState.inventario.splice(k, 1); }
        _persistirFicha();
    },
    fitemEditar(id) { ui.fichaEditaItem = id == null ? null : String(id); _persistirFicha(); },
    fitemSalvar(id) {
        const i = charState.inventario.find(x => String(x.id) === String(id)); if (!i) return;
        const nome = (porId('ei-nome').value || '').trim().slice(0, 80), obs = (porId('ei-obs').value || '').trim().slice(0, 120), bonus = porId('ei-bonus');
        if (nome && nome !== i.nome) i.apelido = nome; else delete i.apelido;
        if (i.cat === 'personalizado') i.desc = obs; else if (obs) i.obs = obs; else delete i.obs;
        if (bonus && _podeMelhorar(i)) i.bonus_magico = parseInt(bonus.value, 10) || 0;
        ui.fichaEditaItem = null; _persistirFicha();
    },
    fsintonia(id) {
        const i = charState.inventario.find(x => String(x.id) === String(id)); if (!i || !i.sint) return;
        if (!i.sintonizado && totalSintonizados() >= MAX_SINTONIAS) { _persistirFicha(); return avisar(`Você só pode estar sintonizado a ${MAX_SINTONIAS} itens mágicos ao mesmo tempo.`, true); }
        i.sintonizado = !i.sintonizado; _persistirFicha();
    },
    fvariante(id, v) { const i = charState.inventario.find(x => String(x.id) === String(id)); if (i) { i.variante = parseInt(v, 10) || 0; _persistirFicha(); } },
    fretrato(input) {
        const f = input.files && input.files[0]; if (!f) return; const rd = new FileReader();
        rd.onload = () => { const img = new Image(); img.onload = () => { input.value = ''; _retAbrir(img); }; img.onerror = () => avisar('Não foi possível ler a imagem.', true); img.src = rd.result; };
        rd.readAsDataURL(f);
    },
    fretratoZoom(v) { if (_ret) { _ret.z = Math.min(RET_ZMAX, Math.max(1, Number(v) || 1)); _retLimitar(); _retDesenhar(); } },
    fretratoAplicar() {
        if (!_ret) return; const cv = document.createElement('canvas'); cv.width = cv.height = RET_SAIDA; _retPintar(cv.getContext('2d'), RET_SAIDA);
        charState.retrato = _ret.alfa ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.88);
        charState.retratoOrig = _ret.orig || _retReduzida(_ret.img, _ret.alfa); charState.retratoPos = { x: +_ret.x.toFixed(2), y: +_ret.y.toFixed(2), z: +_ret.z.toFixed(3) }; _ret = null; _persistirFicha(); renderTudo();
    },
    fretratoCancelar() { _ret = null; const el = porId('f-ret-ed'); if (el) el.innerHTML = ''; },
    fretratoEditar() {
        if (ui.fichaJanela !== 'geral') { ui.fichaJanela = 'geral'; _atualizarJanelaFicha(); }
        if (!charState.retrato) { const inp = document.querySelector('.aj-retrato input[type=file]'); if (inp) inp.click(); return; }
        // Com o original guardado, a foto pode ser reposicionada à vontade; fotos antigas só têm o recorte.
        const img = new Image(); img.onload = () => (charState.retratoOrig ? _retAbrir(img, charState.retratoPos, charState.retratoOrig) : _retAbrir(img));
        img.onerror = () => avisar('Não foi possível abrir a foto.', true); img.src = charState.retratoOrig || charState.retrato;
    },
    fretratoRemover() { charState.retrato = null; charState.retratoOrig = null; charState.retratoPos = null; _persistirFicha(); renderTudo(); },
    fichaAba(k) { ui.fichaJanela = k; _atualizarJanelaFicha(); },
    fichaFundo(ligado) { ui.fichaSemFundo = !!ligado; porId('ficha-previa').classList.toggle('sem-fundo', !!ligado); },
    imprimirFicha() { ajustarTextosFicha(); window.print(); }
});
