import FileManager from './FILES/fileManager.js';
import Compiler   from "./COMPILER/new_compiler.js";
import { loadFile } from "./FILES/file loader.js";

const preloadedModuleList = {
    "basic stack ops"   : (await(await fetch(`./FILES/basic stack ops.GL`)).text()).split("\r").join(""),
    "std GLib"          : (await(await fetch(`./FILES/std GLib.GL`)).text()).split("\r").join(""),
    "std GList"         : (await(await fetch(`./FILES/std GList.GL`)).text()).split("\r").join(""),
    "Vector2D"          : (await(await fetch(`./FILES/Vector2D.GL`)).text()).split("\r").join(""),
};
const usedFilePath = "EXAMPLES/presentation";

const fileManager = new FileManager();
const GLC         = new Compiler();

//GUI Buttons setup
const openFileBtn   = document.getElementById("Open");
const saveFileBtn   = document.getElementById("Save");
const saveFileAsBtn = document.getElementById("SaveAs");
const buildBtn      = document.getElementById("Build");

openFileBtn.onclick = async _=> {
    await fileManager.openFile();
    const [fileName, fileContents] = await fileManager.readFile();
    editor.loadText(fileName, fileContents);
};

saveFileBtn.onclick = async _=> {
    await fileManager.saveFile(editor.getText());
};

saveFileAsBtn.onclick = async _=> {
    await fileManager.saveFileAs(editor.getText());
};

buildBtn.onclick =_=> {
    GLC.build();
};