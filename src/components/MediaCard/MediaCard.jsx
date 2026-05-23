import { useState } from "react";
import PropTypes from "prop-types";
import { getFileExtensionFromUrl, getMediaTypeLabel } from "../../utils/mediaResource.js";
import { cn } from "../../ui/cn.js";

const extensionTone = {
  PDF: "bg-accent text-white",
  DOC: "bg-[#1f78d1] text-white",
  DOCX: "bg-[#1f78d1] text-white",
  PPT: "bg-[#e77817] text-white",
  PPTX: "bg-[#e77817] text-white",
  XLS: "bg-[#16a34a] text-white",
  XLSX: "bg-[#16a34a] text-white",
  PLAY: "bg-ink text-white",
  LINK: "bg-[#64748b] text-white",
  IMG: "bg-[#16a34a] text-white",
};

function MediaCard({ resource, onOpen }) {
  const { title, description, type } = resource;

  const typeLabel = getMediaTypeLabel(type);
  const isVideoType = type === "VIDEO_LINK" || type === "VIDEO";
  const isLinkType = type === "EXTERNAL_LINK" || type === "LINK";
  const isImageUrl = (url) => !!(url && /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url));
  const fileUrls = Array.isArray(resource.fileUrls) && resource.fileUrls.length > 0
    ? resource.fileUrls
    : resource.url
      ? [resource.url]
      : [];
  const [filesExpanded, setFilesExpanded] = useState(false);
  const primaryUrl = fileUrls[0];
  const isCompact = fileUrls.length > 2 && !filesExpanded;
  const visibleFileUrls = isCompact ? fileUrls.slice(0, 2) : fileUrls;
  const overflowCount = Math.max(fileUrls.length - 2, 0);
  const primaryExtension = isVideoType
    ? "PLAY"
    : isLinkType
      ? "LINK"
      : type === "IMAGE"
        ? "IMG"
        : getFileExtensionFromUrl(primaryUrl);
  const primaryTone = extensionTone[primaryExtension] || extensionTone.DOC;

  const openResource = (url = primaryUrl) => {
    if (!url) {
      return;
    }

    if (onOpen) {
      onOpen({ ...resource, url, fileUrls });
    }
  };

  const handleCardClick = () => {
    if (fileUrls.length > 2) {
      setFilesExpanded((current) => !current);
      return;
    }

    openResource();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  const renderPreview = () => {
    if (fileUrls.length === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          "flex min-h-15 items-center justify-between gap-2 overflow-hidden rounded-ami border border-border bg-soft px-3 py-2",
          filesExpanded && "max-h-38 items-start overflow-y-auto",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {visibleFileUrls.map((url, index) => {
            const showImage = isImageUrl(url);
            const fileExtension = isVideoType ? "PLAY" : isLinkType ? "LINK" : showImage ? "IMG" : getFileExtensionFromUrl(url);
            const tone = extensionTone[fileExtension] || extensionTone.DOC;
            return (
              <button
                key={url}
                type="button"
                className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-ami border-0 bg-surface-strong p-0 transition"
                onClick={(event) => {
                  event.stopPropagation();
                  openResource(url);
                }}
                aria-label={`Відкрити файл ${index + 1}`}
              >
                {showImage ? (
                  <img
                    src={url}
                    alt={`Файл ${index + 1}`}
                    className="block size-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className={cn("grid size-full place-items-center text-[10px]/4 font-black", tone)} aria-hidden="true">
                    {fileExtension}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {fileUrls.length > 2 && !filesExpanded && (
          <button
            type="button"
            className="grid min-h-10 shrink-0 place-items-center rounded-ami border-0 bg-accent-soft px-3 text-xs/5 font-extrabold text-accent"
            onClick={(event) => {
              event.stopPropagation();
              setFilesExpanded(true);
            }}
            aria-label={`Показати ще ${overflowCount} файли`}
          >
            +{overflowCount}
          </button>
        )}

        {filesExpanded && fileUrls.length > 2 && (
          <button
            type="button"
            className="grid min-h-10 shrink-0 place-items-center rounded-ami border-0 bg-accent-soft px-3 text-xs/5 font-extrabold text-accent"
            onClick={(event) => {
              event.stopPropagation();
              setFilesExpanded(false);
            }}
            aria-label="Згорнути список файлів"
          >
            Менше
          </button>
        )}
      </div>
    );
  };

  return (
    <article
      className="group flex h-full min-h-72 cursor-pointer flex-col gap-4 rounded-ami border border-border bg-surface-strong p-5 shadow-[var(--shadow-ami-xs)] transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-ami-md)] focus-visible:-translate-y-0.5 focus-visible:border-accent/40 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus) motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Відкрити матеріал: ${title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid size-14 shrink-0 place-items-center rounded-ami transition group-hover:scale-105 motion-reduce:group-hover:scale-100", primaryTone)}>
          <span className="font-sans text-xs/4 font-black tracking-wide">{primaryExtension}</span>
        </div>
        <span className="rounded-ami border border-accent/25 bg-accent-soft px-3 py-1 text-xs/4 font-black text-accent-strong">
          {typeLabel}
        </span>
      </div>
      {renderPreview()}
      <div className="grid gap-1.5">
        <h3 className="m-0 font-sans text-base/6 font-black text-ink transition group-hover:text-accent-strong line-clamp-2">{title}</h3>
        <p className="m-0 overflow-hidden text-sm/6 font-bold text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {description || "Опис відсутній"}
        </p>
      </div>
      <button
        type="button"
        className="mt-auto inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-ami border border-transparent bg-transparent px-3 text-sm/6 font-black text-accent-strong transition duration-200 hover:border-accent/30 hover:bg-accent-soft active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus) max-[520px]:w-full motion-reduce:active:translate-y-0"
        onClick={(event) => {
          event.stopPropagation();
          openResource();
        }}
      >
        Переглянути
        <svg viewBox="0 0 24 24" className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    </article>
  );
}

MediaCard.propTypes = {
  resource: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    url: PropTypes.string,
    files: PropTypes.array,
    fileUrls: PropTypes.arrayOf(PropTypes.string),
    type: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func,
};

MediaCard.defaultProps = {
  onOpen: null,
};

export default MediaCard;
