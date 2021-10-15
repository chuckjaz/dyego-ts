import { Element } from "../ast";
import { File, FileSet } from "../files";

class Module {
    qualifiedName: string
    file: File
    elements: Element[]

    constructor(qualifiedName: string, file: File, elements: Element[]) {
        this.qualifiedName = qualifiedName
        this.file = file
        this.elements = elements
    }
}

class TypeContext {
    fileSet: FileSet
    modules: Module[]

    constructor(fileSet: FileSet, modules: Module[]) {
        this.fileSet = fileSet
        this.modules = modules
    }
}