declare global {
  interface MasterPillar {
    id: string
    code: string
    name: string
    // ponytail: inline union instead of a shared `MasterStatus` alias — Stream B
    // owns that global type and hasn't landed yet, see plan §3.
    status: 'Active' | 'Inactive'
  }
}

export {}
