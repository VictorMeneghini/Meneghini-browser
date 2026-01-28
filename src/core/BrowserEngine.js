
/* eslint-disable no-undef */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

// const SELF_CLOSING_TAGS = require('./constants/SELF_CLOSING_TAGS');
// const HEAD_TAGS = require('./constants/HEAD_TAGS');

const HSTEP = 15
const VSTEP = 31

class HTMLParser {
  constructor(body) {
    this.body = body;
    this.unfinished = [];
    this.SELF_CLOSING_TAGS = SELF_CLOSING_TAGS;
    this.HEAD_TAGS = HEAD_TAGS;
  }

  implicit_tags(tag) {
    while (true) {
      const openTags = this.unfinished.map(node => node.tag)

      if (openTags.length == 0 && tag !== 'html' ) {
        this.addTag('html')
      }

      else if (openTags.length == 1 && openTags[0] == 'html' && !['head', 'body', '/html'].includes(tag)) {
        if (this.HEAD_TAGS.includes(tag)) {
          this.addTag("head")
        }
        else {
          this.addTag('body')
        }
      } else if (openTags[0] === 'html' && openTags[1] === 'head' && !['/head', ...this.HEAD_TAGS].includes(tag)) {
        this.addTag('/head')
      } else {
        break;
      }
    }
  }

  addText(text) {
    if(!text.length) return

    this.implicit_tags(null)

    const parent = this.unfinished.length
      ? this.unfinished[this.unfinished.length - 1]
      : null

    const node = new Text(text, parent)
    parent?.children?.push(node)
  }

