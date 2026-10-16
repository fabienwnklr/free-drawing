# @free-drawing/server

Server of free-drawing: accounts, drawings and preferences of users, live collaboration ([socket.io](https://socket.io/)) and the web app ([apps/web](../web)). Its page gets metas `api-server` and `collaboration-server`: the app shows accounts and drawings of the server, and enables live collaboration.

- TypeScript run with [tsx](https://tsx.is/), [express](https://expressjs.com/) 4.
- Accounts and sessions (cookie) with [Better Auth](https://www.better-auth.com/): email and password.
- Database: SQLite file with the `node:sqlite` module of Node (no native module to build), queries with [Kysely](https://kysely.dev/). Tables are created or updated on start.
- Node 22.13 or later.

## Run

At the root of the repository:

```sh
yarn serve                              # development: http://localhost:3000, demo reloaded on changes
yarn workspace @free-drawing/server test
yarn workspace @free-drawing/server start   # production (NODE_ENV=production)
```

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port of the server |
| `NODE_ENV` | | `production`: web app served from its build (`yarn build:static`), secret required |
| `DATABASE_PATH` | `apps/server/data/free-drawing.db` | SQLite database file |
| `BASE_URL` | `http://localhost:<port>` | Public URL of the server (cookies, auth) |
| `BETTER_AUTH_SECRET` | development secret | Secret signing sessions, 32 characters at least, required in production |
| `TRUSTED_ORIGINS` | | Other origins of apps calling the API (comma separated): CORS with cookies |

## API

Accounts (Better Auth, under `/api/auth`): `POST /sign-up/email` (`{ email, password, name }`), `POST /sign-in/email` (`{ email, password }`), `POST /sign-out`, `GET /get-session`. Requests of browsers send the session cookie.

Account of the logged in user: `POST /update-user` (`{ name }`), `POST /change-email` (`{ newEmail }`, used at once since no email is sent; an email of another account is not taken, without error so emails are not revealed: read `/api/me` again), `POST /change-password` (`{ currentPassword, newPassword, revokeOtherSessions }`), `POST /delete-user` (`{ password }`: the account is removed with its drawings and preferences).

API of logged in users (401 without session):

| Route | Purpose |
| --- | --- |
| `GET /api/me` | User: `{ id, name, email }` |
| `GET /api/preferences` | Preferences of user (`Preferences` of the library: theme, language, grid, snapping, zen) |
| `PUT /api/preferences` | Replace them (unknown keys and invalid values ignored) |
| `GET /api/drawings` | Drawings of user: `{ id, name, createdAt, updatedAt }`, last updated first |
| `POST /api/drawings` | New drawing (`{ name, content }`, content is a drawing file, empty one by default) |
| `GET /api/drawings/:id` | Drawing with its `content` (drawing file) |
| `PUT /api/drawings/:id` | Update its `name` and / or `content` |
| `DELETE /api/drawings/:id` | Remove it |

Users only reach their own drawings (others: 404). Drawing files are checked (`type: 'free-drawing'`, background, shapes) and limited to 5 MB, clients validate shapes when they load them.

With the `storage` option of the library:

```js
const drawer = new Drawer($el, {
  storage: {
    load: async () => (await (await fetch(`/api/drawings/${id}`)).json()).content,
    save: (content) =>
      fetch(`/api/drawings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }),
  },
});
```

## Live collaboration

Socket events come from `@free-drawing/protocol` ([packages/protocol](../../packages/protocol)). A logged in user (session cookie of the connection) is identified by their account: the id sent by the client is ignored, so nobody can take the place of another user (owner of a room, rights). The server sends `JOINED` (`{ userId }`) to the user joining a room. Anonymous users keep the id of their browser, unless it is the id of an account who came in the room or of its owner: the owner is the socket giving the secret of the room (`ownerKey`), only it gives rights and changes the settings of the room (`ROOM`: `{ newUsersCanEdit }`, users coming for the first time view only when false).

Rooms are kept in memory: the drawing of a room is lost when its last user leaves or the server restarts.
