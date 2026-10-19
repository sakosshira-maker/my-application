import { NextResponse } from "next/server";
import { correctFrench, type Correction, type CorrectionResult } from "@/lib/frenchCorrector";

export const dynamic = "force-dynamic";

interface LTMatch {
  message?: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements?: Array<{ value: string }>;
  rule?: { id?: string; description?: string; category?: { id?: string; name?: string }; issueType?: string };
}

/**
 * Professeur virtuel universitaire.
 * 1. LanguageTool (mode picky) : orthographe, grammaire, accords, conjugaison,
 *    typographie, répétitions et style.
 * 2. OpenAI optionnel : reformulation/syntaxe/sens plus fin.
 * 3. Correcteur local : secours hors ligne et règles pédagogiques supplémentaires.
 */
export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = String(body?.text || "");
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({ corrected: text, corrections: [], encouragement: "Écris quelques phrases et je les corrigerai ! ✨", source: "local" });
  }

  // L'API publique accepte jusqu'à 20 Ko. Une page de cahier est limitée ici à 12 000 caractères.
  text = text.slice(0, 12_000);
  const local = correctFrench(text);

  let languageTool: CorrectionResult | null = null;
  try {
    languageTool = await correctWithLanguageTool(text);
  } catch {
    // Réseau indisponible : le moteur local continue de fonctionner.
  }

  let ai: CorrectionResult | null = null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && text.length <= 6_000) {
    try { ai = await correctWithOpenAI(text, apiKey); } catch {}
  }

  const merged = mergeResults(text, languageTool, local, ai);
  return NextResponse.json({
    ...merged,
    source: ai ? "LanguageTool + IA" : languageTool ? "LanguageTool (strict)" : "local",
  });
}

