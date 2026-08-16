import { contextManager } from '../assistant/contextStore';
import { describeCalendar } from '../tools/calendar';
import { parseReminder } from '../tools/reminders';
import { unsupportedCapability } from '../tools/unsupported';
import { extractPlace, fetchWeather, wantsTomorrow } from '../tools/weather';
import { createPermission } from '../services/permissions';
import { contactsService } from '../services/contacts';
import { getCurrentTime } from '../services/time';
import { walletService } from '../services/wallet';
import { extractFeatures, type UtteranceFeatures } from './features';
import { generalConversation } from './generalConversation';
import { speakAct, type ReplyAct } from './replies';
import { routeMeaning } from './router';
import { APP_DISPLAY_NAMES, canAfford, getBalance } from './tools';
import { isAffirmativeUtterance, isLikelyNameOnly, interpretTaskAct } from '../tasks/dialogueActs';
import { missingSlots } from '../tasks/capabilities';
import { isWakeOnly, stripWakeWord } from '../voice/wakeWord';
import type {
  ConversationTask,
  DialogueContext,
  EngineTurn,
  PhoneAction,
} from '../phone/types';
import type { Contact } from '../types';

export class ConversationEngine {
  private context: DialogueContext = {
    language: 'en',
    languageBanner: null,
    task: null,
    lastUserText: '',
  };

  getContext(): DialogueContext {
    return { ...this.context, task: this.context.task ? { ...this.context.task } : null };
  }

  reset() {
    this.context = {
      language: this.context.language,
      languageBanner: null,
      task: null,
      lastUserText: '',
    };
    walletService.reset();
    contactsService.reset();
    generalConversation.reset();
  }

  setLanguage(language: import('../types').LanguageCode) {
    this.context = {
      ...this.context,
      language,
      languageBanner: null,
    };
  }

  process(utterance: string, options: { confidence?: number } = {}): EngineTurn {
    const raw = utterance.trim();
    if (!raw) return this.turn({ type: 'empty' });

    const command = stripWakeWord(raw);
    if (isWakeOnly(raw) || !command) {
      return this.turn({ type: 'wake' }, { expectFollowUp: true });
    }

    this.context = {
      ...this.context,
      lastUserText: command,
    };

    const features = extractFeatures(command);
    const person = this.resolvePerson(features);

    if (!this.context.task) {
      const blocked = unsupportedCapability(command);
      if (blocked) return this.say(blocked);
      if (features.wantsWeather || isWeatherFollowUp(command)) {
        return this.weatherTurn(command);
      }
      if (features.wantsCalendar) return this.calendarTurn(command);
    } else {
      const blocked = unsupportedCapability(command);
      if (blocked) return this.say(blocked, { expectFollowUp: true });
      if (features.wantsWeather || features.wantsCalendar) {
        const spoken = generalConversation.reply(command, this.context.language);
        return this.say(spoken, { expectFollowUp: true });
      }
    }

    if (
      options.confidence !== undefined &&
      options.confidence < 0.45 &&
      features.wantsMoney &&
      features.amount &&
      person
    ) {
      this.context.task = {
        type: 'send_money',
        step: 'confirm',
        contact: person,
        amount: features.amount,
        service: 'EcoCash',
        app: 'ecocash',
      };
      return this.turn(
        { type: 'heard_confirm', amount: features.amount, name: person.name },
        { expectFollowUp: true }
      );
    }

    const route = routeMeaning(features, this.context.task?.type ?? null, command);

    if (route === 'cancel') {
      const hadPending = Boolean(this.context.task);
      const kind = this.context.task?.type;
      this.context = { ...this.context, task: null };
      return this.turn({ type: 'cancel', hadPending, kind });
    }

    if (route === 'aside') {
      const spoken = generalConversation.reply(command, this.context.language);
      return this.say(spoken, { expectFollowUp: true });
    }

    if (route === 'device' || (!this.context.task && features.isDeviceRequest)) {
      return this.startTask(features, person);
    }

    if (route === 'continue_task' && this.context.task) {
      return this.continueTask(features, person);
    }

    const spoken = generalConversation.reply(command, this.context.language);
    return this.say(spoken, { expectFollowUp: true });
  }

