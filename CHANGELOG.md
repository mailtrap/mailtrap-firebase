# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-22

### Added

- Initial release of Mailtrap Firebase Extension
- Send emails via Mailtrap API when documents are created in Firestore
- Support for basic email fields (to, cc, bcc, subject, text, html)
- Support for Mailtrap email templates (template_uuid, template_variables)
- Support for attachments (base64 encoded)
- Support for custom headers and variables
- Support for category field for Mailtrap analytics
- Delivery status tracking (PENDING, PROCESSING, SUCCESS, ERROR)
- Idempotency check to prevent duplicate sends
- Structured logging with firebase-functions/logger
