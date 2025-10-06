# Image Upload Feature Documentation

## Overview

The WYSIWYG Editor now includes a comprehensive image upload feature with the following capabilities:

- **File Upload**: Select images from your device
- **Drag & Drop**: Drag images directly into the upload zone
- **URL Input**: Insert images via URL
- **Auto-Resize**: Automatically resize large images before upload
- **Compression**: Compress JPEG/PNG images to reduce file size
- **Preview**: See a preview of the image before inserting
- **Progress Indicator**: Visual feedback during upload
- **Validation**: File type and size validation

## Supported Formats

- JPEG/JPG
- PNG
- GIF
- WebP
- SVG

## Maximum File Size

Default: **5MB** (configurable)

## Basic Usage

### 1. Using Data URLs (No Server Upload)

By default, images are converted to base64 data URLs:

```typescript
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor
      [(ngModel)]="content"
      placeholder="Type or insert images...">
    </wysiwyg-editor>
  `
})
export class MyComponent {
  content = '';
}
```

### 2. Using Custom Upload Handler

For server-side uploads, provide a custom upload handler:

```typescript
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor
      [(ngModel)]="content"
      [imageUploadHandler]="uploadImage"
      placeholder="Type or insert images...">
    </wysiwyg-editor>
  `
})
export class MyComponent {
  content = '';

  /**
   * Custom upload handler that uploads to your server
   * Must return a Promise<string> with the image URL
   */
  uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${yourAuthToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.imageUrl; // Return the URL of the uploaded image
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  };
}
```

### 3. Using with Angular HttpClient

```typescript
import { HttpClient } from '@angular/common/http';
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';
import { firstValueFrom } from 'rxjs';

@Component({
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor
      [(ngModel)]="content"
      [imageUploadHandler]="uploadImage"
      placeholder="Type or insert images...">
    </wysiwyg-editor>
  `
})
export class MyComponent {
  content = '';

  constructor(private http: HttpClient) {}

  uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await firstValueFrom(
      this.http.post<{ url: string }>('/api/images/upload', formData)
    );

    return response.url;
  };
}
```

## Configuration Options

### Image Upload Configuration

You can configure the image upload behavior via inputs:

```typescript
@Component({
  template: `
    <wysiwyg-editor
      [(ngModel)]="content"
      [imageUploadHandler]="uploadImage"
      [maxImageWidth]="2000"
      [maxImageHeight]="2000"
      [autoResizeImages]="true"
      [imageQuality]="0.8"
      placeholder="Type or insert images...">
    </wysiwyg-editor>
  `
})
export class MyComponent {
  content = '';
  
  // Upload handler
  uploadImage = async (file: File): Promise<string> => {
    // Your upload logic
    return 'https://example.com/uploaded-image.jpg';
  };
}
```

### Available Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `imageUploadHandler` | `(file: File) => Promise<string>` | `undefined` | Custom function to upload images to your server |
| `maxImageWidth` | `number` | `2000` | Maximum image width in pixels |
| `maxImageHeight` | `number` | `2000` | Maximum image height in pixels |
| `autoResizeImages` | `boolean` | `true` | Automatically resize images that exceed max dimensions |
| `imageQuality` | `number` | `0.8` | JPEG compression quality (0-1) |

## Examples

### Example 1: Upload to AWS S3

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Component({
  // ... template
})
export class MyComponent {
  private s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'YOUR_ACCESS_KEY',
      secretAccessKey: 'YOUR_SECRET_KEY'
    }
  });

  uploadImage = async (file: File): Promise<string> => {
    const key = `images/${Date.now()}-${file.name}`;
    
    const command = new PutObjectCommand({
      Bucket: 'your-bucket-name',
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read'
    });

    await this.s3Client.send(command);
    
    return `https://your-bucket-name.s3.amazonaws.com/${key}`;
  };
}
```

### Example 2: Upload to Firebase Storage

```typescript
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  // ... template
})
export class MyComponent {
  constructor(private storage: Storage) {}

  uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(this.storage, `images/${Date.now()}-${file.name}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };
}
```

### Example 3: Upload with Progress Tracking

```typescript
@Component({
  template: `
    <div *ngIf="uploadProgress > 0 && uploadProgress < 100">
      Uploading: {{ uploadProgress }}%
    </div>
    <wysiwyg-editor
      [(ngModel)]="content"
      [imageUploadHandler]="uploadImage">
    </wysiwyg-editor>
  `
})
export class MyComponent {
  content = '';
  uploadProgress = 0;

  uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          this.uploadProgress = Math.round((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          this.uploadProgress = 0;
          resolve(response.url);
        } else {
          this.uploadProgress = 0;
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        this.uploadProgress = 0;
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };
}
```

## Server-Side Implementation Examples

### Node.js/Express Example

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    cb(null, isValid);
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `/uploads/images/${req.file.filename}`;
  res.json({ url: imageUrl });
});

app.listen(3000);
```

### PHP Example

```php
<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large']);
    exit;
}

$uploadDir = 'uploads/images/';
$fileName = time() . '-' . basename($file['name']);
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $imageUrl = '/uploads/images/' . $fileName;
    echo json_encode(['url' => $imageUrl]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Upload failed']);
}
?>
```

## Features

### Drag and Drop

Users can drag images directly from their file explorer into the editor's upload zone. The zone will highlight when an image is dragged over it.

### Auto-Resize

Large images are automatically resized to fit within the configured maximum dimensions while maintaining aspect ratio. This helps:
- Reduce file size
- Improve page load times
- Prevent layout issues

### Image Compression

JPEG and PNG images are compressed using HTML5 Canvas API before upload, reducing file size without significant quality loss.

### Validation

The editor validates:
- File type (only images are allowed)
- File size (max 5MB by default)
- Image dimensions (if configured)

### Error Handling

Upload errors are displayed to users with clear error messages:
- "Unsupported file format"
- "File size too large"
- "Upload failed" (from server)

## Best Practices

1. **Always implement server-side validation** - Client-side validation can be bypassed
2. **Use secure file storage** - Don't store uploads in publicly accessible directories without proper sanitization
3. **Generate unique filenames** - Prevent file name collisions
4. **Implement file size limits** - Protect your server from large uploads
5. **Use CDN for serving images** - Improve performance
6. **Implement authentication** - Require users to be authenticated before uploading
7. **Scan for malware** - Use antivirus scanning on uploaded files
8. **Set proper CORS headers** - If uploading to a different domain

## Troubleshooting

### Upload fails silently

Check that your upload handler returns a Promise that resolves to a string URL:

```typescript
uploadImage = async (file: File): Promise<string> => {
  // Must return a string!
  return 'https://example.com/image.jpg';
};
```

### CORS errors

Ensure your server returns proper CORS headers:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

### Images not displaying after upload

Verify that the URL returned from your upload handler is:
1. Absolute (includes https://)
2. Publicly accessible
3. Has correct MIME type headers

### Large images causing performance issues

Enable auto-resize and adjust the compression quality:

```typescript
<wysiwyg-editor
  [autoResizeImages]="true"
  [maxImageWidth]="1200"
  [maxImageHeight]="1200"
  [imageQuality]="0.7">
</wysiwyg-editor>
```

## Security Considerations

1. **Validate file types on the server** - Don't trust client-side validation
2. **Sanitize file names** - Remove special characters and path traversal attempts
3. **Store files outside web root** - Or use a separate storage service
4. **Implement rate limiting** - Prevent abuse
5. **Check file content** - Verify the file is actually an image
6. **Use secure URLs** - Generate signed URLs with expiration
7. **Implement access control** - Restrict who can upload and access images

## License

This feature is part of the Angular WYSIWYG Editor library.
