import imagekit from "../services/imagekit.service.js";

export async function uploadToImageKit(file, folder = "pg-images") {
  const result = await imagekit.upload({
    file: file.buffer,
    fileName: `${Date.now()}-${file.originalname}`,
    folder,
    useUniqueFileName: true,
  });
  return { url: result.url, fileId: result.fileId };
}

export async function deleteFromImageKit(fileId) {
  await imagekit.deleteFile(fileId);
}
