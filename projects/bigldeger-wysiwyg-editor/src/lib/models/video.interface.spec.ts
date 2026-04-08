import {
  VideoData,
  DEFAULT_VIDEO_WIDTH,
  DEFAULT_VIDEO_HEIGHT,
  normalizeVideoUrl,
  detectVideoProvider,
  resolveVideoData,
  buildVideoEmbedHtml
} from './video.interface';

describe('Video Interfaces', () => {
  describe('normalizeVideoUrl', () => {
    it('should add https to bare provider URLs', () => {
      expect(normalizeVideoUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should preserve relative direct video URLs', () => {
      expect(normalizeVideoUrl('/assets/video/demo.mp4')).toBe('/assets/video/demo.mp4');
    });
  });

  describe('detectVideoProvider', () => {
    it('should detect YouTube URLs', () => {
      expect(detectVideoProvider('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
      expect(detectVideoProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    });

    it('should detect Vimeo URLs', () => {
      expect(detectVideoProvider('https://vimeo.com/123456789')).toBe('vimeo');
    });

    it('should detect direct video URLs', () => {
      expect(detectVideoProvider('https://cdn.example.com/videos/demo.mp4')).toBe('direct');
      expect(detectVideoProvider('/videos/demo.webm')).toBe('direct');
    });

    it('should return null for unsupported URLs', () => {
      expect(detectVideoProvider('https://example.com/article')).toBeNull();
    });
  });

  describe('resolveVideoData', () => {
    it('should resolve YouTube embed URLs', () => {
      const result = resolveVideoData({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s'
      });

      expect(result).toEqual({
        provider: 'youtube',
        src: 'https://www.youtube.com/embed/dQw4w9WgXcQ?start=90',
        width: DEFAULT_VIDEO_WIDTH,
        height: DEFAULT_VIDEO_HEIGHT,
        usesIframe: true,
        title: 'YouTube video'
      });
    });

    it('should resolve direct video sources', () => {
      const videoData: VideoData = {
        url: '/videos/demo.mp4',
        title: 'Demo video',
        width: 800,
        height: 450
      };

      expect(resolveVideoData(videoData)).toEqual({
        provider: 'direct',
        src: '/videos/demo.mp4',
        width: 800,
        height: 450,
        usesIframe: false,
        title: 'Demo video'
      });
    });
  });

  describe('buildVideoEmbedHtml', () => {
    it('should build iframe HTML for YouTube videos', () => {
      const html = buildVideoEmbedHtml({
        url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'Demo'
      });

      expect(html).toContain('class="wysiwyg-video-embed"');
      expect(html).toContain('<iframe');
      expect(html).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(html).toContain('contenteditable="false"');
    });

    it('should build HTML5 video markup for direct videos', () => {
      const html = buildVideoEmbedHtml({
        url: 'https://cdn.example.com/demo.mp4'
      });

      expect(html).toContain('<video');
      expect(html).toContain('controls');
      expect(html).toContain('https://cdn.example.com/demo.mp4');
    });

    it('should return an empty string for unsupported URLs', () => {
      expect(buildVideoEmbedHtml({ url: 'https://example.com/page' })).toBe('');
    });
  });
});
