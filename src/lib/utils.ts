import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import moment from "moment"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function asReadbleTime(date: Date) {
  return moment(date).format("MMMM Do YYYY, hh:mm:ss")
}

export const capitalized = (input: string) =>
  input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
