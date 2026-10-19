import { generateLesson } from "@/lib/lesson-generator";
import { errorResponse, num, readBody, str, StudyError } from "@/lib/study-server";
export async function POST(req: Request) {
  try {
    const b = await readBody(req);
    const title = str(b.title, "Titre du cours", 250, true), level = str(b.level, "Niveau", 120, true), kind = str(b.kind, "Domaine", 80, true);
    const duration = num(b.duration, "Durée", 15, 180);
    if (!Number.isInteger(duration)) throw new StudyError("La durée doit être entière.");
    if (!["Langue & grammaire", "Lecture analytique", "Expression orale", "Production écrite"].includes(kind)) throw new StudyError("Domaine invalide.");
    return Response.json({ draft: generateLesson(title, level, kind, duration, str(b.support ?? "", "Support", 6000)), source: "Trame pédagogique guidée, à adapter au programme et aux besoins de la classe." });
  } catch (e) { return errorResponse(e); }
}
