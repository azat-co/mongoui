var startTag = /^<([^\s=\/!>]+)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+)?)?)*)\s*(\/?)\s*>/
  , endTag = /^<\/([^\s=\/!>]+)[^>]*>/
  , comment = /^<!--([\s\S]*?)-->/
  , commentInside = /<!--[\s\S]*?-->/
  , other = /^<([\s\S]*?)>/
  , attr = /([^\s=]+)(?:\s*(=)\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+))?)?/g
  , rawTagsDefault = /^(style|script)$/i

function empty() {}

function matchEndDefault(tagName) {
  return new RegExp('</' + tagName, 'i')
}

function onStartTag(html, match, handler) {
  var attrs = {}
    , tag = match[0]
    , tagName = match[1]
    , remainder = match[2]
  html = html.slice(tag.length)

  remainder.replace(attr, function(match, name, equals, attr0, attr1, attr2) {
    attrs[name.toLowerCase()] = attr0 || attr1 || attr2 || (equals ? '' : null)
  })
  handler(tag, tagName.toLowerCase(), attrs, html)

  return html
}

function onTag(html, match, handler) {
  var tag = match[0]
    , data = match[1]
  html = html.slice(tag.length)

  handler(tag, data, html)

  return html
}

function onText(html, index, isRawText, handler) {
  var text
  if (~index) {
    text = html.slice(0, index)
    html = html.slice(index)
  } else {
    text = html
    html = ''
  }

  if (text) handler(text, isRawText, html)

  return html
}

function rawEnd(html, ending, offset) {
  offset || (offset = 0)
  var index = html.search(ending)
    , commentMatch = html.match(commentInside)
    , commentEnd
  // Make sure that the ending condition isn't inside of an HTML comment
  if (commentMatch && commentMatch.index < index) {
    commentEnd = commentMatch.index + commentMatch[0].length
    offset += commentEnd
    html = html.slice(commentEnd)
    return rawEnd(html, ending, offset)
  }
  return index + offset
}

module.exports = function(html, options) {
  if (options == null) options = {}

  if (!html) return

  var startHandler = options.start || empty
    , endHandler = options.end || empty
    , textHandler = options.text || empty
    , commentHandler = options.comment || empty
    , otherHandler = options.other || empty
    , matchEnd = options.matchEnd || matchEndDefault
    , errorHandler = options.error
    , rawTags = options.rawTags || rawTagsDefault
    , index, last, match, tagName, err

  while (html) {
    if (html === last) {
      err = new Error('HTML parse error: ' + html)
      if (errorHandler) {
        errorHandler(err)
      } else {
        throw err
      }
    }
    last = html

    if (html[0] === '<') {
      if (match = html.match(startTag)) {
        html = onStartTag(html, match, startHandler)

        tagName = match[1]
        if (rawTags.test(tagName)) {
          index = rawEnd(html, matchEnd(tagName))
          html = onText(html, index, true, textHandler)
        }
        continue
      }

      if (match = html.match(endTag)) {
        match[1] = match[1].toLowerCase()  // tagName
        html = onTag(html, match, endHandler)
        continue
      }

      if (match = html.match(comment)) {
        html = onTag(html, match, commentHandler)
        continue
      }

      if (match = html.match(other)) {
        html = onTag(html, match, otherHandler)
        continue
      }
    }

    index = html.indexOf('<')
    html = onText(html, index, false, textHandler)
  }
}
