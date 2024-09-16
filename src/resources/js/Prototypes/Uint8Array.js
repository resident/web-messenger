Uint8Array.prototype.toBase64 = function () {
    let binaryString = '';

    for (let i = 0; i < this.length; i++) {
        binaryString += String.fromCharCode(this[i]);
    }

    return btoa(binaryString);
};

Uint8Array.fromBase64 = function (base64) {
    const binaryString = atob(base64);

    const uint8Array = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return uint8Array;
};
