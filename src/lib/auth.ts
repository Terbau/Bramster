import type { Account, Profile, Session, User } from "next-auth"

import type { AdapterUser } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import Auth0Provider from "next-auth/providers/auth0"
import { db } from "./db"

export const upsertUser = async (
  id: string,
  name: string,
  email: string | undefined,
  authProvider: string
) => {
  if (id && email) {
    // needed for ow4
    const existingUser = await db
      .selectFrom("user")
      .selectAll()
      .where("email", "=", email)
      .where("authProvider", "=", authProvider)
      .executeTakeFirst()

    if (existingUser) {
      await db
        .updateTable("user")
        .set({
          id, // Also update the id since we have onUpdate cascade
          name,
          email,
          authProvider,
        })
        .where("id", "=", existingUser.id)
        .execute()
    } else {
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
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID as string,
      clientSecret: process.env.AUTH0_CLIENT_SECRET as string,
      issuer: process.env.AUTH0_ISSUER as string,
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
      const userId = token.sub
      const user = await db
        .selectFrom("user")
        .select(["admin"])
        .where("id", "=", userId)
        .executeTakeFirst()

      session.user.id = userId
      session.user.admin = user?.admin ?? false
      return session
    },
  },
}
