import * as ast from '../ast'
import { TypeContext, TypeContext0 } from './context'

export function validate(context: TypeContext): TypeContext0 | null {
    for (const module of context.modules) {
        validateElements(module.elements)
    }

    return context.diagnostics.length ? null : context as TypeContext0

    function validateElements(elements: Iterable<ast.Element>) {
        for (let element of elements) {
            validateElement(element)
            validateElements(ast.childrenOf(element))
        }
    }

    function validateElement(element: ast.Element) {
        switch (element.kind) {
            case ast.ElementKind.Name:
            case ast.ElementKind.Literal:
            case ast.ElementKind.Selection:
            case ast.ElementKind.Spread:
            case ast.ElementKind.Break:
            case ast.ElementKind.Continue:
            case ast.ElementKind.Call:
            case ast.ElementKind.Index:
            case ast.ElementKind.NamedArgument:
            case ast.ElementKind.ValueLiteral:
            case ast.ElementKind.ValueArrayLiteral:
            case ast.ElementKind.NamedMemberInitializer:
            case ast.ElementKind.LetDeclaration:
            case ast.ElementKind.ConstraintLetDeclaration:
            case ast.ElementKind.Lambda:
            case ast.ElementKind.IntrinsicLambda:
            case ast.ElementKind.Loop:
            case ast.ElementKind.Parameter:
            case ast.ElementKind.TypeParameter:
            case ast.ElementKind.Return:
            case ast.ElementKind.When:
            case ast.ElementKind.WhenValueClause:
            case ast.ElementKind.WhenElseClause:
            case ast.ElementKind.ValueTypeLiteral:
            case ast.ElementKind.ConstraintLiteral:
            case ast.ElementKind.CallSignature:
            case ast.ElementKind.VocabularyLiteral:
            case ast.ElementKind.SymbolLiteral:
            case ast.ElementKind.ArrayType:
            case ast.ElementKind.AndType:
            case ast.ElementKind.TypeConstructor:
            case ast.ElementKind.VocabularyOperatorDeclaration:
                break
            default:
                context.reportError(element, "Element is not valid for Dyego0")
                break
        }
    }
}