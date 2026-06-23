import { getProvider, getApiKey, getGeminiKey, getGroqKey, type AIProvider } from "./storage";

// ── Public API ─────────────────────────────────────────────────────

export async function chat(prompt: string): Promise<string> {
  const provider = await getProvider();
  switch (provider) {
    case "gemini":
      return chatGemini(prompt);
    case "groq":
      return chatGroq(prompt);
    case "openai":
      return chatOpenAI(prompt);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ── Gemini ─────────────────────────────────────────────────────────

async function chatGemini(prompt: string): Promise<string> {
  const key = await getGeminiKey();
  if (!key) throw new Error("Gemini API key not set. Go to Settings to add your key.");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.8,
          },
        }),
      },
    );

    if (!res.ok) {
      await handleHttpError(res, "Gemini");
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error: cannot reach Gemini. Check your internet connection.");
    }
    throw err;
  }
}

// ── Groq ──────────────────────────────────────────────────────────

async function chatGroq(prompt: string): Promise<string> {
  const key = await getGroqKey();
  if (!key) throw new Error("Groq API key not set. Go to Settings to add your key.");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      await handleHttpError(res, "Groq");
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Groq returned an empty response.");
    return text;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error: cannot reach Groq. Check your internet connection.");
    }
    throw err;
  }
}

// ── OpenAI ────────────────────────────────────────────────────────

async function chatOpenAI(prompt: string): Promise<string> {
  const key = await getApiKey();
  if (!key) throw new Error("OpenAI API key not set. Go to Settings to add your key.");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      await handleHttpError(res, "OpenAI");
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI returned an empty response.");
    return text;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error: cannot reach OpenAI. Check your internet connection.");
    }
    throw err;
  }
}

// ── Audio Transcription (Whisper) ─────────────────────────────────

export async function transcribeAudio(audioUri: string): Promise<string> {
  const key = await getApiKey();
  if (!key) throw new Error("OpenAI API key required for voice transcription. Go to Settings.");

  const formData = new FormData();
  // @ts-expect-error - React Native FormData accepts URI
  formData.append("file", {
    uri: audioUri,
    type: "audio/m4a",
    name: "recording.m4a",
  });
  formData.append("model", "whisper-1");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
      },
      body: formData,
    });

    if (!res.ok) {
      await handleHttpError(res, "OpenAI");
    }

    const data = await res.json();
    return data.text;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(
        "Network error: cannot reach OpenAI for transcription. Check your internet connection.",
      );
    }
    throw err;
  }
}

// ── Error Handling ─────────────────────────────────────────────────

async function handleHttpError(res: Response, provider: string): Promise<never> {
  let message = "";
  try {
    const body = await res.json();
    message = body?.error?.message ?? body?.message ?? "";
  } catch {
    // Response body not JSON
  }

  switch (res.status) {
    case 401:
      throw new Error(
        provider === "Gemini"
          ? `Invalid Gemini API key. Double-check your key.`
          : `Invalid ${provider} API key. Update it in Settings.`,
      );
    case 403:
      throw new Error(
        provider === "Gemini"
          ? `Gemini API key not authorized. Check Google AI Studio.`
          : `${provider} API key not authorized.`,
      );
    case 429:
      throw new Error(
        provider === "Gemini"
          ? `Gemini quota exceeded. Check Google AI Studio usage.`
          : `${provider} quota exceeded or rate limit reached.`,
      );
    default:
      throw new Error(
        message
          ? `${provider} error (${res.status}): ${message}`
          : `${provider} error ${res.status}`,
      );
  }
}
