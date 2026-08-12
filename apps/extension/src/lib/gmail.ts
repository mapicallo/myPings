import { isExtension } from './platform.js';
import type { PingItem, PingSource } from './types.js';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const PLACEHOLDER_MARKERS = ['REPLACE_WITH', 'YOUR_CLIENT_ID', 'your_client_id'];

interface GmailMessageList {
  messages?: { id: string }[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: { name: string; value: string }[] };
}

function oauthClientId(): string | undefined {
  return chrome.runtime.getManifest().oauth2?.client_id;
}

/** True when manifest has a real OAuth client ID (not the repo placeholder). */
export function isGmailOAuthConfigured(): boolean {
  if (!isExtension()) return false;
  const clientId = oauthClientId();
  if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) return false;
  const lower = clientId.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

export function gmailExtensionId(): string {
  if (isExtension() && chrome.runtime?.id) return chrome.runtime.id;
  return 'web-pwa';
}

export function isGmailOAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return lower.includes('oauth') || lower.includes('bad client id') || lower.includes('client id');
}

async function getAuthToken(): Promise<string> {
  if (!isGmailOAuthConfigured()) {
    throw new Error('GMAIL_NOT_CONFIGURED');
  }
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'Gmail auth failed'));
        return;
      }
      resolve(token);
    });
  });
}

function header(msg: GmailMessage, name: string): string {
  const h = msg.payload?.headers?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? '';
}

export async function connectGmail(): Promise<void> {
  await getAuthToken();
}

export async function refreshGmail(source: PingSource): Promise<PingItem[]> {
  const token = await getAuthToken();
  const listRes = await fetch(`${GMAIL_API}/messages?q=is:unread&maxResults=25`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`Gmail list ${listRes.status}`);
  const list = (await listRes.json()) as GmailMessageList;
  const ids = (list.messages ?? []).map((m) => m.id);

  const items: PingItem[] = [];
  for (const id of ids) {
    const msgRes = await fetch(
      `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!msgRes.ok) continue;
    const msg = (await msgRes.json()) as GmailMessage;
    const from = header(msg, 'From');
    const subject = header(msg, 'Subject') || '(no subject)';
    const dateHdr = header(msg, 'Date');
    let publishedAt: string | null = null;
    if (dateHdr) {
      const d = new Date(dateHdr);
      publishedAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
    } else if (msg.internalDate) {
      publishedAt = new Date(+msg.internalDate).toISOString();
    }

    items.push({
      id: `gmail_${msg.id}`,
      sourceId: source.id,
      sourceTitle: source.title,
      category: 'email',
      title: `${from}: ${subject}`,
      url: `https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`,
      publishedAt,
      receivedAt: new Date().toISOString(),
      read: false,
    });
  }
  return items;
}
