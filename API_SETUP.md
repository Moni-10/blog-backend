# Multi-website Blog API

## 1. Environment

Copy `.env.example` to `.env`, then replace every placeholder. Never commit `.env`.

Required production values:

- `MONGODB_URI`: MongoDB Atlas connection string with a rotated password.
- `ADMIN_API_KEY`: long random secret used only by the admin panel.
- `CORS_ORIGINS`: comma-separated admin/frontend origins.
- `PUBLIC_BASE_URL`: public HTTPS URL of this backend, without trailing slash.

The admin panel must send this header for create, update, delete and image upload:

```http
x-admin-key: value-from-ADMIN_API_KEY
```

## 2. Website API

Create a coded website:

```http
POST /api/websites/create
Content-Type: application/json
x-admin-key: YOUR_ADMIN_API_KEY

{
  "name": "MMW Machine",
  "domain": "mohindramachine.tech",
  "description": "MMW Machine website",
  "platform": "coded"
}
```

For WordPress use `"platform": "wordpress"`.

List active websites:

```http
GET /api/websites/all
```

## 3. Blog API

Create and immediately publish a blog:

```http
POST /api/blogs/create
Content-Type: application/json
x-admin-key: YOUR_ADMIN_API_KEY

{
  "websiteId": "WEBSITE_MONGODB_ID",
  "title": "New machine blog",
  "content": "<p>Full HTML content</p>",
  "images": ["https://blog-backend.mohindramachine.tech/uploads/blogs/image.webp"],
  "tags": ["machine", "manufacturing"],
  "metaTitle": "SEO title",
  "metaDescription": "SEO description",
  "metaKeyword": "machine, manufacturing",
  "createdBy": "Admin",
  "status": "published"
}
```

Use `"status": "draft"` to save without showing it publicly. `slug` is optional and is generated from the title.

Upload image as `multipart/form-data` using field name `image`:

```http
POST /api/blogs/upload-image
x-admin-key: YOUR_ADMIN_API_KEY
```

Public blog list for a domain:

```http
GET /api/blogs/public/mohindramachine.tech?page=1&limit=10
```

Public single blog:

```http
GET /api/blogs/public/mohindramachine.tech/new-machine-blog
```

## 4. Coded frontend

```js
const response = await fetch("https://blog-backend.mohindramachine.tech/api/blogs/public/mohindramachine.tech");
const { blogs } = await response.json();
```

The frontend uses `blogs` to render cards. A blog detail page calls the single-blog URL with its slug.

## 5. WordPress frontend

WordPress can read the same public endpoint. Example shortcode for a small custom plugin or `functions.php`:

```php
add_shortcode('central_blogs', function () {
    $response = wp_remote_get('https://blog-backend.mohindramachine.tech/api/blogs/public/mohindramachine.tech');
    if (is_wp_error($response)) return '';
    $data = json_decode(wp_remote_retrieve_body($response), true);
    $html = '<div class="central-blogs">';
    foreach (($data['blogs'] ?? []) as $blog) {
        $title = esc_html($blog['title']);
        $slug = esc_attr($blog['slug']);
        $html .= "<article><a href=\"/blog/{$slug}\">{$title}</a></article>";
    }
    return $html . '</div>';
});
```

Add `[central_blogs]` to a WordPress page. This reads the central API; it does not create native WordPress posts. Native post creation requires a separate authenticated WordPress REST API publisher and an Application Password for each WordPress site.

## 6. VPS checklist

1. Rotate all database passwords previously present in source/chat.
2. Allow only the VPS public IP in MongoDB Atlas Network Access.
3. Put `.env` in the backend folder and run `chmod 600 .env`.
4. Run `npm install` and `npm start` (or PM2).
5. Put Nginx in front of port 5014 and enable HTTPS.
6. Confirm `GET /health` returns `database: "connected"`.
