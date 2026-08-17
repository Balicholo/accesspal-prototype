Since I’ve decided to integrate ChatGPT as the **conversation/understanding layer**, I would rebuild the prototype around that principle rather than trying to keep patching the old keyword system.

The prompt below is designed to give you my coding agent permission to **change the architecture, install/configure what is necessary, restructure files, add environment variables/API setup, and replace the old intent system**, while preserving the strong phone simulation you already built.

You can paste this as one complete instruction.

---

# ACCESSPAL — COMPLETE AI VOICE ASSISTANT ARCHITECTURE REBUILD

## ROLE

You are a senior full-stack AI engineer, voice-interface engineer, and product architect.

You are working on **AccessPal**, an AI-powered voice assistant designed for people who are visually impaired or underserved by mainstream digital assistants.

The current prototype has a strong visual smartphone simulation, but the underlying architecture was originally built around hardcoded keywords, predefined names, scripted responses, and disconnected demo flows.

**We are now changing the architecture fundamentally.**

Do not patch the existing keyword system.

Do not keep extending hardcoded responses.

Do not create another collection of predefined commands.

Instead, rebuild the application around:

> **Conversational AI + structured tool/action calling + deterministic phone simulation.**

The goal is for AccessPal to feel like a real conversational voice assistant.

---

# 1. PRODUCT VISION

AccessPal should work like this:

A person can simply talk naturally to AccessPal.

They do not have to know a specific command format.

They can have a normal conversation.

Sometimes they will ask a question.

Sometimes they will tell a story.

Sometimes they will ask AccessPal to perform a task.

Sometimes a single sentence can contain both conversation and an action.

AccessPal must understand the difference.

### Example

User:

> "Hey Pal, today has been such a long day."

AccessPal:

> "Sounds like you've had a tiring day. What happened?"

No action is performed.

---

User:

> "Work was exhausting. Anyway, send Joe a WhatsApp message saying I'll call him later."

AccessPal should understand that the second part is an actionable request.

It should invoke the appropriate tool:

```text
send_message
```

with:

```text
recipient = Joe
message = I'll call him later.
```

Then the simulated phone should open WhatsApp and send the message.

---

# 2. CORE ARCHITECTURE

Replace the existing keyword-based architecture with:

```text
                    USER
                     │
                     ▼
              ┌─────────────┐
              │ VOICE INPUT │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │ TRANSCRIPT  │
              └──────┬──────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   CHATGPT / OPENAI   │
          │ CONVERSATION ENGINE  │
          └──────────┬───────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
   GENERAL RESPONSE       TOOL / ACTION CALL
          │                     │
          │                     ▼
          │              ACTION ROUTER
          │                     │
          │                     ▼
          │              ACTION ENGINE
          │                     │
          │                     ▼
          │             PHONE SIMULATOR
          │                     │
          └──────────┬──────────┘
                     ▼
              ASSISTANT RESPONSE
                     │
                     ▼
              TEXT-TO-SPEECH
                     │
                     ▼
                  USER
```

This is the new foundation of AccessPal.

---

# 3. IMPORTANT: INSPECT THE EXISTING PROJECT FIRST

Before modifying anything:

### Audit the current project.

Identify:

* framework/version
* package manager
* existing dependencies
* current OpenAI/AI integration, if any
* voice recognition implementation
* text-to-speech implementation
* current conversation state
* current phone simulator
* current demo system
* current language system
* current intent system
* current transaction simulation
* current UI components
* current environment configuration

Do not immediately delete files.

Determine what is worth preserving.

### Preserve especially:

* the existing smartphone simulation
* existing application screens
* visual design that is already working well
* app-opening animations
* existing EcoCash simulation
* WhatsApp simulation
* phone/call simulation
* existing demo visuals
* language UI where useful

But the old:

```text
keyword matching
hardcoded names
hardcoded responses
```

should no longer be the primary intelligence system.

---

# 4. NEW TECHNOLOGY ARCHITECTURE

Use the current stable OpenAI API/SDK approach appropriate for the project's framework.

The exact SDK implementation should be determined from the current project.

