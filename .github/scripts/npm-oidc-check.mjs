// Diagnosis of npm trusted publishing, run by the release workflow after a failed publish: claims of the GitHub
// OIDC token sent to npm, answer of the npm token exchange and what to change in the trusted publisher of the package
// on npmjs.com (error annotation of the workflow). No token is printed.
// Usage: node npm-oidc-check.mjs <package name> <repository>
const [name, repository] = process.argv.slice(2);
const { ACTIONS_ID_TOKEN_REQUEST_URL: requestUrl, ACTIONS_ID_TOKEN_REQUEST_TOKEN: requestToken } = process.env;

if (!requestUrl || !requestToken) {
  console.log('::error::Not published: no GitHub OIDC token, the job needs `permissions: id-token: write`');
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

console.log(`npm token exchange: ${res.status}`, res.ok ? '(trusted publisher found)' : body);
if (res.ok) {
  // 403 "OIDC permission denied for this action": trusted publishers created after 2026-09-03 allow
  // `npm stage publish` only
  console.log(
    `::error::Not published: the trusted publisher of ${name} does not allow \`npm publish\`, tick it in its "Allowed actions" on npmjs.com (package settings)`
  );
} else {
  console.log(
    `::error::Not published: ${name} needs a trusted publisher on npmjs.com (package settings): GitHub Actions, repository ${repository}, workflow release.yml, no environment`
  );
}
