import { isClearlyGeneral } from './generalConversation';
import type { UtteranceFeatures } from './features';
import type { TaskType } from '../phone/types';

export type RouteKind =
  | 'cancel'
  | 'device'
  | 'continue_task'
  | 'general'
  | 'aside';

/**
 * Device/service requests take priority over general conversation.
 * An in-progress task is kept unless the user clearly starts a new action
 * or steps aside with an unrelated question.
 */
export function routeMeaning(
  features: UtteranceFeatures,
  currentTask: TaskType | null,
  text: string
): RouteKind {
  if (features.act === 'cancel' || features.act === 'deny') return 'cancel';

  const incoming = incomingTaskType(features);

  if (currentTask) {
    if (features.act === 'confirm' || features.act === 'allow' || features.act === 'correct') {
      return 'continue_task';
    }
    if (features.wantsWeather || features.wantsCalendar) {
      return 'aside';
    }
    if (isSlotAnswer(currentTask, features) && incoming !== currentTask) {
      return 'continue_task';
    }
    if (incoming && incoming !== currentTask && features.isDeviceRequest) {
      return 'device';
    }
    if (
      (features.wantsAlarm ||
        features.wantsBiggerText ||
        features.wantsSlowerVoice ||
        features.wantsHelp) &&
      !isSlotAnswer(currentTask, features)
    ) {
      return 'device';
    }
    if (
      !features.isDeviceRequest &&
      features.act === 'inform' &&
      !features.isCorrection &&
      features.amount === undefined &&
      !features.message &&
      !features.phoneNumber &&
      isClearlyGeneral(text)
    ) {
      return 'aside';
    }
    return 'continue_task';
  }

  if (features.isDeviceRequest) return 'device';
  return 'general';
}

export function incomingTaskType(features: UtteranceFeatures): TaskType | null {
  if (features.wantsMoney) return 'send_money';
  if (features.wantsAirtime) return 'buy_airtime';
  if (features.wantsReminder) return 'set_reminder';
  if (features.wantsCall) return 'make_call';
  if (features.wantsMessage) return 'send_message';
  if (features.wantsTime) return 'check_time';
  if (features.wantsBalance) return 'check_balance';
  if (features.wantsHome) return 'open_app';
  if (features.wantsAlarm || features.wantsBiggerText || features.wantsSlowerVoice) {
    return 'open_app';
  }
  if (features.wantsOpen && features.app) return 'open_app';
  return null;
}

function isSlotAnswer(task: TaskType, features: UtteranceFeatures) {
  if (task === 'buy_airtime' && features.amount !== undefined && !features.wantsCall && !features.wantsMessage) {
    return !features.wantsOpen && !features.wantsHome;
  }
  if (task === 'send_money' && features.amount !== undefined && !features.wantsAirtime && !features.wantsCall) {
    return !features.wantsMessage && !features.wantsOpen && !features.wantsHome;
  }
  return false;
}
