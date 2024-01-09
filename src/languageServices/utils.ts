// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { extensionManager } from "@cmt/extension";
import * as proc from "../proc";
import * as vscode from "vscode";

/// strings Helpers
export function strContains(word: string, pattern: string): boolean {
    return word.indexOf(pattern) > -1;
}

function strEquals(word: string, pattern: string): boolean {
    return word === pattern;
}

// copied from https://stackoverflow.com/questions/13796594/how-to-split-string-into-arguments-and-options-in-javascript
function commandArgs2Array(text: string): string[] {
    const re = /^"[^"]*"$/; // Check if argument is surrounded with double-quotes
    const re2 = /^([^"]|[^"].*?[^"])$/; // Check if argument is NOT surrounded with double-quotes

    const arr: string[] = [];
    let argPart: string = "";

    if (text) {
        text.split(" ").forEach(function (arg) {
            if ((re.test(arg) || re2.test(arg)) && !argPart) {
                arr.push(arg);
            } else {
                argPart = argPart ? argPart + " " + arg : arg;
                // If part is complete (ends with a double quote), we can add it to the array
                if (/"$/.test(argPart)) {
                    arr.push(argPart);
                    argPart = "";
                }
            }
        });
    }

    return arr;
}

/// Cmake process helpers

async function cmake(args: string[]): Promise<string> {
    const cmakePath = extensionManager?.getRawCMakePath();
    if (cmakePath) {
        const cmakeArgs = commandArgs2Array(cmakePath);
        const execResult = await proc.execute(cmakeArgs[0], cmakeArgs.slice(1, cmakeArgs.length).concat(args.map((arg) => arg.replace(/\r/gm, "")))).result;
        if (execResult.retc === 0) {
            return execResult.stdout;
        } else {
            await vscode.window.showInformationMessage(
                'The "cmake" command is not found in PATH.  Install it or use `cmake.cmakePath` in the workspace settings to define the CMake executable binary.'
            );
        }
    }
    return "";
}

function _extractVersion(output: string): string {
    const re = /cmake\s+version\s+(\d+.\d+.\d+)/;
    if (re.test(output)) {
        const result = re.exec(output);
        if (result !== null && result !== undefined && result.length >= 2) {
            return result[1];
        }
        return "";
    }
    return "";
}

async function cmake_version(): Promise<string> {
    const cmd_output = await cmake(["--version"]);
    const version = _extractVersion(cmd_output);
    return version;
}

// Return the url for the online help based on the cmake executable binary used
async function cmake_help_url() {
    const base_url = "https://cmake.org/cmake/help";
    let version = await cmake_version();
    if (version.length > 0) {
        if (version >= "3.0") {
            const re = /(\d+.\d+).\d+/;
            version = version.replace(re, "$1/");
        } else {
            const older_versions = [
                "2.8.12",
                "2.8.11",
                "2.8.10",
                "2.8.9",
                "2.8.8",
                "2.8.7",
                "2.8.6",
                "2.8.5",
                "2.8.4",
                "2.8.3",
                "2.8.2",
                "2.8.1",
                "2.8.0",
                "2.6"
            ];
            if (older_versions.indexOf(version) === -1) {
                version = "latest/";
            } else {
                version = version + "/cmake.html";
            }
        }
    } else {
        version = "latest/";
    }
    return base_url + "/v" + version;
}

// return the cmake command list
export function cmake_help_command_list(): Promise<string> {
    return cmake(["--help-command-list"]);
}

async function cmake_help_command(name: string): Promise<string> {
    const list = await cmake_help_command_list();
    const contains = list.indexOf(name) > -1;
    if (contains) {
        return cmake(["--help-command", name]);
    } else {
        return "not found";
    }
}

export function cmake_help_variable_list(): Promise<string> {
    return cmake(["--help-variable-list"]);
}

async function cmake_help_variable(name: string): Promise<string> {
    const list = await cmake_help_variable_list();
    const contains = list.indexOf(name) > -1;
    if (contains) {
        return cmake(["--help-variable", name]);
    } else {
        return "not found";
    }
}

export function cmake_help_property_list(): Promise<string> {
    return cmake(["--help-property-list"]);
}

async function cmake_help_property(name: string): Promise<string> {
    const list = await cmake_help_property_list();
    const contains = list.indexOf(name) > -1;
    if (contains) {
        return cmake(["--help-property", name]);
    } else {
        return "not found";
    }
}

export function cmake_help_module_list(): Promise<string> {
    return cmake(["--help-module-list"]);
}

async function cmake_help_module(name: string): Promise<string> {
    const list = await cmake_help_module_list();
    const contains = list.indexOf(name) > -1;
    if (contains) {
        return cmake(["--help-module", name]);
    } else {
        return "not found";
    }
}

export function cmakeHelpMethod(type: string, name: string): Promise<string> {
    switch (type) {
        case "function":
            return cmake_help_command(name);
        case "module":
            return cmake_help_module(name);
        case "variable":
            return cmake_help_variable(name);
        case "property":
            return cmake_help_property(name);
    }
    return Promise.resolve("");
}

export async function cmake_online_help(search: string) {
    const url = await cmake_help_url();
    const v2x = url.endsWith("html"); // cmake < 3.0
    return Promise.all([
        cmCommandsSuggestionsExact(search),
        cmVariablesSuggestionsExact(search),
        cmModulesSuggestionsExact(search),
        cmPropertiesSuggestionsExact(search)
    ]).then(function (results) {
        const opener = require("opener");

        const suggestions = Array.prototype.concat.apply([], results);

        if (suggestions.length === 0) {
            search = search.replace(/[<>]/g, "");
            if (v2x || search.length === 0) {
                opener(url);
            } else {
                opener(
                    url +
                        "search.html?q=" +
                        search +
                        "&check_keywords=yes&area=default"
                );
            }
        } else {
            const suggestion = suggestions[0];
            let type = cmakeTypeFromvscodeKind(suggestion.kind);
            if (type === "property") {
                if (v2x) {
                    opener(url);
                } else {
                    // TODO : needs to filter properties per scope to detect the right URL
                    opener(
                        url +
                            "search.html?q=" +
                            search +
                            "&check_keywords=yes&area=default"
                    );
                }
            } else {
                if (type === "function") {
                    type = "command";
                }
                search = search.replace(/[<>]/g, "");
                if (v2x) {
                    opener(url + "#" + type + ":" + search);
                } else {
                    opener(url + type + "/" + search + ".html");
                }
            }
        }
    });
}

function vscodeKindFromCMakeCodeClass(kind: string): vscode.CompletionItemKind {
    switch (kind) {
        case "function":
            return vscode.CompletionItemKind.Function;
        case "variable":
            return vscode.CompletionItemKind.Variable;
        case "module":
            return vscode.CompletionItemKind.Module;
    }
    return vscode.CompletionItemKind.Property; // TODO@EG additional mappings needed?
}

export function cmakeTypeFromvscodeKind(kind: vscode.CompletionItemKind | undefined): string {
    switch (kind) {
        case vscode.CompletionItemKind.Function:
            return "function";
        case vscode.CompletionItemKind.Variable:
            return "variable";
        case vscode.CompletionItemKind.Module:
            return "module";
    }
    return "property";
}

export function suggestionsHelper(
    cmake_cmd: string,
    currentWord: string,
    type: string,
    insertText: (str: string) => string,
    matchPredicate: (word: string, pattern: string) => boolean
): vscode.CompletionItem[] {
    const commands = cmake_cmd.split("\n").filter((v) => matchPredicate(v, currentWord));
    if (commands.length > 0) {
        const suggestions = commands.map(function (command_name) {
            const item = new vscode.CompletionItem(command_name);
            item.kind = vscodeKindFromCMakeCodeClass(type);
            if (insertText === null) {
                item.insertText = command_name;
            } else {
                const snippet = new vscode.SnippetString(insertText(command_name));

                item.insertText = snippet;
            }
            return item;
        });
        return suggestions;
    }

    return [];
}
export function cmModuleInsertText(module: string) {
    if (module.indexOf("Find") === 0) {
        return "find_package(" + module.replace("Find", "") + "${1: REQUIRED})";
    } else {
        return "include(" + module + ")";
    }
}

export function cmFunctionInsertText(func: string) {
    const scoped_func = ["if", "function", "while", "macro", "foreach"];
    const is_scoped = scoped_func.reduceRight(function (prev, name, _idx, _array) {
        return prev || func === name;
    }, false);
    if (is_scoped) {
        return func + "(${1})\n\t\nend" + func + "(${1})\n";
    } else {
        return func + "(${1})";
    }
}
export function cmVariableInsertText(variable: string) {
    return variable.replace(/<(.*)>/g, "${1:<$1>}");
}
export function cmPropetryInsertText(variable: string) {
    return variable.replace(/<(.*)>/g, "${1:<$1>}");
}

export async function cmCommandsSuggestionsExact(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_command_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "function",
        cmFunctionInsertText,
        strEquals
    );
}

