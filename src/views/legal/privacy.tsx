import { useTranslation } from "@/components/providers/language-context"
import { legalByLocale } from "@/local"
import { LegalDocument } from "@/views/legal/legal-document"

export default function PrivacyPage() {
  const { locale } = useTranslation()

  return <LegalDocument {...legalByLocale[locale].privacy} />
}
