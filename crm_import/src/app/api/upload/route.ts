import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No files provided' },
                { status: 400 }
            );
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uploadedUrls: string[] = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileExtension = path.extname(file.name);
            const fileName = `${uuidv4()}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, buffer);
            uploadedUrls.push(`/uploads/${fileName}`);
        }

        return NextResponse.json({
            success: true,
            urls: uploadedUrls,
            message: 'Files uploaded successfully',
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload files' },
            { status: 500 }
        );
    }
}
