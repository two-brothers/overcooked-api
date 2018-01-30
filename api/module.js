const YAML = require('yamljs');
const rootApi = './api/api.yaml';

const expandJson = (json) => {
    for (let k in json) {
        if (json[k] != null) {
            if (typeof json[k] == 'string' && /.*\.yaml/.test(json[k])) {
                json[k] = YAML.load(json[k])
            }
            if (typeof json[k] == 'object') {
                expandJson(json[k])
            }
        }
    }
};

swaggerJson = YAML.load(rootApi);
expandJson(swaggerJson);

const api = {
    json: swaggerJson
};

module.exports = api;