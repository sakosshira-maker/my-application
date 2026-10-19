import type { DailyWord, LiteraryBook, MoodKey } from "./study-types";

export const MOODS: { key: MoodKey; label: string; emoji: string; color: string; support: string }[] = [
  { key: "joyful", label: "Heureuse", emoji: "🥰", color: "#ffe4ef", support: "Cette joie te va si bien ! Garde une petite trace de ce qui a illuminé ta journée. Je suis fière de toi. 💗" },
  { key: "motivated", label: "Motivée", emoji: "🤩", color: "#fff3c4", support: "Quelle belle énergie ! Choisis un petit objectif, puis garde aussi un moment pour souffler. On avance ensemble ! ✨" },
  { key: "tired", label: "Fatiguée", emoji: "🥱", color: "#e9e1fa", support: "Tu as le droit de ralentir, ma douce. Bois un peu d'eau, repose tes yeux et prends une vraie pause. Une pluie légère peut t'accompagner. 🌧️" },
  { key: "stressed", label: "Tendue", emoji: "🥺", color: "#ddf0f3", support: "Tu n'as pas à tout réussir aujourd'hui. Pose les épaules, expire doucement et choisis une seule petite étape. Je reste près de toi. 🍃" },
];

export const DAILY_WORDS: DailyWord[] = [
  { slug: "etayage", term: "Étayage", category: "Didactique", definition: "Aide temporaire apportée à l'apprenant pour réaliser une tâche, puis retirée progressivement à mesure qu'il devient autonome.", example: "L'enseignante propose un plan de rédaction, puis laisse les élèves construire le leur : c'est un étayage." },
  { slug: "anaphore", term: "Anaphore", category: "Stylistique", definition: "Répétition d'un mot ou d'un groupe de mots au début de plusieurs propositions ou vers.", example: "« Je veux apprendre. Je veux comprendre. Je veux transmettre. » : la répétition de « Je veux » crée une anaphore." },
  { slug: "metacognition", term: "Métacognition", category: "Didactique", definition: "Connaissance et régulation de ses propres processus d'apprentissage.", example: "Après l'exercice, l'élève explique la stratégie qui l'a aidé à trouver la réponse." },
  { slug: "focalisation", term: "Focalisation", category: "Narratologie", definition: "Point de vue qui règle la quantité d'informations donnée au lecteur : interne, externe ou zéro.", example: "En focalisation interne, le lecteur découvre la scène à travers la perception d'un personnage." },
  { slug: "formative", term: "Évaluation formative", category: "Didactique", definition: "Évaluation menée pendant l'apprentissage pour repérer les besoins et ajuster l'enseignement, plutôt que pour classer.", example: "Un court bilan de sortie indique à la professeure quels accords sont à retravailler." },
  { slug: "oxymore", term: "Oxymore", category: "Stylistique", definition: "Rapprochement de deux termes de sens contradictoire dans un même groupe de mots.", example: "« Une obscure clarté » réunit deux mots opposés." },
  { slug: "transposition", term: "Transposition didactique", category: "Didactique", definition: "Transformation d'un savoir savant en savoir à enseigner, puis en savoir effectivement enseigné.", example: "Une étude linguistique complexe devient une activité accessible de repérage en classe." },
  { slug: "isotopie", term: "Isotopie", category: "Analyse littéraire", definition: "Récurrence de traits de sens qui assure une cohérence sémantique dans un texte.", example: "« Brume », « voile » et « ombre » construisent dans un passage une isotopie de l'obscurité." },
  { slug: "differenciation", term: "Différenciation pédagogique", category: "Didactique", definition: "Adaptation des supports, des démarches ou des aides aux besoins des élèves, en maintenant des objectifs communs.", example: "Deux groupes travaillent le même objectif avec des textes de difficulté différente." },
  { slug: "analepse", term: "Analepse", category: "Narratologie", definition: "Retour en arrière du récit vers un événement antérieur au moment raconté.", example: "Le narrateur interrompt la scène présente pour raconter l'enfance de son héroïne." },
  { slug: "prolepse", term: "Prolepse", category: "Narratologie", definition: "Anticipation : le récit évoque un événement qui se produira plus tard.", example: "« Elle ignorait encore que cette rencontre changerait sa vie. » annonce la suite du récit." },
  { slug: "remediation", term: "Remédiation", category: "Didactique", definition: "Ensemble d'activités ciblées pour aider à dépasser une difficulté repérée lors d'un apprentissage.", example: "Après le diagnostic, la classe retravaille les pronoms relatifs avec des phrases à reconstruire." },
  { slug: "hypotypose", term: "Hypotypose", category: "Stylistique", definition: "Description si vive et concrète qu'elle donne l'impression de voir la scène.", example: "Les verbes d'action, les détails sensoriels et les phrases brèves rendent la scène presque visible." },
  { slug: "consigne", term: "Consigne", category: "Didactique", definition: "Instruction précisant la tâche à accomplir, les conditions et les critères de réussite.", example: "« Relevez deux indices et justifiez votre réponse par une citation. » est une consigne observable." },
  { slug: "enonciation", term: "Énonciation", category: "Linguistique", definition: "Acte de produire un énoncé dans une situation donnée : qui parle, à qui, où et quand.", example: "Les mots « je », « ici » et « demain » renvoient à la situation d'énonciation." },
  { slug: "apologue", term: "Apologue", category: "Littérature", definition: "Court récit qui illustre un enseignement moral ou une réflexion, de manière explicite ou implicite.", example: "Une fable peut être étudiée comme un apologue." },
  { slug: "implicite", term: "Implicite", category: "Linguistique", definition: "Sens qui n'est pas formulé directement mais que le lecteur ou l'auditeur infère à partir du contexte.", example: "« Il se fait tard » peut suggérer qu'il est temps de partir." },
  { slug: "autonomie", term: "Autonomie", category: "Didactique", definition: "Capacité à organiser et réguler son activité d'apprentissage avec des ressources et des choix réfléchis.", example: "L'élève utilise une grille pour relire son texte avant de demander l'aide de la professeure." },
  { slug: "chiasme", term: "Chiasme", category: "Stylistique", definition: "Disposition croisée de termes ou de constructions selon un schéma ABBA.", example: "« Il faut manger pour vivre et non vivre pour manger. » présente une structure croisée." },
  { slug: "retroaction", term: "Rétroaction", category: "Didactique", definition: "Information donnée à l'apprenant sur son travail pour l'aider à comprendre ses réussites et à progresser.", example: "« Ton exemple est pertinent ; précise maintenant le lien avec ton argument. » est une rétroaction utile." },
];
export function wordForDate(day: string) {
  const days = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  return DAILY_WORDS[((days % DAILY_WORDS.length) + DAILY_WORDS.length) % DAILY_WORDS.length];
}

