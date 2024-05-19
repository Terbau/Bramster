import { Github } from "lucide-react"
import Link from "next/link"

export const Footer = () => {
  return (
    <footer className="px-4 py-8 border-t border-gray-300">
      <div className="container mx-auto">
        <p className="text-center">Built by Terbau</p>
        <Link
          href="https://github.com/terbau"
          className="bg-black rounded-full h-10 w-10 flex items-center justify-center mx-auto mt-2"
        >
          <Github color="#FFF" />
        </Link>
      </div>
    </footer>
  )
}
