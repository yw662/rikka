import { signal, computed, effect } from '@takanashi/rikka-signal';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  read: boolean;
  createdAt: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const defaultBookmarks: Bookmark[] = [];
const defaultSearchQuery = '';
const defaultSelectedTags: string[] = [];

function loadBookmarks(): Bookmark[] {
  try {
    const saved = localStorage.getItem('bookmark-manager-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.bookmarks || defaultBookmarks;
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return defaultBookmarks;
}

function loadSearchQuery(): string {
  try {
    const saved = localStorage.getItem('bookmark-manager-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.searchQuery ?? defaultSearchQuery;
    }
  } catch {
  }
  return defaultSearchQuery;
}

function loadSelectedTags(): string[] {
  try {
    const saved = localStorage.getItem('bookmark-manager-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.selectedTags || defaultSelectedTags;
    }
  } catch {
  }
  return defaultSelectedTags;
}

export const bookmarks = signal<Bookmark[]>(loadBookmarks());
export const searchQuery = signal<string>(loadSearchQuery());
export const selectedTags = signal<string[]>(loadSelectedTags());

export const filteredBookmarks = computed(() => {
  const query = searchQuery.get().toLowerCase().trim();
  const tags = selectedTags.get();

  return bookmarks.get().filter((bookmark: Bookmark) => {
    if (query) {
      const matchesTitle = bookmark.title.toLowerCase().includes(query);
      const matchesUrl = bookmark.url.toLowerCase().includes(query);
      const matchesTags = bookmark.tags.some((t: string) => t.toLowerCase().includes(query));
      const matchesDescription = bookmark.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesUrl && !matchesTags && !matchesDescription) {
        return false;
      }
    }

    if (tags.length > 0) {
      const hasAllTags = tags.every((tag: string) =>
        bookmark.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
      );
      if (!hasAllTags) return false;
    }

    return true;
  });
});

export const tagCloud = computed(() => {
  const tagCounts = new Map<string, number>();

  bookmarks.get().forEach((bookmark: Bookmark) => {
    bookmark.tags.forEach((tag: string) => {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
});

export const stats = computed(() => {
  const bks = bookmarks.get();
  const total = bks.length;
  const read = bks.filter((b: Bookmark) => b.read).length;
  const unread = total - read;
  const topTags = tagCloud.get().slice(0, 5);

  return { total, read, unread, topTags };
});

export function addBookmark(url: string, title: string, description: string, tags: string[]): void {
  const bookmark: Bookmark = {
    id: generateId(),
    url,
    title: title || url,
    description,
    tags: tags.map((t: string) => t.trim()).filter((t: string) => t),
    read: false,
    createdAt: Date.now(),
  };

  bookmarks.set([...bookmarks.get(), bookmark]);
}

export function removeBookmark(id: string): void {
  bookmarks.set(bookmarks.get().filter((b: Bookmark) => b.id !== id));
}

export function toggleRead(id: string): void {
  bookmarks.set(bookmarks.get().map((b: Bookmark) =>
    b.id === id ? { ...b, read: !b.read } : b
  ));
}

export function updateBookmarkTags(id: string, tags: string[]): void {
  bookmarks.set(bookmarks.get().map((b: Bookmark) =>
    b.id === id ? { ...b, tags: tags.map((t: string) => t.trim()).filter((t: string) => t) } : b
  ));
}

export function updateBookmarkTitle(id: string, title: string): void {
  bookmarks.set(bookmarks.get().map((b: Bookmark) =>
    b.id === id ? { ...b, title } : b
  ));
}

export function toggleTagFilter(tag: string): void {
  const current = selectedTags.get();
  const normalizedTag = tag.toLowerCase();
  const index = current.findIndex((t: string) => t.toLowerCase() === normalizedTag);

  if (index !== -1) {
    selectedTags.set([...current.slice(0, index), ...current.slice(index + 1)]);
  } else {
    selectedTags.set([...current, tag]);
  }
}

export function clearFilters(): void {
  searchQuery.set('');
  selectedTags.set([]);
}

effect(() => {
  const state = {
    bookmarks: bookmarks.get(),
    searchQuery: searchQuery.get(),
    selectedTags: selectedTags.get(),
  };
  try {
    localStorage.setItem('bookmark-manager-state', JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
});
