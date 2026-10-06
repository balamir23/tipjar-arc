import { TipJar } from '@/components/TipJar'

export default function App() {
  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f9f9fc 0%, #fffcf7 52%, #fbf7f2 100%)' }}
    >
      {/* Soft background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '5%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(133,177,237,0.22) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            right: '8%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,205,131,0.20) 0%, transparent 70%)',
            filter: 'blur(58px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '45%',
            right: '15%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(175,143,244,0.14) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-10 pt-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#0f1923',
              letterSpacing: '-0.03em',
            }}
          >
            TipJar
          </h1>
          <p
            className="mt-1.5 text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif", color: '#7a8899' }}
          >
            Arc üzerinde anında USDC bahşiş gönder
          </p>
        </header>

        {/* Tip card */}
        <TipJar />

        {/* Footer */}
        <p
          className="mt-8 text-center text-xs"
          style={{ fontFamily: "'DM Sans', sans-serif", color: '#b0bac6' }}
        >
          Arc Testnet · USDC gas ile çalışır · Powered by Circle
        </p>
      </div>
    </div>
  )
}
