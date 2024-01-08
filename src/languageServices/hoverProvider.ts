import * as vscode from "vscode";

export class CMakeExtraInfoSupport implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        const value = document.getText(range);
        const promises = "test"; //cmake_help_all();

        return Promise.all([
            /*
            cmCommandsSuggestionsExact(value),
            cmVariablesSuggestionsExact(value),
            cmModulesSuggestionsExact(value),
            cmPropertiesSuggestionsExact(value),
            */
        ]).then(function (results) {
            const suggestions = Array.prototype.concat.apply([], results);
            if (suggestions.length === 0) {
                return null;
            }
            const suggestion: vscode.CompletionItem = suggestions[0];
            
            /* return promises[cmakeTypeFromvscodeKind(suggestion.kind)](suggestion.label).then(function (result: string) {
                let lines = result.split('\n');
                lines = lines.slice(2, lines.length);
                let hover = new Hover({ language: 'md', value: lines.join('\n') });                
                return hover;
            });*/           
            return null;
        });
    }
}