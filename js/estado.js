// Estado global e dados carregados.
// --- ESTADO GLOBAL ---
// Fontes de conteúdo: UA, terceiros e livros ligados (chave normalizada do livro -> true); só o Player's Handbook vem ligado.
const config = { ua: false, terceiros: false, livros: {}, livrosTodos: false };
const db = { racas: [], classes: [], antecedentes: [], idiomas: [], talentos: [], loja: [], equipInicial: null, conjuracao: null, coordenadas: {}, magias: [], magiasTexto: null, avisos: null };
// Dados que só existem na ficha impressa (a ficha é de papel, o jogo é no lápis): moedas, textos de personalidade/história e campos do cabeçalho.
const novaFolha = () => ({
    moedas: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 }, ouroAutoPC: null,
    alinhamento: '', jogador: '', xp: '', aparencia: '', personalidade: '', ideais: '', vinculos: '', defeitos: '', historia: '', aliados: '', notas: '', defesas: '', historiaAuto: '', historiaEditada: false, tabelas: {}
});
const charState = {
    nivel: 1, outras: [], tasha: false, tashaUsa: {}, origemPersonalizada: false, justificativas: {},
    raca: null, classe: null, antecedente: null, inventario: [], equipInicial: { modo: 'equipamento', escolhas: {}, ouro: null, classeId: null, antecedenteNome: null }, retrato: null, retratoOrig: null, retratoPos: null,
    atributosBase: { For: 8, Des: 8, Con: 8, Int: 8, Sab: 8, Car: 8 }, bonusRacial: {},
    escolhas: { raca: {}, classe: {}, antecedente: {} },
    pvNiveis: [], pvAtual: null, pvTemp: 0, folha: novaFolha(), historico: [], nomePersonagem: '', idSalvo: null
};

// `campos` são os sufixos de txt*/bola* em coordenadas_*.json; a Ficha8.png não tem linha de Intuição e repete Animais (Adestrar/Lidar).
const PERICIAS = [
    { nome: "Acrobacia", attr: "Des", campos: ["Acrobacia"] },
    { nome: "Lidar com Animais", aliases: ["Adestrar Animais"], attr: "Sab", campos: ["AdestrarAnimais", "LidarAnimais"] },
    { nome: "Arcanismo", attr: "Int", campos: ["Arcanismo"] },
    { nome: "Atletismo", attr: "For", campos: ["Atletismo"] },
    { nome: "Atuação", attr: "Car", campos: ["Atuacao"] },
    { nome: "Enganação", aliases: ["Blefar"], attr: "Car", campos: ["Blefar"] },
    { nome: "Furtividade", attr: "Des", campos: ["Furtividade"] },
    { nome: "História", attr: "Int", campos: ["Historia"] },
    { nome: "Intimidação", attr: "Car", campos: ["Intimidacao"] },
    { nome: "Intuição", attr: "Sab", campos: [] },
    { nome: "Investigação", attr: "Int", campos: ["Investigacao"] },
    { nome: "Medicina", attr: "Sab", campos: ["Medicina"] },
    { nome: "Natureza", attr: "Int", campos: ["Natureza"] },
    { nome: "Percepção", attr: "Sab", campos: ["Percepcao"] },
    { nome: "Persuasão", attr: "Car", campos: ["Persuasao"] },
    { nome: "Prestidigitação", attr: "Des", campos: ["Prestidigitacao"] },
    { nome: "Religião", attr: "Int", campos: ["Religiao"] },
    { nome: "Sobrevivência", attr: "Sab", campos: ["Sobrevivencia"] }
];

