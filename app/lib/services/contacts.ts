import { createId, normalizeText } from '../format';
import { MOCK_CONTACTS } from '../../data/contacts';
import type { Contact } from '../types';

/**
 * Simulated contacts directory.
 * Understanding a name and looking it up are separate steps.
 */
export class ContactsService {
  constructor(private contacts: Contact[] = cloneContacts()) {}

  list(): Contact[] {
    return [...this.contacts];
  }

  count(): number {
    return this.contacts.length;
  }

  findById(id: string): Contact | undefined {
    return this.contacts.find((contact) => contact.id === id);
  }

  find(query: string): Contact[] {
    const needle = normalizeText(query);
    if (!needle) return [];

    return this.contacts.filter((contact) => {
      const names = [contact.name, ...contact.aliases].map(normalizeText);
      return names.some(
        (name) =>
          name === needle ||
          name.startsWith(needle) ||
          needle.startsWith(name) ||
          name.includes(needle) ||
          needle.includes(name)
      );
    });
  }

  resolve(query: string): { match?: Contact; options?: Contact[] } {
    const matches = this.find(query);
    if (matches.length === 0) return {};
    if (matches.length === 1) return { match: matches[0] };

    const exact = matches.find(
      (contact) => normalizeText(contact.name) === normalizeText(query)
    );
    if (exact) return { match: exact };

    const isFirstNameOnly = !normalizeText(query).includes(' ');
    const preferred = matches.find((contact) => contact.defaultMatch);
    if (isFirstNameOnly && preferred) return { match: preferred };

    return { options: matches };
  }

  /** Create or reuse a working contact for a name the AI understood. */
  remember(name: string, phone?: string): Contact {
    const resolved = this.resolve(name);
    if (resolved.match) {
      if (phone) {
        resolved.match.phone = phone;
        resolved.match.unsaved = false;
      }
      return resolved.match;
    }

    const contact: Contact = {
      id: `guest-${normalizeText(name).replace(/\s+/g, '-')}-${createId('c').slice(-4)}`,
      name,
      aliases: [name],
      phone: phone ?? '+263 77 000 0000',
      unsaved: !phone,
    };
    this.contacts = [...this.contacts, contact];
    return contact;
  }

  reset() {
    this.contacts = cloneContacts();
  }
}

function cloneContacts(): Contact[] {
  return MOCK_CONTACTS.map((contact) => ({ ...contact, aliases: [...contact.aliases] }));
}

export const contactsService = new ContactsService();
