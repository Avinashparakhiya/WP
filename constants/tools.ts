import { Feather } from "@expo/vector-icons";
import type { CategoryColor } from "./colors";

export interface Tool {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  category: CategoryColor;
  isAI?: boolean;
}

export interface Section {
  id: CategoryColor;
  label: string;
  sectionIcon: keyof typeof Feather.glyphMap;
  tools: Tool[];
}

export const SECTIONS: Section[] = [
  {
    id: "ai",
    label: "AI TOOLS",
    sectionIcon: "zap",
    tools: [
      {
        id: "ai-message",
        title: "AI Message Generator",
        subtitle: "Generate WhatsApp messages with AI",
        icon: "message-circle",
        route: "/ai-message",
        category: "ai",
        isAI: true,
      },
      {
        id: "ai-reply",
        title: "AI Reply Generator",
        subtitle: "Smart replies for any message",
        icon: "corner-up-left",
        route: "/ai-reply",
        category: "ai",
        isAI: true,
      },
      {
        id: "ai-translate",
        title: "AI Translation",
        subtitle: "Translate to any language",
        icon: "globe",
        route: "/ai-translate",
        category: "ai",
        isAI: true,
      },
      {
        id: "ai-assistant",
        title: "AI Business Assistant",
        subtitle: "Sales & marketing messages",
        icon: "briefcase",
        route: "/ai-assistant",
        category: "ai",
        isAI: true,
      },
      {
        id: "smart-templates",
        title: "AI Smart Templates",
        subtitle: "Industry-specific templates",
        icon: "layers",
        route: "/smart-templates",
        category: "ai",
        isAI: true,
      },
    ],
  },
  {
    id: "whatsapp",
    label: "WHATSAPP TOOLS",
    sectionIcon: "smartphone",
    tools: [
      {
        id: "direct-chat",
        title: "Direct Chat",
        subtitle: "Chat without saving contact",
        icon: "send",
        route: "/direct-chat",
        category: "whatsapp",
      },
      {
        id: "link-generator",
        title: "Link Generator",
        subtitle: "Generate wa.me links",
        icon: "link",
        route: "/link-generator",
        category: "whatsapp",
      },
      {
        id: "qr-generator",
        title: "QR Code Generator",
        subtitle: "Create WhatsApp QR codes",
        icon: "grid",
        route: "/qr-generator",
        category: "whatsapp",
      },
      {
        id: "group-manager",
        title: "Group Manager",
        subtitle: "Save and manage group links",
        icon: "users",
        route: "/group-manager",
        category: "whatsapp",
      },
    ],
  },
  {
    id: "text",
    label: "TEXT TOOLS",
    sectionIcon: "type",
    tools: [
      {
        id: "fancy-text",
        title: "Fancy Text",
        subtitle: "50+ Unicode text styles",
        icon: "type",
        route: "/fancy-text",
        category: "text",
      },
      {
        id: "text-repeater",
        title: "Text Repeater",
        subtitle: "Repeat text multiple times",
        icon: "repeat",
        route: "/text-repeater",
        category: "text",
      },
      {
        id: "empty-message",
        title: "Empty Message",
        subtitle: "Invisible character generator",
        icon: "minus-circle",
        route: "/empty-message",
        category: "text",
      },
    ],
  },
  {
    id: "content",
    label: "CONTENT & BUSINESS",
    sectionIcon: "star",
    tools: [
      {
        id: "status-quotes",
        title: "Status Quotes",
        subtitle: "Daily quotes for WhatsApp status",
        icon: "bar-chart-2",
        route: "/status-quotes",
        category: "content",
      },
      {
        id: "business-templates",
        title: "Business Templates",
        subtitle: "Ready-made business messages",
        icon: "file-text",
        route: "/business-templates",
        category: "content",
      },
      {
        id: "voice-message",
        title: "Voice to Message",
        subtitle: "Record and convert to text",
        icon: "mic",
        route: "/voice-message",
        category: "content",
      },
      {
        id: "media-downloader",
        title: "Media Downloader",
        subtitle: "Download status & social videos",
        icon: "download",
        route: "/media-downloader",
        category: "content",
      },
    ],
  },
];

/** Flat list of all tools */
export const ALL_TOOLS: Tool[] = SECTIONS.flatMap((s) => s.tools);