Do not invent deprecated API patterns.

The application should have:

### Frontend

Responsible for:

* voice input
* UI
* smartphone simulation
* visual conversation
* action animations
* demo mode
* language selection
* accessibility

### Server/API layer

Responsible for:

* OpenAI API communication
* protecting the API key
* conversation processing
* tool definitions
* tool calls
* action validation

**Never expose the OpenAI API key in client-side code.**

---

# 5. ENVIRONMENT SETUP

Create the appropriate environment configuration.

For example:

```text
.env.local
```

with:

```text
OPENAI_API_KEY=...
```

The API key must only be available server-side.

Do not use:

```text
NEXT_PUBLIC_OPENAI_API_KEY
```

or any equivalent client-exposed variable.

Create/update:

```text
.gitignore
```

so `.env.local` and secrets are never committed.

Create a safe example:

```text
.env.example
```

containing:

```text
OPENAI_API_KEY=
```

Do not hardcode credentials anywhere.

---

# 6. INSTALL REQUIRED DEPENDENCIES

Inspect the existing `package.json`.

Install only the dependencies actually required.

Do not blindly install multiple competing AI SDKs.

Use the appropriate official OpenAI integration for the current application architecture.

For voice recognition:

* reuse a working browser speech API if appropriate
* or implement the appropriate OpenAI audio flow if the project architecture supports it

The system must degrade gracefully when browser speech recognition is unavailable.

---

# 7. CREATE A SERVER-SIDE AI ROUTE

Create a dedicated server endpoint responsible for conversational AI.

For example:

```text
/api/chat
```

or an equivalent architecture appropriate for the project.

The endpoint should receive:

```json
{
  "messages": [...],
  "language": "en"
}
```

and return either:

### Normal assistant response

or:

### Structured tool call

The client should never communicate directly with OpenAI using the secret API key.

---

# 8. CHATGPT IS THE CONVERSATION ENGINE

Remove the assumption that AccessPal needs a hardcoded response for every phrase.

The AI should understand natural language.

For example:

> "This platform is really beautiful."

should receive a natural response.

It should NOT fall back to:

> "I don't understand. Try saying help."

unless the request genuinely cannot be understood.

---

# 9. GENERAL CONVERSATION VS ACTIONS

This is one of the most important requirements.

The AI must determine whether the user's message requires an action.

### GENERAL CONVERSATION

Examples:

> "How are you?"

> "I'm tired today."

> "Tell me something interesting."

> "What do you think about technology?"

> "This phone looks amazing."

These should simply generate conversational responses.

No phone action should occur.

---

### ACTION REQUEST

Examples:

> "Open WhatsApp."

> "Call Tendai."

> "Send Joe a message."

> "Send $20 to Wisdom using EcoCash."

> "Check my balance."

> "Set an alarm for 6 AM."

These should result in structured tool calls.

---

### MIXED CONVERSATION + ACTION

This must work.

Example:

> "I've been trying to reach Joe all morning. Send him a message telling him I'll call later."

The AI should understand the conversational context and invoke:

```text
send_message
```

---

# 10. TOOL / FUNCTION CALLING

Define AccessPal's capabilities as structured tools.

At minimum:

```text
open_app
send_message
make_call
send_money
buy_airtime
check_balance
get_time
set_alarm
close_app
navigate_home
```

The AI must not directly manipulate React state.

The AI only requests an action.

Example:

```json
{
  "name": "open_app",
  "arguments": {
    "app": "whatsapp"
  }
}
```

The AccessPal application then executes the action.

---

# 11. TOOL DEFINITIONS

Create strongly typed schemas for every tool.

Example:

### open_app

```text
app:
  whatsapp
  phone
  messages
  ecocash
  clock
  settings
```

### send_message

```text
recipient: string
message: string
```

### make_call

```text
contact: string
```

### send_money

```text
recipient: string
amount: number
currency: string
provider: string
```

### buy_airtime

```text
amount: number
recipient: string
provider: string
```

### set_alarm

```text
time: string
```

Do not hardcode names.

---

# 12. DYNAMIC NAMES

This fixes the current:

