import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { imageLoaded } from '../image-listener';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  sizes?: string;
}

const FILL: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

/** next/image stand-in for the DOM bundle: a plain lazy, no-referrer <img>. */
export default function Image({
  src,
  fill,
  priority: _priority,
  unoptimized: _unoptimized,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  loader: _loader,
  sizes: _sizes,
  style,
  alt,
  ...rest
}: ImageProps) {
  return (
    <img
      referrerPolicy="no-referrer"
      loading="lazy"
      {...rest}
      alt={alt ?? ''}
      src={typeof src === 'string' ? src : src.src}
      style={fill ? { ...FILL, ...style } : style}
      onLoad={(e) => {
        rest.onLoad?.(e);
        imageLoaded(e.currentTarget);
      }}
    />
  );
}
