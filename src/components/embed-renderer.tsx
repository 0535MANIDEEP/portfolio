"use client";

import { useState, useCallback } from "react";

// ─── URL Pattern Matchers ──────────────────────────────────────

interface EmbedInfo {
  type: "youtube" | "spotify" | "twitter" | "custom" | "data";
  url: string;
  embedUrl: string;
  title?: string;
  aspectRatio?: string;
  // Feature #19: YouTube specifics (facade pattern)
  videoId?: string;
  playlistId?: string;
  isPlaylist?: boolean;
  thumbnail?: string;
  // Feature #16: data URL specifics (uploaded assets)
  dataKind?: "image" | "video";
  dataMime?: string;
}

function parseYouTube(url: string): EmbedInfo | null {
  // 1) Playlist-only URL: youtube.com/playlist?list=PLxxxx
  const playlistOnly = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (url.includes("playlist") && playlistOnly) {
    const listId = playlistOnly[1];
    return {
      type: "youtube",
      url,
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0`,
      title: "YouTube Playlist",
      aspectRatio: "16/9",
      playlistId: listId,
      isPlaylist: true,
      // Playlists have no single thumbnail — YouTubeEmbed renders a branded
      // gradient placeholder when `thumbnail` is absent.
    };
  }

  // 2) Single-video patterns (incl. shorts, live, embed, watch?v=, youtu.be)
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  let videoId: string | null = null;
  for (const p of patterns) {
    const m = url.match(p);
    if (m) {
      videoId = m[1];
      break;
    }
  }

  if (videoId) {
    // Detect an accompanying playlist for the watch URL
    const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const listId = listMatch ? listMatch[1] : null;
    const embedUrl = listId
      ? `https://www.youtube.com/embed/${videoId}?list=${listId}&rel=0`
      : `https://www.youtube.com/embed/${videoId}?rel=0`;
    return {
      type: "youtube",
      url,
      embedUrl,
      title: "YouTube Video",
      aspectRatio: "16/9",
      videoId,
      playlistId: listId || undefined,
      isPlaylist: false,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 3) Fallback: only a list= param on a non-watch URL
  if (playlistOnly) {
    const listId = playlistOnly[1];
    return {
      type: "youtube",
      url,
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0`,
      title: "YouTube Playlist",
      aspectRatio: "16/9",
      playlistId: listId,
      isPlaylist: true,
    };
  }

  return null;
}

function parseSpotify(url: string): EmbedInfo | null {
  const patterns = [
    /spotify\.com\/(track|album|playlist|episode|show|podcast)\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/(track|album|playlist|episode|show|podcast)\/([a-zA-Z0-9]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) {
      return {
        type: "spotify",
        url,
        embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0`,
        title: `Spotify ${m[1].charAt(0).toUpperCase() + m[1].slice(1)}`,
        aspectRatio: undefined,
      };
    }
  }
  return null;
}

function parseTwitter(url: string): EmbedInfo | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    /(?:twitter\.com|x\.com)\/i\/status\/(\d+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) {
      return {
        type: "twitter",
        url,
        embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}`,
        title: "Tweet",
        aspectRatio: undefined,
      };
    }
  }
  return null;
}

// Feature #16: detect base64 data URLs produced by the Custom Embed uploader.
// Matches `data:image/...` or `data:video/...` (with optional mime params / base64 marker).
const DATA_URL_RE = /^data:(image|video)\/([a-zA-Z0-9.+-]+)([^,]*)?,/i;

function parseDataUrl(url: string): EmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const m = trimmed.match(DATA_URL_RE);
  if (!m) return null;
  const kind = m[1].toLowerCase() as "image" | "video";
  const mime = `${kind}/${m[2].toLowerCase()}`;
  return {
    type: "data",
    url: trimmed,
    embedUrl: trimmed, // data URLs are self-contained — no separate embed URL
    title: kind === "image" ? "Uploaded image" : "Uploaded video",
    dataKind: kind,
    dataMime: mime,
  };
}

export function parseEmbedUrl(url: string): EmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  return parseYouTube(trimmed) || parseSpotify(trimmed) || parseTwitter(trimmed) || null;
}

export function parseCustomEmbed(url: string, title?: string): EmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Feature #16: data URLs (uploaded assets) take priority — never fall through to iframe
  const dataInfo = parseDataUrl(trimmed);
  if (dataInfo) {
    if (title) dataInfo.title = title;
    return dataInfo;
  }

  // Try known types first
  const known = parseEmbedUrl(trimmed);
  if (known) return known;

  // Generic iframe embed
  return {
    type: "custom",
    url: trimmed,
    embedUrl: trimmed,
    title: title || "Embedded Content",
    aspectRatio: "16/9",
  };
}

// ─── Extract embeddable URLs from text content ────────────────
const URL_REGEX = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|open\.spotify\.com|spotify\.com|twitter\.com|x\.com)\/[^\s<>"')\]]+/gi;

export function extractEmbedsFromText(text: string): { cleanText: string; embeds: EmbedInfo[] } {
  if (!text) return { cleanText: text, embeds: [] };

  const embeds: EmbedInfo[] = [];
  let cleanText = text;

  const urls = text.match(URL_REGEX) || [];
  const seen = new Set<string>();

  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const parsed = parseEmbedUrl(url);
    if (parsed) {
      embeds.push(parsed);
      // Remove the bare URL from text (it will be rendered as embed instead)
      cleanText = cleanText.replace(new RegExp(`\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, "g"), "\n\n");
    }
  }

  return { cleanText: cleanText.replace(/\n{3,}/g, "\n\n").trim(), embeds };
}