export async function cmVariablesSuggestionsExact(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_variable_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "variable",
        cmVariableInsertText,
        strEquals
    );
}

export async function cmPropertiesSuggestionsExact(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_property_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "property",
        cmPropetryInsertText,
        strEquals
    );
}

export async function cmModulesSuggestionsExact(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_module_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "module",
        cmModuleInsertText,
        strEquals
    );
}

// CMake Language Definition

// class CMakeLanguageDef  /*implements LanguageConfiguration*/ {
//         public comments = {
// 			lineComment: '#',
// 		}
//         public name:string = 'cmake';
//         public displayName:string= 'Cmake';
//         public ignoreCase: boolean = true;
//         public lineComment: string = '#';
//         public autoClosingPairs:string[][] = [
//             ['{', '}'],
//             ['"', '"']];
//        public keywords :string[] = [
//            'if', 'endif', 'else',
//            'foreach', 'endforeach',
//            'function', 'endfunction',
//            'macro', 'endmacro',
//            'include',
//            'set',
//            'project'
//        ];
//         public brackets = [
//             { token: 'delimiter.parenthesis', open: '(', close: ')' },
//         ];
//         public textAfterBrackets:boolean = true;
//         public variable= /\$\{\w+\}/;
//        public  enhancedBrackets = [
//             {
//                 openTrigger: '\)',
//                 open: /if\((\w*)\)/i,
//                 closeComplete: 'endif\($1\)',
//                 matchCase: true,
//                 closeTrigger: '\)',
//                 close: /endif\($1\)$/,
//                 tokenType: 'keyword.tag-if'
//             },
//             {
//                 openTrigger: '\)',
//                 open: /foreach\((\w*)\)/i,
//                 closeComplete: 'endforeach\($1\)',
//                 matchCase: true,
//                 closeTrigger: '\)',
//                 close: /endforeach\($1\)$/,
//                 tokenType: 'keyword.tag-foreach'
//             },
//             {
//                 openTrigger: '\)',
//                 open: /function\((\w+)\)/i,
//                 closeComplete: 'endfunction\($1\)',
//                 matchCase: true,
//                 closeTrigger: '\)',
//                 close: /function\($1\)$/,
//                 tokenType: 'keyword.tag-function'
//             },
//             {
//                 openTrigger: '\)',
//                 open: /macro\((\w+)\)/i,
//                 closeComplete: 'endmacro\($1\)',
//                 matchCase: true,
//                 closeTrigger: '\)',
//                 close: /macro\($1\)$/,
//                 tokenType: 'keyword.tag-macro'
//             }
//         ];

