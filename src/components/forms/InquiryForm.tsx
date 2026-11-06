'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { SERVICES } from '@/data/services'
import { BUDGET_RANGES, CONTACT, TIMELINES } from '@/data/site'
import { Icon } from '@/components/Icon'
import './inquiry-form.css'

type Fields = {
  name: string
  company: string
  email: string
  service: string
  budget: string
  timeline: string
  brief: string
}

type Errors = Partial<Record<keyof Fields, string>>

const EMPTY: Fields = {
  name: '',
  company: '',
  email: '',
  service: '',
  budget: '',
  timeline: '',
  brief: '',
}

const ENDPOINT = process.env.NEXT_PUBLIC_INQUIRY_ENDPOINT?.trim() || ''
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

function validate(values: Fields): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = 'Mohon masukkan nama Anda.'
  if (!values.email.trim()) errors.email = 'Alamat email wajib diisi untuk balasan proposal.'
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Format alamat email tidak valid.'
  if (!values.service) errors.service = 'Pilih vertikal layanan yang Anda minati.'
  if (!values.budget) errors.budget = 'Pilih perkiraan anggaran.'
  if (!values.timeline) errors.timeline = 'Pilih target waktu pelaksanaan.'
  if (!values.brief.trim()) errors.brief = 'Mohon jelaskan lokasi atau kebutuhan proyek Anda.'
  else if (values.brief.trim().length < 20)
    errors.brief = 'Mohon tambahkan rincian sedikit lebih detail (minimal 20 karakter).'
  return errors
}

function buildEmailBody(values: Fields): string {
  return [
    `Name: ${values.name}`,
    `Company: ${values.company || '—'}`,
    `Email: ${values.email}`,
    `Service interest: ${values.service}`,
    `Budget range: ${values.budget}`,
    `Timeline: ${values.timeline}`,
    '',
    'Project brief:',
    values.brief,
  ].join('\n')
}

