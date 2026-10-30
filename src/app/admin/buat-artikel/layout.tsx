'use client'

import React from 'react'

export default function BuatArtikelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-[#111111] text-neutral-100 antialiased selection:bg-accent-500 selection:text-black">
      {children}
    </div>
  )
}
