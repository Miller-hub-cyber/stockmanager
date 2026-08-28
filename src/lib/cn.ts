type ClasseCondicional = string | false | null | undefined;

/** Junta classes Tailwind condicionais sem depender de biblioteca externa. */
export function cn(...classes: ClasseCondicional[]): string {
  return classes.filter(Boolean).join(" ");
}
