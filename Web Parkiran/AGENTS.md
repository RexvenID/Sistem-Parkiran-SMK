# AGENTS.md

## Setup

No build tools required. Open `index.html` directly in browser.

## Project Structure

```
/web-parkiran
├── index.html           # Login page
├── dashboard.html      # Admin dashboard
├── slots.html          # Kapasitas & Tarif settings
├── parking-in.html     # Check-in page
├── parking-out.html    # Check-out + POS
├── transactions.html   # Transaction history
├── css/
│   └── style.css       # Global styles
├── js/
│   ├── storage.js      # localStorage wrapper
│   ├── auth.js         # Login/session management
│   └── app.js          # Dashboard utilities & helpers
└── AGENTS.md
```

## Tech Stack

- **Frontend:** Vanilla HTML + CSS + JS
- **Storage:** localStorage (JSON-based)
- **Auth:** Session stored in localStorage

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Petugas | petugas | petugas123 |

## Key Data Structures

### Config (localStorage: `parking_config`)
```js
{
  parking_name: "Sistem Parkiran",
  rates: { motor: 2000, mobil: 5000, truk: 10000 },
  capacity: { motor: 10, mobil: 10, truk: 5 }
}
```

### Transactions (localStorage: `parking_transactions`)
```js
{ id, vehicle_plate, vehicle_type, entry_time, exit_time, duration_hours, fee, payment_method, amount_paid, change, status: "active" | "completed", created_at }
```

## Vehicle Rates

| Type | Rate/Hour |
|------|-----------|
| Motor | Rp 2.000 |
| Mobil | Rp 5.000 |
| Truk | Rp 10.000 |

## Role-Based Access

- **Admin:** Full access (settings, check-in/out, history)
- **Petugas:** Check-in/out only, no settings access

## Notes

- Data persists in browser's localStorage (~5-10MB limit)
- Clearing browser data will reset all data
- Use Export feature in Transactions page to backup data as CSV
- Capacity and rates configured in "Kapasitas & Tarif" page
- No individual slot management - system tracks capacity per vehicle type