type SeedBook = Omit<LiteraryBook, "id" | "createdAt">;
export const LIBRARY_STARTERS: SeedBook[] = [
  {
    slug: "candide", title: "Candide", author: "Voltaire", year: "1759", genre: "Conte philosophique", color: "#e3dcff", status: "À lire",
    characters: "Candide — jeune homme dont les voyages mettent les certitudes à l'épreuve.\nPangloss — maître de l'optimisme philosophique.\nCunégonde — aimée de Candide, confrontée aux violences du monde.\nCacambo — compagnon pratique et fidèle.\nMartin — interlocuteur pessimiste.",
    narrative: "Chassé du château où il a été élevé, Candide traverse un monde marqué par la guerre, l'intolérance et l'injustice. Les épreuves interrogent la doctrine optimiste de Pangloss. Le dénouement privilégie une activité concrète plutôt que les systèmes abstraits.",
    timeline: "1. Vie au château de Thunder-ten-tronckh, puis expulsion.\n2. Guerre, Lisbonne et séisme : confrontation au mal.\n3. Voyage en Amérique et séjour en Eldorado.\n4. Retour vers l'Europe et retrouvailles.\n5. Installation dans une petite métairie : « cultiver notre jardin ».",
    quotes: [{ text: "il faut cultiver notre jardin.", reference: "Chapitre XXX, réplique finale de Candide (extrait)." }],
    notes: "Piste d'analyse : comment l'ironie transforme-t-elle le récit d'aventures en critique philosophique ?",
    sourceUrl: "https://fr.wikisource.org/wiki/Candide,_ou_l’Optimisme/Garnier_1877/Texte_entier",
  },
  {
    slug: "goriot", title: "Le Père Goriot", author: "Honoré de Balzac", year: "1835", genre: "Roman réaliste", color: "#ffd6e8", status: "À lire",
    characters: "Jean-Joachim Goriot — père qui se sacrifie pour ses filles.\nEugène de Rastignac — étudiant ambitieux.\nVautrin — pensionnaire mystérieux et provocateur.\nDelphine de Nucingen et Anastasie de Restaud — filles de Goriot.\nMadame Vauquer — propriétaire de la pension.",
    narrative: "À Paris, dans la pension Vauquer, Rastignac découvre le pouvoir de l'argent et les codes sociaux tandis que Goriot s'appauvrit pour ses filles. Le destin du père et l'apprentissage du jeune homme se répondent dans une critique de l'ambition et des relations intéressées.",
    timeline: "1. Présentation de la pension Vauquer.\n2. Entrée de Rastignac dans les salons parisiens.\n3. Propositions de Vautrin et révélation de son identité.\n4. Ruine et agonie de Goriot.\n5. Enterrement et défi de Rastignac à Paris.",
    quotes: [{ text: "À nous deux maintenant !", reference: "Fin du roman : défi de Rastignac à Paris." }],
    notes: "Piste d'analyse : confronter la description de la pension et celle des salons.",
    sourceUrl: "https://fr.wikisource.org/wiki/Le_Père_Goriot_(1910)/IV",
  },
  {
    slug: "condamne", title: "Le Dernier Jour d'un condamné", author: "Victor Hugo", year: "1829", genre: "Roman à thèse", color: "#cdeffd", status: "À lire",
    characters: "Le condamné — narrateur anonyme, défini par l'attente de l'exécution.\nMarie — sa petite fille.\nLe prêtre, les geôliers et la foule — figures qui entourent sa captivité.",
    narrative: "Le journal fictif d'un condamné à mort fait entendre les pensées, souvenirs et angoisses d'un homme dans l'attente de son exécution. L'effacement de son identité et de son crime universalise la dénonciation de la peine capitale.",
    timeline: "1. La sentence et l'obsession de la mort.\n2. Captivité à Bicêtre et souvenirs du procès.\n3. Transfert à la Conciergerie.\n4. Visite de Marie et solitude du condamné.\n5. Dernière attente avant l'exécution, sans récit de celle-ci.",
    quotes: [{ text: "Condamné à mort !", reference: "Chapitre I, ouverture du journal." }],
    notes: "Piste d'analyse : observer les phrases exclamatives et le rythme de la pensée dans le premier chapitre.",
    sourceUrl: "https://fr.wikisource.org/wiki/Le_Dernier_Jour_d’un_condamné",
  },
  {
    slug: "malade", title: "Le Malade imaginaire", author: "Molière", year: "1673", genre: "Comédie-ballet", color: "#d8f5d0", status: "À lire",
    characters: "Argan — père obsédé par la maladie.\nToinette — servante lucide et inventive.\nAngélique et Cléante — jeunes amoureux.\nBéline — seconde épouse intéressée d'Argan.\nBéralde — frère raisonnable.\nThomas Diafoirus — médecin destiné à Angélique.",
    narrative: "Argan veut marier sa fille à un médecin pour être soigné sans frais. Toinette et Béralde déjouent ses projets, révèlent les sentiments des proches et mettent en cause la crédulité face à la médecine. La pièce associe intrigue familiale, satire et spectacle.",
    timeline: "Acte I — factures médicales, projet de mariage et conflit familial.\nActe II — visite des Diafoirus et résistance des amoureux.\nActe III — ruses de Toinette, fausse mort et cérémonie burlesque.",
    quotes: [{ text: "Le poumon, le poumon, vous dis-je.", reference: "Acte III, scène 10 : Toinette déguisée en médecin." }],
    notes: "Piste d'analyse : distinguer comique de répétition, de situation et de caractère.",
    sourceUrl: "https://fr.wikisource.org/wiki/Le_Malade_imaginaire",
  },
];
