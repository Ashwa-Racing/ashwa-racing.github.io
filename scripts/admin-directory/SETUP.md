# Team resource dashboard

The dashboard is served at `dash.ashwaracing.org/admin` and its hostname is protected by Cloudflare Access. The directory descriptions are public static data in `assets/data/admin-resources.json`. Private Google Sheet and Drive URLs belong in the Worker secret `ADMIN_RESOURCE_LINKS`, not in this repository.

## Add or update resource links

In Cloudflare, open **Workers & Pages → ashwaracing → Settings → Variables and Secrets**. Add a **Secret** named `ADMIN_RESOURCE_LINKS`. Its value is a JSON object mapping resource IDs from `assets/data/admin-resources.json` to their URLs. For example:

```json
{
  "team-publisher": "https://docs.google.com/spreadsheets/d/REPLACE_WITH_ID/edit",
  "legacy-team-responses": "https://docs.google.com/spreadsheets/d/REPLACE_WITH_ID/edit"
}
```

Save and deploy the Worker after setting or changing the secret. The Worker only returns this value for requests to `dash.ashwaracing.org`; it returns 404 for the same route on the public website host. Google sharing permissions still control who can open each Sheet.

When adding a resource, first add its non-sensitive details and a stable `id` in `assets/data/admin-resources.json`, then add that ID and link to the secret in Cloudflare. Do not commit private resource URLs to the repository.
