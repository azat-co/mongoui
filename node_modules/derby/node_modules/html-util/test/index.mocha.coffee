expect = require 'expect.js'
html = require '../lib'

describe 'minify', ->

  it 'should minify HTML', ->
    test = '''
      <!DOCTYPE html>
      <!-- This comment is removed -->
      <title></title>
      <!--[if gt IE 6]>
      IE greater than 6
      <![endif]-->
      <!--[if !IE]> -->
      Not IE
      <!-- <![endif]-->
      <b>  
        Hi there
      </b>
      <script x-no-minify>
        stuff: rocks
        other: salt
      </script>
      '''
    expected = '<!DOCTYPE html>' +
      '<title></title><!--[if gt IE 6]>\n' +
      'IE greater than 6\n' +
      '<![endif]-->' +
      '<!--[if !IE]> -->Not IE<!-- <![endif]-->' +
      '<b>  Hi there</b><script x-no-minify>\n' +
      '  stuff: rocks\n' +
      '  other: salt\n' +
      '</script>'

    expect(html.minify(test)).to.equal expected
