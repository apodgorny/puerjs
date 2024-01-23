import StringMethods from './class.StringMethods.js'


export default class Html {

	static element(name, attrs, events, html) {
		const element = document.createElement(name)
		for (const key in attrs) {
			element.setAttribute(key, attrs[key])
		}
		for (const key in events) {
			element.addEventListener(key, events[key], false)
		}
		if (html) {
			element.innerHTML = html
		}
		return element
	}

	static load(url, onload, onerror) {
		const ext  = StringMethods.ext(url)
		let attrs  = {}
		let events = {}
		let name   = ''

		if (onload)  { events['load']  = onload  }
		if (onerror) { events['error'] = onerror }

		switch (ext) {
			case 'js':
				name = 'script'
				attrs = { src: url }
				document.head.appendChild(Html.element(name, attrs, events))
				break
			case 'css':
				name = 'link'
				attrs = { type: 'text/css', rel: 'stylesheet', href: url}
				document.head.appendChild(Html.element(name, attrs, events))
				break
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'webp':
			case 'gif':
			default:
				console.log('not implemented')
				return null
		}
	}
}