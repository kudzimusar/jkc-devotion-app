'use client';

import { InitialConnectModal } from '@/components/public/InitialConnectModal';

/**
 * ConnectModalProvider
 * Mounts the InitialConnectModal globally on all public-facing pages.
 * The modal itself handles its own exhibition delay (2 seconds) and
 * session-based visibility logic.
 */
export function ConnectModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InitialConnectModal />
    </>
  );
}
