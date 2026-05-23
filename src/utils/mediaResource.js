const MEDIA_TYPE_LABELS = {
  DOCUMENT: "Документ",
  VIDEO: "Відео",
  VIDEO_LINK: "Відео",
  EXTERNAL_LINK: "Лінк",
  LINK: "Лінк",
  IMAGE: "Світлина",
};

export function getMediaTypeLabel(type) {
  return MEDIA_TYPE_LABELS[type] || "Матеріал";
}

export function getFileExtensionFromUrl(url) {
  if (!url) {
    return "DOC";
  }

  const cleanPath = String(url).split("?")[0].split("#")[0];
  const fileName = cleanPath.split("/").pop() || "";
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";

  return extension ? extension.toUpperCase() : "DOC";
}
