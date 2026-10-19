import type { LessonDraft } from "./study-types";

export function generateLesson(title: string, level: string, kind: string, duration: number, support: string): LessonDraft {
  const focus = title.trim();
  const isReading = kind === "Lecture analytique";
  const isOral = kind === "Expression orale";
  const isWriting = kind === "Production écrite";
  const aims = isReading
    ? `• Repérer les informations explicites et les indices d'énonciation dans le support « ${focus} ».\n• Formuler une hypothèse de lecture et la justifier par deux indices précis.\n• Construire une interprétation courte en reliant citation et explication.`
    : isOral
      ? `• Organiser une prise de parole sur « ${focus} » en introduction, développement et conclusion.\n• Illustrer l'idée centrale par un exemple adapté au public de ${level}.\n• Marquer les pauses et articuler les mots clés ; donner une rétroaction respectueuse.`
      : isWriting
        ? `• Analyser la consigne d'écriture portant sur « ${focus} ».\n• Planifier un texte cohérent avec au moins deux idées développées.\n• Réviser le texte à l'aide d'une grille : consigne, progression, connecteurs et langue.`
        : `• Repérer le phénomène « ${focus} » dans un corpus de phrases.\n• Formuler la régularité observée et la vérifier par un contre-exemple.\n• Réemployer cette règle dans trois phrases personnelles, puis justifier les choix.`;
  const times = [0.1, 0.25, 0.2, 0.3].map((r) => Math.max(1, Math.floor(duration * r)));
  times.push(duration - times.reduce((a, b) => a + b, 0));
  const corpus = support.trim() || (isReading ? "Extrait littéraire choisi par l'enseignante (auteur, œuvre, lignes à compléter)." : "Corpus court choisi par l'enseignante, avec exemples et contre-exemple à compléter.");
  return {
    title: focus, level, kind, duration, support: corpus, objectives: aims,
    prerequisites: isReading ? "Comprendre le sens global d'un texte ; distinguer auteur, narrateur et personnage. Vérifier ces acquis en début de séance." : "Recenser les acquis nécessaires au thème. Prévoir deux questions diagnostiques courtes avant de commencer.",
    materials: "Support distribué ou projeté ; tableau ; cahier ; grille de réussite ; petit billet de sortie.",
    assessment: `Évaluation formative : observer les réponses pendant l'activité. En fin de séance, demander une réponse individuelle sur « ${focus} » et un exemple justifié. Critères : pertinence, justification et clarté. Prévoir une reprise ciblée à la séance suivante.`,
    differentiation: "Prévoir une aide graduée (mots clés, exemple guidé, consigne reformulée) sans changer l'objectif. Proposer une tâche de transfert aux élèves déjà à l'aise. Autoriser un temps de préparation en binôme.",
    phases: [
      { name: "Mise en situation", minutes: times[0], teacher: `Présenter le thème « ${focus} », son utilité et les critères de réussite. Faire émerger les représentations initiales.`, learners: "Évoquer les acquis, répondre à deux questions diagnostiques et reformuler l'objectif.", evidence: "Réponses initiales et objectif inscrit au tableau." },
      { name: "Observation", minutes: times[1], teacher: `Distribuer le support. ${isOral ? "Faire écouter ou lire un court modèle ; guider l'observation de son organisation et de ses pauses." : "Poser des questions graduées : repérage, comparaison, justification."}`, learners: isReading ? "Lire, relever les indices et confronter deux hypothèses en binôme." : "Observer les exemples, annoter le support et comparer les réponses en binôme.", evidence: "Indices repérés et premières hypothèses, avec exemples." },
      { name: "Conceptualisation", minutes: times[2], teacher: "Organiser la mise en commun ; questionner les justifications et faire construire une synthèse précise, sans donner d'emblée la réponse.", learners: "Formuler la règle ou la démarche avec leurs mots ; tester la formulation sur un nouvel exemple.", evidence: "Trace écrite co-construite : notion, méthode et exemple commenté." },
      { name: "Application & transfert", minutes: times[3], teacher: "Proposer d'abord une tâche guidée, puis une tâche autonome. Circuler et donner une aide ciblée.", learners: isOral ? `Préparer puis présenter une explication de « ${focus} ». Les pairs observent clarté, structure et pauses avec une grille.` : isWriting ? "Rédiger un paragraphe, échanger une rétroaction puis réviser le brouillon." : isReading ? "Appliquer la démarche à un nouveau passage et rédiger une réponse justifiée." : "Résoudre les exercices puis produire trois phrases originales avec justification.", evidence: "Production individuelle observable et retour sur les critères." },
      { name: "Bilan & évaluation formative", minutes: times[4], teacher: "Recueillir un billet de sortie et identifier le point à reprendre. Donner une courte tâche de consolidation.", learners: "Écrire un acquis, un exemple et une question restante. S'autoévaluer à partir des critères annoncés.", evidence: "Billets de sortie ; adaptation de la séance suivante." },
    ],
  };
}
