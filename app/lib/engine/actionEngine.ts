import { APP_DISPLAY_NAMES } from '../ai/tools';
import { contactsService } from '../services/contacts';
import { delay, walletService } from '../services/wallet';
import { logTransition } from '../controller/logger';
import type { PhoneAction, TransferDraft } from '../phone/types';

type Dispatchable =
  | PhoneAction
  | { type: 'REFRESH_CHATS' };

export interface ActionRunContext {
  cancelled: () => boolean;
  onStatus: (label: string, actionState: string) => void;
}

/**
 * Deterministic phone execution only.
 * This class must not interpret natural language — it runs structured PhoneAction[]
 * produced by planToolCall() from AI tool arguments.
 */
export class ActionEngine {
  constructor(private dispatch: (action: Dispatchable) => void) {}

  async run(actions: PhoneAction[], ctx: ActionRunContext): Promise<'completed' | 'cancelled' | 'failed'> {
    if (!actions.length) return 'completed';

    let transferAmount = 0;
    let transferName = '';
    let airtimeAmount = 0;

    try {
      for (const action of actions) {
        if (ctx.cancelled()) return 'cancelled';

        if (action.type === 'PREPARE_TRANSFER') {
          transferAmount = action.amount;
          transferName = contactsService.findById(action.recipientId)?.name ?? 'recipient';
        }
        if (action.type === 'PREPARE_AIRTIME') {
          airtimeAmount = action.amount;
        }

        const status = describeAction(action);
        ctx.onStatus(status.label, status.state);
        logTransition('PHONE', status.log);

        if (action.type === 'COMPLETE_TRANSFER') {
          if (transferAmount) {
            await walletService.sendMoney(transferAmount, transferName);
          }
          this.dispatch(action);
          this.dispatch({ type: 'SYNC_WALLET' });
          await delay(480);
          continue;
        }

        if (action.type === 'COMPLETE_AIRTIME') {
          if (airtimeAmount) await walletService.buyAirtime(airtimeAmount);
          this.dispatch(action);
          this.dispatch({ type: 'SYNC_WALLET' });
          await delay(420);
          continue;
        }

        if (action.type === 'SEND_MESSAGE') {
          this.dispatch(action);
          await delay(280);
          this.dispatch({ type: 'REFRESH_CHATS' });
          await delay(320);
          continue;
        }

        this.dispatch(action);
        await delay(status.wait);
      }

      ctx.onStatus('', 'completed');
      return 'completed';
    } catch (error) {
      logTransition('ACTION', 'failed', error);
      ctx.onStatus('', 'failed');
      throw error;
    }
  }
}

function describeAction(action: PhoneAction): {
  label: string;
  state: string;
  log: string;
  wait: number;
} {
  switch (action.type) {
    case 'OPEN_APP':
      return {
        label: `Opening ${APP_DISPLAY_NAMES[action.app]}...`,
        state: 'opening',
        log: `opening ${action.app}`,
        wait: 420,
      };
    case 'OPEN_CHAT':
      return { label: 'Opening chat...', state: 'opening_chat', log: 'opening chat', wait: 380 };
    case 'COMPOSE_MESSAGE':
      return { label: 'Writing message...', state: 'composing', log: 'composing message', wait: 320 };
    case 'SEND_MESSAGE':
      return { label: 'Sending message...', state: 'sending', log: 'sending message', wait: 280 };
    case 'PREPARE_TRANSFER':
      return { label: 'Opening EcoCash...', state: 'preparing', log: 'preparing transfer', wait: 360 };
    case 'SHOW_PERMISSION':
      return { label: 'Permission required', state: 'permission', log: 'permission', wait: 700 };
    case 'CLEAR_PERMISSION':
      return { label: '', state: 'permission_cleared', log: 'permission cleared', wait: 180 };
    case 'ADVANCE_TRANSFER':
      return transferStatus(action.phase);
    case 'COMPLETE_TRANSFER':
      return { label: 'Transaction successful', state: 'success', log: 'success', wait: 500 };
    case 'PREPARE_AIRTIME':
      return { label: 'Opening Airtime...', state: 'preparing', log: 'preparing airtime', wait: 360 };
    case 'ADVANCE_AIRTIME':
      return action.phase === 'processing'
        ? { label: 'Processing purchase...', state: 'processing', log: 'airtime processing', wait: 1100 }
        : { label: 'Confirming airtime...', state: 'confirm', log: `airtime ${action.phase}`, wait: 360 };
    case 'COMPLETE_AIRTIME':
      return { label: 'Airtime purchased', state: 'success', log: 'airtime success', wait: 400 };
    case 'START_CALL':
      return { label: 'Calling...', state: 'calling', log: 'start call', wait: 420 };
    case 'END_CALL':
      return { label: 'Call ended', state: 'ended', log: 'end call', wait: 280 };
    case 'SET_ALARM':
      return { label: 'Setting alarm...', state: 'alarm', log: 'set alarm', wait: 320 };
    case 'GO_HOME':
      return { label: 'Going home...', state: 'home', log: 'home', wait: 240 };
    default:
      return { label: '', state: 'running', log: action.type, wait: 200 };
  }
}

function transferStatus(phase: TransferDraft['phase']) {
  if (phase === 'auth') {
    return { label: 'Authenticating...', state: 'authenticating', log: 'authentication', wait: 1100 };
  }
  if (phase === 'processing') {
    return { label: 'Processing transaction...', state: 'processing', log: 'processing', wait: 1300 };
  }
  if (phase === 'confirm') {
    return { label: 'Reviewing transaction...', state: 'confirm', log: 'confirm', wait: 380 };
  }
  if (phase === 'success') {
    return { label: 'Transaction successful', state: 'success', log: 'success', wait: 420 };
  }
  return { label: 'Preparing transfer...', state: phase, log: phase, wait: 360 };
}
