# @free-drawing/server

Server of free-drawing: accounts, drawings and preferences of users, live collaboration ([socket.io](https://socket.io/)) and the web app ([apps/web](../web)). Its page gets metas `api-server` and `collaboration-server`: the app shows accounts and drawings of the server, and enables live collaboration.

- TypeScript run with [tsx](https://tsx.is/), [express](https://expressjs.com/) 4.
- Accounts and sessions (cookie) with [Better Auth](https://www.better-auth.com/): email and password.
- Database: SQLite file with the `node:sqlite` module of Node (no native module to build), queries with [Kysely](https://kysely.dev/). Tables are created or updated on start.
- Node 22.13 or later.

## Run

At the root of the repository:

```sh
yarn serve                              # development (NODE_ENV=development): http://localhost:3000, demo reloaded on changes
yarn workspace @free-drawing/server test
yarn workspace @free-drawing/server start   # production, unless NODE_ENV=development
```

The server runs in production unless `NODE_ENV` is `development` (set by `yarn serve`): a server started without it has no public secret, and does not serve the files of the repository. In development, the web app is served by vite (hot reload), which serves the files of the repository to the browser (`/@fs/`), never secrets nor databases (`viteDeny` of `src/app.ts`), and the server listens to `localhost` only.

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port of the server |
| `HOST` | `localhost` in development, every interface in production | Address listened to (e.g. `0.0.0.0`, `127.0.0.1` behind a reverse proxy of the same machine) |
| `NODE_ENV` | production | `development`: web app served by vite (hot reload), development secret allowed, `localhost`; else production: web app served from its build (`yarn build:static`), secret and public URL required |
| `DATABASE_PATH` | `apps/server/data/free-drawing.db` | SQLite database file |
| `BASE_URL` | `http://localhost:<port>` | Public URL of the server (cookies, auth, origin of sockets), required in production (`https`: Secure cookies) |
| `BETTER_AUTH_SECRET` | development secret | Secret signing sessions, 32 characters at least, required in production |
| `TRUSTED_ORIGINS` | | Other origins of apps calling the API (comma separated): CORS with cookies |
| `TRUST_PROXY` | | Proxies in front of the server (Express `trust proxy`: number of proxies, `true`, or addresses and subnets, comma separated): their `X-Forwarded-For` gives the address of clients. Without it, the address of the connection |

Better Auth limits sign in, sign up and account changes per address of client (in production; 3 requests per 10 s for sign in, sign up, changes of email and password and the routes checking the password of a logged in user: `/delete-user`, `/verify-password`, `/change-email`): the address of the connection, or the one given by the proxies of `TRUST_PROXY`, never an `X-Forwarded-For` sent by the client itself (a new limit for each value). Behind a reverse proxy, set `TRUST_PROXY` (e.g. `1` or `loopback`), else every client has the address of the proxy and shares its limits.

## API

Accounts (Better Auth, under `/api/auth`): `POST /sign-up/email` (`{ email, password, name }`), `POST /sign-in/email` (`{ email, password }`), `POST /sign-out`, `GET /get-session`. Requests of browsers send the session cookie. Their bodies are limited to 16 KB (413 beyond).

Account of the logged in user: `POST /update-user` (`{ name }`), `POST /change-email` (`{ newEmail, password }`: used at once since no email is sent, so the password of the account is always needed, `PASSWORD_REQUIRED` without it, `INVALID_PASSWORD` for a wrong one; an email of another account is not taken, without error so emails are not revealed: read `/api/me` again), `POST /change-password` (`{ currentPassword, newPassword, revokeOtherSessions }`), `POST /delete-user` (`{ password }`: the account is removed with its drawings and preferences; the password is always needed, `PASSWORD_REQUIRED` without it, also while the session is fresh).

API of logged in users (401 without session, before the body of the request is read; bodies of 20 MB at most for drawings, 16 KB for preferences, 413 beyond). A request sent with the header `X-Free-Drawing-User` (id of the account an app makes it for) is refused with 401 and the code `OTHER_ACCOUNT` when the session is of another account, signed in since from another tab: nothing is read nor written in it. Sessions last 7 days from their last extension: Better Auth extends them once a day, the API sends their cookie again then:

| Route | Purpose |
| --- | --- |
| `GET /api/me` | User: `{ id, name, email }` |
| `GET /api/preferences` | Preferences of user (`Preferences` of the library: theme, language, grid, snapping, zen) |
| `PUT /api/preferences` | Replace them (unknown keys and invalid values ignored) |
| `GET /api/drawings` | Drawings of user: `{ id, name, createdAt, updatedAt, version }`, last updated first |
| `POST /api/drawings` | New drawing (`{ name, content }`, content is a drawing file, empty one by default) |
| `GET /api/drawings/:id` | Drawing with its `content` (drawing file) |
| `PUT /api/drawings/:id` | Update its `name` and / or `content` (with the `version` it was loaded or saved in: 409 `DRAWING_CHANGED` when it changed since) |
| `DELETE /api/drawings/:id` | Remove it |

Users only reach their own drawings (others: 404). An account keeps 500 drawings and 100 MB of drawings at most (`drawingsLimits` of `src/api.ts`): a new drawing beyond them, or a bigger one beyond the size, is refused with 403 and the code `TOO_MANY_DRAWINGS` or `DRAWINGS_TOO_BIG` (explained by the web app), also for requests sent at once (checked and written in one transaction). Drawing files are checked (`type: 'free-drawing'`, background, shapes) and limited to 20 MB, clients validate shapes when they load them. Each save of a content increases the `version` of the drawing (not a new name): a content sent with the `version` of the drawing it changed is refused with 409 and the code `DRAWING_CHANGED` (with the current `version`) when the drawing was saved since, in another tab or on another device (the web app keeps the changes in a copy); sent without `version`, it is saved over any version.

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

Sockets of browsers are accepted from the origin of `BASE_URL` and `TRUSTED_ORIGINS` only: a page of another origin of the same site (its WebSocket carries the session cookie, without CORS) can't act as the user. Socket events come from `@free-drawing/protocol` ([packages/protocol](../../packages/protocol)). A logged in user (session cookie of the connection) is identified by their account: the id sent by the client is ignored, so nobody can take the place of another user (owner of a room, rights). The server sends `JOINED` (`{ userId }`) to the user joining a room. Anonymous users keep the id of their browser, bound to the secret of their browser (`userKey` of `JOIN`, hash saved with the room) so that a user who saw it (users of the room, `by` of links) can't take it, unless it is the id of an account (also before the account comes in the room) or of its owner. A user whose id is refused gets the id of its connection, given to nobody else: the owner is the socket giving the secret of the room (`ownerKey`), or the account of the owner logged in from another browser, only it gives rights and changes the settings of the room (`ROOM`: `{ newUsersCanEdit }`, users coming for the first time view only when false).

The drawing of a room is kept in memory while it has users. When its last user leaves, and when the server stops (`SIGINT`, `SIGTERM`: users of all rooms leave), it is saved in the database (`roomDrawing` table, as the server has it: shapes, files and background of an encrypted room stay encrypted), given back to the next user joining the room, then removed from the database: users joining merge their copy with it, a page left open in the room (computer asleep) does not replace it with an older copy. Saved drawings are limited to 1 GB in all (`limits.savedSize`: beyond, the ones saved first are dropped) and removed with their room. A server stopped without saving them (crash) loses the drawings of its rooms with users: users send theirs when they join again. The whole drawing sent to a user joining (`CHANGE` with `full`) tells `kept`: true once users sent a final change (previews of shapes being drawn are not a drawing), an empty one was emptied by them, not lost; false without drawing. The presented view (or null) is sent to each user joining. Owner, rights and settings of rooms are saved in the database (`room` table, hashes of the secrets only): kept while a room is empty and after a restart, so nobody takes an empty room over by giving another secret. Rooms unused for 30 days are forgotten.

Messages of clients are checked and limited (`limits` and `rates` of `src/collaboration.ts`): a change is checked as a whole (ids, JSON of drawing shapes only: classes of the protocol, image files: PNG, JPEG, WebP or GIF data URLs of 8 MB at most) before it is applied, only its checked fields are relayed (pointers too). A room keeps 10 000 shapes and 20 MB of drawing at most (image files included, each one sent once and given to joining users; files no shape uses are released when a change would make the drawing too big) (500 MB for all rooms), 50 users connected and 1 000 different users (beyond, the one seen least recently with the right of new users is forgotten: nothing changes for them); a client creates 50 rooms per hour at most (address of the connection, or of `TRUST_PROXY` proxies; network of 64 bits of an IPv6 address) and keeps 30 (beyond, its empty room used least recently is forgotten), the server keeps 10 000 rooms at most (beyond, the empty room of one client used least recently is forgotten: rooms joined from two clients or more are kept; new rooms are refused when there is none; rooms keep an HMAC of the first two clients who joined them, not their address), a connection sends each event at a limited rate (more messages are ignored; a final change beyond it is acknowledged with `{ refused: 'rate' }`, not applied: the client sends it again). A message of an unexpected shape is ignored. Each change is acknowledged once received, applied or refused, at once with its relay (the client sends again the changes lost with a connection; the changes of others it receives before the acknowledgement were applied before its own: it keeps its own over them, as the room). Previews of shapes being drawn (`live`, new to the room) are removed for everyone when their author leaves the room or loses the right to draw before their final change. Image files no shape uses are released only with a change that is applied. A change making a drawing too big, a change of a user without right to draw or a join of a full room is refused with `REJECTED` (`{ event, reason }`; a refused change gives the ids of its shapes, `upsert` and `remove`: the client sends them again later).

Rooms are encrypted end to end by the library: the key is in the `#` of their links, never sent to the server. A room created with the proof of a key (`keyCheck` of `JOIN`: SHA-256 of the key) is encrypted: only the same proof joins it (`REJECTED` with reason `key` otherwise, also for a proof given for a room in clear), the proof is saved with the room. Its shapes (`{ id, data, files }`: ids of the image files each shape uses, none from previous versions: then no file is released), image files (under ids of the room), background, pointers and views are kept and relayed encrypted, never read: the server checks ids, sizes and limits only. `ROOM` tells `encrypted`. Rooms created without proof (`encrypt: false` option, previous versions) are in clear, checked as above.
