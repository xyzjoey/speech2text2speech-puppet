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

export const last = (arr) => {
    return arr[arr.length-1];
};

export const removeSpace = (str) => {
    return str.replace(/(\s|\u200C)/g,'');
};
