'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface VideoPlayerProps {
  src: string
  poster?: string
  title: string
  aspectRatio?: '16/9' | '4/3' | '21/9' | '1/1'
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  title,
  aspectRatio = '16/9',
  autoPlay = false,
  loop = true,
  muted = true,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [hasError, setHasError] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setIsReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setIsReducedMotion(e.matches)
        if (e.matches && videoRef.current) {
          videoRef.current.pause()
          setIsPlaying(false)
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setHasError(true))
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const ratioClass = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '21/9': 'aspect-[21/9]',
    '1/1': 'aspect-square',
  }[aspectRatio]

  if (hasError) {
    return (
      <div className={`relative ${ratioClass} w-full overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 flex flex-col items-center justify-center p-6 text-center text-neutral-400 ${className}`}>
        <p className="text-sm font-semibold text-white mb-2">Video Tidak Dapat Dimuat</p>
        <p className="text-xs text-neutral-400 mb-4 max-w-sm">
          Format video tidak didukung oleh browser atau tautan media tidak tersedia saat ini.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
        >
          <span>Buka Video di Tab Baru</span>
          <span>↗</span>
        </a>
      </div>
    )
  }

  return (
    <div
      className={`group relative ${ratioClass} w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl ${className}`}
      role="region"
      aria-label={`Pemutar Video: ${title}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        title={title}
        autoPlay={autoPlay && !isReducedMotion}
        loop={loop}
        muted={isMuted}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />

      {/* Ambient Gradient Overlay for Controls Visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Interactive Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Bunyikan suara' : 'Bisukan suara'}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {isMuted ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          <span className="text-[11px] font-mono text-white/90 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm">
            {title}
          </span>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          {isReducedMotion && (
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-400/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
              Reduced Motion Active
            </span>
          )}
          <span className="text-[10px] font-mono text-neutral-300 bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
            HD 60fps
          </span>
        </div>
      </div>
    </div>
  )
}
