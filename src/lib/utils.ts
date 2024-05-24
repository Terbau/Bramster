import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import moment from "moment"

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
