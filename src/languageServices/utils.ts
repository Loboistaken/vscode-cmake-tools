export function suggestionHelper(cmakeCmd: string, currentWord: string, type: string, insertText: string, matchPredicate: any): Promise<any> {
    
    return Promise.resolve(false);
}

function commandArgs2Array(text: string): string[] {
    const re = /^"[^"]*"$/; // Check if argument is surrounded with double-quotes
    const re2 = /^([^"]|[^"].*?[^"])$/; // Check if argument is NOT surrounded with double-quotes

    let arr: string[] = [];
    let argPart: string = "";

    text && text.split(" ").forEach(function(arg) {
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
    return arr;
}

/*
function cmModuleInsertText(module: string) {
    if (module.indexOf('Find') == 0) {
        return 'find_package(' + module.replace('Find', '') + '${1: REQUIRED})';
    } else {
        return 'include(' + module + ')';
    }
}

function cmFunctionInsertText(func: string) {
    let scoped_func = ['if', 'function', 'while', 'macro', 'foreach'];
    let is_scoped = scoped_func.reduceRight(function (prev, name, idx, array) { return prev || func == name; }, false);
    if (is_scoped)
        return func + '(${1})\n\t\nend' + func + '(${1})\n';
    else
        return func + '(${1})'
}
function cmVariableInsertText(variable: string) {
    return variable.replace(/<(.*)>/g, '${1:<$1>}');
}
function cmPropetryInsertText(variable: string) {
    return variable.replace(/<(.*)>/g, '${1:<$1>}');
}

function cmCommandsSuggestions(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_command_list();
    return suggestionsHelper(cmd, currentWord, 'function', cmFunctionInsertText, strContains);
}

function cmVariablesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_variable_list();
    return suggestionsHelper(cmd, currentWord, 'variable', cmVariableInsertText, strContains);
}


function cmPropertiesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_property_list();
    return suggestionsHelper(cmd, currentWord, 'property', cmPropetryInsertText, strContains);
}

function cmModulesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_module_list();
    return suggestionsHelper(cmd, currentWord, 'module', cmModuleInsertText, strContains);
}

function cmCommandsSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_command_list();
    return suggestionsHelper(cmd, currentWord, 'function', cmFunctionInsertText, strEquals);
}

function cmVariablesSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_variable_list();
    return suggestionsHelper(cmd, currentWord, 'variable', cmVariableInsertText, strEquals);
}


function cmPropertiesSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_property_list();
    return suggestionsHelper(cmd, currentWord, 'property', cmPropetryInsertText, strEquals);
}

function cmModulesSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
    let cmd = cmake_help_module_list();
    return suggestionsHelper(cmd, currentWord, 'module', cmModuleInsertText, strEquals);
}

function vscodeKindFromCMakeCodeClass(kind: string): CompletionItemKind {
    switch (kind) {
        case "function":
            return CompletionItemKind.Function;
        case "variable":
            return CompletionItemKind.Variable;
        case "module":
            return CompletionItemKind.Module;
    }
    return CompletionItemKind.Property; // TODO@EG additional mappings needed?
}

function cmakeTypeFromvscodeKind(kind: CompletionItemKind): string {
    switch (kind) {
        case CompletionItemKind.Function:
            return "function";
        case CompletionItemKind.Variable:
            return "variable";
        case CompletionItemKind.Module:
            return "module";
    }
    return "property";
}

/// strings Helpers
function strContains(word, pattern) {
    return word.indexOf(pattern) > -1;
}

function strEquals(word, pattern) {
    return word == pattern;
}

/// configuration helpers
function config<T>(key: string, defaultValue?: any): T {
    const cmake_conf = workspace.getConfiguration('cmake');
    return cmake_conf.get<T>(key, defaultValue);
}

// copied from https://stackoverflow.com/questions/13796594/how-to-split-string-into-arguments-and-options-in-javascript
function commandArgs2Array(text: string): string[] {
    const re = /^"[^"]*"$/; // Check if argument is surrounded with double-quotes
    const re2 = /^([^"]|[^"].*?[^"])$/; // Check if argument is NOT surrounded with double-quotes
  
    let arr = [];
    let argPart = null;
  
    text && text.split(" ").forEach(function(arg) {
      if ((re.test(arg) || re2.test(arg)) && !argPart) {
        arr.push(arg);
      } else {
        argPart = argPart ? argPart + " " + arg : arg;
        // If part is complete (ends with a double quote), we can add it to the array
        if (/"$/.test(argPart)) {
          arr.push(argPart);
          argPart = null;
        }
      }
    });
    return arr;
  }

/// Cmake process helpers

// Simple helper function that invoke the CMAKE executable
// and return a promise with stdout
let cmake = (args: string[]): Promise<string> => {
    return new Promise(function (resolve, reject) {
        let cmake_config = config<string>('cmakePath', 'cmake');
        let cmake_args = commandArgs2Array(cmake_config)
        let cmd = child_process.spawn(cmake_args[0], cmake_args.slice(1, cmake_args.length)
                .concat(args.map(arg => { return arg.replace(/\r/gm, ''); })));
        let stdout: string = '';
        cmd.stdout.on('data', function (data) {
            var txt: string = data.toString();
            stdout += txt.replace(/\r/gm, '');
        });
        cmd.on("error", function (error) {
            if (error && (<any>error).code === 'ENOENT') {
                window.showInformationMessage('The "cmake" command is not found in PATH.  Install it or use `cmake.cmakePath` in the workspace settings to define the CMake executable binary.');
            }
            reject();
        });
        cmd.on('exit', function (code) {
            resolve(stdout);
        });
    });
}


function _extractVersion(output: string): string {
    let re = /cmake\s+version\s+(\d+.\d+.\d+)/;
    if (re.test(output)) {
        let result = re.exec(output);
        return result[1];
    }
    return '';
}

async function cmake_version(): Promise<string> {
    let cmd_output = await cmake(['--version']);
    let version = _extractVersion(cmd_output);
    return version;
}

// Return the url for the online help based on the cmake executable binary used
async function cmake_help_url() {
    let base_url = 'https://cmake.org/cmake/help';
    let version = await cmake_version();
    if (version.length > 0) {
        if (version >= '3.0') {
            let re = /(\d+.\d+).\d+/;
            version = version.replace(re, '$1/');
        } else {
            let older_versions = [
                '2.8.12', '2.8.11', '2.8.10', '2.8.9', '2.8.8', '2.8.7', '2.8.6', '2.8.5', '2.8.4', '2.8.3', '2.8.2', '2.8.1', '2.8.0', '2.6' 
            ];
            if (older_versions.indexOf(version) == -1) {
                version = 'latest/';
            } else {
                version = version + '/cmake.html';
            }
        }
    } else {
        version = 'latest/';
    }
    return base_url + '/v' + version;
}


// return the cmake command list
function cmake_help_command_list(): Promise<string> {
    return cmake(['--help-command-list']);
}

function cmake_help_command(name: string): Promise<string> {
    return cmake_help_command_list()
        .then(function (result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function (resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function (e) { })
        .then(function (n: string) {
            return cmake(['--help-command', n]);
        }, null);
}


function cmake_help_variable_list(): Promise<string> {
    return cmake(['--help-variable-list']);
}

function cmake_help_variable(name: string): Promise<string> {
    return cmake_help_variable_list()
        .then(function (result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function (resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function (e) { }).then(function (name: string) { return cmake(['--help-variable', name]); }, null);
}


function cmake_help_property_list(): Promise<string> {
    return cmake(['--help-property-list']);
}

function cmake_help_property(name: string): Promise<string> {
    return cmake_help_property_list()
        .then(function (result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function (resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function (e) { }).then(function (name: string) { return cmake(['--help-property', name]); }, null);
}

function cmake_help_module_list(): Promise<string> {
    return cmake(['--help-module-list']);
}

function cmake_help_module(name: string): Promise<string> {
    return cmake_help_module_list()
        .then(function (result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function (resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function (e) { }).then(function (name: string) { return cmake(['--help-module', name]); }, null);
}

function cmake_help_all() {
    let promises = {
        'function': (name: string) => {
            return cmake_help_command(name);
        },
        'module': (name: string) => {
            return cmake_help_module(name);
        },
        'variable': (name: string) => {
            return cmake_help_variable(name);
        }
        ,
        'property': (name: string) => {
            return cmake_help_property(name);
        }
    };
    return promises;
}

async function cmake_online_help(search: string) {
    let url = await cmake_help_url();
    let v2x = url.endsWith('html'); // cmake < 3.0 
    return Promise.all([
        cmCommandsSuggestionsExact(search),
        cmVariablesSuggestionsExact(search),
        cmModulesSuggestionsExact(search),
        cmPropertiesSuggestionsExact(search),
    ]).then(function (results) {
        var opener = require("opener");

        var suggestions = Array.prototype.concat.apply([], results);

        if (suggestions.length == 0) {
            search = search.replace(/[<>]/g, '');
            if (v2x || search.length == 0) {
                opener(url);
            } else {
                opener(url + 'search.html?q=' + search + '&check_keywords=yes&area=default');
            }
        } else {
            let suggestion = suggestions[0];
            let type = cmakeTypeFromvscodeKind(suggestion.kind);
            if (type == 'property') {
                if (v2x) {
                    opener(url);
                } else {
                    // TODO : needs to filter properties per scope to detect the right URL
                    opener(url + 'search.html?q=' + search + '&check_keywords=yes&area=default');
                }
            } else {
                if (type == 'function') {
                    type = 'command';
                }
                search = search.replace(/[<>]/g, '');
                if(v2x){
                    opener(url + '#' + type + ':' + search);                    
                }else {
                    opener(url + type + '/' + search + '.html');
                }
            }
        }
    });
}

*/