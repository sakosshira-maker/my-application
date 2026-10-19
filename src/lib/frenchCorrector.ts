// Correcteur de français strict et hors-ligne — détecte les fautes en direct.
// Règles : élisions, conjugaisons, homophones, mots composés, répétitions, accents.

export interface Correction {
  wrong: string;
  right: string;
  reason: string;
  start?: number; // index exact dans le texte
  length?: number;
  ruleId?: string;
  category?: string;
}

export interface CorrectionResult {
  corrected: string;
  corrections: Correction[];
  encouragement: string;
}

interface Rule {
  re: RegExp;
  replace: string | ((m: RegExpMatchArray) => string);
  reason: string;
}

// ─── Conjugaison : sujets + verbes fréquents ───
const CONJUGATIONS: Record<string, Record<string, string>> = {
  parler: { je: "parle", tu: "parles", il: "parle", nous: "parlons", vous: "parlez", ils: "parlent" },
  aimer: { je: "aime", tu: "aimes", il: "aime", nous: "aimons", vous: "aimez", ils: "aiment" },
  étudier: { je: "étudie", tu: "étudies", il: "étudie", nous: "étudions", vous: "étudiez", ils: "étudient" },
  apprendre: { je: "apprends", tu: "apprends", il: "apprend", nous: "apprenons", vous: "apprenez", ils: "apprennent" },
  écrire: { je: "écris", tu: "écris", il: "écrit", nous: "écrivons", vous: "écrivez", ils: "écrivent" },
  lire: { je: "lis", tu: "lis", il: "lit", nous: "lisons", vous: "lisez", ils: "lisent" },
  finir: { je: "finis", tu: "finis", il: "finit", nous: "finissons", vous: "finissez", ils: "finissent" },
  choisir: { je: "choisis", tu: "choisis", il: "choisit", nous: "choisissons", vous: "choisissez", ils: "choisissent" },
  suivre: { je: "suis", tu: "suis", il: "suit", nous: "suivons", vous: "suivez", ils: "suivent" },
  comprendre: { je: "comprends", tu: "comprends", il: "comprend", nous: "comprenons", vous: "comprenez", ils: "comprennent" },
  prendre: { je: "prends", tu: "prends", il: "prend", nous: "prenons", vous: "prenez", ils: "prennent" },
  mettre: { je: "mets", tu: "mets", il: "met", nous: "mettons", vous: "mettez", ils: "mettent" },
  dire: { je: "dis", tu: "dis", il: "dit", nous: "disons", vous: "dites", ils: "disent" },
  voir: { je: "vois", tu: "vois", il: "voit", nous: "voyons", vous: "voyez", ils: "voient" },
  donner: { je: "donne", tu: "donnes", il: "donne", nous: "donnons", vous: "donnez", ils: "donnent" },
  aller: { je: "vais", tu: "vas", il: "va", nous: "allons", vous: "allez", ils: "vont" },
  faire: { je: "fais", tu: "fais", il: "fait", nous: "faisons", vous: "faites", ils: "font" },
  pouvoir: { je: "peux", tu: "peux", il: "peut", nous: "pouvons", vous: "pouvez", ils: "peuvent" },
  vouloir: { je: "veux", tu: "veux", il: "veut", nous: "voulons", vous: "voulez", ils: "veulent" },
  devoir: { je: "dois", tu: "dois", il: "doit", nous: "devons", vous: "devez", ils: "doivent" },
  savoir: { je: "sais", tu: "sais", il: "sait", nous: "savons", vous: "savez", ils: "savent" },
  être: { je: "suis", tu: "es", il: "est", nous: "sommes", vous: "êtes", ils: "sont" },
  avoir: { je: "ai", tu: "as", il: "a", nous: "avons", vous: "avez", ils: "ont" },
};

