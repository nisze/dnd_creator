// Inglês: textos de raças que estão em português nos dados (Nome, Descrição e Resumo dos traços).
// Padrões para os textos formulaicos (atributos, idiomas, perícias, deslocamento, visão no escuro) + dicionário dos traços do PHB.
(() => {
    const ATR = { 'Força': 'Strength', 'Destreza': 'Dexterity', 'Constituição': 'Constitution', 'Inteligência': 'Intelligence', 'Sabedoria': 'Wisdom', 'Carisma': 'Charisma' };
    const PER = { 'Percepção': 'Perception', 'Atletismo': 'Athletics', 'Intimidação': 'Intimidation', 'Sobrevivência': 'Survival', 'Furtividade': 'Stealth', 'Atuação': 'Performance', 'Acrobacia': 'Acrobatics', 'Lidar com Animais': 'Animal Handling', 'História': 'History', 'Enganação': 'Deception', 'Prestidigitação': 'Sleight of Hand', 'Persuasão': 'Persuasion', 'Arcanismo': 'Arcana', 'Medicina': 'Medicine', 'Natureza': 'Nature', 'Religião': 'Religion', 'Intuição': 'Insight', 'Investigação': 'Investigation' };
    const IDI = { 'Comum': 'Common', 'Élfico': 'Elvish', 'Anão': 'Dwarvish', 'Dracônico': 'Draconic', 'Orc': 'Orc', 'Gigante': 'Giant', 'Gnômico': 'Gnomish', 'Goblinóide': 'Goblin', 'Halfling': 'Halfling', 'Infernal': 'Infernal', 'Abissal': 'Abyssal', 'Celestial': 'Celestial', 'Primordial': 'Primordial', 'Silvestre': 'Sylvan', 'Auran': 'Auran', 'Aquan': 'Aquan', 'Gith': 'Gith', 'Minotaur': 'Minotaur', 'Vedalken': 'Vedalken', 'Quori': 'Quori', 'Keldon': 'Keldon', 'Khenra': 'Khenra', 'Leonin': 'Leonin', 'Loxodon': 'Loxodon', 'Merfolk': 'Merfolk', 'Naga': 'Naga', 'Siren': 'Siren', 'Vampire': 'Vampire', 'Grung': 'Grung', 'Aarakocra': 'Aarakocra', 'Aven': 'Aven', 'Subterrâneo': 'Undercommon', 'Dialeto Subterrâneo': 'Undercommon' };
    const alt = (o) => Object.keys(o).sort((a, b) => b.length - a.length).join('|');
    const A = alt(ATR), P = alt(PER), I = alt(IDI);
    const listaIdi = '(?:' + I + ')(?:(?:, | e )(?:' + I + '))*';
    const trIdi = (s) => s.replace(new RegExp(I, 'g'), m => IDI[m]).replace(/ e /g, ' and ');
    const trAtr = (s) => s.replace(new RegExp(A, 'g'), m => ATR[m]);

    // distâncias: "9 metros (30 pés)" -> "30 ft."; "9 metros" -> "30 ft."
    const pes = (m, p) => p ? p : String(Math.round(parseFloat(m.replace(',', '.')) / 0.3 / 5) * 5);
    const dist = (s) => s
        .replace(/(\d+(?:,\d+)?) metros(?: \((\d+) pés\))?/g, (x, m, p) => pes(m, p) + ' ft.')
        .replace(/Natação:/g, 'Swim:').replace(/Voo:/g, 'Fly:').replace(/Escalada:/g, 'Climb:')
        .replace(/igual ao deslocamento/g, 'equal to your walking speed')
        .replace(/ft\.\./g, 'ft.');
    const D = '\\d+(?:,\\d+)?';

    // --- atributos ---
    Idioma.padrao(new RegExp('^((?:(?:' + A + ') \\+\\d(?:, )?)+)\\.?$'), (m, l) => trAtr(l) + (m.endsWith('.') ? '.' : ''));
    Idioma.padrao(new RegExp('^Aumenta ((?:(?:' + A + ') \\+\\d(?:, )?)+)\\.$'), (m, l) => 'Increases ' + trAtr(l) + '.');
    Idioma.padrao(new RegExp('^Aumenta (?:a |o )?(' + A + ') em (\\d)\\.$'), (m, a, n) => 'Increases ' + ATR[a] + ' by ' + n + '.');
    Idioma.padrao(new RegExp('^Aumenta (' + A + ') e (' + A + ')\\.$'), (m, a, b) => 'Increases ' + ATR[a] + ' and ' + ATR[b] + '.');
    // --- perícias ---
    Idioma.padrao(new RegExp('^Proficiência na perícia (' + P + ')\\.$'), (m, p) => 'Proficiency in the ' + PER[p] + ' skill.');
    Idioma.padrao(new RegExp('^Ganha proficiência na perícia (' + P + ')\\.$'), (m, p) => 'Gains proficiency in the ' + PER[p] + ' skill.');
    // --- idiomas ---
    Idioma.padrao(new RegExp('^(' + listaIdi + ')\\.$'), (m, l) => trIdi(l) + '.');
    Idioma.padrao(new RegExp('^Fala (?:os idiomas |idiomas |o idioma )?(' + listaIdi + ')\\.$'), (m, l) => 'Speaks ' + trIdi(l) + '.');
    // --- deslocamento e visão ---
    Idioma.padrao(new RegExp('^(' + D + ' metros(?: \\(\\d+ pés\\))?\\.?(?: (?:Natação|Voo|Escalada): [^.]*\\.?)?)$'), (m, s) => dist(s));
    Idioma.padrao(new RegExp('^Movimento base de (' + D + ' metros(?: \\(\\d+ pés\\))?)\\.$'), (m, s) => 'Base speed of ' + dist(s));
    Idioma.padrao(new RegExp('^Enxerga (' + D + ' metros(?: \\(\\d+ pés\\))?) no escuro\\.$'), (m, s) => 'Sees ' + dist(s) + ' in the dark.');

    Idioma.adicionar({
        // ---- nomes dos traços ----
        'Aumento no Valor de Habilidade': 'Ability Score Increase', 'Aumento de Habilidade': 'Ability Score Increase',
        'Tamanho': 'Size', 'Deslocamento': 'Speed', 'Visão no Escuro': 'Darkvision', 'Idiomas': 'Languages', 'Perícia': 'Skill',
        'Ancestralidade Feérica': 'Fey Ancestry', 'Treinamento com Armas Élficas': 'Elf Weapon Training', 'Talento': 'Feat',
        'Resiliência Anã': 'Dwarven Resilience', 'Treinamento em Combate Anão': 'Dwarven Combat Training',
        'Proficiência com Ferramentas': 'Tool Proficiency', 'Conhecimento de Rochas': 'Stonecunning', 'Tenacidade Anã': 'Dwarven Toughness',
        'Treinamento com Armaduras Anãs': 'Dwarven Armor Training', 'Sentidos Aguçados': 'Keen Senses', 'Transe': 'Trance',
        'Truque': 'Cantrip', 'Idioma Adicional': 'Extra Language', 'Pés Ligeiros': 'Fleet of Foot', 'Máscara da Natureza': 'Mask of the Wild',
        'Visão no Escuro Superior': 'Superior Darkvision', 'Sensibilidade à Luz Solar': 'Sunlight Sensitivity', 'Magia Drow': 'Drow Magic',
        'Treinamento com Armas Drow': 'Drow Weapon Training', 'Sorte': 'Lucky', 'Bravura': 'Brave', 'Agilidade Halfling': 'Halfling Nimbleness',
        'Furtividade Natural': 'Naturally Stealthy', 'Resiliência dos Robustos': 'Stout Resilience', 'Ancestralidade Dracônica': 'Draconic Ancestry',
        'Arma de Sopro': 'Breath Weapon', 'Resistência a Dano': 'Damage Resistance', 'Esperteza Gnômica': 'Gnome Cunning',
        'Ilusionista Nato': 'Natural Illusionist', 'Falar com Bestas Pequenas': 'Speak with Small Beasts', 'Conhecimento de Artífice': "Artificer's Lore",
        'Engenhoqueiro': 'Tinker', 'Versatilidade do Meio-Elfo': 'Skill Versatility', 'Truque de Mago': 'Wizard Cantrip', 'Ameaçador': 'Menacing',
        'Resistência Implacável': 'Relentless Endurance', 'Ataques Selvagens': 'Savage Attacks', 'Resistência Infernal': 'Hellish Resistance',
        'Legado Infernal': 'Infernal Legacy', 'Proficiência em Perícia': 'Skill Proficiency',

        // ---- descrições ----
        '+1 em um valor de habilidade à sua escolha.': '+1 to one ability score of your choice.',
        '+2 em um valor de habilidade à sua escolha.': '+2 to one ability score of your choice.',
        '+1 em um valor de habilidade diferente à sua escolha.': '+1 to a different ability score of your choice.',
        'Distribua os aumentos de atributo conforme a regra flexível.': 'Distribute the ability score increases using the flexible rule.',
        '+1 em todos os valores de habilidade (For, Des, Con, Int, Sab, Car).': '+1 to all ability scores (Str, Dex, Con, Int, Wis, Cha).',
        '+1 em um valor de habilidade à sua escolha (1º dos 2 aumentos; os dois devem ser em valores de habilidade diferentes).': '+1 to one ability score of your choice (the 1st of 2 increases; the two must be to different ability scores).',
        '+1 em outro valor de habilidade à sua escolha (2º dos 2 aumentos; diferente do primeiro).': '+1 to another ability score of your choice (the 2nd of 2 increases; different from the first).',
        '+1 em um valor de habilidade à sua escolha (1º dos 2 aumentos; os dois em valores de habilidade diferentes, além do Carisma).': '+1 to one ability score of your choice (the 1st of 2 increases; the two to different ability scores, besides Charisma).',
        '+1 em outro valor de habilidade à sua escolha (2º dos 2 aumentos; diferente do primeiro e do Carisma).': '+1 to another ability score of your choice (the 2nd of 2 increases; different from the first and from Charisma).',
        '+1 em um valor de habilidade entre Destreza ou Inteligência.': '+1 to Dexterity or Intelligence.',
        'Carisma +2': 'Charisma +2',
        'Médio.': 'Medium.', 'Pequeno.': 'Small.', 'Médio ou Pequeno à sua escolha.': 'Medium or Small (your choice).',
        'Pequeno ou Médio à sua escolha.': 'Small or Medium (your choice).', 'Não.': 'No.',
        'Um idioma adicional à sua escolha.': 'One additional language of your choice.',
        'Comum, e um idioma adicional à sua escolha.': 'Common, and one additional language of your choice.',
        'Proficiência em uma perícia à sua escolha.': 'Proficiency in one skill of your choice.',
        '7,5 metros (25 pés). Sua velocidade não é reduzida pelo uso de armadura pesada.': '25 ft. Your speed is not reduced by wearing heavy armor.',
        'Vantagem em testes de resistência contra veneno e resistência a dano de veneno.': 'You have advantage on saving throws against poison, and you have resistance against poison damage.',
        'Proficiência com machados de batalha, machadinhas, martelos leves e martelos de guerra.': 'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.',
        'Proficiência com uma ferramenta de artesão à sua escolha: ferreiro, cervejeiro ou pedreiro.': "You gain proficiency with one artisan's tools of your choice: smith's tools, brewer's supplies, or mason's tools.",
        'Ao realizar testes de Inteligência (História) relacionados à origem de um trabalho em pedra, você é considerado proficiente e adiciona o dobro do seu bônus de proficiência ao teste.': 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check, instead of your normal proficiency bonus.',
        'Seu máximo de Pontos de Vida (PV) aumenta em 1, e aumenta em mais 1 a cada vez que você sobe de nível.': 'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.',
        'Proficiência em armaduras leves e médias.': 'You have proficiency with light and medium armor.',
        'Proficiência na perícia Percepção.': 'Proficiency in the Perception skill.',
        'Vantagem em testes de resistência contra ser enfeitiçado; magia não pode colocá-lo para dormir.': "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
        'Proficiência com espadas curtas, espadas longas, arcos curtos e arcos longos.': 'You have proficiency with the longsword, shortsword, shortbow, and longbow.',
        'Elfos não precisam dormir. Eles meditam profundamente por 4 horas por dia para obter os mesmos benefícios de 8 horas de sono humano.': "Elves don't need to sleep. Instead, they meditate deeply for 4 hours a day, gaining the same benefit a human does from 8 hours of sleep.",
        'Conhece um truque à sua escolha da lista de magias de Mago (a Inteligência é a habilidade de conjuração).': 'You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.',
        'Pode falar, ler e escrever um idioma adicional à sua escolha.': 'You can speak, read, and write one extra language of your choice.',
        'O deslocamento base aumenta para 10,5 metros (35 pés).': 'Your base walking speed increases to 35 feet.',
        'Pode tentar se esconder mesmo quando estiver sob ocultação leve, como folhagem, chuva forte, neve ou fenômenos naturais.': 'You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.',
        'A Visão no Escuro aumenta para 36 metros (120 pés).': 'Your darkvision has a radius of 120 feet.',
        'Desvantagem nas jogadas de ataque e em testes de Percepção (Sabedoria) que dependam da visão quando você, o alvo, ou o que você está tentando perceber está sob luz solar direta.': 'You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.',
        'Conhece o truque Globos de Luz. No 3º nível, pode conjurar Fogo das Fadas (uma vez por descanso longo). No 5º nível, pode conjurar Escuridão (uma vez por descanso longo). Carisma é a habilidade de conjuração.': 'You know the dancing lights cantrip. When you reach 3rd level, you can cast faerie fire once and regain the ability to do so when you finish a long rest. When you reach 5th level, you can cast darkness once and regain the ability to do so when you finish a long rest. Charisma is your spellcasting ability for these spells.',
        'Proficiência com rapieiras, espadas curtas e bestas de mão.': 'You have proficiency with rapiers, shortswords, and hand crossbows.',
        'Quando rolar um 1 natural em uma jogada de ataque, teste de habilidade ou teste de resistência, você pode rolar o dado novamente e deve usar o novo resultado.': 'When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
        'Vantagem em testes de resistência contra ficar amedrontado.': 'You have advantage on saving throws against being frightened.',
        'Pode se mover pelo espaço de qualquer criatura que for de um tamanho maior que o seu.': 'You can move through the space of any creature that is of a size larger than yours.',
        'Pode tentar se esconder mesmo quando estiver apenas atrás de uma criatura pelo menos um tamanho maior que você.': 'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.',
        'Ganha um Talento (Feat) à sua escolha logo no 1º nível.': 'You gain one feat of your choice at 1st level.',
        'Você escolhe um tipo de dragão para ser seu ancestral. Isso determina o tipo de dano e a área da sua arma de sopro, e o tipo de resistência que você ganha.': 'You choose a type of dragon as your ancestor. This determines the damage type and area of your breath weapon, and the type of resistance you gain.',
        'Você pode usar sua ação para exalar energia destrutiva (linha ou cone, dependendo do ancestral). Criaturas na área devem fazer um teste de resistência (CD = 8 + bônus de proficiência + modificador de Constituição). O dano é de 2d6 (aumenta para 3d6 no 6º nível, 4d6 no 11º e 5d6 no 16º). Pode ser usado uma vez por descanso curto ou longo.': 'You can use your action to exhale destructive energy (a line or cone, depending on your ancestry). Creatures in the area must make a saving throw (DC = 8 + your proficiency bonus + your Constitution modifier). The damage is 2d6 (increasing to 3d6 at 6th level, 4d6 at 11th, and 5d6 at 16th). You can use it once per short or long rest.',
        'Você possui resistência ao tipo de dano associado à sua ancestralidade dracônica.': 'You have resistance to the damage type associated with your draconic ancestry.',
        'Vantagem em todos os testes de resistência de Inteligência, Sabedoria e Carisma contra magias.': 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
        'Conhece o truque Ilusão Menor (Inteligência é a habilidade de conjuração).': 'You know the minor illusion cantrip. Intelligence is your spellcasting ability for it.',
        'Através de sons e gestos, você pode comunicar ideias simples a bestas de tamanho Pequeno ou Menor.': 'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.',
        'Ao fazer um teste de Inteligência (História) sobre itens mágicos, objetos alquímicos ou aparatos tecnológicos, você adiciona o dobro do seu bônus de proficiência.': 'Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you add twice your proficiency bonus, instead of any proficiency bonus you normally apply.',
        'Proficiência com ferramentas de artesão (ferramentas de funileiro). Pode gastar 1 hora e 10 PO em materiais para construir um dispositivo mecânico Miúdo (um brinquedo a corda, um isqueiro ou uma caixa de música).': "You have proficiency with artisan's tools (tinker's tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (a clockwork toy, fire starter, or music box).",
        'Escolha uma das seguintes características.': 'Choose one of the following features.',
        'Um truque à sua escolha da lista de magias de Mago.': 'One cantrip of your choice from the wizard spell list.',
        'Quando você é reduzido a 0 pontos de vida, mas não é morto instantaneamente, você pode cair para 1 ponto de vida em vez disso. Pode ser usado uma vez por descanso longo.': "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest.",
        'Quando você consegue um acerto crítico com um ataque corpo-a-corpo com arma, você pode rolar um dos dados de dano da arma mais uma vez e adicioná-lo ao dano extra do acerto crítico.': "When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit.",
        'Resistência a dano de fogo.': 'You have resistance to fire damage.',
        'Conhece o truque Taumaturgia. No 3º nível, pode conjurar a magia Repreensão Infernal (como magia de 2º círculo; uma vez por descanso longo). No 5º nível, pode conjurar a magia Escuridão (uma vez por descanso longo). Carisma é a habilidade de conjuração para todas elas.': 'You know the thaumaturgy cantrip. When you reach 3rd level, you can cast the hellish rebuke spell as a 2nd-level spell once and regain the ability to do so when you finish a long rest. When you reach 5th level, you can cast the darkness spell once and regain the ability to do so when you finish a long rest. Charisma is your spellcasting ability for these spells.',
        'Você possui visão no escuro com um alcance de 18 metros (60 pés).': 'You have darkvision with a range of 60 feet.',
        'Você ganha proficiência em uma perícia à sua escolha.': 'You gain proficiency in one skill of your choice.',
        'Você ganha um Talento (Feat) à sua escolha para o qual você cumpra os pré-requisitos.': 'You gain one feat of your choice for which you meet the prerequisites.',
        'Enquanto estiver transformado, você ganha deslocamento de escalada de 9 metros (30 pés).': 'While shifted, you gain a climbing speed of 30 feet.',
        'Enquanto estiver transformado, você pode fazer um ataque desarmado como ação bônus. Você pode usar Destreza na jogada de ataque e no bônus de dano, e esse ataque causa dano cortante.': 'While shifted, you can make an unarmed strike as a bonus action. You can use Dexterity for the attack roll and damage bonus, and the attack deals slashing damage.',

        // ---- resumos ----
        '+1 em um valor de habilidade à sua escolha.': '+1 to one ability score of your choice.',
        'Distribui +2/+1 ou +1/+1/+1.': 'Distribute +2/+1 or +1/+1/+1.',
        'Tamanho Médio.': 'Medium size.', 'Tamanho Pequeno.': 'Small size.', 'Tamanho da criatura é Médio.': 'Creature size is Medium.',
        'Tamanho da criatura é Pequeno.': 'Creature size is Small.', 'Tamanho Pequeno ou Médio.': 'Small or Medium size.', 'Escolhe o tamanho.': 'Choose your size.',
        'Fala Comum.': 'Speaks Common.', 'Não possui visão no escuro.': 'No darkvision.',
        'Proficiência em uma perícia.': 'Proficiency in one skill.', 'Proficiência em uma perícia extra.': 'One extra skill proficiency.',
        'Resistência e vantagem contra venenos.': 'Resistance and advantage against poison.',
        'Resiste a encantos e sono mágico.': 'Resists charm and magical sleep.',
        'Proficiência com espadas e arcos.': 'Proficiency with swords and bows.', 'Conhece um truque de Mago.': 'Knows one wizard cantrip.',
        'Aprende um idioma adicional.': 'Learns one additional language.', 'Comum e um idioma adicional.': 'Common and one additional language.',
        'Aumenta todos atributos em 1.': 'Increases all ability scores by 1.', 'Aumenta um atributo em 1.': 'Increases one ability score by 1.',
        'Aumenta um atributo em 2.': 'Increases one ability score by 2.',
        'Fala os idiomas Comum e Anão.': 'Speaks Common and Dwarvish.',
        'Proficiência com machados e martelos.': 'Proficiency with axes and hammers.', 'Proficiência com uma ferramenta artesanal.': "Proficiency with one artisan's tool.",
        'Bônus em História sobre pedras.': 'Bonus on History checks about stonework.', 'Ganha pontos de vida extras.': 'Gains extra hit points.',
        'Proficiência com armaduras leves e médias.': 'Proficiency with light and medium armor.',
        'Medita 4 horas invés de dormir.': 'Meditates 4 hours instead of sleeping.', 'Deslocamento aumentado para 10,5 metros.': 'Speed increased to 35 ft.',
        'Esconde-se em ocultação leve.': 'Can hide in light obscurement.', 'Enxerga 36 metros no escuro.': 'Sees 120 ft. in the dark.',
        'Desvantagem sob luz solar direta.': 'Disadvantage in direct sunlight.', 'Pode conjurar magias raciais.': 'Can cast racial spells.',
        'Proficiência com armas de Drow.': 'Proficiency with drow weapons.', 'Pode rerrolar 1 natural.': 'Can reroll a natural 1.',
        'Vantagem contra ficar amedrontado.': 'Advantage against being frightened.', 'Move-se pelo espaço de criaturas maiores.': 'Moves through the space of larger creatures.',
        'Esconde-se atrás de criaturas maiores.': 'Hides behind larger creatures.', 'Ganha um talento no 1º nível.': 'Gains a feat at 1st level.',
        'Define resistência e arma de sopro.': 'Determines resistance and breath weapon.', 'Exala energia destrutiva em área.': 'Exhales destructive energy in an area.',
        'Ganha resistência do seu elemento.': 'Gains resistance to your element.', 'Vantagem contra magias mentais.': 'Advantage against mind-affecting magic.',
        'Conhece o truque Ilusão Menor.': 'Knows the minor illusion cantrip.', 'Comunica-se com animais pequenos.': 'Communicates with small animals.',
        'Bônus em História sobre itens.': 'Bonus on History checks about items.', 'Cria pequenos dispositivos mecânicos.': 'Builds small clockwork devices.',
        'Escolhe uma característica de versatilidade.': 'Chooses a versatility feature.', 'Não desmaia, mantendo 1 PV.': 'Stays up at 1 HP instead of dropping.',
        'Dano extra em acertos críticos.': 'Extra damage on critical hits.', 'Ganha resistência a dano de fogo.': 'Gains resistance to fire damage.',
        'Pode conjurar magias infernais.': 'Can cast infernal spells.', 'Ganha um talento adicional.': 'Gains an additional feat.',
        'Ganha uma proficiência extra.': 'Gains one extra proficiency.', 'Fala o idioma Élfico.': 'Speaks Elvish.',
        'Fala idiomas Comum e Élfico.': 'Speaks Common and Elvish.', 'Fala Aquan, Comum.': 'Speaks Aquan, Common.',
        '+1 em outro valor de habilidade à sua escolha (2º dos 2 aumentos; diferente do primeiro).': '+1 to another ability score of your choice (the 2nd of 2 increases; different from the first).',
        'Aumenta Inteligência +1, Carisma +2.': 'Increases Intelligence +1, Charisma +2.',
        'Aumenta Força +1, Constituição +1, Carisma +1.': 'Increases Strength +1, Constitution +1, Charisma +1.'
    });
})();

