import BuildInfo from "@/components/build-info"
import { ThemeProvider } from "@/components/theme/provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryProvider } from "./query"

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <BuildInfo />
      </ThemeProvider>
    </QueryProvider>
  )
}
