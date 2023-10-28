// https://dev.to/samternent/json-compression-in-the-browser-with-gzip-and-the-compression-streams-api-4135
export class StringCompressor {
    public static async compress(inputString: string): Promise<string> {
        const stream = new Blob([inputString], {
            type: 'application/json',
        }).stream();

        const compressedReadableStream = stream.pipeThrough(
            new CompressionStream("gzip")
        );

        const compressedResponse = await new Response(compressedReadableStream);
        const blob = await compressedResponse.blob();
        // Get the ArrayBuffer
        const buffer = await blob.arrayBuffer();
        
        // convert ArrayBuffer to base64 encoded string
        const compressedBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return compressedBase64;
    }
    
    public static async decompress(compressedString: string): Promise<string> {
        const compressedData = atob(compressedString);
        const compressedArray = compressedData.split('').map((char) => char.charCodeAt(0));
        const compressedBuffer = new Uint8Array(compressedArray).buffer;
        
        const readableStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(compressedBuffer));
                controller.close();
            },
        });
        
        const decompressionStream = new DecompressionStream('gzip');
        const decompressedStream = readableStream.pipeThrough(decompressionStream);
        const decompressedData = await new Response(decompressedStream).text();
        
        return decompressedData;
    }
}