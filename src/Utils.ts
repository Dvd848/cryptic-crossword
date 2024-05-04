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

export const digestMessage = async function (message: string) {
    const leftPad = (s: string, c: string, n: number) => c.repeat(n - s.length) + s;
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-512", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => leftPad(b.toString(16), "0", 2))
      .join(""); // convert bytes to hex string
    return hashHex;
}

export const randomElement = function(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const onLongPress = function(element: SVGElement, callback: (element: SVGElement) => void): void {
    let timeoutId: number | null;

    element.addEventListener('touchstart', function(e: TouchEvent) {
        timeoutId = window.setTimeout(function() {
            timeoutId = null;
            e.stopPropagation();
            callback(e.target as SVGElement);
        }, 800);
    });

    element.addEventListener('touchend', function () {
        if (timeoutId) window.clearTimeout(timeoutId);
    });

    element.addEventListener('touchmove', function () {
        if (timeoutId) window.clearTimeout(timeoutId);
    });
}

export const IsiOS = function() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }