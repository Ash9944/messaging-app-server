import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
import { v4 as uuidv4 } from 'uuid';
const awsS3Config = config.aws;

function getS3Configuration() {
    const s3Configuration = new S3Client({
        credentials:
        {
            accessKeyId: awsS3Config.accessKeyId,
            secretAccessKey: awsS3Config.accessKeySecret
        },
        region: awsS3Config.region
    });

    return s3Configuration;
};

export async function getS3SignedUrl(applicantNo, attachment) {
    try {
        const s3 = getS3Configuration();
        const { fileName, filePath } = await getS3UploadFileObject(applicantNo, attachment.message);

        const params = {
            Bucket: awsS3Config.bucketName,
            Key: filePath,
            ContentType: attachment.fileType
        };

        const command = new PutObjectCommand(params);
        const url = await getSignedUrl(s3, command, { expiresIn: awsS3Config.maxTimeToUploadInSecs });

        const resp = {
            signedUrl: url,
            fileName, filePath
        };
        return Promise.resolve(resp);
    } catch (error) {
        return Promise.reject(error);
    }
};

async function getS3UploadFileObject(applicantNo, attachmentName) {
    const fileName = getS3UploadFileName(attachmentName);
    return {
        fileName: fileName,
        filePath: getS3UploadFilePath(applicantNo, fileName)
    }
};

function getS3UploadFileName(attachmentName) {
    let fileNameParts = [uuidv4()];
    fileNameParts.push(attachmentName);

    return fileNameParts.join("-");
};

function getS3UploadFilePath(applicantNo, fileName) {
    let filePathParts = [];

    filePathParts.push(applicantNo);
    filePathParts.push(fileName);

    return filePathParts.join("/");
};

export async function getSignedUrlForGetObject(s3FileObject) {
    try {
        const s3 = getS3Configuration();

        const params = {
            Bucket: awsS3Config.bucketName,
            Key: s3FileObject.url,
        };

        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3, command, { expiresIn: awsS3Config.maxTimeToDownloadInSecs });
        return Promise.resolve(url);
    } catch (error) {
        return Promise.reject(error);
    }
};

export async function deleteFilesInS3(applicantNo, file) {
    try {
        const deleteBucketParams = {
            Bucket: `${awsS3Config.bucketName}`,
            Delete: { Objects: [] }
        };

        deleteBucketParams.Delete.Objects.push({ Key: file.url });

        const client = getS3Configuration();

        if (deleteBucketParams.Delete.Objects.length > 0) {
            const deleteCommand = new DeleteObjectsCommand(deleteBucketParams);
            let response = await client.send(deleteCommand);
            appLogger.info(`Attachment Deleted for the applicant: ${applicantNo} - ${JSON.stringify(response.Deleted)}`);
        }
        return Promise.resolve(true);

    } catch (err) {
        appLogger.error(`Failed to delete the Attachment for the applicant: ${applicantNo} - ${JSON.stringify(file.url)}`);
        return Promise.resolve(true);
    }
}