<p align="center">
  <img src="icon.png" alt="Mailtrap" width="100" />
</p>

# Mailtrap Firebase Extension

Send emails via [Mailtrap](https://mailtrap.io) when documents are created in a
Cloud Firestore collection.

## Installation

### Option 1: Firebase Console

[![Install this extension](https://www.gstatic.com/mobilesdk/210513_mobilesdk/install-extension.png)](https://console.firebase.google.com/project/_/extensions/install?ref=mailtrap/mailtrap-email)

### Option 2: Firebase CLI

```bash
firebase ext:install mailtrap/mailtrap-email --project=YOUR_PROJECT_ID
```

## Configuration

| Parameter          | Description                                     |
| ------------------ | ----------------------------------------------- |
| MAILTRAP_API_TOKEN | Your Mailtrap API token                         |
| MAIL_COLLECTION    | Firestore collection to watch (default: `mail`) |
| DEFAULT_FROM_EMAIL | Default sender email address                    |
| DEFAULT_FROM_NAME  | Default sender name (optional)                  |

## Usage

Add a document to your mail collection:

```js
import { addDoc, collection, getFirestore } from "firebase/firestore";

const db = getFirestore();

await addDoc(collection(db, "mail"), {
  to: [{ email: "recipient@example.com" }],
  subject: "Hello!",
  html: "<p>Welcome to our app!</p>",
});
```

### With CC and BCC

```js
await addDoc(collection(db, "mail"), {
  to: [{ email: "recipient@example.com" }],
  cc: [{ email: "cc@example.com" }],
  bcc: [{ email: "bcc@example.com" }],
  subject: "Hello!",
  text: "Welcome to our app!",
});
```

### Using Templates

```js
await addDoc(collection(db, "mail"), {
  to: [{ email: "recipient@example.com" }],
  template_uuid: "your-template-uuid",
  template_variables: {
    user_name: "John",
    action_url: "https://example.com/verify",
  },
});
```

### With Attachments

```js
await addDoc(collection(db, "mail"), {
  to: [{ email: "recipient@example.com" }],
  subject: "Your invoice",
  text: "Please find your invoice attached.",
  attachments: [
    {
      filename: "invoice.pdf",
      content: "base64-encoded-content-here",
      type: "application/pdf",
    },
  ],
});
```

## Delivery Status

The extension automatically updates each document with delivery status:

```js
{
  to: [{ email: 'recipient@example.com' }],
  subject: 'Hello!',
  html: '<p>Welcome!</p>',
  delivery: {
    state: 'SUCCESS',  // PENDING, PROCESSING, SUCCESS, or ERROR
    startTime: Timestamp,
    endTime: Timestamp,
    attempts: 1,
    messageIds: ['abc123-def456']  // On success
    // error: 'Error message'      // On failure
  }
}
```

## Local Development & Testing

See [DEVELOPMENT.md](DEVELOPMENT.md) for a step-by-step guide on installing the extension from a local source into a Firebase project for testing.

## Documentation

- [Mailtrap API Documentation](https://api-docs.mailtrap.io/)
- [Firebase Extensions Documentation](https://firebase.google.com/docs/extensions)

## License

Apache-2.0
