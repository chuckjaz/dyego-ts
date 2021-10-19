import { typeBuilder, TypeBuilder, TypeKind, TypeSymbol } from ".";
import { Element } from "../ast";
import { File, FileSet, Location } from "../files";

export interface Module {
    qualifiedName: string
    file: File
    elements: Element[]
}

export const enum DiagnosticKind {
    Error,
    Warning,
}

export interface Diagnostic {
    kind: DiagnosticKind
    location: Location
    message: string
    additional: Location[]
}

export class TypeContext {
    fileSet: FileSet
    modules: Module[]
    globalSymbol: TypeSymbol = { name: "global", location: { start: -1, end: -1 } }
    global = typeBuilder(this, TypeKind.Module, this.globalSymbol)
    builders = new Map<TypeSymbol, TypeBuilder>()
    diagnostics: Diagnostic[] = []
 
    constructor(fileSet: FileSet, modules: Module[]) {
        this.fileSet = fileSet
        this.modules = modules
    }

    report(kind: DiagnosticKind, location: Location, message: string, ...additional: Location[]) {
        this.diagnostics.push({ kind, message, location, additional })
    }

    reportError(location: Location, message: string, ...additional: Location[]) {
        this.diagnostics.push({ kind: DiagnosticKind.Error, message, location, additional })
    }
}