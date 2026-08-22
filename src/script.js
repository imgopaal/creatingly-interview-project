// links ----
// const cors_url = 'https://corsproxy.io/?'

// elements ----
const url_input = document.getElementById('url-input')
const fetch_url_button = document.getElementById('fetch-url-button')
const error_msg = document.getElementById('error-msg')
const tags_list = document.getElementById('tags-list')

//  functions ----
const url_validator = string => {
	try {
		const url = new URL(string)
		return url.protocol === 'https:' || url.protocol === 'http:'
	} catch {
		return false
	}
}

function setError(msg = '') {
	if (error_msg) {
		error_msg.textContent = msg
		error_msg.style.display = msg ? 'block' : 'none' // force visibility
		url_input.setAttribute('aria-invalid', msg ? 'true' : 'false')
		fetch_url_button.isDi
	}
}

function setLoading(isLoading) {
	fetch_url_button.disabled = isLoading
	fetch_url_button.textContent = isLoading ? 'Loading...' : 'Fetch'
	url_input.disabled = isLoading
	fetch_url_button.style.cursor = isLoading ? 'not-allowed' : 'pointer'
}

function updateButtonState() {
	const hasValue = url_input.value.trim().length > 0
	fetch_url_button.disabled = !hasValue
}

// function to fetch raw html
const fetchData = async url => {
	try {
		const response = await fetch(url)
		if (!response.ok) throw new Error(`status: ${response.status}`)
		return await response.text()
	} catch (error) {
		console.error('Fetch failed:', error.message)
	}
}

// render tags in result section

const render_tags = tags => {
	// first clear previous tags list
	clear_tags_list()
	if (error_msg.textContent === '') {
		const sorted_tags = Object.entries(tags).sort(([, countA], [, countB]) => countB - countA)
		for (let i = 0; i < sorted_tags.length; i++) {
			const tag = sorted_tags[i]
			// list item
			const new_list_item = document.createElement('li')
			// tag name section
			const tag_name = document.createElement('div')
			// tag numbers section
			const number_of_tags = document.createElement('div')

			tag_name.textContent = tag[0]
			number_of_tags.textContent = tag[1]

			new_list_item.appendChild(tag_name)
			new_list_item.appendChild(number_of_tags)

			tags_list.appendChild(new_list_item)
		}
	}
}

// empty tags list

const clear_tags_list = () => {
	tags_list.innerHTML = ''
}

async function extract_tags() {
	clear_tags_list()
	const target_url = url_input.value.trim()
	// validations
	setError('')

	if (!target_url) {
		return setError('Please enter a URL')
	}
	if (!url_validator(target_url)) {
		return setError('Please enter a valid URL starting with https://')
	}

	try {
		setLoading(true)

		const raw_html = await fetchData(target_url)
		if (!raw_html) throw new Error('empty response, something went wrong')
		setLoading(false)

		// we got raw_html but as string,
		// but we need to convert it to DOM tree to extract tags

		const parser = new DOMParser()
		const dom_tree = parser.parseFromString(raw_html, 'text/html')

		let tags_map = {}
		let all_tags = dom_tree.getElementsByTagName('*')
		for (let i = 0; i < all_tags.length; i++) {
			let tag = all_tags[i].tagName.toLowerCase()
			if (tags_map[tag]) {
				tags_map[tag]++
			} else {
				tags_map[tag] = 1
			}
		}
		render_tags(tags_map)
	} catch (err) {
		console.log(err)
		setError(err.message)
	} finally {
		setLoading(false)
	}
}

// event handlers ----
url_input.addEventListener('input', () => {
	setError('')
	updateButtonState()
})

fetch_url_button?.addEventListener('click', extract_tags)

// start
updateButtonState()