> "Tendai works but Wisdom doesn't."

problem.

Names must be dynamic.

If the user says:

> "Send money to Wisdom."

extract:

```text
recipient = Wisdom
```

If they say:

> "Send money to Tatenda."

extract:

```text
recipient = Tatenda
```

If they say:

> "Send it to my brother."

and the assistant doesn't know who the brother is, ask:

> "Which contact is your brother?"

The prototype should never require a predefined list of names just to demonstrate the capability.

---

# 13. CONVERSATION MEMORY

The assistant must maintain conversation context.

Example:

USER:

> "I want to send money."

ACCESSPAL:

> "Sure. Who would you like to send it to?"

USER:

> "Wisdom."

ACCESSPAL remembers:

```text
intent = send_money
recipient = Wisdom
```

Then:

> "Twenty dollars."

Now:

```text
amount = 20
```

Then:

> "EcoCash."

Now:

```text
provider = EcoCash
```

The assistant should not ask for information it already has.

---

# 14. SUPPORT CORRECTIONS

Users naturally correct themselves.

Example:

> "Send $20 to Tendai."

Then:

> "Actually, make that $30."

Update:

```text
amount = 30
```

Example:

> "Actually send it to Wisdom instead."

Update:

```text
recipient = Wisdom
```

The AI should understand these corrections from conversation context.

---

# 15. CONFIRMATION FOR HIGH-RISK ACTIONS

Do not automatically execute sensitive financial actions.

For:

```text
send_money
buy_airtime
```

require confirmation before execution.

Example:

> "You're about to send $20 to Wisdom using EcoCash. Would you like me to continue?"

User:

> "Yes."

Then execute.

If:

> "No."

cancel.

---

# 16. LOW-RISK ACTIONS

Actions such as:

```text
open_app
get_time
check_balance
```

can execute immediately where appropriate.

For example:

> "Open WhatsApp."

→ WhatsApp opens.

---

# 17. ACTION ENGINE

Create a central Action Engine.

Conceptually:

```text
ActionEngine
├── openApp()
├── sendMessage()
├── makeCall()
├── sendMoney()
├── buyAirtime()
├── checkBalance()
├── getTime()
├── setAlarm()
├── closeApp()
└── navigateHome()
```

The AI never directly controls the phone UI.

It requests an action.

The Action Engine performs it.

---

# 18. PHONE SIMULATOR

The phone simulator should become the visual representation of AccessPal's actions.

Example:

User:

> "Open WhatsApp."

AI:

```text
open_app("whatsapp")
```

Action Engine:

```text
open WhatsApp
```

Phone:

```text
HOME
 ↓
WhatsApp opening animation
 ↓
WhatsApp interface
```

AccessPal:

> "WhatsApp is open."

---

# 19. WHATSAPP FLOW

Support:

> "Send Joe a message saying I'll be late."

Action:

```json
{
  "name": "send_message",
  "arguments": {
    "recipient": "Joe",
    "message": "I'll be late."
  }
}
```

Phone simulation:

```text
Open WhatsApp
↓
Find Joe
↓
Open conversation
↓
Type message
↓
Send
↓
Message appears
```

AccessPal:

> "Done. I sent the message to Joe."

---

# 20. ECOCASH FLOW

Support:

> "Send $20 to Wisdom using EcoCash."

Action:

```text
send_money
```

Phone:

```text
Home
↓
EcoCash opens
↓
Send Money
↓
Recipient: Wisdom
↓
Amount: $20
↓
Review
↓
Confirmation
↓
Authentication
↓
Processing
↓
Success
```

Do not stop at permission.

Every state must transition.

---

# 21. ACTION EXECUTION MUST BE DETERMINISTIC

Do not rely on random timeouts.

Build explicit action sequences.

Conceptually:

```ts
async function sendMoney(action) {
  await openEcoCash();
  await showSendMoney();
  await enterRecipient(action.recipient);
  await enterAmount(action.amount);
  await showReview();
  await requestConfirmation();
  await authenticate();
  await processTransaction();
  await showSuccess();
}
```

Timers may be used to make the simulation feel realistic.

