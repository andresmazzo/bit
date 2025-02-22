import { getHarmonyVersion } from '@teambit/legacy/dist/bootstrap';

import { Slot, SlotRegistry } from '@teambit/harmony';
import { MainRuntime } from '@teambit/cli';
import { ExpressAspect, ExpressMain } from '@teambit/express';
import { DiagnosticAspect } from './diagnostic.aspect';
import { DiagnosticRoute } from './diagnostic.route';
import { Diagnostic } from './diagnostic';

export type DiagnosticSlot = SlotRegistry<Diagnostic[]>;

export class DiagnosticMain {
  constructor(
    /** the diagnostic entity slot */
    private diagnosticSlot: DiagnosticSlot
  ) {}
  static slots = [Slot.withType<Diagnostic[]>()];
  static dependencies = [ExpressAspect];
  static runtime = MainRuntime;

  register(...diagnostic: Diagnostic[]) {
    this.diagnosticSlot.register(diagnostic);
  }

  getDiagnosticData() {
    const slots = this.diagnosticSlot.toArray();
    return slots.reduce((prev, cSlot) => {
      const [aspectId, diagnostic] = cSlot;
      prev[aspectId] = { reports: [] };
      diagnostic.forEach((diag) => {
        const { diagnosticFn } = diag;
        prev[aspectId].reports.push(diagnosticFn());
      });
      return prev;
    }, {});
  }

  static getBitVersion() {
    const version = getHarmonyVersion(true);
    return { version };
  }

  static async provider([express]: [ExpressMain], config: any, [diagnosticSlot]: [DiagnosticSlot]) {
    const diagnosticMain = new DiagnosticMain(diagnosticSlot);
    diagnosticMain.register({ diagnosticFn: DiagnosticMain.getBitVersion });
    express.register([new DiagnosticRoute(diagnosticMain)]);
    return diagnosticMain;
  }
}

DiagnosticAspect.addRuntime(DiagnosticMain);
