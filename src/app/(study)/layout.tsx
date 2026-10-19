import type { ReactNode } from "react";
import { StudyShell } from "@/components/study-ui";
export default function Layout({ children }: { children: ReactNode }) { return <StudyShell>{children}</StudyShell>; }