  getAttributes(text) {
    const parts = text.split(' ')
    const tag = parts.splice(0, 1)    

    const attributes = parts.reduce((acc, part) => {
      const [attribute, value] = part.split(/=(.*)/s)
      const cleanValue = value?.replace(/^['"]|['"]$/g, '');

      if (!acc[attribute]) {
        if (!cleanValue) {
          acc[attribute] = ''
        } else {
          acc[attribute] = cleanValue
        }
      }

      return acc
    }, {})

    return [tag, attributes]
  }

  addTag(tag) {
    const [currentTag, attributes] = this.getAttributes(tag)

    if (currentTag[0] == '!') return;

    this.implicit_tags(tag)

    if (currentTag[0] === '/') {
      if (this.unfinished.length == 1) return;

      let node = this.unfinished.pop()
      let parent = this.unfinished[this.unfinished.length - 1]
      parent.children.push(node)
    }  
    else if(this.SELF_CLOSING_TAGS.includes(currentTag)) {
      let parent = this.unfinished[this.unfinished.length - 1]
      let node = new Element(currentTag,attributes, parent)

      parent.children.push(node)
    } 
    else {
      const parent = this.unfinished.length ? this.unfinished[this.unfinished.length - 1] : null;
      let node = new Element(currentTag,attributes, parent)
      this.unfinished.push(node)
    }
  }

  finish() {
    if (this.unfinished.length === 0) {
      this.implicit_tags(null)
    }

    while (this.unfinished.length > 1) {
      const node = this.unfinished.pop()
      const parent = this.unfinished[this.unfinished.length - 1]
      parent.children.push(node)
    }

    return this.unfinished.pop() ?? null
  }

  parse() {
    let text = ''
    let inTag = false

    for (const character of this.body) {
      if (character == '<') {
        if (!inTag && text) {
          this.addText(text)
          text = ''
        }
        inTag = true
      } 
      else if(character == '>') {
        inTag = false
        this.addTag(text)
        text = ''
      }
      else {
        text += character
      }
    }

    if(!inTag && text) {
      this.addText(text)
    }

    return this.finish()
  }

  printTree(node, indent=0) {
    if (!node) return;

    const indentation = ' '.repeat(indent * 0.2);
    console.log(node.text)
    console.log(indentation, node?.tag ? `<${node?.tag}>` : node?.text)

    for (const child of node.children) {
      this.printTree(child, indent + 2)
    }

  }
}

class Text {
  constructor(text, parent) {
    this.parent = parent
    this.children = []
    this.text = text
  }
}

class Element {
  constructor(tag, attributes, parent) {
    this.tag = tag
    this.attributes = attributes

    this.children = []
    this.parent = parent
  }

  analyzeTag() {
    const tagMap = {
      'i': { style: 'italic' },
      '/i': { style: 'normal' },
      'b': { weight: 'bold' },
      '/b': { weight: 'normal' },
      'small': { size: '15' },
      '/small': { size: '20' },
      'big': {size: '25'},
      '/big': {size: '20'},
      'h1': {size: '30'},
      '/h1': {size: '20'}
    }

    return tagMap[this.tag] || { style: '', weight: '' }
  }
}

class Layout {
  constructor(tokens, ctx, canvas) {
    this.tokens = tokens
    this.display_list = []
    this.cursor_x = HSTEP
    this.cursor_y = VSTEP
    this.style = 'normal'
    this.weight = 'normal'
    this.size = '20'
    this.ctx = ctx
    this.canvas = canvas

    this.recurse(tokens)
  }

  recurse(root) {
    if (root instanceof Element) {
      this.analyzeToken(root)

      for (const child of root.children) {
        this.recurse(child)
      }
    } else {
      this.analyzeToken(root)
    }
  }

  word(text) {
    this.ctx.font = `${this.weight} ${this.style} ${this.size}px Arial`
    const metrics = this.ctx.measureText('M')
    const lineHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent

    for (const character of text) {
      if (character === '\n') {
        this.cursor_x = HSTEP
        this.cursor_y += lineHeight
        continue
      }

      this.display_list.push({x: this.cursor_x, y: this.cursor_y, character, style: this.style, weight: this.weight, size: this.size})

      const charWidth = this.ctx.measureText(character).width
      this.cursor_x += charWidth

      if(this.cursor_x >= this.canvas.width - HSTEP) {
        this.cursor_x = HSTEP
        this.cursor_y += lineHeight
      }
    }
  }

  analyzeToken(token) {
    if (token instanceof Text) {
      this.word(token.text)
    } else {
      const styleSpecification = token.analyzeTag()
      Object.assign(this, styleSpecification)
    }
  }
}

class Browser {
  constructor(canvas, ctx, HttpClient) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.httpClientInstance = new HttpClient('https://browser.engineering/')
    this.display_list = []
    this.scrollPosition = 0
  }

  createText(x, y, text, color = 'black', style='', weight='', size = '20') {
    this.ctx.font = `${weight} ${style} ${size}px Arial`
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  // show(body) {
  //   let inTag = false

  //   for (const character of body) {
  //     if (character === "<") {
  //       inTag = true
  //     }
  //     else if (character === ">") {
  //       inTag = false
  //     } else if (!inTag) {
  //       process.stdout.write(character)
  //     }
  //   }
  // }

  // lex(body) {
  //   let inTag = false
  //   let buffer = ''
  //   let out = []

  //   for (const letter of body) {
  //     if (letter === "<") {
  //       inTag = true
  //       if (buffer) out.push(new Text(buffer))
  //       buffer = ""
  //     }
  //     else if (letter === ">") {
  //       inTag = false
  //       out.push(new Element(buffer))
  //       buffer = ''
  //     } else {
  //       buffer += letter
  //     }
  //   }

  //   if (!inTag && buffer) {
  //     out.push(new Text(buffer))
  //   }

  //   return out
  // }

  draw() {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.display_list.forEach(({x, y, character, style, weight, size}) => {
      if (y > this.scrollPosition + window.innerHeight) return
      if (y + VSTEP < this.scrollPosition) return

      this.createText(x, y - this.scrollPosition, character, 'black', style, weight, size)
    })
  }

  scrollPage(direction) {

    if(direction == 'pageDown') {
      if (this.scrollPosition + this.canvas.height <= this.display_list[this.display_list.length - 1].y) {
        this.scrollPosition += VSTEP
        this.draw()
      }
    } else {
      if (this.scrollPosition - VSTEP >= 0) {
        this.scrollPosition -= VSTEP
        this.draw()
      }
    }
  }

  async load() {
    const result = await this.httpClientInstance.request()
    // const tagOrTextToken = this.lex(result.body)
    const parser = new HTMLParser(result.body)

    parser.printTree(parser.parse())

    const root = parser.parse()
    this.display_list = new Layout(root, this.ctx, this.canvas).display_list

    this.draw()
  }
}

const browser = new Browser(canvas, ctx, HttpClient);

window.addEventListener('keydown', (event) => {
  if(event.key == 'ArrowDown') {
    browser.scrollPage('pageDown')
  } else if (event.key === 'ArrowUp') {
    browser.scrollPage('pageUp')
  }
})

window.addEventListener('wheel', (event) => {
  if(event.deltaY > 0) {
    browser.scrollPage('pageDown')
  } else if (event.deltaY < 0) {
    browser.scrollPage('pageUp')
  }
})

async function draw() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '20px Arial';

  await browser.load()
}

draw();