/**
 * Safe to import from client components — unlike `./posts`, which is
 * `server-only` because it touches the filesystem.
 */

/** Gregorian Arabic date. Plain `ar-SA` would render a Hijri calendar. */
const dateFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  year: "numeric",
  month: "long",
  day: "numeric",
})

export function formatPostDate(date: string): string {
  return dateFormatter.format(new Date(date))
}
