import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import moment from "moment"
import {
  ZodFirstPartyTypeKind,
  type z,
  type ZodObject,
  type ZodTypeAny,
} from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function asReadbleTime(date: Date) {
  return moment(date).format("MMMM Do YYYY, HH:mm:ss")
}

export function asMoreReadableTime(date: Date) {
  const now = moment()
  const inputDate = moment(date)

  const daysDifference = now.diff(inputDate, "days")

  if (daysDifference < 14) {
    return inputDate.fromNow()
  }

  return inputDate.format("MMMM Do YYYY, HH:mm:ss")
}

export const capitalized = (input: string) =>
  input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

export const getPartByLocale = (
  multipartString: string,
  locale: "nb_NO" | "nn_NO" | "en_US"
) => {
  const split = multipartString.split(" /// ")

  switch (locale) {
    case "nb_NO":
      return split.at(0)
    case "nn_NO":
      return split.at(1)
    case "en_US":
      return split.at(2)
    default:
      return split.at(0)
  }
}

export const compareOrigins = (a: string, b: string) => {
  try {
    const [yearA, semesterA] = a.split(" ")
    const [yearB, semesterB] = b.split(" ")

    if (yearA === yearB) {
      return semesterB.localeCompare(semesterA)
    }
  } catch (e) {}

  return a.localeCompare(b)
}

export const shuffle = <T>(array: T[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export const isKey = <T extends ZodObject<Record<string, ZodTypeAny>>>(
  schema: T,
  key: string
): key is string & keyof z.infer<T> => {
  return key in schema.shape
}

export const parseKey = <
  T extends ZodObject<Record<string, ZodTypeAny>>,
  K extends string,
>(
  schema: T,
  key: K
): K & keyof z.infer<T> => {
  if (!(key in schema.shape)) {
    throw new Error(`Key ${key} does not exist in schema`)
  }

  return key as K & keyof z.infer<T>
}

export function isFieldRequired<
  // biome-ignore lint/suspicious/noExplicitAny: <needed>
  T extends ZodObject<any>,
  K extends keyof T["shape"],
>(schema: T, key: K): boolean {
  const field = schema.shape[key] as ZodTypeAny

  return (
    field._def.typeName !== ZodFirstPartyTypeKind.ZodOptional &&
    field._def.typeName !== ZodFirstPartyTypeKind.ZodDefault
  )
}

export function isSubset<T>(subset: Set<T>, superset: Set<T>): boolean {
  return Array.from(subset).every((elem) => superset.has(elem))
}
