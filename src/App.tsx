import { Button } from "@/components/ui/button"
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button"

export function App() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
        </div>
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
      </div>
    </div>
  )
}

export default App
