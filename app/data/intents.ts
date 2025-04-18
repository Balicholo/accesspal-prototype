export const intents = [
  {
    command: 'greeting',
    keywords: {
      en: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
      sn: ['mhoro', 'maswera sei', 'makadii', 'masikati', 'kwaziwai', 'manheru', 'mangwanani']
    },
    response: {
      en: "Hello! I'm Access Pal, your bilingual assistant. How can I help you today?",
      sn: "Makadii! Ndini Access Pal, mushandi wenyu anogona kutaura mitauro miviri. Ndingakubatsirei nhasi?"
    }
  },
  {
    command: 'send_money',
    keywords: {
      en: ['send money', 'transfer', 'send', 'ecocash', 'innbucks'],
      sn: ['tumira mari', 'tumira', 'ecocash', 'innbucks']
    },
    response: {
      en: 'Please specify the amount and recipient for the transfer.',
      sn: 'Ndinokumbira muudze mari yamunoda kutumira uye kuti ndiani anogamuchira.'
    }
  },
  {
    command: 'check_balance',
    keywords: {
      en: ['check balance', 'balance', 'account balance', 'how much do i have'],
      sn: ['tarisa mari yasara', 'mari yasara', 'mari yangu', 'ndine mari yakawanda sei']
    },
    response: {
      en: "I'll check your balance for you. Please wait a moment.",
      sn: 'Regai nditarise mari yenyu yasara. Ndapota mirai zvishoma.'
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
      sn: 'Munoda kutenga airtime yemari yakawanda zvakadii?'
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
      sn: 'Munoda kufona ani?'
    }
  },
  {
    command: 'check_time',
    keywords: {
      en: ['what time', 'current time', 'time now', 'tell me the time'],
      sn: ['nguva yazvino', 'nguva', 'ndiudzewo nguva', 'nguva chii']
    },
    response: {
      en: () => `The current time is ${new Date().toLocaleTimeString()}.`,
      sn: () => `Nguva yazvino nde${new Date().toLocaleTimeString()}.`
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