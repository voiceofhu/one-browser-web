const DEFAULT_AVATAR_SEED = "one-browser-user"

export function normalizeDefaultUserAvatarSeed(seed: string) {
  return seed.trim() || DEFAULT_AVATAR_SEED
}

export function getDefaultUserAvatarSeed(
  ...values: Array<number | string | null | undefined>
) {
  return (
    values
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(":") || DEFAULT_AVATAR_SEED
  )
}
