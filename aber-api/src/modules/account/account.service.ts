import { normalizePhone } from '../../shared/phone';
import type { AccountRepository, MyShipmentDto } from './account.repository';

export interface AccountService {
  myShipments(userId: string): Promise<MyShipmentDto[]>;
}

export function createAccountService(repo: AccountRepository): AccountService {
  return {
    async myShipments(userId) {
      const phone = await repo.findPhoneByUserId(userId);
      if (!phone) return [];
      return repo.listShipmentsForPhone(normalizePhone(phone));
    },
  };
}
