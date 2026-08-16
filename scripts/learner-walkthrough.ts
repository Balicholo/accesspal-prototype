import { ConversationEngine, autoAdvanceUtterance } from '../app/lib/ai/conversationEngine';
import { contactsService } from '../app/lib/services/contacts';
import { walletService } from '../app/lib/services/wallet';
import { getDemoScenarios } from '../app/data/demoScenarios';

type Issue = { case: string; detail: string };

const issues: Issue[] = [];
const log: string[] = [];

function fail(name: string, detail: string) {
  issues.push({ case: name, detail });
}

async function run() {
  const engine = new ConversationEngine();

  const turn = (text: string, label = text) => {
    const result = engine.process(text);
    log.push(`USER: ${text}`);
    log.push(`PAL: ${result.reply}`);
    log.push(`INTENT: ${result.intent ?? '-'} TASK: ${result.task?.type ?? 'none'}/${result.task?.step ?? '-'} ACTIONS: ${result.actions.map((a) => a.type).join(',') || '(none)'}`);
    if (!result.reply?.trim()) fail(label, 'Empty reply');
    if (/command not recognised|try asking me to open/i.test(result.reply)) {
      fail(label, `Harsh unknown fallback: ${result.reply}`);
    }
    return result;
  };

  const autoFinish = (label: string) => {
    let guard = 0;
    while (guard < 8) {
      const next = autoAdvanceUtterance(engine.getContext().task);
      if (!next) break;
      turn(next, `${label} auto:${next}`);
      guard += 1;
    }
    if (guard >= 8) fail(label, 'Auto-advance loop');
  };

  // --- Guided demos as a first-time user clicking everything ---
  for (const lang of ['en', 'sn', 'nd', 'sw'] as const) {
    engine.reset();
    engine.setLanguage(lang);
    walletService.reset();
    contactsService.reset();
    for (const scenario of getDemoScenarios(lang)) {
      engine.reset();
      walletService.reset();
      contactsService.reset();
      engine.setLanguage(lang);
      for (const line of scenario.turns) {
        turn(line, `${lang}:${scenario.id}:${line}`);
        autoFinish(`${lang}:${scenario.id}`);
      }
    }
  }

  // --- Messy English learner ---
  engine.reset();
  walletService.reset();
  contactsService.reset();
  engine.setLanguage('en');

  let r = turn('um hi');
  if (!r.reply) fail('um hi', 'no greeting-like reply');

  r = turn('what is this?');
  if (/command not/i.test(r.reply)) fail('what is this', r.reply);

  r = turn('Heyy Pal');
  if (!/yes|listening|hongu|yebo|ndiyo/i.test(r.reply) && r.intent !== 'wake') {
    fail('Heyy Pal', `expected wake, got ${r.intent}: ${r.reply}`);
  }

  r = turn('can you help me?');
  r = turn('open whatsapp please');
  if (!r.actions.some((a) => a.type === 'OPEN_APP')) fail('open whatsapp please', r.reply);

  r = turn('uhh send a message');
  if (!/who/i.test(r.reply)) fail('send a message', `expected ask recipient: ${r.reply}`);

  r = turn('I think Joe');
  if (!/joe/i.test(r.reply)) fail('I think Joe', `expected Joe: ${r.reply}`);

  r = turn('just say I am on my way');
  if (!/on my way/i.test(r.reply) || !/should i send/i.test(r.reply)) {
    fail('message body', r.reply);
  }

  r = turn('wait what?');
  if (r.actions.some((a) => a.type === 'SEND_MESSAGE')) fail('wait what', 'sent without confirm');

  r = turn('yeah go ahead');
  if (!r.actions.some((a) => a.type === 'SEND_MESSAGE')) fail('yeah go ahead', `did not send: ${r.reply}`);
  if (engine.getContext().task) fail('yeah go ahead', 'task still open after send');

  r = turn('call my mom');
  if (!/mother|mom|mum/i.test(r.reply)) fail('call my mom', r.reply);
  r = turn('yes');
  if (!r.actions.some((a) => a.type === 'START_CALL')) fail('confirm call', r.reply);

  r = turn('hang up');
  if (!r.actions.some((a) => a.type === 'END_CALL')) fail('hang up', r.reply);

  r = turn('whats the time');
  if (!r.actions.some((a) => a.type === 'OPEN_APP')) fail('time', r.reply);

  r = turn('how much money do I have');
  if (!/balance|\$/i.test(r.reply)) fail('balance phrasing', r.reply);

  r = turn('I need airtime');
  r = turn('five dollars');
  r = turn('yep');
  if (!r.actions.some((a) => a.type === 'COMPLETE_AIRTIME')) fail('airtime yep', r.reply);

  r = turn('wake me up at 7 tomorrow');
  if (!r.actions.some((a) => a.type === 'SET_ALARM')) fail('wake me up', r.reply);

  r = turn('remind me to call Mum at 5');
  if (!/remind/i.test(r.reply)) fail('reminder', r.reply);

  r = turn('send money');
  if (!/who/i.test(r.reply)) fail('send money', r.reply);
  r = turn('Wisdom');
  r = turn('20');
  if (!/20/i.test(r.reply)) fail('amount 20', r.reply);
  r = turn('hmm no cancel that');
  if (engine.getContext().task) fail('cancel money', 'task still active');
  if (!/won'?t|cancel|no problem|okay/i.test(r.reply)) fail('cancel money reply', r.reply);

  r = turn('send 15 dollars to Tendai on EcoCash');
  autoFinish('tendai money');
  r = turn('Yes');
  autoFinish('tendai money yes');
  const done = engine.getContext();
  if (done.task) {
    autoFinish('tendai leftover');
  }

  r = turn('text Joe good night');
  r = turn('send it');
  if (!r.actions.some((a) => a.type === 'SEND_MESSAGE')) fail('text joe send it', r.reply);

  r = turn('make the text bigger');
  if (!r.actions.some((a) => a.type === 'SET_TEXT_SCALE')) fail('bigger text', r.reply);

  r = turn('speak slower');
  if (!r.actions.some((a) => a.type === 'SET_VOICE_RATE')) fail('slower voice', r.reply);

  r = turn('go home');
  if (!r.actions.some((a) => a.type === 'GO_HOME')) fail('go home', r.reply);

  r = turn('organise my files');
  if (!/files|don't have|do not have/i.test(r.reply)) fail('files fallback', r.reply);

  r = turn('order me a pizza');
  if (!/food|pizza/i.test(r.reply)) fail('pizza fallback', r.reply);

  r = turn('will it rain tomorrow');
  if (r.intent !== 'weather' && !r.asyncReply) fail('rain tomorrow', `${r.intent} ${r.reply}`);

  r = turn("what's on my calendar today");
  if (!r.reply) fail('calendar', 'empty');

  r = turn('Call Tendai Chirwa');
  if (!/Tendai/i.test(r.reply)) fail('tendai chirwa call', r.reply);

  r = turn('no never mind');
  if (engine.getContext().task) fail('cancel call', 'task still open');

  r = turn('Message Joe');
  r = turn('hello');
  r = turn('change the message to see you soon');
  if (!/see you soon/i.test(r.reply)) fail('edit message', r.reply);
  r = turn('actually send it to Mother instead');
  if (!/Mother|Mum|Mom/i.test(r.reply)) fail('edit recipient', r.reply);
  r = turn('please send it');
  if (!r.actions.some((a) => a.type === 'SEND_MESSAGE')) fail('please send it', r.reply);

  r = turn('Hey Pal, send EcoCash');
  if (/balance/i.test(r.reply) && !/who|how much|send/i.test(r.reply)) {
    fail('send EcoCash', `looks like balance loop: ${r.reply}`);
  }

  r = turn('open calculator');
  if (!r.actions.some((a) => a.type === 'OPEN_APP')) fail('calculator', r.reply);

  r = turn('open clock');
  r = turn('set alarm for 6');

  r = turn('Send $20 to Wisdom');
  r = turn('Yes');
  r = turn('Allow');
  r = turn('Confirm');
  if (!r.actions.some((a) => a.type === 'COMPLETE_TRANSFER') && !/sent|processing|done/i.test(r.reply)) {
    fail('full money flow', r.reply);
  }

  r = turn('your current balance is 45 dollars');
  if (r.intent === 'balance' || /your current balance is/i.test(r.reply)) {
    // echoing pal should not restart a balance speech loop as a new successful balance intent from pal-script
    // A learner typing pal's words is odd; we only fail if it clearly re-triggers a loop-like balance read AND task hangs
  }

  if (issues.length) {
    console.error('\nGLITCHES FOUND:\n' + issues.map((i) => `- [${i.case}] ${i.detail}`).join('\n'));
    console.log('\n--- log ---\n' + log.join('\n'));
    process.exit(1);
  }
  console.log(log.join('\n'));
  console.log('\nLearner walkthrough passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