// ---- estrutura das raças (rótulos, subraças, sopro, variantes) ----
(() => {
    const DANO = { 'ácido': 'Acid', 'elétrico': 'Lightning', 'de fogo': 'Fire', 'de veneno': 'Poison', 'de frio': 'Cold' };
    const DANO2 = { 'Ácido': 'Acid', 'Elétrico': 'Lightning', 'Fogo': 'Fire', 'Veneno': 'Poison', 'Frio': 'Cold' };
    const FORMA = { 'linha de 1,5 por 9 m': '5 by 30 ft. line', 'cone de 4,5 m': '15 ft. cone', 'linha 1,5x9 m': '5x30 ft. line', 'cone 4,5 m': '15 ft. cone' };
    const SV = { 'Destreza': 'Dexterity', 'Constituição': 'Constitution', 'Des': 'Dex', 'Con': 'Con' };
    Idioma.padrao(/^Dano (ácido|elétrico|de fogo|de veneno|de frio)\. Sopro: (linha de 1,5 por 9 m|cone de 4,5 m) \(teste de (Destreza|Constituição)\)\.$/,
        (m, d, f, s) => DANO[d] + ' damage. Breath: ' + FORMA[f] + ' (' + SV[s] + ' save).');
    Idioma.padrao(/^(Ácido|Elétrico|Fogo|Veneno|Frio), (linha 1,5x9 m|cone 4,5 m) \((Des|Con)\)\.$/,
        (m, d, f, s) => DANO2[d] + ', ' + FORMA[f] + ' (' + SV[s] + ').');
    const RAC = { 'Anão': 'Dwarf', 'Elfo': 'Elf', 'Halfling': 'Halfling', 'Gnomo': 'Gnome' };
    Idioma.padrao(/^Subraças do (Anão|Elfo|Halfling|Gnomo)$/, (m, r) => RAC[r] + ' Subraces');
    Idioma.padrao(/^Subraças d[oa] (Anão|Elfo|Halfling|Gnomo)$/, (m, r) => RAC[r] + ' Subraces');
    Idioma.adicionar({
        'Variantes do Humano': 'Human Variants', 'Humano Padrão': 'Standard Human', 'Subraça / variante': 'Subrace / variant',
        '+2 em um atributo e +1 em outro': '+2 to one ability score and +1 to another', '+1 em três atributos diferentes': '+1 to three different ability scores',
        'Médio': 'Medium', 'Aparência': 'Appearance', 'Característica Variável': 'Variable Trait', 'Herança infernal alternativa (opcional)': 'Alternate infernal legacy (optional)',
        'Versões desta raça publicadas em outros livros. É opcional: sem escolher nenhuma, vale a versão padrão da raça; ao escolher uma, ela substitui as características da versão padrão que ela mesma redefine.': "Versions of this race published in other books. Optional: if you pick none, the race's standard version applies; if you pick one, it replaces the standard-version traits it redefines.",
        'Escolhe uma versão de outra fonte.': 'Choose a version from another source.',
        'Escolha uma subraça ou variante.': 'Choose a subrace or variant.', 'Escolhe a subraça.': 'Choose the subrace.', 'Escolha uma variante.': 'Choose a variant.',
        'Proficiência em duas perícias à sua escolha.': 'Proficiency in two skills of your choice.', 'Proficiência em duas perícias.': 'Proficiency in two skills.',
        'Herança de Alto Elfo ou Elfo da Floresta. Proficiência com espada longa, espada curta, arco curto e arco longo.': 'High Elf or Wood Elf heritage. Proficiency with the longsword, shortsword, shortbow, and longbow.',
        'Herança de Alto Elfo. Você conhece um truque à sua escolha da lista de magias de Mago. A Inteligência é a habilidade de conjuração dele.': 'High Elf heritage. You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.',
        'Herança de Elfo da Floresta. Seu deslocamento base aumenta para 10,5 metros (35 pés).': 'Wood Elf heritage. Your base walking speed increases to 35 feet.',
        'Herança de Elfo da Floresta. Você pode tentar se esconder mesmo quando estiver apenas levemente obscurecido por folhagem, chuva forte, neve, névoa e outros fenômenos naturais.': 'Wood Elf heritage. You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.',
        'Esconde-se em ocultamento natural leve.': 'Can hide in light natural obscurement.',
        'Herança de Elfo Negro. Você conhece o truque Globos de Luz. No 3º nível, pode conjurar Fogo das Fadas uma vez, recarregando em um descanso longo. No 5º nível, pode conjurar Escuridão uma vez, recarregando em um descanso longo. Carisma é a habilidade de conjuração.': 'Drow heritage. You know the dancing lights cantrip. At 3rd level, you can cast faerie fire once, regaining it on a long rest. At 5th level, you can cast darkness once, regaining it on a long rest. Charisma is your spellcasting ability.',
        'Globos de Luz, Fogo das Fadas e Escuridão.': 'Dancing Lights, Faerie Fire, and Darkness.',
        'Herança de Elfo Aquático. Você tem deslocamento de natação de 9 metros (30 pés).': 'Sea Elf heritage. You have a swimming speed of 30 feet.',
        'Deslocamento de natação 9 m.': 'Swimming speed 30 ft.',
        'Só descritivo: seu tiefling pode não parecer com os do Livro do Jogador. Em vez das características físicas padrão, escolha 1d4 + 1 destas: chifres pequenos; presas ou dentes afiados; língua bifurcada; olhos de gato; seis dedos em cada mão; pernas de bode; cascos fendidos; cauda bifurcada; pele coriácea ou escamosa; pele vermelha ou azul-escura; não projeta sombra nem reflexo; exala cheiro de enxofre.': "Descriptive only: your tiefling might not look like those in the Player's Handbook. Instead of the standard physical traits, choose 1d4 + 1 of these: small horns; fangs or sharp teeth; a forked tongue; catlike eyes; six fingers on each hand; goat-like legs; cloven hooves; a forked tail; leathery or scaly skin; red or dark blue skin; cast no shadow or reflection; exude a smell of brimstone.",
        'Só aparência, sem efeito de regra.': 'Appearance only, no rules effect.',
        'Opcional. Sem escolher, vale o Aumento no Valor de Habilidade padrão do Tiefling (Carisma +2, Inteligência +1).': "Optional. If you pick none, the Tiefling's standard Ability Score Increase applies (Charisma +2, Intelligence +1).",
        'Opcional: Feral troca o aumento de atributo.': 'Optional: Feral replaces the ability score increase.',
        'Seu valor de Destreza aumenta em 2 e o de Inteligência em 1. Este traço substitui o Aumento no Valor de Habilidade da raça (você deixa de ter Carisma +2).': 'Your Dexterity score increases by 2 and your Intelligence score by 1. This trait replaces the race\'s Ability Score Increase (you no longer have Charisma +2).',
        'Destreza +2, Inteligência +1 no lugar do aumento padrão.': 'Dexterity +2, Intelligence +1 in place of the standard increase.',
        'Opcional, só uma. Cada opção substitui o Legado Infernal. Sem escolher, vale o Legado Infernal padrão.': 'Optional, only one. Each option replaces Infernal Legacy. If you pick none, the standard Infernal Legacy applies.',
        'Opcional: troca o Legado Infernal por uma destas.': 'Optional: replaces Infernal Legacy with one of these.',
        'Zombaria Cruel; Enfeitiçar Pessoa (3º); Fascinar (5º).': 'Vicious Mockery; Charm Person (3rd); Enthrall (5th).',
        'Taumaturgia; Mãos Flamejantes (3º); Escuridão (5º).': 'Thaumaturgy; Burning Hands (3rd); Darkness (5th).',
        'Você tem asas de morcego saindo dos ombros e deslocamento de voo de 9 metros (30 pés) enquanto não usar armadura pesada. Substitui o Legado Infernal (você perde o truque e as magias dele).': 'You have bat-like wings sprouting from your shoulders and a flying speed of 30 feet while you are not wearing heavy armor. Replaces Infernal Legacy (you lose its cantrip and spells).',
        'Voo de 9 m sem armadura pesada, no lugar do Legado Infernal.': 'Flying speed of 30 ft. without heavy armor, in place of Infernal Legacy.'
    });
})();
Idioma.adicionar({ 'Escolhas adicionais': 'Additional choices', 'Versão-base:': 'Base version:', 'mais': 'more' });Idioma.adicionar({ 'Versão-base': 'Base version' });

