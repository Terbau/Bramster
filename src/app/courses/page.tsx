import { Breadcrumb } from "@/components/Breadcrumb"
import { Courses } from "@/components/Courses"

export default function CoursesPage() {
  return (
    <div className="space-y-4">
      <Breadcrumb links={[{ label: "Courses", href: "/courses" }]} />
      <h1 className="text-4xl font-bold">Courses</h1>
      <Courses />
    </div>
  )
}
