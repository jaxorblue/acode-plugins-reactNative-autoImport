import plugin from "./plugin.json";
import REACT_NATIVE_COMPONENTS from "./rn-components/rn_comp.js";
import REACT_COMPONENTS from "./rn-components/r_comp.js";

const PLUGIN_ID = plugin.id;
const COMMAND_NAME_OPTIMIZE = "rn-optimize-imports";
const autoOptimize_defaultShortcut = "Alt-M";

const RN_COMPONENTS_SET = new Set(REACT_NATIVE_COMPONENTS);
const REACT_EXPORTS_SET = new Set(REACT_COMPONENTS);

const SETTINGS_TEMPLATE = [
  {
    key: "autoOptimize_shortcut",
    text: "React Native Optimize Imports",
    value: autoOptimize_defaultShortcut,
    info: "Shortcut key to rewrite and clean imports (e.g.: Alt-M)",
    prompt: true,
    promptType: "text"
  },
  {
    key: "show_import_toast",
    text: "Show Import Notifications",
    value: true,
    info: "Display a toast notification with the added/optimized imports",
    checkbox: true
  }
];

/* ---------------------------------------------------------
 * Yardımcı fonksiyonlar
 * --------------------------------------------------------- */

function getPrevNonSpaceChar(text, index) {
  let i = index - 1;

  while (i >= 0 && /\s/.test(text.charAt(i))) {
    i--;
  }

  return text.charAt(i) || "";
}

function getNextNonSpaceChar(text, index, wordLen) {
  let i = index + wordLen;

  while (i < text.length && /\s/.test(text.charAt(i))) {
    i++;
  }

  return text.charAt(i) || "";
}

/* ---------------------------------------------------------
 * Mevcut importları temizle
 * --------------------------------------------------------- */

function removeExistingImport(text, moduleName) {
  const escapedModule = moduleName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

  // Sadece ilgili modüle ait import bloğunu yakalar, diğer importlara asla dokunmaz
  const regex = new RegExp(
    `^import\\s+(?:(?:\\*\\s*as\\s+[A-Za-z0-9_]+|[A-Za-z0-9_]+)\\s*,?)?\\s*(?:\\{[^}]*\\})?\\s*from\\s+['"]${escapedModule}['"]\\s*;?\\r?\\n?`,
    "gm"
  );

  let defaultImport = null;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !match[1].includes("*")) {
      defaultImport = match[1].trim();
    }
  }

  const cleanedText = text.replace(regex, "");

  return {
    cleanedText,
    defaultImport
  };
}

/* ---------------------------------------------------------
 * Import formatlama
 * --------------------------------------------------------- */

function formatImportStatement(defaultImport, namedImports, moduleName) {
  const sortedNamed = Array.from(new Set(namedImports)).sort();

  const parts = [];

  if (defaultImport) {
    parts.push(defaultImport);
  }

  if (sortedNamed.length > 0) {
    parts.push(`{ ${sortedNamed.join(", ")} }`);
  }

  if (parts.length === 0) {
    return "";
  }

  const singleLine = `import ${parts.join(", ")} from "${moduleName}";`;

  if (singleLine.length > 80 && sortedNamed.length > 0) {
    const defaultPart = defaultImport ? `${defaultImport}, ` : "";

    return (
      `import ${defaultPart}{\n` +
      `  ${sortedNamed.join(",\n  ")}\n` +
      `} from "${moduleName}";`
    );
  }

  return singleLine;
}

/* ---------------------------------------------------------
 * Importların ekleneceği konumu bul
 * --------------------------------------------------------- */

