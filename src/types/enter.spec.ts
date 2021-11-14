import { DefinitionKind, MemberKind, MemberSymbol, TypeBuilder } from "."
import { FileSet } from "../files"
import { parse } from "../parser"
import { Scanner } from "../scanner"
import { Module, TypeContext, TypeContext0 } from "./context"
import { enterTypes } from "./enter"
import { validate } from "./validate"
import { readFileSync } from 'fs'

describe("simple", () => {
    it("can enter a value type", () => {
        const context = e("let a = < >")
        const symbol = f(context, "test.a")
        expect(symbol.member.kind).toBe(MemberKind.Definition)
    })
    it("can enter a contraint", () => {
        const context = e("let a = <* *>")
        const symbol = f(context, "test.a")
        expect(symbol.member.kind).toBe(MemberKind.Definition)
    })
    it("can enter a nested type", () => {
        const context = e("let a = < let b = < > >")
        const symbol = f(context, "test.a.b")
        expect(symbol.member.kind).toBe(MemberKind.Definition)
    })
})

describe("type parameters", () => {
    it("can enter a type parameter", () => {
        const context = e("let a = < b: type -> let a = b >")
        const builder = b(context, f(context, "test.a"))
        const parameter = builder.typeParameters.find("b")
        if (!parameter) throw Error("Could not find paramter")
        expect(parameter.typeParameter).not.toBeNull()
    })
})

describe("multiple files", () => {
    it("can enter multiple files", () => {
        const context = e({
            "src": {
                "file1.dg": "let a = < >",
                "file2.dg": "let b = < >"
            }
        })
        const a = f(context, "src.file1.a")
        expect(a.member.kind).toBe(MemberKind.Definition)
        const b = f(context, "src.file2.b")
        expect(b.member.kind).toBe(MemberKind.Definition)
    })
})

describe("examples", () => {
    it("can enter buildins.dg", () => {
        const context = e({
            "src": {
                "builtins.dg": readFileSync("examples/builtins.dg", 'utf8')
            }
        })
    })
})

describe("errors", () => {
    it("can detect a duplicate symbol", () => {
        err("let a = 1, let a = 2", "Duplicate symbol")
    })
})

function p(p1: string | TypeContext | Directory): TypeContext {
    let context: TypeContext
    if (typeof p1 == "string") {
        const fileSet = new FileSet()
        const fileBuilder = fileSet.buildFile("text.dg", p1.length)
        const scanner = new Scanner(p1, fileBuilder)
        const elements = parse(scanner)
        context = new TypeContext(fileSet, [
            {
                qualifiedName: "test",
                file: fileBuilder.build(),
                elements
            }
        ])
    } else if (p1 instanceof TypeContext) {
        context = p1
    } else {
        context = d(p1)
    }
    const context0 = validate(context)
    if (!context0) {
        noErrors(context)
        return context
    }
    enterTypes(context0)
    return context
}

function noErrors(context: TypeContext | TypeContext0) {
    if (context.diagnostics.length) {
        throw Error(`contains invalid nodes: ${
            context.diagnostics.map(d => `${
                context.fileSet.position(d.location).display()
            }: ${d.message}${
                d.additional.length ? ` (${
                    d.additional.map(a => context.fileSet.position(a).display()).join(", ")
                })` : ''
            }` ).join(", ")
        }`)
    }
}

function e(p1: string | TypeContext | Directory): TypeContext {
    const context = p(p1)
    noErrors(context)
    return context
}

function err(p1: string | TypeContext | Directory, expected: string) {
    const context = p(p1)
    for (let diagnostic of context.diagnostics) {
        if (diagnostic.message == expected) return
    }
    throw Error(`Expected "${expected}" as an error, ${context.diagnostics.length} others found`)
}

interface FileDef {
    fullName: string
    fqName: string
    source: string
}

function d(directory: Directory) {
    const files: FileDef[] = []

    function dir(baseFileName: string, baseFqName: string, directory: Directory) {
        for (const name in directory) {
            const value = directory[name]
            const fullName = baseFileName + name
            if (typeof value == "string") {
                if (name.endsWith(".dg")) {
                    const fqName = baseFqName + name.substr(0, name.length - 3)
                    files.push({ fullName, fqName, source: value })
                }
            } else {
                dir(fullName + "/", baseFqName + name + ".", value)
            }
        }
    }

    dir("", "", directory)

    const fileSet = new FileSet()
    const modules: Module[] = []
    for (const file of files) {
        const fileBuilder = fileSet.buildFile(file.fullName, file.source.length)
        const scanner = new Scanner(file.source, fileBuilder)
        const elements = parse(scanner)
        modules.push({
            qualifiedName: file.fqName,
            file: fileBuilder.build(),
            elements
        })
    }
    return new TypeContext(fileSet, modules)
}

function f(context: TypeContext, fqName: string): MemberSymbol {
    let current = context.global
    let names = fqName.split(".")
    if (!names.length) throw Error("no names in fqName")
    let modules = names.length > 1 ? names.slice(0, names.length - 1) : []
    let symbolName = names[names.length - 1]
    for (let name of modules) {
        const module = current.members.find(name)
        if (!module) throw Error(`Symbol "${name}" not found`)
        current = b(context, module)
    }
    const result = current.members.find(symbolName)
    if (!result) throw Error(`Symbol "${symbolName}" could not be found`)
    return result
}

function b(context: TypeContext, symbol: MemberSymbol): TypeBuilder {
    const member = symbol.member
    if (member.kind != MemberKind.Definition) throw Error("Expected a defintion")
    const definition = member.definition
    if (definition.kind != DefinitionKind.ValueType && definition.kind != DefinitionKind.MutableType) 
        throw Error("Expected a defintion")
    const typeSymbol = definition.type
    const moduleBuilder = context.builders.get(typeSymbol)
    if (!moduleBuilder) throw Error(`Builder for  "${symbol.name}" could not be found"`)
    return moduleBuilder
}

type Directory = { [name: string]: string | Directory }