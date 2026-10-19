import { countFrenchWords, type OralMetrics, type OralReview } from "./study-types";

export function localOralReview(metrics: OralMetrics, transcript: string): OralReview {
  const words = transcript.trim() ? countFrenchWords(transcript) : null;
  const wordsPerMinute = words !== null && metrics.duration > 0 ? Math.round(words * 60 / metrics.duration) : null;
  const advice: string[] = [], strengths: string[] = ["Tu as pris le temps de t'entraîner à voix haute : c'est une vraie étape vers la classe."];
  if (wordsPerMinute === null) advice.push("Ajoute une transcription fidèle de ce que tu as réellement dit pour estimer le débit. Un texte seulement prévu pour la lecture ne suffit pas.");
  else if (wordsPerMinute > 165) advice.push("Le débit estimé est rapide. Sépare les idées par une pause et ralentis les définitions nouvelles.");
  else if (wordsPerMinute < 100) advice.push("Le débit estimé est posé. Si ce n'est pas une lecture expressive, essaie de regrouper les mots en courtes unités de sens.");
  else strengths.push("Le débit estimé se situe dans une zone souvent confortable pour une explication ; adapte-le au public et à la difficulté.");
  if (metrics.rmsDb < -36) advice.push("Le niveau enregistré semble faible. Rapproche légèrement le micro et fais un essai, sans forcer ta voix.");
  else if (metrics.clippedPercent > 0.1) advice.push("Le signal présente de la saturation. Éloigne un peu le micro pour éviter de déformer les sons.");
  else strengths.push("Le niveau du signal paraît exploitable pour une réécoute, sans saturation importante.");
  if (metrics.silencePercent > 45) advice.push("L'estimation détecte beaucoup de silence. Prépare trois mots-clés et réessaie, tout en gardant des pauses utiles.");
  if (metrics.longPauses > 4) advice.push("Plusieurs pauses longues sont détectées. Écoute-les : sont-elles expressives, respiratoires ou liées à une hésitation ?");
  advice.push("À la réécoute, souligne les mots essentiels et vérifie que la fin de chaque phrase reste audible.");
  return {
    source: "local", transcript, words, wordsPerMinute, strengths, advice,
    articulation: "Non évaluée par les seules mesures acoustiques. Réécoute les voyelles nasales, les liaisons et les fins de mots ; l'écoute IA optionnelle peut proposer des observations contextualisées.",
    intonation: "Non notée automatiquement ici. Essaie de varier l'intonation entre une question, une définition et un exemple.",
    exercise: "Explique la même notion en 45 secondes : une phrase d'introduction, un exemple, puis une question adressée aux élèves. Réécoute et compare les deux essais.",
    limitation: "Mesures indicatives : le silence dépend du bruit ambiant et du microphone. Le débit utilise la durée totale, pauses comprises, et la transcription fournie. Aucun score de prononciation n'est inventé.",
  };
}
