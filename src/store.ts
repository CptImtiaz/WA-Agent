// Conversation memory, lead log and dedupe.
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL / _TOKEN (or Vercel KV's
// KV_REST_API_URL / _TOKEN) are set; otherwise falls back to in-process memory,
// which is fine for local testing but is lost on every serverless cold start.
import { Redis } from "@upstash/redis";

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface Lead {
  customer: string;
  createdAt: string;
  [field: string]: unknown;
}

export interface Store {
  getHistory(customer: string): Promise<ChatTurn[]>;
  appendHistory(customer: string, turns: ChatTurn[], limit: number): Promise<void>;
  clearHistory(customer: string): Promise<void>;
  /** Returns true the first time an id is seen, false for duplicates. */
  markSeen(messageId: string): Promise<boolean>;
  setPaused(customer: string, hours: number): Promise<void>;
  clearPaused(customer: string): Promise<void>;
  isPaused(customer: string): Promise<boolean>;
  saveLead(lead: Lead): Promise<void>;
}

const DAY = 60 * 60 * 24;
const HISTORY_TTL = 30 * DAY;

class RedisStore implements Store {
  constructor(private redis: Redis) {}

  async getHistory(customer: string) {
    return (await this.redis.get<ChatTurn[]>(`history:${customer}`)) ?? [];
  }
  async appendHistory(customer: string, turns: ChatTurn[], limit: number) {
    const all = [...(await this.getHistory(customer)), ...turns];
    await this.redis.set(`history:${customer}`, trimHistory(all, limit), { ex: HISTORY_TTL });
  }
  async clearHistory(customer: string) {
    await this.redis.del(`history:${customer}`);
  }
  async markSeen(messageId: string) {
    const res = await this.redis.set(`seen:${messageId}`, 1, { nx: true, ex: DAY });
    return res === "OK";
  }
  async setPaused(customer: string, hours: number) {
    await this.redis.set(`paused:${customer}`, 1, { ex: Math.max(60, Math.round(hours * 3600)) });
  }
  async clearPaused(customer: string) {
    await this.redis.del(`paused:${customer}`);
  }
  async isPaused(customer: string) {
    return (await this.redis.exists(`paused:${customer}`)) === 1;
  }
  async saveLead(lead: Lead) {
    await this.redis.lpush("leads", JSON.stringify(lead));
  }
}

class MemoryStore implements Store {
  private history = new Map<string, ChatTurn[]>();
  private seen = new Set<string>();
  private paused = new Map<string, number>();
  readonly leads: Lead[] = [];

  async getHistory(customer: string) {
    return this.history.get(customer) ?? [];
  }
  async appendHistory(customer: string, turns: ChatTurn[], limit: number) {
    const all = [...(await this.getHistory(customer)), ...turns];
    this.history.set(customer, trimHistory(all, limit));
  }
  async clearHistory(customer: string) {
    this.history.delete(customer);
  }
  async markSeen(messageId: string) {
    if (this.seen.has(messageId)) return false;
    this.seen.add(messageId);
    return true;
  }
  async setPaused(customer: string, hours: number) {
    this.paused.set(customer, Date.now() + hours * 3600_000);
  }
  async clearPaused(customer: string) {
    this.paused.delete(customer);
  }
  async isPaused(customer: string) {
    return (this.paused.get(customer) ?? 0) > Date.now();
  }
  async saveLead(lead: Lead) {
    this.leads.push(lead);
  }
}

/** Keep the newest `limit` turns, starting on a user turn. */
export function trimHistory(turns: ChatTurn[], limit: number): ChatTurn[] {
  let kept = turns.slice(-limit);
  while (kept.length && kept[0].role !== "user") kept = kept.slice(1);
  return kept;
}

function createStore(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return new RedisStore(new Redis({ url, token }));
  console.warn("[store] No Redis configured; using in-memory store (not persistent).");
  return new MemoryStore();
}

export const store: Store = createStore();
