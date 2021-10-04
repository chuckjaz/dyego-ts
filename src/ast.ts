import { Literal } from './tokens'

export const enum ElementKind {
    Name,
    Literal,
    Selection,
    Spread,
    Break,
    Continue,
    Call,
    NamedArgument,
    ValueLiteral,
    EntityLiteral,
    ValueArrayLiteral,
    EntityArrayLiteral,
    NamedMemberInitializer,
    LetDeclaration,
    VarDeclaration,
    ValDeclaration,
    Lambda,
    IntrinsicLambda,
    Loop,
    Parameter,
    TypeParameter,
    Return,
    When,
    WhenValueClause,
    WhenElseClause,
    TypeLiteral,
    ConstraintLiteral,
    VocabularyLiteral,
    ArrayType,
    OptionalType,
    OrType,
    AndType,
    TypeConstructor,
    VocabularyOperatorDeclaration,
}

export type Optional<T> = T | undefined

export type Element = 
    Name | 
    LiteralElement | 
    SelectionElement | 
    SpreadElement |
    BreakElement |
    ContinueElement |
    CallElement |
    NamedArgumentElement |
    InitalizerElement |
    ArrayInitalizerElement |
    NamedMemberInitializerElement |
    NamedMemberElement |
    LambdaElement |
    LoopElement |
    ParameterElement |
    TypeParameterElement |
    ReturnElement |
    WhenElement |
    WhenValueClauseElement |
    WhenElseClauseElement |
    TypeLiteralElement |
    VocabularyLiteralElement |
    TypeUnaryExpressionElement |
    TypeBinaryExpressionElement |
    TypeConstructorElement |
    VocabularyOperatorDeclarationElement

export interface Name {
    kind: ElementKind.Name
    text: string
}

export interface NamedElement {
    name: Name
}

export interface TypedElement {
    type: Element
}

export interface LiteralElement {
    kind: ElementKind.Literal
    value: any
    literal: Literal
}

export interface SelectionElement {
    kind: ElementKind.Selection
    target: Element
    member: Name
}

export interface SpreadElement {
    kind: ElementKind.Spread
    target: Element 
}

export interface BreakElement {
    kind: ElementKind.Break
    label: Optional<Element>
}

export interface ContinueElement {
    kind: ElementKind.Continue
    label: Optional<Element>
}

export interface CallElement {
    kind: ElementKind.Call
    target: Element
    arguments: Element[]
    typeArguments: Optional<Element[]>
}

export interface NamedArgumentElement extends NamedElement {
    kind: ElementKind.NamedArgument
    value: Element
}

export interface InitalizerElement {
    kind: ElementKind.ValueLiteral | ElementKind.EntityLiteral
    members: Element[]
}

export interface ArrayInitalizerElement {
    kind: ElementKind.ValueArrayLiteral | ElementKind.EntityArrayLiteral
    elements: Element[]
}

export interface NamedMemberInitializerElement extends NamedElement {
    kind: ElementKind.NamedMemberInitializer
    value: Element
}

export interface NamedMemberElement extends NamedElement {
    kind: ElementKind.LetDeclaration | ElementKind.VarDeclaration | ElementKind.ValDeclaration
    type: Optional<Element>
    initializer: Optional<Element>
}

export interface LambdaElement {
    kind: ElementKind.Lambda | ElementKind.IntrinsicLambda
    parameters: Element[]
    typeParameters: Optional<Element[]>
    body: Element[]
    result: Optional<Element>
}

export interface LoopElement {
    kind: ElementKind.Loop
    label: Optional<Name>
    body: Element[]
}

export interface ParameterElement extends NamedElement {
    kind: ElementKind.Parameter
    type: Optional<Element>
    default: Optional<Element>
}

export interface TypeParameterElement extends NamedElement {
    kind: ElementKind.TypeParameter
    constraint: Optional<Element>
}

export interface ReturnElement {
    kind: ElementKind.Return
    value: Optional<Element>
}

export interface WhenElement {
    kind: ElementKind.When
    expression: Optional<Element>
    clauses: Element[]
}

export interface WhenValueClauseElement {
    kind: ElementKind.WhenValueClause
    value: Element
    body: Element
}

export interface WhenElseClauseElement {
    kind: ElementKind.WhenElseClause
    body: Element
}

export interface TypeLiteralElement {
    kind: ElementKind.TypeLiteral | ElementKind.ConstraintLiteral
    typeParameters: Element[]
    members: Element[]
}

export interface VocabularyLiteralElement {
    kind: ElementKind.VocabularyLiteral
    members: Element[]
}

export interface TypeUnaryExpressionElement {
    kind: ElementKind.ArrayType | ElementKind.OptionalType
    operant: Element
}

