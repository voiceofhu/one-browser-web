import { APP_NAME } from "@/app"

export function RouteLoading() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-svh items-center justify-center bg-black text-white">
      <div className="text-center text-[12vmin] font-semibold tracking-normal select-none sm:text-[15vmin] md:text-[15vmin] lg:text-[17vmin]">
        {APP_NAME}
      </div>
    </div>
  )
}