  private resolvePerson(features: UtteranceFeatures): Contact | undefined {
    if (features.contact) return features.contact;
    if (features.contactQuery) {
      return contactsService.remember(
        features.contactQuery,
        features.phoneNumber
      );
    }
    return undefined;
  }

  private startTask(features: UtteranceFeatures, person?: Contact): EngineTurn {
    if (features.wantsHome) {
      this.context.task = null;
      return this.turn({ type: 'go_home' }, { actions: [{ type: 'GO_HOME' }] });
    }

    if (features.wantsEndCall) {
      this.context.task = null;
      return this.turn({ type: 'call_ended', name: 'the contact' }, { actions: [{ type: 'END_CALL' }] });
    }

    if (features.wantsHelp) {
      this.context.task = null;
      const spoken = generalConversation.reply(features.raw, this.context.language);
      return this.say(spoken, { expectFollowUp: true });
    }

    if (features.wantsBiggerText) {
      this.context.task = null;
      return this.turn(
        { type: 'text_larger' },
        {
          actions: [
            { type: 'OPEN_APP', app: 'settings' },
            { type: 'SET_TEXT_SCALE', scale: 1.18 },
          ],
        }
      );
    }

    if (features.wantsSlowerVoice) {
      this.context.task = null;
      return this.turn(
        { type: 'voice_slower' },
        {
          actions: [
            { type: 'OPEN_APP', app: 'settings' },
            { type: 'SET_VOICE_RATE', rate: 0.72 },
          ],
        }
      );
    }

    if (features.wantsTime) {
      this.context.task = null;
      return this.turn(
        { type: 'time', time: getCurrentTime() },
        { actions: [{ type: 'OPEN_APP', app: 'clock' }] }
      );
    }

    if (features.wantsBalance) {
      this.context.task = null;
      return this.turn(
        { type: 'balance', balance: getBalance() },
        { actions: [{ type: 'OPEN_APP', app: 'ecocash' }, { type: 'SYNC_WALLET' }] }
      );
    }

    if (features.wantsAlarm) {
      return this.beginAlarm(features);
    }

    if (features.wantsReminder) {
      return this.beginReminder(features.raw);
    }

    if (features.wantsAirtime) {
      return this.beginAirtime(features);
    }

    if (features.wantsMoney) {
      return this.beginMoney(features, person);
    }

    if (features.wantsCall) {
      return this.beginCall(features, person);
    }

    if (features.wantsMessage || (features.message && person)) {
      return this.beginMessage(features, person);
    }

    if (features.app && (features.wantsOpen || features.app)) {
      if (this.context.task && this.context.task.app !== features.app) {
        this.context.task = null;
      }
      const name = APP_DISPLAY_NAMES[features.app];
      return this.turn(
        { type: 'opening_app', name },
        { actions: [{ type: 'OPEN_APP', app: features.app }] }
      );
    }

    const spoken = generalConversation.reply(features.raw, this.context.language);
    return this.say(spoken, { expectFollowUp: true });
  }

  private continueTask(features: UtteranceFeatures, person?: Contact): EngineTurn {
    const task = this.context.task;
    if (!task) return this.startTask(features, person);

    if (person && (!task.contact || features.isCorrection || interpretTaskAct(features.raw) === 'correct')) {
      task.contact = person;
    }
    if (features.amount !== undefined) task.amount = features.amount;
    const meaning = interpretTaskAct(features.raw);
    if (features.message && meaning !== 'confirm' && !isLikelyNameOnly(features.raw)) {
      task.message = features.message;
    }
    if (features.app) task.app = features.app;
    if (features.phoneNumber && task.contact) {
      task.contact = contactsService.remember(task.contact.name, features.phoneNumber);
    }
    this.context = { ...this.context, task: { ...task } };

    if (task.type === 'send_message') return this.advanceMessage(features);
    if (task.type === 'send_money') return this.advanceMoney(features);
    if (task.type === 'buy_airtime') return this.advanceAirtime(features);
    if (task.type === 'make_call') return this.advanceCall(features);
    if (task.type === 'set_reminder') return this.advanceReminder(features, features.raw);

    return this.startTask(features, person);
  }

