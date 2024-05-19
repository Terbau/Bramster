import { Courses } from "@/components/Courses"
import Link from "next/link"

export default function Home() {
  return (
    <div>
      <div className="mt-4 flex flex-col md:flex-row gap-x-8 md:items-end">
        <h1 className="md:mt-4 text-6xl font-bold">Bramster</h1>
        <span className="text-xl text-gray-500">
          The future of learning (not really...)
        </span>
      </div>

      <Link href="/courses" className="w-fit block">
        <h2 className="mt-16 text-2xl font-semibold mb-4 w-fit hover:text-gray-800">Courses »</h2>
      </Link>
      <Courses />
    </div>
  )
}