export interface TypeBinaryExpressionElement {
    kind: ElementKind.OrType | ElementKind.AndType
    left: Element
    right: Element
}

export interface TypeConstructorElement {
    kind: ElementKind.TypeConstructor
    target: Element
    arguments: Element[]
}

export enum OperatorPlacement {
    Prefix,
    Infix,
    Postfix,
    Unspecified,
}

export enum OperatorAssociativity {
    Left,
    Right,
    Unspecified,
}

export enum OperatorPrecedenceRelation {
    Before,
    After,
}

export interface VocabularyOperatorDeclarationElement {
    kind: ElementKind.VocabularyOperatorDeclaration
    names: Name[]
    placement: OperatorPlacement
    precedence: Optional<VocabularyOperatorPrecedence>
    associativity: OperatorAssociativity
}

export interface VocabularyOperatorPrecedence {
    name: Name
    placement: OperatorPlacement
    relation: OperatorPrecedenceRelation
}

export function * childrenOf(element: Element) {
    switch (element.kind) {
        case ElementKind.Name:
        case ElementKind.Literal:
            break
        case ElementKind.Selection:
            yield element.target
            yield element.member
            break
        case ElementKind.Spread:
            yield element.target
            break
        case ElementKind.Break:
        case ElementKind.Continue:
            if (element.label) yield element.label
            break
        case ElementKind.Call:
            yield element.target
            if (element.typeArguments)
                yield * element.typeArguments
            yield * element.arguments
            break
        case ElementKind.NamedArgument:
            yield element.name
            yield element.value
            break
        case ElementKind.ValueLiteral:
        case ElementKind.EntityLiteral:
            yield * element.members
            break
        case ElementKind.ValueArrayLiteral:
        case ElementKind.EntityArrayLiteral:
            yield * element.elements
            break
        case ElementKind.NamedMemberInitializer:
            yield element.name
            yield element.value
            break
        case ElementKind.LetDeclaration:
        case ElementKind.ValDeclaration:
        case ElementKind.VarDeclaration:
            yield element.name
            if (element.type)
                yield element.type
            if (element.initializer)
                yield element.initializer
            break
        case ElementKind.Lambda:
        case ElementKind.IntrinsicLambda:
            yield * element.parameters
            if (element.typeParameters) {
                yield * element.typeParameters
            }
            yield * element.body
            if (element.result)
                yield element.result
            break
        case ElementKind.Loop:
            if (element.label) 
                yield element.label
            yield * element.body
            break
        case ElementKind.Parameter:
            yield element.name
            if (element.type)
                yield element.type
            if (element.default)
                yield element.default
            break
        case ElementKind.TypeParameter:
            yield element.name
            if (element.constraint)
                yield element.constraint
            break
        case ElementKind.Return:
            if (element.value)
                yield element.value
            break
        case ElementKind.When:
            if (element.expression)
                yield element.expression
            yield * element.clauses
            break
        case ElementKind.WhenValueClause:
            yield element.value
            yield element.body
            break
        case ElementKind.WhenElseClause:
            yield element.body
            break
        case ElementKind.TypeLiteral:
        case ElementKind.ConstraintLiteral:
            yield * element.typeParameters
            yield * element.members
            break
        case ElementKind.VocabularyLiteral:
            yield * element.members
            break
        case ElementKind.ArrayType:
        case ElementKind.OptionalType:
            yield element.operant
            break
        case ElementKind.OrType:
        case ElementKind.AndType:
            yield element.left
            yield element.right
            break
        case ElementKind.TypeConstructor:
            yield element.target
            yield * element.arguments
            break
        case ElementKind.VocabularyOperatorDeclaration:
            yield * element.names
            break
        default:
            throw Error(`Unknown element kind ${element}`)
    }
}

export interface BuilderContext { }

export class ElementBuilder {
    private context: BuilderContext

    constructor(context: BuilderContext) {
        this.context = context
    }

    PushContext() {}
    PopContext() {}

    Name(text: string): Name {
        return { kind: ElementKind.Name, text }
    }

    Literal(value: any, literal: Literal): LiteralElement {
        return { kind: ElementKind.Literal, value, literal }
    }

    Break(label: Optional<Element>): BreakElement {
        return { kind: ElementKind.Break, label }
    }

    Continue(label: Optional<Element>): ContinueElement {
        return { kind: ElementKind.Continue, label }
    }

    Selection(target: Element, member: Name): SelectionElement {
        return { kind: ElementKind.Selection, target, member }
    }

    Call(target: Element, args: Element[], typeArguments: Optional<Element[]>): CallElement {
        return { kind: ElementKind.Call, target, arguments: args, typeArguments }
    }

    NamedArgument(name: Name, value: Element): NamedArgumentElement {
        return { kind: ElementKind.NamedArgument, name, value}
    }

