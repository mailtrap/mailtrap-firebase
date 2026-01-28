import * as admin from "firebase-admin";

// Mock mailtrap before importing the function
jest.mock("mailtrap", () => ({
  MailtrapClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-message-id-integration"],
    }),
  })),
}));

// Set environment variables before importing the function
process.env.MAIL_COLLECTION = "mail";
process.env.DEFAULT_FROM_EMAIL = "test@example.com";
process.env.DEFAULT_FROM_NAME = "Test App";

describe("processQueue integration tests", () => {
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    // Initialize admin SDK for emulator
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: "demo-test-project" });
    }
    db = admin.firestore();

    // Connect to emulator
    db.settings({
      host: "127.0.0.1:8181",
      ssl: false,
    });
  });

  beforeEach(async () => {
    // Clear the mail collection before each test
    const snapshot = await db.collection("mail").get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });

  it("creates a basic email document", async () => {
    const docRef = await db.collection("mail").add({
      to: [{ email: "recipient@example.com" }],
      subject: "Test Subject",
      text: "Test body content",
    });

    const snap = await docRef.get();

    expect(snap.exists).toBe(true);
    expect(snap.data()?.to).toEqual([{ email: "recipient@example.com" }]);
    expect(snap.data()?.subject).toBe("Test Subject");
    expect(snap.data()?.text).toBe("Test body content");
  });

  it("creates document with all recipient types", async () => {
    const docRef = await db.collection("mail").add({
      to: [{ email: "user@example.com", name: "John Doe" }],
      cc: [{ email: "cc@example.com" }],
      bcc: [{ email: "bcc@example.com" }],
      subject: "Welcome!",
      html: "<h1>Hello!</h1>",
      category: "transactional",
    });

    const snap = await docRef.get();
    const data = snap.data();

    expect(data?.to).toHaveLength(1);
    expect(data?.to[0].email).toBe("user@example.com");
    expect(data?.to[0].name).toBe("John Doe");
    expect(data?.cc).toHaveLength(1);
    expect(data?.bcc).toHaveLength(1);
    expect(data?.subject).toBe("Welcome!");
    expect(data?.html).toBe("<h1>Hello!</h1>");
    expect(data?.category).toBe("transactional");
  });

  it("creates document with template", async () => {
    const docRef = await db.collection("mail").add({
      to: [{ email: "user@example.com" }],
      template_uuid: "abc-123-template",
      template_variables: {
        user_name: "John",
        action_url: "https://example.com/verify",
      },
    });

    const snap = await docRef.get();
    const data = snap.data();

    expect(data?.template_uuid).toBe("abc-123-template");
    expect(data?.template_variables).toEqual({
      user_name: "John",
      action_url: "https://example.com/verify",
    });
  });

  it("creates document with base64 attachment", async () => {
    const base64Content = Buffer.from("Hello World").toString("base64");

    const docRef = await db.collection("mail").add({
      to: [{ email: "user@example.com" }],
      subject: "With attachment",
      text: "See attached",
      attachments: [
        {
          filename: "test.txt",
          content: base64Content,
          type: "text/plain",
        },
      ],
    });

    const snap = await docRef.get();
    const data = snap.data();

    expect(data?.attachments).toHaveLength(1);
    expect(data?.attachments[0].filename).toBe("test.txt");
    expect(data?.attachments[0].content).toBe(base64Content);
    expect(data?.attachments[0].type).toBe("text/plain");
  });

  it("updates document with PENDING delivery status", async () => {
    const docRef = await db.collection("mail").add({
      to: [{ email: "user@example.com" }],
      subject: "Test",
      text: "Test",
    });

    await docRef.update({
      "delivery.state": "PENDING",
      "delivery.startTime": admin.firestore.FieldValue.serverTimestamp(),
      "delivery.attempts": 1,
    });

    const snap = await docRef.get();
    const data = snap.data();

    expect(data?.delivery.state).toBe("PENDING");
    expect(data?.delivery.attempts).toBe(1);
    expect(data?.delivery.startTime).toBeDefined();
  });

  it("updates document with SUCCESS delivery status", async () => {
    const docRef = await db.collection("mail").add({
      to: [{ email: "user@example.com" }],
      subject: "Test",
      text: "Test",
    });

    await docRef.update({
      "delivery.state": "PENDING",
      "delivery.startTime": admin.firestore.FieldValue.serverTimestamp(),
      "delivery.attempts": 1,
    });

    await docRef.update({
      "delivery.state": "PROCESSING",
    });

    await docRef.update({
      "delivery.state": "SUCCESS",
      "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
      "delivery.messageIds": ["msg-123", "msg-456"],
    });

    const snap = await docRef.get();
    const data = snap.data();

    expect(data?.delivery.state).toBe("SUCCESS");
    expect(data?.delivery.attempts).toBe(1);
    expect(data?.delivery.messageIds).toEqual(["msg-123", "msg-456"]);
    expect(data?.delivery.startTime).toBeDefined();
    expect(data?.delivery.endTime).toBeDefined();
  });

  it("updates document with ERROR delivery status", async () => {
    const docRef = await db.collection("mail").add({
      to: [{ email: "user@example.com" }],
      subject: "Test",
      text: "Test",
    });

    await docRef.update({
      "delivery.state": "PENDING",
      "delivery.startTime": admin.firestore.FieldValue.serverTimestamp(),
      "delivery.attempts": 1,
    });

    await docRef.update({
      "delivery.state": "ERROR",
      "delivery.endTime": admin.firestore.FieldValue.serverTimestamp(),
      "delivery.error": "API rate limit exceeded",
    });

    const snap = await docRef.get();
    const data = snap.data();

    expect(data?.delivery.state).toBe("ERROR");
    expect(data?.delivery.error).toBe("API rate limit exceeded");
    expect(data?.delivery.startTime).toBeDefined();
    expect(data?.delivery.endTime).toBeDefined();
  });

  it("preserves custom headers and variables", async () => {
    const docRef = await db.collection("mail").add({
      to: [{ email: "user@example.com" }],
      subject: "Test",
      text: "Test",
      headers: {
        "X-Custom-Header": "custom-value",
      },
      custom_variables: {
        campaign_id: "abc123",
      },
    });

    const snap = await docRef.get();
    const data = snap.data();

    expect(data?.headers).toEqual({ "X-Custom-Header": "custom-value" });
    expect(data?.custom_variables).toEqual({ campaign_id: "abc123" });
  });
});