const SUBJECTS = ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"];
const SUBJECT_RE = /\b(je|j'|tu|il|elle|nous|vous|ils|elles)\s+([a-zA-ZÀ-ÿ]+)/g;

// ─── Règles de base ───
const RULES: Rule[] = [
  // Élisions — فقط الكلمات التي تبدأ بحرف متحرك أو h ساكن
  { re: /\b([jJ]e)\s+(ai|aime|aimais|habite|étais|étudie|ignore|oublie|écoute|invite|arrive|espère|essaie|imagine|hésite|adore|accepte|aide|apprends|apprend|apporte|assiste|attends|attend|écris|écrivons|écoutez)\b/g,
    replace: (m) => `${m[1][0] === "J" ? "J" : "j"}'${m[2]}`,
    reason: "Élision obligatoire : « je » devient « j' » devant une voyelle ou un h muet (mais « je suis », « je fais »… لا تتغير)." },
  { re: /\b([lL]e)\s+(ai|aime|aimais|habite|étais|étudie|ignore|oublie|écoute|invite|arrive|espère|essaie|imagine|hésite|anglais|allemand|ami|amie|élève|école|enseignant|étudiant|université|examen|horloge|homme|hôpital|île|image|industrie|institut|océan|ongle|orange|ouest|étage|époque)\b/g,
    replace: (m) => `${m[1][0] === "L" ? "L" : "l"}'${m[2]}`,
    reason: "Élision : « le » devient « l' » devant une voyelle ou un h muet (mais « le livre », « le français »… لا تتغير)." },
  { re: /\b([lL]a)\s+(ai|aime|aimais|habite|étais|étudie|ignore|oublie|écoute|invite|arrive|espère|essaie|imagine|hésite|anglaise|allemande|amie|élève|école|enseignante|étudiante|université|image|industrie|île|océane|orange|époque)\b/g,
    replace: (m) => `${m[1][0] === "L" ? "L" : "l"}'${m[2]}`,
    reason: "Élision : « la » devient « l' » devant une voyelle ou un h muet (لكن « la maison », « la langue »… لا تتغير)." },
  { re: /\b([dD]e)\s+(ai|aime|aimais|habite|étais|étudie|ignore|oublie|écoute|invite|arrive|espère|essaie|imagine|hésite|anglais|allemand|ami|amie|élève|école|enseignant|étudiant|université|image|industrie|île|océan|orange|époque|un|une|examen|exercice)\b/g,
    replace: (m) => `${m[1][0] === "D" ? "D" : "d"}'${m[2]}`,
    reason: "Élision : « de » devient « d' » devant une voyelle ou un h muet (لكن « de la maison », « du livre »… لا تتغير)." },
  { re: /\b([nN]e)\s+(ai|aime|aimais|habite|étais|étudie|ignore|oublie|écoute|invite|arrive|espère|essaie|imagine|hésite|ai|aime|ait|ayons|ayez|aient)\b/g,
    replace: (m) => `${m[1][0] === "N" ? "N" : "n"}'${m[2]}`,
    reason: "Élision : « ne » devient « n' » devant une voyelle ou un h muet (لكن « ne fais pas », « ne parle pas »… لا تتغير)." },
  { re: /\b([qQ]ue)\s+(il|elle|on|ils|elles|un|une|a|e|ai|aime|aimais|habite|étais|étudie|ignore|oublie|écoute|invite|arrive|espère|essaie|imagine|hésite|anglais|allemand|ami|amie|élève|école|enseignant|étudiant|université|image|industrie|île|océan|orange|époque|un|une|examen|exercice)\b/g,
    replace: (m) => `${m[1][0] === "Q" ? "Q" : "q"}u'${m[2]}`,
    reason: "Élision : « que » devient « qu' » devant une voyelle ou un h muet (لكن « que le », « que la »… لا تتغير)." },

  // Mots composés / homophones
  { re: /\bparceque\b/gi, replace: "parce que", reason: "« Parce que » s'écrit en deux mots séparés." },
  { re: /\bquandmême\b/gi, replace: "quand même", reason: "« Quand même » s'écrit en deux mots séparés." },
  { re: /\bbiensur\b/gi, replace: "bien sûr", reason: "« Bien sûr » s'écrit en deux mots avec un accent circonflexe." },
  { re: /\bau\s+jour\s+d'?hui\b/gi, replace: "aujourd'hui", reason: "« Aujourd'hui » s'écrit en un seul mot avec une élision." },
  { re: /\bentrain\s+de\b/gi, replace: "en train de", reason: "« En train de » (action en cours) s'écrit en trois mots." },
  { re: /\bmalgre\s+que\b/gi, replace: "bien que", reason: "« Malgré que » est incorrect : on utilise « bien que » (suivi du subjonctif)." },
  { re: /\bgrace\s+a\b/gi, replace: "grâce à", reason: "« Grâce à » prend un accent circonflexe et une espace insécable." },
  { re: /\bmalgre\b/gi, replace: "malgré", reason: "« Malgré » prend un accent aigu sur le « e »." },
  { re: /\betudié\b/gi, replace: "étudié", reason: "« Étudié » prend un accent aigu sur le premier « e »." },
  { re: /\betudie\b/gi, replace: "étudie", reason: "« Étudie » prend un accent aigu sur le premier « e »." },
  { re: /\betudier\b/gi, replace: "étudier", reason: "« Étudier » prend un accent aigu sur le premier « e »." },
  { re: /\bfrancais\b/gi, replace: "français", reason: "« Français » prend un accent cédille sous le « c »." },
  { re: /\bfrancaise\b/gi, replace: "française", reason: "« Française » prend un accent cédille sous le « c »." },
  { re: /\becole\b/gi, replace: "école", reason: "« École » prend un accent aigu sur le « e »." },
  { re: /\beleve\b/gi, replace: "élève", reason: "« Élève » prend un accent grave sur le « e »." },
  { re: /\btheme\b/gi, replace: "thème", reason: "« Thème » prend un accent grave sur le « e »." },
  { re: /\bachete\b/gi, replace: "acheté", reason: "« Acheté » prend un accent aigu sur le « e » final." },
  { re: /\bcomplete\b/gi, replace: "complété", reason: "« Complété » prend un accent aigu sur le « e » final." },
  { re: /\bcommencé\b/g, replace: "commencé", reason: "Le passé simple d'un verbe en -cer garde l'accent : « commencé »." },
  { re: /\btres\b/gi, replace: "très", reason: "« Très » prend un accent grave sur le « e »." },
  { re: /\bcafe\b/gi, replace: "café", reason: "« Café » prend un accent aigu." },
  { re: /\bthe\b/gi, replace: "thé", reason: "« Thé » prend un accent aigu." },
  { re: /\btele\b/gi, replace: "télé", reason: "« Télé » prend un accent aigu." },
  { re: /\bprof\b/gi, replace: "prof", reason: "« Prof » s'écrit sans accent, mais attention à « professeur »." },
  { re: /\bca\b/gi, replace: "ça", reason: "« Ça » prend une cédille sous le c." },
  // « a/à » et « ou/où » dépendent du contexte : LanguageTool/IA les analyse afin d'éviter les faux positifs.

  // ─── Conjugaison stricte ───
  // Vérifié par la fonction dédiée plus bas.

  // ─── Répétitions ───
  { re: /\b(le|la|les|de|du|des|un|une|et|je|tu|il|elle|nous|vous|ils|elles|que|qui|dans|sur|pour|avec|sans|mais|ou|donc|or|ni|car|tres|bien|mal|tout|tous|toute|toutes|pas|plus|moins|comme|quand|comment|pourquoi|parce|si|est|a|etait|ont|sont|sommes|etes|suis|fais|dis|vais|peux|veux|dois|sais|aime|etudie|apprends|ecris|lis|finis|choisis|comprends|prends|mets|vois|donne|suis|met|fait|dit|voit|lit|ecrit|va|peut|veut|doit|sait)\s+\1\b/gi,
    replace: (m) => m[1],
    reason: "Mot répété deux fois : garde un seul mot." },

  // ─── Ponctuation française ───
  { re: /\s*([;:?!])\s*/g, replace: " $1 ", reason: "En français, on met une espace avant les signes doubles ( ; : ? ! ) et après." },
  { re: /([«])\s*/g, replace: "« ", reason: "Espace après le guillemet ouvrant « ." },
  { re: /\s*([»])/g, replace: " »", reason: "Espace avant le guillemet fermant »." },
  { re: /\s{2,}/g, replace: " ", reason: "Un seul espace entre les mots." },
];

export function correctFrench(text: string): CorrectionResult {
  if (!text || !text.trim()) {
    return { corrected: text, corrections: [], encouragement: "Écris quelques phrases et je les corrigerai avec plaisir ! ✨" };
  }

  let corrected = text;
  const corrections: Correction[] = [];
  const seen = new Set<string>();

  const push = (wrong: string, right: string, reason: string) => {
    if (!wrong || !right || wrong === right) return;
    const key = `${wrong.toLowerCase()}→${right.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    corrections.push({ wrong: wrong.trim(), right: right.trim(), reason });
  };

  for (const rule of RULES) {
    corrected = corrected.replace(rule.re, (...args) => {
      const m = args.slice(0, -2) as unknown as RegExpMatchArray;
      const whole = m[0];
      const replacement = typeof rule.replace === "function" ? rule.replace(m) : whole.replace(rule.re, rule.replace);
      if (replacement !== whole) {
        push(whole.trim(), replacement.trim(), rule.reason);
      }
      return replacement;
    });
  }

  // ─── Conjugaison stricte : sujet + verbe ───
  corrected = corrected.replace(SUBJECT_RE, (whole, subject, form) => {
    const s = subject.toLowerCase().replace("j'", "je");
    const f = form.toLowerCase();
    for (const [verb, forms] of Object.entries(CONJUGATIONS)) {
      // Le mot tapé est-il une forme connue de ce verbe ?
      const isForm = Object.values(forms).includes(f);
      if (!isForm) continue;
      const right = forms[s];
      if (!right) continue;
      if (f !== right) {
        push(`${subject} ${form}`, `${subject} ${right}`,
          `Conjugaison : « ${verb} » se conjugue « ${right} » avec « ${s} » (et non « ${f} »).`);
        return `${subject} ${right}`;
      }
    }
    // Le mot tapé est-il un radical de verbe connu avec une mauvaise terminaison ?
    for (const [verb, forms] of Object.entries(CONJUGATIONS)) {
      const right = forms[s];
      if (!right) continue;
      // radical approximatif : on enlève la terminaison correcte
      const radical = right.replace(/(es|ons|ez|ent|s|t)$/, "");
      if (f.startsWith(radical) && f !== right && f.length >= radical.length) {
        push(`${subject} ${form}`, `${subject} ${right}`,
          `Conjugaison : « ${verb} » se conjugue « ${right} » avec « ${s} ».`);
        return `${subject} ${right}`;
      }
    }
    return whole;
  });

  // ─── Majuscule en début de phrase ───
  corrected = corrected.replace(/(^|[.!?]\s+|\n+)([a-zàâäéèêëîïôöùûüç])/g, (_m, p1, p2) => p1 + p2.toUpperCase());

  if (corrected !== text && !corrections.some((c) => c.reason.includes("Majuscule"))) {
    const firstLower = /^[a-zàâäéèêëîïôöùûüç]/.test(text.trim());
    if (firstLower) {
      push(text.trim().slice(0, 10), text.trim().slice(0, 10).toUpperCase(), "Majuscule : une phrase commence toujours par une majuscule.");
    }
  }

  const encouragement =
    corrections.length === 0
      ? "Bravo ! Je n'ai trouvé aucune faute. Continue comme ça, future professeure ! 🌸"
      : corrections.length <= 2
        ? "Très bien ! Juste quelques petites retouches et c'est parfait. 💕"
        : "Beau travail ! Voici quelques corrections pour briller encore plus. ✨";

  return { corrected, corrections, encouragement };
}
