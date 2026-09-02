import GameHeader from '@/components/GameHeader'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full">
      <GameHeader />
      <main className="flex-1 flex items-start justify-center py-6 px-4">
        {children}
      </main>
    </div>
  )
}