But they must not be the actual source of truth.

---

# 22. ACTION EVENTS

The Action Engine should expose events such as:

```text
ACTION_STARTED
ACTION_PROGRESS
ACTION_WAITING_CONFIRMATION
ACTION_PROCESSING
ACTION_SUCCESS
ACTION_FAILED
ACTION_CANCELLED
```

The phone simulator listens to these states and updates accordingly.

---

# 23. DEMO MODE MUST USE THE SAME ACTION ENGINE

This is extremely important.

Do NOT create:

```text
Voice Action Logic
```

and separately:

```text
Demo Animation Logic
```

Instead:

```text
VOICE
 ↓
AI TOOL CALL
 ↓
ACTION ENGINE
 ↓
PHONE
```

and:

```text
GUIDED DEMO
 ↓
STRUCTURED ACTION
 ↓
ACTION ENGINE
 ↓
PHONE
```

This guarantees that Demo Mode demonstrates the actual product architecture.

---

# 24. GUIDED DEMO

Keep the existing Demo Mode concept but rebuild it around the new architecture.

Create scenarios such as:

### WhatsApp

```text
"Hey Pal, send Joe a WhatsApp message saying I'll call him later."
```

### EcoCash

```text
"Hey Pal, send $20 to Wisdom using EcoCash."
```

### Airtime

```text
"Hey Pal, buy $5 airtime."
```

### Calling

```text
"Hey Pal, call Tendai."
```

### Balance

```text
"Hey Pal, check my balance."
```

### Time

```text
"Hey Pal, what time is it?"
```

### Natural conversation

Show AccessPal having a normal conversation before executing an action.

---

# 25. GUIDED DEMO MUST COMPLETE

A guided demo must never stop at:

```text
Permission
```

or:

```text
Processing
```

or:

```text
Opening app
```

Every scenario must reach:

```text
SUCCESS
```

or:

```text
CANCELLED
```

or:

```text
FAILED
```

There must always be an ending.

---

# 26. VOICE INPUT

Rebuild the voice layer so it behaves predictably.

States:

```text
IDLE
LISTENING
PROCESSING
SPEAKING
EXECUTING
WAITING_FOR_CONFIRMATION
ERROR
```

Never allow multiple speech recognition sessions simultaneously.

---

# 27. WAKE EXPERIENCE

Support:

> "Hey Pal."

> "Hey AccessPal."

> "AccessPal."

And:

> "Hey Pal, open WhatsApp."

The last example should be interpreted as:

```text
WAKE + COMMAND
```

rather than requiring two separate turns.

Because this is a browser prototype, do not falsely claim to have a hardware-level always-on wake word.

Implement the most reliable browser-compatible experience possible.

---

# 28. MICROPHONE SAFETY

When AccessPal speaks:

```text
microphone = OFF
```

This prevents AccessPal from hearing its own response.

After TTS completes:

```text
microphone = READY
```

Never allow:

```text
AccessPal speaks
↓
microphone hears AccessPal
↓
AI interprets its own words
```

---

# 29. NATURAL CONVERSATION

The assistant should not constantly respond with:

> "I don't understand."

It should behave like a conversational assistant.

Example:

USER:

> "This app looks really good."

ACCESSPAL:

> "Thank you! I'm glad you like it."

USER:

> "What can you actually do?"

ACCESSPAL:

> "I can help you use your phone with your voice, including messaging, calls, local financial services and other everyday tasks."

USER:

> "Okay, send Joe a message."

Now it switches from conversation to action.

---

# 30. MULTILINGUAL ARCHITECTURE

The new AI architecture should support:

* English
* ChiShona
* IsiNdebele
* Kiswahili

and be designed so more languages can be added later.

Do NOT create separate command systems per language.

Instead:

```text
LANGUAGE
 ↓
AI UNDERSTANDING
 ↓
COMMON ACTION
```

For example:

English:

> "Send $20 to Wisdom."

Shona:

> "Ndoda kutumira $20 kuna Wisdom."

Swahili:

> "Nataka kutuma dola 20 kwa Wisdom."