    ValueLiteral(members: Element[]): InitalizerElement {
        return { kind: ElementKind.ValueLiteral, members }
    }

    EntityLiteral(members: Element[]): InitalizerElement {
        return { kind: ElementKind.EntityLiteral, members }
    }

    ValueArrayLiteral(elements: Element[]): ArrayInitalizerElement {
        return { kind: ElementKind.ValueArrayLiteral, elements }
    }

    EntityArrayLiteral(elements: Element[]): ArrayInitalizerElement {
        return { kind: ElementKind.EntityArrayLiteral, elements }
    }

    Spread(target: Element): SpreadElement {
        return { kind: ElementKind.Spread, target }
    }

    NamedMemberInitializer(name: Name, value: Element): NamedMemberInitializerElement {
        return { kind: ElementKind.NamedMemberInitializer, name, value }
    }

    LetDeclaration(name: Name, type: Optional<Element>, initializer: Element): NamedMemberElement {
        return { kind: ElementKind.LetDeclaration, name, type, initializer }
    }

    VarDeclaration(name: Name, type: Optional<Element>, initializer: Optional<Element>): NamedMemberElement {
        return { kind: ElementKind.VarDeclaration, name, type, initializer }
    }

    ValDeclaration(name: Name, type: Optional<Element>, initializer: Optional<Element>): NamedMemberElement {
        return { kind: ElementKind.ValDeclaration, name, type, initializer}
    }

    Lambda(parameters: Element[], typeParameters: Optional<Element[]>, body: Element[], result: Optional<Element>): LambdaElement {
        return { kind: ElementKind.Lambda, parameters, typeParameters, body, result }
    }

    IntrinsicLambda(parameters: Element[], typeParameters: Optional<Element[]>, body: Element[], result: Element): LambdaElement {
        return { kind: ElementKind.IntrinsicLambda, parameters, typeParameters, body, result }
    }

    Loop(label: Optional<Name>, body: Element[]): LoopElement {
        return { kind: ElementKind.Loop, label, body }
    }

    Parameter(name: Name, type: Optional<Element>, dflt: Optional<Element>): ParameterElement {
        return { kind: ElementKind.Parameter, name, type, default: dflt }
    }

    TypeParameter(name: Name, constraint: Optional<Element>): TypeParameterElement {
        return { kind: ElementKind.TypeParameter, name, constraint }
    }

    Return(value: Optional<Element>): ReturnElement {
        return { kind: ElementKind.Return, value }
    }

    When(expression: Optional<Element>, clauses: Element[]): WhenElement {
        return { kind: ElementKind.When, expression, clauses }
    }

    WhenValueClause(value: Element, body: Element): WhenValueClauseElement {
        return { kind: ElementKind.WhenValueClause, value, body}
    }

    WhenElseClause(body: Element): WhenElseClauseElement {
        return { kind: ElementKind.WhenElseClause, body }
    }

    TypeLiteral(typeParameters: Element[], members: Element[]): TypeLiteralElement {
        return { kind: ElementKind.TypeLiteral, typeParameters, members }
    }

    ConstraintLiteral(typeParameters: Element[], members: Element[]): TypeLiteralElement {
        return { kind: ElementKind.ConstraintLiteral, typeParameters, members }
    }

    VocabularyLiteral(members: Element[]): VocabularyLiteralElement {
        return { kind: ElementKind.VocabularyLiteral, members }
    }

    ArrayType(operant: Element): TypeUnaryExpressionElement {
        return { kind: ElementKind.ArrayType, operant }
    }

    OptionalType(operant: Element): TypeUnaryExpressionElement {
        return { kind: ElementKind.OptionalType, operant }
    }

    OrType(left: Element, right: Element): TypeBinaryExpressionElement {
        return { kind: ElementKind.OrType, left, right }
    }

    AndType(left: Element, right: Element): TypeBinaryExpressionElement {
        return { kind: ElementKind.AndType, left, right }
    }

    TypeConstructor(target: Element, args: Element[]): TypeConstructorElement {
        return { kind: ElementKind.TypeConstructor, target, arguments: args}
    }

    VocabularyOperatorDeclaration(
        names: Name[],
        placement: OperatorPlacement,
        precedence: Optional<VocabularyOperatorPrecedence>,
        associativity: OperatorAssociativity
    ): VocabularyOperatorDeclarationElement {
        return { 
            kind: ElementKind.VocabularyOperatorDeclaration,
            names,
            placement,
            precedence,
            associativity
        }
    }

    VocabularyOperatorPrecedence(
        name: Name,
        placement: OperatorPlacement,
        relation: OperatorPrecedenceRelation    
    ): VocabularyOperatorPrecedence {
        return { name, placement, relation }
    }
}