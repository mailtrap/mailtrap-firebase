import { MailtrapClient } from "mailtrap";
import type { Mail, Address, SendResponse } from "mailtrap";
import type { MailDocument } from "./types.js";

// Keep version in sync with functions/package.json
const USER_AGENT =
  "mailtrap-firebase/1.0.0 (https://github.com/mailtrap/mailtrap-firebase)";

/**
 * Validate that a string is valid base64.
 */
function isValidBase64(str: string): boolean {
  if (str.length === 0) return false;
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch {
    return false;
  }
}

/**
 * Send email using Mailtrap SDK.
 * Creates a new client per invocation (cheap and avoids stale token issues).
 */
export async function sendEmail(
  doc: MailDocument,
  apiToken: string,
  defaultFrom: Address
): Promise<SendResponse> {
  // Create client per invocation - it's cheap
  const client = new MailtrapClient({
    token: apiToken,
    userAgent: USER_AGENT,
  });

  // Merge default sender - document `from` takes precedence
  const from: Address = doc.from ?? defaultFrom;

  // Convert and validate base64 attachments
  const attachments = doc.attachments?.map((att, index) => {
    if (!isValidBase64(att.content)) {
      throw new Error(`Invalid base64 content in attachment[${String(index)}]: ${att.filename}`);
    }
    return {
      ...att,
      content: Buffer.from(att.content, "base64"),
    };
  });

  // Build the Mail payload - spread doc and override from/attachments
  const payload = {
    ...doc,
    from,
    attachments,
  } as Mail;

  return client.send(payload);
}
