# UnboundHackathon Backend

This backend is built with Node.js and Express, providing RESTful APIs for the UnboundHackathon project. It manages user authentication, rule management, and audit logging, and connects to a database for persistent storage.

## Key Features

- **User Authentication:** Handles user registration and login with authentication middleware.
- **Rule Management:** Supports creating, updating, and retrieving rules via the `Rule` model and related API endpoints.
- **Audit Logging:** Tracks important actions and changes using the `AuditLog` model.
- **API Routing:** All main API endpoints are organized under the `routes/api.js` file.
- **Database Integration:** Uses configuration in `config/db.js` to connect to the database.

## Folder Structure

- `models/` — Contains Mongoose models for Users, Rules, and Audit Logs.
- `routes/` — Defines API endpoints.
- `middleware/` — Includes authentication middleware.
- `config/` — Database configuration.
- `server.js` — Entry point for starting the backend server.

## Getting Started

1. Install dependencies: `npm install`
2. Configure your database in `config/db.js`.
3. Start the server: `node server.js`

## API Overview

- User registration and login
- CRUD operations for rules
- Audit log retrieval

---

For more details, refer to the code in each respective folder.
