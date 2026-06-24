"use client"

import { format } from "date-fns"
import { useEffect } from "react"

import pkg from "../../package.json"

export default function BuildInfo() {
  useEffect(() => {
    const print = (key: string, value: string) =>
      console.log(
        `%c ${key} %c ${value} %c `,
        "background:#20232a ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
        "background:#61dafb ;padding: 1px; border-radius: 0 3px 3px 0;  color: #20232a; font-weight: bold;",
        "background:transparent"
      )
    const envRows = Object.entries(import.meta.env)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        key: `env.${key}`,
        value: formatConsoleValue(value),
      }))

    print(pkg.name, pkg.version)
    print(
      "build time",
      format(new Date(__APP_BUILD_TIME__), "yyyy-MM-dd HH:mm")
    )

    console.groupCollapsed("[build-info] environment")
    console.table(envRows)
    console.groupEnd()
  }, [])

  return null
}

function formatConsoleValue(value: unknown) {
  if (value === undefined) {
    return "undefined"
  }

  if (value === null) {
    return "null"
  }

  return String(value)
}
