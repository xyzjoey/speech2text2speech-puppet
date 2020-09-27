import fs from 'fs'
import yaml from 'js-yaml'

export const readYaml = (path) => {
    return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
};

export const getParentHandle = (page, handle) => {
    return page.evaluateHandle((el) => el?.parentNode, handle);
};

export const handleEqual = (page, handle1, handle2) => {
    return page.evaluate((el1, el2) => el1 === el2, handle1, handle2);
};