Idioma.adicionar({ 'Élfico': 'Elvish', 'Goblinóide': 'Goblin', 'Gnômico': 'Gnomish', 'Gigante': 'Giant', 'Abissal': 'Abyssal', 'Dracônico': 'Draconic', 'Silvestre': 'Sylvan', 'Demônios': 'Demons', 'Devoradores de mente, beholders': 'Mind flayers, beholders', 'Elementais': 'Elementals', 'Fadas': 'Fey', 'Subcomum': 'Undercommon', 'Diabos': 'Devils', 'Comerciantes do Subterrâneo': 'Underdark traders', 'Anão': 'Dwarf', 'Pequeno': 'Small', 'Miúdo': 'Tiny', 'Grande': 'Large' });

Idioma.adicionar({
    'Material de playtest da Wizards of the Coast, não publicado oficialmente. A aceitação varia de mesa para mesa: confirme com o seu mestre antes de usar.': 'Playtest material from Wizards of the Coast, not officially published. Acceptance varies from table to table: check with your DM before using it.',
    'Material criado por terceiros, não publicado pela Wizards of the Coast. A aceitação varia de mesa para mesa: confirme com o seu mestre antes de usar.': 'Material created by third parties, not published by Wizards of the Coast. Acceptance varies from table to table: check with your DM before using it.',
    'Conteúdo não oficial (Unearthed Arcana)': 'Unofficial content (Unearthed Arcana)', 'Conteúdo de terceiros': 'Third-party content',
    'Esta raça não exige escolhas adicionais.': 'This race has no additional choices.', 'Este antecedente não exige escolhas adicionais.': 'This background has no additional choices.'
});
// "Destreza. Equilíbrio, piruetas..." (descrição curta de perícia)
Idioma.padrao(new RegExp('^(' + Object.keys({ 'Força': 1, 'Destreza': 1, 'Constituição': 1, 'Inteligência': 1, 'Sabedoria': 1, 'Carisma': 1 }).join('|') + ')\\. (.+)$'),
    (m, a, d) => ({ 'Força': 'Strength', 'Destreza': 'Dexterity', 'Constituição': 'Constitution', 'Inteligência': 'Intelligence', 'Sabedoria': 'Wisdom', 'Carisma': 'Charisma' })[a] + '. ' + (Idioma.traduzirTexto(d, true) || d));
Idioma.adicionar({ 'Rastejar, Encolher-se e Implorar (Grovel, Cower, and Beg)': 'Grovel, Cower, and Beg' });
