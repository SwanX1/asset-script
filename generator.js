// Copyright 2021 SwanX1
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

if (require.main === module) {
  const fs = require("fs");
  const path = require("path");

  /** @type {string[]} */
  const argv = process.argv.slice(2);
  let assetspath = path.normalize("./assets");
  let definefile = path.normalize(path.join(__dirname, "./define.json"));
  let templatepath = path.normalize(path.join(__dirname, "./templates"));
  if (argv.length > 0) {
    const helpArg = argv.findIndex((value, index, array) => /^\--help/.test(value));
    if (helpArg !== -1) {
      console.log(
        `Usage: ${require.main.filename.substr(require.main.filename.lastIndexOf("/") + 1, require.main.filename.length)} [options] [assets directory]\n` +
        '\n' +
        'Options:\n' +
        ' --help           Shows this prompt.\n' +
        '\n' +
        ' -d, --define     Defines the path where the define.json file is located.\n' +
        `                  Default: "${path.join(__dirname, "./define.json")}"\n` + 
        '\n' +
        ' -t, --templates  Defines where to look for template files.\n' +
        `                  Default: "${path.join(__dirname, "./templates")}"\n`
      );
      process.exit(0);
    }

    const defineFileArg = argv.findIndex((value, index, array) => /^(\-\-define|\-d)$/.test(array[index - 1]));
    if (defineFileArg !== -1) {
      definefile = path.isAbsolute(argv[defineFileArg]) ? path.normalize(argv[defineFileArg]) : path.join(__dirname, argv[defineFileArg]);
    }

    const templatePathArg = argv.findIndex((value, index, array) => /^(\-\-templates|\-t)$/.test(array[index - 1]));
    if (templatePathArg !== -1) {
      templatepath = path.isAbsolute(argv[templatePathArg]) ? path.normalize(argv[templatePathArg]) : path.join(__dirname, argv[templatePathArg]);
    }

    const assetsPathArg = argv.findIndex((value, index, array) => !/^\-/.test(array[index - 1]) && !/^\-/.test(value));
    if (assetsPathArg !== -1) {
      assetspath = path.normalize(argv[assetsPathArg]);
    }
  }

  if (typeof assetspath === "undefined") {
    console.error("Please provide the assets directory via an argument.");
    process.exit(1);
  }

  /**
   * @typedef Define
   * @property {string} id
   * @property {string[]} requires
   */

  console.log("Reading define.json...");
  /** @type {Define[]} */
  const requiredData = JSON.parse(fs.readFileSync(definefile));
  /** @type {Record<string, string>} */
  const templates = {};

  for (const templatefilename of fs.readdirSync(templatepath)) {
    const templatename = templatefilename.slice(0, templatefilename.lastIndexOf('.'));
    console.log("Reading template " + templatename + "...");
    templates[templatename] = fs.readFileSync(path.join(templatepath, templatefilename)).toString();
  }

  /** @type {{[namespace: string]: string[]}} */
  let langQueue = {};

  for (const obj of requiredData) {
    const namespace = obj.id.slice(0, obj.id.indexOf(":"));
    const name = obj.id.slice(obj.id.indexOf(":") + 1, obj.id.length);
    createDirectoriesRecursively(path.join(assetspath, namespace, "blockstates"));
    createDirectoriesRecursively(path.join(assetspath, namespace, "lang"));
    createDirectoriesRecursively(path.join(assetspath, namespace, "models/block"));
    createDirectoriesRecursively(path.join(assetspath, namespace, "models/item"));
    createDirectoriesRecursively(path.join(assetspath, namespace, "textures/block"));
    createDirectoriesRecursively(path.join(assetspath, namespace, "textures/item"));
    if (typeof langQueue[namespace] === 'undefined') langQueue[namespace] = [];
    {
      const en_us = path.join(assetspath, namespace, "lang/en_us.json");
      if (!fs.existsSync(en_us)) {
        fs.writeFileSync(en_us, "{}");
      }
    }
    const requiredTemplates = obj.requires;
    for (const requiredTemplateName of requiredTemplates) {
      switch (requiredTemplateName) {
        case "block":
          {
            const blockstatepath = path.join(assetspath, namespace, "blockstates", name + ".json");
            const modelpath = path.join(assetspath, namespace, "models/block", name + ".json");
            writeTemplateToFile(blockstatepath, "block_blockstate", { name, namespace });
            writeTemplateToFile(modelpath, "block_model", { name, namespace });
            langQueue[namespace].push(`block.${namespace}.${name}`);
            if (obj.requires.includes("blockitem")) {
              const itemmodelpath = path.join(assetspath, namespace, "models/item", name + ".json");
              writeTemplateToFile(itemmodelpath, "block_item_model", { name, namespace });
            }
          }
          break;
        
        case "block":
          {
            const blockstatepath = path.join(assetspath, namespace, "blockstates", name + ".json");
            const modelpath = path.join(assetspath, namespace, "models/block", name + ".json");
            writeTemplateToFile(blockstatepath, "block_blockstate", { name, namespace });
            writeTemplateToFile(modelpath, "block_model", { name, namespace });
            langQueue[namespace].push(`block.${namespace}.${name}`);
            if (obj.requires.includes("blockitem")) {
              const itemmodelpath = path.join(assetspath, namespace, "models/item", name + ".json");
              writeTemplateToFile(itemmodelpath, "block_item_model", { name, namespace });
            }
          }
          break;

        case "slab":
          {
            const blockstatepath = path.join(assetspath, namespace, "blockstates", name + "_slab.json");
            const modelpath = path.join(assetspath, namespace, "models/block", name + "_slab.json");
            const modeltoppath = path.join(assetspath, namespace, "models/block", name + "_slab_top.json");
            console.log("Writing " + blockstatepath);
            writeTemplateToFile(blockstatepath, "slab_blockstate", { name, namespace });
            writeTemplateToFile(modelpath, "slab_model", { name, namespace });
            writeTemplateToFile(modeltoppath, "slab_model_top", { name, namespace });
            langQueue[namespace].push(`block.${namespace}.${name}_slab`);
            if (obj.requires.includes("blockitem")) {
              const itemmodelpath = path.join(assetspath, namespace, "models/item", name + "_slab.json");
              writeTemplateToFile(itemmodelpath, "block_item_model", { name: name + "_slab", namespace });
            }
          }
          break;

        case "stairs":
          {
            const blockstatepath = path.join(assetspath, namespace, "blockstates", name + "_stairs.json");
            const modelpath = path.join(assetspath, namespace, "models/block", name + "_stairs.json");
            const modelinnerpath = path.join(assetspath, namespace, "models/block", name + "_stairs_inner.json");
            const modelouterpath = path.join(assetspath, namespace, "models/block", name + "_stairs_outer.json");
            writeTemplateToFile(blockstatepath, "stair_blockstate", { name, namespace });
            writeTemplateToFile(modelpath, "stair_model", { name, namespace });
            writeTemplateToFile(modelinnerpath, "stair_model_inner", { name, namespace });
            writeTemplateToFile(modelouterpath, "stair_model_outer", { name, namespace });
            langQueue[namespace].push(`block.${namespace}.${name}_stairs`);
            if (obj.requires.includes("blockitem")) {
              const itemmodelpath = path.join(assetspath, namespace, "models/item", name + "_stairs.json");
              writeTemplateToFile(itemmodelpath, "block_item_model", { name: name + "_stairs", namespace });
            }
          }
          break;

        case "wall":
          {
            const blockstatepath = path.join(assetspath, namespace, "blockstates", name + "_wall.json");
            const modelinventorypath = path.join(assetspath, namespace, "models/block", name + "_wall_inventory.json");
            const modelpostpath = path.join(assetspath, namespace, "models/block", name + "_wall_post.json");
            const modelsidetallpath = path.join(assetspath, namespace, "models/block", name + "_wall_side_tall.json");
            const modelsidepath = path.join(assetspath, namespace, "models/block", name + "_wall_side.json");
            writeTemplateToFile(blockstatepath, "wall_blockstate", { name, namespace });
            writeTemplateToFile(modelinventorypath, "wall_model_inventory", { name, namespace });
            writeTemplateToFile(modelpostpath, "wall_model_post", { name, namespace });
            writeTemplateToFile(modelsidetallpath, "wall_model_side_tall", { name, namespace });
            writeTemplateToFile(modelsidepath, "wall_model_side", { name, namespace });
            langQueue[namespace].push(`block.${namespace}.${name}_wall`);
            if (obj.requires.includes("blockitem")) {
              const itemmodelpath = path.join(assetspath, namespace, "models/item", name + "_wall.json");
              writeTemplateToFile(itemmodelpath, "block_item_model", { name: name + "_wall_inventory", namespace });
            }
          }
          break;
        
        case "item":
          {
            if (!obj.requires.includes("blockitem")) {
              const modelpath = path.join(assetspath, namespace, "models/item", name + ".json");
              writeTemplateToFile(modelpath, "item_model", { name, namespace });
              langQueue[namespace].push(`item.${namespace}.${name}`);
            } else {
              console.warn(`${namespace}:${name}: Template "item" is mutually exclusive with "blockitem"`);
            }
          }
          break;
        
        default:
          if (requiredTemplateName !== "blockitem") {
            console.warn(`No template keyword found: "${requiredTemplateName}"`)
          }
          break;
      } 
    }
  }

  for (const namespace in langQueue) {
    if (!Object.hasOwnProperty.call(langQueue, namespace)) continue;
    langQueue[namespace] = langQueue[namespace].sort((a, b) => a.localeCompare(b));
    const langdir = path.join(assetspath, `${namespace}/lang`);
    for (const langfile of fs.readdirSync(langdir)) {
      const langfilepath = path.join(langdir, langfile);
      const lang = JSON.parse(fs.readFileSync(langfilepath));
      for (const key of langQueue[namespace]) {
        if (typeof lang[key] === "undefined") lang[key] = "";
      }
      console.log("Writing to lang file: " + langfile);
      fs.writeFileSync(langfilepath, JSON.stringify(lang, null, 2));
    }
  }


  function writeTemplateToFile(filepath, templatename, replace) {
    console.log("Writing " + filepath);
    let data = templates[templatename];
    for (const key in replace) {
      if (Object.hasOwnProperty.call(replace, key)) {
        const replacewith = replace[key];
        data = data.replace(new RegExp(`\{${key}\}`, "gi"), replacewith);
      }
    }
    fs.writeFileSync(filepath, data);
  }

  /** @param {string} dirpath */
  function createDirectoriesRecursively(dirpath) {
    const directories = dirpath
      .split("/")
      .filter(e => e !== "")
      .map((dir, index, array) => index > 0 ? path.join(...array.slice(0, index), dir) : dir);
    for (const directory of directories) {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
      } else if (!fs.lstatSync(directory).isDirectory()) {
        console.error(directory + " is not a directory!");
        return;
      }
    }
  }
} else {
  module.exports = {
    version: 1
  };
}