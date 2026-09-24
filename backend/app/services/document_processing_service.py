import re


def normalize_document_text(content: str) -> str:
    cleaned = content.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n[ \t]+", "\n", cleaned)
    return cleaned.strip()


def prepare_document_for_chunking(content: str) -> str:
    normalized = normalize_document_text(content)
    if not normalized:
        return ""
    paragraphs = [paragraph.strip() for paragraph in normalized.split("\n\n") if paragraph.strip()]
    if not paragraphs:
        return normalized
    return "\n\n".join(paragraphs)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 140) -> list[dict]:
    normalized = prepare_document_for_chunking(text)
    if not normalized:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero")
    if overlap < 0:
        raise ValueError("overlap must be zero or greater")
    if overlap >= chunk_size:
        raise ValueError("overlap must be less than chunk_size")

    chunks: list[dict] = []
    start = 0
    chunk_index = 0

    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        if end < len(normalized):
            split_index = normalized.rfind(" ", start + max(1, chunk_size - overlap), end)
            if split_index > start:
                end = split_index
        chunk = normalized[start:end].strip()
        if not chunk:
            break
        chunks.append(
            {
                "chunk_index": chunk_index,
                "content": chunk,
                "start_char": start,
                "end_char": end,
                "char_count": len(chunk),
                "token_estimate": max(1, len(re.findall(r"\S+", chunk))),
            }
        )
        chunk_index += 1
        start = max(start + 1, end - overlap)

    return chunks
