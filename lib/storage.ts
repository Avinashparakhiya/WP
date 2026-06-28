import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types ──────────────────────────────────────────────────────────

export type AIProvider = "gemini" | "groq" | "openai";

export interface HistoryItem {
  id: string;
  tool: string;
  value: string;
  createdAt: number;
  isFavorite?: boolean;
}

export interface RecentContact {
  id: string;
  name?: string;
  phone: string;
  countryCode: string;
  createdAt: number;
}

export interface GroupLink {
  id: string;
  name: string;
  url: string;
  category: string;
  isFavorite: boolean;
  createdAt: number;
}

// ── Storage Keys ──────────────────────────────────────────────────

const KEYS = {
  history: "history",
  recentContacts: "recent_contacts",
  groupLinks: "group_links",
  favQuotes: "fav_quotes",
  aiProvider: "ai_provider",
  openaiKey: "openai_api_key",
  geminiKey: "gemini_api_key",
  groqKey: "groq_api_key",
  predefinedMessage: "predefined_message",
} as const;

// ── Helpers ────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ── History ────────────────────────────────────────────────────────

const MAX_HISTORY = 100;

export async function addHistory(tool: string, value: string): Promise<void> {
  const history = (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
  history.unshift({
    id: generateId(),
    tool,
    value,
    createdAt: Date.now(),
  });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  await setItem(KEYS.history, history);
}

export async function getHistory(): Promise<HistoryItem[]> {
  return (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const history = (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
  await setItem(
    KEYS.history,
    history.filter((item) => item.id !== id),
  );
}

export async function deleteHistoryItems(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  const history = (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
  await setItem(
    KEYS.history,
    history.filter((item) => !idSet.has(item.id)),
  );
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.history);
}

export async function toggleFavoriteHistoryItem(id: string): Promise<boolean> {
  const history = (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
  let isFav = false;
  const updated = history.map((item) => {
    if (item.id === id) {
      isFav = !item.isFavorite;
      return { ...item, isFavorite: isFav };
    }
    return item;
  });
  await setItem(KEYS.history, updated);
  return isFav;
}

export async function toggleFavoriteHistoryItemByText(value: string, tool: string): Promise<boolean> {
  const history = (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
  let isFav = false;
  let found = false;
  const updated = history.map((item) => {
    if (item.value.trim() === value.trim() && item.tool === tool) {
      found = true;
      isFav = !item.isFavorite;
      return { ...item, isFavorite: isFav };
    }
    return item;
  });

  if (!found) {
    history.unshift({
      id: generateId(),
      tool,
      value,
      createdAt: Date.now(),
      isFavorite: true,
    });
    isFav = true;
    await setItem(KEYS.history, history);
  } else {
    await setItem(KEYS.history, updated);
  }
  return isFav;
}

export async function isHistoryItemFavorite(value: string, tool: string): Promise<boolean> {
  const history = (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
  const found = history.find(
    (item) => item.value.trim() === value.trim() && item.tool === tool
  );
  return found ? !!found.isFavorite : false;
}

export async function updateHistoryItemValue(id: string, newValue: string): Promise<void> {
  const history = (await getItem<HistoryItem[]>(KEYS.history)) ?? [];
  const updated = history.map((item) => {
    if (item.id === id) {
      return { ...item, value: newValue };
    }
    return item;
  });
  await setItem(KEYS.history, updated);
}

// ── Recent Contacts ────────────────────────────────────────────────

const MAX_RECENT_CONTACTS = 20;

export async function addRecentContact(
  phone: string,
  countryCode: string,
  name?: string,
): Promise<void> {
  const contacts = (await getItem<RecentContact[]>(KEYS.recentContacts)) ?? [];
  // Remove existing with same phone
  const filtered = contacts.filter((c) => c.phone !== phone);
  filtered.unshift({
    id: generateId(),
    phone,
    countryCode,
    name,
    createdAt: Date.now(),
  });
  if (filtered.length > MAX_RECENT_CONTACTS) filtered.length = MAX_RECENT_CONTACTS;
  await setItem(KEYS.recentContacts, filtered);
}

export async function getRecentContacts(): Promise<RecentContact[]> {
  return (await getItem<RecentContact[]>(KEYS.recentContacts)) ?? [];
}

export async function deleteRecentContact(id: string): Promise<void> {
  const contacts = (await getItem<RecentContact[]>(KEYS.recentContacts)) ?? [];
  await setItem(
    KEYS.recentContacts,
    contacts.filter((c) => c.id !== id),
  );
}

// ── Group Links ────────────────────────────────────────────────────

export async function getGroupLinks(): Promise<GroupLink[]> {
  return (await getItem<GroupLink[]>(KEYS.groupLinks)) ?? [];
}

export async function addGroupLink(
  name: string,
  url: string,
  category: string,
): Promise<GroupLink> {
  const links = (await getItem<GroupLink[]>(KEYS.groupLinks)) ?? [];
  const newLink: GroupLink = {
    id: generateId(),
    name,
    url,
    category,
    isFavorite: false,
    createdAt: Date.now(),
  };
  links.unshift(newLink);
  await setItem(KEYS.groupLinks, links);
  return newLink;
}

export async function updateGroupLink(
  id: string,
  updates: Partial<Pick<GroupLink, "name" | "url" | "category" | "isFavorite">>,
): Promise<void> {
  const links = (await getItem<GroupLink[]>(KEYS.groupLinks)) ?? [];
  const index = links.findIndex((l) => l.id === id);
  if (index === -1) return;
  links[index] = { ...links[index], ...updates };
  await setItem(KEYS.groupLinks, links);
}

export async function deleteGroupLink(id: string): Promise<void> {
  const links = (await getItem<GroupLink[]>(KEYS.groupLinks)) ?? [];
  await setItem(
    KEYS.groupLinks,
    links.filter((l) => l.id !== id),
  );
}

// ── Favorite Quotes ────────────────────────────────────────────────

export async function getFavoriteQuotes(): Promise<string[]> {
  return (await getItem<string[]>(KEYS.favQuotes)) ?? [];
}

export async function toggleFavoriteQuote(quote: string): Promise<boolean> {
  const favs = (await getItem<string[]>(KEYS.favQuotes)) ?? [];
  const index = favs.indexOf(quote);
  if (index >= 0) {
    favs.splice(index, 1);
    await setItem(KEYS.favQuotes, favs);
    return false;
  } else {
    favs.unshift(quote);
    await setItem(KEYS.favQuotes, favs);
    return true;
  }
}

// ── AI Provider & Keys ───────────────────────────────────────────

export async function getProvider(): Promise<AIProvider> {
  const val = await AsyncStorage.getItem(KEYS.aiProvider);
  if (val === "gemini" || val === "groq" || val === "openai") return val;
  return "gemini";
}

export async function setProvider(provider: AIProvider): Promise<void> {
  await AsyncStorage.setItem(KEYS.aiProvider, provider);
}

export async function getApiKey(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.openaiKey)) ?? "";
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.openaiKey, key);
}

export async function getGeminiKey(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.geminiKey)) ?? "";
}

export async function setGeminiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.geminiKey, key);
}

export async function getGroqKey(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.groqKey)) ?? "";
}

export async function setGroqKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.groqKey, key);
}

// ── API Key Testing ───────────────────────────────────────────────

export async function testApiKey(provider: AIProvider): Promise<void> {
  if (provider === "gemini") {
    const key = await getGeminiKey();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hi" }] }],
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini test failed (${res.status}): ${err}`);
    }
  } else if (provider === "groq") {
    const key = await getGroqKey();
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq test failed (${res.status}): ${err}`);
    }
  } else if (provider === "openai") {
    const key = await getApiKey();
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI test failed (${res.status}): ${err}`);
    }
  }
}

export async function getPredefinedMessage(): Promise<string> {
  return (await getItem<string>(KEYS.predefinedMessage)) ?? "";
}

export async function savePredefinedMessage(msg: string): Promise<void> {
  await setItem(KEYS.predefinedMessage, msg);
}
