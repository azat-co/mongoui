var entityCode = require('./entityCode')
  , parse = require('./parse')

module.exports = {
  parse: parse
, escapeHtml: escapeHtml
, escapeAttribute: escapeAttribute
, unescapeEntities: unescapeEntities
, isVoid: isVoid
, conditionalComment: conditionalComment
, trimLeading: trimLeading
, trimText: trimText
, trimTag: trimTag
, minify: minify
}

function escapeHtml(value) {
  if (value == null) return ''

  return value
    .toString()
    .replace(/&(?!\s)|</g, function(match) {
      return match === '&' ? '&amp;' : '&lt;'
    })
}

function escapeAttribute(value) {
  if (value == null || value === '') return '""'

  value = value
    .toString()
    .replace(/&(?!\s)|"/g, function(match) {
      return match === '&' ? '&amp;' : '&quot;'
    })
  return /[ =<>']/.test(value) ? '"' + value + '"' : value
}

// Based on:
// http://code.google.com/p/jslibs/wiki/JavascriptTips#Escape_and_unescape_HTML_entities
function unescapeEntities(html) {
  return html.replace(/&([^;]+);/g, function(match, entity) {
    var charCode = entity.charAt(0) === '#'
          ? entity.charAt(1) === 'x'
            ? entity.slice(2, 17)
            : entity.slice(1)
          : entityCode[entity]
    return String.fromCharCode(charCode)
  })
}

var voidElement = {
  area: 1
, base: 1
, br: 1
, col: 1
, command: 1
, embed: 1
, hr: 1
, img: 1
, input: 1
, keygen: 1
, link: 1
, meta: 1
, param: 1
, source: 1
, track: 1
, wbr: 1
}
function isVoid(name) {
  return name in voidElement
}

// Assume any HTML comment that starts with `<!--[` or ends with `]-->`
// is a conditional comment. This can also be used to keep comments in
// minified HTML, such as `<!--[ Copyright John Doe, MIT Licensed ]-->`
function conditionalComment(tag) {
  return /(?:^<!--\[)|(?:\]-->$)/.test(tag)
}

// Remove leading whitespace and newlines from a string. Whitespace at the end
// of a line will be maintained
function trimLeading(text) {
  return text ? text.replace(/\r?\n\s*/g, '') : ''
}

// Remove leading & trailing whitespace and newlines from a string
function trimText(text) {
  return text ? text.replace(/\s*\r?\n\s*/g, '') : ''
}

// Within a tag, remove leading & trailing whitespace. Keep a linebreak, since
// this could be the separator between attributes
function trimTag(tag) {
  return tag.replace(/(?:\s*\r?\n\s*)+/g, '\n')
}

// Remove linebreaks, leading & trailing space, and comments. Maintain a
// linebreak between HTML tag attributes and maintain conditional comments.
function minify(html) {
  var minified = ''
    , minifyContent = true

  parse(html, {
    start: function(tag, tagName, attrs) {
      minifyContent = !('x-no-minify' in attrs)
      minified += trimTag(tag)
    }
  , end: function(tag) {
      minified += trimTag(tag)
    }
  , text: function(text) {
      minified += minifyContent ? trimText(text) : text
    }
  , comment: function(tag) {
      if (conditionalComment(tag)) minified += tag
    }
  , other: function(tag) {
      minified += tag
    }
  })
  return minified
}