All should map to:

```text
send_money
recipient = Wisdom
amount = 20
```

---

# 31. LANGUAGE SWITCHING

The conversation should be able to handle language changes.

Example:

User:

> "Hey Pal, open WhatsApp."

Then:

> "Ndoda kutumira meseji kuna Joe."

AccessPal should understand the language switch.

If automatic language detection is unreliable in the browser speech layer, use the selected language as the recognition hint but allow the AI to determine the language from the transcript.

Do not allow language detection failure to break the conversation.

---

# 32. AI LANGUAGE RESPONSE

The AI should respond in the language the user is currently using.

For example:

User:

> "Ndiri kuda kuziva nguva."

AccessPal:

> "Nguva yava..."

Then if the user switches to English:

> "Open WhatsApp."

AccessPal responds in English.

---

# 33. ACCESSPAL SYSTEM PROMPT

Create a dedicated server-side system/developer instruction for the AccessPal AI.

Its responsibilities should include:

* behave as AccessPal
* maintain conversation context
* distinguish conversation from actions
* use tools when an action is requested
* ask clarification when required information is missing
* never invent transaction results
* never claim an action completed unless the Action Engine reports success
* confirm sensitive financial actions
* understand natural language
* handle corrections
* respond in the user's language
* keep responses concise enough for voice interaction
* never expose internal tool schemas to the user

---

# 34. IMPORTANT: AI MUST NOT CLAIM SUCCESS BEFORE THE PHONE SIMULATION FINISHES

Bad:

User:

> "Send $20 to Wisdom."

AI:

> "Done!"

before the simulation runs.

Correct:

```text
AI
 ↓
send_money tool
 ↓
Action Engine
 ↓
EcoCash simulation
 ↓
SUCCESS
 ↓
AI
 ↓
"Done. The $20 was sent to Wisdom."
```

If the simulation fails:

> "I couldn't complete the transaction."

The assistant must reflect the actual action result.

---

# 35. TOOL RESULT LOOP

Implement the correct AI/tool flow.

Conceptually:

```text
User message
↓
OpenAI
↓
Tool call
↓
Application executes tool
↓
Tool result
↓
OpenAI receives result
↓
Final natural-language response
↓
TTS
```

This is critical.

Do not stop after receiving the tool call.

---

# 36. EXAMPLE TOOL LOOP

User:

> "Send $20 to Wisdom."

AI:

```text
send_money({
  recipient: "Wisdom",
  amount: 20,
  provider: "EcoCash"
})
```

Application:

```text
Executing...
```

Application result:

```json
{
  "success": true,
  "transactionId": "DEMO-12345",
  "message": "Transaction completed successfully"
}
```

AI then says:

> "Done. I successfully sent $20 to Wisdom using EcoCash."

---

# 37. DEMO TRANSACTIONS MUST BE CLEARLY SIMULATED

The prototype is not connected to real financial services.

Never imply that real money has been transferred.

Use clearly simulated data.

For example:

```text
DEMO TRANSACTION
```

or:

```text
Simulation
```

This should be visually clear enough for a pitch environment.

---

# 38. CONVERSATION UI

Keep the existing strong phone interface.

But conversation should feel alive.

Show:

```text
USER
I've had such a long day.

ACCESSPAL
I'm sorry to hear that. What happened?

USER
Actually, send Joe a message...
```

When the AI is thinking:

```text
AccessPal is thinking...
```

When performing an action:

```text
AccessPal is opening WhatsApp...
```

When speaking:

```text
AccessPal is speaking...
```

---

# 39. VOICE TRANSCRIPT

During voice interaction, show the recognized text clearly.

For example:

```text
Listening...

"Send twenty dollars to Wisdom."
```

Then:

```text
Thinking...
```

This gives the presenter confidence that the system heard them.

---

# 40. DO NOT LET THE INTERFACE FREEZE

Every async operation needs:

```text
loading
success
failure
timeout
cancel
```

The user must always be able to recover.

Never leave:

```text
Thinking...
```

indefinitely.

Never leave:

```text
Listening...
```

indefinitely.

Never leave:

