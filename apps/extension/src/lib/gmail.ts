import type { PingItem, PingSource } from './types.js';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

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

async function getAuthToken(): Promise<string> {
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
