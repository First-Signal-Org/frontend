import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { LineShadowText } from '@/components/ui/line-shadow-text'

export default function Header() {
  return (
    <header className="p-2 lg:px-16 flex gap-2 bg-background text-foreground justify-between items-center sticky top-0 z-50">
      <div className="flex flex-row items-center">
        <h1 className="text-balance text-2xl font-semibold leading-none tracking-tighter text-primary">
            FIRST    
            <LineShadowText className="italic" shadowColor={"#EF88AD"}>
            SIGNAL
            </LineShadowText>
        </h1>
      </div>
      <div className="flex flex-row lg:space-x-4 space-x-2 justify-center">
        <AnimatedThemeToggler />
      </div>
    </header>
  )
}