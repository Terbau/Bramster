import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "../ui/button"
import Link from "next/link"

export const Navbar = () => {
  const { data: session } = useSession()

  return (
    <div className="w-full h-16 border-b border-gray-300 flex flex-row px-8 items-center">
      <Link href="/ "className="text-2xl font-semibold">Bramster</Link>
      <div className="ml-auto">
        {session ? (
          <Button onClick={() => signOut()}>Sign out</Button>
        ) : (
          <Button onClick={() => signIn("auth0")}>Sign in</Button>
        )}
      </div>
    </div>
  )
}
