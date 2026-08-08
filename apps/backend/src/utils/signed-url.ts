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
 * 48 hours, down from 7 days. A signed URL is a bearer token — anyone holding
 * it downloads the file — so the window is kept short. Buyers lose nothing:
 * the confirmation page and /store/order-downloads mint a fresh URL on every
 * visit; only a stale link inside an old email expires.
 */
const EXPIRY_SECONDS = 172800

export async function generateSignedUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ResponseContentDisposition: "attachment",
  })
  return getSignedUrl(s3, command, { expiresIn: EXPIRY_SECONDS })
}
