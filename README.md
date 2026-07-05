# Bangla-Chain ERP

Enterprise Supply Chain & Inventory ERP for Bangladeshi businesses.

**Features:** Delivery Challans · Procurement · Stock Adjustments · Accounting · Reports

## Stack

- Next.js 16 + React 19
- Tailwind CSS v4
- All data stored in **localStorage** — no backend, no database required
- JSON export/import for device-to-device data transfer

## Run Locally

```bash
pnpm install
pnpm dev        # http://localhost:3001
```

Default admin login: `admin` / `admin`

## Backup & Restore

Go to **Settings → Backup** to export all data as a `.json` file.
Import the same file on any other device to restore.
