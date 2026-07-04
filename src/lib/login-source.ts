export function shouldUseDocumentRedirect(value: string) {
  if (value.startsWith("/api/")) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
