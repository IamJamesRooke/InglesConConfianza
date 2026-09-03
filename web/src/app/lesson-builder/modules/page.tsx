import { BuilderNav } from "@/components/lesson-builder/builder-nav";
import { ModuleEditor } from "@/components/lesson-builder/module-editor";
import { readCourseView } from "@/lib/lesson-builder/server/course-view";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const course = await readCourseView();

  return (
    <main className="flex-1 bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-[1400px]">
        <BuilderNav active="modules" />
        <p className="mb-5 mt-4 text-sm text-muted-foreground">
          Pick a module on the left. Each has one learner promise and the
          sentence that proves it. Drag a lesson onto another module in the list
          to move it there; drag within the list to reorder.
        </p>

        <ModuleEditor
          initialModules={course.modules}
          lessons={course.lessons}
        />
      </div>
    </main>
  );
}
