const cors_url = 'https://corsproxy.io/?'
const page_url = 'https://wikipedia.com/'

// function to fetch raw html
const fetchData = async url => {
	try {
		const response = await fetch(cors_url + encodeURIComponent(url))
		if (!response.ok) throw new Error(`status: ${response.status}`)
		return await response.text()
	} catch (error) {
		console.error('Fetch failed:', error.message)
	}
}

async function extract_tags() {
	const raw_html = await fetchData(page_url)

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
	console.log(tags_map)
	return tags_map
}

extract_tags()
