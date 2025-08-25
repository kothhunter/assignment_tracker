// Mock tRPC API for tests
export const api = {
  class: {
    getAll: {
      useQuery: jest.fn(),
    },
  },
  assignment: {
    createManual: {
      useMutation: jest.fn(),
    },
    getAll: {
      useQuery: jest.fn(),
    },
    getById: {
      useQuery: jest.fn(),
    },
    initiatePlan: {
      useMutation: jest.fn(),
    },
  },
  user: {
    getProfile: {
      useQuery: jest.fn(),
    },
  },
  ai: {
    getPlan: {
      useQuery: jest.fn(),
    },
    generateInitialPlan: {
      useMutation: jest.fn(),
    },
    refinePlan: {
      useMutation: jest.fn(),
    },
    getRefinementHistory: {
      useQuery: jest.fn(),
    },
    undoLastRefinement: {
      useMutation: jest.fn(),
    },
    generateFinalPrompts: {
      useMutation: jest.fn(),
    },
  },
};