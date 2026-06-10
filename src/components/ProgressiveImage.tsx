import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { Skeleton } from "./Skeleton";

function joinClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

interface ProgressiveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  priority?: "high" | "low";
  showSkeleton?: boolean;
}

function ProgressiveImage({
  src,
  alt,
  className,
  wrapperClassName,
  priority = "low",
  showSkeleton = true,
  onLoad,
  onError,
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    if (priority !== "high" || !src) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [priority, src]);

  return (
    <div className={joinClassNames("relative overflow-hidden", wrapperClassName)}>
      {showSkeleton && !isLoaded && !hasError ? (
        <Skeleton className="absolute inset-0 rounded-[inherit]" />
      ) : null}

      <img
        {...props}
        src={src}
        alt={alt}
        loading={priority === "high" ? "eager" : "lazy"}
        decoding="async"
        onLoad={(event) => {
          setIsLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setHasError(true);
          onError?.(event);
        }}
        className={joinClassNames(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </div>
  );
}

export default ProgressiveImage;
