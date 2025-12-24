# IEQI Monitoring Backend

This is a Cloudflare Workers backend for the Indoor Environmental Quality Index (IEQI) monitoring system. It uses Cloudflare D1 (SQLite) for data storage.

## Project Structure

- `src/index.js`: Main worker logic (API endpoints, auth, DB interaction).
- `wrangler.toml`: Cloudflare Workers configuration.
- `schema.sql`: Database schema for the `ieqi_logs` table.

## Setup & Deployment

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Login to Cloudflare:**
    ```bash
    npx wrangler login
    ```

3.  **Create D1 Database:**
    ```bash
    npx wrangler d1 create sieqi-db
    ```
    *Copy the `database_id` from the output and paste it into `wrangler.toml`.*

4.  **Initialize Database Schema:**
    ```bash
    npx wrangler d1 execute sieqi-db --local --file=./schema.sql
    # For production:
    # npx wrangler d1 execute sieqi-db --remote --file=./schema.sql
    ```

5.  **Run Locally:**
    ```bash
    npx wrangler dev
    ```

6.  **Deploy:**
    ```bash
    npx wrangler deploy
    ```

## API Endpoints

**Base URL:** `http://localhost:8787` (local) or your deployed worker URL.

**Authentication:**
All requests must include the header: `x-api-key: sieqi-secret-key-123`

### 1. Post Sensor Data
**POST** `/api/ieqi`

**Body:**
```json
{
  "device_id": "esp32-001",
  "temperature": 25.5,
  "humidity": 60.2,
  "light": 450,
  "ieqi": 85.5
}
```

**Example Curl:**
```bash
curl -X POST http://localhost:8787/api/ieqi \
  -H "Content-Type: application/json" \
  -H "x-api-key: sieqi-secret-key-123" \
  -d '{"device_id": "esp32-001", "temperature": 25.5, "humidity": 60.2, "light": 450, "ieqi": 85.5}'
```

### 2. Get Latest Data
**GET** `/api/ieqi/latest`

**Example Curl:**
```bash
curl http://localhost:8787/api/ieqi/latest \
  -H "x-api-key: sieqi-secret-key-123"
```

### 3. Get History
**GET** `/api/ieqi`

**Example Curl:**
```bash
curl http://localhost:8787/api/ieqi \
  -H "x-api-key: sieqi-secret-key-123"
```
