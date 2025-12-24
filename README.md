# TicketBoss — Event Ticketing API

Lightweight event ticketing API demonstrating optimistic concurrency control to prevent over-selling. This README includes setup instructions, API documentation, technical decisions, and examples you can use during interviews or demos.

---

# TicketBoss — Event Ticketing API

Lightweight event ticketing API demonstrating optimistic concurrency control to prevent over-selling. This README includes setup instructions, API documentation, technical decisions, and examples you can use for development or interviews.

---

## Table of contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [API reference](#api-reference)
  - [Create reservation](#create-reservation)
  - [Cancel reservation](#cancel-reservation)
  - [Get event summary](#get-event-summary)
  - [Health check](#health-check)
- [Technical decisions & assumptions](#technical-decisions--assumptions)
- [Testing & demo](#testing--demo)
- [Development notes](#development-notes)
- [Suggested next steps](#suggested-next-steps)
- [License](#license)

---

## Overview

TicketBoss is a Node.js + Express API that manages seat reservations for events. It uses an in-memory data store and optimistic concurrency control (versioning) to prevent over-selling while remaining simple to run and test.

Default event: `node-meetup-2025` (500 seats).

## Prerequisites

- Node.js 14+ (recommended: 16+)
- npm (comes with Node.js)

## Quick start

From the repository root you can run the project using the provided root proxy scripts.

Install dependencies (this delegates to the nested project):

```powershell
npm run install
```

Start the server (from repo root):

```powershell
npm start
```

Or run directly inside the project folder:

```powershell
cd ticketboss
npm install
npm start
```

Change the listening port for the current PowerShell session:

```powershell
$env:PORT = '3001'
npm start
```

After the server starts the API is available at `http://localhost:<PORT>` (default 3000).

## Project structure

```
ticketboss/
├── src/
│   ├── app.js              # Express app, middleware and routes
│   ├── server.js           # Server startup and graceful shutdown
│   ├── database.js         # In-memory data store + concurrency logic
│   ├── routes/
│   │   └── reservations.js # Reservation endpoints
│   └── middleware/
│       └── validation.js   # Request validation
├── tests/                  # Integration tests (Jest + Supertest)
├── package.json            # root proxy (delegates to ./ticketboss)
├── ticketboss/             # actual project folder (contains inner package.json)
└── README.md
```

## API reference

Base URL: `http://localhost:<PORT>` (default PORT=3000)

### Create reservation

- Method: POST
- Path: `/reservations/`
- Body JSON:

```json
{ "partnerId": "string", "seats": number }
```

- Constraints: `seats` must be an integer in `[1, 10]`; `partnerId` is required.
- Success: `201 Created`

Example response (201):

```json
{ "reservationId": "550e8400-e29b-41d4-a716-446655440000", "seats": 3, "status": "confirmed" }
```

- Errors:
  - `400 Bad Request` — validation error
  - `409 Conflict` — not enough seats available

Example (PowerShell):

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/reservations/' -Method POST -Body (@{
  partnerId = 'acme'
  seats = 3
} | ConvertTo-Json) -ContentType 'application/json'
```

### Cancel reservation

- Method: DELETE
- Path: `/reservations/:reservationId`
- Success: `204 No Content`
- Errors: `404 Not Found` if reservation doesn't exist or is already cancelled

Example (PowerShell):

```powershell
# Replace <RESERVATION_ID> with the actual reservationId
Invoke-RestMethod -Uri "http://localhost:3000/reservations/<RESERVATION_ID>" -Method DELETE
```

### Get event summary

- Method: GET
- Path: `/reservations/:eventId`
- Success: `200 OK` with JSON:

```json
{
  "eventId": "node-meetup-2025",
  "name": "Node.js Meet-up",
  "totalSeats": 500,
  "availableSeats": 494,
  "reservationCount": 6,
  "version": 2
}
```

Example (PowerShell):

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/reservations/node-meetup-2025' -Method GET
```

### Health check

- Method: GET
- Path: `/health`
- Success: `200 OK`

Example response:

```json
{ "status": "OK", "timestamp": "2025-01-15T10:30:00.000Z" }
```

## Technical decisions & assumptions

- Storage: in-memory Maps (`events`, `reservations`) for simplicity and fast operations. Suitable for demo and single-instance runs.
- Concurrency: optimistic concurrency control using a `version` field on each event. Updates create a new event object with updated `availableSeats` and incremented `version`, then atomically replace the event in the Map.
- Validation: middleware enforces `partnerId` presence and `seats` as integer between 1 and 10.
- Error handling: consistent JSON errors with appropriate HTTP status codes (400, 404, 409, 500).

Assumptions:

- Single event (`node-meetup-2025`) by default — easy to extend to multiple events.
- No authentication — partners are identified by `partnerId` only (for demo purposes).
- No persistence — data resets on restart. For production, use a persistent DB.

## Testing & demo

Automated tests use Jest + Supertest. From the project folder run:

```powershell
cd ticketboss
npm test
```

From the repository root you can also run:

```powershell
npm test
```

Simple demo commands (PowerShell):

```powershell
# Health
Invoke-RestMethod -Uri 'http://localhost:3000/health' -Method GET

# Create reservation
Invoke-RestMethod -Uri 'http://localhost:3000/reservations/' -Method POST -Body (@{ partnerId='demo'; seats=2 } | ConvertTo-Json) -ContentType 'application/json'

# Get event summary
Invoke-RestMethod -Uri 'http://localhost:3000/reservations/node-meetup-2025' -Method GET
```

Simple concurrency test (bash):

```bash
for i in {1..10}; do
  curl -s -X POST http://localhost:3000/reservations/ -H 'Content-Type: application/json' -d '{"partnerId":"p","seats":10}' &
done
wait
curl http://localhost:3000/reservations/node-meetup-2025
```

## Development notes

- The app seeds the in-memory database on startup via `db.initialize()` (see `src/database.js`).
- To persist data across restarts, replace the in-memory store with a database (Postgres, MongoDB) or add JSON persistence for demos.
- Use the `PORT` environment variable to change the listening port for the process.

## Suggested next steps

1. Add a GitHub Actions workflow to run tests and lint on every PR.
2. Add an OpenAPI/Swagger specification and include examples.
3. Replace the in-memory store with a persistent DB and implement transactional reservations.

## License

MIT
