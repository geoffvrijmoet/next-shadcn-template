# Template Suggestions API

This API allows other web applications to submit suggestions for improving this Next.js + shadcn/ui template.

## MongoDB Collection

**Collection Name:** `template_suggestions`
**Database:** `next-shadcn-template`

## Endpoints

### POST /api/suggestions

Submit a new suggestion for the template.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)", 
  "category": "component | library | feature | configuration | other (required)",
  "submitterName": "string (optional)",
  "submitterUrl": "string (optional)",
  "codeExample": "string (optional)",
  "implementationNotes": "string (optional)",
  "priority": "low | medium | high (optional, defaults to medium)",
  "tags": ["string"] // optional array of tags
}
```

**Response:**
```json
{
  "message": "Suggestion submitted successfully",
  "id": "mongodb_object_id"
}
```

**Example:**
```javascript
const response = await fetch('/api/suggestions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: "Add Dark Mode Toggle",
    description: "Implement a dark mode toggle component using next-themes",
    category: "feature",
    submitterName: "John Doe",
    priority: "high",
    tags: ["dark-mode", "theming", "ui"]
  })
});
```

### GET /api/suggestions

Fetch suggestions from the template.

**Query Parameters:**
- `status` (optional): `pending | approved | rejected | implemented` (default: `pending`)
- `category` (optional): `component | library | feature | configuration | other`
- `limit` (optional): number of suggestions to return (default: 20)
- `skip` (optional): number of suggestions to skip for pagination (default: 0)

**Response:**
```json
{
  "suggestions": [
    {
      "_id": "mongodb_object_id",
      "title": "string",
      "description": "string",
      "category": "string",
      "submitterName": "string",
      "submitterUrl": "string",
      "codeExample": "string",
      "implementationNotes": "string",
      "priority": "string",
      "status": "string",
      "tags": ["string"],
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 2
}
```

**Example:**
```javascript
// Get pending feature suggestions
const response = await fetch('/api/suggestions?status=pending&category=feature&limit=10');
const data = await response.json();
```

## Data Model

```typescript
interface TemplateSuggestion {
  _id?: string;
  title: string;
  description: string;
  category: 'component' | 'library' | 'feature' | 'configuration' | 'other';
  submitterName?: string;
  submitterUrl?: string;
  codeExample?: string;
  implementationNotes?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success (GET)
- `201` - Created (POST)
- `400` - Bad Request (missing required fields)
- `500` - Internal Server Error

Error responses include a message:
```json
{
  "error": "Error description"
}
``` 