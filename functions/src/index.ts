import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { sendEmail } from "./mailtrap.js";
import type { MailDocumentWithStatus } from "./types.js";
import type { Address } from "mailtrap";

admin.initializeApp();

// Extension parameters
const mailtrapApiToken = defineSecret("MAILTRAP_API_TOKEN");
const mailCollection = defineString("MAIL_COLLECTION", { default: "mail" });
const defaultFromEmail = defineString("DEFAULT_FROM_EMAIL");
const defaultFromName = defineString("DEFAULT_FROM_NAME", { default: "" });

export const processQueue = onDocumentCreated(
  {
    document: `${mailCollection.value()}/{docId}`,
    secrets: [mailtrapApiToken],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("No document data found");
      return;
    }

    const docRef = snapshot.ref;
    const docId = snapshot.id;
    const data = snapshot.data() as MailDocumentWithStatus;

    // Idempotency check: skip if already processed
    if (data.delivery?.state) {
      logger.info("Document already processed, skipping", { docId, state: data.delivery.state });
      return;
    }

    logger.info("Processing email document", { docId });

    // Mark as PENDING
    await docRef.update({
      "delivery.state": "PENDING",
      "delivery.startTime": FieldValue.serverTimestamp(),
      "delivery.attempts": 1,
    });

    // Mark as PROCESSING before API call
    await docRef.update({
      "delivery.state": "PROCESSING",
    });

    try {
      // Build default from address
      const defaultFrom: Address = defaultFromName.value()
        ? { email: defaultFromEmail.value(), name: defaultFromName.value() }
        : { email: defaultFromEmail.value() };

      // Send email using mailtrap npm package (client created per invocation)
      const result = await sendEmail(data, mailtrapApiToken.value(), defaultFrom);

      // Mark as SUCCESS
      await docRef.update({
        "delivery.state": "SUCCESS",
        "delivery.endTime": FieldValue.serverTimestamp(),
        "delivery.messageIds": result.message_ids,
      });

      logger.info("Email sent successfully", { docId, messageIds: result.message_ids });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      // Mark as ERROR
      await docRef.update({
        "delivery.state": "ERROR",
        "delivery.endTime": FieldValue.serverTimestamp(),
        "delivery.error": errorMessage,
      });

      logger.error("Failed to send email", { docId, error: errorMessage });
    }
  }
);
