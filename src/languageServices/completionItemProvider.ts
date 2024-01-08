/*import * as vscode from "vscode";

export class CMakeSuggestionSupport implements vscode.CompletionItemProvider {
    public triggerCharacters: string[] = [];
    public excludeTokens: string[] = ['string', 'comment', 'numeric'];
    
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        /*let wordAtPosition = document.getWordRangeAtPosition(position);
        var currentWord = '';
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            var word = document.getText(wordAtPosition);
            currentWord = word.substr(0, position.character - wordAtPosition.start.character);
        }

        return new Promise(function (resolve, reject) {
            Promise.all([
                cmCommandsSuggestions(currentWord),
                cmVariablesSuggestions(currentWord),
                cmPropertiesSuggestions(currentWord),
                cmModulesSuggestions(currentWord)
            ]).then(function (results) {
                var suggestions = Array.prototype.concat.apply([], results);
                resolve(suggestions);
            }).catch(err => { reject(err); });
        });

        return;
    }
    resolveCompletionItem?(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
        /*let promises = cmake_help_all();
        let type = cmakeTypeFromvscodeKind(item.kind);
        return promises[type](item.label).then(function (result: string) {
            item.documentation = result.split('\n')[3];
            return item;
        });
        return;
    }
    
}
*/