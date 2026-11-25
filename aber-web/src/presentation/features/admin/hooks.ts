import {
  branchRepository,
  staffRepository,
  tripRepository,
  vehicleRepository,
} from '@/app/container';
import { useRemoteList } from '@/presentation/hooks/useRemoteList';

// The load functions live at module level so their identity is stable.
const loadBranches = () => branchRepository.list();
const loadStaff = () => staffRepository.list();
const loadVehicles = () => vehicleRepository.list();
const loadTrips = () => tripRepository.list();

export const useBranchList = () => useRemoteList(loadBranches, 'تعذّر تحميل الفروع');
export const useStaffList = () => useRemoteList(loadStaff, 'تعذّر تحميل الموظفين');
export const useVehicleList = () => useRemoteList(loadVehicles, 'تعذّر تحميل المركبات');
export const useTripList = () => useRemoteList(loadTrips, 'تعذّر تحميل الرحلات');