async function correctWithLanguageTool(text: string): Promise<CorrectionResult | null> {
  const endpoint = process.env.LANGUAGETOOL_URL || "https://api.languagetool.org/v2/check";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14_000);
  try {
    const form = new URLSearchParams({
      text,
      language: "fr",
      level: "picky",
      enabledOnly: "false",
    });
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: form.toString(),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const matches = (Array.isArray(data.matches) ? data.matches : []) as LTMatch[];
    const corrections: Correction[] = matches
      .filter((m) => Number.isFinite(m.offset) && m.length > 0)
      .map((m) => {
        const wrong = text.slice(m.offset, m.offset + m.length);
        const candidates = (m.replacements || []).map((r) => r.value).filter(Boolean);
        // Quand plusieurs corrections sont possibles, préserver d'abord le déterminant/pronom
        // (« Les étudiant » → « Les étudiants », et non « L'étudiant »).
        const firstWord = wrong.trim().split(/\s+/)[0]?.toLocaleLowerCase("fr");
        const preserving = candidates.find((candidate) => candidate.trim().split(/\s+/)[0]?.toLocaleLowerCase("fr") === firstWord);
        const right = preserving || candidates[0] || wrong;
        const category = m.rule?.category?.name;
        const baseReason = m.message || m.shortMessage || m.rule?.description || "Formulation à vérifier.";
        return {
          wrong,
          right,
          reason: category ? `${category} : ${baseReason}` : baseReason,
          start: m.offset,
          length: m.length,
          ruleId: m.rule?.id,
          category: m.rule?.category?.id || m.rule?.issueType,
        } as Correction;
      });

    return {
      corrected: applyByOffsets(text, corrections),
      corrections,
      encouragement: corrections.length
        ? `J'ai relevé ${corrections.length} point${corrections.length > 1 ? "s" : ""} à améliorer. Lis bien chaque règle : c'est ainsi qu'on progresse ! 📚`
        : "Excellent : orthographe, grammaire et style sont corrects selon l'analyse stricte. 🌸",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function applyByOffsets(text: string, corrections: Correction[]): string {
  let output = text;
  const usable = corrections
    .filter((c) => typeof c.start === "number" && typeof (c as any).length === "number" && c.right && c.right !== c.wrong)
    .sort((a, b) => (b.start ?? 0) - (a.start ?? 0));
  const occupied: Array<[number, number]> = [];
  for (const c of usable) {
    const start = c.start!;
    const end = start + ((c as any).length as number);
    if (occupied.some(([a, b]) => start < b && end > a)) continue;
    output = output.slice(0, start) + c.right + output.slice(end);
    occupied.push([start, end]);
  }
  return output;
}

function mergeResults(text: string, ...results: Array<CorrectionResult | null>): CorrectionResult {
  const corrections: Correction[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (!result) continue;
    for (const original of result.corrections) {
      const c: Correction = { ...original };
      if (typeof c.start !== "number") {
        const from = corrections
          .filter((x) => x.wrong === c.wrong && typeof x.start === "number")
          .reduce((max, x) => Math.max(max, (x.start ?? -1) + 1), 0);
        const idx = text.toLocaleLowerCase("fr").indexOf(c.wrong.toLocaleLowerCase("fr"), from);
        if (idx >= 0) c.start = idx;
      }
      if (typeof c.start === "number" && !c.length) c.length = c.wrong.length;
      // Les résultats sont fusionnés par ordre de fiabilité (LanguageTool, local, IA).
      // Une suggestion moins prioritaire ne doit jamais chevaucher une analyse déjà validée.
      if (typeof c.start === "number") {
        const end = c.start + (c.length || c.wrong.length);
        const overlaps = corrections.some((existing) => {
          if (typeof existing.start !== "number") return false;
          const existingEnd = existing.start + (existing.length || existing.wrong.length);
          return c.start! < existingEnd && end > existing.start;
        });
        if (overlaps) continue;
      }
      const key = `${c.start ?? "x"}:${c.wrong.toLocaleLowerCase("fr")}:${c.right.toLocaleLowerCase("fr")}`;
      if (!seen.has(key)) { seen.add(key); corrections.push(c); }
    }
  }

  corrections.sort((a, b) => (a.start ?? 999999) - (b.start ?? 999999));
  return {
    corrected: applyByOffsets(text, corrections),
    corrections,
    encouragement: corrections.length
      ? `Analyse universitaire stricte : ${corrections.length} point${corrections.length > 1 ? "s" : ""} à revoir. Je t'explique chacun ci-dessous. 🎓`
      : "Bravo ! L'analyse stricte n'a trouvé aucune erreur d'orthographe, de grammaire ou de style. 🌸",
  };
}

async function correctWithOpenAI(text: string, apiKey: string): Promise<CorrectionResult | null> {
  const system = `Tu es une professeure universitaire de langue française, exigeante, précise et pédagogue.
Analyse le texte dans TOUS ces domaines : orthographe lexicale et grammaticale, accents, accords, conjugaison, morphologie, syntaxe, construction des phrases, prépositions, déterminants, pronoms, concordance des temps, ponctuation, typographie française, vocabulaire, registre, style académique, clarté, cohérence, répétitions, maladresses, contresens et exactitude des règles de français mentionnées.
Ne signale jamais une forme correcte. Ne transforme pas le sens. Explique chaque erreur avec sa règle exacte.
Réponds UNIQUEMENT avec un objet JSON valide :
{"corrected":"texte entièrement corrigé","corrections":[{"wrong":"extrait exact","right":"correction","reason":"explication pédagogique précise"}],"encouragement":"retour bref, bienveillant mais exigeant"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_CORRECTOR_MODEL || "gpt-4o-mini",
        temperature: 0.05,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: text }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return {
      corrected: String(parsed.corrected ?? text),
      corrections: Array.isArray(parsed.corrections)
        ? parsed.corrections.filter((c: any) => c?.wrong && c?.right).map((c: any) => ({
            wrong: String(c.wrong), right: String(c.right), reason: String(c.reason || "À corriger."),
          }))
        : [],
      encouragement: String(parsed.encouragement ?? "Continue : relis chaque règle attentivement. 🌸"),
    };
  } finally {
    clearTimeout(timeout);
  }
}