// ─── Embed Type Icons ──────────────────────────────────────────
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ─── Individual Embed Renderers ────────────────────────────────

/**
 * Feature #19: YouTube embed with facade pattern.
 *
 * Renders a thumbnail (https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg)
 * with a play-button overlay. The actual iframe is only loaded when the
 * user clicks — this avoids pulling in YouTube's heavy player JS for
 * every embed on the page (performance-friendly).
 *
 * For playlists (no single thumbnail), we render a branded placeholder
 * with a "Playlist" badge and play button.
 */
function YouTubeEmbed({ info }: { info: EmbedInfo }) {
  const [activated, setActivated] = useState(false);
  const handleClick = useCallback(() => setActivated(true), []);

  const thumbnail = info.videoId
    ? `https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg`
    : null;
  const isPlaylist = !!info.isPlaylist || (!info.videoId && !!info.playlistId);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-xs font-medium">
        <YouTubeIcon />
        <span>{isPlaylist ? "YouTube Playlist" : "YouTube"}</span>
        <a
          href={info.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto opacity-70 hover:opacity-100 text-[10px] underline-offset-2 hover:underline truncate max-w-[200px]"
          aria-label="Open original on YouTube"
        >
          open ↗
        </a>
      </div>

      {/* 16:9 stage */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {activated ? (
          <iframe
            src={info.embedUrl}
            title={info.title || (isPlaylist ? "YouTube playlist" : "YouTube video")}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={handleClick}
            aria-label={`Play ${isPlaylist ? "playlist" : "video"}: ${info.title || info.url}`}
            className="group absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/40"
          >
            {/* Background: thumbnail for videos; branded gradient for playlists */}
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={info.title || "YouTube thumbnail"}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to a dark gradient if the thumbnail fails
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                }}
              />
            ) : null}
            {!thumbnail && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-black" />
            )}
            {/* Dark overlay for legibility */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

            {/* Play button */}
            <span className="relative z-10 inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-600 text-white shadow-lg shadow-black/40 group-hover:scale-110 group-active:scale-95 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>

            {isPlaylist && (
              <span className="absolute top-2 left-2 z-10 rounded bg-black/70 text-white text-[10px] px-2 py-0.5 font-medium">
                Playlist
              </span>
            )}
            <span className="absolute bottom-2 right-2 z-10 rounded bg-black/70 text-white text-[10px] px-2 py-0.5">
              Click to load
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function SpotifyEmbed({ info }: { info: EmbedInfo }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1DB954] text-white text-xs font-medium">
        <SpotifyIcon />
        <span>{info.title || "Spotify"}</span>
      </div>
      <div className="bg-black">
        <iframe
          src={info.embedUrl}
          title={info.title || "Spotify embed"}
          className="w-full"
          style={{ height: "352px" }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function TwitterEmbed({ info }: { info: EmbedInfo }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 bg-black text-white text-xs font-medium">
        <TwitterIcon />
        <span>Post</span>
      </div>
      <div className="bg-white dark:bg-gray-900">
        <iframe
          src={info.embedUrl}
          title={info.title || "Tweet"}
          className="w-full"
          style={{ height: "400px", maxWidth: "550px", margin: "0 auto", display: "block" }}
          scrolling="no"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function CustomEmbed({ info }: { info: EmbedInfo }) {
  // Some URLs refuse to be iframed (X-Frame-Options / CSP). Render an
  // iframe attempt but also provide an "Open in new tab" fallback link so
  // the user is never left with a blank box.
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span>{info.title || "Embedded Content"}</span>
        <a
          href={info.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto opacity-70 hover:opacity-100 text-[10px] underline-offset-2 hover:underline truncate max-w-[200px]"
        >
          open ↗
        </a>
      </div>
      <div className="relative w-full bg-muted" style={info.aspectRatio ? { paddingBottom: "56.25%" } : { height: "400px" }}>
        <iframe
          src={info.embedUrl}
          title={info.title || "Embed"}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}

/**
 * Feature #16: render an uploaded asset stored as a base64 data URL.
 *
 * - `data:image/*` → render as an <img> (with download link).
 * - `data:video/*` → render as a <video controls> (with download link).
 *
 * These are produced by the "Custom Embed" uploader in the blog admin
 * (FileReader.readAsDataURL on the client). They live in the `embeds` field
 * alongside regular embed URLs.
 */
function DataUrlEmbed({ info }: { info: EmbedInfo }) {
  const kind = info.dataKind;
  const mime = info.dataMime || (kind === "video" ? "video/mp4" : "image/png");

  // Derive a friendly file extension for the download link
  const ext = mime.split("/")[1]?.split("+")[0] || (kind === "video" ? "mp4" : "png");
  const fileName = `${kind === "video" ? "uploaded-video" : "uploaded-image"}.${ext}`;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
        {kind === "video" ? (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
        <span className="capitalize">{kind === "video" ? "Uploaded Video" : "Uploaded Image"}</span>
        <a
          href={info.url}
          download={fileName}
          className="ml-auto opacity-70 hover:opacity-100 text-[10px] underline-offset-2 hover:underline"
        >
          download ↓
        </a>
      </div>
      <div className="p-2 bg-gray-50 dark:bg-gray-950/30">
        {kind === "image" ? (
          <img
            src={info.url}
            alt={info.title || "Uploaded image"}
            className="w-full h-auto rounded-lg object-contain max-h-[600px] mx-auto"
            loading="lazy"
          />
        ) : (
          <video
            src={info.url}
            controls
            preload="metadata"
            className="w-full h-auto rounded-lg max-h-[600px] mx-auto"
          >
            Your browser does not support the video tag.{" "}
            <a href={info.url} download={fileName} className="text-emerald-600 underline">
              Download the video instead.
            </a>
          </video>
        )}
      </div>
    </div>
  );
}

// ─── Main Embed Renderer Component ─────────────────────────────

export function EmbedRenderer({ url, title, className }: { url: string; title?: string; className?: string }) {
  const info = parseCustomEmbed(url, title);
  if (!info) return null;

  return (
    <div className={className || "my-4"}>
      {info.type === "youtube" && <YouTubeEmbed info={info} />}
      {info.type === "spotify" && <SpotifyEmbed info={info} />}
      {info.type === "twitter" && <TwitterEmbed info={info} />}
      {info.type === "custom" && <CustomEmbed info={info} />}
      {info.type === "data" && <DataUrlEmbed info={info} />}
    </div>
  );
}

// ─── Multi-Embed List (for stored embed URLs) ──────────────────

export function EmbedList({ urls, className }: { urls: string; className?: string }) {
  if (!urls) return null;

  const urlList = urls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (urlList.length === 0) return null;

  return (
    <div className={className || "space-y-4 my-4"}>
      {urlList.map((url, i) => (
        <EmbedRenderer key={`${i}-${url}`} url={url} />
      ))}
    </div>
  );
}

// ─── Content + Auto-detected Embeds ────────────────────────────

export function ContentWithEmbeds({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  if (!content) return null;

  const { cleanText, embeds } = extractEmbedsFromText(content);

  return (
    <div className={className}>
      {cleanText && (
        <div className="prose prose-gray dark:prose-invert max-w-none whitespace-pre-wrap">
          {cleanText}
        </div>
      )}
      {embeds.length > 0 && (
        <div className="space-y-4 my-4">
          {embeds.map((embed, i) => (
            <div key={i}>
              {embed.type === "youtube" && <YouTubeEmbed info={embed} />}
              {embed.type === "spotify" && <SpotifyEmbed info={embed} />}
              {embed.type === "twitter" && <TwitterEmbed info={embed} />}
              {embed.type === "custom" && <CustomEmbed info={embed} />}
              {embed.type === "data" && <DataUrlEmbed info={embed} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Admin: Embed URL Input Helper ─────────────────────────────

export function EmbedUrlInput({
  value,
  onChange,
  label = "Embed URLs",
  description = "One URL per line. Supports: YouTube (videos, shorts, playlists), Spotify, Twitter/X, or any iframe-able URL.",
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  description?: string;
}) {
  const [preview, setPreview] = useState<string[]>([]);

  const handleBlur = () => {
    const urls = value.split("\n").map((u) => u.trim()).filter(Boolean);
    setPreview(urls);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-white">{label}</label>
        {preview.length > 0 && (
          <span className="text-[10px] text-gray-400">{preview.length} embed(s) detected</span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{description}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={"https://youtube.com/watch?v=...\nhttps://youtube.com/playlist?list=...\nhttps://open.spotify.com/track/...\nhttps://x.com/user/status/..."}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
      />
      {/* Preview detected embeds */}
      {preview.length > 0 && (
        <div className="space-y-2 mt-2">
          {preview.map((url, i) => {
            const info = parseEmbedUrl(url);
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs">
                {info ? (
                  <>
                    {info.type === "youtube" && <YouTubeIcon />}
                    {info.type === "spotify" && <SpotifyIcon />}
                    {info.type === "twitter" && <TwitterIcon />}
                    {info.type === "custom" && <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /></svg>}
                    <span className="text-green-600 dark:text-green-400 font-medium capitalize">
                      {info.type}{info.isPlaylist ? " · playlist" : info.videoId ? " · video" : ""}
                    </span>
                    <span className="text-gray-400 truncate flex-1">{url}</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    <span className="text-gray-400 truncate flex-1">{url}</span>
                    <span className="text-yellow-500">Unknown — will try iframe</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
