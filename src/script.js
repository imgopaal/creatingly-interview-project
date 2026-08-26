// elements ----
const url_input = document.getElementById('url-input')
const fetch_url_button = document.getElementById('fetch-url-button')
const error_msg = document.getElementById('error-msg')
const viewport = document.getElementById('viewport')
const spacer = document.getElementById('spacer')
const tags_list = document.getElementById('tags-list')
const filter_input = document.getElementById('filter-input')
const filter_input_wrapper = document.getElementById('filter-input-wrapper')

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
	const response = await fetch(url)
	if (!response.ok) throw new Error(`status: ${response.status}`)
	return await response.text()
}

// virtual scrolling functionality

// constants
const row_height = 54 // px
const buffer = 3
let sorted_tags = []

// filtered tags from search input
const filter_sorted_tags = () =>
	sorted_tags.filter(([tag_name, tag_freq]) => {
		return tag_name.includes(filter_input.value.trim().toLowerCase()) ? true : false
	})

let current_tags = filter_sorted_tags()

// set fake height to spacer

const height_faker = () => {
	spacer.style.height = `${current_tags.length * row_height}px`
}

// analyse data form viewport

const analyse_ui = () => {
	const no_of_rows = Math.ceil(viewport.clientHeight / row_height)
	const start_index = Math.floor(viewport.scrollTop / row_height)

	const start_index_buffer = Math.max(start_index - buffer, 0)
	const end_index_buffer = Math.min(start_index + no_of_rows + buffer, current_tags.length - 1)
	return { no_of_rows, start_index, start_index_buffer, end_index_buffer }
}

const create_row = () => {
	const li = document.createElement('li')
	const tag_name = document.createElement('div')
	const tag_freq = document.createElement('div')
	li.appendChild(tag_name)
	li.appendChild(tag_freq)
	return li
}

// create fixed amount of rows
const pool_size = Math.ceil(viewport.clientHeight / row_height + buffer * 2)
const row_pool = []
for (let i = 0; i < pool_size; i++) {
	const li = create_row()
	tags_list.appendChild(li)
	row_pool.push(li)
}

const repaint_ui = () => {
	// we have to hide all other, show only which match with the filtered ones
	for (let i = 0; i < row_pool.length; i++) {
		row_pool[i].style.top = '-9999px'
	}
	const { start_index_buffer, end_index_buffer } = analyse_ui()
	for (let i = start_index_buffer; i <= end_index_buffer; i++) {
		let pool_index = i % row_pool.length
		let node = row_pool[pool_index]
		let [tag_name, tag_freq] = current_tags[i]

		node.children[0].textContent = tag_name
		node.children[1].textContent = tag_freq

		node.style.top = `${i * row_height}px`
	}
}

// reset list

const clear_tags_list = () => {
	viewport.scrollTop = 0
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
		sorted_tags = Object.entries(tags_map).sort(([, countA], [, countB]) => countB - countA)
		current_tags = filter_sorted_tags()
		filter_input_wrapper.classList.toggle('visible', sorted_tags.length > 0)
		height_faker()
		repaint_ui()
	} catch (err) {
		console.log(err)
		setError(err.message === 'Failed to fetch' ? 'Could not reach that URL — check it and try again.' : err.message)
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
viewport.addEventListener('scroll', repaint_ui)
filter_input.addEventListener('input', e => {
	current_tags = filter_sorted_tags()
	height_faker()
	repaint_ui()
})

// start
updateButtonState()