```text
Processing...
```

indefinitely.

---

# 41. FALLBACK TO TEXT

Because this is a browser prototype, provide a small text input fallback.

If the microphone isn't available:

```text
Type a message...
```

The exact same conversation engine should process typed input.

This is extremely useful during a pitch.

Voice and text should feed the same pipeline:

```text
VOICE ─────┐
           ├──→ CONVERSATION ENGINE
TEXT ──────┘
```

---

# 42. DEBUG MODE

Create a development-only debug panel showing:

```text
Voice State
Current Language
Transcript
Conversation State
Last AI Response
Tool Called
Tool Arguments
Action State
Current Phone App
Demo State
Error
```

This should make debugging possible without guessing.

Hide it in pitch mode.

---

# 43. TESTING

After implementation, manually test all of these.

### Conversation

> "How are you?"

### General statement

> "This platform is beautiful."

### Action

> "Open WhatsApp."

### Dynamic contact

> "Send a message to Wisdom."

### Different contact

> "Send a message to Tatenda."

### Mixed conversation/action

> "I've been meaning to reach Joe. Send him a message saying I'll call later."

### Multi-turn

> "I want to send money."

> "Wisdom."

> "$20."

> "EcoCash."

> "Yes."

### Correction

> "Actually make that $30."

### Cancellation

> "Cancel."

### Unknown information

> "Send money to my brother."

### Language

English → Shona → English.

### Demo

Run every guided scenario from beginning to end.

---

# 44. DO NOT BREAK THE EXISTING PHONE DESIGN

The existing phone simulation is one of the strongest parts of the prototype.

Do not replace it with a generic chat application.

The audience should see:

```text
        ┌──────────────────────┐
        │      PHONE           │
        │                      │
        │  WhatsApp            │
        │  EcoCash             │
        │  Phone               │
        │  Messages            │
        │  Clock               │
        │  Settings            │
        │                      │
        └──────────────────────┘
```

The phone is the **visual proof of what AccessPal can do**.

---

# 45. THE KEY PRODUCT DIFFERENTIATOR

The AI architecture should make the pitch obvious.

The prototype should communicate:

### Existing assistants:

```text
VOICE
 ↓
ASSISTANT
 ↓
STANDARD SERVICES
```

### AccessPal:

```text
VOICE
 ↓
AI
 ↓
AFRICAN LANGUAGES
 ↓
LOCAL SERVICES
 ↓
AFRICAN FINANCIAL SYSTEMS
 ↓
PHONE
```

AccessPal isn't simply another voice assistant.

Its value is:

> **AI that understands people who are often excluded by mainstream digital interfaces.**

---

# 46. FINAL USER EXPERIENCE

The final experience should feel like this:

### User

> "Hey Pal."

### AccessPal

> "I'm listening."

### User

> "I've been trying to reach Joe all morning."

### AccessPal

> "Would you like me to help you contact him?"

### User

> "Yes, send him a WhatsApp message telling him I'll call tonight."

### AccessPal

> "Sure. I'll send Joe a WhatsApp message saying you'll call tonight."

### Phone

WhatsApp opens.

Message is composed.

Message is sent.

### AccessPal

> "Done. The message has been sent to Joe."

### User

> "Thanks. Also, what time is it?"

### AccessPal

> "It's 2:35 PM."

### User

> "Ndoda kutumira $20 kuna Wisdom."

AccessPal understands the language switch.

### AccessPal

> "Zvakanaka. Muri kuda kutumira $20 kuna Wisdom neEcoCash. Ndoenderera mberi here?"

### User

> "Ehe."

EcoCash opens.

Permission.

Authentication.

Processing.

Success.

### AccessPal

> "Mari yatumirwa zvinobudirira."

**That is the experience we are building.**

---

# 47. FINAL DEVELOPMENT RULES

### DO

