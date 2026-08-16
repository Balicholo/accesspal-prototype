export interface ConversationTopic {
  kind: 'weather' | 'calendar' | 'reminder' | 'general';
  place?: string;
  day?: 'today' | 'tomorrow';
}

class ContextManager {
  private topic: ConversationTopic | null = null;
  private expiresAt = 0;

  remember(topic: ConversationTopic, ttlMs = 45000) {
    this.topic = topic;
    this.expiresAt = Date.now() + ttlMs;
  }

  current(): ConversationTopic | null {
    if (!this.topic || Date.now() > this.expiresAt) {
      this.topic = null;
      return null;
    }
    return this.topic;
  }

  clear() {
    this.topic = null;
    this.expiresAt = 0;
  }
}

export const contextManager = new ContextManager();
