import path from 'path'
import { readYaml } from './utils.js'

const here = path.dirname(import.meta.url).replace(/^file:\/\/\//, '');

const SETTINGS = {
    config: readYaml(path.join(here, '../settings/config.yml')),
    googledoc: readYaml(path.join(here, '../settings/googledoc.yml')),
    keycodes: readYaml(path.join(here, '../settings/keycodes.yml'))
};

export default SETTINGS;