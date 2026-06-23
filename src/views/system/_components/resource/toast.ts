import { toast } from "sonner"

import { isSupportedLocale, translate, type Locale } from "@/local"
import { translateText } from "@/local"

export function showResourceCreateSuccess(noun: string, locale?: Locale) {
  toast.success(
    translate(locale, "resource.createSuccess", {
      noun: translateText(locale, noun),
    }),
    {
      description: translate(locale, "resource.createSuccessDescription"),
    }
  )
}

export function showResourceUpdateSuccess(noun: string, locale?: Locale) {
  toast.success(
    translate(locale, "resource.updateSuccess", {
      noun: translateText(locale, noun),
    }),
    {
      description: translate(locale, "resource.updateSuccessDescription"),
    }
  )
}

export function showResourceDeleteSuccess(noun: string, locale?: Locale) {
  toast.success(
    translate(locale, "resource.deleteSuccess", {
      noun: translateText(locale, noun),
    }),
    {
      description: translate(locale, "resource.deleteSuccessDescription"),
    }
  )
}

export function showResourceBulkDeleteSuccess(
  noun: string,
  count: number,
  locale?: Locale
) {
  toast.success(
    translate(locale, "resource.bulkDeleteSuccess", {
      noun: translateText(locale, noun),
    }),
    {
      description: translate(locale, "resource.bulkDeleteSuccessDescription", {
        count,
      }),
    }
  )
}

export function showResourceRefreshSuccess(noun: string, locale?: Locale) {
  toast.success(
    translate(locale, "resource.refreshSuccess", {
      noun: translateText(locale, noun),
    }),
    {
      description: translate(locale, "resource.refreshSuccessDescription"),
    }
  )
}

export function showResourceValidationError(
  noun: string,
  fieldLabel?: string,
  message?: string,
  locale?: Locale
) {
  toast.error(
    translate(locale, "resource.validationTitle", {
      noun: translateText(locale, noun),
    }),
    {
      description:
        fieldLabel && message
          ? `${translateText(locale, fieldLabel)}: ${translateText(locale, message)}`
          : translate(locale, "resource.validationDescription"),
    }
  )
}

export function showResourceReorderSuccess(
  noun: string,
  count: number,
  locale?: Locale
) {
  toast.success(
    translate(locale, "resource.reorderSuccess", {
      noun: translateText(locale, noun),
    }),
    {
      description:
        count > 0
          ? translate(locale, "resource.reorderChangedDescription", { count })
          : translate(locale, "resource.reorderUnchangedDescription"),
    }
  )
}

export function showResourceError(error: unknown, localeCandidate?: unknown) {
  const locale = resolveLocale(localeCandidate)
  toast.error(getErrorMessage(error, locale), {
    description: translate(locale, "resource.errorDescription"),
  })
}

function getErrorMessage(error: unknown, locale?: Locale) {
  if (error instanceof Error) {
    return translateText(locale, error.message)
  }

  if (typeof error === "string") {
    return translateText(locale, error)
  }

  return translate(locale, "resource.errorFallback")
}

function resolveLocale(value: unknown): Locale | undefined {
  return typeof value === "string" && isSupportedLocale(value)
    ? value
    : undefined
}
