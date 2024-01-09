import * as vscode from "vscode";
import { cmCommandsSuggestionsExact, cmModulesSuggestionsExact, cmPropertiesSuggestionsExact, cmVariablesSuggestionsExact, cmakeHelpMethod, cmakeTypeFromvscodeKind } from "./utils";

// Show Tooltip on mouse over
export class CMakeExtraInfoSupport implements vscode.HoverProvider {
    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        const value = document.getText(range);

        const results = await Promise.all([
            cmCommandsSuggestionsExact(value),
            cmVariablesSuggestionsExact(value),
            cmModulesSuggestionsExact(value),
            cmPropertiesSuggestionsExact(value)
        ]);
        const suggestions = Array.prototype.concat.apply([], results);
        if (suggestions.length === 0) {
            return new vscode.Hover({
                language: "md",
                value: ""
            });
        }
        const suggestion: vscode.CompletionItem = suggestions[0];

        const result = await cmakeHelpMethod(
            cmakeTypeFromvscodeKind(suggestion.kind),
            suggestion.label as string
        );
        let lines = result.split("\n");
        lines = lines.slice(2, lines.length);
        const hover = new vscode.Hover({
            language: "md",
            value: lines.join("\n")
        });
        return hover;
    }
}
