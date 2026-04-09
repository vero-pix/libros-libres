import { notFound } from "next/navigation";

/**
 * Fallback for /listings/[id] when middleware redirect fails.
 * This should rarely be reached — middleware handles the redirect.
 */
export default function ListingFallback() {
  notFound();
}
