## See it in action

To test the extension, add a document to the `${param:MAIL_COLLECTION}` collection:

```js
await admin.firestore().collection('${param:MAIL_COLLECTION}').add({
  to: [{ email: 'recipient@example.com' }],
  subject: 'Test email',
  text: 'This is a test email sent via Mailtrap Firebase Extension!',
});
```

## Using the extension

### Basic email

```js
await db.collection('${param:MAIL_COLLECTION}').add({
  to: [{ email: 'user@example.com', name: 'John Doe' }],
  subject: 'Welcome!',
  html: '<h1>Hello!</h1><p>Welcome to our app.</p>',
});
```

### Using templates

```js
await db.collection('${param:MAIL_COLLECTION}').add({
  to: [{ email: 'user@example.com' }],
  template_uuid: 'your-template-uuid',
  template_variables: {
    user_name: 'John',
    action_url: 'https://example.com/verify',
  },
});
```

### With attachments

```js
await db.collection('${param:MAIL_COLLECTION}').add({
  to: [{ email: 'user@example.com' }],
  subject: 'Your invoice',
  text: 'Please find your invoice attached.',
  attachments: [{
    filename: 'invoice.pdf',
    content: 'base64-encoded-content-here',
    type: 'application/pdf',
  }],
});
```

## Security rules

Configure Firestore Security Rules to control who can add email documents:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /${param:MAIL_COLLECTION}/{document} {
      // Only allow authenticated users to create emails
      allow create: if request.auth != null;
      // Only allow the extension to update (for delivery status)
      allow update: if false;
      // Allow users to read their own emails (optional)
      allow read: if request.auth != null;
    }
  }
}
```

## Monitoring

Check the delivery status by reading the `delivery` field on documents:

- `delivery.state`: PENDING, PROCESSING, SUCCESS, or ERROR
- `delivery.error`: Error message if failed
- `delivery.messageIds`: Mailtrap message IDs on success

You can also monitor the extension in the Firebase Console under
Extensions > Mailtrap Email > Logs.
