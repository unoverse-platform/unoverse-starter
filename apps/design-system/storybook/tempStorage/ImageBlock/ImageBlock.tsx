import React from "react";
import styles from "./ImageBlock.module.css";

interface ImageBlockProps {
  image?: string;
  alt?: string;
  caption?: string;
  object?: Record<string, any>;
}

export default function ImageBlock(props: ImageBlockProps) {
  const obj: any = props.object ?? {};

  // Use explicit empty string check - || treats "" as falsy, so we need to check for actual content
  const image =
    (props.image && props.image.trim()) ||
    obj.image ||
    obj.metadata?.images?.[0] ||
    (obj.source_url?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? obj.source_url : undefined);
  const alt = (props.alt && props.alt.trim()) || obj.alt || obj.title || "";
  const caption = (props.caption && props.caption.trim()) || obj.caption;

  return (
    <div className={styles.container}>
      {image && (
        <div className={styles.imageContainer}>
          <img src={image} alt={alt} className={styles.image} />
        </div>
      )}
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
