import { buildAccessPalSystemPrompt } from './systemPrompt';
import type { LanguageCode } from '../../types';

const DOMAIN_VOCABULARY = `
Domain vocabulary — preserve these words exactly when heard:
AccessPal, Pal, Hey Pal, Hey AccessPal, EcoCash, InnBucks, Mukuru, WhatsApp,
Zimbabwe, Harare, Bulawayo, Mutare, Gweru, ChiShona, Shona, IsiNdebele, Ndebele,
Kiswahili, Swahili, Tendai, Wisdom, Tatenda, Joe, airtime, dhora, madhora,
kutumira, tumira, vhura, fungua, meseji, ujumbe, salio, ibhalansi, mari.
`;

export function buildRealtimeInstructions(language: LanguageCode) {
  return `${buildAccessPalSystemPrompt(language)}

${DOMAIN_VOCABULARY}

You are in a live voice conversation. Speak concisely. Do not narrate tool names.
The user already tapped Enable listening in this browser prototype. "Hey Pal" is a greeting/activation, not a required command format.
If they only say Hey Pal / Pal / AccessPal, briefly say you are listening.
Respond in the language the user is speaking, including code-switching between English, ChiShona, IsiNdebele, and Kiswahili.
Do not translate the user unless they ask. Preserve names and amounts exactly.

This is simulated. Never claim a real bank or EcoCash transfer occurred.
`.trim();
}
