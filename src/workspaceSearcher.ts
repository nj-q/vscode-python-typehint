import { Uri, workspace } from "vscode";
import { TypeSearch } from "./typeSearch";

/**
 * Searches Python files in the workspace.
 */
export class WorkspaceSearcher {

    private search: boolean = true;
    private activeDocUri: Uri;

    private fileSearchLimit = 150;   // TODO: config

    /**
     * Constructs a new WorkspaceSearcher.
     * 
     * @param activeDocumentUri The uri of the active document.
     */
    constructor(activeDocumentUri: Uri) {
        this.activeDocUri = activeDocumentUri;
    }

    /**
     * Searches documents, excluding the active one, for a previously hinted parameter with the same name.
     * 
     * @param param The parameter name.
     * @param documentText The source code of the active document.
     * @returns The type of the found parameter or null.
     */
    public async findHintOfSimilarParam(param: string, activeDocumentText: string): Promise<string | null> {
        this.search = true;
        
        if (workspace.workspaceFolders) {
            const uris = (await workspace.findFiles("**/*.py", null, this.fileSearchLimit))
                .filter(u => u.path !== this.activeDocUri.path);

            for (let i = 0; this.search && i < uris.length; i++) {
                let doc = await workspace.openTextDocument(uris[i]);
                let docText = doc.getText();
                let type = TypeSearch.hintOfSimilarParam(param, docText);
                if (type) {
                    if (type = TypeSearch.findImport(type, activeDocumentText, false)) {
                        return type;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Stops all searches.
     */
    public stopSearches() {
        this.search = false;
    }
}