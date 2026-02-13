# Local Development & Testing

You can install the extension from a local source into a Firebase project without publishing it to the Extensions Hub.

## Prerequisites

- [Firebase CLI](https://firebase.google.com/docs/cli) installed
- A Google account with access to the [Firebase Console](https://console.firebase.google.com/)

## 1. Create and configure a Firebase project

If you don't already have a Firebase project to test with, create one:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Enter a project name (e.g. `my-extension-test`), follow the prompts, and click **Create project**.
3. Once created, upgrade to the **Blaze (pay-as-you-go)** plan — this is required for extensions and Cloud Functions. Click the **Upgrade** button in the bottom-left of the console, then link or create a billing account.

### Enable Firestore

1. In the Firebase Console, go to **Build > Firestore Database** in the left sidebar.
2. Click **Create database**.
3. Choose a database location (e.g. `nam5` for multi-region US, or `eur3` for multi-region EU). **Take note of this value** — you'll need it for `DATABASE_LOCATION` later.
4. Start in **test mode** for development (this allows open read/write access for 30 days).

### Find your project configuration

You'll need the project ID and Firebase config for client SDK usage:

1. In the Firebase Console, click the **gear icon** next to "Project Overview" and select **Project settings**.
2. The **Project ID** is shown near the top — you'll use this in `.firebaserc`.
3. Under **Your apps**, click the web icon (`</>`) to register a web app if you haven't already. Give it a nickname and click **Register app**.
4. Copy the `firebaseConfig` object shown — you'll use this when initializing the client SDK.

## 2. Create a test project directory

```bash
mkdir my-extension-test && cd my-extension-test
```

## 3. Set up Firebase configuration

Create `.firebaserc` to link to your Firebase project:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

Create `firebase.json` with the extension pointing to your local source:

```json
{
  "extensions": {
    "mailtrap-email": "../mailtrap-firebase"
  }
}
```

Adjust the path to point to wherever your local copy of this extension lives.

## 4. Configure extension parameters

Create the `extensions/` directory and a parameter file:

```bash
mkdir extensions
```

Create `extensions/mailtrap-email.env`:

```
MAILTRAP_API_TOKEN=your-mailtrap-api-token
FUNCTION_LOCATION=us-central1
DATABASE_LOCATION=nam5
MAIL_COLLECTION=mail
DEFAULT_FROM_EMAIL=noreply@your-verified-domain.com
DEFAULT_FROM_NAME=Test App
```

- **MAILTRAP_API_TOKEN** — your Mailtrap API token from the [API Tokens page](https://mailtrap.io/api-tokens).
- **FUNCTION_LOCATION** — the [Cloud Functions region](https://firebase.google.com/docs/functions/locations) to deploy to.
- **DATABASE_LOCATION** — the region of your Firestore database. For multi-region US use `nam5`, for multi-region EU use `eur3`. See the [Firestore locations guide](https://firebase.google.com/docs/firestore/locations).
- **MAIL_COLLECTION** — the Firestore collection the extension watches for new documents (default: `mail`).
- **DEFAULT_FROM_EMAIL** — default sender email address. Must be from a [verified sending domain](https://mailtrap.io/sending/domains) in Mailtrap.
- **DEFAULT_FROM_NAME** — default sender display name (optional).

## 5. Deploy the extension

```bash
firebase deploy --only extensions --force
```

This uploads the local extension source, builds it, and deploys it to your Firebase project. The `--force` flag skips interactive confirmation prompts.

## 6. Verify it works

You can trigger the extension by adding a document to your mail collection. There are two ways to do this:

### Option A: Via the Firebase Console (no code needed)

1. In the [Firebase Console](https://console.firebase.google.com/), go to **Build > Firestore Database**.
2. Click **Start collection** (or select an existing `mail` collection if one exists).
3. Set the **Collection ID** to `mail` (or whatever you configured as `MAIL_COLLECTION`).
4. Click **Next** to create the first document. Leave the Document ID on **Auto-ID**.
5. Add the following fields:

| Field     | Type   | Value                       |
| --------- | ------ | --------------------------- |
| `subject` | string | `Test email`                |
| `text`    | string | `Hello from the extension!` |

6. For the `to` field, set the type to **array**, then add one element of type **map** with a single key `email` (string) set to the recipient address.
7. Click **Save**.

After a few seconds, refresh the document in the Console. You should see a `delivery` field appear with nested fields like `state`, `startTime`, etc.

### Option B: Via the client SDK

```js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const app = initializeApp({
  /* your firebaseConfig object from Project Settings */
});
const db = getFirestore(app);

await addDoc(collection(db, "mail"), {
  to: [{ email: "recipient@example.com" }],
  subject: "Test email",
  text: "Sent from a locally installed extension!",
});
```

## 7. Monitoring and debugging

### Checking delivery status in the Console

1. Go to **Build > Firestore Database** in the Firebase Console.
2. Navigate to the `mail` collection and click on a document.
3. Look at the `delivery` field:
   - `state: "SUCCESS"` — email was sent successfully
   - `state: "ERROR"` with an `error` field — something went wrong (check the error message)
   - `state: "PROCESSING"` — the function is still running

### Viewing function logs

1. In the Firebase Console, go to **Build > Extensions** in the left sidebar.
2. Click on the **Mailtrap Email** extension instance.
3. Click the **Logs** tab to see Cloud Function execution logs including any errors.

Alternatively, view logs via the CLI:

```bash
firebase functions:log --only ext-mailtrap-email-processQueue
```

### Viewing the deployed extension

To see the extension configuration, status, and manage it:

1. Go to **Build > Extensions** in the Firebase Console.
2. Here you can see all installed extensions, their status, reconfigure parameters, or uninstall them.

## 8. Redeploying after changes

After making changes to the extension source, simply run `firebase deploy --only extensions --force` again. Firebase will upload and rebuild the updated source.

## 9. Cleanup

To remove the extension via CLI:

```bash
firebase ext:uninstall mailtrap-email --project=your-firebase-project-id
```

Or via the Console: go to **Build > Extensions**, click on the extension instance, and click **Uninstall extension**.

To clean up test data, go to **Build > Firestore Database**, select the `mail` collection, click the three-dot menu, and choose **Delete collection**.
