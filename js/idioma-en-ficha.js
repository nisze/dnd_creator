// Dicionário da interface, lote 4: ficha (tela e impressão), subir de nível e multiclasse.
(() => {
    const T = (s) => { const r = Idioma.traduzirTexto(s); return r == null ? s : r; };
    const ord = (n) => { n = +n; const r = n % 100; return n + (r >= 11 && r <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'); };
    // "Mago 5" -> "Wizard 5"
    const TC = (s) => { const r = Idioma.traduzirTexto(s); if (r != null) return r; const m = /^(.+?) (\d+)$/.exec(s); return m ? T(m[1]) + ' ' + m[2] : s; };
    const kgLb = (v) => { const n = Math.round(parseFloat(String(v).replace(',', '.')) * 2.2046 * 10) / 10; return String(n); };
    const mPes = (v) => Math.round(parseFloat(String(v).replace(',', '.')) / 0.3);
    // Padrão com teste próprio (usado quando uma regex sozinha não basta).
    const cond = (teste) => ({ test: teste });
    // "Mago 5 (Escola de Abjuração) / Guerreiro 2"
    const CT = (s) => s.split(' / ').map(p => {
        const x = /^(.+?) (\d+)(?: \((.+)\))?$/.exec(p); return x ? T(x[1]) + ' ' + x[2] + (x[3] ? ' (' + T(x[3]) + ')' : '') : p;
    }).join(' / ');

    // pares português -> inglês (as duas formas, com e sem inicial maiúscula)
    const dupla = {};
    [
        ['todas as armas simples', 'all simple weapons'], ['armas simples', 'simple weapons'], ['armas marciais', 'martial weapons'], ['todas as armaduras', 'all armor'],
        ['armaduras leves', 'light armor'], ['armaduras médias', 'medium armor'], ['armaduras pesadas', 'heavy armor'], ['escudos', 'shields'],
        ['bestas de mão', 'hand crossbows'], ['bestas leves', 'light crossbows'], ['espadas longas', 'longswords'], ['rapieiras', 'rapiers'], ['espadas curtas', 'shortswords'],
        ['clavas', 'clubs'], ['adagas', 'daggers'], ['dardos', 'darts'], ['azagaias', 'javelins'], ['maças', 'maces'], ['bordões', 'quarterstaffs'], ['cimitarras', 'scimitars'], ['foices', 'sickles'], ['fundas', 'slings'], ['lanças', 'spears'],
        ['(druidas não usam armadura nem escudo de metal)', '(druids will not wear armor or use shields made of metal)'],
        ['ferramentas de ladrão', 'thieves\u2019 tools'], ['ferramentas de funileiro', 'tinker\u2019s tools'], ['um tipo de ferramenta de artesão à escolha', 'one type of artisan\u2019s tools of your choice'],
        ['três instrumentos musicais à escolha', 'three musical instruments of your choice'], ['um instrumento musical à escolha', 'one musical instrument of your choice'], ['kit de herbalismo', 'herbalism kit'], ['suprimentos de alquimista', 'alchemist\u2019s supplies'],
        ['um tipo de ferramenta de artesão ou um instrumento musical', 'one type of artisan\u2019s tools or one musical instrument'],
        ['suprimentos de calígrafo', 'calligrapher\u2019s supplies'], ['ferramentas de pedreiro', 'mason\u2019s tools'], ['ferramentas de entalhador', 'woodcarver\u2019s tools'],
        ['Veículos terrestres', 'Land vehicles'],
        ['ácido', 'acid'], ['contundente', 'bludgeoning'], ['cortante', 'slashing'], ['elétrico', 'lightning'], ['energético', 'force'], ['frio', 'cold'], ['fogo', 'fire'], ['necrótico', 'necrotic'],
        ['perfurante', 'piercing'], ['psíquico', 'psychic'], ['radiante', 'radiant'], ['trovejante', 'thunder'], ['veneno', 'poison'],
        ['ser enfeitiçado', 'being charmed'], ['magia que o faça dormir', 'magic that would put you to sleep']
    ].forEach(([pt, en]) => { dupla[pt] = en; dupla[pt.charAt(0).toUpperCase() + pt.slice(1)] = en.charAt(0).toUpperCase() + en.slice(1); });
    Idioma.adicionar(dupla);

    Idioma.adicionar({
        // tela da ficha
        'Você tem vantagem em testes de resistência de Destreza contra efeitos que você possa ver, como armadilhas e magias.': 'You have advantage on Dexterity saving throws against effects that you can see, such as traps and spells.',
        'Vantagem contra armadilhas e magias visíveis.': 'Advantage against visible traps and spells.',
        'de Destreza contra efeitos que você possa ver, como armadilhas e magias': 'Dexterity saves against effects you can see, such as traps and spells',
        'Resistências:': 'Resistances:', 'Imunidades:': 'Immunities:',
        'Concede um bônus de +1 na Classe de Armadura (CA) de uma armadura ou escudo.': 'Grants a +1 bonus to the Armor Class (AC) of a suit of armor or a shield.',
        'Você ganha a habilidade de canalizar energia divina para criar efeitos mágicos (1 uso por descanso curto ou longo). Todos os clérigos recebem a opção Expulsar Mortos-Vivos (Turn Undead), além de uma segunda opção determinada pelo seu Domínio Divino escolhido no 1º nível.': 'You gain the ability to channel divine energy to fuel magical effects (1 use per short or long rest). All clerics receive the Turn Undead option, plus a second option determined by the Divine Domain you chose at 1st level.',
        'Bônus': 'Bonus', 'Veículos:': 'Vehicles:',
        'Foco em magias de proteção, bloqueio e banimento.': 'Focus on spells of protection, blocking and banishment.',
        'Cria uma barreira mágica ao redor de você ao conjurar magias de abjuração, que absorve danos que você receberia.': 'Creates a magical barrier around you when you cast abjuration spells, absorbing damage you would take.',
        'Abrir': 'Open', 'Abrir ficha': 'Open sheet', 'Editar': 'Edit', 'Duplicar': 'Duplicate', 'Exportar': 'Export', 'Excluir': 'Delete', 'Mais ações': 'More actions',
        'Imprimir ficha': 'Print sheet', 'Editar personagem': 'Edit character', 'Ficha': 'Sheet',
        'Economizar tinta (sem fundo de pergaminho)': 'Save ink (no parchment background)',
        'Ajustar antes de imprimir (consumíveis, moedas e textos)': 'Adjust before printing (consumables, coins and texts)',
        'O que for gasto em jogo (ração, flechas, poções, ouro) se ajusta aqui; a ficha da página abaixo é atualizada na hora. Itens com quantidade 0 não saem na impressão.': 'Whatever is spent in play (rations, arrows, potions, gold) is adjusted here; the sheet on the page below updates immediately. Items with quantity 0 are left out of the printout.',
        'Itens': 'Items', 'Moedas': 'Coins', 'Cabeçalho': 'Header', 'Histórico de níveis': 'Level history', 'Retrato': 'Portrait',
        'Adicionar item pessoal': 'Add personal item', 'Defesas extras': 'Extra defenses', 'Personalidade e história': 'Personality and story',
        'Sem itens no inventário.': 'No items in the inventory.', 'Sem retrato.': 'No portrait.',
        'Nenhum nível foi subido pelo app ainda.': 'No level has been gained through the app yet.',
        'Jogador': 'Player', 'Tendência': 'Alignment', 'Pontos de experiência': 'Experience points',
        'Leal e Bom': 'Lawful Good', 'Neutro e Bom': 'Neutral Good', 'Caótico e Bom': 'Chaotic Good', 'Leal e Neutro': 'Lawful Neutral', 'Neutro': 'Neutral',
        'Caótico e Neutro': 'Chaotic Neutral', 'Leal e Mau': 'Lawful Evil', 'Neutro e Mau': 'Neutral Evil', 'Caótico e Mau': 'Chaotic Evil',
        'Enviar foto': 'Upload photo', 'Substituir foto': 'Replace photo', 'Reposicionar': 'Reposition', 'Reposicionar foto': 'Reposition photo', 'Remover foto': 'Remove photo', 'Retrato atual': 'Current portrait', 'Dica: usar imagem sem fundo (PNG) também fica bom.': 'Tip: an image with a transparent background (PNG) also works well.',
        'Nome': 'Name', 'Qtd': 'Qty', 'Peso (kg)': 'Weight (kg)', 'Observação (opcional)': 'Note (optional)', 'Adicionar': 'Add', 'Remover': 'Remove',
        'Chaveiro da minha irmã': 'My sister\u2019s keychain', 'Remover item': 'Remove item', 'Quantidade': 'Quantity', '(item pessoal)': '(personal item)',
        'Resistências, imunidades ou vantagens que o app não detectou (aparecem no quadro Defesas)': 'Resistances, immunities or advantages the app did not detect (shown in the Defenses box)',
        'Traços de personalidade': 'Personality traits', 'Ideais': 'Ideals', 'Vínculos': 'Bonds', 'Defeitos': 'Flaws', 'Aparência': 'Appearance',
        'Aliados e organizações': 'Allies and organizations', 'Anotações': 'Notes', 'História do personagem': 'Character story',
        'Posição da foto: arraste ou use as setas': 'Photo position: drag or use the arrow keys',
        'Arraste a foto para centralizar no círculo. Zoom pelo controle ou pela roda do mouse; as setas movem de pouco em pouco.': 'Drag the photo to center it in the circle. Zoom with the slider or the mouse wheel; the arrow keys nudge it a little at a time.',
        'Zoom': 'Zoom', 'Aplicar': 'Apply',
        // folha impressa
        'Classe e nível': 'Class and level', 'Inspiração': 'Inspiration', 'Bônus de proficiência': 'Proficiency bonus', 'Perícias': 'Skills',
       
        'FOR': 'STR', 'SAB': 'WIS', 'CAR': 'CHA', 'For': 'Str', 'Des': 'Dex', 'Sab': 'Wis', 'Car': 'Cha',
        'Ataques e conjuração': 'Attacks and spellcasting', 'Dano / tipo': 'Damage / type', 'Notas dos ataques': 'Attack notes',
        'Sem propriedades especiais.': 'No special properties.', 'sem proficiência': 'not proficient',
        'Pontos de vida': 'Hit points', 'PV máximos': 'Max HP', 'PV atuais': 'Current HP', 'PV temporários': 'Temp HP', 'PV': 'HP',
        'Dados de vida:': 'Hit Dice:', 'Salvaguardas de morte': 'Death saves', 'Sucessos': 'Successes', 'Falhas': 'Failures',
        'Outras proficiências e idiomas': 'Other proficiencies and languages', 'Idiomas:': 'Languages:',
        'Armaduras': 'Armor', 'Armas': 'Weapons', 'Ferramentas': 'Tools', 'Escolhidas': 'Chosen',
        'Armaduras:': 'Armor:', 'Armas:': 'Weapons:', 'Ferramentas:': 'Tools:', 'Escolhidas:': 'Chosen:', 'CA': 'AC', 'INICIATIVA': 'INITIATIVE', 'Iniciativa': 'Initiative',
        'Comum': 'Common',
        'Visão no Escuro:': 'Darkvision:',
        'Defesas': 'Defenses', 'Nenhuma resistência ou imunidade permanente.': 'No permanent resistances or immunities.',
        'Resistências': 'Resistances', 'Imunidades': 'Immunities', 'Vantagem em salvaguardas contra': 'Advantage on saving throws against', 'Vantagem em salvaguardas contra:': 'Advantage on saving throws against:',
        'Ações': 'Actions', 'Ação bônus e reação': 'Bonus action and reaction', 'Ação bônus': 'Bonus action', 'Reação': 'Reaction',
        'Nenhuma habilidade de uso detectada.': 'No usable ability detected.', 'Descrições nas últimas páginas.': 'Descriptions on the last pages.',
        'Magias e recursos': 'Spells and resources', 'Conjuração': 'Spellcasting', 'Habilidade': 'Ability', 'Ataque': 'Attack', 'Tudo decidido.': 'All decided.',
        'Truque (Poder do Gigante)': 'Cantrip (Giant\u2019s Power)', 'Perícia (Saber do Arqueiro)': 'Skill (Archer\u2019s Lore)', 'Idioma (Mestre da Intriga)': 'Language (Master of Intrigue)',
        'Idioma (Inimigo Favorito)': 'Language (Favored Enemy)', 'Perícia (Glamour de Outro Mundo)': 'Skill (Otherworldly Glamour)', 'Salvaguarda (Mente de Ferro)': 'Saving Throw (Iron Mind)',
        'Perícia (Estudo do Eremita)': 'Skill (Hermit\u2019s Study)',
        'Bom: Cure Wounds': 'Good: Cure Wounds', 'Mau: Inflict Wounds': 'Evil: Inflict Wounds', 'Lei: Bless': 'Law: Bless', 'Caos: Bane': 'Chaos: Bane',
        'Feras/Bestas': 'Beasts', 'Animais/Plantas': 'Animals/Plants', 'Celestiais': 'Celestials', 'Constructos': 'Constructs', 'Gigantes': 'Giants', 'Humanoides': 'Humanoids',
        'Limos': 'Oozes', 'Mortos-Vivos': 'Undead', 'Costa/Mar': 'Coast', 'Interplanar': 'Interplanar', 'Urbano': 'Urban', 'Rito Carmesim': 'Crimson Rite',
        'Segredos Mágicos (qualquer classe)': 'Magical Secrets (any class)',
        'Truques ou magias de qualquer classe, dentro dos círculos que você pode conjurar; contam como magias de bardo.': 'Cantrips or spells from any class, within the spell levels you can cast; they count as bard spells.',
        'Guerreiro': 'Fighter', 'Ladino': 'Rogue', 'Monge': 'Monk', 'Paladino': 'Paladin', 'Patrulheiro': 'Ranger', 'ficar paralisado ou envenenado': 'being paralyzed or poisoned', 'CD das magias': 'Spell save DC',
        'Preparadas por descanso longo:': 'Prepared per long rest:', 'Conjura rituais': 'Casts rituals',
        'descanso curto': 'short rest', 'descanso longo': 'long rest', 'ilimitado': 'unlimited', 'Recursos com usos': 'Resources with uses',
        'Nenhum recurso com usos contado automaticamente. Os de subclasse estão nas características.': 'No resource with uses is tracked automatically. Subclass ones are listed under features.',
        'Nenhuma magia escolhida.': 'No spells chosen.',
        'Bolinha vazia: marque a lápis as magias preparadas do dia. Bolinha cheia: sempre disponível.': 'Empty dot: mark in pencil the spells prepared for the day. Filled dot: always available.',
        'Equipamento e história': 'Equipment and story', 'Carga': 'Load',
        'Consultar magias': 'Spell lookup', 'Buscar magia pelo nome...': 'Search spell by name...', 'Buscar magia': 'Search spell', 'Todos os níveis': 'All levels', 'Todas as escolas': 'All schools', 'Todas as classes': 'All classes', 'Limpar filtros': 'Clear filters', 'Consultar talentos': 'Feat lookup', 'Buscar talento por nome ou texto...': 'Search feat by name or text...', 'Buscar talento': 'Search feat', 'Todas as fontes': 'All sources', 'Sem pré-requisito': 'No prerequisite', 'Nenhum talento encontrado. Livros desligados em Fontes de conteúdo escondem seus talentos.': 'No feats found. Books turned off in Content sources hide their feats.', 'Mais opções': 'More options', 'Ritual': 'Ritual', 'Concentração': 'Concentration', 'Carregando...': 'Loading...',
        'Nenhuma magia encontrada. Livros desligados em Fontes de conteúdo escondem suas magias.': 'No spells found. Books turned off in Content sources hide their spells.',
        'Abjuração': 'Abjuration', 'Conjuração': 'Conjuration', 'Adivinhação': 'Divination', 'Encantamento': 'Enchantment', 'Evocação': 'Evocation', 'Ilusão': 'Illusion', 'Necromancia': 'Necromancy', 'Transmutação': 'Transmutation',
        'Proficiências de equipamento': 'Equipment proficiencies', 'Armadura leve': 'Light armor', 'Armadura média': 'Medium armor', 'Armadura pesada': 'Heavy armor', 'Escudo': 'Shield',
        'Arma simples': 'Simple weapon', 'Arma marcial': 'Martial weapon', 'não possui': 'none', 'Peso total (equipamento + moedas):': 'Total weight (equipment + coins):',
        '(sintonizado)': '(attuned)', '(requer sintonização)': '(requires attunement)',
        'PC': 'CP', 'PP': 'SP', 'PE': 'EP', 'PO': 'GP', 'PL': 'PP',
        'Continuação: personalidade e história': 'Continuation: personality and story',
        // recursos
        'Fúria': 'Rage', 'Inspiração de Bardo': 'Bardic Inspiration', 'Canalizar Divindade': 'Channel Divinity', 'Intervenção Divina': 'Divine Intervention',
        'Forma Selvagem': 'Wild Shape', 'Retomar o Fôlego': 'Second Wind', 'Surto de Ação': 'Action Surge', 'Indomável': 'Indomitable',
        'Pontos de Ki': 'Ki Points', 'Mãos Consagradas (reserva de PV)': 'Lay on Hands (HP pool)', 'Sentido Divino': 'Divine Sense', 'Toque Purificador': 'Cleansing Touch',
        'Pontos de Feitiçaria': 'Sorcery Points', 'Recuperação Arcana': 'Arcane Recovery', 'Arma de Sopro': 'Breath Weapon', 'Resistência Implacável': 'Relentless Endurance',
        'Pontos de Sorte': 'Luck Points',
        'Usos ilimitados no 20º nível.': 'Unlimited uses at 20th level.',
        'Se funcionar, não pode usar por 7 dias.': 'If it works, you cannot use it again for 7 days.',
        '5 PV da reserva curam doença/veneno.': '5 HP from the pool cure disease/poison.',
        'Cai a 0 PV: fica com 1 PV.': 'Drops to 0 HP: stays at 1 HP.',
        // subir de nível
        'Subir de nível': 'Level up', 'Voltar à ficha': 'Back to the sheet', 'Nível máximo': 'Maximum level', 'O personagem já está no nível 20.': 'The character is already at level 20.',
        'Continuar numa classe que você já tem': 'Continue in a class you already have',
        'Entrar numa classe nova (multiclasse)': 'Enter a new class (multiclass)',
        'Decisão sua: ao subir de nível o jogador pode seguir na mesma classe ou começar outra. É preciso ter 13 no atributo principal da classe nova e de todas as classes atuais.': 'Your call: when leveling up the player can stay in the same class or start another. You need 13 in the primary ability of the new class and of all current classes.',
        'Liberar classes sem regra oficial de multiclasse (UA e terceiros), por minha conta': 'Unlock classes with no official multiclass rule (UA and third party), at my own risk',
        'Regras de multiclasse': 'Multiclassing rules',
        'Pré-requisito: 13 no atributo da classe nova e de cada classe que você já tem.': 'Prerequisite: 13 in the ability of the new class and of each class you already have.',
        'Você ganha só parte das proficiências da classe nova (aparecem ao escolhê-la), sem equipamento inicial e sem as salvaguardas dela.': 'You gain only some of the new class\u2019s proficiencies (shown when you pick it), with no starting equipment and without its saving throws.',
        'O bônus de proficiência segue o nível total. Os pontos de vida usam o dado da classe em que o nível foi ganho (valor fixo).': 'The proficiency bonus follows the total level. Hit points use the die of the class in which the level was gained (fixed value).',
        'Espaços de magia: soma dos níveis de conjurador (completo: nível inteiro; meio: metade, arredondada para baixo, e o Artífice para cima; terço: um terço). Os espaços do Bruxo (Magia de Pacto) ficam separados.': 'Spell slots: sum of caster levels (full: whole level; half: half, rounded down, and the Artificer rounded up; third: one third). Warlock slots (Pact Magic) are kept separate.',
        'Ataque Extra não se acumula entre classes, e só uma Defesa sem Armadura vale por vez.': 'Extra Attack does not stack between classes, and only one Unarmored Defense applies at a time.',
        'O que este nível traz': 'What this level brings', 'Escolhas deste nível': 'Choices at this level',
        'Nenhuma característica fixa neste nível (veja as escolhas abaixo, se houver).': 'No fixed feature at this level (see the choices below, if any).',
        'Cancelar': 'Cancel', 'Escolher outra classe': 'Choose another class', 'Confirmar nível': 'Confirm level',
        'Desfazer último nível': 'Undo last level', 'Desfazer o último nível mesmo?': 'Really undo the last level?', 'Sim, desfazer': 'Yes, undo',
        'Trocar uma magia conhecida': 'Swap a known spell', 'Magia trocada': 'Spell swapped',
        'Ao subir de nível você pode trocar uma magia conhecida por outra da lista da classe (uma por nível).': 'When leveling up you can swap a known spell for another from the class list (one per level).',
        'Nenhuma proficiência nova.': 'No new proficiencies.',
        'Sem equipamento inicial e sem as salvaguardas dessa classe.': 'No starting equipment and none of this class\u2019s saving throws.',
        'Confira no livro': 'Check the book',
        'As proficiências de multiclasse do Artífice (Tasha) devem ser conferidas com o mestre ou no livro.': 'The Artificer\u2019s multiclass proficiencies (Tasha\u2019s) should be checked with the DM or in the book.',
        'Perícia de multiclasse': 'Multiclass skill',
        'Sem regra oficial de multiclasse (UA/terceiros): libere abaixo para usar por sua conta.': 'No official multiclass rule (UA/third party): unlock below to use at your own risk.',
        'Classe não encontrada.': 'Class not found.', 'O personagem já tem essa classe.': 'The character already has that class.', 'Não há nível para desfazer.': 'There is no level to undo.',
        'Só é possível trocar uma magia por nível.': 'Only one spell can be swapped per level.', 'Magia não encontrada.': 'Spell not found.',
        'Último nível desfeito.': 'Last level undone.', 'Não foi possível desfazer.': 'Could not undo.',
        'Último nível desfeito': 'Last level undone'
    });

    // textos de classe e raça que ainda estavam só parcialmente traduzidos
    Idioma.adicionar({
        'Usa Inteligência para conjurar magias.': 'Uses Intelligence to cast spells.',
        'Usa Carisma para conjurar magias.': 'Uses Charisma to cast spells.',
        'Usa Sabedoria para preparar magias.': 'Uses Wisdom to prepare spells.',
        'Usa grimório para preparar magias.': 'Uses a spellbook to prepare spells.',
        'Mantém a concentração de magias.': 'Maintains concentration on spells.',
        'Você aprende 4 Infusões de Artífice (fórmulas para criar itens mágicos) e pode imbuir itens mundanos com propriedades mágicas temporárias. Você pode ter até 2 itens infundidos ativos simultaneamente.': 'You learn 4 Artificer Infusions (formulas for creating magic items) and can imbue mundane items with temporary magical properties. You can have up to 2 infused items active at the same time.',
        'Prestidigitação; se você já for proficiente, escolha outra perícia.': 'Sleight of Hand; if you are already proficient, choose another skill.',
        'Em seu estudo de conhecimento oculto, você descobriu invocações místicas, fragmentos de sabedoria proibida que lhe concedem talentos mágicos permanentes. Você escolhe duas invocações. Abaixo estão as opções do livro principal disponíveis logo no 2º nível (que não possuem pré-requisitos de nível ou de Pacto):': 'In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that grant you permanent magical abilities. You choose two invocations. Below are the options from the core book available right at 2nd level (which have no level or Pact prerequisites):',
        'Magia (Rituais do Livro dos Segredos Antigos)': 'Spell (Rituals from the Book of Ancient Secrets)',
        'Truque (Livro das Sombras)': 'Cantrip (Book of Shadows)',
        'Foco na conjuração de magias poderosas baseadas no ambiente natural, oferecendo uma conexão mística com a terra.': 'Focus on casting powerful spells based on the natural environment, offering a mystical connection with the land.',
        'Durante um descanso curto, você pode recuperar espaços de magia gastos, cujo nível total é igual a metade do seu nível de druida (arredondado para baixo), desde que nenhum espaço seja de 6º nível ou superior.': 'During a short rest, you can recover expended spell slots whose combined level is equal to half your druid level (rounded down), as long as none of the slots is 6th level or higher.',
        'Você desbloqueia uma reserva de magia interna. Recebe 2 Pontos de Feitiçaria, que inicialmente podem ser usados para recuperar espaços de magia gastos (e, a partir do nível 3, usados para modificar feitiços com Metamágica).': 'You unlock an inner reserve of magic. You gain 2 Sorcery Points, which initially can be used to recover expended spell slots (and, from level 3, to modify spells with Metamagic).',
        'Ganha +1 na Classe de Armadura.': 'Gains +1 to Armor Class.',
        'Persuasão; se você já for proficiente, uma destas: Lidar com Animais, Intuição, Intimidação ou Atuação.': 'Persuasion; if you are already proficient, one of these: Animal Handling, Insight, Intimidation or Performance.',
        'Persuasão; se você já for proficiente, aprenda um idioma à sua escolha.': 'Persuasion; if you are already proficient, learn a language of your choice.',
        'Você pode usar uma Ação Bônus em cada um dos seus turnos em combate para realizar a ação de Disparar (Dash), Desengajar (Disengage) ou Esconder-se (Hide).': 'You can use a bonus action on each of your turns in combat to take the Dash, Disengage or Hide action.',
        'Escolha de subclasse, que foca na sua escola de magia preferida. (Nota: Todas as escolas concedem o benefício "Savant", que reduz pela metade o tempo e o ouro necessários para copiar magias daquela escola específica para o seu grimório, além do poder listado abaixo).': 'Choice of subclass, which focuses on your preferred school of magic. (Note: all schools grant the "Savant" benefit, which halves the time and gold required to copy spells of that school into your spellbook, in addition to the power listed below.)',
        'Foco em magias de proteção.': 'Focus on protective spells.',
        'Foco em magias de dano elemental e manipulação de energia bruta.': 'Focus on elemental damage spells and manipulation of raw energy.',
        'Protege aliados das suas magias aéreas.': 'Protects allies from your area spells.',
        'Recebe 2 pontos de Ki, que recuperam em descanso curto/longo. Eles são gastos para fazer as seguintes habilidades como Ação Bônus: Rajada de Golpes (dois ataques desarmados extras), Defesa Paciente (Esquiva) ou Passo do Vento (Disparar/Desengajar e dobra distância de salto).': 'You gain 2 ki points, which recover on a short or long rest. They are spent to use the following abilities as a bonus action: Flurry of Blows (two extra unarmed strikes), Patient Defense (Dodge) or Step of the Wind (Dash/Disengage and doubled jump distance).',
        'Seu deslocamento aumenta em 3 metros (10 pés) se estiver sem armadura ou escudo.': 'Your speed increases by 10 feet if you are not wearing armor or a shield.',
        'Esperto (Canny): escolha uma perícia em que você já é proficiente; o bônus de proficiência dela é dobrado.': 'Canny: choose a skill in which you are already proficient; your proficiency bonus for it is doubled.',
        'Magia nível 1: Modificador de Carisma + 1 (magias preparadas; baseado na metade do seu nível).': 'Level 1 spells: Charisma modifier + 1 (prepared spells; based on half your level).',
        'Escolha de perícias iniciais da classe Ranger (Revised).': 'Choice of starting skills for the Ranger (Revised) class.',
        'Escolha de perícias iniciais da classe Ranger (Ambuscade).': 'Choice of starting skills for the Ranger (Ambuscade) class.',
        'Escolha de perícias iniciais da classe Ranger (No Spells).': 'Choice of starting skills for the Ranger (No Spells) class.',
        'Conhece o truque Zombaria Cruel (Vicious Mockery). No 3º nível, pode conjurar Enfeitiçar Pessoa (Charm Person) como magia de 2º círculo, uma vez por descanso longo. No 5º nível, pode conjurar também Fascinar (Enthrall), uma vez por descanso longo. Carisma é a habilidade de conjuração. Substitui o Legado Infernal.': 'You know the Vicious Mockery cantrip. At 3rd level, you can cast Charm Person as a 2nd-level spell once per long rest. At 5th level, you can also cast Enthrall once per long rest. Charisma is your spellcasting ability. Replaces Infernal Legacy.',
        'Substitui apenas a Repreensão Infernal do Legado Infernal: conhece o truque Taumaturgia; no 3º nível, pode conjurar Mãos Flamejantes (Burning Hands) como magia de 2º círculo, uma vez por descanso longo; no 5º nível, pode conjurar Escuridão, uma vez por descanso longo. Carisma é a habilidade de conjuração.': 'Replaces only the Hellish Rebuke of Infernal Legacy: you know the Thaumaturgy cantrip; at 3rd level, you can cast Burning Hands as a 2nd-level spell once per long rest; at 5th level, you can cast Darkness once per long rest. Charisma is your spellcasting ability.',
        'Segredo Mágico': 'Magical Secret', 'Espaços de Magia': 'Spell Slots', 'Magias Conhecidas de 1º Nível ou Superior': 'Known Spells of 1st Level or Higher',
        'Habilidade de Conjuração': 'Spellcasting Ability', 'Arcana Mística': 'Mystic Arcanum', 'Doenças': 'Diseases', 'Ser enfeitiçada': 'Being charmed',
        'Ataques e dano não mágicos': 'Nonmagical attacks and damage', 'ataques e dano não mágicos': 'nonmagical attacks and damage',
        'Ataques e dano não mágicos, doenças e veneno': 'Nonmagical attacks and damage, diseases and poison',
        'Doenças, e tem vantagem em testes de resistência contra ficar paralisado ou envenenado': 'Diseases, and has advantage on saving throws against being paralyzed or poisoned',
        'Doenças, e tem vantagem em testes de resistência contra ficar paralisado ou envenenado, ataques e dano não mágicos': 'Diseases, and has advantage on saving throws against being paralyzed or poisoned, nonmagical attacks and damage',
        'para evitar ou encerrar a condição enfeitiçado em si mesmo': 'to avoid or end the charmed condition on yourself',
        'plantas criadas ou manipuladas magicamente para impedir o movimento, como as criadas pela magia constrição': 'magically created or manipulated plants meant to impede movement, such as those created by the entangle spell',
        'Escudos (druidas não usam armadura nem escudo de metal)': 'Shields (druids will not wear armor or use shields made of metal)',
        'escudos (druidas não usam armadura nem escudo de metal)': 'shields (druids will not wear armor or use shields made of metal)'
    });
    Idioma.padrao(/^Escolha uma opção de (.+)\. As habilidades de cada nível estão listadas dentro da opção\.$/, 'Choose an option for $1. The features for each level are listed inside the option.');

    // tela da ficha e folha impressa
    Idioma.padrao(/^(\d+)º círculo$/, (m, n) => ord(n) + ' level');
    Idioma.padrao(/^(\d+)º círculo \(pacto\)$/, (m, n) => ord(n) + ' level (pact)');
    Idioma.padrao(/^(\d+(?:d\d+)?(?: ?[+\-] ?\d+)?) (cont|cort|perf)\.$/, (m, v, t) => v + ' ' + (t === 'cont' ? 'bludg.' : t === 'cort' ? 'slash.' : 'pierc.'));
    Idioma.padrao(/^(.+) passiva$/, (m, n) => 'Passive ' + T(n));
    Idioma.padrao(/^(\d+(?:,\d+)?) m$/, (m, v) => mPes(v) + ' ft.');
    Idioma.padrao(/^(\d+(?:,\d+)?) kg$/, (m, v) => kgLb(v) + ' lb.');
    Idioma.padrao(/^de (\d+(?:,\d+)?) kg \(limite\)\.$/, (m, v) => 'of ' + kgLb(v) + ' lb. (limit).');
    Idioma.padrao(/^Empurrar\/arrastar\/levantar: (\d+(?:,\d+)?) kg\.$/, (m, v) => 'Push/drag/lift: ' + kgLb(v) + ' lb.');
    Idioma.padrao(/^Peso carregado:$/, 'Weight carried:');
    Idioma.padrao(/^(\d+) magia\(s\)$/, '$1 spell(s)');
    Idioma.padrao(/^(\d+) talento\(s\)$/, '$1 feat(s)');
    Idioma.padrao(/^Fonte: (.*)$/, 'Source: $1');
    Idioma.padrao(/^Pré-requisito: (.*)$/, 'Prerequisite: $1');
    Idioma.padrao(/^Componentes: (.*)$/, 'Components: $1');
    Idioma.padrao(/^Classes: (.*)$/, 'Classes: $1');
    Idioma.padrao(/^Total: (.+) PO$/, 'Total: $1 gp');
    Idioma.padrao(/^\+ (\d+)( nas últimas páginas)?\.$/, (m, n, p) => '+ ' + n + (p ? ' on the last pages' : '') + '.');
    Idioma.padrao(/^(\d+)x\/desc\. (curto|longo)$/, (m, n, t) => n + 'x/' + (t === 'curto' ? 'short' : 'long') + ' rest');
    Idioma.padrao(/^Arcana Mística \((\d+)º círculo\)$/, (m, n) => 'Mystic Arcanum (' + ord(n) + ' level)');
    Idioma.padrao(/^Cura 1d10 \+ (\d+)\.$/, 'Heals 1d10 + $1.');
    Idioma.padrao(/^Recupera espaços de magia \(soma até (\d+) círculos, nenhum acima do 5º\) num descanso curto\.$/, 'Recovers spell slots (combined level up to $1, none above 5th level) on a short rest.');
    Idioma.padrao(/^(.+) \(continuação\)$/, (m, n) => T(n) + ' (continued)');
    Idioma.padrao(/^Aumento de atributo \((.+)\)$/, (m, c) => 'Ability Score Improvement (' + TC(c) + ')');
    // "Mago 5 (Escola de Abjuração) / Guerreiro 2": só vale quando o primeiro nome tem tradução
    const reClasses = /^[^()\/\u00b7:]+? \d+(?: \([^()]+\))?(?: \/ [^()\/\u00b7:]+? \d+(?: \([^()]+\))?)*$/;
    Idioma.padrao(cond(k => { const x = reClasses.test(k) && /^(.+?) \d+/.exec(k); return !!x && Idioma.traduzirTexto(x[1]) != null; }), CT);
    Idioma.padrao(/^\+(\d+) PV$/, '+$1 HP');
    Idioma.padrao(/^\+ (\d+) \(bônus por nível\)$/, '+ $1 (bonus per level)');

    // subir de nível
    Idioma.padrao(/^Com (.+) XP o personagem já alcança o nível (\d+) \(hoje está no (\d+)\)\.$/, 'With $1 XP the character already reaches level $2 (currently at $3).');
    Idioma.padrao(/^(.+) XP: faltam (.+) para o nível (\d+)\.$/, '$1 XP: $2 more needed for level $3.');
    Idioma.padrao(/^nível (\d+) para (\d+)( · .+)?$/, (m, a, b, s) => 'level ' + a + ' to ' + b + (s ? ' \u00b7 ' + T(s.slice(3)) : ''));
    Idioma.padrao(/^exige (.+)$/, (m, r) => 'requires ' + T(r));
    Idioma.padrao(/^(.+): nível (\d+) para (\d+)$/, (m, c, a, b) => T(c) + ': level ' + a + ' to ' + b);
    Idioma.padrao(/^(.+?): (.+) \(nível total (\d+)\)\.(?: (.+))?$/, (m, nome, c, n, dica) => nome + ': ' + CT(c) + ' (total level ' + n + ').' + (dica ? ' ' + T(dica) : ''));
    Idioma.padrao(/^Nível total (\d+) · (.+)$/, (m, n, c) => 'Total level ' + n + ' \u00b7 ' + T(c));
    Idioma.padrao(/^Dado de vida d(\d+), valor fixo (\d+)( \(dado cheio\))? \+ Constituição (\S+?)( \+ \d+ \(bônus por nível\))?\. PV máximos: (\d+) para$/,
        (m, d, v, cheio, con, b, antes) => 'Hit die d' + d + ', fixed value ' + v + (cheio ? ' (full die)' : '') + ' + Constitution ' + con + (b ? ' + ' + /\d+/.exec(b)[0] + ' (bonus per level)' : '') + '. Max HP: ' + antes + ' to');
    Idioma.padrao(/^Bônus de proficiência: (.+) para$/, 'Proficiency bonus: $1 to');
    Idioma.padrao(/^Espaços de magia: (.+) para$/, (m, a) => 'Spell slots: ' + a.replace(/(\d+)º/g, (x, n) => ord(n)) + ' to');
    Idioma.padrao(/^Espaços de magia:$/, 'Spell slots:');
    Idioma.padrao(/^\(novos\)\.$/, '(new).');
    Idioma.padrao(/^Perícia:$/, 'Skill:');
    Idioma.padrao(/^1 (da lista da classe|à sua escolha) \(escolha abaixo\)$/, (m, a) => '1 ' + (a === 'à sua escolha' ? 'of your choice' : 'from the class list') + ' (choose below)');
    Idioma.padrao(/^Você esqueceu (.+): escolha a nova magia conhecida abaixo\.$/, (m, s) => 'You forgot ' + T(s) + ': choose the new known spell below.');
    Idioma.padrao(/^Ao entrar nesta classe você ganha uma proficiência em perícia( da lista dela| à sua escolha)\.$/, (m, a) => 'On entering this class you gain one skill proficiency' + (a === ' da lista dela' ? ' from its list.' : ' of your choice.'));
    Idioma.padrao(/^Esquecer (.+)$/, (m, s) => 'Forget ' + T(s));
    Idioma.padrao(/^Nova classe: (.+)$/, (m, c) => 'New class: ' + T(c));
    Idioma.padrao(/^Faltam (\d+) escolha\(s\): (.+?)(\.\.\.)?\.$/, (m, n, l, r) => n + ' choice(s) missing: ' + T(l) + (r || '') + '.');
    Idioma.padrao(/^Falta decidir: (.+)\.$/, (m, c) => 'Still to decide: ' + T(c) + '.');
    Idioma.padrao(/^Atributos insuficientes: (.+)$/, (m, l) => {
        const A = { For: 'Str', Des: 'Dex', Con: 'Con', Int: 'Int', Sab: 'Wis', Car: 'Cha' };
        return 'Insufficient ability scores: ' + l.split('; ').map(p => { const x = /^(.+?) exige (.+?)\.?$/.exec(p); return x ? T(x[1]) + ' requires ' + x[2].replace(/\b(For|Des|Con|Int|Sab|Car)\b/g, a => A[a]).replace(/ e /g, ' and ') : T(p); }).join('; ') + '.';
    });
    Idioma.padrao(/^Nível (\d+) confirmado: (.+), \+(\d+) PV\.$/, (m, n, c, pv) => 'Level ' + n + ' confirmed: ' + TC(c.replace(/ \(classe nova\)/, ' (new class)')) + ', +' + pv + ' HP.');
    Idioma.padrao(/^: (.+) \(classe nova\)(.*)$/, (m, c, r) => ': ' + T(c) + ' (new class)' + r.replace(/ trocou /, ' swapped '));
    Idioma.padrao(/^Não foi possível abrir o personagem: (.+)$/, 'Could not open the character: $1');
    Idioma.padrao(/^Itens que não existem mais foram ignorados: (.+)$/, 'Items that no longer exist were ignored: $1');

    // mensagens das regras (criação, opções, perícias, magias, armazenamento)
    Idioma.adicionar({
        'Sem armadura: 10 + Des': 'No armor: 10 + Dex',
        'Defesa sem Armadura do Bárbaro: 10 + Des + Con': 'Barbarian Unarmored Defense: 10 + Dex + Con',
        'Defesa sem Armadura do Monge: 10 + Des + Sab': 'Monk Unarmored Defense: 10 + Dex + Wis',
        'Sem armadura: 10 + Des (o escudo anula a Defesa sem Armadura do Monge)': 'No armor: 10 + Dex (the shield negates the Monk\u2019s Unarmored Defense)',
        'Este item não tem preço de tabela e não pode ser comprado.': 'This item has no list price and cannot be bought.',
        'A loja só está disponível no modo "Ouro inicial".': 'The shop is only available in "Starting gold" mode.',
        'Opção Padrão': 'Default option', 'Outras versões': 'Other versions',
        'Perícia substituta': 'Replacement skill', '+2 em um atributo': '+2 to one ability score', '+1 em dois atributos': '+1 to two ability scores',
        'Sem nome': 'Unnamed', 'Personagem não encontrado.': 'Character not found.', '(cópia)': '(copy)',
        'Arquivo inválido (não é JSON).': 'Invalid file (not JSON).', 'Arquivo sem dados de personagem.': 'File contains no character data.', 'Não há rascunho.': 'There is no draft.',
        'Terreno do Círculo': 'Circle Terrain', 'Truques do Estilo de Luta': 'Fighting Style Cantrips',
        'Uma vez por descanso longo, sem gastar espaço.': 'Once per long rest, without expending a spell slot.',
        'Int/Sab/Car (à escolha)': 'Int/Wis/Cha (your choice)',
        'Gigante da Colina': 'Hill Giant', 'Rolar os seis valores': 'Roll the six values', 'Rolar novamente': 'Roll again', 'Nada encontrado.': 'Nothing found.',
        'Nome': 'Name', 'Custo': 'Cost', 'Dano': 'Damage', 'Peso': 'Weight', 'Propriedades': 'Properties', 'Detalhes': 'Details', 'CA': 'AC',
        'Preparo:': 'Preparation:', 'prepara magias após cada descanso longo': 'prepares spells after each long rest',
        'grimório e magias preparadas': 'spellbook and prepared spells', 'magias conhecidas': 'known spells','Ver texto completo': 'Show full text', 'Ocultar texto': 'Hide text', 'Dê um nome ao item.': 'Give the item a name.',
        'Não foi possível ler a imagem.': 'Could not read the image.', 'Não foi possível abrir a foto.': 'Could not open the photo.', 'nenhum': 'none', 'nenhuma': 'none',
        'O que a multiclasse concede': 'What multiclassing grants',
        'abra pelo servidor local (o navegador bloqueia a leitura dos arquivos de dados ao abrir direto). No terminal, na pasta do projeto: node tools/serve.js  e depois http://127.0.0.1:5500/':
            'open it through the local server (the browser blocks reading the data files when opened directly). In a terminal, in the project folder: node tools/serve.js  and then http://127.0.0.1:5500/','Gigante de Pedra/Gelo': 'Stone/Frost Giant', 'Gigante de Fogo': 'Fire Giant', 'Gigante das Nuvens': 'Cloud Giant', 'Gigante da Tempestade': 'Storm Giant',
        'Magias copiadas para o grimório. As magias preparadas do dia são marcadas na ficha.': "Spells copied into the spellbook. The day's prepared spells are marked on the sheet."
    });
    Idioma.padrao(/^Pontos insuficientes: custaria (\d+) de (\d+)\.$/, 'Not enough points: it would cost $1 of $2.');
    Idioma.padrao(/^Substitui da raça base: (.+)\.$/, (m, l) => 'Replaces from the base race: ' + T(l) + '.');
    Idioma.padrao(/^No máximo (\d+) magia\(s\) podem ser de fora das escolas da subclasse \((.+)\)\.$/, (m, n, l) => 'At most ' + n + ' spell(s) may be from outside the subclass schools (' + T(l) + ').');
    Idioma.padrao(/^Selecione exatamente (\d+) opções\.$/, 'Select exactly $1 options.');
    Idioma.padrao(/^Perícia substituta \((.+)\)$/, (m, p) => 'Replacement skill (' + T(p) + ')');
    Idioma.padrao(/^Você já recebe (.+) da raça ou da classe\. Uma mesma proficiência não vem duas vezes: escolha outra perícia no lugar da que o antecedente concede\.$/,
        (m, p) => 'You already receive ' + T(p) + ' from your race or class. The same proficiency cannot be gained twice: choose another skill in place of the one the background grants.');
    Idioma.padrao(/^Pact of the (.+) \(escolha o pacto antes\)$/, 'Pact of the $1 (choose the pact first)');
    Idioma.padrao(/^Já preparadas pela subclasse: (.+)\.$/, (m, l) => 'Already prepared by the subclass: ' + (l === 'nenhuma' ? 'none' : T(l)) + '.');
    Idioma.padrao(/^ESCOLHA LIVRE \(fora das escolas da subclasse\) · (.*)$/, (m, d) => 'FREE CHOICE (outside the subclass schools) \u00b7 ' + T(d));
    Idioma.padrao(/^Todas devem ser de (.+), exceto até (\d+) de qualquer escola \(as aprendidas nos níveis 3, 8, 14 e 20\)\.$/,
        (m, l, n) => 'All must be from ' + T(l).replace(/ ou /g, ' or ') + ', except up to ' + n + ' of any school (those learned at levels 3, 8, 14 and 20).');
    Idioma.padrao(/^(.+) \(cópia\)$/, '$1 (copy)');
    Idioma.padrao(/^(?:## )?(Astuto|Andarilho|Incansável) \((\d+)º Nível\)$/, (m, n, l) => ({ 'Astuto': 'Canny', 'Andarilho': 'Roving', 'Incansável': 'Tireless' }[n]) + ' (Level ' + l + ')');
    Idioma.padrao(/^Mais (\d+) itens: refine a busca\.$/, '$1 more items: refine the search.');
    Idioma.padrao(/^\+1 em (dois|\d+) valores de habilidade diferentes, à sua escolha\.$/, (m, n) => '+1 to ' + (n === 'dois' ? 'two' : n) + ' different ability scores of your choice.');
    Idioma.padrao(/^(\d+) resultados?\(s\)$/, '$1 result(s)');
    Idioma.padrao(/^não foi possível ler "(.+)" \((.*)\)$/, 'could not read "$1" ($2)');
    Idioma.padrao(/^"(.+)" não encontrado \(HTTP (\d+)\)$/, '"$1" not found (HTTP $2)');
    Idioma.padrao(/^"(.+)" não é um JSON válido \((.*)\)$/, '"$1" is not valid JSON ($2)');
    Idioma.padrao(/^Não foi possível gravar \(armazenamento cheio ou bloqueado\): (.+)$/, 'Could not save (storage full or blocked): $1');
    Idioma.padrao(/^Escolha não restaurada \((.+)\): (.+)$/, (m, c, l) => 'Choice not restored (' + c + '): ' + T(l));
})();
Idioma.adicionar({ '(leve)': '(light)', '(m\u00e9dia)': '(medium)', '(pesada)': '(heavy)' });
Idioma.adicionar({ 'Geral': 'General', 'Abrir loja': 'Open shop', 'Ajuste antes de imprimir; a ficha ao lado \u00e9 atualizada na hora.': 'Adjust before printing; the sheet beside it updates instantly.', 'O que for gasto em jogo (ra\u00e7\u00e3o, flechas, po\u00e7\u00f5es, ouro) se ajusta aqui; a ficha \u00e9 atualizada na hora. Itens com quantidade 0 n\u00e3o saem na impress\u00e3o.': 'What is spent in play (rations, arrows, potions, gold) is adjusted here; the sheet updates instantly. Items with quantity 0 are not printed.' });
Idioma.adicionar({ 'Defesas': 'Defenses', 'Hist\u00f3rico': 'History', 'Notas': 'Notes', 'Defesas extras': 'Extra defenses', 'Ajuste antes de imprimir; a ficha abaixo \u00e9 atualizada na hora.': 'Adjust before printing; the sheet below updates instantly.', 'Resist\u00eancias, imunidades ou vantagens que o app n\u00e3o detectou aparecem no quadro Defesas da ficha.': 'Resistances, immunities or advantages the app did not detect appear in the sheet Defenses box.' });
Idioma.adicionar({ 'Consultar itens': 'Browse items', 'Buscar item por nome ou texto...': 'Search item by name or text...', 'Buscar item': 'Search item', 'Todas as categorias': 'All categories', 'Item m\u00e1gico': 'Magic item', 'Todas as raridades': 'All rarities', 'Categoria': 'Category', 'Raridade': 'Rarity', 'Requer sintoniza\u00e7\u00e3o': 'Requires attunement', 'Nenhum item encontrado. Livros desligados em Fontes de conte\u00fado escondem seus itens.': 'No items found. Books turned off in Content sources hide their items.', 'Item sem descri\u00e7\u00e3o.': 'No description.' });
Idioma.adicionar({ 'Itens': 'Items', 'Itens m\u00e1gicos': 'Magic items' });