export function InquiryForm() {
  const uid = useId()
  const [values, setValues] = useState<Fields>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const summaryRef = useRef<HTMLDivElement | null>(null)

  const mailtoHref = useMemo(() => {
    const subject = `Project inquiry — ${values.service || 'Animation'}`
    return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      buildEmailBody(values),
    )}`
  }, [values])

  const update = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: event.target.value }))
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  }

  const fieldProps = (key: keyof Fields) => ({
    id: `${uid}-${key}`,
    name: key,
    value: values[key],
    onChange: update(key),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${uid}-${key}-error` : undefined,
  })

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error')
      setServerMessage('Please fix the highlighted fields and try again.')
      const firstKey = Object.keys(nextErrors)[0]
      document.getElementById(`${uid}-${firstKey}`)?.focus()
      return
    }

    if (!ENDPOINT) {
      // No backend configured: hand the visitor a real, pre-filled email draft.
      setStatus('success')
      setServerMessage('')
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }

    setStatus('submitting')
    setServerMessage('')
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, submittedAt: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
      setStatus('success')
      requestAnimationFrame(() => summaryRef.current?.focus())
    } catch (error) {
      setStatus('error')
      setServerMessage(
        error instanceof Error
          ? `${error.message}. You can still send the inquiry by email below.`
          : 'Something went wrong. You can still send the inquiry by email below.',
      )
    }
  }

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildEmailBody(values))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  const reset = () => {
    setValues(EMPTY)
    setErrors({})
    setStatus('idle')
    setServerMessage('')
  }

  return (
    <div className="inquiry">
      <form className="inquiry__form" onSubmit={onSubmit} noValidate>
        <div className="inquiry__row">
          <div className="field">
            <label htmlFor={`${uid}-name`}>
              Nama Lengkap <span aria-hidden="true">*</span>
            </label>
            <input type="text" autoComplete="name" placeholder="Nama Anda" {...fieldProps('name')} />
            {errors.name ? (
              <p className="field__error" id={`${uid}-name-error`}>
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor={`${uid}-company`}>Perusahaan / Instansi</label>
            <input type="text" autoComplete="organization" placeholder="Nama instansi (opsional)" {...fieldProps('company')} />
          </div>
        </div>

        <div className="inquiry__row">
          <div className="field">
            <label htmlFor={`${uid}-email`}>
              Email Resmi <span aria-hidden="true">*</span>
            </label>
            <input type="email" autoComplete="email" placeholder="email@perusahaan.com" {...fieldProps('email')} />
            {errors.email ? (
              <p className="field__error" id={`${uid}-email-error`}>
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor={`${uid}-service`}>
              Layanan Spasial <span aria-hidden="true">*</span>
            </label>
            <select {...fieldProps('service')}>
              <option value="">Pilih vertikal layanan…</option>
              {SERVICES.map((service) => (
                <option key={service.slug} value={service.name}>
                  {service.name}
                </option>
              ))}
              <option value="Multiple / Belum yakin">Konsultasi Terbuka / Belum yakin</option>
            </select>
            {errors.service ? (
              <p className="field__error" id={`${uid}-service-error`}>
                {errors.service}
              </p>
            ) : null}
          </div>
        </div>

        <div className="inquiry__row">
          <div className="field">
            <label htmlFor={`${uid}-budget`}>
              Estimasi Anggaran <span aria-hidden="true">*</span>
            </label>
            <select {...fieldProps('budget')}>
              <option value="">Pilih rentang anggaran…</option>
              {BUDGET_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
            {errors.budget ? (
              <p className="field__error" id={`${uid}-budget-error`}>
                {errors.budget}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor={`${uid}-timeline`}>
              Target Waktu Pelaksanaan <span aria-hidden="true">*</span>
            </label>
            <select {...fieldProps('timeline')}>
              <option value="">Pilih target waktu…</option>
              {TIMELINES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.timeline ? (
              <p className="field__error" id={`${uid}-timeline-error`}>
                {errors.timeline}
              </p>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${uid}-brief`}>
            Deskripsi Kebutuhan Ruang / Lokasi <span aria-hidden="true">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Jelaskan jenis lokasi (restoran, hotel, pabrik, set film, wedding), luasan perkiraan, dan target pemanfaatan (web, VR, previz)..."
            {...fieldProps('brief')}
          />
          <div className="field__foot">
            {errors.brief ? (
              <p className="field__error" id={`${uid}-brief-error`}>
                {errors.brief}
              </p>
            ) : (
              <p className="field__hint">Semakin lengkap rincian lokasi, semakin akurat proposal teknis kami.</p>
            )}
            <span className="field__count mono">{values.brief.trim().length} karakter</span>
          </div>
        </div>

        {/* Honeypot — hidden from humans and assistive tech */}
        <div className="inquiry__honeypot" aria-hidden="true">
          <label htmlFor={`${uid}-website`}>Website</label>
          <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>

        {status === 'error' && serverMessage ? (
          <p className="inquiry__alert inquiry__alert--error" role="alert">
            <Icon name="close" size={15} />
            {serverMessage}
          </p>
        ) : null}

        <div className="inquiry__submit">
          <button type="submit" className="btn btn--primary" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Sending…' : 'Send project inquiry'}
            <span className="btn__icon">
              <Icon name="arrow-right" size={17} />
            </span>
          </button>
          <p className="inquiry__submit-note">
            We reply within two working days. Fields marked <span aria-hidden="true">*</span> are
            required.
          </p>
        </div>
      </form>

      {status === 'success' ? (
        <div
          className="inquiry__success"
          tabIndex={-1}
          ref={summaryRef}
          role="status"
          aria-live="polite"
        >
          <span className="inquiry__success-icon">
            <Icon name="check" size={20} />
          </span>
          <h3>
            {ENDPOINT ? 'Inquiry received' : 'Your inquiry is ready to send'}
          </h3>
          <p>
            {ENDPOINT
              ? 'Thanks — your brief is logged and the studio will come back to you within two working days.'
              : 'This build has no server endpoint configured, so nothing was transmitted. Your details are compiled below — send them with one click, or copy the summary into your own email client.'}
          </p>

          <pre className="inquiry__summary">{buildEmailBody(values)}</pre>

          <div className="inquiry__success-actions">
            <a className="btn btn--primary" href={mailtoHref}>
              <Icon name="mail" size={16} />
              Send by email
            </a>
            <button type="button" className="btn btn--ghost" onClick={copySummary}>
              <Icon name={copied ? 'check' : 'download'} size={16} />
              {copied ? 'Copied' : 'Copy summary'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Start another inquiry
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default InquiryForm