  private beginMessage(features: UtteranceFeatures, person?: Contact): EngineTurn {
    if (features.contactOptions?.length && !person) {
      this.context.task = { type: 'send_message', step: 'collect' };
      return this.turn(
        { type: 'clarify_contact', options: features.contactOptions.map((c) => c.name) },
        { expectFollowUp: true }
      );
    }

    const contact = person ?? this.resolvePerson(features);

    if (!contact) {
      this.context.task = {
        type: 'send_message',
        step: 'collect',
        status: 'COLLECTING_INFORMATION',
        taskId: newTaskId(),
      };
      return this.turn(
        { type: 'ask_recipient', kind: 'message' },
        { actions: [{ type: 'OPEN_APP', app: 'whatsapp' }], expectFollowUp: true }
      );
    }

    const actions: PhoneAction[] = [
      { type: 'OPEN_APP', app: 'whatsapp' },
      { type: 'OPEN_CHAT', contactId: contact.id, channel: 'whatsapp' },
    ];

    if (!features.message) {
      this.context.task = {
        type: 'send_message',
        step: 'collect',
        status: 'COLLECTING_INFORMATION',
        taskId: newTaskId(),
        contact,
        app: 'whatsapp',
      };
      return this.turn(
        { type: 'ask_message', name: contact.name },
        { actions, expectFollowUp: true }
      );
    }

    this.context.task = {
      type: 'send_message',
      step: 'confirm',
      status: 'READY_FOR_CONFIRMATION',
      taskId: newTaskId(),
      contact,
      message: features.message,
      app: 'whatsapp',
    };
    return this.turn(
      { type: 'confirm_message', name: contact.name, message: features.message },
      {
        actions: [
          ...actions,
          { type: 'COMPOSE_MESSAGE', contactId: contact.id, text: features.message },
        ],
        expectFollowUp: true,
      }
    );
  }

