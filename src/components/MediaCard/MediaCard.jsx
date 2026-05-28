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

function MediaCard({ resource, onOpen, onRequestDelete, isAdmin }) {
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
      className="relative group flex h-full min-h-72 cursor-pointer flex-col gap-4 rounded-ami border border-border bg-surface-strong p-5 shadow-[var(--shadow-ami-xs)] transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-ami-md)] focus-visible:-translate-y-0.5 focus-visible:border-accent/40 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--color-focus) motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
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
        <div className="flex items-center gap-2">
          
          <span className="rounded-ami border border-accent/25 bg-accent-soft px-3 py-1 text-xs/4 font-black text-accent-strong">
            {typeLabel}
          </span>
          {isAdmin && onRequestDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(resource);
              }}
              aria-label="Видалити матеріал"
              className="grid size-9 place-items-center rounded-ami border border-transparent bg-white text-red-600 hover:bg-red-50"
            >
              <svg width="25px" height="25px" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#0000009"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3094 2.25002H13.6908C13.9072 2.24988 14.0957 2.24976 14.2737 2.27819C14.977 2.39049 15.5856 2.82915 15.9146 3.46084C15.9978 3.62073 16.0573 3.79961 16.1256 4.00494L16.2373 4.33984C16.2562 4.39653 16.2616 4.41258 16.2661 4.42522C16.4413 4.90933 16.8953 5.23659 17.4099 5.24964C17.4235 5.24998 17.44 5.25004 17.5001 5.25004H20.5001C20.9143 5.25004 21.2501 5.58582 21.2501 6.00004C21.2501 6.41425 20.9143 6.75004 20.5001 6.75004H3.5C3.08579 6.75004 2.75 6.41425 2.75 6.00004C2.75 5.58582 3.08579 5.25004 3.5 5.25004H6.50008C6.56013 5.25004 6.5767 5.24998 6.59023 5.24964C7.10488 5.23659 7.55891 4.90936 7.73402 4.42524C7.73863 4.41251 7.74392 4.39681 7.76291 4.33984L7.87452 4.00496C7.94281 3.79964 8.00233 3.62073 8.08559 3.46084C8.41453 2.82915 9.02313 2.39049 9.72643 2.27819C9.90445 2.24976 10.093 2.24988 10.3094 2.25002ZM9.00815 5.25004C9.05966 5.14902 9.10531 5.04404 9.14458 4.93548C9.1565 4.90251 9.1682 4.86742 9.18322 4.82234L9.28302 4.52292C9.37419 4.24941 9.39519 4.19363 9.41601 4.15364C9.52566 3.94307 9.72853 3.79686 9.96296 3.75942C10.0075 3.75231 10.067 3.75004 10.3553 3.75004H13.6448C13.9331 3.75004 13.9927 3.75231 14.0372 3.75942C14.2716 3.79686 14.4745 3.94307 14.5842 4.15364C14.605 4.19363 14.626 4.2494 14.7171 4.52292L14.8169 4.82216L14.8556 4.9355C14.8949 5.04405 14.9405 5.14902 14.992 5.25004H9.00815Z" fill="#9b4d57"></path> <path d="M5.91509 8.45015C5.88754 8.03685 5.53016 7.72415 5.11686 7.7517C4.70357 7.77925 4.39086 8.13663 4.41841 8.54993L4.88186 15.5017C4.96736 16.7844 5.03642 17.8205 5.19839 18.6336C5.36679 19.4789 5.65321 20.185 6.2448 20.7385C6.8364 21.2919 7.55995 21.5308 8.4146 21.6425C9.23662 21.7501 10.275 21.7501 11.5606 21.75H12.4395C13.7251 21.7501 14.7635 21.7501 15.5856 21.6425C16.4402 21.5308 17.1638 21.2919 17.7554 20.7385C18.347 20.185 18.6334 19.4789 18.8018 18.6336C18.9638 17.8206 19.0328 16.7844 19.1183 15.5017L19.5818 8.54993C19.6093 8.13663 19.2966 7.77925 18.8833 7.7517C18.47 7.72415 18.1126 8.03685 18.0851 8.45015L17.6251 15.3493C17.5353 16.6971 17.4713 17.6349 17.3307 18.3406C17.1943 19.025 17.004 19.3873 16.7306 19.6431C16.4572 19.8989 16.083 20.0647 15.391 20.1552C14.6776 20.2485 13.7376 20.25 12.3868 20.25H11.6134C10.2626 20.25 9.32255 20.2485 8.60915 20.1552C7.91715 20.0647 7.54299 19.8989 7.26958 19.6431C6.99617 19.3873 6.80583 19.025 6.66948 18.3406C6.52892 17.6349 6.46489 16.6971 6.37503 15.3493L5.91509 8.45015Z" fill="#9b4d57"></path> <path d="M9.42546 10.2538C9.83762 10.2125 10.2052 10.5133 10.2464 10.9254L10.7464 15.9254C10.7876 16.3376 10.4869 16.7051 10.0747 16.7463C9.66256 16.7875 9.29503 16.4868 9.25381 16.0747L8.75381 11.0747C8.7126 10.6625 9.01331 10.295 9.42546 10.2538Z" fill="#9b4d57"></path> <path d="M14.5747 10.2538C14.9869 10.295 15.2876 10.6625 15.2464 11.0747L14.7464 16.0747C14.7052 16.4868 14.3376 16.7875 13.9255 16.7463C13.5133 16.7051 13.2126 16.3376 13.2538 15.9254L13.7538 10.9254C13.795 10.5133 14.1626 10.2125 14.5747 10.2538Z" fill="#9b4d57"></path> </g></svg>            </button>
          )}
        </div>
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
  onRequestDelete: PropTypes.func,
  isAdmin: PropTypes.bool,
};

MediaCard.defaultProps = {
  onOpen: null,
  onRequestDelete: null,
  isAdmin: false,
};

export default MediaCard;
