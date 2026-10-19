// Diagnosis of npm trusted publishing, run by the release workflow after a failed publish: claims of the GitHub
// OIDC token sent to npm and answer of the npm token exchange, to compare with the trusted publisher of the package
// on npmjs.com. No token is printed.
// Usage: node npm-oidc-check.mjs <package name>
const name = process.argv[2];
const { ACTIONS_ID_TOKEN_REQUEST_URL: requestUrl, ACTIONS_ID_TOKEN_REQUEST_TOKEN: requestToken } = process.env;

if (!requestUrl || !requestToken) {
  console.log('No GitHub OIDC token: the job needs `permissions: id-token: write`');
  process.exit();
}

const { value: token } = await (
  await fetch(`${requestUrl}&audience=npm:registry.npmjs.org`, { headers: { Authorization: `bearer ${requestToken}` } })
).json();
const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

console.log('GitHub token sent to npm:', {
  sub: claims.sub,
  repository: claims.repository,
  repository_owner: claims.repository_owner,
  workflow_ref: claims.workflow_ref,
  environment: claims.environment ?? '(none)',
});

const res = await fetch(`https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/${name.replace('/', '%2f')}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
const body = await res.json().catch(() => ({}));

console.log(
  `npm token exchange: ${res.status}`,
  res.ok ? '(trusted publisher found, publish refused for another reason)' : body
);