//         // we include these common regular expressions
//         public symbols = /[=><!~?&|+\-*\/\^;\.,]+/;
//         public escapes= /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/;
//         // The main tokenizer for our languages
//         public tokenizer= {
//             root: [
//                 [/([a-zA-Z_]\w*)( *\()/,  [{cases: { '@keywords': { token: 'keyword.$0' } , '@default': 'identifier.method'}}, '']],
//                 { include: '@whitespace' },
//                 [/\$\{\w+\}/, 'variable'],
//                 [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
//                 [/0[xX][0-9a-fA-F_]*[0-9a-fA-F]/, 'number.hex'],
//                 [/\d+/, 'number'],
//                 [/"/, 'string', '@string."'],
//                 [/'/, 'string', '@string.\''],
//             ],
//             whitespace: [
//                 [/[ \t\r\n]+/, ''],
//                 [/#.*$/, 'comment'],
//             ],
//             string: [
//                 [/[^\\"'%]+/, { cases: { '@eos': { token: 'string', next: '@popall' }, '@default': 'string' } }],
//                 [/@escapes/, 'string.escape'],
//                 [/\\./, 'string.escape.invalid'],
//                 [/\$\{[\w ]+\}/, 'variable'],
//                 [/["']/, { cases: { '$#==$S2': { token: 'string', next: '@pop' }, '@default': 'string' } }],
//                 [/$/, 'string', '@popall']
//             ],
//         };
//     }
