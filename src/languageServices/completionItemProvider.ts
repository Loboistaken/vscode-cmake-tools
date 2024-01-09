import * as vscode from "vscode";
import { cmFunctionInsertText, cmModuleInsertText, cmPropetryInsertText, cmVariableInsertText, cmakeHelpMethod, cmakeTypeFromvscodeKind, cmake_help_command_list, cmake_help_module_list, cmake_help_property_list, cmake_help_variable_list, strContains, suggestionsHelper } from "./utils";

export class CMakeSuggestionSupport implements vscode.CompletionItemProvider {
    public triggerCharacters: string[] = [];
    public excludeTokens: string[] = ["string", "comment", "numeric"];

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Thenable<vscode.CompletionItem[]> {
        const wordAtPosition = document.getWordRangeAtPosition(position);
        let currentWord = "";
        if (
            wordAtPosition &&
            wordAtPosition.start.character < position.character
        ) {
            const word = document.getText(wordAtPosition);
            currentWord = word.substr(
                0,
                position.character - wordAtPosition.start.character
            );
        }

        return new Promise(function (resolve, reject) {
            Promise.all([
                cmCommandsSuggestions(currentWord),
                cmVariablesSuggestions(currentWord),
                cmPropertiesSuggestions(currentWord),
                cmModulesSuggestions(currentWord)
            ])
                .then(function (results) {
                    const suggestions = Array.prototype.concat.apply(
                        [],
                        results
                    );
                    resolve(suggestions);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    public async resolveCompletionItem(
        item: vscode.CompletionItem,
        _token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem> {
        const type = cmakeTypeFromvscodeKind(item.kind);

        const result = await cmakeHelpMethod(type, item.label as string);
        item.documentation = result.split("\n")[3];
        return item;
    }
}

export async function cmCommandsSuggestions(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_command_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "function",
        cmFunctionInsertText,
        strContains
    );
}

export async function cmVariablesSuggestions(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_variable_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "variable",
        cmVariableInsertText,
        strContains
    );
}

export async function cmPropertiesSuggestions(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_property_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "property",
        cmPropetryInsertText,
        strContains
    );
}

export async function cmModulesSuggestions(
    currentWord: string
): Promise<vscode.CompletionItem[]> {
    const cmd = await cmake_help_module_list();
    return suggestionsHelper(
        cmd,
        currentWord,
        "module",
        cmModuleInsertText,
        strContains
    );
}
