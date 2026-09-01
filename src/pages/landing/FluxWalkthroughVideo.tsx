import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  enterWalkthroughSounds,
  leaveWalkthroughSounds,
  playWalkthroughClick,
  playWalkthroughImpact,
  startWalkthroughMusic,
  stopWalkthroughMusic,
} from './walkthroughSounds'
import './fluxWalkthroughVideo.css'

type Chapter = {
  id: string
  from: number
  to: number
  label: string
  caption: string
}

/** Capítulos alinhados ao filme (~37.5s) — uma legenda só, centralizada. */
const CHAPTERS: Chapter[] = [
  { id: 'life', from: 0, to: 4.3, label: 'Flux', caption: 'Acabei de comprar uma coxinha.' },
  { id: 'hands', from: 4.3, to: 8.8, label: 'No celular', caption: 'Abre o Flux e registra na hora.' },
  { id: 'gasto', from: 8.8, to: 17.2, label: 'Gasto rápido', caption: 'Coxinha · R$ 8,00' },
  { id: 'cards', from: 17.2, to: 22.8, label: 'Cartões', caption: 'Faturas e limites sob controle.' },
  { id: 'goals', from: 22.8, to: 26.0, label: 'Metas', caption: 'Progresso que você vê.' },
  { id: 'community', from: 26.0, to: 34.6, label: 'Comunidade', caption: 'Peça, vote e acompanhe.' },
  { id: 'outro', from: 34.6, to: 37.5, label: 'Flux', caption: 'E tem muito mais.' },
]

const FILM_DURATION = 37.5

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function chapterAt(t: number, duration: number) {
  const x = Math.min(duration - 0.01, Math.max(0, t))
  return CHAPTERS.find((c) => x >= c.from && x < c.to) ?? CHAPTERS[CHAPTERS.length - 1]
}

