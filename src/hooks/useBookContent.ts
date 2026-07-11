import { useQuery } from "@tanstack/react-query";
import type { Entry } from "@/types/entities";

/** Per-book content fetch hook. Lazy-loads chapters on demand. */
export function useBookContent(bookId: string | undefined) {
  return useQuery({
    queryKey: ["book-content", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const res = await fetch(`/data/resolved/books/${bookId.toLowerCase()}.json`);
      if (!res.ok) return [];
      return (await res.json()) as Array<{ name?: string; entries?: Entry[] }>;
    },
    enabled: !!bookId,
  });
}
