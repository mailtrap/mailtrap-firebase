import type {
  Address,
  Attachment,
  MailtrapHeaders,
  CustomVariables,
  TemplateVariables,
} from "mailtrap";
import type { Timestamp } from "firebase-admin/firestore";

/**
 * Firestore-compatible attachment.
 * Only difference: `content` must be a base64 string (Firestore can't store Buffers).
 */
export type FirestoreAttachment = Omit<Attachment, "content"> & {
  content: string; // base64 encoded (Firestore can't store Buffer)
};

/**
 * Common fields shared by all email types.
 */
interface MailDocumentCommon {
  from?: Address; // Optional - uses DEFAULT_FROM if not provided
  to: Address[];
  cc?: Address[];
  bcc?: Address[];
  attachments?: FirestoreAttachment[];
  headers?: MailtrapHeaders;
  custom_variables?: CustomVariables;
  reply_to?: Address;
}

/**
 * Email with direct content (text/html).
 */
interface MailDocumentContent extends MailDocumentCommon {
  subject: string;
  text?: string;
  html?: string;
  category?: string;
}

/**
 * Email using a Mailtrap template.
 */
interface MailDocumentTemplate extends MailDocumentCommon {
  template_uuid: string;
  template_variables?: TemplateVariables;
}

/**
 * Firestore document schema for email requests.
 * Either content-based email (with subject, text/html) or template-based.
 */
export type MailDocument = MailDocumentContent | MailDocumentTemplate;

/**
 * Delivery status added by the extension after processing.
 */
export interface DeliveryStatus {
  state: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
  startTime: Timestamp;
  endTime?: Timestamp;
  attempts: number;
  messageIds?: string[];
  error?: string;
}

/**
 * Full Firestore document including delivery status.
 */
export type MailDocumentWithStatus = MailDocument & {
  delivery?: DeliveryStatus;
};
