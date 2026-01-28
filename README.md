# Meneghini Browser

A learning journey through browser engineering

## About This Project

This project is a hands-on exploration of the excellent book [Web Browser Engineering](https://browser.engineering/) by Pavel Panchekha and Chris Harrelson. While the book uses Python for its examples, I'm adapting the concepts and code to JavaScript as a way to deepen my understanding of how browsers actually work.

## Philosophy

**This is a learning project, not a production browser.**

The goal here isn't to write the most performant or feature-complete code. it's to absorb the concepts from the book and understand the fundamental mechanics of web browsers. That being said, don't expect design patterns, SOLID applications, or high-performance functions.

## Architecture

I'm using Electron as the rendering layer to handle the low-level graphics and windowing, but everything else—HTML parsing, layout calculations, rendering logic is implemented from scratch following the book's approach. Electron gives us a canvas to draw on, but the browser engine itself is custom-built.

## ⚠️ Security Warning

**DO NOT use this as a real web browser for browsing the internet.**

This browser is intentionally simplified for educational purposes and lacks many security features that production browsers have. As the book's authors themselves note, there are numerous security considerations we're not covering. This is a learning tool, not a replacement for well consolidated browsers.

## Getting Started

```bash
npm install

npm start
```

## Project Structure

```
src/
  ├── core/
  │   └── BrowserEngine.js    # Main browser rendering engine
  ├── network/
  │   └── SimpleHttpClient.js # HTTP/HTTPS request handling
  ├── constants/
  │   ├── HEAD_TAGS.js        # HTML head tag definitions
  │   └── SELF_CLOSING_TAGS.js # Self-closing tag definitions
  └── index.html              # Main application entry point
```

## Learning Resources

- [Web Browser Engineering](https://browser.engineering/) - The book this project follows

## License

This is an educational project. Feel free to use it for learning purposes.

