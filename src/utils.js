import fs from 'fs'
import yaml from 'js-yaml'

export const readYaml = (path) => {
    return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
};

export const last = (arr) => arr[arr.length-1];

export const removeSpace = (str, pattern=/(\s|\u200C)/g) => str.replace(pattern,'');

export const pixelToNumber = (str) => +str?.replace('px', '');