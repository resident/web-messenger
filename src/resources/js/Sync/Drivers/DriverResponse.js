export default class DriverResponse {
    driverName;
    result;

    constructor(driverName, result) {
        this.driverName = driverName;
        this.result = result;
    }

    static make(driverName, result, mapper = null) {
        return new Promise((resolve, reject) => {
            result.then(result => {
                resolve(new DriverResponse(driverName, mapper ? mapper(result) : result));
            }).catch(error => {
                reject(error);
            });
        });
    }
}
