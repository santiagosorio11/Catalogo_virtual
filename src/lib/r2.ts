import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Faltan las variables de entorno de Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).");
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("Falta la variable de entorno R2_BUCKET_NAME.");
  return bucket;
}

function getPublicUrlBase(): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error("Falta la variable de entorno R2_PUBLIC_URL.");
  return base.replace(/\/$/, "");
}

export function buildR2Key(folder: string, filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  return `${folder}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadToR2(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${getPublicUrlBase()}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

/** Extracts the R2 object key from a public URL previously built by uploadToR2. */
export function keyFromR2Url(url: string): string | null {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base || !url.startsWith(`${base}/`)) return null;
  return url.slice(base.length + 1);
}
