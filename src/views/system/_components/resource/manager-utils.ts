import * as React from "react"

export function delay(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

export function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeoutId)
  }, [delay, value])

  return debouncedValue
}
