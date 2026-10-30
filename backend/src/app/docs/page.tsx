import type { Metadata } from 'next'
import { SwaggerViewer } from './SwaggerViewer'

export const metadata: Metadata = {
  title: 'Core Delivery API Documentation — SegiaTech',
  description: 'Interactive OpenAPI 3.1 Swagger UI documentation for SegiaTech Delivery API.',
  robots: 'noindex, nofollow',
}

export default function DocsPage() {
  return <SwaggerViewer />
}
