import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ExternalLink, Check, Heart, Coffee, Star, Zap } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { getUsdc, buildTxExplorerUrl, requireChain } from '@/onchain-facts'
import { parseAmount, usdcDecimalsFor, Amount } from '@/onchain-money'
import { toast } from 'sonner'

// Arc Testnet chain id
const TARGET_CHAIN_ID = 5042002

const usdcFact = getUsdc(TARGET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`
const arcChain = requireChain(TARGET_CHAIN_ID)

// Alıcı adres — placeholder, kullanıcı değiştirmeli
const RECIPIENT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

const glass = {
  card: {
    background: 'rgba(255,255,255,0.64)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.68)',
    boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
  } as React.CSSProperties,
  inner: {
    background: 'rgba(255,255,255,0.46)',
    border: '1px solid rgba(255,255,255,0.56)',
  } as React.CSSProperties,
}

const spectral = 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)'

const PRESETS = [
  { label: '0.01', value: '0.01', icon: Coffee },
  { label: '0.05', value: '0.05', icon: Heart },
  { label: '0.10', value: '0.10', icon: Star },
  { label: '0.25', value: '0.25', icon: Zap },
]

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || (error as { code?: number })?.code === 4001) return 'İşlem iptal edildi.'
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Yetersiz bakiye.'
  if (msg.includes('reverted')) return 'İşlem başarısız oldu. Lütfen tekrar deneyin.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Ağ hatası. Bağlantınızı kontrol edin.'
  return 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

export function TipJar() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [recipientInput, setRecipientInput] = useState<string>(RECIPIENT_ADDRESS)

  const isWrongChain = isConnected && chainId !== TARGET_CHAIN_ID
  const isValidRecipient = isAddress(recipientInput)
  const parsedAmount = amount && parseFloat(amount) > 0 ? (() => {
    try { return parseAmount(TARGET_CHAIN_ID, amount) } catch { return null }
  })() : null

  // Bakiye oku
  const { data: rawBalance, isLoading: balanceLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance = rawBalance !== undefined
    ? Amount.fromRaw(rawBalance, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(2)
    : '—'

  // Transfer
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const txUrl = txHash ? buildTxExplorerUrl(TARGET_CHAIN_ID, txHash) : null

  const handleSelectPreset = (value: string) => {
    setSelectedPreset(value)
    setAmount(value)
  }

  const handleAmountChange = (value: string) => {
    const clean = value.replace(/[^0-9.]/g, '')
    if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
      setAmount(clean)
      setSelectedPreset(null)
    }
  }

  const handleSend = () => {
    if (isWrongChain) {
      switchChain({ chainId: TARGET_CHAIN_ID })
      return
    }
    if (!parsedAmount || !isValidRecipient) return
    writeContract(
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipientInput, parsedAmount.raw],
        chainId: TARGET_CHAIN_ID,
      },
      {
        onError: (err) => toast.error(parseOnchainError(err)),
      }
    )
  }

  const handleReset = () => {
    reset()
    setAmount('')
    setSelectedPreset(null)
  }

  const isReady =
    isConnected &&
    !isWrongChain &&
    !!parsedAmount &&
    isValidRecipient

  return (
    <section className="rounded-3xl overflow-hidden" style={glass.card}>
      {/* Spectral strip */}
      <div className="h-1" style={{ background: spectral }} />

      <div className="p-5 space-y-4">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0f1923', letterSpacing: '-0.02em' }}
            >
              Bahşiş Gönder
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#7a8899', fontFamily: "'DM Sans', sans-serif" }}>
              Arc Testnet · USDC
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <TokenUSDC variant="branded" size={20} />
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#0f1923', fontFamily: "'DM Sans', sans-serif" }}>
              {balanceLoading ? '...' : `${formattedBalance} USDC`}
            </span>
          </div>
        </div>

        {/* Alıcı adresi */}
        <div className="rounded-2xl p-3 space-y-1" style={glass.inner}>
          <label className="text-xs font-semibold" style={{ color: '#7a8899', fontFamily: "'DM Sans', sans-serif" }}>
            Alıcı Adresi
          </label>
          <input
            type="text"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            placeholder="0x..."
            spellCheck={false}
            className="w-full bg-transparent text-xs font-mono outline-none placeholder:text-slate-300"
            style={{ color: '#0f1923' }}
          />
          {recipientInput && !isValidRecipient && (
            <p className="text-xs" style={{ color: '#ef4444' }}>Geçersiz adres formatı</p>
          )}
        </div>

        {/* Miktar seçici */}
        <div className="rounded-2xl p-4 space-y-3" style={glass.inner}>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleSelectPreset(value)}
                className="rounded-xl py-2.5 flex flex-col items-center gap-1 text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: selectedPreset === value
                    ? '#0f1923'
                    : 'rgba(255,255,255,0.7)',
                  color: selectedPreset === value ? '#fff' : '#0f1923',
                  border: selectedPreset === value ? 'none' : '1px solid rgba(0,0,0,0.06)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-baseline gap-2">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-300"
              style={{ color: '#0f1923', fontFamily: "'Space Grotesk', sans-serif" }}
            />
            <span className="text-base font-medium" style={{ color: '#7a8899', fontFamily: "'DM Sans', sans-serif" }}>USDC</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#7a8899', fontFamily: "'DM Sans', sans-serif" }}>
              Arc Testnet · gas = USDC
            </span>
            {isConnected && rawBalance !== undefined && (
              <button
                onClick={() => {
                  const max = Amount.fromRaw(rawBalance, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(6)
                  setAmount(max)
                  setSelectedPreset(null)
                }}
                className="text-xs font-semibold"
                style={{ color: '#2563eb', fontFamily: "'DM Sans', sans-serif" }}
              >
                Maks: {formattedBalance}
              </button>
            )}
          </div>
        </div>

        {/* Yanlış ağ uyarısı */}
        <AnimatePresence>
          {isWrongChain && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl px-3 py-2 text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', fontFamily: "'DM Sans', sans-serif" }}
            >
              Cüzdanınızı Arc Testnet'e geçirin
            </motion.div>
          )}
        </AnimatePresence>

        {/* Başarı durumu */}
        <AnimatePresence>
          {isSuccess && txUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 space-y-2"
              style={glass.inner}
            >
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.12)' }}>
                  <Check size={14} style={{ color: '#16a34a' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: '#16a34a', fontFamily: "'DM Sans', sans-serif" }}>
                  Bahşiş gönderildi!
                </span>
              </div>
              <a
                href={txUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: '#2563eb', fontFamily: "'DM Sans', sans-serif" }}
              >
                ArcScan'de görüntüle <ExternalLink size={11} />
              </a>
              <button
                onClick={handleReset}
                className="w-full rounded-xl py-2 text-xs font-semibold mt-1"
                style={{ background: 'rgba(255,255,255,0.7)', color: '#0f1923', border: '1px solid rgba(0,0,0,0.06)', fontFamily: "'DM Sans', sans-serif" }}
              >
                Yeni bahşiş gönder
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hata */}
        {writeError && !isSuccess && (
          <p className="text-xs px-1" style={{ color: '#ef4444', fontFamily: "'DM Sans', sans-serif" }}>
            {parseOnchainError(writeError)}
          </p>
        )}

        {/* CTA */}
        {!isConnected ? (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button
                onClick={show}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: '#0f1923', fontFamily: "'DM Sans', sans-serif" }}
              >
                Cüzdan Bağla
              </button>
            )}
          </ConnectKitButton.Custom>
        ) : !isSuccess ? (
          <button
            disabled={!isReady || isPending || isConfirming || isSwitching}
            onClick={handleSend}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: isWrongChain ? '#ef4444' : '#0f1923', fontFamily: "'DM Sans', sans-serif" }}
          >
            {isSwitching ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Ağ değiştiriliyor...
              </span>
            ) : isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Cüzdanda onayla...
              </span>
            ) : isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Onaylanıyor...
              </span>
            ) : isWrongChain ? (
              `${arcChain.name}'e Geç`
            ) : (
              `${amount || '0'} USDC Bahşiş Gönder`
            )}
          </button>
        ) : null}

        {/* Testnet notu */}
        {isConnected && !isWrongChain && (
          <p className="text-center text-xs" style={{ color: '#b0bac6', fontFamily: "'DM Sans', sans-serif" }}>
            Test USDC almak için Arc Studio kenar çubuğundaki "Get test USDC" butonunu kullanın
          </p>
        )}
      </div>
    </section>
  )
}
