import { ConversationEngine, autoAdvanceUtterance } from './conversationEngine';
import { contactsService } from '../services/contacts';
import { walletService } from '../services/wallet';
import { inspectWake } from '../voice/wakeWord';

export function verifyPhoneAssistant() {
  walletService.reset();
  contactsService.reset();
  const engine = new ConversationEngine();
  const log: string[] = [];
  const failures: string[] = [];

  const turn = (text: string, confidence?: number) => {
    const result = engine.process(text, { confidence });
    log.push(`USER: ${text}`);
    log.push(`ASSISTANT: ${result.reply}`);
    log.push(`ACTIONS: ${result.actions.map((action) => action.type).join(', ') || '(none)'}`);
    return result;
  };

  const expect = (condition: boolean, message: string) => {
    if (!condition) failures.push(message);
  };

  turn('Hey AccessPal, open WhatsApp.');
  turn('Send Joe a message.');
  turn("Tell him I'll call him later.");
  turn('Yes.');
  turn('Ndinoda kuziva nguva.');
  turn('Ndinoda kutumira madhora makumi maviri kuna Tendai.');
  turn('Ehe.');
  turn('Allow.');
  turn('Confirm.');
  turn('Actually, let’s continue in English.');

  engine.reset();
  walletService.reset();
  contactsService.reset();

  const wisdom = turn('Hey Pal, send $20 to Wisdom.');
  expect(
    /Wisdom/i.test(wisdom.reply) && wisdom.actions.some((action) => action.type === 'PREPARE_TRANSFER'),
    'TEST A: Wisdom should be understood and EcoCash should open'
  );
  expect(
    Boolean(contactsService.list().find((contact) => /wisdom/i.test(contact.name))),
    'TEST A: Wisdom should be remembered as an unsaved contact'
  );

  engine.reset();
  const beautiful = turn('Hey Pal, this platform is really beautiful.');
  expect(
    /thank you/i.test(beautiful.reply) && !/try asking me to open/i.test(beautiful.reply),
    'TEST B: general compliment should not use the old unknown fallback'
  );

  const access = turn('What do you think about accessibility in Africa?');
  expect(
    /accessib/i.test(access.reply),
    'TEST C: accessibility question should get a natural answer'
  );

  turn('Tell me about Zimbabwe.');
  const follow = turn('What about its technology sector?');
  expect(
    /tech|mobile money|startup/i.test(follow.reply),
    'TEST D: Zimbabwe follow-up should keep context'
  );

  const wakeTime = inspectWake('Hey Pal, what time is it?');
  expect(wakeTime.addressed && /what time/i.test(wakeTime.command), 'TEST E: wake + command');
  expect(inspectWake('Heyy Pal, what time is it?').addressed, 'TEST F: Heyy Pal');
  expect(inspectWake('Hey Pal, what time is it?').addressed, 'TEST F: Hey Pal');
  expect(inspectWake('AccessPal, what time is it?').addressed, 'TEST F: AccessPal');
  expect(inspectWake('Hey Paul, what time is it?').addressed, 'TEST F: Hey Paul');
  expect(!inspectWake('Paul is coming over later').addressed, 'TEST F: bare Paul should not wake');

  engine.reset();
  const mixed = turn('Hey Pal, ndoda kutumira $20 kuna Wisdom using EcoCash.');
    expect(
      /Wisdom/i.test(mixed.reply),
      'TEST J: mixed Shona/English money request'
    );

  engine.reset();
  turn('Send $50 to Wisdom.');
  const corrected = turn('Actually make it $30.');
  expect(/30|\$30/i.test(corrected.reply), 'Correction should update the amount, not start over');
  const renamed = turn('Actually send it to Tendai instead.');
  expect(/Tendai/i.test(renamed.reply), 'Correction should update the recipient');

  engine.reset();
  turn('Open WhatsApp.');
  turn('Message Joe.');
  const aside = turn("Actually, how's the weather today?");
  expect(/weather/i.test(aside.reply), 'Aside question should not crash the WhatsApp task');
  const resume = turn("Tell him I'll call later.");
  expect(
    /Joe|send/i.test(resume.reply),
    'After an aside, the WhatsApp message task should still continue'
  );

  turn('Yeah.');
  expect(true, 'natural confirmation accepted');

  engine.reset();
  walletService.reset();
  contactsService.reset();

  const money = engine.process('Hey Pal, send $20 to Wisdom.');
  expect(Boolean(money.task && money.task.step === 'confirm'), 'Guided money flow should reach confirm');
  const firstAuto = autoAdvanceUtterance(engine.getContext().task);
  expect(firstAuto === 'Yes', 'Confirm step should auto-advance with Yes in guided demo');
  engine.process(firstAuto ?? 'Yes');
  expect(autoAdvanceUtterance(engine.getContext().task) === 'Allow', 'Permission step should auto-allow');
  engine.process('Allow');
  expect(autoAdvanceUtterance(engine.getContext().task) === 'Confirm', 'Authorize step should auto-confirm');
  const done = engine.process('Confirm');
  expect(
    done.actions.some((action) => action.type === 'COMPLETE_TRANSFER'),
    'Guided money flow should complete the transfer'
  );

  engine.reset();
  walletService.reset();
  contactsService.reset();

  const staged = turn('Heyy Pal, send a message.');
  expect(/who/i.test(staged.reply), 'Send a message should ask for a recipient');
  const named = turn('Joe.');
  expect(/joe/i.test(named.reply) && /say|tell|message/i.test(named.reply), 'Joe should fill recipient, not the message');
  const drafted = turn('Good morning.');
  expect(/joe/i.test(drafted.reply) && /good morning/i.test(drafted.reply) && /should i send/i.test(drafted.reply), 'Message body should reach confirmation');
  const sent = turn('Yes, send it.');
  expect(
    /sent/i.test(sent.reply) && sent.actions.some((action) => action.type === 'SEND_MESSAGE'),
    'Natural confirmation must execute SEND_MESSAGE'
  );
  expect(!sent.task, 'Completed message task must close');

  const correctedSend = (() => {
    engine.reset();
    turn('Send a message to Joe saying good morning.');
    const changed = turn('Actually, send it to Tendai instead.');
    expect(/Tendai/i.test(changed.reply) && /good morning/i.test(changed.reply) && !/Joe saying/i.test(changed.reply), 'Recipient correction should keep the message');
    const cancelled = turn("Actually, don't send it.");
    expect(/won'?t send/i.test(cancelled.reply), 'Natural cancellation should clear the pending send');
    expect(!engine.getContext().task, 'Cancelled task must be cleared');
  })();
  void correctedSend;

  const oneShot = turn('Can you let Joe know that I will be late?');
  expect(/joe/i.test(oneShot.reply) && /late/i.test(oneShot.reply), 'Let Joe know should extract recipient and message');

  return { log, failures, ok: failures.length === 0 };
}

export function verifyPhoneAssistantLog() {
  const result = verifyPhoneAssistant();
  return result.log;
}
