export const enum Token {
    Invalid,
    EOF,
    Identifier,
    Symbol,
    Literal,
    LParen,
    RParen,
    LBrack,
    RBrack,
    LBrace,
    RBrace,
    Semi,
    Colon,
    Comma,
    Dot,
    Scope, // ::
    VocabStart, // <|
    VocabEnd, // |>
    ConstraintStart, // <*
    ConstraintEnd, // *>
    BangRBrack, // !]
    LBrackBang, // [!
    BangRBrace, // !}
    LBraceBang, // {!

    // Reserved identifier
    False,
    Let,
    True,
    Return,
    Val,
    Var,
}

export function nameOfToken(token: Token): string {
    switch (token) {
        case Token.Invalid: return "<Invalid>"
        case Token.EOF: return "<EOF>"
        case Token.Identifier: return "<Identifier>"
        case Token.Symbol: return "<Symbol>"
        case Token.Literal: return "<Literal>"
        case Token.LParen: return "("
        case Token.RParen: return ")"
        case Token.LBrack: return "["
        case Token.RBrack: return "]"
        case Token.LBrace: return "{"
        case Token.RBrace: return "}"
        case Token.Semi: return ";"
        case Token.Colon: return ":"
        case Token.Comma: return ","
        case Token.Dot: return "."
        case Token.Scope: return "::"
        case Token.VocabStart: return "<|"
        case Token.VocabEnd: return "|>"
        case Token.BangRBrack: return "!]"
        case Token.LBrackBang: return "[!"
        case Token.BangRBrace: return "!}"
        case Token.LBraceBang: return "{!"
        case Token.False: return "false"
        case Token.Let: return "let"
        case Token.True: return "true"
        case Token.Return: return "return"
        case Token.Val: return "val"
        case Token.Var: return "var"
    }
    return "<Unknown>"
}

export const enum PseudoToken {
    None,

    // Identifiers
    After,
    Before,
    Break,
    Continue,
    Else,
    Identifiers,
    If,
    Infix,
    Left,
    Loop,
    Operator,
    Postfix,
    Prefix,
    Right,
    This,
    ThisType,
    When,
    Where,
    While,

    // Symbols
    Add, // +
    And, // &
    Bar, // |
    Sub, // -
    Mult, // *
    Div, // /
    Rem, // %
    Not, // !
    LogicalAnd, // &&
    LogicalOr, // ||
    GreaterThan, // >
    GreaterThanEqual, // >=
    Equal, // =
    DoubleEqual, // ==
    NotEqual, // !=
    LessThan, // <
    LessThanEqual, // <=
    LessThanBang, // <!
    BangGreaterThan, // !>
    Question, // ?
    Arrow, // ->
    Range, // ..
    Spread, // ...
    Escaped, // An escaped identifier using ` ` syntax
}

export function nameOfPseudoToken(pseudo: PseudoToken): string {
    switch (pseudo) {
        case PseudoToken.None: return "<None>"
        case PseudoToken.After: return "after"
        case PseudoToken.Before: return "before"
        case PseudoToken.Break: return "break"
        case PseudoToken.Continue: return "continue"
        case PseudoToken.Else: return "else"
        case PseudoToken.Identifiers: return "identifiers"
        case PseudoToken.If: return "if"
        case PseudoToken.Infix: return "infix"
        case PseudoToken.Left: return "left"
        case PseudoToken.Loop: return "loop"
        case PseudoToken.Operator: return "operator"
        case PseudoToken.Postfix: return "postfix"
        case PseudoToken.Prefix: return "prefix"
        case PseudoToken.Right: return "right"
        case PseudoToken.This: return "this"
        case PseudoToken.ThisType: return "This"
        case PseudoToken.When: return "when"
        case PseudoToken.Where: return "where"
        case PseudoToken.While: return "while"
        case PseudoToken.Add: return "+"
        case PseudoToken.And: return "&"
        case PseudoToken.Bar: return "|"
        case PseudoToken.Sub: return "-"
        case PseudoToken.Mult: return "*"
        case PseudoToken.Div: return "/"
        case PseudoToken.Rem: return "%"
        case PseudoToken.Not: return "!"
        case PseudoToken.LogicalAnd: return "&&"
        case PseudoToken.LogicalOr: return "||"
        case PseudoToken.GreaterThan: return ">"
        case PseudoToken.GreaterThanEqual: return ">="
        case PseudoToken.Equal: return "="
        case PseudoToken.DoubleEqual: return "=="
        case PseudoToken.NotEqual: return "!="
        case PseudoToken.LessThan: return "<"
        case PseudoToken.LessThanEqual: return "<="
        case PseudoToken.LessThanBang: return "<!"
        case PseudoToken.BangGreaterThan: return "!>"
        case PseudoToken.Question: return "?"
        case PseudoToken.Arrow: return "->"
        case PseudoToken.Range: return ".."
        case PseudoToken.Spread: return "..."
        case PseudoToken.Escaped: return "<Escaped>"
    }
    return "<Unknown>"
}


export const enum Literal {
    None,
    Boolean,
    Int8,
    Int16,
    Int32,
    Int64,
    UInt8,
    UInt16,
    UInt32,
    UInt64,
    Flaot32,
    Float64,
    Character,
    String,
}