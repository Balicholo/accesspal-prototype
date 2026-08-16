CRITICAL: FIX THE CORE EXPERIENCE BEFORE ADDING MORE FEATURES

The AccessPal prototype currently has a good smartphone simulation and visual concept, but the voice interaction and action execution are not reliable enough for a live pitch.

The current problems include:

Listening mode sometimes does not visibly show the listening state.
Microphone/listening appears to activate but AccessPal does not respond.
Voice conversations appear to freeze.
A user can speak but the command does not reliably reach the AI/action system.
AccessPal does not consistently transition from listening → processing → responding.
Demo Mode starts a task but sometimes stops at a permission screen.
Demo Mode does not reliably complete the entire simulated task.
Voice responses and phone animations are sometimes disconnected.
The system can become stuck in one state.
There is no guaranteed return to a ready state after an interaction.
DO NOT add more features until these problems are fixed.

This task is about turning the current prototype into a reliable, end-to-end functional experience.

Do not redesign the existing smartphone simulation.

Do not start the project over.

Do not remove existing functionality that already works.

Instead, inspect the current implementation, identify the root causes, and rebuild the interaction orchestration layer where necessary.

1. THE PRODUCT EXPERIENCE WE ARE BUILDING

AccessPal should feel like a real-world voice assistant.

The basic experience must be:

USER
  ↓
Wake AccessPal
  ↓
ACCESSPAL LISTENS
  ↓
User speaks
  ↓
Transcript received
  ↓
ACCESSPAL PROCESSES
  ↓
AI understands intent
  ↓
Action selected
  ↓
PHONE SIMULATION RESPONDS
  ↓
ACCESSPAL SPEAKS
  ↓
READY FOR NEXT REQUEST

This cycle must be reliable.

The user should never have to wonder:

"Did AccessPal hear me?"

or:

"Is it still listening?"

or:

"Why did nothing happen?"

or:

"Why did the demo stop?"

2. FIRST: AUDIT THE EXISTING CODE

Before changing anything, inspect the entire current implementation.

Identify:

Voice
speech recognition implementation
microphone permissions
listening state
recognition start
recognition stop
interim results
final results
recognition errors
recognition end event
wake-word handling
language configuration
AI
where transcripts are sent
how AI responses are generated
how intents/actions are identified
how conversation context is stored
how tool/action calls are returned
Phone simulation
application state
current application
navigation
app-opening animations
permission screens
confirmation screens
transaction states
Demo Mode
how demo scenarios are defined
whether Demo Mode uses the same action system as voice
where scenarios stop
whether timers/promises are responsible for transitions
Text-to-speech
speech synthesis
start/end/error callbacks
voice selection
selected language
speaking state

Do this audit first.

Do not blindly add more event handlers to the existing implementation.

3. CREATE ONE CENTRAL APPLICATION STATE MACHINE

The biggest requirement is to stop having separate components independently deciding what AccessPal is doing.

Create one central voice/application controller.

The exact implementation can vary, but conceptually AccessPal needs states like:

IDLE
WAKE_DETECTED
LISTENING
PROCESSING
EXECUTING_ACTION
SPEAKING
WAITING_FOR_FOLLOW_UP
ERROR

For example:

IDLE
 ↓
WAKE_DETECTED
 ↓
LISTENING
 ↓
PROCESSING
 ↓
EXECUTING_ACTION
 ↓
SPEAKING
 ↓
IDLE

For a multi-turn conversation:

LISTENING
 ↓
PROCESSING
 ↓
SPEAKING
 ↓
WAITING_FOR_FOLLOW_UP
 ↓
LISTENING

No component should randomly set:

isListening = true

or:

isListening = false

without going through the central controller.

4. CREATE ONE SOURCE OF TRUTH

There must be a single source of truth for:

voiceState
isListening
isProcessing
isSpeaking
currentTranscript
currentLanguage
currentApp
currentAction
conversationContext
activeDemo
pendingAction
error

Do not allow:

VoiceInput

to think it is listening while:

page.tsx

thinks it is processing.

All components should reflect the central state.

