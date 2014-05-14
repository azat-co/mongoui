expect = require 'expect.js'
html = require '../lib'

describe 'parse', ->

  it 'should parse with no handlers', ->
    html.parse '<p id=stuff>Heyo</p>'

  it 'should parse basic HTML', ->
    s =
      '<!DOCTYPE html>' + # doctype
      '<h1>Willow ' + # Tag containing chars
        '<EM ID=h1 CLASS=head>' + # Nested tag, attributes, uppercase
          'tree' +
        '</em>' +
      '</h1>' +
      '<script>' + # Scripts should be passed through as rawText
        '<b></b>' +
      '</script>' +
      '<!-- here is a comment\n cool beans!-->\n\t  ' +
      '<b><b><b></b></b></b>' + # Nested tags, no contents
      '<form action= \'javascript:alert("cows")\' >' + # Single quote attr
        '<input type = "checkbox" disabled data-stuff=hey>' + # double quotes attr, empty attr, and data attribute
        '<input type="submit" value=>' + # While invalid HTML, value should be an empty string
      '</FORM>' + # Uppercase end
      '<img src=/img/stuff.png alt=""/>' + # Don't choke on void element with slash
      '<p>Flowers ' + # Trailing whitespace on implicitly closed tag
      '<p>Flight</p>\n' + # Explicitly closed tag
      '  \t<p>Fight</p>\t \n' + # New line and leading whitespace
      '<p>Blight\nSight</p> <p / >' # Whitespace between tags
    expected = [
      ['other', '!DOCTYPE html']
      ['start', 'h1', {}]
      ['text', 'Willow ']
      ['start', 'em', { id: 'h1', 'class': 'head' }]
      ['text', 'tree']
      ['end', 'em']
      ['end', 'h1']
      ['start', 'script', {}]
      ['text', '<b></b>']
      ['end', 'script']
      ['comment', ' here is a comment\n cool beans!']
      ['text', '\n\t  ']
      ['start', 'b', {}]
      ['start', 'b', {}]
      ['start', 'b', {}]
      ['end', 'b']
      ['end', 'b']
      ['end', 'b']
      ['start', 'form', {action: 'javascript:alert("cows")'}]
      ['start', 'input', {type: 'checkbox', disabled: null, 'data-stuff': 'hey'}]
      ['start', 'input', {type: 'submit', value: ''}]
      ['end', 'form']
      ['start', 'img', {src: '/img/stuff.png', alt: ''}]
      ['start', 'p', {}]
      ['text', 'Flowers ']
      ['start', 'p', {}]
      ['text', 'Flight']
      ['end', 'p']
      ['text', '\n  \t']
      ['start', 'p', {}]
      ['text', 'Fight']
      ['end', 'p']
      ['text', '\t \n']
      ['start', 'p', {}]
      ['text', 'Blight\nSight']
      ['end', 'p']
      ['text', ' ']
      ['start', 'p', {}]
    ]

    stack = []
    html.parse s,
      start: (tag, tagName, attrs) -> stack.push ['start', tagName, attrs]
      end: (tag, tagName) -> stack.push ['end', tagName]
      text: (text) -> stack.push ['text', text]
      comment: (tag, data) -> stack.push ['comment', data]
      other: (tag, data) -> stack.push ['other', data]

    for item, index in expected
      expect(stack[index]).to.eql item
    expect(stack.length).to.equal expected.length