function getInsertPosition(text) {
  // Başka bir import satırını atlamadan her bir import bloğunu güvenle yakalar
  const importRegex =
    /^import\s+(?:(?!^import\s)[\s\S])*?from\s+['"][^'"]+['"]\s*;?/gm;

  let lastMatch = null;
  let match;

  while ((match = importRegex.exec(text)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    return lastMatch.index + lastMatch[0].length + 1;
  }

  return 0;
}

/* ---------------------------------------------------------
 * ANA IMPORT OPTİMİZASYON MOTORU
 * --------------------------------------------------------- */

function rewriteImportsFromScratch(editor) {
  const fullText = editor.session.getValue();

  /*
   * Mevcut React ve React Native importlarını
   * taramadan önce kaldırıyoruz.
   *
   * Böylece eski importlar kullanım taramasını etkilemiyor.
   */
  const reactCleanForScan = removeExistingImport(fullText, "react").cleanedText;

  const cleanFullTextForScan = removeExistingImport(
    reactCleanForScan,
    "react-native"
  ).cleanedText;

  const usedRN = new Set();
  const usedReact = new Set();

  const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;

  let match;

  /* -------------------------------------------------------
   * Kod taraması
   * ------------------------------------------------------- */

  while ((match = wordRegex.exec(cleanFullTextForScan)) !== null) {
    const word = match[0];
    const index = match.index;

    const exactPrev = cleanFullTextForScan.charAt(index - 1);

    const prevChar = getPrevNonSpaceChar(cleanFullTextForScan, index);

    const nextChar = getNextNonSpaceChar(
      cleanFullTextForScan,
      index,
      word.length
    );

    /*
     * Bir property ise import edilmez.
     *
     * Örneğin:
     *
     * Something.View
     *
     * buradaki View import olarak kabul edilmez.
     */
    if (exactPrev === ".") {
      continue;
    }

    /*
     * JSX etiketi
     *
     * <View>
     * </View>
     *
     * gibi kullanımları yakalar.
     */
    const exactPrevPrev = cleanFullTextForScan.charAt(index - 2);

    const isJSX =
      exactPrev === "<" || (exactPrev === "/" && exactPrevPrev === "<");

    /*
     * API/property kullanımı
     *
     * Örneğin:
     *
     * StyleSheet.create()
     *
     * burada StyleSheet'in arkasındaki "." API
     * kullanımını desteklemek için korunuyor.
     */
    const isAPI = nextChar === ".";

    /*
     * Kod referansı.
     *
     * Örneğin:
     *
     * const x = View;
     * return View;
     * foo(View);
     *
     */
    const codeRegex = /[{}[\]()=,:;?|&!+\-]/;

    const isCodeRef = codeRegex.test(prevChar) || codeRegex.test(nextChar);

    const isRN = RN_COMPONENTS_SET.has(word);

    const isReact = REACT_EXPORTS_SET.has(word);

    if (!isRN && !isReact) {
      continue;
    }

    /*
     * React Native component / API
     */
    if (isRN) {
      if (isJSX || isAPI || isCodeRef) {
        usedRN.add(word);
      }
    }

    /*
     * React named export
     *
     * Örneğin:
     *
     * useState
     * useEffect
     * useMemo
     *
     * gibi kullanımlar.
     */
    if (isReact) {
      if (isJSX || isAPI || isCodeRef) {
        usedReact.add(word);
      }
    }
  }

  /* -------------------------------------------------------
   * IMPORT OLUŞTURMA
   *
   * ÖNEMLİ:
   *
   * Burada defaultImport = null.
   *
   * Dolayısıyla:
   *
   * import React from 'react';
   *
   * ASLA oluşturulmaz.
   * ------------------------------------------------------- */

  const newReactLine = formatImportStatement(null, [...usedReact], "react");

  const newRNLine = formatImportStatement(null, [...usedRN], "react-native");

  let fullImportBlock = "";

  if (newReactLine) {
    fullImportBlock += newReactLine + "\n";
  }

  if (newRNLine) {
    fullImportBlock += newRNLine + "\n";
  }

  /* -------------------------------------------------------
   * Sadece ilk 100 satırı import bölgesi olarak işle
   * ------------------------------------------------------- */

  const Range = ace.require("ace/range").Range;

  const totalLines = editor.session.getLength();

  const limitLine = Math.min(100, totalLines);

  if (limitLine === 0) {
    return {
      changed: false,
      react: [...usedReact],
      rn: [...usedRN]
    };
  }

  const topTextRange = new Range(
    0,
    0,
    limitLine - 1,
    editor.session.getLine(limitLine - 1).length
  );

  const topText = editor.session.getTextRange(topTextRange);

  /*
   * Üst bölümdeki eski React importunu kaldır.
   */
  const reactCleanTop = removeExistingImport(topText, "react");

  /*
   * Üst bölümdeki eski React Native importunu kaldır.
   */
  const rnCleanTop = removeExistingImport(
    reactCleanTop.cleanedText,
    "react-native"
  );

  const currentTopCode = rnCleanTop.cleanedText;

  const insertPos = getInsertPosition(currentTopCode);

  let finalTopCode = currentTopCode;

  if (insertPos === 0) {
    finalTopCode = fullImportBlock + currentTopCode;
  } else {
    finalTopCode =
      currentTopCode.substring(0, insertPos) +
      fullImportBlock +
      currentTopCode.substring(insertPos);
  }

  if (topText !== finalTopCode) {
    editor.session.replace(topTextRange, finalTopCode);

    return {
      changed: true,
      react: [...usedReact],
      rn: [...usedRN]
    };
  }

  return {
    changed: false
  };
}

/* ---------------------------------------------------------
 * TOAST
 * --------------------------------------------------------- */

function notifyImportChanges(result, isManual = false) {
  const appSettings = acode.require("settings");

  const showToast = appSettings.value[PLUGIN_ID]?.show_import_toast !== false;

  if (!result.changed) {
    if (isManual) {
      window.toast?.("Imports are already optimal!");
    }

    return;
  }

  if (showToast) {
    let details = [];

    if (result.react?.length > 0) {
      details.push(result.react.join(", "));
    }

    if (result.rn?.length > 0) {
      details.push(result.rn.join(", "));
    }

    const msg =
      details.length > 0
        ? "🔄 Imports Added"
        : "🔄 Imports cleaned (Unused imports removed)";

    window.toast?.(msg);
  } else if (isManual) {
    window.toast?.("🔄 Imports optimized!");
  }
}

/* ---------------------------------------------------------
 * PLUGIN
 * --------------------------------------------------------- */

class RNAutoImportPlugin {
  async init() {
    this.appSettings = acode.require("settings");

    if (!this.appSettings.value[PLUGIN_ID]) {
      this.appSettings.value[PLUGIN_ID] = {};
    }

    const savedSettings = this.appSettings.value[PLUGIN_ID];

    const currentValidKeys = SETTINGS_TEMPLATE.map(item => item.key);

    let isHafizaGuncellendi = false;

    Object.keys(savedSettings).forEach(savedKey => {
      if (!currentValidKeys.includes(savedKey)) {
        delete savedSettings[savedKey];
        isHafizaGuncellendi = true;
      }
    });

    SETTINGS_TEMPLATE.forEach(templateItem => {
      if (!(templateItem.key in savedSettings)) {
        savedSettings[templateItem.key] = templateItem.value;

        isHafizaGuncellendi = true;
      }
    });

    if (isHafizaGuncellendi) {
      this.appSettings.update(false);
    }

    this.registerCommands(savedSettings.autoOptimize_shortcut);

    this.onSaveHandler = this.performAutoOptimizeOnSave.bind(this);

    editorManager.on("save-file", this.onSaveHandler);
  }

  /* -------------------------------------------------------
   * SAVE
   * ------------------------------------------------------- */

  performAutoOptimizeOnSave() {
    try {
      const activeFile = editorManager.activeFile;

      if (!activeFile) {
        return;
      }

      const ext = (activeFile.filename || activeFile.name || "")
        .split(".")
        .pop()
        .toLowerCase();

      if (!["jsx", "tsx"].includes(ext)) {
        return;
      }

      const editor = editorManager.editor;

      if (!editor?.session?.getValue().trim()) {
        return;
      }

      const result = rewriteImportsFromScratch(editor);

      notifyImportChanges(result, false);
    } catch (err) {
      console.error("[Auto Import Save Hook] Error:", err);
    }
  }

  /* -------------------------------------------------------
   * MANUAL
   * ------------------------------------------------------- */

  performManualOptimize() {
    try {
      const activeFile = editorManager.activeFile;

      if (!activeFile) {
        return window.toast?.("No open files found!");
      }

      const ext = (activeFile.filename || activeFile.name || "")
        .split(".")
        .pop()
        .toLowerCase();

      if (!["jsx", "tsx"].includes(ext)) {
        return window.toast?.("Only JS/TS/JSX/TSX files!");
      }

      const editor = editorManager.editor;

      if (!editor?.session?.getValue().trim()) {
        return window.toast?.("File is empty!");
      }

      const result = rewriteImportsFromScratch(editor);

      notifyImportChanges(result, true);
    } catch (err) {
      console.error("[Manual Optimize] Error:", err);

      window.toast?.("Error: " + err.message);
    }
  }

  /* -------------------------------------------------------
   * COMMANDS
   * ------------------------------------------------------- */

  registerCommands(optimizeShortcut) {
    const commands = acode.require("commands");

    const editorCommands = editorManager.editor?.commands;

    const optimizeCmd = {
      name: COMMAND_NAME_OPTIMIZE,

      description: "React Native Optimize Imports",

      bindKey: {
        win: optimizeShortcut,
        mac: optimizeShortcut.replace("Alt", "Command")
      },

      exec: this.performManualOptimize.bind(this)
    };

    if (commands) {
      commands.removeCommand(COMMAND_NAME_OPTIMIZE);

      commands.removeCommand("rn-auto-import");

      commands.removeCommand("rn-auto-remove-unused-imports");

      commands.addCommand(optimizeCmd);
    }

    if (editorCommands) {
      editorCommands.removeCommand(COMMAND_NAME_OPTIMIZE);

      editorCommands.removeCommand("rn-auto-import");

      editorCommands.removeCommand("rn-auto-remove-unused-imports");

      editorCommands.addCommand(optimizeCmd);
    }
  }

  /* -------------------------------------------------------
   * DESTROY
   * ------------------------------------------------------- */

  destroy() {
    const commands = acode.require("commands");

    const editorCommands = editorManager.editor?.commands;

    if (commands) {
      commands.removeCommand(COMMAND_NAME_OPTIMIZE);
    }

    if (editorCommands) {
      editorCommands.removeCommand(COMMAND_NAME_OPTIMIZE);
    }

    if (this.onSaveHandler) {
      editorManager.off("save-file", this.onSaveHandler);
    }

    if (this.appSettings && this.appSettings.value[PLUGIN_ID]) {
      delete this.appSettings.value[PLUGIN_ID];

      this.appSettings.update(false);
    }
  }
}

/* ---------------------------------------------------------
 * PLUGIN REGISTER
 * --------------------------------------------------------- */

if (window.acode) {
  const pluginInstance = new RNAutoImportPlugin();

  const appSettings = acode.require("settings");

  const pluginSettingsObj = {
    get list() {
      return SETTINGS_TEMPLATE.map(item => ({
        ...item,

        value: appSettings.value[PLUGIN_ID]?.[item.key] ?? item.value
      }));
    },

    cb: (key, value) => {
      try {
        if (!appSettings.value[PLUGIN_ID]) {
          appSettings.value[PLUGIN_ID] = {};
        }

        appSettings.value[PLUGIN_ID][key] = value;

        appSettings.update(false);

        if (key === "autoOptimize_shortcut") {
          pluginInstance.registerCommands(value);

          window.toast?.(`Optimize Imports key updated: ${value}`, 1000);
        } else if (key === "show_import_toast") {
          window.toast?.(
            value
              ? "Import Notifications Enabled"
              : "Import Notifications Disabled",
            1000
          );
        }
      } catch (err) {
        console.error("Error while updating settings:", err);
      }
    }
  };

  acode.setPluginInit(
    PLUGIN_ID,
    () => pluginInstance.init(),
    pluginSettingsObj
  );

  acode.setPluginUnmount(PLUGIN_ID, () => pluginInstance.destroy());

  window.toast("React Native Auto Import Active!", 1000);
}

/* ---------------------------------------------------------
 * Mevcut importları güvenli bir şekilde temizle
 * --------------------------------------------------------- */

/* ---------------------------------------------------------
 * Importların ekleneceği konumu bul (Güvenli sınır korumalı)
 * --------------------------------------------------------- */