5. LISTENING UI MUST ALWAYS MATCH REAL STATE

When AccessPal is actually listening, the interface MUST visibly show:

Listening...

or the equivalent in the selected language.

The microphone should visibly react.

For example:

● Listening...

with an animation.

When listening stops:

Ready

When processing:

Thinking...

When speaking:

Speaking...

When executing a phone action:

Opening WhatsApp...

The user should always know what AccessPal is doing.

6. DO NOT FAKE THE LISTENING STATE

Do not simply display:

Listening...

for a fixed number of seconds.

The UI must reflect the actual recognition state.

If speech recognition starts:

voiceState = "listening"

If recognition ends:

voiceState = appropriate next state

If a final transcript arrives:

stop recognition
voiceState = "processing"

If an error occurs:

voiceState = "error"

The visual state must be driven by the actual voice lifecycle.

7. FIX THE SPEECH RECOGNITION LIFECYCLE

The speech recognition implementation needs a complete lifecycle.

Handle:

onstart
onresult
onerror
onend

Do not only implement onresult.

The expected lifecycle is:

start()
 ↓
onstart
 ↓
LISTENING
 ↓
onresult
 ↓
FINAL TRANSCRIPT
 ↓
stop()
 ↓
PROCESSING

If recognition naturally ends:

onend
 ↓
determine why it ended
 ↓
continue / restart / process / return to ready

Do not let onend accidentally reset the application before the transcript has been processed.

8. FINAL TRANSCRIPT MUST TRIGGER THE NEXT STAGE

This is critical.

When the recognizer produces a final result:

"send twenty dollars to Wisdom"

the system must immediately:

capture transcript
stop recognition
set listening false
set processing true
send transcript to conversation engine
receive structured intent
execute action
update phone simulation
generate response
speak response
return to ready/follow-up state

There must be no dead state between these stages.

9. NEVER PROCESS INTERIM TRANSCRIPTS AS COMMANDS

If speech recognition produces:

"send..."
"send money..."
"send money to..."
"send money to Wisdom..."
"send money to Wisdom twenty dollars"

do not execute five actions.

Only the final result should enter the command pipeline.

10. PREVENT MULTIPLE RECOGNITION INSTANCES

This is a common source of buggy voice applications.

There must NEVER be multiple active recognition sessions.

Before starting recognition:

if already listening:
    do not start another session

Make the start/stop methods idempotent.

Calling:

startListening()

twice should not create two recognizers.

Calling:

stopListening()

when already stopped should not crash.

11. PREVENT RACE CONDITIONS

Be especially careful about:

onresult
onend
timeout
stop()
start()

happening almost simultaneously.

Example:

final transcript received
↓
stop recognition
↓
onend fires
↓
onend restarts recognition
↓
AI is still processing

This can create the exact "it keeps listening/freezes" behavior we are seeing.

Implement proper guards.

For example, conceptually:

sessionId
isProcessing
isSpeaking
shouldRestart

A recognition session that has been intentionally stopped must NOT automatically restart.

12. WAKE WORD EXPERIENCE

AccessPal should behave like a voice-first assistant.

Support:

"Hey Pal."

"Hey AccessPal."

"AccessPal."

And:

"Hey Pal, open WhatsApp."

The last example is extremely important.

The user should NOT have to say:

"Hey Pal."

wait

"Listening..."

then

"Open WhatsApp."

It should understand a wake phrase and command in the same sentence.

13. IMPORTANT BROWSER LIMITATION

Do not pretend that browser-native speech recognition provides a perfect custom wake word like Siri.

The browser cannot reliably provide a true always-on hardware wake-word experience.

For this prototype, implement a robust simulated wake-word experience using the available browser capabilities.

The architecture should nevertheless resemble:

WAKE
 ↓
LISTEN
 ↓
PROCESS
 ↓
RESPOND

If continuous wake listening is enabled, make it safe and recoverable.

If the browser does not support the required behavior, gracefully fall back to a visible listening mode rather than freezing.

14. THE ASSISTANT MUST NOT HEAR ITSELF