  private advanceMessage(features: UtteranceFeatures): EngineTurn {
    const task = this.context.task!;
    const hadContact = Boolean(task.contact);
    const meaning = interpretTaskAct(features.raw);
    const yes = isAffirmativeUtterance(features.raw, features.act);

    if (
      !task.message &&
      meaning === 'inform' &&
      isLikelyNameOnly(features.raw) &&
      !features.message
    ) {
      const named = this.resolvePerson(features);
      if (named) {
        task.contact = named;
        this.context.task = { ...task, step: 'collect', status: 'COLLECTING_INFORMATION' };
        return this.turn(
          { type: 'ask_message', name: named.name },
          {
            actions: [
              { type: 'OPEN_APP', app: 'whatsapp' },
              { type: 'OPEN_CHAT', contactId: named.id, channel: 'whatsapp' },
            ],
            expectFollowUp: true,
          }
        );
      }
    }

    if (!task.contact) {
      if (features.contactOptions?.length) {
        return this.turn(
          { type: 'clarify_contact', options: features.contactOptions.map((c) => c.name) },
          { expectFollowUp: true }
        );
      }
      const nextPerson = this.resolvePerson(features);
      if (!nextPerson) {
        this.context.task = { ...task, step: 'collect', status: 'COLLECTING_INFORMATION' };
        return this.turn({ type: 'ask_recipient', kind: 'message' }, { expectFollowUp: true });
      }
      task.contact = nextPerson;
      if (isLikelyNameOnly(features.raw) && !features.message) {
        this.context.task = { ...task, step: 'collect', status: 'COLLECTING_INFORMATION' };
        return this.turn(
          { type: 'ask_message', name: task.contact.name },
          {
            actions: [
              { type: 'OPEN_APP', app: 'whatsapp' },
              { type: 'OPEN_CHAT', contactId: task.contact.id, channel: 'whatsapp' },
            ],
            expectFollowUp: true,
          }
        );
      }
    }

    if (
      task.step === 'confirm' &&
      meaning === 'inform' &&
      /[?]/.test(features.raw) &&
      !features.message &&
      !features.isCorrection
    ) {
      this.context.task = { ...task, step: 'confirm', status: 'READY_FOR_CONFIRMATION' };
      return this.turn(
        { type: 'confirm_message', name: task.contact!.name, message: task.message! },
        { expectFollowUp: true }
      );
    }

    if (
      meaning === 'inform' &&
      looksLikeMessage(features.raw) &&
      !yes &&
      !isLikelyNameOnly(features.raw)
    ) {
      const body =
        features.message ||
        stripWakeWord(features.raw).replace(/[.?]+$/, '').trim();
      if (body) task.message = body;
    } else if (features.message && meaning !== 'confirm') {
      task.message = features.message;
    } else if (
      !task.message &&
      meaning === 'inform' &&
      looksLikeMessage(features.raw) &&
      (hadContact || !isLikelyNameOnly(features.raw))
    ) {
      task.message = stripWakeWord(features.raw).replace(/[.?]+$/, '').trim();
    }

    const missing = missingSlots('send_message', {
      contact: task.contact,
      message: task.message,
    });
    if (missing.includes('message') || !task.message) {
      this.context.task = { ...task, step: 'collect', status: 'COLLECTING_INFORMATION' };
      return this.turn(
        { type: 'ask_message', name: task.contact!.name },
        {
          actions: [
            { type: 'OPEN_APP', app: 'whatsapp' },
            { type: 'OPEN_CHAT', contactId: task.contact!.id, channel: 'whatsapp' },
          ],
          expectFollowUp: true,
        }
      );
    }

    if (yes && task.contact && task.message) {
      return this.executeSendMessage(task);
    }

    this.context.task = {
      ...task,
      step: 'confirm',
      status: 'READY_FOR_CONFIRMATION',
    };
    return this.turn(
      { type: 'confirm_message', name: task.contact!.name, message: task.message! },
      {
        actions: [
          { type: 'OPEN_CHAT', contactId: task.contact!.id, channel: 'whatsapp' },
          { type: 'COMPOSE_MESSAGE', contactId: task.contact!.id, text: task.message! },
        ],
        expectFollowUp: true,
      }
    );
  }

  private executeSendMessage(task: ConversationTask): EngineTurn {
    const name = task.contact!.name;
    const contactId = task.contact!.id;
    const text = task.message!;
    this.context.task = null;
    return this.turn(
      { type: 'message_sent', name },
      {
        actions: [
          { type: 'OPEN_CHAT', contactId, channel: 'whatsapp' },
          { type: 'COMPOSE_MESSAGE', contactId, text },
          { type: 'SEND_MESSAGE', contactId, text },
        ],
      }
    );
  }

  private beginMoney(features: UtteranceFeatures, person?: Contact): EngineTurn {
    this.context.task = {
      type: 'send_money',
      step: 'collect',
      contact: person ?? this.resolvePerson(features),
      amount: features.amount,
      service: 'EcoCash',
      app: 'ecocash',
    };
    return this.advanceMoney(features);
  }

