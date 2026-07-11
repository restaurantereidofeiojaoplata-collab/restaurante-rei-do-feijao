import { SetMetadata } from "@nestjs/common";

export const ALLOW_PENDING_2FA_KEY = "allowPending2fa";
export const AllowPending2FA = () => SetMetadata(ALLOW_PENDING_2FA_KEY, true);