This is mandatory.

When AccessPal is speaking:

microphone recognition = OFF

When speech synthesis finishes:

microphone = READY

Otherwise:

AccessPal says:
"Opening WhatsApp."


microphone hears:
"Opening WhatsApp."


AI interprets:
user requested something

This can create infinite loops.

Prevent it completely.

15. TEXT-TO-SPEECH MUST HAVE A COMPLETE LIFECYCLE

Use:

speechSynthesis.speak()

with proper:

onstart
onend
onerror

When speaking starts:

voiceState = SPEAKING

When speaking ends:

voiceState = READY / WAITING_FOR_FOLLOW_UP

If speech fails:

voiceState = ERROR

Never leave the application permanently stuck in speaking.

16. THE CONVERSATION MUST BE MULTI-TURN

AccessPal should NOT treat every request as an isolated command.

Example:

USER:

"Hey Pal, I want to send money."

ACCESSPAL:

"Sure. Who would you like to send it to?"

USER:

"Wisdom."

ACCESSPAL:

"How much would you like to send?"

USER:

"Twenty dollars."

ACCESSPAL:

"You're sending $20 to Wisdom using EcoCash. Should I continue?"

USER:

"Yes."

Then:

EcoCash
↓
authentication
↓
processing
↓
success

The assistant must remember:

intent = send_money
recipient = Wisdom
amount = 20
service = EcoCash

throughout the conversation.

17. NATURAL INTERRUPTIONS

Users don't speak perfectly.

Support:

"Send money to Wisdom."

then:

"Actually, make that twenty-five."

Update the transaction.

Support:

"No, wait. Send it to Tendai."

Update recipient.

Support:

"Never mind."

Cancel.

Support:

"Go ahead."

Confirm.

The conversation engine should understand meaning rather than exact phrases.

18. EVERY ACTION MUST RETURN A RESULT

This is probably the most important fix for Demo Mode.

Currently, Demo Mode apparently reaches:

Permission required

and then stops.

That means the action sequence is not properly orchestrated.

Every action must have:

start
progress
next
success
failure
cancel

For example:

EcoCash Transaction


START
↓
Opening EcoCash
↓
Permission
↓
Authentication
↓
Transaction Review
↓
Confirmation
↓
Processing
↓
Success

The system must explicitly transition between every state.

19. DO NOT USE RANDOM TIMEOUTS AS THE MAIN LOGIC

Avoid building flows like:

setTimeout(() => openEcoCash(), 1000)
setTimeout(() => showPermission(), 2000)
setTimeout(() => showSuccess(), 5000)

with no relationship between them.

That creates fragile demos.

Instead create an action runner:

executeAction()
 ↓
step 1
 ↓
await step completion
 ↓
step 2
 ↓
await step completion
 ↓
step 3

Use timers only to create realistic animation delays.

The state transition should remain explicit.

20. BUILD A REUSABLE DEMO ACTION ENGINE

This is essential.

Demo Mode should NOT have separate fake logic.

Both:

VOICE

and:

DEMO MODE

must call the SAME action engine.

Architecture:

VOICE COMMAND
      ↓
   AI ROUTER
      ↓
STRUCTURED ACTION
      ↓
 ACTION ENGINE
      ↓
PHONE SIMULATION

and:

DEMO SCENARIO
      ↓
STRUCTURED ACTION
      ↓
 ACTION ENGINE
      ↓
PHONE SIMULATION

This means Demo Mode tests the actual product flow.

If Demo Mode works, voice should work.

21. STRUCTURED ACTION FORMAT

Create a consistent action format.

For example:

{
  "type": "send_money",
  "service": "ecocash",
  "recipient": "Wisdom",
  "amount": 20
}

WhatsApp:

{
  "type": "send_message",
  "app": "whatsapp",
  "recipient": "Joe",
  "message": "I'll call you later."
}

Call:

{
  "type": "make_call",
  "contact": "Tendai"
}

Time:

{
  "type": "get_time"
}

Alarm:

{
  "type": "set_alarm",
  "time": "06:00"
}