  private advanceMoney(features: UtteranceFeatures): EngineTurn {
    const task = this.context.task!;

    if (task.step === 'permission') {
      if (isAffirmativeUtterance(features.raw, features.act)) {
        task.step = 'authorize';
        this.context.task = { ...task };
        return this.turn(
          {
            type: 'confirm_transaction',
            amount: task.amount ?? 0,
            name: task.contact?.name ?? '',
          },
          {
            actions: [
              { type: 'CLEAR_PERMISSION' },
              { type: 'ADVANCE_TRANSFER', phase: 'confirm' },
            ],
            expectFollowUp: true,
          }
        );
      }
      return this.turn({ type: 'need_permission' }, { expectFollowUp: true });
    }

    if (task.step === 'authorize') {
      if (isAffirmativeUtterance(features.raw, features.act)) {
        return this.finishTransfer(task);
      }
      return this.turn(
        {
          type: 'confirm_transaction',
          amount: task.amount ?? 0,
          name: task.contact?.name ?? '',
        },
        { expectFollowUp: true }
      );
    }

    if (features.contactOptions?.length && !task.contact) {
      return this.turn(
        { type: 'clarify_contact', options: features.contactOptions.map((c) => c.name) },
        { expectFollowUp: true }
      );
    }

    if (!task.contact && features.contactQuery) {
      task.contact = contactsService.remember(features.contactQuery, features.phoneNumber);
      this.context.task = { ...task };
    }

    if (!task.contact) {
      return this.turn(
        { type: 'ask_recipient', kind: 'send' },
        { actions: [{ type: 'OPEN_APP', app: 'ecocash' }], expectFollowUp: true }
      );
    }

    if (task.amount === undefined) {
      return this.turn(
        { type: 'ask_amount', kind: 'send', name: task.contact.name },
        { expectFollowUp: true }
      );
    }

    if (!canAfford(task.amount)) {
      this.context.task = null;
      return this.turn({
        type: 'cannot_afford',
        amount: task.amount,
        balance: getBalance(),
      });
    }

    if (task.step === 'confirm' && isAffirmativeUtterance(features.raw, features.act)) {
      task.step = 'permission';
      this.context.task = { ...task };
      return this.turn(
        { type: 'need_permission' },
        {
          actions: [
            { type: 'ADVANCE_TRANSFER', phase: 'permission' },
            {
              type: 'SHOW_PERMISSION',
              permission: createPermission('financial', this.context.language),
            },
          ],
          expectFollowUp: true,
        }
      );
    }

    task.step = 'confirm';
    this.context.task = { ...task };
    return this.turn(
      task.contact.unsaved
        ? {
            type: 'unsaved_send',
            amount: task.amount,
            name: task.contact.name,
            method: 'EcoCash',
          }
        : {
            type: 'confirm_send',
            amount: task.amount,
            name: task.contact.name,
            method: 'EcoCash',
          },
      {
        actions: [
          { type: 'OPEN_APP', app: 'ecocash' },
          {
            type: 'PREPARE_TRANSFER',
            recipientId: task.contact.id,
            amount: task.amount,
            service: 'EcoCash',
          },
        ],
        expectFollowUp: true,
      }
    );
  }

  private finishTransfer(task: ConversationTask): EngineTurn {
    const amount = task.amount ?? 0;
    const name = task.contact?.name ?? '';
    this.context.task = { ...task, step: 'processing' };
    return this.turn(
      { type: 'processing' },
      {
        actions: [
          { type: 'ADVANCE_TRANSFER', phase: 'auth' },
          { type: 'ADVANCE_TRANSFER', phase: 'processing' },
          { type: 'COMPLETE_TRANSFER' },
        ],
        extras: { amount, name },
      }
    );
  }

  private beginAirtime(features: UtteranceFeatures): EngineTurn {
    this.context.task = {
      type: 'buy_airtime',
      step: 'collect',
      amount: features.amount,
      app: 'airtime',
    };
    return this.advanceAirtime(features);
  }

  private advanceAirtime(features: UtteranceFeatures): EngineTurn {
    const task = this.context.task!;

    if (task.amount === undefined) {
      return this.turn(
        { type: 'ask_amount', kind: 'airtime' },
        { actions: [{ type: 'OPEN_APP', app: 'airtime' }], expectFollowUp: true }
      );
    }

    if (!canAfford(task.amount)) {
      this.context.task = null;
      return this.turn({
        type: 'cannot_afford',
        amount: task.amount,
        balance: getBalance(),
      });
    }

    if (task.step === 'confirm' && isAffirmativeUtterance(features.raw, features.act)) {
      const amount = task.amount;
      this.context.task = null;
      return this.turn(
        { type: 'airtime_done', amount },
        {
          actions: [
            { type: 'PREPARE_AIRTIME', amount },
            { type: 'ADVANCE_AIRTIME', phase: 'processing' },
            { type: 'COMPLETE_AIRTIME' },
          ],
        }
      );
    }

    task.step = 'confirm';
    this.context.task = { ...task };
    return this.turn(
      { type: 'confirm_airtime', amount: task.amount },
      {
        actions: [
          { type: 'OPEN_APP', app: 'airtime' },
          { type: 'PREPARE_AIRTIME', amount: task.amount },
        ],
        expectFollowUp: true,
      }
    );
  }

