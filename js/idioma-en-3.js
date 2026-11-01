// Dicionário da interface, lote 3: etapas (detalhes de classe, atributos, escolhas, revisão), cálculos e avisos.
(() => {
    const T = (s) => { const r = Idioma.traduzirTexto(s); return r == null ? s : r; };
    const ord = (n) => { n = +n; const r = n % 100; return n + (r >= 11 && r <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'); };
    const ordTxt = (s) => s.replace(/(\d+)º/g, (m, n) => ord(n));
    const abrev = (s) => s.replace(/\bDes\b/g, 'Dex').replace(/\bSab\b/g, 'Wis').replace(/\bCar\b/g, 'Cha').replace(/\bFor\b/g, 'Str').replace(/máx\./g, 'max.').replace(/mágico/g, 'magic');

    Idioma.adicionar({
        // classe e subclasse
        'Pesquisar classe...': 'Search class...',
        '(exige escolha)': '(requires a choice)',
        'Nível inicial do personagem': 'Starting level of the character',
        'O personagem é criado já neste nível. A subclasse é escolhida quando a classe a concede; antes disso você poderá escolher ao subir de nível.': 'The character is created already at this level. The subclass is chosen when the class grants it; before that you can choose when leveling up.',
        'Este personagem tem mais de uma classe: os níveis sobem pela ficha, em "Subir de nível". Aqui se troca só a classe principal.': 'This character has more than one class: levels go up from the sheet, under "Level up". Here only the main class is changed.',
        'Classes:': 'Classes:',
        // atributos
        'Pontos restantes:': 'Points remaining:',
        // magias e escolhas
        'Magias': 'Spells', 'Magia': 'Spellcasting', 'Truques': 'Cantrips',
        'Esta classe não escolhe magias neste nível.': 'This class does not choose spells at this level.',
        'Magias preparadas': 'Prepared spells', 'Magias conhecidas': 'Known spells', 'Grimório': 'Spellbook',
        'Magias copiadas para o grimório.': 'Spells copied into the spellbook.',
        'Escolhidas entre as magias do grimório.': 'Chosen from the spells in the spellbook.',
        'Espaços:': 'Slots:', 'Habilidade:': 'Ability:', 'CD:': 'DC:', 'Ataque:': 'Attack:',
        'Sem escolhas adicionais de classe neste nível.': 'No additional class choices at this level.',
        // revisão
        'Ainda falta decidir': 'Still to decide', 'Tudo definido': 'All set',
        'abaixo': 'below', 'Gerar nome': 'Generate name', 'Digite o nome': 'Enter the name', 'Salvar personagem': 'Save character',
        'Identidade': 'Identity', 'Combate': 'Combat', 'Salvaguardas': 'Saving throws', 'Ataques': 'Attacks',
        'Iniciativa:': 'Initiative:', 'Deslocamento:': 'Speed:',
        'Antecedente personalizado': 'Custom background', 'Avisos de equipamento': 'Equipment warnings',
        'Equipamento de:': 'Equipment of:',
        'Ataque desarmado': 'Unarmed strike',
        // fontes de bônus (CA, PV, deslocamento)
        'Escudo': 'Shield', 'Raça (base)': 'Race (base)',
        'Item mágico (sem armadura e sem escudo)': 'Magic item (no armor and no shield)',
        'Estilo de Luta: Defesa': 'Fighting Style: Defense', 'Estilo de Luta: Marinheiro': 'Fighting Style: Mariner',
        'Talento Robusto': 'Tough feat', 'Talento Mobilidade': 'Mobile feat',
        'Movimento Rápido': 'Fast Movement', 'Movimento sem Armadura': 'Unarmored Movement', 'Mobilidade Superior': 'Superior Mobility',
        'Explorador Hábil: Errante': 'Deft Explorer: Roving',
        'Armadura pesada sem a Força exigida': 'Heavy armor without the required Strength'
    });

    // classe e subclasse
    Idioma.padrao(/^Características até o nível (\d+)$/, 'Features up to level $1');
    Idioma.padrao(/^Subclasse no nível (\d+)$/, 'Subclass at level $1');
    Idioma.padrao(/^(.+) escolhe a subclasse no nível (\d+), e o personagem está no nível (\d+)\. Você poderá escolher ao subir de nível\. Clique em uma opção para ler o que ela faz\.$/,
        (m, nome, a, b) => T(nome) + ' chooses the subclass at level ' + a + ', and the character is at level ' + b + '. You can choose when leveling up. Click an option to read what it does.');
    Idioma.padrao(/^Conjuração no nível (\d+)$/, 'Spellcasting at level $1');
    Idioma.padrao(/^(prepara magias após cada descanso longo|grimório e magias preparadas|magias conhecidas)(; conjura rituais)?$/,
        (m, a, r) => ({ 'prepara magias após cada descanso longo': 'prepares spells after each long rest', 'grimório e magias preparadas': 'spellbook and prepared spells', 'magias conhecidas': 'known spells' })[a] + (r ? '; casts rituals' : ''));
    Idioma.padrao(/^Habilidade de conjuração: (.+?)\. Espaços de magia: (.+)\.$/,
        (m, a, s) => 'Spellcasting ability: ' + T(a) + '. Spell slots: ' + (s === 'nenhum' ? 'none' : ordTxt(s)) + '.');
    Idioma.padrao(/^Já preparadas pela subclasse: (.+)\.$/, (m, l) => 'Already prepared by the subclass: ' + (l === 'nenhuma' ? 'none' : T(l)) + '.');
    Idioma.padrao(/^(\d+º: \d+(?: \| \d+º: \d+)*)$/, (m, s) => ordTxt(s));
    Idioma.padrao(/^(\d+)º círculo( · .*)?$/, (m, n, r) => ord(n) + ' level' + (r || ''));
    // linhas de magia por nível em "Características" da classe
    Idioma.padrao(/^Magia nível 0 \(cantrip\): (\d+)$/, 'Cantrips known: $1');
    Idioma.padrao(/^Magia nível (\d+): (.+)$/, (m, n, r) => 'Level ' + n + ' spells: ' + r
        .replace(/Modificador de (\p{L}+)/gu, (x, a) => T(a) + ' modifier')
        .replace(/\(magias preparadas a partir de um grimório com (\d+) magias\)/, '(spells prepared from a spellbook with $1 spells)')
        .replace(/\(magias preparadas; mínimo de (\d+)\)/, '(prepared spells; minimum of $1)').replace('(magias preparadas)', '(prepared spells)').replace('(magias conhecidas)', '(known spells)')
        .replace('+ magias do Domínio', '+ domain spells').replace(/magias/g, 'spells'));
    // "Nome (d8) (English (d8))": usa só o inglês
    Idioma.padrao(/^[^(),]+ \([^()]*\) \(([^()]+ \([^()]*\))\)$/, '$1');

    // atributos
    Idioma.padrao(/^: (.+)$/, (m, r) => ': ' + T(r));
    Idioma.padrao(/^(Diminuir|Aumentar) (.+)$/, (m, a, n) => (a === 'Diminuir' ? 'Decrease ' : 'Increase ') + T(n));

    // escolhas pendentes e contagens
    Idioma.padrao(/^(.+) \((\d+)\/(\d+)\)$/, (m, x, a, b) => T(x) + ' (' + a + '/' + b + ')');

    // revisão
    Idioma.padrao(/^(\(dado de vida d)(\d+|\?)(; valor fixo por nível após o 1º\))$/, '(hit die d$2; fixed value per level after the 1st)');
    Idioma.padrao(/^(\d+(?:,\d+)?) m \((\d+) pés\)$/, '$2 ft.');
    Idioma.padrao(/^([^\d+\-|:()]+?) ([+-]\d+)( \((?:proficiente|especialista)\))?$/, (m, x, v, p) => T(x) + ' ' + v + (p ? (/prof/.test(p) ? ' (proficient)' : ' (expert)') : ''));
    Idioma.padrao(/^([+-]\d+) \| (.+)$/, (m, b, d) => b + ' | ' + d.replace(/\bcort\./g, 'slash.').replace(/\bperf\./g, 'pierc.').replace(/\bcont\./g, 'bludg.')
        .replace('sem armas/escudo', 'no weapons/shield').replace('(arremessada:', '(thrown:'));
    Idioma.padrao(/^Base: (.+)$/, (m, s) => {
        const fixos = {
            'Sem armadura: 10 + Des': 'Unarmored: 10 + Dex',
            'Defesa sem Armadura do Bárbaro: 10 + Des + Con': 'Barbarian Unarmored Defense: 10 + Dex + Con',
            'Defesa sem Armadura do Monge: 10 + Des + Sab': 'Monk Unarmored Defense: 10 + Dex + Wis',
            'Resiliência Dracônica: 13 + Des': 'Draconic Resilience: 13 + Dex',
            'Sem armadura: 10 + Des (o escudo anula a Defesa sem Armadura do Monge)': 'Unarmored: 10 + Dex (the shield cancels the Monk\'s Unarmored Defense)'
        };
        if (fixos[s]) return 'Base: ' + fixos[s];
        const i = s.indexOf(': ');
        return 'Base: ' + (i < 0 ? T(s) : T(s.slice(0, i)) + ': ' + abrev(s.slice(i + 2)));
    });
    Idioma.padrao(/^Bônus: (.+)$/, (m, s) => 'Bonus: ' + s.split('; ').map(p => {
        const x = /^(.*?) ([+-]\d+)$/.exec(p); const n = x ? x[1] : p;
        return T(n.replace(/^Escudo( \+\d+) mágico$/, 'Shield$1 magic')) + (x ? ' ' + x[2] : '');
    }).join('; '));

    // avisos de equipamento
    Idioma.adicionar({
        'Acesso a truques e magias de Artífice, usando Inteligência como atributo de conjuração.': 'Access to Artificer cantrips and spells, using Intelligence as the spellcasting ability.',
        'Acesso a truques e magias de Bardo, usando Carisma.': 'Access to Bard cantrips and spells, using Charisma.',
        'Acesso a truques e magias, preparando uma nova lista a cada descanso longo (usa Sabedoria).': 'Access to cantrips and spells, preparing a new list after each long rest (uses Wisdom).',
        'Escolha de subclasse, que reflete o aspecto da divindade que você serve. Isso garante magias de domínio permanentemente preparadas e habilidades únicas obtidas já no 1º nível.': 'Choice of subclass, which reflects the aspect of the deity you serve. It grants permanently prepared domain spells and unique abilities gained as early as 1st level.',
        'Ação bônus para recuperar 1d10 + nível de guerreiro em pontos de vida (1 uso por descanso curto/longo).': 'Bonus action to regain 1d10 + fighter level in hit points (1 use per short/long rest).',
        'Como uma ação, detecta celestiais, corruptores ou mortos-vivos a até 18 metros.': 'As an action, detects celestials, fiends, or undead within 60 feet.',
        'Acesso a truques e magias através da sua magia inata (usa Carisma). Diferente de Magos e Clérigos, você conhece um número fixo de magias e não precisa prepará-las.': 'Access to cantrips and spells through your innate magic (uses Charisma). Unlike Wizards and Clerics, you know a fixed number of spells and do not need to prepare them.',
        'Um sistema de conjuração único onde todos os seus espaços de magia são do mesmo nível máximo e se recuperam após um descanso curto ou longo (usa Carisma).': 'A unique casting system where all of your spell slots are of the same maximum level and are regained after a short or long rest (uses Charisma).',
        'Uso de grimório para preparar magias (usa Inteligência).': 'Use of a spellbook to prepare spells (uses Intelligence).',
        'Maldições conhecidas (1 no nível 1; mais 1 nos níveis 6, 10, 14 e 18).': 'Known curses (1 at level 1; 1 more at levels 6, 10, 14, and 18).',
        'nenhum ainda': 'none yet',
        '(proficiente)': '(proficient)', '(especialista)': '(expert)',
        'Truques:': 'Cantrips:', 'Desligar todos': 'Turn all off', 'Pesquisar antecedente...': 'Search background...'
    });
    Idioma.padrao(/^Começa no nível (\d+)\. Habilidade: (.+)\.$/, (m, n, a) => 'Starts at level ' + n + '. Ability: ' + T(a) + '.');
    Idioma.padrao(/^(\d+) espaço\(s\) de (\d+)º círculo \(Magia de Pacto\)$/, (m, q, n) => q + ' slot(s) of ' + ord(n) + ' level (Pact Magic)');
    Idioma.padrao(/^Truques da lista de (.+)\.$/, (m, c) => 'Cantrips from the ' + T(c) + ' list.');
    Idioma.padrao(/^de (\d+)$/, 'of $1');
    Idioma.padrao(/^([+-]\d+) \((proficiente|especialista)\)$/, (m, v, p) => v + (p === 'proficiente' ? ' (proficient)' : ' (expert)'));
    Idioma.adicionarTrechos({ 'Truque': 'Cantrip' });
    Idioma.padrao(/^([^|]+?) \|$/, (m, x) => T(x) + ' |');
    Idioma.adicionar({
        'Importar arquivo': 'Import file', 'Criação em andamento': 'Creation in progress',
        'Continuar de onde parei': 'Continue where I left off', 'Descartar': 'Discard',
        'Nenhum personagem salvo ainda.': 'No saved characters yet.'
    });
    Idioma.padrao(/^Há um rascunho salvo em (.+)\.$/, 'A draft was saved on $1.');
    Idioma.padrao(/^(.+?) \| (.+) \| atualizado em (.+)$/, (m, r, c, d) => T(r) + ' | ' + c.split(' / ').map(p => { const x = /^(.+?) (\d+)(?: \((.+)\))?$/.exec(p); return x ? T(x[1]) + ' ' + x[2] + (x[3] ? ' (' + T(x[3]) + ')' : '') : p; }).join(' / ') + ' | updated on ' + d);
    Idioma.padrao(/^(.+): sem proficiência \(desvantagem em testes de For\/Des, ataques e salvaguardas; não conjura magias\)\.$/,
        (m, n) => T(n) + ': not proficient (disadvantage on Str/Dex checks, attack rolls and saving throws; cannot cast spells).');
    Idioma.padrao(/^(.+): exige For (\d+) \(deslocamento reduzido em 3 m\)\.$/, (m, n, f) => T(n) + ': requires Str ' + f + ' (speed reduced by 10 ft.).');
    Idioma.padrao(/^(.+): desvantagem em testes de Furtividade\.$/, (m, n) => T(n) + ': disadvantage on Stealth checks.');
    Idioma.padrao(/^Sintonia: (\d+) itens sintonizados \(máximo (\d+)\)\.$/, 'Attunement: $1 attuned items (maximum $2).');
    Idioma.padrao(/^(.+): exige sintonização \(marque "sintonizado" no inventário\) para valer na ficha\.$/, (m, n) => T(n) + ': requires attunement (check "attuned" in the inventory) to count on the sheet.');
    Idioma.padrao(/^(.+): sem proficiência \(sem bônus de proficiência no ataque\)\.$/, (m, n) => T(n) + ': not proficient (no proficiency bonus on the attack).');
})();