The action engine then controls the phone.

22. ACTION ENGINE

Create something conceptually like:

ActionEngine
├── openApp()
├── sendMessage()
├── makeCall()
├── sendMoney()
├── buyAirtime()
├── checkBalance()
├── getTime()
├── setAlarm()
└── closeApp()

Each action should return:

started
progress
completed
failed
cancelled

The exact implementation is up to the existing architecture.

23. SEND MONEY MUST SHOW THE ENTIRE FLOW

When the user says:

"Send $20 to Wisdom."

The screen should visibly do:

ACCESSPAL
"Sure. I'll help you send $20 to Wisdom."


↓
HOME SCREEN


↓
ECOCASH OPENS


↓
SEND MONEY


Recipient:
Wisdom


Amount:
$20


↓
REVIEW


"You're sending $20 to Wisdom."


↓
CONFIRMATION


[Cancel] [Confirm]


↓
AUTHENTICATION


"Please authenticate."


↓
PROCESSING


"Processing transaction..."


↓
SUCCESS


"Money sent successfully."


↓
HOME / WALLET


Balance updates

No stopping halfway.

24. PERMISSION MUST BE AN ACTUAL STATE

If permission is part of the demo:

PERMISSION_REQUIRED

must have a defined next action.

For example:

Permission Required
Allow AccessPal to access EcoCash?


[Allow]
[Deny]

When the user selects Allow:

permissionGranted
↓
continue transaction

When Demo Mode is running automatically:

demoMode = true
↓
automatically select Allow
↓
continue

Do not leave Demo Mode waiting for a human click unless that interaction is deliberately part of the scenario.

25. DEMO MODE NEEDS TWO MODES

Create:

Interactive Demo

The presenter can manually interact with the phone.

AND:

Guided Demo

The system automatically performs the entire scenario.

For example:

Guided Demo:
Send money with EcoCash

Clicking it should run:

Wake
↓
Voice command appears
↓
Assistant response
↓
EcoCash opens
↓
Recipient
↓
Amount
↓
Permission
↓
Confirmation
↓
Processing
↓
Success

No manual intervention should be required.

26. DEMO MODE SHOULD SIMULATE THE VOICE CONVERSATION TOO

Do not make Guided Demo simply animate screens.

Show the conversation.

Example:

USER
"Hey Pal, send $20 to Wisdom."


ACCESSPAL
"Sure. I'll help you send $20 to Wisdom."


PHONE
Opening EcoCash...


ACCESSPAL
"Please confirm the transaction."


PHONE
Transaction successful.

This is much stronger for a pitch.

27. DEMO SCENARIOS

Make sure these complete from beginning to end:

Scenario 1

Send a WhatsApp message

Wake
→ WhatsApp
→ Joe
→ message
→ confirmation
→ sent
Scenario 2

Send money using EcoCash

Wake
→ EcoCash
→ recipient
→ amount
→ permission
→ authentication
→ confirmation
→ processing
→ success
Scenario 3

Buy airtime

Wake
→ airtime
→ amount
→ confirmation
→ payment
→ success
Scenario 4

Make a call

Wake
→ Phone
→ contact
→ dialing
→ connected
→ call ended
Scenario 5

Check balance

Wake
→ wallet
→ balance
→ spoken response
Scenario 6

Tell the time

Wake
→ system time
→ spoken response
Scenario 7

Set alarm

Wake
→ Clock
→ select time
→ confirmation
→ alarm set
Scenario 8

Natural conversation

Wake
→ conversation
→ AI response
→ follow-up
→ response
28. LANGUAGE MUST WORK THROUGH THE SAME ENGINE

Keep the selected language architecture from the previous update.

The language selector controls:

UI language
AI response language
demo language
voice output language
assistant prompts
transaction messages

But the underlying action remains the same.

For example:

Shona
"Ndoda kutumira $20 kuna Wisdom."

and:

English
"Send $20 to Wisdom."

must both produce:

{
  type: "send_money",
  recipient: "Wisdom",
  amount: 20
}

Then the same ActionEngine executes the EcoCash flow.

