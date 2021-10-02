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
        case Token.Invalid: return "Invalid"
        case Token.EOF: return "EOF"
        case Token.Identifier: return "Identifier" 
        case Token.Symbol: return "Symbol"
        case Token.Literal: return "Literal"
        case Token.LParen: return "LParen"
        case Token.RParen: return "RParen"
        case Token.LBrack: return "LBrack"
        case Token.RBrack: return "RBrack"
        case Token.LBrace: return "LBrace"
        case Token.RBrace: return "RBrace"
        case Token.Semi: return "Semi"
        case Token.Colon: return "Colon"
        case Token.Comma: return "Comma"
        case Token.Dot: return "Dot"
        case Token.Scope: return "Scope" 
        case Token.VocabStart: return "VocabStart"
        case Token.VocabEnd: return "VocabEnd"
        case Token.BangRBrack: return "BangRBrack"
        case Token.LBrackBang: return "LBrackBang"
        case Token.BangRBrace: return "BangRBrace"
        case Token.LBraceBang: return "LBraceBang"
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
    Question, // ?
    Arrow, // ->
    Range, // ..
    Spread, // ...
    Escaped, // An escaped identifier using ` ` syntax
}

export function nameOfPseudoToken(pseudo: PseudoToken): string {
    switch (pseudo) {
        case PseudoToken.None: return "None"  
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
        case PseudoToken.Add: return "Add"  
        case PseudoToken.And: return "And"  
        case PseudoToken.Bar: return "Bar"  
        case PseudoToken.Sub: return "Sub"  
        case PseudoToken.Mult: return "Mult"  
        case PseudoToken.Div: return "Div"  
        case PseudoToken.Rem: return "Rem"  
        case PseudoToken.Not: return "Not"  
        case PseudoToken.LogicalAnd: return "LogicalAnd"  
        case PseudoToken.LogicalOr: return "LogicalOr"  
        case PseudoToken.GreaterThan: return "GreaterThan"  
        case PseudoToken.GreaterThanEqual: return "GreaterThanEqual"  
        case PseudoToken.Equal: return "Equal"  
        case PseudoToken.DoubleEqual: return "DoubleEqual"  
        case PseudoToken.NotEqual: return "NotEqual"  
        case PseudoToken.LessThan: return "LessThan"  
        case PseudoToken.LessThanEqual: return "LessThanEqual"  
        case PseudoToken.Question: return "Question"  
        case PseudoToken.Arrow: return "Arrow"  
        case PseudoToken.Range: return "Range"  
        case PseudoToken.Spread: return "Spread"  
        case PseudoToken.Escaped: return "Escaped" 
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