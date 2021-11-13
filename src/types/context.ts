import { typeBuilder, TypeBuilder, TypeKind, TypeSymbol } from ".";
import { Element } from "../ast";
import { ToElement0 } from "./ast0"
import { File, FileSet, Location } from "../files";

export type Module = Readonly<{
    qualifiedName: string
    file: File
    elements: Element[]
}>

export type Module0 = ToElement0<Module>
type OnlyModule0<T> = T extends Module ? Module0 : T extends Module[] ? Module0[] : T

export type ToModule0<T> = {
    [P in keyof T]: OnlyModule0<T[P]>
}

export const enum DiagnosticKind {
    Error,
    Warning,
}

export type Diagnostic = Readonly<{
    kind: DiagnosticKind
    location: Location
    message: string
    additional: Location[]
}>

export class TypeContext {
    fileSet: FileSet
    modules: Module[]
    globalSymbol: TypeSymbol = { name: "global", location: { start: -1, end: -1 } }
    global = typeBuilder(this as TypeContext0, TypeKind.Module, this.globalSymbol)
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

export type TypeContext0 = Readonly<ToModule0<TypeContext>>