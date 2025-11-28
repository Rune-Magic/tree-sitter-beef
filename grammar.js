/**
 * @file C# grammar for tree-sitter
 * @author Max Brunsfeld <maxbrunsfeld@gmail.com>
 * @author Damien Guard <damieng@gmail.com>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  GENERIC: 19,
  DOT: 18,
  INVOCATION: 18,
  POSTFIX: 18,
  PREFIX: 17,
  UNARY: 17,
  CAST: 17,
  RANGE: 16,
  SWITCH: 15,
  WITH: 14,
  MULT: 13,
  ADD: 12,
  SHIFT: 11,
  REL: 10,
  EQUAL: 9,
  AND: 8,
  XOR: 7,
  OR: 6,
  LOGICAL_AND: 5,
  LOGICAL_OR: 4,
  COALESCING: 3,
  CONDITIONAL: 2,
  ASSIGN: 1,
  SELECT: 0,
};

const decimalDigitSequence = /([0-9][0-9_]*[0-9]|[0-9])/;

const stringEncoding = /(u|U)8/;

module.exports = grammar({
  name: 'beef',

  conflicts: $ => [
    [$._simple_name, $.generic_name],
    [$._simple_name, $.type_parameter],
    [$._simple_name, $.subpattern],

    [$.tuple_element, $.type_pattern],
    [$.tuple_element, $.using_variable_declarator],
    [$.tuple_element, $.declaration_expression],

    [$.tuple_pattern, $.parameter],
    [$.tuple_pattern, $._simple_name],

    [$.lvalue_expression, $._name],
    [$.parameter, $.lvalue_expression],
    [$.parameter, $.declaration_expression],

    [$.type, $.attribute],
    [$.type, $.nullable_type],
    [$.type, $.nullable_type, $.array_creation_expression],
    [$.type, $._array_base_type],
    [$.type, $._array_base_type, $.array_creation_expression],
    [$.type, $.array_creation_expression],
    [$.type, $._pointer_base_type],

    [$.qualified_name, $.member_access_expression],
    [$.qualified_name, $.explicit_interface_specifier],

    [$.constant_pattern, $.non_lvalue_expression],
    [$.constant_pattern, $._expression_statement_expression],
    [$.constant_pattern, $.lvalue_expression],
    [$.constant_pattern, $._name],
    [$.constant_pattern, $.lvalue_expression, $._name],

    [$._reserved_identifier, $.modifier],
    [$._reserved_identifier, $.implicit_type],
    [$._reserved_identifier, $.implicit_type, $.var_pattern],
    [$._reserved_identifier, $.type_parameter_constraint],
    [$._reserved_identifier, $.parameter, $.lvalue_expression],
    [$._reserved_identifier, $.type_parameter_constraint, $.implicit_type],
    [$._simple_name, $.parameter],
    [$.tuple_element, $.parameter, $.declaration_expression],
    [$.parameter, $.tuple_element],

    [$.base_list],
    [$.using_directive, $.modifier],
    [$.using_directive],

    [$._constructor_declaration_initializer, $._simple_name],
  ],

  externals: $ => [
    $._optional_semi,
    $.interpolation_regular_start,
    $.interpolation_verbatim_start,
    $.interpolation_raw_start,
    $.interpolation_start_quote,
    $.interpolation_end_quote,
    $.interpolation_open_brace,
    $.interpolation_close_brace,
    $.interpolation_string_content,
    $.raw_string_start,
    $.raw_string_end,
    $.raw_string_content,
  ],

  extras: $ => [
    /[\s\u00A0\uFEFF\u3000]+/,
    $.comment,
    $.preproc_region,
    $.preproc_endregion,
    $.preproc_line,
    $.preproc_pragma,
    $.preproc_nullable,
    $.preproc_error,
    $.preproc_warning,
    $.preproc_define,
    $.preproc_undef,
  ],

  inline: $ => [
    $._namespace_member_declaration,
    $._object_creation_type,
    $._nullable_base_type,
    $._parameter_type_with_modifiers,
    $._top_level_item_no_statement,
  ],

  precedences: $ => [
    [$._anonymous_object_member_declarator, $._simple_name],
    [$.block, $.initializer_expression],
  ],

  supertypes: $ => [
    $.declaration,
    $.expression,
    $.non_lvalue_expression,
    $.lvalue_expression,
    $.literal,
    $.statement,
    $.type,
    $.type_declaration,
    $.pattern,
  ],

  word: $ => $._identifier_token,

  rules: {
    compilation_unit: $ => seq(
      optional($.shebang_directive),
      repeat($._top_level_item),
    ),

    _top_level_item: $ => prec(2, choice(
      $._top_level_item_no_statement,
    )),

    _top_level_item_no_statement: $ => choice(
      $.using_directive,
      alias($.preproc_if_in_top_level, $.preproc_if),
      $._namespace_member_declaration,
      $.file_scoped_namespace_declaration,
    ),

    using_directive: $ => seq(
      'using',
      seq(
        optional('static'),
        $._name,
      ),
      ';',
    ),

    attribute: $ => seq(
      field('name', $._name),
      optional($.attribute_argument_list),
    ),

    attribute_argument_list: $ => prec(-1, seq(
      '(',
      commaSep($.attribute_argument),
      ')',
    )),

    attribute_argument: $ => prec(-1, seq(
      optional(seq($.identifier, choice(':', '='))),
      $.expression,
    )),

    attribute_list: $ => seq(
      '[',
      optional($.attribute_target_specifier),
      commaSep1($.attribute),
      optional(','),
      ']',
    ),

    _attribute_list: $ => choice($.attribute_list, $.preproc_if_in_attribute_list),

    attribute_target_specifier: _ => seq(
      'return',
      ':',
    ),

    _namespace_member_declaration: $ => choice(
      $.namespace_declaration,
      $.type_declaration,
    ),

    namespace_declaration: $ => seq(
      'namespace',
      field('name', $._name),
      field('body', $.declaration_list),
      $._optional_semi,
    ),

    file_scoped_namespace_declaration: $ => seq(
      'namespace',
      field('name', $._name),
      ';',
    ),

    type_declaration: $ => choice(
      $.class_declaration,
      $.struct_declaration,
      $.enum_declaration,
      $.interface_declaration,
      $.delegate_declaration,
    ),

    class_declaration: $ => seq(
      $._class_declaration_initializer,
      $._declaration_list_body,
    ),

    _class_declaration_initializer: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      'class',
      field('name', $.identifier),
      repeat(choice($.type_parameter_list, $.parameter_list, $.base_list)),
      repeat($.type_parameter_constraints_clause),
    ),

    struct_declaration: $ => seq(
      $._struct_declaration_initializer,
      $._declaration_list_body,
    ),

    _struct_declaration_initializer: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      'struct',
      field('name', $.identifier),
      repeat(choice($.type_parameter_list, $.parameter_list, $.base_list)),
      repeat($.type_parameter_constraints_clause),
    ),

    enum_declaration: $ => seq(
      $._enum_declaration_initializer,
      choice(
        seq(field('body', $.enum_member_declaration_list), $._optional_semi),
        ';',
      ),
    ),

    _enum_declaration_initializer: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      'enum',
      field('name', $.identifier),
      optional($.base_list),
    ),

    enum_member_declaration_list: $ => seq(
      '{',
      commaSep(choice(
        $.enum_member_declaration,
        alias($.preproc_if_in_enum_member_declaration, $.preproc_if),
      )),
      optional(','),
      '}',
    ),

    enum_member_declaration: $ => seq(
      repeat($._attribute_list),
      field('name', $.identifier),
      optional(seq('=', field('value', $.expression))),
    ),

    interface_declaration: $ => seq(
      $._interface_declaration_initializer,
      $._declaration_list_body,
    ),

    _interface_declaration_initializer: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      'interface',
      field('name', $.identifier),
      field('type_parameters', optional($.type_parameter_list)),
      optional($.base_list),
      repeat($.type_parameter_constraints_clause),
    ),

    delegate_declaration: $ => seq(
      $._delegate_declaration_initializer,
      repeat($.type_parameter_constraints_clause),
      ';',
    ),

    _delegate_declaration_initializer: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      'delegate',
      field('type', $.type),
      field('name', $.identifier),
      field('type_parameters', optional($.type_parameter_list)),
      field('parameters', $.parameter_list),
    ),

    _declaration_list_body: $ => choice(
      seq(field('body', $.declaration_list), $._optional_semi),
      ';',
    ),

    primary_constructor_base_type: $ => seq(
      field('type', $._name),
      $.argument_list,
    ),

    modifier: _ => prec.right(choice(
      'abstract',
      'const',
      'extern',
      'fixed',
      'internal',
      prec(-1, 'new'),
      'override',
      'private',
      'protected',
      'public',
      'readonly',
      'sealed',
      'static',
      'virtual',
      'volatile',
    )),

    type_parameter_list: $ => seq('<', commaSep1($.type_parameter), '>'),

    type_parameter: $ => seq(
      repeat($._attribute_list),
      optional(choice('in', 'out')),
      field('name', $.identifier),
    ),

    base_list: $ => seq(':', commaSep1(seq($.type, optional($.argument_list)))),

    type_parameter_constraints_clause: $ => seq(
      'where',
      $.identifier,
      ':',
      commaSep1($.type_parameter_constraint),
    ),

    type_parameter_constraint: $ => choice(
      'class',
      'struct',
      seq('operator', $.identifier, $.overloadable_operator, $.identifier),
      seq('operator', $.overloadable_operator, $.identifier),
      seq('operator', 'implicit', $.identifier),
      seq('operator', 'explicit', $.identifier),
      'class',
      'struct',
      'enum',
      'interface',
      seq('struct', '*'),
      'new',
      'delete',
      'const',
      'var',
      $.type
    ),

    overloadable_operator: $ => choice(
      '!',
      '~',
      '++',
      '--',
      '+', '-',
      '*', '/',
      '%', '^',
      '|', '&',
      '<<', '>>',
      '==', '!=',
      '>', '<',
      '>=', '<=',
    ),

    operator_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      field('type', $.type),
      optional(choice('implicit', 'explicit')),
      optional($.explicit_interface_specifier),
      'operator',
      field('operator', $.overloadable_operator),
      field('parameters', $.parameter_list),
      $._function_body,
    ),

    conversion_operator_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      choice(
        'implicit',
        'explicit',
      ),
      repeat1(choice(
        $.explicit_interface_specifier,
        'operator',
        'checked',
      )),
      field('type', $.type),
      field('parameters', $.parameter_list),
      $._function_body,
    ),

    declaration_list: $ => seq(
      '{',
      repeat($.declaration),
      '}',
    ),

    declaration: $ => choice(
      $.class_declaration,
      $.struct_declaration,
      $.enum_declaration,
      $.delegate_declaration,
      $.using_field_declaration,
      $.field_declaration,
      $.method_declaration,
      $.mixin_declaration,
      $.constructor_declaration,
      $.destructor_declaration,
      $.indexer_declaration,
      $.interface_declaration,
      $.namespace_declaration,
      $.operator_declaration,
      $.conversion_operator_declaration,
      $.property_declaration,
      $.using_directive,
      $.preproc_if,
    ),

    using_field_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      'using',
      $.field_declaration,
    ),

    field_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      $.variable_declaration,
      ';',
    ),

    constructor_declaration: $ => seq(
      $._constructor_declaration_initializer,
      $._function_body,
    ),

    _constructor_declaration_initializer: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      optional($.constructor_initializer),
    ),

    destructor_declaration: $ => seq(
      repeat($._attribute_list),
      optional('extern'),
      '~',
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      $._function_body,
    ),

    method_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      field('returns', $.type),
      optional($.explicit_interface_specifier),
      field('name', $.identifier),
      field('type_parameters', optional($.type_parameter_list)),
      field('parameters', $.parameter_list),
      repeat($.type_parameter_constraints_clause),
      $._function_body,
    ),

    accessor_list: $ => seq(
      '{',
      repeat($.accessor_declaration),
      '}',
    ),

    accessor_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      field('name', choice('get', 'set', $.identifier)),
      $._function_body,
    ),

    indexer_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      field('type', $.type),
      optional($.explicit_interface_specifier),
      'this',
      field('parameters', $.bracketed_parameter_list),
      choice(
        field('accessors', $.accessor_list),
        seq(field('value', $.arrow_expression_clause), ';'),
      ),
    ),

    bracketed_parameter_list: $ => seq(
      '[',
      sep(choice($.parameter, $._parameter_array), ','),
      ']',
    ),

    property_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      field('type', $.type),
      optional($.explicit_interface_specifier),
      field('name', $.identifier),
      choice(
        seq(
          field('accessors', $.accessor_list),
          optional(seq('=', field('value', $.expression), ';')),
        ),
        seq(
          field('value', $.arrow_expression_clause),
          ';',
        ),
      ),
    ),

    mixin_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      'mixin',
      optional($.explicit_interface_specifier),
      field('name', $.identifier),
      field('type_parameters', optional($.type_parameter_list)),
      field('parameters', $.parameter_list),
      repeat($.type_parameter_constraints_clause),
      $._function_body,
    ),

    explicit_interface_specifier: $ => prec(PREC.DOT, seq(
      $._name,
      '.',
    )),

    parameter_list: $ => seq(
      '(',
      sep(choice($.parameter, $._parameter_array), ','),
      ')',
    ),

    _parameter_type_with_modifiers: $ => seq(
      repeat(prec.left(alias(
        choice('this', 'scoped', 'ref', 'out', 'in', 'readonly'),
        $.modifier,
      ))),
      field('type', $.type),
    ),

    parameter: $ => seq(
      repeat($._attribute_list),
      optional($._parameter_type_with_modifiers),
      field('name', $.identifier),
      optional(seq('=', $.expression)),
    ),

    _parameter_array: $ => seq(
      repeat($._attribute_list),
      'params',
      field('type', choice($.array_type, $.nullable_type)),
      field('name', $.identifier),
    ),

    constructor_initializer: $ => seq(
      ':',
      choice('base', 'this'),
      $.argument_list,
    ),

    argument_list: $ => seq('(', commaSep($.argument), ')'),

    tuple_pattern: $ => seq(
      '(',
      commaSep1(choice(
        field('name', $.identifier),
        $.discard,
        $.tuple_pattern,
      )),
      ')',
    ),

    argument: $ => prec(1, seq(
      optional(seq(field('name', $.identifier), ':')),
      optional(choice('ref', 'out', 'in')),
      choice(
        $.expression,
        $.declaration_expression,
      ),
    )),

    block: $ => seq('{', repeat($.statement), '}'),

    arrow_expression_clause: $ => seq('=>', $.expression),

    _function_body: $ => choice(
      field('body', $.block),
      seq(field('body', $.arrow_expression_clause), ';'),
      ';',
    ),

    variable_declaration: $ => seq(
      field('type', $.type),
      commaSep1($.variable_declarator),
    ),

    using_variable_declaration: $ => seq(
      field('type', $.type),
      commaSep1(alias($.using_variable_declarator, $.variable_declarator)),
    ),

    variable_declarator: $ => seq(
      choice(field('name', $.identifier), $.tuple_pattern),
      optional($.bracketed_argument_list),
      optional(seq('=', $.expression)),
    ),

    using_variable_declarator: $ => seq(
      field('name', $.identifier),
      optional(seq('=', $.expression)),
    ),

    bracketed_argument_list: $ => seq(
      '[',
      commaSep1($.argument),
      optional(','),
      ']',
    ),

    qualified_identifier: $ => sep1($.identifier, '.'),

    _name: $ => choice(
      $.alias_qualified_name,
      $.qualified_name,
      $._simple_name,
    ),

    alias_qualified_name: $ => seq(
      field('alias', $.identifier),
      '::',
      field('name', $._simple_name),
    ),

    _simple_name: $ => choice(
      $.identifier,
      $.generic_name,
    ),

    qualified_name: $ => prec(PREC.DOT, seq(
      field('qualifier', $._name),
      '.',
      field('name', $._simple_name),
    )),

    generic_name: $ => seq($.identifier, $.type_argument_list),

    type_argument_list: $ => seq(
      '<',
      choice(
        repeat(','),
        commaSep1($.type),
      ),
      '>',
    ),

    type: $ => choice(
      $.implicit_type,
      $.array_type,
      $._name,
      $.nullable_type,
      $.pointer_type,
      $.function_pointer_type,
      $.predefined_type,
      $.tuple_type,
      $.ref_type,
    ),

    implicit_type: _ => prec.dynamic(1, 'var'),

    array_type: $ => seq(
      field('type', $._array_base_type),
      field('rank', $.array_rank_specifier),
    ),

    _array_base_type: $ => choice(
      $.array_type,
      $._name,
      $.nullable_type,
      $.pointer_type,
      $.function_pointer_type,
      $.predefined_type,
      $.tuple_type,
    ),

    array_rank_specifier: $ => seq(
      '[',
      commaSep(optional($.expression)),
      ']',
    ),

    nullable_type: $ => seq(field('type', $._nullable_base_type), '?'),

    _nullable_base_type: $ => choice(
      $.array_type,
      $._name,
      $.predefined_type,
      $.tuple_type,
    ),

    pointer_type: $ => seq(field('type', $._pointer_base_type), '*'),

    _pointer_base_type: $ => choice(
      $._name,
      $.nullable_type,
      $.pointer_type,
      $.function_pointer_type,
      $.predefined_type,
      $.tuple_type,
    ),

    function_pointer_type: $ => seq(
      'function',
      field('returns', $.type),
      $.parameter_list,
    ),

    predefined_type: _ => token(choice(
      'void',
      'bool',
      'int',
      'int8',
      'int16',
      'int32',
      'int64',
      'uint',
      'uint8',
      'uint16',
      'uint32',
      'uint64',
      'float',
      'double',
    )),

    ref_type: $ => seq(
      'ref',
      // optional('readonly'),
      field('type', $.type),
    ),

    _ref_base_type: $ => choice(
      $.implicit_type,
      $._name,
      $.nullable_type,
      $.array_type,
      $.pointer_type,
      $.function_pointer_type,
      $.predefined_type,
      $.tuple_type,
    ),

    tuple_type: $ => seq(
      '(',
      commaSep2($.tuple_element),
      ')',
    ),

    tuple_element: $ => seq(
      field('type', $.type),
      field('name', optional($.identifier)),
    ),

    statement: $ => prec(1, choice(
      $.block,
      $.break_statement,
      $.continue_statement,
      $.do_statement,
      $.repeat_while_statement,
      $.empty_statement,
      $.expression_statement,
      $.for_statement,
      $.return_statement,
      $.switch_statement,
      $.using_statement,
      $.foreach_statement,
      $.labeled_statement,
      $.if_statement,
      $.while_statement,
      $.local_declaration_statement,
      $.local_function_statement,
      alias($.preproc_if_in_top_level, $.preproc_if),
    )),

    break_statement: _ => seq('break', ';'),

    continue_statement: _ => seq('continue', ';'),

    do_statement: $ => seq(
      'do',
      field('body', $.statement),
    ),

    repeat_while_statement: $ => seq(
      'repeat',
      field('body', $.statement),
      'while',
      '(',
      field('condition', $.expression),
      ')',
      ';',
    ),

    empty_statement: _ => ';',

    expression_statement: $ => seq($._expression_statement_expression, ';'),

    for_statement: $ => seq(
      'for',
      choice($._for_statement_conditions, $._for_statement_beef_like_iter, $._foreach_statement_initializer),
      field('body', $.statement),
    ),

    _for_statement_conditions: $ => seq(
      '(',
      field('initializer', optional(
        choice($.variable_declaration, commaSep1($.expression)),
      )),
      ';',
      field('condition', optional($.expression)),
      ';',
      field('update', optional(commaSep1($.expression))),
      ')',
    ),

    _for_statement_beef_like_iter: $ => seq(
      '(',
      field('initializer', $.variable_declaration),
      choice('<', '<='),
      field('target', optional($.expression)),
      ')',
    ),

    return_statement: $ => seq('return', optional($.expression), ';'),

    switch_statement: $ => seq(
      'switch',
      choice(
        seq(
          '(',
          field('value', $.expression),
          ')',
        ),
        field('value', $.tuple_expression),
      ),
      field('body', $.switch_body),
    ),

    switch_body: $ => seq('{', repeat($.switch_section), '}'),

    switch_section: $ => prec.left(seq(
      choice(
        seq(
          'case',
          seq(
            commaSep($.expression),
            optional($.when_clause),
          ),
        ),
        $.when_clause,
        'default',
      ),
      ':',
      repeat($.statement),
    )),

    using_statement: $ => seq(
      'using',
      '(',
      choice(
        alias($.using_variable_declaration, $.variable_declaration),
        $.expression,
      ),
      ')',
      field('body', $.statement),
    ),

    foreach_statement: $ => seq(
      $._foreach_statement_initializer,
      field('body', $.statement),
    ),

    _foreach_statement_initializer: $ => seq(
      '(',
      choice(
        seq(
          field('type', $.type),
          field('left', choice($.identifier, $.tuple_pattern)),
        ),
        field('left', $.expression),
      ),
      'in',
      field('right', $.expression),
      ')',
    ),

    labeled_statement: $ => seq(
      $.identifier,
      ':',
      $.statement,
    ),

    if_statement: $ => prec.right(seq(
      'if',
      '(',
      field('condition', $.expression),
      ')',
      field('consequence', $.statement),
      optional(seq(
        'else',
        field('alternative', $.statement),
      )),
    )),

    while_statement: $ => seq(
      'while',
      '(',
      field('condition', $.expression),
      ')',
      field('body', $.statement),
    ),

    local_declaration_statement: $ => seq(
      repeat($.modifier),
      $.variable_declaration,
      ';',
    ),

    local_function_statement: $ => seq(
      $._local_function_declaration,
      repeat($.type_parameter_constraints_clause),
      $._function_body,
    ),

    _local_function_declaration: $ => seq(
      repeat($._attribute_list),
      repeat($.modifier),
      field('type', $.type),
      field('name', $.identifier),
      field('type_parameters', optional($.type_parameter_list)),
      field('parameters', $.parameter_list),
    ),

    pattern: $ => choice(
      $.constant_pattern,
      $.declaration_pattern,
      $.discard,
      $.recursive_pattern,
      $.var_pattern,
      $.negated_pattern,
      $.parenthesized_pattern,
      $.relational_pattern,
      $.or_pattern,
      $.and_pattern,
      $.type_pattern,
    ),

    constant_pattern: $ => choice(
      $.binary_expression,
      $.default_expression,
      $.interpolated_string_expression,
      $.parenthesized_expression,
      $.postfix_unary_expression,
      $.prefix_unary_expression,
      $.type_operator_expression,
      $.tuple_expression,
      $.member_access_expression,
      $.invocation_expression,
      $.cast_expression,
      $._simple_name,
      $.literal,
    ),

    discard: _ => '?',

    parenthesized_pattern: $ => seq('(', $.pattern, ')'),

    var_pattern: $ => seq('var', $._variable_designation),

    type_pattern: $ => prec.right(field('type', $.type)),

    recursive_pattern: $ => prec.left(seq(
      optional(field('type', $.type)),
      choice(
        seq(
          $.positional_pattern_clause,
          optional($.property_pattern_clause),
        ),
        $.property_pattern_clause,
      ),
      optional($._variable_designation),
    )),

    positional_pattern_clause: $ => prec(1, seq(
      '(',
      optional(commaSep($.subpattern)),
      ')',
    )),

    property_pattern_clause: $ => prec(2, seq(
      '{',
      commaSep($.subpattern),
      optional(','),
      '}',
    )),

    subpattern: $ => prec.right(seq(
      /* optional(
        choice(
          seq($.expression, ':'),
          seq($.identifier, ':'),
        ),
      ), */
      $.pattern,
    )),

    relational_pattern: $ => choice(
      seq('<', $.expression),
      seq('<=', $.expression),
      seq('>', $.expression),
      seq('>=', $.expression),
    ),

    negated_pattern: $ => seq('!', $.pattern),

    and_pattern: $ => prec.left(PREC.AND, seq(
      field('left', $.pattern),
      field('operator', '&&'),
      field('right', $.pattern),
    )),

    or_pattern: $ => prec.left(PREC.OR, seq(
      field('left', $.pattern),
      field('operator', '||'),
      field('right', $.pattern),
    )),

    declaration_pattern: $ => seq(
      field('type', $.type),
      $._variable_designation,
    ),

    _variable_designation: $ => prec(1, choice(
      $.discard,
      $.parenthesized_variable_designation,
      field('name', $.identifier),
    )),

    parenthesized_variable_designation: $ => seq(
      '(',
      commaSep($._variable_designation),
      ')',
    ),

    expression: $ => choice(
      $.non_lvalue_expression,
      $.lvalue_expression,
    ),

    non_lvalue_expression: $ => choice(
      'base',
      $.binary_expression,
      $.interpolated_string_expression,
      $.conditional_expression,
      $.conditional_access_expression,
      $.literal,
      $._expression_statement_expression,
      $.is_expression,
      $.is_pattern_expression,
      $.as_expression,
      $.cast_expression,
      $.checked_expression,
      $.default_expression,
      $.lambda_expression,
      $.type_operator_expression,
      $.range_expression,
      $.array_creation_expression,
      $.anonymous_method_expression,
      $.anonymous_object_creation_expression,
      $.initializer_expression,
      alias($.preproc_if_in_expression, $.preproc_if),
    ),

    lvalue_expression: $ => choice(
      'this',
      $.member_access_expression,
      $.tuple_expression,
      $._simple_name,
      $.element_access_expression,
      alias($.bracketed_argument_list, $.element_binding_expression),
      alias($._pointer_indirection_expression, $.prefix_unary_expression),
      alias($._parenthesized_lvalue_expression, $.parenthesized_expression),
    ),

    // Covers error CS0201: Only assignment, call, increment, decrement, await, and new object expressions can be used as a statement
    _expression_statement_expression: $ => choice(
      $.assignment_expression,
      $.invocation_expression,
      $.postfix_unary_expression,
      $.prefix_unary_expression,
      $.object_creation_expression,
      $.parenthesized_expression,
    ),

    assignment_expression: $ => seq(
      field('left', $.lvalue_expression),
      field('operator',
        choice(
          '=',
          '+=',
          '-=',
          '*=',
          '/=',
          '%=',
          '&=',
          '^=',
          '|=',
          '<<=',
          '>>=',
          '??=',
        ),
      ),
      field('right', $.expression),
    ),

    binary_expression: $ => choice(
      ...[
        ['&&', PREC.LOGICAL_AND],
        ['||', PREC.LOGICAL_OR],
        ['>>', PREC.SHIFT],
        ['>>>', PREC.SHIFT],
        ['<<', PREC.SHIFT],
        ['&', PREC.AND],
        ['^', PREC.XOR],
        ['|', PREC.OR],
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['*', PREC.MULT],
        ['/', PREC.MULT],
        ['%', PREC.MULT],
        ['<', PREC.REL],
        ['<=', PREC.REL],
        ['==', PREC.EQUAL],
        ['!=', PREC.EQUAL],
        ['>=', PREC.REL],
        ['>', PREC.REL],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $.expression),
          // @ts-ignore
          field('operator', operator),
          field('right', $.expression),
        )),
      ),
      prec.right(PREC.COALESCING, seq(
        field('left', $.expression),
        field('operator', '??'),
        field('right', $.expression),
      )),
    ),

    postfix_unary_expression: $ => prec(PREC.POSTFIX, seq(
      $.expression,
      choice('++', '--'),
    )),

    prefix_unary_expression: $ => prec(PREC.UNARY, seq(
      choice('++', '--', '+', '-', '!', '~', '&', '^'),
      $.expression,
    )),

    _pointer_indirection_expression: $ => prec.right(PREC.UNARY, seq(
      '*',
      $.lvalue_expression,
    )),

    let_clause: $ => seq(
      'let',
      $.identifier,
      '=',
      $.expression,
    ),

    order_by_clause: $ => seq(
      'orderby',
      commaSep1($._ordering),
    ),

    _ordering: $ => seq(
      $.expression,
      optional(choice('ascending', 'descending')),
    ),

    where_clause: $ => seq('where', $.expression),

    _select_or_group_clause: $ => choice(
      $.group_clause,
      $.select_clause,
    ),

    group_clause: $ => seq('group', $.expression, 'by', $.expression),

    select_clause: $ => seq('select', $.expression),

    conditional_expression: $ => prec.right(PREC.CONDITIONAL, seq(
      field('condition', $.expression),
      '?',
      field('consequence', $.expression),
      ':',
      field('alternative', $.expression),
    )),

    conditional_access_expression: $ => prec.right(PREC.CONDITIONAL, seq(
      field('condition', $.expression),
      '?',
      choice(
        $.member_binding_expression,
        alias($.bracketed_argument_list, $.element_binding_expression),
      ),
    )),

    as_expression: $ => prec(PREC.REL, seq(
      field('left', $.expression),
      field('operator', 'as'),
      field('right', $.type),
    )),

    is_expression: $ => prec(PREC.REL, seq(
      field('left', $.expression),
      field('operator', 'is'),
      field('right', $.type),
    )),

    is_pattern_expression: $ => prec(PREC.REL, seq(
      field('expression', $.expression),
      'is',
      field('pattern', $.pattern),
    )),

    cast_expression: $ => prec(PREC.CAST, prec.dynamic(1, seq( // higher than invocation, lower than binary
      '(',
      choice(
        field('type', $.type),
        '.'
      ),
      ')',
      field('value', $.expression),
    ))),

    checked_expression: $ => seq(
      choice('checked', 'unchecked'),
      '(',
      $.expression,
      ')',
    ),

    invocation_expression: $ => prec(PREC.INVOCATION, seq(
      field('function', seq($.expression, optional('!'))),
      field('arguments', $.argument_list),
    )),

    when_clause: $ => seq('when', $.expression),

    element_access_expression: $ => prec(PREC.POSTFIX, seq(
      field('expression', $.expression),
      field('subscript', $.bracketed_argument_list),
    )),

    _allocate_new_scope: $ => seq(
      choice('new', 'scope'),
      optional(
        seq(
          ':',
          choice(':', $.identifier, $.parenthesized_expression),
        )
      ),
    ),

    interpolated_string_expression: $ => seq(
      optional($._allocate_new_scope),
      choice(
        seq(
          alias($.interpolation_regular_start, $.interpolation_start),
          alias($.interpolation_start_quote, '"'),
          repeat($._interpolated_string_content),
          alias($.interpolation_end_quote, '"'),
        ),
        seq(
          alias($.interpolation_verbatim_start, $.interpolation_start),
          alias($.interpolation_start_quote, '"'),
          repeat($._interpolated_verbatim_string_content),
          alias($.interpolation_end_quote, '"'),
        ),
        seq(
          alias($.interpolation_raw_start, $.interpolation_start),
          alias($.interpolation_start_quote, $.interpolation_quote),
          repeat($._interpolated_raw_string_content),
          alias($.interpolation_end_quote, $.interpolation_quote),
        ),
      )
    ),

    _interpolated_string_content: $ => choice(
      alias($.interpolation_string_content, $.string_content),
      $.escape_sequence,
      $.interpolation,
    ),

    _interpolated_verbatim_string_content: $ => choice(
      alias($.interpolation_string_content, $.string_content),
      $.interpolation,
    ),

    _interpolated_raw_string_content: $ => choice(
      alias($.interpolation_string_content, $.string_content),
      $.interpolation,
    ),

    interpolation: $ => seq(
      alias($.interpolation_open_brace, $.interpolation_brace),
      $.expression,
      optional($.interpolation_alignment_clause),
      optional($.interpolation_format_clause),
      alias($.interpolation_close_brace, $.interpolation_brace),
    ),

    interpolation_alignment_clause: $ => seq(',', $.expression),

    interpolation_format_clause: _ => seq(':', /[^}"]+/),

    member_access_expression: $ => prec(PREC.DOT, seq(
      field('expression', optional(choice($.expression, $.predefined_type, $._name))),
      choice('.', '->'),
      field('name', $._simple_name),
    )),

    member_binding_expression: $ => seq(
      '.',
      field('name', $._simple_name),
    ),

    object_creation_expression: $ => prec.right(seq(
      $._allocate_new_scope,
      field('type', choice($.type, '.')),
      field('arguments', optional($.argument_list)),
      field('initializer', optional($.initializer_expression)),
    )),

    // inline
    _object_creation_type: $ => choice(
      $._name,
      $.nullable_type,
      $.predefined_type,
    ),

    parenthesized_expression: $ => seq(
      '(',
      $.non_lvalue_expression,
      ')',
    ),

    _parenthesized_lvalue_expression: $ => seq('(', $.lvalue_expression, ')'),

    lambda_expression: $ => prec(-1, seq(
      optional($._allocate_new_scope),
      optional($._lambda_explicit_captures),
      $._lambda_expression_init,
      '=>',
      field('body', choice($.block, $.expression)),
    )),

    _lambda_explicit_captures: $ => prec(-1, seq(
      '[',
      commaSep1(seq(
        choice('=', '&'),
        optional($.identifier),
      )),
      ']',
    )),

    _lambda_expression_init: $ => prec(-1, seq(
      repeat($._attribute_list),
      repeat(prec(-1, alias('static', $.modifier))),
      optional(field('type', $.type)),
      field('parameters', $._lambda_parameters),
    ),
    ),

    _lambda_parameters: $ => prec(-1, choice(
      $.parameter_list,
      alias($.identifier, $.implicit_parameter),
    )),

    array_creation_expression: $ => prec.dynamic(PREC.UNARY, seq(
      $._allocate_new_scope,
      field('type', $.array_type),
      optional($.initializer_expression),
    )),

    anonymous_method_expression: $ => seq(
      repeat(prec(-1, alias('static', $.modifier))),
      'delegate',
      optional(field('parameters', $.parameter_list)),
      $.block,
    ),

    anonymous_object_creation_expression: $ => prec(-1, seq(
      $._allocate_new_scope,
      $.type,
      $.argument_list,
      '{',
      commaSep($._anonymous_object_member_declarator),
      optional(','),
      '}',
    )),

    _anonymous_object_member_declarator: $ => choice(
      seq($.identifier, '=', $.expression),
      $.expression,
    ),

    /* implicit_array_creation_expression: $ => seq(
      'new',
      '[',
      repeat(','),
      ']',
      $.initializer_expression,
    ), */

    initializer_expression: $ => prec(1, seq(
      '{',
      commaSep($.expression),
      optional(','),
      '}',
    )),

    declaration_expression: $ => prec.dynamic(1, seq(
      field('type', $.type),
      field('name', $.identifier),
    )),

    default_expression: $ => prec.right(seq(
      'default',
      optional(seq(
        '(',
        field('type', $.type),
        ')',
      )),
    )),

    type_operator_expression: $ => choice(
      seq(
        choice(
          'sizeof',
          'alignof',
          'strideof',
          'alloctype',
          'nullable',
          'rettype',
          'typeof',
        ),
        '(', $.type, ')'
      ),
      seq(
        choice(
          'comptype',
          'decltype',
        ),
        '(', $.expression, ')'
      ),
      seq(
        choice(
          'offsetof',
          'nameof',
        ),
        '(', $.type, ',', $.identifier, ')'
      ),
    ),

    range_expression: $ => prec.right(PREC.RANGE, seq(
      optional($.expression),
      choice('...', '..<'),
      optional($.expression),
    )),

    tuple_expression: $ => seq(
      '(',
      commaSep2($.argument),
      ')',
    ),

    literal: $ => choice(
      $.null_literal,
      $.character_literal,
      $.integer_literal,
      $.real_literal,
      $.boolean_literal,
      $.string_literal,
      $.verbatim_string_literal,
      $.raw_string_literal,
    ),

    null_literal: _ => 'null',

    character_literal: $ => seq(
      '\'',
      choice($.character_literal_content, $.escape_sequence),
      '\'',
    ),

    character_literal_content: $ => token.immediate(/[^'\\]/),

    integer_literal: _ => token(seq(
      choice(
        decimalDigitSequence, // Decimal
        (/0[xX][0-9a-fA-F_]*[0-9a-fA-F]+/), // Hex
        (/0[bB][01_]*[01]+/), // Binary
      ),
      optional(/([uU][lL]?|[lL][uU]?)/),
    )),

    real_literal: _ => {
      const suffix = /[fFdDmM]/;
      const exponent = /[eE][+-]?[0-9][0-9_]*/;
      return token(choice(
        seq(
          decimalDigitSequence,
          '.',
          decimalDigitSequence,
          optional(exponent),
          optional(suffix),
        ),
        seq(
          '.',
          decimalDigitSequence,
          optional(exponent),
          optional(suffix),
        ),
        seq(
          decimalDigitSequence,
          exponent,
          optional(suffix),
        ),
        seq(
          decimalDigitSequence,
          suffix,
        ),
      ));
    },

    string_literal: $ => seq(
      '"',
      repeat(choice(
        $.string_literal_content,
        $.escape_sequence,
      )),
      '"',
      optional($.string_literal_encoding),
    ),

    string_literal_content: _ => choice(
      token.immediate(prec(1, /[^"\\\n]+/)),
      prec(2, token.immediate(seq('\\', /[^abefnrtv'\"\\\?0]/))),
    ),

    escape_sequence: _ => token(choice(
      /\\x[0-9a-fA-F]{1,4}/,
      /\\u[0-9a-fA-F]{4}/,
      /\\U[0-9a-fA-F]{8}/,
      /\\[abefnrtv'\"\\\?0]/,
    )),

    string_literal_encoding: _ => token.immediate(stringEncoding),

    verbatim_string_literal: _ => token(seq(
      '@"',
      repeat(choice(
        /[^"]/,
        '""',
      )),
      '"',
      optional(stringEncoding),
    )),

    raw_string_literal: $ => seq(
      $.raw_string_start,
      $.raw_string_content,
      $.raw_string_end,
      optional(stringEncoding),
    ),

    boolean_literal: _ => choice('true', 'false'),

    _identifier_token: _ => token(seq(optional('@'), /(\p{XID_Start}|_|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})(\p{XID_Continue}|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})*/)),
    identifier: $ => choice(
      $._identifier_token,
      $._reserved_identifier,
    ),

    _reserved_identifier: _ => prec(-99, choice(
      'abstract', 'alignof', 'alloctype', 'append', 'as', 'asm', 'base', 'box', 'break',
      'case', 'catch', 'checked', 'class', 'comptype', 'const', 'continue', 'decltype', 'default', 'defer', 'delegate',
      'delete', 'do', 'else', 'enum', 'explicit', 'extension', 'extern', 'false', 'finally', 'fixed', 'for', 'function',
      'if', 'implicit', 'in', 'interface', 'internal', 'is', 'isconst', 'mixin', 'namespace', 'new', 'null', 'nullable',
      'offsetof', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public', 'readonly', 'ref',
      'rettype', 'return', 'repeat', 'scope', 'sealed', 'sizeof', 'static', 'strideof', 'struct', 'switch', 'this', 'true', 'try',
      'typealias', 'typeof', 'unchecked', 'using', 'var', 'virtual', 'volatile', 'where', 'while',
    )),

    // Preprocessor

    ...preprocIf('', $ => $.declaration),
    ...preprocIf('_in_top_level', $ => choice($._top_level_item_no_statement, $.statement)),
    ...preprocIf('_in_expression', $ => $.expression, -2, false),
    ...preprocIf('_in_enum_member_declaration', $ => $.enum_member_declaration, 0, false),
    ...preprocIf('_in_attribute_list', $ => $.attribute_list, -1, false),

    preproc_arg: _ => token(prec(-1, /\S([^/\n]|\/[^*]|\\\r?\n)*/)),
    preproc_directive: _ => /#[ \t]*[a-zA-Z0-9]\w*/,

    _preproc_expression: $ => choice(
      $.identifier,
      $.boolean_literal,
      $.integer_literal,
      $.character_literal,
      alias($.preproc_unary_expression, $.unary_expression),
      alias($.preproc_binary_expression, $.binary_expression),
      alias($.preproc_parenthesized_expression, $.parenthesized_expression),
    ),

    preproc_parenthesized_expression: $ => seq(
      '(',
      $._preproc_expression,
      ')',
    ),

    preproc_unary_expression: $ => prec.left(PREC.UNARY, seq(
      field('operator', '!'),
      field('argument', $._preproc_expression),
    )),

    preproc_binary_expression: $ => {
      const table = [
        ['||', PREC.LOGICAL_OR],
        ['&&', PREC.LOGICAL_AND],
        ['==', PREC.EQUAL],
        ['!=', PREC.EQUAL],
      ];

      return choice(...table.map(([operator, precedence]) => {
        return prec.left(precedence, seq(
          field('left', $._preproc_expression),
          // @ts-ignore
          field('operator', operator),
          field('right', $._preproc_expression),
        ));
      }));
    },

    preproc_region: $ => seq(
      preprocessor('region'),
      optional(field('content', $.preproc_arg)),
      /\n/,
    ),

    preproc_endregion: $ => seq(
      preprocessor('endregion'),
      optional(field('content', $.preproc_arg)),
      /\n/,
    ),

    preproc_line: $ => seq(
      preprocessor('line'),
      choice(
        'default',
        'hidden',
        seq($.integer_literal, optional($.string_literal)),
        seq(
          '(', $.integer_literal, ',', $.integer_literal, ')',
          '-',
          '(', $.integer_literal, ',', $.integer_literal, ')',
          optional($.integer_literal),
          $.string_literal,
        ),
      ),
      /\n/,
    ),

    preproc_pragma: $ => seq(
      preprocessor('pragma'),
      choice(
        seq('warning',
          choice('disable', 'restore'),
          commaSep(
            choice(
              $.identifier,
              $.integer_literal,
            ))),
        seq('checksum', $.string_literal, $.string_literal, $.string_literal),
      ),
      /\n/,
    ),

    preproc_nullable: _ => seq(
      preprocessor('nullable'),
      choice('enable', 'disable', 'restore'),
      optional(choice('annotations', 'warnings')),
      /\n/,
    ),

    preproc_error: $ => seq(
      preprocessor('error'),
      $.preproc_arg,
      /\n/,
    ),

    preproc_warning: $ => seq(
      preprocessor('warning'),
      $.preproc_arg,
      /\n/,
    ),

    preproc_define: $ => seq(
      preprocessor('define'),
      $.preproc_arg,
      /\n/,
    ),

    preproc_undef: $ => seq(
      preprocessor('undef'),
      $.preproc_arg,
      /\n/,
    ),

    shebang_directive: _ => token(seq('#!', /.*/)),

    comment: _ => token(choice(
      seq('//', /[^\n\r]*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),
  },
});

/**
 * Creates a preprocessor regex rule
 *
 * @param {RegExp | Rule | string} command
 *
 * @returns {AliasRule}
 */
function preprocessor(command) {
  return alias(new RegExp('#[ \t]*' + command), '#' + command);
}

/**
 *
 * @param {string} suffix
 *
 * @param {RuleBuilder<string>} content
 *
 * @param {number} precedence
 *
 * @param {boolean} rep
 *
 * @returns {RuleBuilders<string, string>}
 */
function preprocIf(suffix, content, precedence = 0, rep = true) {
  /**
   *
   * @param {GrammarSymbols<string>} $
   *
   * @returns {ChoiceRule}
   */
  function alternativeBlock($) {
    return choice(
      suffix ? alias($['preproc_else' + suffix], $.preproc_else) : $.preproc_else,
      suffix ? alias($['preproc_elif' + suffix], $.preproc_elif) : $.preproc_elif,
    );
  }

  return {
    ['preproc_if' + suffix]: $ => prec(precedence, seq(
      preprocessor('if'),
      field('condition', $._preproc_expression),
      /\n/,
      rep ? repeat(content($)) : optional(content($)),
      field('alternative', optional(alternativeBlock($))),
      preprocessor('endif'),
    )),

    ['preproc_else' + suffix]: $ => prec(precedence, seq(
      preprocessor('else'),
      rep ? repeat(content($)) : optional(content($)),
    )),

    ['preproc_elif' + suffix]: $ => prec(precedence, seq(
      preprocessor('elif'),
      field('condition', $._preproc_expression),
      /\n/,
      rep ? repeat(content($)) : optional(content($)),
      field('alternative', optional(alternativeBlock($))),
    )),
  };
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to match two or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function commaSep2(rule) {
  return seq(rule, repeat1(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {ChoiceRule}
 */
function sep(rule, separator) {
  return optional(sep1(rule, separator));
}
