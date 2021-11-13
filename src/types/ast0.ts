import * as ast from "../ast";
export { ElementKind, Optional } from "../ast"

type OnlyElement0<T> =
    T extends ast.Name ? Name :
    T extends ast.Element ? Element0 : 
    T extends ast.Element[] ? Element0[] : 
    T extends ast.Optional<Element> ? ast.Optional<Element0> : 
    T

export type ToElement0<T> = {
    [P in keyof T]: OnlyElement0<T[P]>
}

export type Name = ToElement0<ast.Name>
export type LiteralElement = ToElement0<ast.LiteralElement>
export type SelectionElement = ToElement0<ast.SelectionElement>
export type SpreadElement = ToElement0<ast.SpreadElement>
export type BreakElement = ToElement0<ast.BreakElement>
export type ContinueElement = ToElement0<ast.ContinueElement>
export type CallElement = ToElement0<ast.CallElement>
export type IndexElement = ToElement0<ast.IndexElement>
export type NamedArgumentElement = ToElement0<ast.NamedArgumentElement>
export type ValueLiteralElement = ToElement0<ast.ValueLiteralElement>
export type ValueArrayLiteralElement = ToElement0<ast.ValueArrayLiteralElement>
export type NamedMemberInitializerElement = ToElement0<ast.NamedMemberInitializerElement>
export type LetDeclarationElement = ToElement0<ast.LetDeclarationElement>
export type ConstraintLetDeclarationElement = ToElement0<ast.ConstraintLetDeclarationElement>
export type LambdaElement = ToElement0<ast.LambdaElement>
export type IntrinsicLambdaElement = ToElement0<ast.IntrinsicLambdaElement>
export type LoopElement = ToElement0<ast.LoopElement>
export type ParameterElement = ToElement0<ast.ParameterElement>
export type TypeParameterElement = ToElement0<ast.TypeParameterElement>
export type ReturnElement = ToElement0<ast.ReturnElement>
export type WhenElement = ToElement0<ast.WhenElement>
export type WhenValueClauseElement = ToElement0<ast.WhenValueClauseElement>
export type WhenElseClauseElement = ToElement0<ast.WhenElseClauseElement>
export type ValueTypeLiteralElement = ToElement0<ast.ValueTypeLiteralElement>
export type ConstraintLiteralElement = ToElement0<ast.ConstraintLiteralElement>
export type CallSignatureElement = ToElement0<ast.CallSignatureElement>
export type VocabularyLiteralElement = ToElement0<ast.VocabularyLiteralElement>
export type SymbolLiteralElement = ToElement0<ast.SymbolLiteralElement>
export type ArrayTypeElement = ToElement0<ast.ArrayTypeElement>
export type AndTypeElement = ToElement0<ast.AndTypeElement>
export type TypeConstructorElement = ToElement0<ast.TypeConstructorElement>
export type VocabularyOperatorDeclarationElement = ToElement0<ast.VocabularyOperatorDeclarationElement>
export type Element0 = 
    Name |
    LiteralElement |
    SelectionElement |
    SpreadElement |
    BreakElement |
    ContinueElement |
    CallElement |
    IndexElement |
    NamedArgumentElement |
    ValueLiteralElement |
    ValueArrayLiteralElement |
    NamedMemberInitializerElement |
    LetDeclarationElement |
    ConstraintLetDeclarationElement |
    LambdaElement |
    IntrinsicLambdaElement |
    LoopElement |
    ParameterElement |
    TypeParameterElement |
    ReturnElement |
    WhenElement |
    WhenValueClauseElement |
    WhenElseClauseElement |
    ValueTypeLiteralElement |
    ConstraintLiteralElement |
    CallSignatureElement |
    VocabularyLiteralElement |
    SymbolLiteralElement |
    ArrayTypeElement |
    AndTypeElement |
    TypeConstructorElement |
    VocabularyOperatorDeclarationElement

export function childrenOf(element: Element0): Iterable<Element0> {
    return ast.childrenOf(element as ast.Element) as Iterable<Element0>
}
