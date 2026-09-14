"use client"

import { clx } from "@medusajs/ui"
import Image from "next/image"
import React, { useState } from "react"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  /** `sizes` for next/image; grids should pass their real column width so the optimizer is not asked for an 800px file to fill 330px. */
  sizes?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  sizes,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <div
      className={clx(
        "relative w-full overflow-hidden bg-[#0d0d1f] rounded-large shadow-elevation-card-rest group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} sizes={sizes} />
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  sizes,
}: Pick<ThumbnailProps, "size" | "sizes"> & { image?: string }) => {
  const [failed, setFailed] = useState(false)

  if (!image || failed) {
    return (
      <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-[#6C2BFF]/50 via-[#1a0a3a] to-[#00CFFF]/30" />
    )
  }

  return (
    <Image
      src={image}
      alt=""
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      quality={50}
      sizes={sizes ?? "(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"}
      fill
      onError={() => setFailed(true)}
    />
  )
}

export default Thumbnail