29. LANGUAGE MUST NOT BREAK ACTIONS

This is critical.

Do NOT build:

EnglishActionEngine
ShonaActionEngine
NdebeleActionEngine
SwahiliActionEngine

Build:

Language Layer
        ↓
Common Intent
        ↓
Common Action Engine

Language affects communication.

It should not duplicate business logic.

30. VOICE RESPONSE SHOULD MATCH THE SELECTED LANGUAGE

If:

language = Shona

then:

AI response = Shona
TTS language = Shona-compatible voice if available

If the browser does not provide a suitable voice, do not crash.

Fallback gracefully to:

another compatible voice
text response
visible response

The application must never freeze simply because a particular TTS voice is unavailable.

31. IF A LANGUAGE IS NOT SUPPORTED BY BROWSER TTS

Do not pretend it is.

Detect available voices.

If Shona/Ndebele is unavailable:

Text:
Shona response


Voice:
best available fallback

The interface should still work.

The architecture should make it possible to integrate better African-language TTS later.

32. ERROR RECOVERY

Every voice interaction needs recovery.

If speech recognition fails:

"I didn't catch that. Please try again."

If AI request fails:

"I'm having trouble processing that. Please try again."

If an action fails:

"I couldn't complete that action. Would you like me to try again?"

If microphone permission fails:

"Microphone access is required for voice interaction. You can also type your request."

After every error:

ERROR
 ↓
RECOVERY
 ↓
READY

Never:

ERROR
 ↓
STUCK
33. NETWORK / AI FAILURE MUST NOT BREAK THE PHONE

If the AI endpoint fails, the application must remain responsive.

Do not freeze the entire UI while waiting for an API response.

Show:

Thinking...

with a timeout.

For example:

PROCESSING
 ↓
request
 ↓
timeout
 ↓
ERROR
 ↓
READY

The exact timeout can be chosen appropriately.

34. ABORT CONTROLS

Always provide a way to stop the assistant.

For example:

Stop
Cancel

If the user says:

"Stop."

or:

"Cancel."

the current action should be cancelled where possible.

For example:

EcoCash processing
↓
User: "Cancel"
↓
transaction cancelled
↓
ready
35. CONVERSATION FOLLOW-UP

After AccessPal completes an action, it should not simply become dead.

Example:

"Message sent to Joe."

Then:

"Anything else I can help you with?"

The user can immediately say:

"Yes, check my balance."

The assistant continues.

This is the key feeling of a real assistant.

36. DO NOT FORCE THE USER TO REACTIVATE THE ASSISTANT AFTER EVERY SENTENCE

The goal is a natural conversation.

For example:

USER:
Hey Pal, send money to Wisdom.


ACCESSPAL:
How much would you like to send?


USER:
Twenty dollars.


ACCESSPAL:
You're sending $20 to Wisdom. Continue?


USER:
Yes.


ACCESSPAL:
Processing...


PHONE:
EcoCash transaction


ACCESSPAL:
Done. The transaction was successful.


USER:
What time is it?


ACCESSPAL:
It's 2:35 PM.

This should feel like one continuous conversation.

37. CONVERSATION TIMEOUT

Do not keep the microphone permanently active.

After AccessPal finishes speaking:

WAITING_FOR_FOLLOW_UP

allow a short conversational window.

If the user does not respond:

READY

If continuous wake listening is enabled, return to wake detection.

This avoids battery/microphone issues and reduces accidental recognition.

38. PHONE SIMULATION MUST NEVER FREEZE

The phone simulation itself should have:

currentApp
navigationStack
appState
animationState
actionState

When an action begins:

actionState = executing

When complete:

actionState = completed

If something fails:

actionState = failed

The UI must always have a way back to:

home
39. USE ASYNC ACTIONS PROPERLY

Avoid deeply nested callbacks.

Use a predictable async architecture.

Conceptually:

async function executeSendMoney(action) {
    await openEcoCash();
    await requestPermission();
    await authenticate();
    await reviewTransaction();
    await processTransaction();
    await showSuccess();
}

