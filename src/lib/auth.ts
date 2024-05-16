import type { Account, Profile, Session, User } from "next-auth"

import type { AdapterUser } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import { db } from "./db"

export const upsertUser = async (
  id: string,
  name: string,
  email: string | undefined,
  authProvider: string
) => {
  if (id && email) {
    // needed for ow4
    await db
      .insertInto("user")
      .values({
        id,
        name,
        email,
        authProvider,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          name: (eb) => eb.ref("excluded.name"),
          email: (eb) => eb.ref("excluded.email"),
        })
      )
      .execute()
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
      profile,
    }: {
      user: User | AdapterUser
      account: Account | null
      profile?: Profile | undefined
    }) {
      await upsertUser(
        user.id,
        profile?.name ?? "",
        profile?.email,
        account?.provider ?? ""
      )

      return true
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    async session({ session, token }: any): Promise<Session> {
      session.user.id = token.sub
      return session
    },
  },
}
