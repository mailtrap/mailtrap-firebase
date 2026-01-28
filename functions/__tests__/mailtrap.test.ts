import { sendEmail } from "../src/mailtrap";
import type { MailDocument } from "../src/types";

// Mock the mailtrap package
jest.mock("mailtrap", () => ({
  MailtrapClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-message-id-123"],
    }),
  })),
}));

describe("sendEmail", () => {
  const mockApiToken = "test-api-token";
  const mockDefaultFrom = { email: "default@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends a basic email successfully", async () => {
    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      subject: "Test Subject",
      text: "Test body",
    };

    const result = await sendEmail(doc, mockApiToken, mockDefaultFrom);

    expect(result.success).toBe(true);
    expect(result.message_ids).toEqual(["test-message-id-123"]);
  });

  it("uses document from address when provided", async () => {
    const { MailtrapClient } = jest.requireMock("mailtrap");
    const mockSend = jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-id"],
    });
    MailtrapClient.mockImplementation(() => ({ send: mockSend }));

    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      from: { email: "custom@example.com", name: "Custom Sender" },
      subject: "Test",
      text: "Test",
    };

    await sendEmail(doc, mockApiToken, mockDefaultFrom);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { email: "custom@example.com", name: "Custom Sender" },
      })
    );
  });

  it("uses default from address when not provided in document", async () => {
    const { MailtrapClient } = jest.requireMock("mailtrap");
    const mockSend = jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-id"],
    });
    MailtrapClient.mockImplementation(() => ({ send: mockSend }));

    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      subject: "Test",
      text: "Test",
    };

    await sendEmail(doc, mockApiToken, mockDefaultFrom);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: mockDefaultFrom,
      })
    );
  });

  it("converts base64 attachments to Buffer", async () => {
    const { MailtrapClient } = jest.requireMock("mailtrap");
    const mockSend = jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-id"],
    });
    MailtrapClient.mockImplementation(() => ({ send: mockSend }));

    const base64Content = Buffer.from("Hello World").toString("base64");
    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      subject: "Test",
      text: "Test",
      attachments: [
        {
          filename: "test.txt",
          content: base64Content,
          type: "text/plain",
        },
      ],
    };

    await sendEmail(doc, mockApiToken, mockDefaultFrom);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            filename: "test.txt",
            content: expect.any(Buffer),
            type: "text/plain",
          }),
        ],
      })
    );

    const sentAttachment = mockSend.mock.calls[0][0].attachments[0];
    expect(sentAttachment.content.toString()).toBe("Hello World");
  });

  it("throws error for invalid base64 content", async () => {
    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      subject: "Test",
      text: "Test",
      attachments: [
        {
          filename: "test.txt",
          content: "not-valid-base64!!!",
          type: "text/plain",
        },
      ],
    };

    await expect(sendEmail(doc, mockApiToken, mockDefaultFrom)).rejects.toThrow(
      "Invalid base64 content in attachment[0]: test.txt"
    );
  });

  it("handles email with template", async () => {
    const { MailtrapClient } = jest.requireMock("mailtrap");
    const mockSend = jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-id"],
    });
    MailtrapClient.mockImplementation(() => ({ send: mockSend }));

    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      template_uuid: "template-123",
      template_variables: {
        name: "John",
        action_url: "https://example.com",
      },
    };

    await sendEmail(doc, mockApiToken, mockDefaultFrom);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        template_uuid: "template-123",
        template_variables: {
          name: "John",
          action_url: "https://example.com",
        },
      })
    );
  });

  it("handles email with cc and bcc", async () => {
    const { MailtrapClient } = jest.requireMock("mailtrap");
    const mockSend = jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-id"],
    });
    MailtrapClient.mockImplementation(() => ({ send: mockSend }));

    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      cc: [{ email: "cc@example.com" }],
      bcc: [{ email: "bcc@example.com" }],
      subject: "Test",
      text: "Test",
    };

    await sendEmail(doc, mockApiToken, mockDefaultFrom);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        cc: [{ email: "cc@example.com" }],
        bcc: [{ email: "bcc@example.com" }],
      })
    );
  });

  it("handles email with category", async () => {
    const { MailtrapClient } = jest.requireMock("mailtrap");
    const mockSend = jest.fn().mockResolvedValue({
      success: true,
      message_ids: ["test-id"],
    });
    MailtrapClient.mockImplementation(() => ({ send: mockSend }));

    const doc: MailDocument = {
      to: [{ email: "recipient@example.com" }],
      subject: "Test",
      text: "Test",
      category: "transactional",
    };

    await sendEmail(doc, mockApiToken, mockDefaultFrom);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "transactional",
      })
    );
  });
});
