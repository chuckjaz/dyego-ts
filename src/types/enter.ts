import {
    DefinitionKind,
    Member,
    MemberKind,
    MemberSymbol,
    TypeBuilder,
    typeBuilder,
    TypeDefinition,
    TypeDefinitionKind,
    TypeKind,
    TypeParamater,
    TypeParameterSymbol,
    TypeSymbol,
    ValueFieldMember
} from ".";
import { error, required } from "../assert";
import {
    ConstraintLiteralElement,
    Element,
    ElementKind,
    LetDeclarationElement,
    Name,
    TypeLiteralElement,
    TypeParameterElement,
    ValDeclarationElement,
    VarDeclarationElement
} from "../ast";
import {
    Module,
    TypeContext
} from "./context";

/**
 * The first phase of type checking and binding.
 * 
 * Contruct type builders for all types and modules and create type symbols and module symbols.
 * 
 * @param context The typing context
 */
export function enterTypes(context: TypeContext) {
    context.builders.set(context.global.symbol, context.global)

    for (const module of context.modules) {
        enterModule(module, context.global)
    }

    function enterModule(module: Module, container: TypeBuilder) {
        let current = container
        let moduleLocation = module.file.location(0)
        for (const name of module.qualifiedName.split(".")) {
            let moduleSymbol = current.members.find(name)
            if (!moduleSymbol) {
                const typeSymbol = { name, location: moduleLocation }
                const builder = typeBuilder(context, TypeKind.Module, typeSymbol, current.symbol)
                context.builders.set(typeSymbol, builder)
                const typeDefinition: TypeDefinition = {
                    kind: DefinitionKind.MutableType,
                    type: typeSymbol
                }
                const definitionMember = {
                    kind: MemberKind.Definition,
                    definition: typeDefinition,
                } as Member
                const memberSymbol = { name, member: definitionMember, location: moduleLocation }
                bind(definitionMember, memberSymbol)
                current.addMember(memberSymbol)
                current = builder
            } else {
                current = requireTypeBuilderOf(context, current, name, TypeKind.Module)
            }
        }
        enterElements(module.elements, current)
    }

    function enterElements(elements: Element[], builder: TypeBuilder) {
        for (let element of elements) {
            enterElement(element, builder)
        }
    }

    function enterElement(element: Element, builder: TypeBuilder) {
        switch (element.kind) {
            case ElementKind.LetDeclaration:
                enterLetDeclaration(element, builder)
                break
            case ElementKind.ValDeclaration:
                enterValDeclaration(element, builder)
                break
            case ElementKind.VarDeclaration:
                enterVarDeclaration(element, builder)
                break
            case ElementKind.TypeParameter:
                enterTypeParameter(element, builder)
                break
        }
    }

    function enterValDeclaration(
        element: ValDeclarationElement,
        builder: TypeBuilder
    ) {
        enterFieldDeclaration(MemberKind.ValueField, element, builder)
    }

    function enterVarDeclaration(
        element: VarDeclarationElement,
        builder: TypeBuilder
    ) {
        enterFieldDeclaration(MemberKind.MutableField, element, builder)
    }

    function enterFieldDeclaration(
        kind: MemberKind,
        element: VarDeclarationElement | ValDeclarationElement,
        builder: TypeBuilder
    ) {
        const memberType = element.type
        const name = memberType ? memberType.kind == ElementKind.Name ? memberType.text : "" : ""
        const fieldTypeSymbol: TypeSymbol = {
            name,
            location: memberType || element
        }
        const member= {
            kind,
            type: fieldTypeSymbol
        } as ValueFieldMember
        const memberSymbol = {
            name: element.name.text,
            location: element.name,
            member
        }
        builder.addMember(memberSymbol)
    }

    function enterLetDeclaration(
        element: LetDeclarationElement,
        builder: TypeBuilder
    ) {
        if (element.type) return
        const initializer = element.initializer
        if (!initializer) return
        switch (initializer.kind) {
            case ElementKind.Name:
            case ElementKind.Selection:
            case ElementKind.AndType:
            case ElementKind.OrType:
            case ElementKind.Call:
            case ElementKind.Literal:
            case ElementKind.Lambda:
            case ElementKind.IntrinsicLambda:
            case ElementKind.Loop:
            case ElementKind.When:
            case ElementKind.ValueLiteral:
            case ElementKind.EntityLiteral:
            case ElementKind.ValueArrayLiteral:
            case ElementKind.EntityArrayLiteral: {
                // Enter member symbols that will be filled in later
                const memberSymbol = {
                    name: element.name.text,
                    location: element.name,
                    member: undefined as any as Member
                } as MemberSymbol
                builder.addMember(memberSymbol)
                break
            }
            case ElementKind.VocabularyLiteral: {
                break
            }
            case ElementKind.ValueTypeLiteral:
                enterTypeLiteral(builder, DefinitionKind.ValueType, element.name, initializer)
                break
            case ElementKind.MutableTypeLiteral:
                enterTypeLiteral(builder, DefinitionKind.MutableType, element.name, initializer)
                break
            case ElementKind.ConstraintLiteral:
                enterTypeLiteral(builder, DefinitionKind.Constraint, element.name, initializer)
                break
        }
    }

    function enterTypeLiteral(
        builder: TypeBuilder,
        kind: TypeDefinitionKind, 
        name: Name, 
        literal: TypeLiteralElement | ConstraintLiteralElement
    ) {
        const typeSymbol: TypeSymbol = {
            name: name.text,
            location: name
        }
        const definition: TypeDefinition = {
            kind,
            type: typeSymbol
        }
        const member = {
            kind: MemberKind.Definition,
            definition
        } as Member
        const memberSymbol: MemberSymbol = {
            name: name.text,
            location: name,
            member
        }
        builder.addMember(memberSymbol)
        const memberTypeBuilder = typeBuilder(context, TypeKind.Record, typeSymbol, builder.symbol)
        context.builders.set(typeSymbol, memberTypeBuilder)

        enterElements(literal.typeParameters, memberTypeBuilder)
        enterElements(literal.members, memberTypeBuilder)
    }

    function enterTypeParameter(
        element: TypeParameterElement,
        builder: TypeBuilder
    ) {
        const typeParameter: TypeParamater = { constraints: undefined }
        const typeParameterSymbol: TypeParameterSymbol = {
            name: element.name.text,
            location: element.name,
            typeParameter
        }
        builder.addTypeParameter(typeParameterSymbol)
    }

    function bind<S, T extends { symbol: S }>(value: T, symbol: S) {
        (value as any).symbol = symbol
    }
}

function requireTypeBuilderOf(
    context: TypeContext,
    scope: TypeBuilder,
    name: string,
    kind: TypeKind
): TypeBuilder {
    const member = required(scope.members.find(name)).member
    if (member.kind != MemberKind.Definition) error("Required member not found")
    const definition = member.definition
    if (definition.kind != DefinitionKind.MutableType) error("Required type definition")
    const symbol =  definition.type
    const builder = context.builders.get(symbol)
    const found = required(builder)
    if (found.kind != kind) error("Wrong type kind")
    return found
}
