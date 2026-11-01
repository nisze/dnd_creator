// Tema visual da tela (cor de destaque). Guardado em localStorage; as paletas ficam em css/estilo.css (:root[data-tema=...]).
(function () {
    'use strict';
    const CHAVE = 'dnd_tema';
    const TEMAS = [
        ['azul', 'Azul-aço'], ['violeta', 'Violeta arcano'], ['ouro', 'Dourado'],
        ['carmesim', 'Carmesim'], ['esmeralda', 'Esmeralda']
    ];
    let atual = 'azul';
    try { const s = localStorage.getItem(CHAVE); if (TEMAS.some(t => t[0] === s)) atual = s; } catch (e) { /* sem armazenamento */ }

    function aplicar() {
        const h = typeof document !== 'undefined' && document.documentElement;
        if (!h || typeof h.setAttribute !== 'function') return;
        if (atual === 'azul') h.removeAttribute('data-tema');
        else h.setAttribute('data-tema', atual);
    }
    function definir(id) {
        if (!TEMAS.some(t => t[0] === id)) return;
        atual = id;
        try { localStorage.setItem(CHAVE, id); } catch (e) { /* sem armazenamento */ }
        aplicar();
    }
    aplicar();

    function criarSeletor() {
        const nav = document.getElementById('menu-topo') || document.querySelector('.acoes-topo');
        if (!nav || document.getElementById('sel-tema')) return;
        if (typeof Idioma !== 'undefined') {
            const en = { 'Violeta arcano': 'Arcane violet', 'Dourado': 'Gold', 'Carmesim': 'Crimson', 'Esmeralda': 'Emerald', 'Azul-aço': 'Steel blue', 'Tema visual': 'Visual theme', 'Tema': 'Theme' };
            Idioma.adicionar(en);
        }
        // Lista suspensa só com bolinhas coloridas (sem nomes); o nome fica só no aria-label.
        const linha = document.createElement('div');
        linha.className = 'tema-linha'; linha.id = 'sel-tema';
        const rot = document.createElement('span'); rot.textContent = 'Tema';
        const caixa = document.createElement('div'); caixa.className = 'tema-sel';
        const atualBt = document.createElement('button');
        atualBt.type = 'button'; atualBt.className = 'tema-atual sec'; atualBt.setAttribute('aria-haspopup', 'listbox'); atualBt.setAttribute('aria-expanded', 'false'); atualBt.setAttribute('aria-label', 'Tema visual');
        const bolaAtual = document.createElement('i'); bolaAtual.className = 'tema-bola'; bolaAtual.dataset.cor = atual;
        const seta = document.createElement('span'); seta.className = 'tema-seta';
        atualBt.appendChild(bolaAtual); atualBt.appendChild(seta);
        const lista = document.createElement('div'); lista.className = 'tema-lista'; lista.setAttribute('role', 'listbox'); lista.hidden = true;
        const abrir = (v) => { lista.hidden = !v; atualBt.setAttribute('aria-expanded', String(v)); };
        TEMAS.forEach(([id, nome]) => {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'tema-op'; b.setAttribute('role', 'option'); b.setAttribute('aria-label', nome); b.setAttribute('aria-selected', String(id === atual));
            const i = document.createElement('i'); i.className = 'tema-bola'; i.dataset.cor = id;
            b.appendChild(i);
            b.addEventListener('click', (e) => {
                e.stopPropagation(); definir(id); bolaAtual.dataset.cor = id;
                lista.querySelectorAll('.tema-op').forEach(x => x.setAttribute('aria-selected', String(x === b)));
                abrir(false);
            });
            lista.appendChild(b);
        });
        atualBt.addEventListener('click', (e) => { e.stopPropagation(); abrir(lista.hidden); });
        document.addEventListener('click', (e) => { if (!caixa.contains(e.target)) abrir(false); });
        caixa.appendChild(atualBt); caixa.appendChild(lista);
        linha.appendChild(rot); linha.appendChild(caixa);
        nav.appendChild(linha);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', criarSeletor); else criarSeletor();

    window.Tema = { definir, get atual() { return atual; }, temas: TEMAS };
})();
