# Connecting the registration site to Sunga Hospital eKonsulta

The eKonsulta system (Sunga Hospital, YAKAP) **pulls** the client list from your site.
You only need **one read-only API endpoint**. Nothing is ever written to your site.

## 1. The endpoint

```
GET https://<your-site>/api/clients
Authorization: Bearer <API_KEY>        <- a secret key you create and give to Sunga Hospital
Accept: application/json
```

- Return **HTTP 200** with JSON, either `[ {...}, {...} ]` or `{ "clients": [ ... ] }` (`data` or `results` also work).
- Reject requests without the correct key with **401**. Use **HTTPS**, because this is patient data.
- Return all clients registered or empanelled with Sunga Hospital (up to 5,000 per call). The sync matches clients by PIN, or by name + birthdate for clients with no PIN, so sending the same clients again is safe and updates them.
- The call times out after **15 seconds**.

## 2. Fields per client

Names are matched flexibly, so `last_name`, `lastName` and `LastName` all work. A client is **skipped** if it has no last name, first name or birthdate.

| Field (recommended name) | Required | Example / notes |
|---|---|---|
| `id` | recommended | your internal client ID |
| `philhealth_pin` | for members & dependents | `12-345678901-2` (dashes optional) |
| `last_name`, `first_name`, `middle_name`, `suffix` | last + first required | |
| `birth_date` | **yes** | `YYYY-MM-DD` preferred |
| `sex` | yes | `Male` / `Female` (or `M` / `F`) |
| `type` | yes | `Member`, `Dependent` or `Non-Member` (or `MM` / `DD` / `NM`) |
| `civil_status`, `mobile` | recommended | mobile like `09171234567` |
| `province`, `municipality`, `barangay`, `zip` | recommended | |
| `registration_date` | recommended | `YYYY-MM-DD` |
| `empanelled` | **yes** | `yes` / `no` (or true/false). Only empanelled clients can be consulted. |
| `empanelment_date` | recommended | `YYYY-MM-DD` |
| `pcu` | optional | primary care unit / facility name |
| `consent`, `loa` | recommended | data privacy consent and letter of authorization: `yes` / `no` |
| `case_no` | recommended | Konsulta Case No., e.g. `TP110363202025091110550001` |
| `membership_category` | recommended | e.g. `Employed Private`, `Senior Citizen`, `Indigent (NHTS-PR)` |
| **Dependents only:** `member_pin`, `member_last_name`, `member_first_name`, `member_middle_name`, `relationship` | **yes for dependents** | the PhilHealth member (principal) they are covered under; relationship `Spouse` / `Child` / `Parent` |

## 3. Example response

```json
{
  "clients": [
    {
      "id": "R-0001", "philhealth_pin": "12-050007919-1",
      "last_name": "Dela Cruz", "first_name": "Juan", "middle_name": "Santos",
      "birth_date": "1968-03-14", "sex": "Male", "type": "Member",
      "mobile": "09171003571", "province": "Davao del Sur", "municipality": "Digos City", "barangay": "Zone 1",
      "registration_date": "2026-09-03", "empanelled": "yes", "empanelment_date": "2026-09-05",
      "consent": "yes", "loa": "yes",
      "case_no": "TP110363202025091110550001", "membership_category": "Senior Citizen"
    },
    {
      "id": "R-0004", "philhealth_pin": "12-050031676-4",
      "last_name": "Aquino", "first_name": "Liza", "birth_date": "2016-05-30", "sex": "Female",
      "type": "Dependent", "empanelled": "yes",
      "member_pin": "12-050031600-1", "member_last_name": "Aquino", "member_first_name": "Roberto",
      "relationship": "Child", "membership_category": "Employed Private"
    }
  ]
}
```

## 4. What to send back to Sunga Hospital

1. The endpoint URL.
2. The API key. Send it privately, never in a group chat or in code on GitHub.

Sunga Hospital puts both in its server settings (`.env.local`: `REGISTRY_URL`, `REGISTRY_API_KEY`, `REGISTRY_NAME`) and runs `rebuild.bat`. The **Registered Clients** page then shows "Connected" and **Sync clients** pulls the live list.

## 5. Quick test

```
curl -H "Authorization: Bearer <API_KEY>" https://<your-site>/api/clients
```

It should print the JSON list. If it does, the connection will work.