Each step should explicitly resolve.

Do not proceed until the previous step has completed.

For Demo Mode, the system can automatically resolve simulated user interactions.

40. GUIDED DEMO SHOULD USE THE SAME FUNCTIONS

For example:

Voice:
sendMoney(action)

and:

Demo:
sendMoney(action, { demo: true })

Not:

Voice → real action code
Demo → separate animation code

This is how we prevent Demo Mode and Voice Mode from drifting apart.

41. ADD A DEBUG STATE PANEL DURING DEVELOPMENT

While fixing the prototype, create a temporary development-only debug panel.

Show:

Voice:
LISTENING


Transcript:
"send twenty dollars to Wisdom"


Language:
en


AI:
PROCESSING


Intent:
send_money


Action:
send_money


Phone:
EcoCash


Action State:
AUTHENTICATING


Demo:
false

This will make debugging dramatically easier.

Hide it automatically in production/pitch mode.

42. LOG EVERY TRANSITION DURING DEVELOPMENT

For example:

[VOICE] started
[VOICE] final transcript received
[VOICE] stopped
[AI] request started
[AI] response received
[ACTION] send_money started
[PHONE] opening ecocash
[PHONE] permission
[PHONE] authentication
[PHONE] processing
[PHONE] success
[TTS] started
[TTS] ended
[VOICE] ready

This will allow you to identify exactly where the flow breaks.

Remove excessive console logging from the final pitch build.

43. IMPORTANT: DO NOT HIDE ERRORS

If something fails during development, don't silently swallow it.

Bad:

try {
  ...
} catch {
}

Instead, capture the error and transition into the application's error state.

This is particularly important for:

speech recognition
AI calls
TTS
action execution
demo scenarios
44. RESET AFTER EVERY DEMO

When a demo completes:

SUCCESS
 ↓
show result
 ↓
wait
 ↓
return to home

The next demo must start from a clean predictable state.

Add:

Reset Demo

during development.

45. DEMO MODE MUST NEVER DEPEND ON THE MICROPHONE

This is important for a pitch.

If the microphone fails during the presentation, the presenter should still be able to demonstrate the complete product.

Guided Demo should work independently.

The audience should see:

Voice request
→ AI response
→ phone action
→ success

without requiring actual speech recognition.

Then you can separately demonstrate live voice.

46. CREATE A "LIVE VOICE" AND "GUIDED DEMO" EXPERIENCE
LIVE VOICE

Uses:

microphone
speech recognition
AI
action engine
TTS
GUIDED DEMO

Uses:

predefined realistic conversation
AI/action engine
phone simulation
TTS

Both ultimately use the same:

Conversation Engine
Action Engine
Phone Simulation
47. PITCH SCENARIO

The prototype should be capable of delivering this complete presentation:

Presenter:

Selects ChiShona.

Presenter:

"Hey Pal."

AccessPal visibly wakes.

Presenter:

"Ndoda kutumira $20 kuna Wisdom."

AccessPal displays:

Listening...

then:

Thinking...

then:

"Zvakanaka. Muri kuda kutumira $20 kuna Wisdom. Ndoenderera mberi here?"

Phone:

EcoCash

Then:

Permission

Then:

Authentication

Then:

Processing

Then:

Success

AccessPal:

"Mari yatumirwa zvinobudirira."

Then the presenter says:

"Open WhatsApp."

WhatsApp opens.

Then:

"Send Joe a message saying I'll call him later."

AccessPal understands.

Message appears.

Then:

"What time is it?"

AccessPal responds.

Then the presenter switches to English.

The same phone continues working.

This should feel like one assistant controlling one phone, not separate demos.

48. FINAL ACCEPTANCE CRITERIA

Do not consider this task finished until all of the following work.

Voice
 Wake phrase works
 Listening indicator appears reliably
 Microphone state is accurate
 Final transcript is captured
 Recognition stops after the user's turn
 AI processing begins automatically
 AI response appears
 AI response is spoken
 Speaking disables microphone
 Speaking ending returns system to ready state
 No infinite listening
 No infinite speaking
 No self-hearing
 No duplicate recognition sessions
 Errors recover
 User can continue conversation
