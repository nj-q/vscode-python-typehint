import {
    CancellationToken,
    CompletionContext,
    CompletionList,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    Position,
    TextLine,
    TextDocument
} from "vscode";
import { TypeHintProvider, TypeHint } from "./typeHintProvider";
import { paramHintTrigger, returnHintTrigger, PythonType } from "./python";


abstract class CompletionProvider {

    protected pushTypesToItems(typeNames: PythonType[], completionItems: CompletionItem[]) {
        for (const typeName of typeNames) {
            const item = new CompletionItem(typeName, CompletionItemKind.TypeParameter);
    
            // Add 999 to ensure they're sorted to the bottom of the CompletionList.
            item.sortText = `999${typeName}`;
            item.insertText = TypeHintProvider.insertTextFor(typeName);   
            completionItems.push(item);
        }
    }
}

/**
 * Provides one or more parameter type hint {@link CompletionItem}.
 */
export class ParamHintCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        if (context.triggerCharacter === paramHintTrigger) {
            const items: CompletionItem[] = [];
            const line = doc.lineAt(pos);
    
            if (this.shouldProvideItems(line, pos)) {
                const param = this.findParam(line, pos);
                const provider = new TypeHintProvider(doc);
        
                if (param && param.length > 0) {
                    try {
                        this.pushEstimationsToItems(await provider.getTypeHints(param), items); 
                    } catch (error) {
                    }     
                }
                this.pushTypesToItems(provider.getRemainingTypes(), items);
                return Promise.resolve(new CompletionList(items, false));
            }
        }
        return Promise.resolve(null);
    }

    /**
     * Finds the parameter which is about to be type hinted.
     * 
     * @param line The active line.
     * @param pos The active position.
     */
    private findParam(line: TextLine, pos: Position): string | null {
        let param = null;
        let split = line.text.substr(0, pos.character).split(new RegExp("[,(]"));
        if (split.length > 1) {
            param = split[split.length - 1].trim();
            param = param.substr(0, param.length - 1);
        }
        return param;
    }
    
    private pushEstimationsToItems(typeHints: TypeHint[], items: CompletionItem[]) {

        if (typeHints.length > 0) {
            let typeHint = typeHints[0].type;
            let item = new CompletionItem(typeHint, CompletionItemKind.TypeParameter);
            item.sortText = `0${typeHint}`;
            item.preselect = true;
            item.insertText = typeHints[0].insertText;
            items.push(item);

            for (let i = 1; i < typeHints.length; i++) {
                typeHint = typeHints[i].type;
                item = new CompletionItem(typeHint, CompletionItemKind.TypeParameter);
                item.sortText = `${i}${typeHint}`;
                item.insertText = typeHints[i].insertText;
                items.push(item);
            }       

        }
    }

    private shouldProvideItems(line: TextLine, pos: Position): boolean {

        if (pos.character > 0) {
            return new RegExp("^[ \t]*def", "m").test(line.text);
        }
        return false;
    }
}

/**
 * Provides one or more return type hint {@link CompletionItem}.
 */
export class ReturnHintCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        if (context.triggerCharacter !== returnHintTrigger) {
            return null;
        }
        const items: CompletionItem[] = [];
        const line = doc.lineAt(pos);

        if (this.shouldProvideItems(line, pos)) {         
            this.pushTypesToItems(Object.values(PythonType), items);
        }
        return Promise.resolve(new CompletionList(items, false));
    }

    private shouldProvideItems(line: TextLine, pos: Position): boolean {

        if (pos.character > 0 && line.text.substr(pos.character - 2, 2) === "->") {
            
            return new RegExp("^[ \t]*def.*\\) *->[: ]*$", "m").test(line.text);
        }
        return false;
    }
}