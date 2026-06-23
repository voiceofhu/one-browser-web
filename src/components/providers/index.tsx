import BuildInfo from "@/components/build-info"
import { LanguageProvider } from "@/components/providers/language"
import { ThemeProvider } from "@/components/theme/provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "./query"

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster
            richColors
            position="bottom-right"
            duration={5_000}
            closeButton
          />
          <BuildInfo />
        </ThemeProvider>
      </LanguageProvider>
    </QueryProvider>
  )
}
