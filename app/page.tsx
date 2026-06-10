'use client'

import { useState, useEffect } from 'react'
import {
  useAccount, useConnect, useDisconnect,
  useReadContracts, useReadContract,
  useWriteContract, useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi'
import { keccak256, encodePacked, formatEther, type Address } from 'viem'
import { GAME_ABI, FACTORY_ABI } from '../lib/abis'

// ── Constants ─────────────────────────────────────────────────────────────────
const FACTORY_ADDR = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '') as Address
const DEFAULT_GAME = (process.env.NEXT_PUBLIC_GAME_ADDRESS ?? '') as string

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const OPTION_COLORS = [
  'bg-red-600   hover:bg-red-500   border-red-500',
  'bg-blue-600  hover:bg-blue-500  border-blue-500',
  'bg-yellow-500 hover:bg-yellow-400 border-yellow-400',
  'bg-green-600 hover:bg-green-500 border-green-500',
]

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = 'lobby' | 'waiting' | 'commit' | 'committed' | 'reveal' | 'finished'
type CommitData = { option: number; salt: string; questionId: number; gameAddr: string }
type Question   = { enunciado: string; opciones: string[] }

// ── Utils ─────────────────────────────────────────────────────────────────────
function isValidAddr(s: string): s is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(s)
}

function genSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }           = useDisconnect()
  const publicClient             = usePublicClient()

  const [mounted,         setMounted]         = useState(false)
  const [gameInput,       setGameInput]        = useState(DEFAULT_GAME)
  const [question,        setQuestion]         = useState<Question | null>(null)
  const [fetchedQId,      setFetchedQId]       = useState(-1)
  const [selectedOption,  setSelectedOption]   = useState<number | null>(null)
  const [commitData,      setCommitData]       = useState<CommitData | null>(null)
  const [txHash,          setTxHash]           = useState<`0x${string}` | undefined>()
  const [txMsg,           setTxMsg]            = useState('')

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem('enki_commit')
      if (raw) setCommitData(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const validAddr = isValidAddr(gameInput) ? gameInput : null

  // ── Factory: last game address ──────────────────────────────────────────────
  const { data: factoryData } = useReadContracts({
    contracts: FACTORY_ADDR ? [
      { address: FACTORY_ADDR, abi: FACTORY_ABI, functionName: 'getGamesCount' },
    ] : [],
    query: { enabled: !!FACTORY_ADDR && !validAddr },
  })
  const gamesCount = factoryData?.[0]?.result !== undefined
    ? Number(factoryData[0].result) : 0

  const { data: lastGameData } = useReadContract({
    address: FACTORY_ADDR || '0x0000000000000000000000000000000000000000',
    abi: FACTORY_ABI,
    functionName: 'games',
    args: [BigInt(gamesCount > 0 ? gamesCount - 1 : 0)],
    query: { enabled: !!FACTORY_ADDR && gamesCount > 0 && !validAddr },
  })
  const lastGame = lastGameData as Address | undefined

  // ── Main batch reads ────────────────────────────────────────────────────────
  const { data: d } = useReadContracts({
    contracts: validAddr && address ? [
      { address: validAddr, abi: GAME_ABI, functionName: 'hasJoined',       args: [address]  }, // 0
      { address: validAddr, abi: GAME_ABI, functionName: 'currentQuestionId'                 }, // 1
      { address: validAddr, abi: GAME_ABI, functionName: 'isFinished'                        }, // 2
      { address: validAddr, abi: GAME_ABI, functionName: 'entryFee'                          }, // 3
      { address: validAddr, abi: GAME_ABI, functionName: 'passingScore'                      }, // 4
      { address: validAddr, abi: GAME_ABI, functionName: 'totalQuestions'                    }, // 5
      { address: validAddr, abi: GAME_ABI, functionName: 'prizePool'                         }, // 6
      { address: validAddr, abi: GAME_ABI, functionName: 'prizesCalculated'                  }, // 7
      { address: validAddr, abi: GAME_ABI, functionName: 'scores',          args: [address]  }, // 8
      { address: validAddr, abi: GAME_ABI, functionName: 'hasClaimed',      args: [address]  }, // 9
      { address: validAddr, abi: GAME_ABI, functionName: 'hasPrizeClaimed', args: [address]  }, // 10
      { address: validAddr, abi: GAME_ABI, functionName: 'professor'                         }, // 11
    ] : [],
    query: { refetchInterval: 3000, enabled: !!validAddr && !!address },
  })

  const hasJoined    = (d?.[0]?.result  ?? false) as boolean
  const currentQId   = d?.[1]?.result !== undefined ? Number(d[1].result) : undefined
  const isFinished   = (d?.[2]?.result  ?? false) as boolean
  const entryFee     = (d?.[3]?.result  ?? 0n)    as bigint
  const passingScore = d?.[4]?.result !== undefined ? Number(d[4].result) : undefined
  const totalQ       = d?.[5]?.result !== undefined ? Number(d[5].result) : undefined
  const prizePool    = (d?.[6]?.result  ?? 0n)    as bigint
  const prizesCalc   = (d?.[7]?.result  ?? false) as boolean
  const myScore      = d?.[8]?.result !== undefined ? Number(d[8].result) : 0
  const hasDiploma   = (d?.[9]?.result  ?? false) as boolean
  const hasPrize     = (d?.[10]?.result ?? false) as boolean
  const profAddr     = d?.[11]?.result as Address | undefined

  // ── Current round read ──────────────────────────────────────────────────────
  const { data: roundRaw } = useReadContract({
    address: validAddr ?? '0x0000000000000000000000000000000000000000',
    abi: GAME_ABI,
    functionName: 'listaDeRondas',
    args: [BigInt(currentQId ?? 0)],
    query: { refetchInterval: 2000, enabled: !!validAddr && currentQId !== undefined },
  })
  const round      = roundRaw as { commitPhaseOpen: boolean; revealPhaseOpen: boolean } | undefined
  const commitOpen = round?.commitPhaseOpen  ?? false
  const revealOpen = round?.revealPhaseOpen  ?? false

  // ── Fetch question text from QuestionRevealed event ─────────────────────────
  useEffect(() => {
    if (!commitOpen || !validAddr || !publicClient || currentQId === undefined) return
    if (currentQId === fetchedQId) return
    publicClient.getLogs({
      address: validAddr as Address,
      event: {
        type: 'event', name: 'QuestionRevealed',
        inputs: [
          { name: 'questionId', type: 'uint256',   indexed: true  },
          { name: 'enunciado',  type: 'string',    indexed: false },
          { name: 'opciones',   type: 'string[4]', indexed: false },
        ],
      },
      args:      { questionId: BigInt(currentQId) },
      fromBlock: 0n,
    }).then(logs => {
      if (logs.length > 0) {
        const args = logs[0].args as { enunciado: string; opciones: readonly [string, string, string, string] }
        setQuestion({ enunciado: args.enunciado, opciones: [...args.opciones] })
        setFetchedQId(currentQId)
        setSelectedOption(null)
      }
    }).catch(console.error)
  }, [commitOpen, validAddr, publicClient, currentQId, fetchedQId])

  // ── Write helpers ────────────────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract()
  const { isLoading: txPending } = useWaitForTransactionReceipt({ hash: txHash })

  async function exec(fn: () => Promise<`0x${string}`>, label: string) {
    setTxMsg(`⏳ Enviando ${label}…`)
    try {
      const h = await fn()
      setTxHash(h)
      setTxMsg(`✅ ${label} confirmado`)
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string }
      setTxMsg(`❌ ${err.shortMessage ?? err.message ?? 'Error en la transacción'}`)
    }
  }

  function handleJoin() {
    exec(() => writeContractAsync({
      address: validAddr!, abi: GAME_ABI, functionName: 'joinGame', value: entryFee,
    }), 'joinGame')
  }

  function handleCommit() {
    if (selectedOption === null || !address || currentQId === undefined) return
    const salt = genSalt()
    const hash = keccak256(encodePacked(
      ['uint8', 'string', 'address'],
      [selectedOption, salt, address],
    ))
    const cd: CommitData = { option: selectedOption, salt, questionId: currentQId, gameAddr: validAddr! }
    localStorage.setItem('enki_commit', JSON.stringify(cd))
    setCommitData(cd)
    exec(() => writeContractAsync({
      address: validAddr!, abi: GAME_ABI, functionName: 'commitAnswer', args: [hash],
    }), 'commitAnswer')
  }

  function handleReveal() {
    if (!commitData) return
    exec(() => writeContractAsync({
      address: validAddr!, abi: GAME_ABI, functionName: 'revealAnswer',
      args: [BigInt(commitData.questionId), commitData.option, commitData.salt],
    }), 'revealAnswer')
  }

  // ── Phase determination ──────────────────────────────────────────────────────
  function getPhase(): Phase {
    if (!hasJoined) return 'lobby'
    if (isFinished)  return 'finished'
    if (revealOpen)  return 'reveal'
    if (commitOpen) {
      const committed = commitData?.questionId === currentQId && commitData?.gameAddr === validAddr
      return committed ? 'committed' : 'commit'
    }
    return 'waiting'
  }
  const phase       = getPhase()
  const isProfessor = !!(profAddr && address && profAddr.toLowerCase() === address.toLowerCase())
  const canDiploma  = !hasDiploma && isFinished && passingScore !== undefined && myScore >= passingScore

  if (!mounted) return null

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-black tracking-tight">
          <span className="text-blue-400">⚡</span> ENKI
          <span className="ml-2 text-xs font-normal text-slate-500 align-middle">Kahoot Web3</span>
        </h1>
        {isConnected && (
          <div className="flex items-center gap-3">
            {isProfessor && (
              <span className="text-xs bg-yellow-700 text-yellow-200 px-2 py-1 rounded font-mono">PROFESOR</span>
            )}
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
              {address!.slice(0, 6)}…{address!.slice(-4)}
            </span>
            <button onClick={() => disconnect()} className="text-xs text-red-400 hover:text-red-300 underline">
              Salir
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">

        {/* ── Connect ── */}
        {!isConnected && (
          <div className="text-center space-y-4">
            <p className="text-slate-400 text-sm">Conectá tu wallet para unirte al Kahoot descentralizado.</p>
            {connectors.map(c => (
              <button key={c.uid} onClick={() => connect({ connector: c })}
                className="w-full bg-blue-600 hover:bg-blue-500 transition-colors font-bold py-3 rounded-xl">
                Conectar {c.name}
              </button>
            ))}
          </div>
        )}

        {isConnected && (
          <>
            {/* ── Game address input ── */}
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700">
              <label className="text-xs text-slate-400 font-mono block mb-2">DIRECCIÓN DEL JUEGO</label>
              <input
                value={gameInput}
                onChange={e => setGameInput(e.target.value.trim())}
                placeholder="0x..."
                spellCheck={false}
                className="w-full bg-slate-700 font-mono text-sm px-3 py-2.5 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {gameInput.length > 2 && !validAddr && (
                <p className="text-red-400 text-xs mt-1">⚠ Dirección inválida</p>
              )}
              {!validAddr && lastGame && (
                <button onClick={() => setGameInput(lastGame)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                  Usar último juego del Factory: {lastGame.slice(0, 10)}…
                </button>
              )}
            </div>

            {/* ── Game panel ── */}
            {validAddr && entryFee !== undefined && totalQ !== undefined && (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['Preguntas',    `${totalQ}`],
                    ['Min. diploma', `${passingScore ?? '…'} pts`],
                    ['Entry fee',    `${formatEther(entryFee)} ETH`],
                    ['Prize pool',   `${formatEther(prizePool)} ETH`],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                      <div className="text-xs text-slate-400">{k}</div>
                      <div className="font-bold mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                {/* Phase banner */}
                {{
                  lobby:     <div className="rounded-xl p-4 text-center font-bold bg-slate-700 border border-slate-600">🎮 Sala de espera — unite para jugar</div>,
                  waiting:   <div className="rounded-xl p-4 text-center font-bold bg-slate-700 border border-slate-600 animate-pulse">⏳ Esperando que el profesor abra la siguiente pregunta…</div>,
                  commit:    <div className="rounded-xl p-4 text-center font-bold bg-orange-700 border border-orange-500">📝 FASE COMMIT — Elegí tu respuesta</div>,
                  committed: <div className="rounded-xl p-4 text-center font-bold bg-orange-900 border border-orange-700">🔒 Commit enviado — esperando fase REVEAL…</div>,
                  reveal:    <div className="rounded-xl p-4 text-center font-bold bg-purple-700 border border-purple-500">🔓 FASE REVEAL — Revelá tu respuesta</div>,
                  finished:  <div className="rounded-xl p-4 text-center font-bold bg-green-800 border border-green-600">🏁 Juego terminado · Tu puntaje: {myScore} / {totalQ}</div>,
                }[phase]}

                {/* ── Action: Join ── */}
                {phase === 'lobby' && (
                  <button onClick={handleJoin} disabled={txPending}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 font-bold py-4 rounded-xl text-lg transition-colors">
                    Unirse · {formatEther(entryFee)} ETH
                  </button>
                )}

                {/* ── Action: Commit ── */}
                {phase === 'commit' && (
                  question ? (
                    <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 space-y-4">
                      <p className="text-xs text-slate-400 font-mono">
                        Pregunta {(currentQId ?? 0) + 1} de {totalQ}
                      </p>
                      <h2 className="text-lg font-bold leading-snug">{question.enunciado}</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {question.opciones.map((op, i) => (
                          <button key={i} onClick={() => setSelectedOption(i + 1)}
                            className={`${OPTION_COLORS[i]} p-4 rounded-xl font-bold transition-all border-2 ${selectedOption === i + 1 ? 'ring-4 ring-white scale-105' : 'border-transparent'}`}>
                            {OPTION_LABELS[i]}. {op}
                          </button>
                        ))}
                      </div>
                      {selectedOption !== null && (
                        <button onClick={handleCommit} disabled={txPending}
                          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 font-bold py-3 rounded-xl transition-colors">
                          🔒 Sellar respuesta on-chain
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl p-5 bg-slate-800/60 text-center text-slate-400 text-sm animate-pulse">
                      Cargando pregunta desde el blockchain…
                    </div>
                  )
                )}

                {/* ── Action: Reveal ── */}
                {phase === 'reveal' && commitData && (
                  <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-300">
                      Tu respuesta sellada:{' '}
                      <span className="font-bold text-purple-300 text-lg">
                        opción {OPTION_LABELS[(commitData.option - 1) % 4]}
                      </span>
                    </p>
                    <button onClick={handleReveal} disabled={txPending}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-bold py-3 rounded-xl transition-colors">
                      🔓 Revelar mi respuesta
                    </button>
                  </div>
                )}

                {/* ── Action: Post-game ── */}
                {phase === 'finished' && (
                  <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 space-y-3">
                    {!prizesCalc && (
                      <button onClick={() => exec(() => writeContractAsync({
                        address: validAddr!, abi: GAME_ABI, functionName: 'calculatePrizes',
                      }), 'calculatePrizes')} disabled={txPending}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold py-3 rounded-xl transition-colors">
                        📊 Calcular distribución de premios
                      </button>
                    )}
                    {prizesCalc && !hasPrize && (
                      <button onClick={() => exec(() => writeContractAsync({
                        address: validAddr!, abi: GAME_ABI, functionName: 'claimPrize',
                      }), 'claimPrize')} disabled={txPending}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-50 font-bold py-3 rounded-xl transition-colors">
                        💰 Cobrar mi premio ETH
                      </button>
                    )}
                    {hasPrize && (
                      <div className="text-center text-yellow-300 font-bold py-1">💰 Premio cobrado ✅</div>
                    )}
                    {canDiploma && (
                      <button onClick={() => exec(() => writeContractAsync({
                        address: validAddr!, abi: GAME_ABI, functionName: 'claimDiploma',
                      }), 'claimDiploma')} disabled={txPending}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 font-bold py-3 rounded-xl transition-colors">
                        🎓 Reclamar diploma NFT
                      </button>
                    )}
                    {hasDiploma && (
                      <div className="text-center text-green-300 font-bold py-1">🎓 Diploma NFT reclamado ✅</div>
                    )}
                  </div>
                )}

                {/* ── My status pill ── */}
                {hasJoined && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-green-800 px-2 py-1 rounded font-mono">✅ Inscripto</span>
                    {myScore > 0 && (
                      <span className="bg-blue-800 px-2 py-1 rounded font-mono">Puntaje: {myScore}</span>
                    )}
                    {commitData?.questionId === currentQId && commitOpen && (
                      <span className="bg-orange-800 px-2 py-1 rounded font-mono">🔒 Commit enviado</span>
                    )}
                  </div>
                )}

                {/* ── Professor hint ── */}
                {isProfessor && (
                  <div className="text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-800 rounded-lg p-3">
                    ⚡ Sos el profesor de este juego. Para controlar las fases usá Remix con la guía
                    <span className="font-mono"> GUIA_DEMO_REMIX.md</span>.
                  </div>
                )}
              </>
            )}

            {/* ── TX status ── */}
            {txMsg && (
              <div className={`text-sm font-mono text-center px-4 py-2.5 rounded-lg ${
                txMsg.startsWith('❌') ? 'bg-red-900/60 text-red-300' : 'bg-slate-800 text-green-300'
              }`}>
                {txMsg}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}