import { useState } from 'react'
import { PROCESS } from '@/data/site'
import { Icon } from '@/components/Icon'
import { SectionHead } from '@/components/ui/SectionHead'
import './process-timeline.css'

export function ProcessTimeline() {
  const [active, setActive] = useState(0)
  const step = PROCESS[active]

  return (
    <section className="section section--deep process" id="process" aria-labelledby="process-title">
      <div className="container container--wide">
        <SectionHead
          id="process-title"
          eyebrow="Our process"
          title={
            <>
              Five stages, <span className="accent">no black boxes</span>.
            </>
          }
          aside={
            <p className="lede">
              You see the work as it happens — every stage produces something concrete to review and
              approve before the next one begins.
            </p>
          }
        />

        <div className="process__track" role="tablist" aria-label="Production stages">
          {PROCESS.map((item, i) => (
            <button
              key={item.index}
              type="button"
              role="tab"
              id={`process-tab-${i}`}
              aria-selected={active === i}
              aria-controls="process-panel"
              tabIndex={active === i ? 0 : -1}
              className={`process-step${active === i ? ' is-active' : ''}${i < active ? ' is-done' : ''}`}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') setActive((a) => Math.min(PROCESS.length - 1, a + 1))
                if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, a - 1))
              }}
            >
              <span className="process-step__index mono">{item.index}</span>
              <span className="process-step__dot" aria-hidden="true" />
              <span className="process-step__title">{item.title}</span>
              <span className="process-step__duration mono">{item.duration}</span>
            </button>
          ))}
          <span className="process__line" aria-hidden="true">
            <span className="process__line-fill" style={{ transform: `scaleX(${(active + 1) / PROCESS.length})` }} />
          </span>
        </div>

        <div className="process__panel card" id="process-panel" role="tabpanel" aria-labelledby={`process-tab-${active}`}>
          <div className="process__panel-inner" key={step.index}>
          <div className="process__panel-head">
            <span className="process__panel-index">{step.index}</span>
            <div>
              <h3 className="process__panel-title">{step.title}</h3>
              <p className="mono process__panel-duration">{step.duration}</p>
            </div>
          </div>

          <p className="process__panel-summary">{step.summary}</p>

          <div className="process__outputs">
            <p className="mono process__outputs-label">What you receive</p>
            <ul>
              {step.outputs.map((output) => (
                <li key={output}>
                  <Icon name="check" size={14} />
                  {output}
                </li>
              ))}
            </ul>
          </div>

          <div className="process__nav">
            <button type="button" className="process__nav-btn" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}>
              <Icon name="arrow-left" size={15} /> Previous
            </button>
            <span className="mono process__nav-count">
              {String(active + 1).padStart(2, '0')} / {String(PROCESS.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              className="process__nav-btn"
              onClick={() => setActive((a) => Math.min(PROCESS.length - 1, a + 1))}
              disabled={active === PROCESS.length - 1}
            >
              Next <Icon name="arrow-right" size={15} />
            </button>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProcessTimeline
