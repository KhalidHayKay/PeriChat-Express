import type { UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import { cloudinary } from '../lib/cloudinary.js';
import { env } from '../config/env.js';

export const cloudinaryService = {
  upload(buffer: Buffer, subFolder: string): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${env.app.name}/${subFolder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            const err = new Error(error.message ?? 'Cloudinary upload failed.');
            Object.assign(err, {
              name: error.name,
              httpCode: error.http_code,
              requestId: error.request_id,
            });
            reject(err);
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary upload returned no result.'));
            return;
          }

          resolve(result);
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  },
};
