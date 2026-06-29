/**
 * Trích tiêu đề và phần trích đoạn từ nội dung bài viết.
 * - Nếu có `bookTitle` thì ưu tiên làm tiêu đề.
 * - Nếu không, lấy dòng đầu tiên (bỏ dòng trống) của `content`.
 * - Phần còn lại của `content` (sau dòng tiêu đề) được dùng làm excerpt và
 *   được cắt ngắn còn khoảng `maxExcerpt` ký tự (mặc định 140) ở ranh giới từ.
 */
export function extractTitleAndExcerpt(
  content: string,
  bookTitle?: string | null,
  maxExcerpt = 140
): { title: string; excerpt: string } {
  const trimmed = (content ?? "").trim();
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let title = (bookTitle ?? "").trim();
  let bodyLines = lines;

  if (!title && lines.length > 0) {
    title = lines[0];
    bodyLines = lines.slice(1);
  }

  if (!title) title = "Bài viết";

  let excerpt = bodyLines.join(" ").trim();
  if (!excerpt) {
    // Không có dòng phụ → lấy phần còn lại của dòng đầu (nếu dài hơn tiêu đề)
    if (lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.length > title.length + 8) {
        excerpt = firstLine.slice(title.length).trim();
      }
    }
  }

  if (excerpt.length > maxExcerpt) {
    const cut = excerpt.slice(0, maxExcerpt);
    const lastSpace = cut.lastIndexOf(" ");
    excerpt =
      (lastSpace > maxExcerpt * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() +
      "…";
  }

  return { title, excerpt };
}