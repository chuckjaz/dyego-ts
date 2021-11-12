import {
    Element,
    ElementBuilder,
    ElementKind,
    OperatorPlacement, 
    OperatorPrecedenceRelation,
    childrenOf,
    OperatorAssociativity
} from "./ast"
import { Literal } from "./tokens"

describe("ast", () => {
    describe("builder", () => {
        it("can create a builder", () => {
            c(new ElementBuilder())
        })

        const builder = new ElementBuilder()

        it("can push and pop a context", () => {
            builder.pushContext()
            builder.popContext()
        })
        it("can create a name", () => {
            const n = builder.Name("test")
            expect(n.kind).toBe(ElementKind.Name)
            expect(n.text).toBe("test")
            ch(n).toEqual([])
        })

        const t = builder.Name("test")
        const v = builder.Name("value")

        it("can create a literal", () => {
            const n = builder.Literal(1n, Literal.Int32)
            expect(n.kind).toBe(ElementKind.Literal)
            expect(n.literal).toBe(Literal.Int32)
            expect(n.value).toBe(1n)
            ch(n).toEqual([])
        })
        it("can create a break", () => {
            const n = builder.Break(t)
            expect(n.kind).toBe(ElementKind.Break)
            expect(n.label).toBe(t)
            ch(n).toEqual([t])
        })
        it("can create a continue", () => {
            const n = builder.Continue(t)
            expect(n.kind).toBe(ElementKind.Continue)
            expect(n.label).toBe(t)
            ch(n).toEqual([t])
        })
        it("can create a selection", () => {
            const n = builder.Selection(t, v)
            expect(n.kind).toBe(ElementKind.Selection)
            expect(n.target).toBe(t)
            expect(n.member).toBe(v)
            ch(n).toEqual([t, v])
        })
        it("can create a call", () => {
            const n = builder.Call(t, [], [])
            expect(n.kind).toBe(ElementKind.Call)
            expect(n.target).toBe(t)
            expect(n.arguments).toEqual([])
            expect(n.typeArguments).toEqual([])
            ch(n).toEqual([t])
        })
        it("can create an index", () => {
            const n = builder.Index(t, v)
            expect(n.kind).toBe(ElementKind.Index)
            expect(n.target).toBe(t)
            expect(n.index).toBe(v)
            ch(n).toEqual([t, v])
        })
        it("can create a named argument", () => {
            const n = builder.NamedArgument(t, v)
            expect(n.kind).toBe(ElementKind.NamedArgument)
            expect(n.name).toBe(t)
            expect(n.value).toBe(v)
            ch(n).toEqual([t, v])
        })
        it("can create a value literal", () => {
            const n = builder.ValueLiteral([], undefined)
            expect(n.kind).toBe(ElementKind.ValueLiteral)
            expect(n.members).toEqual([])
            expect(n.qualifier).toEqual(undefined)
            ch(n).toEqual([])
        })
        it("can create an entity literal", () => {
            const n = builder.EntityLiteral([], undefined)
            expect(n.kind).toBe(ElementKind.EntityLiteral)
            expect(n.members).toEqual([])
            expect(n.qualifier).toEqual(undefined)
            ch(n).toEqual([])
        })
        it("can create an value array literal", () => {
            const n = builder.ValueArrayLiteral([])
            expect(n.kind).toBe(ElementKind.ValueArrayLiteral)
            expect(n.elements).toEqual([])
            ch(n).toEqual([])
        })
        it("can create an entity array literal", () => {
            const n = builder.EntityArrayLiteral([])
            expect(n.kind).toBe(ElementKind.EntityArrayLiteral)
            expect(n.elements).toEqual([])
            ch(n).toEqual([])
        })
        it("can create a spread", () => {
            const n = builder.Spread(t)
            expect(n.kind).toBe(ElementKind.Spread)
            expect(n.target).toBe(t)
            ch(n).toEqual([t])
        })
        it("can create a let declaration", () => {
            const n = builder.LetDeclaration(t, v, t)
            expect(n.kind).toBe(ElementKind.LetDeclaration)
            expect(n.name).toBe(t)
            expect(n.type).toBe(v)
            expect(n.initializer).toBe(t)
            ch(n).toEqual([t, v, t])
        })
        it("can create a var declaration", () => {
            const n = builder.VarDeclaration(t, v, t)
            expect(n.kind).toBe(ElementKind.VarDeclaration)
            expect(n.name).toBe(t)
            expect(n.type).toBe(v)
            expect(n.initializer).toBe(t)
            ch(n).toEqual([t, v, t])
        })
        it("can create a val declaration", () => {
            const n = builder.ValDeclaration(t, v, t)
            expect(n.kind).toBe(ElementKind.ValDeclaration)
            expect(n.name).toBe(t)
            expect(n.type).toBe(v)
            expect(n.initializer).toBe(t)
            ch(n).toEqual([t, v, t])
        })
        it("can create a lambda", () => {
            const n = builder.Lambda([t], [v], [t, t], t)
            expect(n.kind).toBe(ElementKind.Lambda)
            expect(n.parameters).toEqual([t])
            expect(n.typeParameters).toEqual([v])
            expect(n.body).toEqual([t, t])
            expect(n.result).toEqual(t)
            ch(n).toEqual([t, v, t, t, t])
        })
        it("can create a intrinsic lambda", () => {
            const n = builder.IntrinsicLambda([t], [v], [t, t], t)
            expect(n.kind).toBe(ElementKind.IntrinsicLambda)
            expect(n.parameters).toEqual([t])
            expect(n.typeParameters).toEqual([v])
            expect(n.body).toEqual([t, t])
            expect(n.result).toEqual(t)
            ch(n).toEqual([t, v, t, t, t])
        })
        it("can create a loop", () => {
            const n = builder.Loop(v, [])
            expect(n.kind).toBe(ElementKind.Loop)
            expect(n.label).toBe(v)
            expect(n.body).toEqual([])
            ch(n).toEqual([v])
        })
        it("can create a parameter", () => {
            const n = builder.Parameter(t, t, v)
            expect(n.kind).toBe(ElementKind.Parameter)
            expect(n.name).toBe(t)
            expect(n.type).toBe(t)
            expect(n.default).toBe(v)
            ch(n).toEqual([t, t, v])
        })
        it("can create a return", () => {
            const n = builder.Return(t)
            expect(n.kind).toBe(ElementKind.Return)
            expect(n.value).toBe(t)
            ch(n).toEqual([t])
        })
        it("can create a when", () => {
            const n = builder.When(t, [])
            expect(n.kind).toBe(ElementKind.When)
            expect(n.expression).toBe(t)
            expect(n.clauses).toEqual([])
            ch(n).toEqual([t])
        })
        it("can create a when value clause", () => {
            const n = builder.WhenValueClause(v, t)
            expect(n.kind).toBe(ElementKind.WhenValueClause)
            expect(n.value).toBe(v)
            expect(n.body).toBe(t)
            ch(n).toEqual([v, t])
        })
        it("can create a when else clause", () => {
            const n = builder.WhenElseClause(t)
            expect(n.kind).toBe(ElementKind.WhenElseClause)
            expect(n.body).toBe(t)
            ch(n).toEqual([t])
        })
        it("can create a value type literal", () => {
            const n = builder.ValueTypeLiteral([], [], v)
            expect(n.kind).toBe(ElementKind.ValueTypeLiteral)
            expect(n.members).toEqual([])
            expect(n.typeParameters).toEqual([])
            expect(n.constraint).toBe(v)
            ch(n).toEqual([v])
        })
        it("can create a mutable type literal", () => {
            const n = builder.MutableTypeLiteral([], [], v)
            expect(n.kind).toBe(ElementKind.MutableTypeLiteral)
            expect(n.members).toEqual([])
            expect(n.typeParameters).toEqual([])
            expect(n.constraint).toBe(v)
            ch(n).toEqual([v])
        })
        it("can create a call signature", () => {
            const n = builder.CallSignature([t], [v], v)
            expect(n.kind).toBe(ElementKind.CallSignature)
            expect(n.typeParameters).toEqual([t])
            expect(n.parameters).toEqual([v])
            expect(n.result).toEqual(v)
        })
        it("can create an intrinsic call signature", () => {
            const n = builder.IntrinsicCallSignature([t], [v], v)
            expect(n.kind).toBe(ElementKind.IntrinsicCallSignature)
            expect(n.typeParameters).toEqual([t])
            expect(n.parameters).toEqual([v])
            expect(n.result).toEqual(v)
        })
        it("can create a constraint literal", () => {
            const n = builder.ConstraintLiteral([], [])
            expect(n.kind).toBe(ElementKind.ConstraintLiteral)
            expect(n.members).toEqual([])
            expect(n.typeParameters).toEqual([])
            ch(n).toEqual([])
        })
        it("can create a vocabulary literal", () => {
            const n = builder.VocabularyLiteral([])
            expect(n.kind).toBe(ElementKind.VocabularyLiteral)
            expect(n.members).toEqual([])
            ch(n).toEqual([])
        })
        it("can create a symbol literal", () => {
            const n = builder.SymbolLiteral([v])
            expect(n.kind).toBe(ElementKind.SymbolLiteral)
            expect(n.values).toEqual([v])
            ch(n).toEqual([v])
        })
        it("can create a array type", () => {
            const n = builder.ArrayType(t)
            expect(n.kind).toBe(ElementKind.ArrayType)
            expect(n.operant).toBe(t)
            ch(n).toEqual([t])
        })
        it("can create an optional type", () => {
            const n = builder.OptionalType(t)
            expect(n.kind).toBe(ElementKind.OptionalType)
            expect(n.operant).toBe(t)
            ch(n).toEqual([t])
        })
        it("can create an and type", () => {
            const n = builder.AndType(v, t)
            expect(n.kind).toBe(ElementKind.AndType)
            expect(n.left).toBe(v)
            expect(n.right).toBe(t)
            ch(n).toEqual([v, t])
        })
        it("can create an or type", () => {
            const n = builder.OrType(v, t)
            expect(n.kind).toBe(ElementKind.OrType)
            expect(n.left).toBe(v)
            expect(n.right).toBe(t)
            ch(n).toEqual([v, t])
        })
        it("can create a type constructor", () => {
            const n = builder.TypeConstructor(t, [v])
            expect(n.kind).toBe(ElementKind.TypeConstructor)
            expect(n.arguments).toEqual([v])
            ch(n).toEqual([t, v])
        })
        it("can create a vocabulary dececlaraiton", () => {
            const p = builder.VocabularyOperatorPrecedence(
                t, OperatorPlacement.Infix, OperatorPrecedenceRelation.After
            )
            const n = builder.VocabularyOperatorDeclaration(
                [], OperatorPlacement.Infix, p, OperatorAssociativity.Left
            )
            expect(n.kind).toBe(ElementKind.VocabularyOperatorDeclaration)
            expect(n.names).toEqual([])
            expect(n.placement).toBe(OperatorPlacement.Infix)
            expect(n.precedence).toBe(p)
            ch(n).toEqual([])
        })
    
        function c(v: any) {
            expect(v).not.toBeNull()
        }

        function ch(element: Element) {
            const actualChildren: Element[] = []
            for (const child of childrenOf(element))
                actualChildren.push(child)
            return expect(actualChildren)
        }
    })
})