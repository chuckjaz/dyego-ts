import { Location } from './files'
import { Literal } from './tokens'

export const enum ElementKind {
    Name,
    Literal,
    Selection,
    Spread,
    Break,
    Continue,
    Call,
    Index,
    NamedArgument,
    ValueLiteral,
    EntityLiteral,
    ValueArrayLiteral,
    EntityArrayLiteral,
    NamedMemberInitializer,
    LetDeclaration,
    ConstraintLetDeclaration,
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
    ValueTypeLiteral,
    MutableTypeLiteral,
    CallSignature,
    IntrinsicCallSignature,
    ConstraintLiteral,
    VocabularyLiteral,
    SymbolLiteral,
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
    IndexElement |
    NamedArgumentElement |
    ValueLiteralElement |
    EntityLiteralElement |
    ValueArrayLiteralElement |
    EntityArrayLiteralElement |
    NamedMemberInitializerElement |
    LetDeclarationElement |
    VarDeclarationElement |
    ValDeclarationElement |
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
    EntityTypeLiteralElement |
    ConstraintLiteralElement |
    CallSignatureElement |
    IntrinsicCallSignatureElement |
    VocabularyLiteralElement |
    SymbolLiteralElement |
    OrTypeElement |
    AndTypeElement |
    ArrayTypeElement |
    OptionalTypeElement |
    TypeConstructorElement |
    VocabularyOperatorDeclarationElement

export interface Name extends Location {
    readonly kind: ElementKind.Name
    readonly text: string
}

export interface NamedElement extends Location {
    readonly name: Name
}

export interface TypedElement extends Location {
    readonly type: Element
}

export interface LiteralElement extends Location {
    readonly kind: ElementKind.Literal
    readonly value: any
    readonly literal: Literal
}

export interface SelectionElement extends Location {
    readonly kind: ElementKind.Selection
    readonly target: Element
    readonly member: Name
}

export interface SpreadElement extends Location {
    readonly kind: ElementKind.Spread
    readonly target: Element
}

export interface BreakElement extends Location {
    readonly kind: ElementKind.Break
    readonly label: Optional<Element>
}

export interface ContinueElement extends Location {
    readonly kind: ElementKind.Continue
    readonly label: Optional<Element>
}

export interface CallElement extends Location {
    readonly kind: ElementKind.Call
    readonly target: Element
    readonly arguments: Element[]
    readonly typeArguments: Optional<Element[]>
}

export interface IndexElement extends Location {
    readonly kind: ElementKind.Index
    readonly target: Element
    readonly index: Element
}

export interface NamedArgumentElement extends NamedElement {
    readonly kind: ElementKind.NamedArgument
    readonly value: Element
}

export interface InitalizerElement extends Location {
    readonly members: Element[]
    readonly qualifier: Optional<Element>
}

export interface ValueLiteralElement extends InitalizerElement {
    readonly kind: ElementKind.ValueLiteral
}

export interface EntityLiteralElement extends InitalizerElement {
    readonly kind: ElementKind.EntityLiteral
}

export interface ArrayInitalizerElement extends Location {
    readonly elements: Element[]
}

export interface ValueArrayLiteralElement extends ArrayInitalizerElement {
    readonly kind: ElementKind.ValueArrayLiteral
}

export interface EntityArrayLiteralElement extends ArrayInitalizerElement {
    readonly kind: ElementKind.EntityArrayLiteral
}

export interface NamedMemberInitializerElement extends NamedElement{
    readonly kind: ElementKind.NamedMemberInitializer
    readonly value: Element
}

export interface NamedMemberElement extends NamedElement {
    readonly kind: ElementKind.LetDeclaration | ElementKind.VarDeclaration | ElementKind.ValDeclaration
    readonly type: Optional<Element>
    readonly initializer: Optional<Element>
}

export interface LetDeclarationElement extends NamedMemberElement {
    readonly kind: ElementKind.LetDeclaration
}

export interface VarDeclarationElement extends NamedMemberElement {
    readonly kind: ElementKind.VarDeclaration
}

export interface ValDeclarationElement extends NamedMemberElement {
    readonly kind: ElementKind.ValDeclaration
}

export interface ConstraintLetDeclarationElement extends NamedElement {
    readonly kind: ElementKind.ConstraintLetDeclaration
    readonly type: Element
    readonly initializer: Optional<Element>
}

export interface LambdaCommonElement extends Location {
    readonly parameters: Element[]
    readonly typeParameters: Optional<Element[]>
    readonly body: Element[]
    readonly result: Optional<Element>
}

export interface LambdaElement extends LambdaCommonElement {
    readonly kind: ElementKind.Lambda
}

export interface IntrinsicLambdaElement extends LambdaCommonElement {
    readonly kind: ElementKind.IntrinsicLambda
}

export interface LoopElement extends Location {
    readonly kind: ElementKind.Loop
    readonly label: Optional<Name>
    readonly body: Element[]
}

export interface ParameterElement extends NamedElement {
    readonly kind: ElementKind.Parameter
    readonly type: Optional<Element>
    readonly default: Optional<Element>
}

export interface TypeParameterElement extends NamedElement {
    readonly kind: ElementKind.TypeParameter
    readonly constraint: Optional<Element>
    readonly default: Optional<Element>
}

export interface ReturnElement extends Location {
    readonly kind: ElementKind.Return
    readonly value: Optional<Element>
}

export interface WhenElement extends Location {
    readonly kind: ElementKind.When
    readonly expression: Optional<Element>
    readonly clauses: Element[]
}

export interface WhenValueClauseElement extends Location {
    readonly kind: ElementKind.WhenValueClause
    readonly value: Element
    readonly body: Element
}

export interface WhenElseClauseElement extends Location {
    readonly kind: ElementKind.WhenElseClause
    readonly body: Element
}

export interface TypeLiteralCommonElement extends Location {
    readonly typeParameters: TypeParameterElement[]
    readonly members: Element[]
    readonly constraint: Optional<Element>
}

export interface ValueTypeLiteralElement extends TypeLiteralCommonElement {
    readonly kind: ElementKind.ValueTypeLiteral 
}

export interface EntityTypeLiteralElement extends TypeLiteralCommonElement {
    readonly kind: ElementKind.MutableTypeLiteral
}

export interface ConstraintLiteralElement extends Location {
    readonly kind: ElementKind.ConstraintLiteral
    readonly typeParameters: Element[]
    readonly members: Element[]
}

export interface CallSignatureCommonElement extends Location {
    readonly typeParameters: Element[]
    readonly parameters: Element[]
    readonly result: Optional<Element>
}

export interface CallSignatureElement extends CallSignatureCommonElement {
    readonly kind: ElementKind.CallSignature
}

export interface IntrinsicCallSignatureElement extends CallSignatureCommonElement {
    readonly kind: ElementKind.IntrinsicCallSignature
}

export interface VocabularyLiteralElement extends Location {
    readonly kind: ElementKind.VocabularyLiteral
    readonly members: Element[]
}

export interface SymbolLiteralElement extends Location {
    readonly kind: ElementKind.SymbolLiteral
    readonly values: Element[]
}

export interface ArrayTypeElement extends Location {
    readonly kind: ElementKind.ArrayType
    readonly elements: Element
}

export interface OptionalTypeElement extends Location {
    readonly kind: ElementKind.OptionalType
    readonly target: Element
}

export interface OrTypeElement extends Location {
    readonly kind: ElementKind.OrType
    readonly left: Element
    readonly right: Element
}

export interface AndTypeElement extends Location {
    readonly kind: ElementKind.AndType
    readonly left: Element
    readonly right: Element
}

export interface TypeConstructorElement extends Location {
    readonly kind: ElementKind.TypeConstructor
    readonly target: Element
    readonly arguments: Element[]
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

export interface VocabularyOperatorDeclarationElement extends Location {
    readonly kind: ElementKind.VocabularyOperatorDeclaration
    readonly names: Name[]
    readonly placement: OperatorPlacement
    readonly precedence: Optional<VocabularyOperatorPrecedence>
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
        case ElementKind.Index:
            yield element.target
            yield element.index
            break
        case ElementKind.NamedArgument:
            yield element.name
            yield element.value
            break
        case ElementKind.ValueLiteral:
        case ElementKind.EntityLiteral:
            yield * element.members
            if (element.qualifier)
                yield element.qualifier
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
        case ElementKind.ConstraintLetDeclaration:
            yield element.name
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
            if (element.default)
                yield element.default
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
        case ElementKind.ValueTypeLiteral:
        case ElementKind.MutableTypeLiteral:
            yield * element.typeParameters
            yield * element.members
            if (element.constraint)
                yield element.constraint
            break
        case ElementKind.ConstraintLiteral:
            yield * element.typeParameters
            yield * element.members
            break
        case ElementKind.CallSignature:
        case ElementKind.IntrinsicCallSignature:
            yield * element.typeParameters
            yield * element.parameters
            if (element.result)
                yield element.result
            break
        case ElementKind.VocabularyLiteral:
            yield * element.members
            break
        case ElementKind.SymbolLiteral:
            yield * element.values
            break
        case ElementKind.ArrayType:
            yield element.elements
            break
        case ElementKind.OptionalType:
            yield element.target
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
            throw Error(`Unknown element kind ${(element as any).kind}`)
    }
}

export interface BuilderContext { 
    startPos(): number
    endPos(): number
}

class EmptyContext {
    startPos() { return -1 }
    endPos() { return -1 }
}

export class ElementBuilder {
    private context: BuilderContext
    private locations: number[] = []

    constructor(context: BuilderContext = new EmptyContext()) {
        this.context = context
    }

    pushContext() {
        this.locations.push(this.context.startPos())
    }

    popContext() {
        this.locations.length--
    }

    private get start(): number {
        return this.locations[this.locations.length - 1]
    }

    private get end(): number {
        return this.context.endPos()
    }

    Name(text: string): Name {
        return { kind: ElementKind.Name, start: this.start, end: this.end, text }
    }

    Literal(value: any, literal: Literal): LiteralElement {
        return { kind: ElementKind.Literal, start: this.start, end: this.end, value, literal }
    }

    Break(label: Optional<Element>): BreakElement {
        return { kind: ElementKind.Break, start: this.start, end: this.end, label }
    }

    Continue(label: Optional<Element>): ContinueElement {
        return { kind: ElementKind.Continue, start: this.start, end: this.end, label }
    }

    Selection(target: Element, member: Name): SelectionElement {
        return { kind: ElementKind.Selection, start: this.start, end: this.end, target, member }
    }

    Call(target: Element, args: Element[], typeArguments: Optional<Element[]>): CallElement {
        return { kind: ElementKind.Call, start: this.start, end: this.end, target, arguments: args, typeArguments }
    }

    Index(target: Element, index: Element): IndexElement {
        return { kind: ElementKind.Index, start: this.start, end: this.end, target, index }
    }

    NamedArgument(name: Name, value: Element): NamedArgumentElement {
        return { kind: ElementKind.NamedArgument, start: this.start, end: this.end, name, value}
    }

    ValueLiteral(members: Element[], qualifier: Optional<Element>): ValueLiteralElement {
        return { kind: ElementKind.ValueLiteral, start: this.start, end: this.end, members, qualifier }
    }

    EntityLiteral(members: Element[], qualifier: Optional<Element>): EntityLiteralElement {
        return { kind: ElementKind.EntityLiteral, start: this.start, end: this.end, members, qualifier }
    }

    ValueArrayLiteral(elements: Element[]): ValueArrayLiteralElement {
        return { kind: ElementKind.ValueArrayLiteral, start: this.start, end: this.end, elements }
    }

    EntityArrayLiteral(elements: Element[]): EntityArrayLiteralElement {
        return { kind: ElementKind.EntityArrayLiteral, start: this.start, end: this.end, elements }
    }

    Spread(target: Element): SpreadElement {
        return { kind: ElementKind.Spread, start: this.start, end: this.end, target }
    }

    NamedMemberInitializer(name: Name, value: Element): NamedMemberInitializerElement {
        return { kind: ElementKind.NamedMemberInitializer, start: this.start, end: this.end, name, value }
    }

    LetDeclaration(name: Name, type: Optional<Element>, initializer: Element): LetDeclarationElement {
        return { kind: ElementKind.LetDeclaration, start: this.start, end: this.end, name, type, initializer }
    }

    ConstraintLetDelaration(name: Name, type: Element, initializer: Optional<Element>): ConstraintLetDeclarationElement {
        return { kind: ElementKind.ConstraintLetDeclaration, start: this.start, end: this.end, name, type, initializer }
    }

    VarDeclaration(name: Name, type: Optional<Element>, initializer: Optional<Element>): VarDeclarationElement {
        return { kind: ElementKind.VarDeclaration, start: this.start, end: this.end, name, type, initializer }
    }

    ValDeclaration(name: Name, type: Optional<Element>, initializer: Optional<Element>): ValDeclarationElement {
        return { kind: ElementKind.ValDeclaration, start: this.start, end: this.end, name, type, initializer}
    }

    Lambda(parameters: Element[], typeParameters: Optional<Element[]>, body: Element[], result: Optional<Element>): LambdaElement {
        return { kind: ElementKind.Lambda, start: this.start, end: this.end, parameters, typeParameters, body, result }
    }

    IntrinsicLambda(parameters: Element[], typeParameters: Optional<Element[]>, body: Element[], result: Optional<Element>): IntrinsicLambdaElement {
        return { kind: ElementKind.IntrinsicLambda, start: this.start, end: this.end, parameters, typeParameters, body, result }
    }

    Loop(label: Optional<Name>, body: Element[]): LoopElement {
        return { kind: ElementKind.Loop, start: this.start, end: this.end, label, body }
    }

    Parameter(name: Name, type: Optional<Element>, dflt: Optional<Element>): ParameterElement {
        return { kind: ElementKind.Parameter, start: this.start, end: this.end, name, type, default: dflt }
    }

    TypeParameter(name: Name, constraint: Optional<Element>, dflt: Optional<Element>): TypeParameterElement {
        return { kind: ElementKind.TypeParameter, start: this.start, end: this.end, name, constraint, default: dflt }
    }

    Return(value: Optional<Element>): ReturnElement {
        return { kind: ElementKind.Return, start: this.start, end: this.end, value }
    }

    When(expression: Optional<Element>, clauses: Element[]): WhenElement {
        return { kind: ElementKind.When, start: this.start, end: this.end, expression, clauses }
    }

    WhenValueClause(value: Element, body: Element): WhenValueClauseElement {
        return { kind: ElementKind.WhenValueClause, start: this.start, end: this.end, value, body }
    }

    WhenElseClause(body: Element): WhenElseClauseElement {
        return { kind: ElementKind.WhenElseClause, start: this.start, end: this.end, body }
    }

    ValueTypeLiteral(typeParameters: TypeParameterElement[], members: Element[], constraint: Optional<Element>): ValueTypeLiteralElement {
        return { kind: ElementKind.ValueTypeLiteral, start: this.start, end: this.end, typeParameters, members, constraint }
    }

    EntityTypeLiteral(typeParameters: TypeParameterElement[], members: Element[], constraint: Optional<Element>): EntityTypeLiteralElement {
        return { kind: ElementKind.MutableTypeLiteral, start: this.start, end: this.end, typeParameters, members, constraint }
    }

    CallSignature(typeParameters: Element[], parameters: Element[], result: Optional<Element>): CallSignatureElement {
        return { kind: ElementKind.CallSignature, start: this.start, end: this.end, typeParameters, parameters, result}
    }

    IntrinsicCallSignature(typeParameters: Element[], parameters: Element[], result: Optional<Element>): IntrinsicCallSignatureElement {
        return { kind: ElementKind.IntrinsicCallSignature, start: this.start, end: this.end, typeParameters, parameters, result }
    }

    ConstraintLiteral(typeParameters: Element[], members: Element[]): ConstraintLiteralElement {
        return { kind: ElementKind.ConstraintLiteral, start: this.start, end: this.end, typeParameters, members }
    }

    VocabularyLiteral(members: Element[]): VocabularyLiteralElement {
        return { kind: ElementKind.VocabularyLiteral, start: this.start, end: this.end, members }
    }

    SymbolLiteral(values: Element[]): SymbolLiteralElement {
        return { kind: ElementKind.SymbolLiteral, start: this.start, end: this.end, values }
    }

    ArrayType(elements: Element): ArrayTypeElement {
        return { kind: ElementKind.ArrayType, start: this.start, end: this.end, elements }
    }

    OptionalType(target: Element): OptionalTypeElement {
        return { kind: ElementKind.OptionalType, start: this.start, end: this.end, target }
    }

    OrType(left: Element, right: Element): OrTypeElement {
        return { kind: ElementKind.OrType, start: this.start, end: this.end, left, right }
    }

    AndType(left: Element, right: Element): AndTypeElement {
        return { kind: ElementKind.AndType, start: this.start, end: this.end, left, right }
    }

    TypeConstructor(target: Element, args: Element[]): TypeConstructorElement {
        return { kind: ElementKind.TypeConstructor, start: this.start, end: this.end, target, arguments: args}
    }

    VocabularyOperatorDeclaration(
        names: Name[],
        placement: OperatorPlacement,
        precedence: Optional<VocabularyOperatorPrecedence>,
        associativity: OperatorAssociativity
    ): VocabularyOperatorDeclarationElement {
        return {
            kind: ElementKind.VocabularyOperatorDeclaration,
            start: this.start,
            end: this.end,
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