// Janela de detalhes e escolhas (telas estreitas: celular e tablet) para raça, classe, subclasse e antecedente.
// No computador os detalhes ficam no painel lateral.
const JANELA_TITULO_ESCOLHAS = { raca: 'Escolhas da raça', antecedente: 'Escolhas do antecedente' };
const JANELA_VAZIO = { raca: 'Esta raça não exige escolhas adicionais.', antecedente: 'Este antecedente não exige escolhas adicionais.' };

function conteudoJanela() {
    const j = ui.janela;
    if (j.tipo === 'raca') return detalheRaca(charState.raca, true) + htmlEscolhasJanela('raca');
    if (j.tipo === 'antecedente') return detalheAntecedente(charState.antecedente) + htmlEscolhasJanela('antecedente');
    if (j.tipo === 'classe') return detalheClasse(charState.classe);
    return detalheSubclasse(ui.subLista[j.i]);
}
function htmlEscolhasJanela(cat) {
    return `<h3 style="margin-top:1rem">${JANELA_TITULO_ESCOLHAS[cat]}</h3><div id="area-escolhas">${htmlEscolhasDe(cat, null, JANELA_VAZIO[cat])}</div>`;
}

function renderJanela() {
    if (typeof document === 'undefined' || !document.body || !document.body.appendChild) return;
    let el = porId('janela');
    if (!ui.janela) { if (el && el.remove) el.remove(); if (document.body.classList) document.body.classList.remove('janela-aberta'); return; }
    if (!el) {
        el = document.createElement('div'); el.id = 'janela'; el.className = 'janela-fundo';
        el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
        const botoes = ui.janela.leitura
            ? '<button type="button" class="sec" onclick="UI.janelaCancelar()">Fechar</button>'
            : '<button type="button" class="perigo" onclick="UI.janelaCancelar()">Cancelar</button><button type="button" onclick="UI.janelaProsseguir()">Prosseguir</button>';
        el.innerHTML = `<div class="janela"><div class="janela-corpo" id="janela-corpo"></div><div class="janela-rodape"><span class="msg" id="janela-msg"></span>${botoes}</div></div>`;
        document.body.appendChild(el); document.body.classList.add('janela-aberta');
    }
    const corpo = porId('janela-corpo'), topo = corpo.scrollTop;
    redesenharEscolhas('janela-corpo', conteudoJanela);
    corpo.scrollTop = topo;
    porId('janela-msg').textContent = '';
}

const copia = (o) => Object.assign({}, o);
UI.abrirJanela = function (tipo, i) {
    if (tipo === 'raca') {
        const antes = { raca: charState.raca, escolhas: copia(charState.escolhas.raca) };
        if (charState.raca !== db.racas[i]) { charState.raca = db.racas[i]; charState.escolhas.raca = {}; }
        ui.janela = { tipo, antes };
    } else if (tipo === 'classe') {
        const antes = { classe: charState.classe, escolhas: copia(charState.escolhas.classe), subFixo: ui.subFixo };
        if (charState.classe !== db.classes[i]) { charState.classe = db.classes[i]; charState.escolhas.classe = {}; ui.subFixo = null; }
        ui.janela = { tipo, antes };
    } else if (tipo === 'antecedente') {
        const antes = { antecedente: charState.antecedente, escolhas: copia(charState.escolhas.antecedente), justificativas: copia(charState.justificativas) };
        if (charState.antecedente !== db.antecedentes[i]) { const a = db.antecedentes[i]; a.conteudo = a.proficiencias_extras; charState.antecedente = a; charState.escolhas.antecedente = {}; charState.justificativas = {}; }
        ui.janela = { tipo, antes };
    } else if (tipo === 'subclasse') {
        const s = subclasseInfo(); if (!s) return;
        if (!s.liberada) { ui.janela = { tipo, i, leitura: true }; renderJanela(); return; }
        const antes = { escolhas: copia(charState.escolhas.classe) };
        registrarSelecao('classe', s.escolha, [opcoesDaEscolha('classe', s.escolha, s.escolha.id).opcoes[i]]);
        ui.janela = { tipo, i, antes };
    }
    ui.foco[tipo] = null;
    aposMudanca();
};
UI.janelaCancelar = function () {
    const j = ui.janela; if (!j) return;
    if (j.leitura) { ui.janela = null; renderJanela(); return; }
    if (j.tipo === 'raca') { charState.raca = j.antes.raca; charState.escolhas.raca = j.antes.escolhas; }
    else if (j.tipo === 'classe') { charState.classe = j.antes.classe; charState.escolhas.classe = j.antes.escolhas; ui.subFixo = j.antes.subFixo; }
    else if (j.tipo === 'antecedente') { charState.antecedente = j.antes.antecedente; charState.escolhas.antecedente = j.antes.escolhas; charState.justificativas = j.antes.justificativas; }
    else if (j.tipo === 'subclasse') charState.escolhas.classe = j.antes.escolhas;
    ui.janela = null; aposMudanca();
};
UI.janelaProsseguir = function () {
    const m = validarEtapa(ui.etapa);
    if (m.length) { const el = porId('janela-msg'); if (el) el.textContent = m[0]; return; }
    ui.janela = null; renderJanela(); UI.continuar();
};
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.janela) UI.janelaCancelar(); });
    if (window.matchMedia) window.matchMedia('(max-width: 1120px)').addEventListener('change', () => { ui.janela = null; if (ui.tela === 'criacao') renderTudo(); });
}
