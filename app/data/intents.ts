export const intents = [
  {
    command: 'greeting',
    keywords: {
      en: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'wassup', 'up', 'morning', 'afternoon', 'evening'],
      sn: ['mhoro', 'maswera sei','waswera sei','ndeipi', 'wakadii','makadii', 'masikati', 'manheru', 'mangwanani', 'wakadini', 'wadii']
    },
    response: {
      en: "Hello! I'm Access Pal, your bilingual assistant. How can I help you today?. I can assist with sending money, checking balance, buying airtime, making calls, opening apps, and checking the time. These are the features available at the moment. Select your preferred language.",
      sn: "Mhoro! Ini ndiri Access Pal, mubatsiri wako anotaura mitauro miviri. Ndingakubatsira sei nhasi?. Ndinogona kutumira mari, kutarisa balance, kutenga airtime, kufona, kutarisa nguva, kuvhura ma Apu"
    }
  },
  {
    command: 'fare_well',
    keywords: {
      en: ['alright', 'goodbye', 'bye', 'see you later', 'take care', 'have a nice day'],
      sn: ['horaiti', 'ndakuenda', 'ndichakuwona', 'zvakanaka', 'sara']
    },
    response: {
      en: 'have a great day! If you need anything, just say the word.',
      sn: 'Iwe uve nezuva rakanaka! Kana uchida chero chinhu, ingotaura chete ndinokubatsira'
    }
  },
  {
    command: 'thank_you',
    keywords: {
      en: ['thank you', 'excellent', 'well done', 'brilliant', 'great', 'nice', 'amaizing'],
      sn: ['Ndatenda', 'waita basa', 'wazvita', 'mazvita', 'wagona', 'thank you', 'okay']
    },
    response: {
      en: "You're welcome! I'm glad to assist you. Is there anything else I can help you with?",
      sn: "Uchitendei! Ndafara kukubatsira. Pane chimwe chandingaite here kukubatsira nacho?"
    }
  },
  {
    command: 'no_thanks',
    keywords: {
      en: ['no thank', 'not now', 'some other time', 'not really', 'no'],
      sn: ['kwete', 'parizvino', 'rimwe', 'ndokuudza', 'ayehwa', 'hapana']
    },
    response: {
      en: "If you need anything, just say the word.",
      sn: "Kana uchida chero chinhu, ingotaura chete ndinokubatsira"
    }
  },
  {
    command: 'send_money',
    keywords: {
      en: ['send money', 'transfer', 'ecocash', 'innbucks', 'transaction', 'money transfer', 'make a transaction'],
      sn: ['tumira mari', 'tumira', 'ecocash', 'innbucks', 'senda', 'transfeya', 'transfare', 'svitsa', 'kuti utumire mari', 'kuti utumire', 'kuti utumire mari', 'kuti utumire mari kumunhu', 'kuti utumire mari kumunhu uyu']
    },
    response: {
      en: 'Please specify the amount and recipient for the transfer. By saying "the amount is and the recipient is."',
      sn: 'Ndinokumbira muudze mari yamunoda kutumira uye kuti ndiani anogamuchira.'
    },
  },
  {
    command: 'open_app',
    keywords: {
      en: ['open app', 'launch app', 'start app', 'open'],
      sn: ['vhura app', 'tanga app', 'tanga', 'vhura']
    },
    response: {
      en: "Opening the app for you. Please wait a moment.",
      sn: 'Ndiri kuvhura app yacho. Ndapota mirai zvishoma.'
    }
  },
  {
    command: 'authenticate',
    keywords: {
      en: ['recipient', 'send to', 'amount', 'dollars', 'dollar'],
      sn: ['tumira kuna', 'dollars', 'kutumira']
    },
    response: {
      en: "Can you repeat this 'my password is my voice' slowly for voice recognition or use your fingerprint or face ID to authenticate",
      sn: 'Ndapota verenga kuti my password izwi rangu zvishoma kuti tizive kuti ndiwe, kana shandisa chigunwe chako kana kumeso kwaako kuti uzivikanwe.'
    }
  },
  {
    command: 'authentication_confirmation',
    keywords: {
      en: ['voice', 'password', 'fingerprint', 'face id', 'face'],
      sn: ['voice', 'password', 'fingerprint', 'chigunwe', 'chiso', 'izvi', 'inzwi']
    },
    response: {
      en: "Authentication successful. The money is being sent to the recipient",
      sn: 'Kuzivikanwa kwaita. Mari iri kutumirwa kuna anogamuchira.'
    }
  },
  {
    command: 'check_balance',
    keywords: {
      en: ['check balance', 'balance', 'account balance', 'how much do i have'],
      sn: ['tarisa mari yasara', 'mari yasara', 'tarisa balance', 'mari yangu', 'ndine mari yakawanda sei']
    },
    response: {
      en: "I'll check your balance for you. Please wait a moment. The current balance is $50.",
      sn: 'Regai nditarise mari yenyu yasara. Ndapota mirai zvishoma. Masara $50'
    }
  },
  {
    command: 'buy_airtime',
    keywords: {
      en: ['buy airtime', 'airtime', 'recharge', 'top up'],
      sn: ['tenga airtime', 'airtime', 'recharge', 'ndoda kutenga airtime']
    },
    response: {
      en: 'How much airtime would you like to purchase?',
      sn: 'Urikuda bundle re WhatsApp, Voice, kana SMS?'
    }
  },
  {
    command: 'buy_airtime_confirmation',
    keywords: {
      en: ['I would like to purchase','purchase', 'airtime for', 'airtime of', 'I want to buy', 'I want to purchase', 'I need airtime'],
      sn: ['ndinoda airtime', 'ndoda airtime', 'ndinoda kutenga', 'ndoda airtime ye', 'ndiri kutenga airtime']
    },
    response: {
      en: 'Can you specify if its WhatsApp bundle,  Voice bundle or SMS bundle?',
      sn: 'Urikuda bundle re WhatsApp, ma Minutes, kana SMS?'
    }
  },
  {
    command: 'bundles',
    keywords: {
      en: ['WhatsApp','Voice', 'SMS', 'bundle'],
      sn: ['WhatsApp','minutes', 'SMS', 'bundle']
    },
    response: {
      en: 'Your airtime has been purchased successfully.',
      sn: 'Airtime yenyu yatengwa zvakanaka.'
    }
  },
  {
    command: 'make_call',
    keywords: {
      en: ['call', 'phone', 'dial'],
      sn: ['fona', 'ridza', 'dana']
    },
    response: {
      en: 'Who would you like to call?',
      sn: 'Munoda kufona kunani?'
    }
  },
  {
    command: 'call_person',
    keywords: {
      en: ['I need to call', 'I need to phone', 'I need to dial', 'I would like to call', 'I would like to phone', 'I would like to dial'],
      sn: ['Ndoda kufonera', 'ndikuda kufonera', 'ndinoda kufonera', 'fonera']
    },
    response: {
      en: 'Alright Im making the call now?',
      sn: 'Hongu ndiri kufona ikozvino'
    }
  },
  {
    command: 'check_time',
    keywords: {
      en: ['what time', 'current time','check the time', 'time now', 'tell me the time', 'time'],
      sn: ['nguva yazvino', 'nguva', 'ndiudzewo nguva', 'nguva chii']
    },
    response: {
      en: () => `The current time is ${new Date().toLocaleTimeString()}.`,
      sn: () => `Nguva yazvino nde${new Date().toLocaleTimeString()}.`
    }
  },
  {
    command: 'set_alarm',
    keywords: {
      en: ['set alarm', 'wake me up', 'alarm for', 'set an alarm', 'remind me at', 'alarm at'],
      sn: ['alarm', 'ndimutse', 'alarm ya', 'isa alarm', 'ndiyeuchidze', 'kuma', 'seta']
    },
    response: {
      en: (time: string) => `Setting alarm for ${new Date().toLocaleTimeString()}.`,
      sn: (time: string) => `ndaisa alarm ya ${new Date().toLocaleTimeString()}.`
    }
  },
  {
    command: 'help',
    keywords: {
      en: ['help', 'what can you do', 'commands', 'features'],
      sn: ['batsira', 'unogona kuita chii', 'mirairo', 'zvinhu zvaunoita']
    },
    response: {
      en: 'I can help you with: sending money, checking balance, buying airtime, making calls, and checking the time. Just ask in English or Shona!',
      sn: 'Ndinogona kukubatsirai ne: kutumira mari, kutarisa mari yasara, kutenga airtime, kufona, uye kutarisa nguva. Bvunzai muchiShona kana chiRungu!'
    }
  }
];