import { ref } from 'vue'

// ponytail: temporary stand-in for Stream C's `@/services/master-employee` (`useGetMasterEmployee()`),
// which hasn't merged yet. Shape matches plan §3's `MasterEmployee` structurally, but deliberately does
// NOT declare a global `MasterEmployee` — Stream C owns that global.
// Delete this file and swap callers to the real `useGetMasterEmployee()` once Stream C lands.
interface StubEmployee {
  id: string
  entity_id: string
  position_id: string
  full_name: string
  email: string
  phone: string
  status: 'Active' | 'Inactive'
}

const stubEmployees: StubEmployee[] = [
  { id: 'emp-1', entity_id: 'entity-holding', position_id: 'pos-1', full_name: 'PIC SR Holding', email: 'pic.holding@sintesa.co.id', phone: '0800000001', status: 'Active' },
  { id: 'emp-2', entity_id: 'entity-sub-1', position_id: 'pos-2', full_name: 'PIC Subsidiary A', email: 'pic.suba@sintesa.co.id', phone: '0800000002', status: 'Active' },
  { id: 'emp-3', entity_id: 'entity-branch-1', position_id: 'pos-3', full_name: 'PIC Branch A1', email: 'pic.brancha1@sintesa.co.id', phone: '0800000003', status: 'Active' },
]

export function useMasterEmployeeStub() {
  return { data: ref(stubEmployees) }
}
