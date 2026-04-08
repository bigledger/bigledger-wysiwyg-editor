/**
 * Supported video providers for embedded media.
 */
export type VideoProvider = 'youtube' | 'vimeo' | 'direct';

/**
 * Data used to insert a video into the editor.
 */
export interface VideoData {
  /** Original video URL provided by the user */
  url: string;
  /** Optional title for accessibility/tooltips */
  title?: string;
  /** Optional width for the embedded media */
  width?: number;
  /** Optional height for the embedded media */
  height?: number;
  /** Optional provider override when the host already knows the source */
  provider?: VideoProvider;
}

/**
 * Resolved embed details for a video URL.
 */
export interface ResolvedVideoData {
  provider: VideoProvider;
  src: string;
  width: number;
  height: number;
  usesIframe: boolean;
  title: string;
}

export const DEFAULT_VIDEO_WIDTH = 640;
export const DEFAULT_VIDEO_HEIGHT = 360;

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg|m4v|mov)(?:$|[?#])/i;

/**
 * Normalize user-provided video URLs into a predictable format.
 */
export function normalizeVideoUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) {
    return '';
  }

  if (/^[a-z]+:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }

  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Detect the provider for a given video URL.
 */
export function detectVideoProvider(url: string): VideoProvider | null {
  const normalizedUrl = normalizeVideoUrl(url);

  if (!normalizedUrl) {
    return null;
  }

  if (DIRECT_VIDEO_PATTERN.test(normalizedUrl)) {
    return 'direct';
  }

  const parsedUrl = safeParseUrl(normalizedUrl);
  if (!parsedUrl) {
    return null;
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

  if (hostname === 'youtu.be' || hostname.endsWith('youtube.com')) {
    return extractYouTubeVideoId(parsedUrl) ? 'youtube' : null;
  }

  if (hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com')) {
    return extractVimeoVideoId(parsedUrl) ? 'vimeo' : null;
  }

  return null;
}

/**
 * Resolve a video URL into sanitized embed details.
 */
export function resolveVideoData(videoData: VideoData): ResolvedVideoData | null {
  const normalizedUrl = normalizeVideoUrl(videoData.url);
  const provider = videoData.provider || detectVideoProvider(normalizedUrl);

  if (!provider) {
    return null;
  }

  const width = sanitizeDimension(videoData.width, DEFAULT_VIDEO_WIDTH);
  const height = sanitizeDimension(videoData.height, DEFAULT_VIDEO_HEIGHT);
  const title = (videoData.title || getDefaultVideoTitle(provider)).trim();

  switch (provider) {
    case 'youtube': {
      const parsedUrl = safeParseUrl(normalizedUrl);
      const details = parsedUrl ? extractYouTubeVideoId(parsedUrl) : null;
      if (!details) {
        return null;
      }

      const startParam = details.startAt ? `?start=${details.startAt}` : '';
      return {
        provider,
        src: `https://www.youtube.com/embed/${details.videoId}${startParam}`,
        width,
        height,
        usesIframe: true,
        title
      };
    }

    case 'vimeo': {
      const parsedUrl = safeParseUrl(normalizedUrl);
      const videoId = parsedUrl ? extractVimeoVideoId(parsedUrl) : null;
      if (!videoId) {
        return null;
      }

      return {
        provider,
        src: `https://player.vimeo.com/video/${videoId}`,
        width,
        height,
        usesIframe: true,
        title
      };
    }

    case 'direct':
      return {
        provider,
        src: normalizedUrl,
        width,
        height,
        usesIframe: false,
        title
      };
  }
}

/**
 * Create the HTML inserted into the editor for a given video.
 */
export function buildVideoEmbedHtml(videoData: VideoData): string {
  const resolved = resolveVideoData(videoData);

  if (!resolved) {
    return '';
  }

  const escapedSrc = escapeAttribute(resolved.src);
  const escapedTitle = escapeAttribute(resolved.title);

  if (resolved.usesIframe) {
    return [
      `<div class="wysiwyg-video-embed" contenteditable="false">`,
      `<iframe src="${escapedSrc}" title="${escapedTitle}" width="${resolved.width}" height="${resolved.height}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen frameborder="0"></iframe>`,
      `</div>`,
      `<p><br></p>`
    ].join('');
  }

  return [
    `<div class="wysiwyg-video-embed" contenteditable="false">`,
    `<video src="${escapedSrc}" title="${escapedTitle}" width="${resolved.width}" height="${resolved.height}" controls playsinline preload="metadata"></video>`,
    `</div>`,
    `<p><br></p>`
  ].join('');
}

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function extractYouTubeVideoId(url: URL): { videoId: string; startAt?: number } | null {
  const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
  const pathSegments = url.pathname.split('/').filter(Boolean);
  let videoId = '';

  if (hostname === 'youtu.be') {
    videoId = pathSegments[0] || '';
  } else if (pathSegments[0] === 'watch') {
    videoId = url.searchParams.get('v') || '';
  } else if (['embed', 'shorts', 'live'].includes(pathSegments[0] || '')) {
    videoId = pathSegments[1] || '';
  } else {
    videoId = url.searchParams.get('v') || '';
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return null;
  }

  const timeValue = url.searchParams.get('start') || url.searchParams.get('t') || undefined;
  const startAt = timeValue ? parseTimeToSeconds(timeValue) : undefined;

  return startAt ? { videoId, startAt } : { videoId };
}

function extractVimeoVideoId(url: URL): string | null {
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const candidate = pathSegments[pathSegments.length - 1] || '';
  return /^\d+$/.test(candidate) ? candidate : null;
}

function parseTimeToSeconds(value: string): number | undefined {
  const trimmed = value.trim().toLowerCase();

  if (/^\d+$/.test(trimmed)) {
    const numericValue = Number.parseInt(trimmed, 10);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
  }

  const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) {
    return undefined;
  }

  const hours = Number.parseInt(match[1] || '0', 10);
  const minutes = Number.parseInt(match[2] || '0', 10);
  const seconds = Number.parseInt(match[3] || '0', 10);
  const total = (hours * 3600) + (minutes * 60) + seconds;

  return total > 0 ? total : undefined;
}

function sanitizeDimension(value: number | undefined, fallback: number): number {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.round(value);
}

function getDefaultVideoTitle(provider: VideoProvider): string {
  switch (provider) {
    case 'youtube':
      return 'YouTube video';
    case 'vimeo':
      return 'Vimeo video';
    case 'direct':
      return 'Embedded video';
  }
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
