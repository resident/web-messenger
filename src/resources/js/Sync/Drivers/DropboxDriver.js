import DriverBase from "@/Sync/Drivers/DriverBase.js";
import DropboxClient from "@/Common/Dropbox.js";

export default class DropboxDriver extends DriverBase{
    name = "DropboxDriver";

    async get(key) {
        const dropbox = await this.#getDropboxClient();
        console.log(dropbox)
        const result = new Promise((resolve) => {
            dropbox.filesDownload({ path: '/' + key + '.txt' })
            .then(async (response) => {
                const fileText = await response.result.fileBlob.text();

                try {
                    resolve(JSON.parse(fileText));
                } catch (jsonError) {
                    reject(new Error('Error parsing file content as JSON'));
                    
                }
            })
            .catch(error => {
                console.error('Download error -> ', error)
                resolve(null)
            })
        });

        return this.response(result, result => (result ? {key, ...result} : null));
    }

    async set(key, value) {
        const dropbox = await this.#getDropboxClient();
        const result = new Promise((resolve) => {
            const currentItem = JSON.parse(localStorage.getItem(key));

            const currentDate = new Date();

            const item = {
                value,
                created_at: currentItem?.created_at ?? currentDate.toISOString(),
                updated_at: currentDate.toISOString(),
            };

            const itemString = JSON.stringify(item);

            dropbox.filesUpload({
                path: '/' + key + '.txt',
                contents: itemString,
                mode: { ".tag": "overwrite" },
            })
            .then(response => {
                console.log('File uploaded successfully:', response);
                resolve(true);
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                resolve(false);
            });
            
        });

        return this.response(result);
    }

    async delete(key) {
        const dropbox = await this.#getDropboxClient();
        const result = new Promise((resolve) => {
            dropbox.filesDeleteV2({ path: '/' + key + '.txt' })
                .then(response => {
                    resolve(true);
                })
                .catch(error => {
                    console.error('Error removing file:', error);
                    resolve(false);
                });
        });
        return this.response(result);
    }

    async #getDropboxClient(){
        const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;
        const dropbox = new DropboxClient({clientId: clientId});
        const accessToken = await dropbox.getAccessToken();
        return new DropboxClient({accessToken: accessToken}).client;
    }
}