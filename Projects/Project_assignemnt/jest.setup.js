import '@testing-library/jest-dom'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/test',
    query: {},
    asPath: '/test',
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  notFound: jest.fn(),
}))

// Mock Next.js App Router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    pathname: '/test',
    query: {},
    asPath: '/test',
  }),
}))

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'sk-test-api-key'

// Mock tRPC
jest.mock('@/lib/trpc', () => ({
  api: {
    assignment: {
      updateStatus: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
      getById: {
        useQuery: jest.fn(() => ({
          data: null,
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
    },
    class: {
      getAll: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
    },
  },
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console errors in tests unless specifically needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})