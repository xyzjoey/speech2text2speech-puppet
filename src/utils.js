import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export const paths = {
    src: path.dirname(import.meta.url).replace(/^file:\/\/\//, '')
};

export const readYaml = (path) => {
    return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
};

export const readData = (pathFromDataDir) => {
    return readYaml(path.join(paths.src, '../data', pathFromDataDir));
};

export const last = (arr) => arr[arr.length-1];

export const removeSpace = (str, pattern=/(\s|\u200C)/g) => str.replace(pattern,'');

export const pixelToNumber = (str) => +str?.replace('px', '');