* Inspect the existing project first.
* Preserve the working smartphone simulation.
* Reuse existing visual components where appropriate.
* Create a proper server-side AI integration.
* Protect API credentials.
* Use structured tool/function calling.
* Create a central Action Engine.
* Create a central conversation state.
* Support natural conversation.
* Support multi-turn conversations.
* Support dynamic names.
* Support corrections.
* Support confirmations.
* Support cancellations.
* Support multilingual conversations.
* Make Demo Mode use the same Action Engine.
* Make all actions complete deterministically.
* Add robust error handling.
* Add a text fallback.
* Test the entire flow.

### DO NOT

* Do not use keyword matching as the primary intelligence.
* Do not hardcode names.
* Do not hardcode conversational responses.
* Do not create separate logic for every language.
* Do not expose the API key.
* Do not allow the AI to directly manipulate React state.
* Do not create fake successful transactions without the Action Engine reporting success.
* Do not use independent Demo Mode logic.
* Do not rely on chains of arbitrary `setTimeout()` calls.
* Do not allow multiple microphone sessions.
* Do not allow AccessPal to hear its own TTS.
* Do not leave the application in an undefined state.
* Do not remove the existing phone simulation because it is working well.

---

# 48. IMPLEMENTATION ORDER

**Do this in stages. Do not attempt everything simultaneously.**

### PHASE 1 — AUDIT

Inspect the existing project and report:

1. Current architecture
2. Existing dependencies
3. Current voice implementation
4. Current phone simulation
5. Current Demo Mode
6. Current language system
7. What can be reused
8. What must be replaced

Do not modify code yet.

### PHASE 2 — AI FOUNDATION

Set up:

* OpenAI server integration
* environment variables
* `/api/chat`
* conversation history
* system instructions
* structured tools

Test general conversation first.

### PHASE 3 — ACTION ENGINE

Implement:

* open app
* WhatsApp
* messaging
* calls
* time
* balance
* alarms
* EcoCash
* airtime

Test each action independently.

### PHASE 4 — AI + ACTIONS

Connect tool calls to the Action Engine.

Test:

```text
conversation → action → result → AI response
```

### PHASE 5 — VOICE

Connect:

```text
voice → transcript → AI → action → response → TTS
```

### PHASE 6 — MULTILINGUAL

Add:

* English
* Shona
* Ndebele
* Swahili

without duplicating action logic.

### PHASE 7 — DEMO MODE

Rebuild guided demos using the same Action Engine.

### PHASE 8 — RELIABILITY

Test:

* microphone errors
* AI errors
* network errors
* TTS errors
* action failures
* cancellation
* timeouts
* repeated conversations

### PHASE 9 — PITCH POLISH

Only after everything works:

* animations
* transitions
* accessibility
* loading states
* voice indicators
* visual polish
* demo controls
* debug mode removal

---

# 49. SUCCESS CRITERIA

The rebuild is successful when I can open the prototype and do this:

**Without typing a predefined command.**

I can say:

> "Hey Pal."

Then:

> "How are you?"

Have a natural conversation.

Then suddenly say:

> "Actually, open WhatsApp and send Joe a message telling him I'll be there in ten minutes."

AccessPal understands.

WhatsApp opens.

The message is sent.

AccessPal confirms.

Then I can continue:

> "Thanks. What time is it?"

AccessPal answers.

Then:

> "Ndiri kuda kutumira $20 kuna Wisdom."

AccessPal understands that I switched to Shona.

It asks for confirmation.

EcoCash opens.

The entire simulated transaction completes.

Then AccessPal returns to the conversation.

**No hardcoded name requirement.**

**No exact command requirement.**

**No freezing.**

**No dead-end states.**

**No separate Demo Mode logic.**

**No need to manually switch between "conversation mode" and "command mode."**

The AI itself determines when the user is simply talking and when they want AccessPal to perform an action.

---

## THE CORE PRINCIPLE

Build AccessPal around this idea:

> **"You don't need to learn how to talk to AccessPal. AccessPal learns how to understand you."**

The AI handles **understanding**.

The Action Engine handles **execution**.

The phone simulator handles **visualization**.

Voice handles **accessibility**.

African languages and African services demonstrate **inclusion**.

The four layers must work together as one coherent product.

**Do not consider the implementation complete until the entire conversational → tool → phone → response loop has been tested end-to-end.**