Conversation
 Multi-turn conversation works
 Context is maintained
 Follow-up questions work
 Corrections work
 Confirmation works
 Cancellation works
 Unknown names work
 General conversation works
Phone
 WhatsApp opens
 Messages send
 Calls work
 Clock works
 Alarm works
 EcoCash opens
 Permission works
 Authentication works
 Transaction processes
 Transaction succeeds
 Airtime flow completes
 Every action returns to a usable state
Demo Mode
 Guided demo works
 Demo does not depend on microphone
 Demo does not stop at permission
 Demo completes every action
 Demo shows conversation
 Demo shows phone interaction
 Demo shows success
 Demo resets cleanly
 Voice and Demo use the same ActionEngine
Languages
 English
 ChiShona
 IsiNdebele
 Kiswahili
 Interface changes language
 Assistant responses change language
 Demo commands change language
 Phone interaction messages change language
 TTS attempts selected language
 Unsupported TTS gracefully falls back
 Underlying actions remain language-independent
49. MOST IMPORTANT DEVELOPMENT PRINCIPLE

Do not patch individual bugs one by one.

The symptoms:

"Listening doesn't show."

"It freezes."

"Demo stops at permission."

"Voice doesn't trigger the phone."

"It doesn't respond."

are likely symptoms of a larger orchestration problem.

Build a reliable pipeline:

                    ┌──────────────┐
                    │     USER     │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ VOICE INPUT  │
                    └──────┬───────┘
                           ↓
                  ┌──────────────────┐
                  │ CONVERSATION     │
                  │ ENGINE           │
                  └────────┬─────────┘
                           ↓
                    ┌──────────────┐
                    │ ACTION ROUTER│
                    └──────┬───────┘
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
       ┌──────────────┐          ┌──────────────┐
       │ ACTION ENGINE│          │ GENERAL CHAT │
       └──────┬───────┘          └──────────────┘
              ↓
       ┌──────────────┐
       │ PHONE ENGINE │
       └──────┬───────┘
              ↓
       ┌──────────────┐
       │ PHONE UI     │
       └──────┬───────┘
              ↓
       ┌──────────────┐
       │ TTS RESPONSE │
       └──────┬───────┘
              ↓
             READY

And separately:

GUIDED DEMO
     ↓
STRUCTURED ACTION
     ↓
ACTION ENGINE
     ↓
PHONE ENGINE

The Action Engine is the bridge between intelligence and the simulated phone.

That is the piece that needs to become reliable.

50. FINAL INSTRUCTION TO THE CODING AGENT

Do not tell me that the feature is implemented until you have actually tested the complete flow.

First inspect the current code.

Then identify the existing voice, AI, demo and phone-state architecture.

Then refactor the orchestration where necessary.

Do not destroy the current visual design.

Do not remove working features.

Do not replace working components unnecessarily.

Fix the underlying state management.

Make the voice lifecycle deterministic.

Make the action engine deterministic.

Make Demo Mode use the same action engine.

Make every action have a beginning, middle, and end.

Make every asynchronous operation resolve or fail gracefully.

Make every state visible to the user.

Make every conversation return to a ready state.

Most importantly:

I should be able to speak to AccessPal, watch it understand me, watch the phone react, hear AccessPal respond, and immediately continue the conversation.

It should feel like a real voice assistant controlling a smartphone, not a web prototype waiting for the next hardcoded command.

Do not add more features until this core loop is reliable.

One important technical recommendation

When you give this to the coding agent, don't let it immediately start changing files. Tell it to first give you a short audit of the current architecture and specifically identify where the voice state gets lost and where the Demo Mode flow stops at the permission state.

That's important because from the symptoms you've described, I strongly suspect the prototype now has multiple independent state machines fighting each other. Adding another setTimeout, another useEffect, or another isListening boolean will make it worse.

The architecture you want is essentially:

Voice → AI → structured action → Action Engine → Phone Simulation → TTS → Voice

with one central state machine controlling the whole loop.