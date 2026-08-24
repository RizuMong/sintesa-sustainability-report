declare global {
  interface MasterUnit {
    id: string
    name: string
    code: string
    category: string
    status: 'Active' | 'Inactive'
  }
}

export {}
