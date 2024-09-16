ArrayBuffer.prototype.toBase64 = function () {
    const uint8Array = new Uint8Array(this);

    let binaryString = '';

    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }

    return btoa(binaryString);
};

ArrayBuffer.fromBase64 = function (base64) {
    const binaryString = atob(base64);
    const buffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(buffer);

    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return buffer;
};