  private beginCall(features: UtteranceFeatures, person?: Contact): EngineTurn {
    this.context.task = {
      type: 'make_call',
      step: 'collect',
      contact: person ?? this.resolvePerson(features),
      app: 'phone',
    };
    return this.advanceCall(features);
  }

  private advanceCall(features: UtteranceFeatures): EngineTurn {
    const task = this.context.task!;

    if (features.contactOptions?.length && !task.contact) {
      return this.turn(
        { type: 'clarify_contact', options: features.contactOptions.map((c) => c.name) },
        { expectFollowUp: true }
      );
    }

    if (!task.contact) {
      const nextPerson = this.resolvePerson(features);
      if (nextPerson) {
        task.contact = nextPerson;
        this.context.task = { ...task };
      } else {
        return this.turn(
          { type: 'ask_recipient', kind: 'call' },
          { actions: [{ type: 'OPEN_APP', app: 'phone' }], expectFollowUp: true }
        );
      }
    }

    if (task.step === 'confirm' && isAffirmativeUtterance(features.raw, features.act)) {
      const name = task.contact.name;
      const contactId = task.contact.id;
      this.context.task = null;
      return this.turn(
        { type: 'calling', name },
        { actions: [{ type: 'START_CALL', contactId }] }
      );
    }

    task.step = 'confirm';
    this.context.task = { ...task };
    return this.turn(
      { type: 'confirm_call', name: task.contact.name },
      {
        actions: [{ type: 'OPEN_APP', app: 'phone' }],
        expectFollowUp: true,
      }
    );
  }

  private beginAlarm(features: UtteranceFeatures): EngineTurn {
    const time = features.alarmTime ?? '6:00 AM';
    this.context.task = null;
    return this.turn(
      { type: 'alarm_set', time },
      { actions: [{ type: 'SET_ALARM', time }, { type: 'OPEN_APP', app: 'clock' }] }
    );
  }

  private weatherTurn(command: string): EngineTurn {
    const previous = contextManager.current();
    const place = extractPlace(command) || previous?.place || 'Harare';
    const tomorrow = wantsTomorrow(command) || /what about/i.test(command);
    contextManager.remember({
      kind: 'weather',
      place,
      day: tomorrow ? 'tomorrow' : 'today',
    });
    return {
      ...this.say('Let me check the weather for you.', { actions: [] }),
      intent: 'weather',
      asyncReply: () => fetchWeather(place, tomorrow),
    };
  }

  private calendarTurn(command: string): EngineTurn {
    const day = wantsTomorrow(command) ? 'tomorrow' : 'today';
    contextManager.remember({ kind: 'calendar', day });
    return this.say(describeCalendar(day), {
      actions: [{ type: 'OPEN_APP', app: 'clock' }],
    });
  }

  private beginReminder(command: string): EngineTurn {
    const draft = parseReminder(command);
    this.context.task = {
      type: 'set_reminder',
      step: 'collect',
      message: draft.text,
      when: draft.time,
    };
    return this.advanceReminder(extractFeatures(command), command);
  }

  private advanceReminder(features: UtteranceFeatures, command: string): EngineTurn {
    const task = this.context.task!;
    const draft = parseReminder(command);
    if (draft.text) task.message = draft.text;
    if (draft.time) task.when = draft.time;
    if (features.alarmTime) task.when = features.alarmTime;
    this.context.task = { ...task };

    if (!task.message) {
      return this.say('Sure. What would you like me to remind you about?', {
        expectFollowUp: true,
      });
    }
    if (!task.when) {
      return this.say('What time should I remind you?', { expectFollowUp: true });
    }

    const time = task.when;
    const text = task.message;
    this.context.task = null;
    contextManager.remember({ kind: 'reminder' });
    return this.say(`Done. I'll remind you to ${text} at ${time}.`, {
      actions: [{ type: 'SET_ALARM', time }, { type: 'OPEN_APP', app: 'clock' }],
    });
  }

  private say(
    reply: string,
    options: { actions?: PhoneAction[]; expectFollowUp?: boolean } = {}
  ): EngineTurn {
    const actions = [...(options.actions ?? [])];
    if (this.context.languageBanner) {
      actions.unshift({
        type: 'SET_LANGUAGE',
        language: this.context.language,
        banner: this.context.languageBanner,
      });
    }
    return {
      reply,
      language: this.context.language,
      languageChanged: Boolean(this.context.languageBanner),
      languageBanner: this.context.languageBanner,
      expectFollowUp: Boolean(options.expectFollowUp),
      actions,
      task: this.context.task,
      intent: 'chat',
    };
  }

  private turn(
    act: ReplyAct,
    options: {
      actions?: PhoneAction[];
      expectFollowUp?: boolean;
      extras?: { amount?: number; name?: string };
    } = {}
  ): EngineTurn {
    let reply = speakAct(act, this.context.language);
    const actions = [...(options.actions ?? [])];

    if (this.context.languageBanner) {
      actions.unshift({
        type: 'SET_LANGUAGE',
        language: this.context.language,
        banner: this.context.languageBanner,
      });
    }

    if (act.type === 'processing' && options.extras) {
      const amount = options.extras.amount ?? 0;
      const name = options.extras.name ?? '';
      const balance = Math.max(0, getBalance() - amount);
      reply = speakAct({ type: 'processing' }, this.context.language);
      this.context.task = null;
      return {
        reply,
        language: this.context.language,
        languageChanged: Boolean(this.context.languageBanner),
        languageBanner: this.context.languageBanner,
        expectFollowUp: false,
        actions,
        task: null,
        followUpReply: speakAct(
          { type: 'sent', amount, name, balance },
          this.context.language
        ),
        intent: 'sent',
      } as EngineTurn & { followUpReply?: string };
    }

    return {
      reply,
      language: this.context.language,
      languageChanged: Boolean(this.context.languageBanner),
      languageBanner: this.context.languageBanner,
      expectFollowUp: Boolean(options.expectFollowUp),
      actions,
      task: this.context.task,
      intent: act.type,
    };
  }
}

export function autoAdvanceUtterance(task: ConversationTask | null): string | null {
  if (!task) return null;
  if (task.step === 'permission') return 'Allow';
  if (task.step === 'authorize') return 'Confirm';
  if (task.step === 'confirm' && hasRequiredSlots(task)) return 'Yes';
  return null;
}

function isWeatherFollowUp(command: string) {
  const topic = contextManager.current();
  if (topic?.kind !== 'weather') return false;
  return /^(what about|and tomorrow|tomorrow)\b/i.test(command.trim());
}

function hasRequiredSlots(task: ConversationTask) {
  if (task.type === 'send_money') return Boolean(task.contact && task.amount !== undefined);
  if (task.type === 'send_message') return Boolean(task.contact && task.message);
  if (task.type === 'buy_airtime') return task.amount !== undefined;
  if (task.type === 'make_call') return Boolean(task.contact);
  if (task.type === 'set_reminder') return Boolean(task.message && task.when);
  return false;
}

function looksLikeMessage(text: string) {
  const trimmed = stripWakeWord(text);
  if (trimmed.length < 2) return false;
  if (interpretTaskAct(trimmed) !== 'inform') return false;
  return true;
}

function newTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type EngineTurnResult = EngineTurn & { followUpReply?: string };
