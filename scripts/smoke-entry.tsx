import { StrictMode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'

/** Renders a route to static markup (effects do not run, so browser APIs are never touched). */
export function renderRoute(path: string): string {
  return renderToStaticMarkup(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )
}
