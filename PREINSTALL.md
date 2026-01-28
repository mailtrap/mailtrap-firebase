Use this extension to send emails via Mailtrap by writing documents to a
Cloud Firestore collection.

This extension listens to your specified Cloud Firestore collection. When
a document is added, the extension sends an email using the Mailtrap API
based on the document's fields.

Here's an example document:

```js
await admin.firestore().collection('mail').add({
  to: [{ email: 'someone@example.com' }],
  subject: 'Hello from Firebase!',
  html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
});
```

#### Prerequisites

Before installing this extension, you need:

- A [Mailtrap account](https://mailtrap.io/signup)
- A [verified sending domain](https://mailtrap.io/sending/domains) in Mailtrap
- A Mailtrap API token from [API Tokens page](https://mailtrap.io/api-tokens)

#### Billing

This extension uses the following Firebase services which may have associated charges:

- Cloud Firestore
- Cloud Functions (2nd gen)
- Secret Manager

This extension also uses Mailtrap's email sending service, which has its own
[pricing](https://mailtrap.io/pricing/).

#### Note from Firebase

To install this extension, your Firebase project must be on the Blaze (pay-as-you-go) plan.
