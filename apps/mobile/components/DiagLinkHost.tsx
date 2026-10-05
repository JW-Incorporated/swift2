// Always-mounted host for the Diagnostics panel opened by the `longlive://diag` deep link (issue #4877). Mounted
// outside every mount branch in App.tsx so it works with the shared UI, the legacy UI and the pending launch state.
import { closeDiagPanel, useDiagPanelOpen } from '../lib/diag-link';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function DiagLinkHost() {
  const open = useDiagPanelOpen();
  return <DiagnosticsPanel visible={open} onClose={closeDiagPanel} />;
}
