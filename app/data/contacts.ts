import type { Contact } from '../lib/types';

/** Simulated address book. Replace with a real contacts API later. */
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'joe',
    name: 'Joe',
    aliases: ['joe', 'jo'],
    phone: '+263 77 890 1122',
    defaultMatch: true,
  },
  {
    id: 'tendai-moyo',
    name: 'Tendai Moyo',
    aliases: ['tendai'],
    phone: '+263 77 123 4567',
    defaultMatch: true,
  },
  {
    id: 'tendai-chirwa',
    name: 'Tendai Chirwa',
    aliases: [],
    phone: '+263 77 234 5678',
  },
  {
    id: 'tariro-chikore',
    name: 'Tariro Chikore',
    aliases: ['tariro'],
    phone: '+263 77 345 6789',
  },
  {
    id: 'mother',
    name: 'Mother',
    aliases: ['mom', 'mum', 'mummy', 'mama', 'amai', 'my mother', 'my mom'],
    phone: '+263 77 111 2222',
  },
  {
    id: 'brian-ncube',
    name: 'Brian Ncube',
    aliases: ['brian', 'brother', 'my brother'],
    phone: '+263 77 456 7890',
  },
  {
    id: 'john-mukamuri',
    name: 'John Mukamuri',
    aliases: ['john'],
    phone: '+263 77 567 8901',
  },
  {
    id: 'john-ncube',
    name: 'John Ncube',
    aliases: [],
    phone: '+263 77 678 9012',
  },
];
