import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for jsdom + Next edge cases
Object.assign(global, { TextDecoder, TextEncoder })

// Silence next-auth / next runtime logs during tests
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
