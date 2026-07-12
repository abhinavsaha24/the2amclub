# Enterprise API Documentation

All API endpoints follow the `/api/v1/` standard.

## 1. Standard Response Format
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

## 2. Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "requestId": "uuid"
  }
}
```

## 3. Endpoints

### `GET /api/v1/health`
Check system health (Database, Storage).
**Returns:** 200 OK | 503 Unavailable

### `POST /api/v1/admin/products`
Create a new product. Supports `multipart/form-data` with `image` (File).
**Returns:** 201 Created

### `PATCH /api/v1/admin/products`
Update a product. Supports `multipart/form-data`.
**Returns:** 200 OK

### `DELETE /api/v1/admin/products`
Delete a product. Expects `?id=<uuid>&imagePath=<path>`.
**Returns:** 200 OK

### `PATCH /api/v1/admin/settings`
Update location settings and QR code.
**Returns:** 200 OK

### `POST /api/v1/admin/cleanup`
Trigger background job to clean orphaned images.
**Returns:** 200 OK