export function FluxWalkthroughVideo() {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const [duration, setDuration] = useState(FILM_DURATION)

  const videoRef = useRef<HTMLVideoElement>(null)
  const elapsedRef = useRef(0)
  const wasPlayingRef = useRef(false)

  const chapter = chapterAt(elapsed, duration)
  const progress = duration > 0 ? (elapsed / duration) * 100 : 0

  const syncAudio = useCallback(
    (on: boolean) => {
      if (on && !muted) {
        enterWalkthroughSounds()
        void startWalkthroughMusic()
      } else {
        leaveWalkthroughSounds()
        stopWalkthroughMusic()
      }
    },
    [muted],
  )

  const openModal = () => {
    setOpen(true)
    setElapsed(0)
    elapsedRef.current = 0
    setPlaying(true)
    document.body.style.overflow = 'hidden'
    syncAudio(true)
    void playWalkthroughImpact()
    requestAnimationFrame(() => {
      const v = videoRef.current
      if (!v) return
      v.currentTime = 0
      void v.play().catch(() => undefined)
    })
  }

  const closeModal = () => {
    videoRef.current?.pause()
    setPlaying(false)
    setOpen(false)
    document.body.style.overflow = ''
    syncAudio(false)
  }

  useEffect(() => {
    if (!open) return
    const v = videoRef.current
    if (!v) return
    if (playing && !scrubbing) void v.play().catch(() => undefined)
    else v.pause()
  }, [open, playing, scrubbing])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => {
          const next = !p
          syncAudio(next)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, syncAudio])

  const seek = (nextSec: number) => {
    const clamped = Math.min(duration - 0.05, Math.max(0, nextSec))
    elapsedRef.current = clamped
    setElapsed(clamped)
    if (videoRef.current) videoRef.current.currentTime = clamped
  }

  const onBarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    wasPlayingRef.current = playing
    setPlaying(false)
    setScrubbing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    seek(((e.clientX - rect.left) / rect.width) * duration)
  }

  const onBarPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    const rect = e.currentTarget.getBoundingClientRect()
    seek(((e.clientX - rect.left) / rect.width) * duration)
  }

  const onBarPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    setScrubbing(false)
    const rect = e.currentTarget.getBoundingClientRect()
    seek(((e.clientX - rect.left) / rect.width) * duration)
    void playWalkthroughClick()
    if (wasPlayingRef.current) {
      setPlaying(true)
      syncAudio(true)
    }
  }

  return (
    <>
      <section className="lp-wt-section" id="como-funciona">
        <div className="lp-wt-section-copy">
          <span className="lp-kicker">Filme do produto</span>
          <h2>Entenda como funciona o Flux</h2>
          <p>
            Do café à tela: registra a coxinha, vê cartões, metas e comunidade — com o app se mexendo de
            verdade.
          </p>
          <ul>
            <li>Pessoa no estabelecimento</li>
            <li>Flux real no celular</li>
            <li>Cartões · metas · comunidade</li>
          </ul>
          <button type="button" className="lp-primary" onClick={openModal}>
            Assistir o filme <span aria-hidden>▶</span>
          </button>
        </div>

        <button type="button" className="lp-wt-poster" onClick={openModal} aria-label="Assistir filme do Flux">
          <div className="lp-wt-poster-frame">
            <img
              className="lp-wt-poster-life"
              src="/landing/walkthrough/lifestyle/hands-flux.jpg"
              alt=""
              loading="lazy"
            />
            <div className="lp-wt-poster-dim" />
            <span className="lp-wt-play">
              <i aria-hidden>▶</i>
            </span>
            <span className="lp-wt-poster-tag">{formatTime(FILM_DURATION)}</span>
          </div>
          <span className="lp-wt-poster-caption">Coxinha no café → Flux no celular</span>
        </button>
      </section>

      {open ? (
        <div className="lp-wt-modal" role="dialog" aria-modal aria-label="Filme do Flux">
          <div className="lp-wt-modal-backdrop" onClick={closeModal} aria-hidden />
          <div className="lp-wt-modal-panel">
            <header className="lp-wt-modal-head">
              <b>Entenda como funciona o Flux</b>
              <div className="lp-wt-head-actions">
                <button
                  type="button"
                  className="lp-wt-mute"
                  onClick={() => {
                    setMuted((m) => {
                      const next = !m
                      if (next) syncAudio(false)
                      else if (playing) syncAudio(true)
                      return next
                    })
                  }}
                  aria-label={muted ? 'Ativar som' : 'Silenciar'}
                >
                  {muted ? '🔇' : '🔊'}
                </button>
                <button type="button" className="lp-wt-close" onClick={closeModal} aria-label="Fechar">
                  ✕
                </button>
              </div>
            </header>

            <div className="lp-wt-player">
              <div className="lp-wt-cinema lp-wt-cinema--film">
                <video
                  ref={videoRef}
                  className="lp-wt-film"
                  playsInline
                  muted
                  preload="auto"
                  poster="/landing/walkthrough/lifestyle/hands-flux.jpg"
                  onLoadedMetadata={(e) => {
                    if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
                      setDuration(e.currentTarget.duration)
                    }
                  }}
                  onTimeUpdate={(e) => {
                    if (scrubbing) return
                    const t = e.currentTarget.currentTime
                    elapsedRef.current = t
                    setElapsed(t)
                  }}
                  onEnded={() => {
                    setPlaying(false)
                    syncAudio(false)
                  }}
                >
                  <source src="/landing/walkthrough/film/flux-filme.mp4?v=3" type="video/mp4" />
                  <source src="/landing/walkthrough/film/flux-filme.webm?v=3" type="video/webm" />
                </video>

                <div className="lp-wt-film-captions lp-wt-film-captions--center" key={chapter.id}>
                  <span>{chapter.label}</span>
                  <p>{chapter.caption}</p>
                </div>
              </div>
            </div>

            <footer className="lp-wt-controls">
              <button
                type="button"
                className="lp-wt-ctrl-play"
                aria-label={playing ? 'Pausar' : 'Reproduzir'}
                onClick={() => {
                  setPlaying((p) => {
                    const next = !p
                    syncAudio(next)
                    return next
                  })
                }}
              >
                {playing ? '⏸' : '▶'}
              </button>
              <span className="lp-wt-time">{formatTime(elapsed)}</span>
              <div
                className={`lp-wt-progress${scrubbing ? ' is-scrubbing' : ''}`}
                role="slider"
                tabIndex={0}
                aria-label="Posição do filme"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(elapsed)}
                onPointerDown={onBarPointerDown}
                onPointerMove={onBarPointerMove}
                onPointerUp={onBarPointerUp}
                onPointerCancel={onBarPointerUp}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') seek(elapsedRef.current + 2)
                  if (e.key === 'ArrowLeft') seek(elapsedRef.current - 2)
                }}
              >
                <i style={{ width: `${progress}%` }} />
                <span className="lp-wt-thumb" style={{ left: `${progress}%` }} aria-hidden />
              </div>
              <span className="lp-wt-time">{formatTime(duration)}</span>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
