export default class Media {
    static async hasMediaInputs() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some(device => device.kind === 'audioinput');
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');

        return {hasAudioInput, hasVideoInput};
    };

    static async getMediaStream({audio, video}) {
        const {hasAudioInput, hasVideoInput} = await this.hasMediaInputs();

        if (!hasVideoInput && !hasAudioInput) {
            throw new Error("No video or audio devices found.");
        }

        return navigator.mediaDevices.getUserMedia({
            audio: audio && hasAudioInput,
            video: video && hasVideoInput,
        });
    };
}
