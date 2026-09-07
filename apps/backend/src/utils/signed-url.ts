import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.S3_PRIVATE_BUCKET!

/**
 * 7 days — the maximum a SigV4 presigned URL can carry, so this cannot be
 * raised further. Chosen over the previous 48h to cut "my link expired"
 * support mail: buyers open order email late, and the shorter window bought
 * little in practice.
 *
 * A signed URL is still a bearer token — anyone holding it downloads the file.
 * What keeps that bounded is that these URLs are never logged, and the
 * confirmation page and /store/order-downloads mint a fresh one on every visit
 * behind an ownership check, so an expired link is never the only way in.
 *
 * Any value above 604800 is rejected by S3/R2 at signing time.
 */
const EXPIRY_SECONDS = 604800

export async function generateSignedUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ResponseContentDisposition: "attachment",
  })
  return getSignedUrl(s3, command, { expiresIn: EXPIRY_SECONDS })
}
