'use client'

import React, { useEffect, useState } from 'react'
import Script from 'next/script'

export function SwaggerViewer() {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).SwaggerUIBundle) {
      (window as any).ui = (window as any).SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          (window as any).SwaggerUIBundle.presets.apis,
          (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: 'BaseLayout',
        deepLinking: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
        persistAuthorization: true,
      })
    }
  }, [scriptLoaded])

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#f3f4f6]">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
      />
      <style>{`
        .topbar {
          display: none !important;
        }
        .swagger-ui {
          filter: invert(88%) hue-rotate(180deg);
        }
        .swagger-ui .wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .swagger-ui .scheme-container {
          background: transparent !important;
          box-shadow: none !important;
        }
        .swagger-ui .opblock .opblock-summary {
          border-radius: 8px;
        }
      `}</style>
      <header className="bg-[#111827] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg text-sky-400 tracking-tight">
            SegiaTech WebShift Core Engine
          </h1>
          <p className="text-xs text-gray-400">
            Headless Content Delivery &amp; Multi-Tenant Satellite API
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            Raw OpenAPI 3.1 JSON &rarr;
          </a>
          <span className="text-xs bg-sky-900/60 text-sky-200 border border-sky-700/50 px-3 py-1 rounded-full font-medium">
            OpenAPI 3.1 &bull; Delivery API
          </span>
        </div>
      </header>
      <main className="p-4 sm:p-6">
        <div id="swagger-ui" />
      </main>
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        onLoad={() => setScriptLoaded(true)}
      />
    </div>
  )
}
